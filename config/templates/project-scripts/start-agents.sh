#!/bin/bash
#
# PAIRED Agent Startup Script
# 
# Starts all PAIRED agents as persistent background processes.
# Agents remain active from startup to shutdown.
#
# Usage:
#   ./start-agents.sh              - Start all agents
#   ./start-agents.sh --single     - Start agents in single process mode
#   ./start-agents.sh --stop       - Stop all running agents
#   ./start-agents.sh --status     - Check agent status

set -e

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

# Find agent_launcher.js - check project first, then global installation
if [ -f "$PAIRED_ROOT/platform/agent_launcher.js" ]; then
    AGENT_LAUNCHER="$PAIRED_ROOT/platform/agent_launcher.js"
elif [ -f "$HOME/.paired/platform/agent_launcher.js" ]; then
    AGENT_LAUNCHER="$HOME/.paired/platform/agent_launcher.js"
elif [ -f "$HOME/.paired/src/agent_launcher.js" ]; then
    AGENT_LAUNCHER="$HOME/.paired/src/agent_launcher.js"
else
    echo -e "${RED}❌ agent_launcher.js not found in project or global installation${NC}"
    echo "💡 Try running 'paired-doctor' to check your installation"
    exit 1
fi
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
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Running
        else
            rm -f "$pid_file"  # Clean up stale PID file
            return 1  # Not running
        fi
    fi
    return 1  # Not running
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
    
    # Start agent in background
    nohup node "$AGENT_LAUNCHER" --agent "$agent_id" > "$log_file" 2>&1 &
    local pid=$!
    
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

# Function to show agent status
show_status() {
    echo -e "${BLUE}📊 PAIRED Agent Status${NC}"
    echo "==================="
    
    local running_count=0
    local total_count=${#AGENTS[@]}
    
    for agent_id in "${AGENTS[@]}"; do
        if is_agent_running "$agent_id"; then
            local pid=$(cat "$PID_DIR/agent_${agent_id}.pid")
            echo -e "${GREEN}✅ $agent_id${NC} - Running (PID: $pid)"
            running_count=$((running_count + 1))
        else
            echo -e "${RED}❌ $agent_id${NC} - Stopped"
        fi
    done
    
    echo ""
    echo -e "${CYAN}Summary: $running_count/$total_count agents running${NC}"
    
    # Check bridge status
    if node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
ws.on('open', () => { ws.close(); process.exit(0); });
ws.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; then
        echo -e "${GREEN}✅ Bridge Service${NC} - Running (Port: $BRIDGE_PORT)"
    else
        echo -e "${RED}❌ Bridge Service${NC} - Not accessible"
    fi
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
    echo -e "${CYAN}📊 Startup Summary: $success_count/$total_count agents started successfully${NC}"
    
    if [ $success_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 All PAIRED agents are now active and ready!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some agents failed to start. Check logs in $LOG_DIR${NC}"
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
        echo -e "${GREEN}✅ All agents started in single process (PID: $pid)${NC}"
        echo -e "${CYAN}📊 7 agents active and ready!${NC}"
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
    "--single")
        start_single_process
        ;;
    "--stop" | "stop")
        stop_all_agents
        ;;
    "--status" | "status")
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
        echo "  $0 --single    - Start all agents in single process"
        echo "  $0 --stop      - Stop all agents"
        echo "  $0 --status    - Show agent status"
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
