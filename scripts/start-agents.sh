#!/bin/bash
#
# PAIRED Agent Startup Script
# 
# Starts all PAIRED agents as persistent background processes.
# Agents remain active from startup to shutdown.
#
# Usage:
#   ./start-agents.sh              - Start all agents
#   ./start-agents.sh --auto       - Auto-start (connect if running, start if stopped)
#   ./start-agents.sh --single     - Start agents in single process mode
#   ./start-agents.sh --stop       - Stop all running agents
#   ./start-agents.sh --status     - Check agent status

set -e

# Clean up any existing PAIRED agent processes
echo "🧹 Cleaning up existing agent processes..."
pkill -f "agent_launcher.js --agent" 2>/dev/null || true
sleep 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Bridge configuration
BRIDGE_PORT="${BRIDGE_PORT:-7890}" # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"
AGENT_LAUNCHER="$PAIRED_ROOT/platform/agent_launcher.js"
PID_DIR="$HOME/.paired/pids"
LOG_DIR="$HOME/.paired/logs"

# Ensure directories exist
mkdir -p "$PID_DIR" "$LOG_DIR"

# Agent list
AGENTS=("alex" "sherlock" "edison" "leonardo" "maya" "vince" "marie")

echo -e "${BLUE}🌊 PAIRED Agent Management${NC}"
echo "========================="

# Function to check if agent is running
is_agent_running() {
    local agent_id="$1"
    local pid_file="$PID_DIR/agent_${agent_id}.pid"
    
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    local pid=$(cat "$pid_file")
    if ! ps -p "$pid" > /dev/null 2>&1; then
        rm -f "$pid_file"
        return 1
    fi
    
    return 0
}

