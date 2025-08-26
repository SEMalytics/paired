#!/bin/bash
# PAIRED Auto-Start Script
# Smart startup: Connect if running, start if stopped
# Uses seamless startup handler to hide technical details

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"
PID_DIR="$HOME/.paired/pids"

# Check if any agents are running
check_agents_status() {
    local running_count=0
    local agents=("alex" "sherlock" "edison" "leonardo" "maya" "vince" "marie")
    
    for agent in "${agents[@]}"; do
        local pid_file="$PID_DIR/agent_${agent}.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                running_count=$((running_count + 1))
            fi
        fi
    done
    
    echo $running_count
}

# Main logic
echo -e "${BLUE}🚀 Starting PAIRED Agent Bridge...${NC}"

# Ensure bridge is running first (silent background operation)
if ! pgrep -f "cascade_bridge_unified_takeover.js" > /dev/null; then
    nohup node "$SCRIPT_DIR/cascade_bridge_unified_takeover.js" > "$HOME/.paired/logs/bridge.log" 2>&1 &
    sleep 2
fi

running_agents=$(check_agents_status)

if [ "$running_agents" -eq 7 ]; then
    echo -e "${GREEN}✅ PAIRED agents ready${NC}"
    # Agents are running, just verify connection silently
    "$SCRIPT_DIR/start-agents.sh" --status > /dev/null 2>&1
elif [ "$running_agents" -gt 0 ]; then
    echo -e "${YELLOW}⚡ Auto-starting PAIRED agents... One moment${NC}"
    # Some agents running, restart all for clean state
    "$SCRIPT_DIR/start-agents.sh" --stop
    sleep 2
    "$SCRIPT_DIR/start-agents.sh"
else
    echo -e "${YELLOW}⚡ Auto-starting PAIRED agents... One moment${NC}"
    # No agents running, start them silently
    "$SCRIPT_DIR/start-agents.sh" > /dev/null 2>&1
fi

echo -e "${GREEN}✅ PAIRED Bridge operational${NC}"

echo -e "${GREEN}🎉 PAIRED agents ready for collaboration!${NC}"

# Check if this is first-time user and show introduction
if [ -f "$SCRIPT_DIR/windsurf-agent-introduction.js" ]; then
    node "$SCRIPT_DIR/windsurf-agent-introduction.js"
fi

# Run team project assessment for any project directory
if [ -f "$SCRIPT_DIR/team-project-assessment.js" ]; then
    echo -e "${BLUE}🔍 Running team project assessment...${NC}"
    node "$SCRIPT_DIR/team-project-assessment.js"
fi