# Function to perform comprehensive agent health check
check_agent_health() {
    local agent_id="$1"
    local detailed="${2:-false}"
    
    # Basic process check
    if ! is_agent_running "$agent_id"; then
        if [ "$detailed" = "true" ]; then
            echo -e "${RED}❌ $agent_id${NC} - Process not running"
        fi
        return 1
    fi
    
    # Advanced health check via bridge
    local health_response
    health_response=$(node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
ws.on('open', () => {
  ws.send(JSON.stringify({type: 'AGENT_HEALTH', agentId: '$agent_id'}));
});
ws.on('message', (data) => {
  console.log(data);
  ws.close();
});
ws.on('error', () => { console.log('{}'); });
setTimeout(() => { ws.close(); }, 3000);
" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$health_response" | grep -q '"status":"healthy"'; then
        if [ "$detailed" = "true" ]; then
            local pid=$(cat "$PID_DIR/agent_${agent_id}.pid")
            echo -e "${GREEN}✅ $agent_id${NC} - Healthy (PID: $pid)"
        fi
        return 0
    elif [ $? -eq 0 ] && echo "$health_response" | grep -q '"status":"degraded"'; then
        if [ "$detailed" = "true" ]; then
            local pid=$(cat "$PID_DIR/agent_${agent_id}.pid")
            echo -e "${YELLOW}⚠️  $agent_id${NC} - Degraded (PID: $pid)"
        fi
        return 2
    else
        if [ "$detailed" = "true" ]; then
            local pid=$(cat "$PID_DIR/agent_${agent_id}.pid")
            echo -e "${RED}❌ $agent_id${NC} - Unresponsive (PID: $pid)"
        fi
        return 1
    fi
}

# Function to start a single agent
start_agent() {
    local agent_id="$1"
    local pid_file="$PID_DIR/agent_${agent_id}.pid"
    local log_file="$LOG_DIR/agent_${agent_id}.log"
    
    if is_agent_running "$agent_id"; then
        echo -e "${YELLOW}⚠️  Agent $agent_id is already running${NC}"
        return 0
    fi
    
    echo -e "${CYAN}🚀 Starting agent: $agent_id${NC}"
    
    # Start agent using cross-platform Node.js process spawning (replaces setsid for macOS compatibility)
    # Spawn agent process with detachment for cross-platform process isolation
    node "$AGENT_LAUNCHER" --agent "$agent_id" > "$log_file" 2>&1 &
    local pid=$!
    
    # Detach process for cross-platform compatibility (replaces setsid)
    disown 2>/dev/null || true
    
    # Save PID
    echo "$pid" > "$pid_file"
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if is_agent_running "$agent_id"; then
        echo -e "${GREEN}✅ Agent $agent_id started (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start agent $agent_id${NC}"
        rm -f "$pid_file"
        return 1
    fi
}

# Function to stop a single agent
stop_agent() {
    local agent_id="$1"
    local pid_file="$PID_DIR/agent_${agent_id}.pid"
    
    if ! is_agent_running "$agent_id"; then
        echo -e "${YELLOW}⚠️  Agent $agent_id is not running${NC}"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    echo -e "${CYAN}🛑 Stopping agent: $agent_id (PID: $pid)${NC}"
    
    # Send SIGTERM for graceful shutdown
    kill -TERM "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Force killing agent $agent_id${NC}"
        kill -KILL "$pid" 2>/dev/null || true
    fi
    
    rm -f "$pid_file"
    echo -e "${GREEN}✅ Agent $agent_id stopped${NC}"
}

# Function to count running agents
count_running_agents() {
    local running_count=0
    for agent_id in "${AGENTS[@]}"; do
        if is_agent_running "$agent_id"; then
            running_count=$((running_count + 1))
        fi
    done
    echo $running_count
}

# Function to start bridge
start_bridge() {
    local pid_file="$HOME/.paired/pids/bridge.pid"
    local log_file="$LOG_DIR/bridge.log"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Bridge is already running${NC}"
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    
    echo -e "${CYAN}🌉 Starting CASCADE bridge...${NC}"
    
    nohup node "$SCRIPT_DIR/../lib/bridge/cascade-bridge.js" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$pid_file"
    
    sleep 3
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Bridge started (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start bridge${NC}"
        rm -f "$pid_file"
        return 1
    fi
}

# Function to stop bridge
stop_bridge() {
    local pid_file="$HOME/.paired/pids/bridge.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${CYAN}🛑 Stopping bridge (PID: $pid)${NC}"
            kill -TERM "$pid" 2>/dev/null || true
            
            local count=0
            while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
                sleep 1
                count=$((count + 1))
            done
            
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -KILL "$pid" 2>/dev/null || true
            fi
            
            rm -f "$pid_file"
            echo -e "${GREEN}✅ Bridge stopped${NC}"
        fi
    fi
}

# Function to show agent status
show_status() {
    echo -e "${BLUE}📊 PAIRED Agent Status${NC}"
    echo "==================="
    
    local healthy_count=0
    local degraded_count=0
    local unhealthy_count=0
    local total_count=${#AGENTS[@]}
    
    for agent_id in "${AGENTS[@]}"; do
        check_agent_health "$agent_id" "true"
        local health_status=$?
        
        case $health_status in
            0) healthy_count=$((healthy_count + 1)) ;;
            2) degraded_count=$((degraded_count + 1)) ;;
            *) unhealthy_count=$((unhealthy_count + 1)) ;;
        esac
    done
    
    echo ""
    echo -e "${CYAN}Health Summary:${NC}"
    echo -e "  ${GREEN}Healthy: $healthy_count${NC}"
    echo -e "  ${YELLOW}Degraded: $degraded_count${NC}"
    echo -e "  ${RED}Unhealthy: $unhealthy_count${NC}"
    echo -e "  ${CYAN}Total: $total_count agents${NC}"
    
    # Enhanced bridge status check
    local bridge_response
    bridge_response=$(node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
ws.on('open', () => {
  ws.send(JSON.stringify({type: 'HEALTH_CHECK'}));
});
ws.on('message', (data) => {
  console.log(data);
  ws.close();
});
ws.on('error', () => { console.log('{}'); });
setTimeout(() => { ws.close(); }, 3000);
" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$bridge_response" | grep -q '"status":"healthy"'; then
        echo -e "${GREEN}✅ Bridge Service${NC} - Healthy (Port: 7890)"
    elif [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Bridge Service${NC} - Degraded (Port: 7890)"
    else
        echo -e "${RED}❌ Bridge Service${NC} - Not accessible"
    fi
}

# Function for auto-start (smart startup)
auto_start() {
    echo -e "${BLUE}🚀 PAIRED Auto-Start${NC}"
    echo "==================="
    echo ""
    
    # Count healthy agents instead of just running processes
    local healthy_count=0
    local total_agents=${#AGENTS[@]}
    
    for agent_id in "${AGENTS[@]}"; do
        check_agent_health "$agent_id" "false"
        if [ $? -eq 0 ]; then
            healthy_count=$((healthy_count + 1))
        fi
    done
    
    if [ "$healthy_count" -eq "$total_agents" ]; then
        echo -e "${GREEN}✅ All PAIRED agents healthy and ready${NC}"
        echo -e "${CYAN}🎉 PAIRED agents ready for collaboration!${NC}"
        return 0
    elif [ "$healthy_count" -gt 0 ]; then
        echo -e "${YELLOW}⚡ Partial agents healthy ($healthy_count/$total_agents)${NC}"
        echo -e "${CYAN}🔄 Restarting all agents for clean state...${NC}"
        stop_all_agents
        sleep 2
        start_all_agents
    else
        echo -e "${CYAN}🚀 Starting PAIRED agents...${NC}"
        start_all_agents
    fi
    
    echo ""
    echo -e "${GREEN}🎉 PAIRED agents ready for collaboration!${NC}"
}

# Function to start all agents
start_all_agents() {
    echo -e "${BLUE}🚀 Starting all PAIRED agents...${NC}"
    echo ""
    
    local success_count=0
    local total_count=${#AGENTS[@]}
    
    for agent_id in "${AGENTS[@]}"; do
        if start_agent "$agent_id"; then
            success_count=$((success_count + 1))
        fi
    done
    
    echo ""
    echo -e "${CYAN}📊 Agent Summary: $success_count/$total_count agents started successfully${NC}"
    
    # Start the bridge after agents
    if start_bridge; then
        echo -e "${GREEN}🎉 All PAIRED agents and bridge are now active and ready!${NC}"
    else
        echo -e "${YELLOW}⚠️  Agents started but bridge failed. WebSocket features unavailable.${NC}"
    fi
}

# Function to start agents in single process mode
start_single_process() {
    echo -e "${BLUE}🚀 Starting all agents in single process mode...${NC}"
    
    local pid_file="$PID_DIR/agents_all.pid"
    local log_file="$LOG_DIR/agents_all.log"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Agents are already running in single process mode${NC}"
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    
    # Start all agents in single process
    nohup node "$AGENT_LAUNCHER" --all > "$log_file" 2>&1 &
    local pid=$!
    
    echo "$pid" > "$pid_file"
    
    # Wait a moment to check if it started successfully
    sleep 3
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ All agents started successfully in single process (PID: $pid)${NC}"
        
        # Verify agents are responding
        local healthy_agents=0
        echo -e "${CYAN}🔍 Verifying agent health...${NC}"
        
        for agent_id in "${AGENTS[@]}"; do
            if check_agent_health "$agent_id" "false" > /dev/null 2>&1; then
                healthy_agents=$((healthy_agents + 1))
                echo -e "  ${GREEN}✅ $agent_id${NC} - Healthy"
            else
                echo -e "  ${YELLOW}⏳ $agent_id${NC} - Starting up..."
            fi
        done
        
        echo ""
        echo -e "${CYAN}📊 Health Summary: $healthy_agents/${#AGENTS[@]} agents healthy${NC}"
        
        if [ $healthy_agents -eq ${#AGENTS[@]} ]; then
            echo -e "${GREEN}🎉 All PAIRED agents are healthy and ready!${NC}"
        else
            echo -e "${YELLOW}⚠️  Some agents still initializing. Full startup may take 10-15 seconds.${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to start agents in single process mode${NC}"
        rm -f "$pid_file"
        return 1
    fi
    
}

# Function to stop all agents
stop_all_agents() {
    echo -e "${BLUE}🛑 Stopping all PAIRED agents...${NC}"
    echo ""
    
    # Stop bridge first
    stop_bridge
    
    # Stop single process mode if running
    local single_pid_file="$PID_DIR/agents_all.pid"
    if [ -f "$single_pid_file" ]; then
        local pid=$(cat "$single_pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${CYAN}🛑 Stopping single process agents (PID: $pid)${NC}"
            kill -TERM "$pid" 2>/dev/null || true
            
            # Wait for graceful shutdown
            local count=0
            while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
                sleep 1
                count=$((count + 1))
            done
            
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -KILL "$pid" 2>/dev/null || true
            fi
            
            rm -f "$single_pid_file"
            echo -e "${GREEN}✅ Single process agents stopped${NC}"
        fi
    fi
    
    # Stop individual agents
    for agent_id in "${AGENTS[@]}"; do
        stop_agent "$agent_id"
    done
    
    echo ""
    echo -e "${GREEN}🎉 All PAIRED agents stopped${NC}"
}

# Main execution
case "${1:-start}" in
    "start")
        start_all_agents
        ;;
    "--auto")
        auto_start
        ;;
    "--single")
        start_single_process
        ;;
    "--stop" | "stop")
        stop_all_agents
        ;;
    "--status" | "status")
        show_status
        ;;
    "--health" | "health")
        echo -e "${BLUE}🏥 PAIRED Agent Health Check${NC}"
        echo "=========================="
        echo ""
        show_status
        ;;
    "--restart" | "restart")
        stop_all_agents
        sleep 2
        start_all_agents
        ;;
    "--help" | "-h")
        echo "PAIRED Agent Management Script"
        echo ""
        echo "Usage:"
        echo "  $0 [start]     - Start all agents (default)"
        echo "  $0 --auto      - Auto-start (connect if running, start if stopped)"
        echo "  $0 --single    - Start all agents in single process"
        echo "  $0 --stop      - Stop all agents"
        echo "  $0 --status    - Show agent status"
        echo "  $0 --health    - Comprehensive health check"
        echo "  $0 --restart   - Restart all agents"
        echo "  $0 --help      - Show this help"
        echo ""
        echo "Available agents:"
        echo "  👑 alex      - Strategic Project Manager"
        echo "  🕵️ sherlock  - Master Quality Detective"
        echo "  ⚡ edison    - Master Problem Solver"
        echo "  🏛️ leonardo  - Master System Architect"
        echo "  🎨 maya      - Master of Human Experience"
        echo "  🏈 vince     - Master Team Coach"
        echo "  🔬 marie     - Master Data Scientist"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
