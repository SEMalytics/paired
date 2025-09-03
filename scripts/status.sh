#!/bin/bash
# PAIRED System Status Check
# Shows comprehensive system status including bridge, agents, and health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔍 PAIRED System Status${NC}"
echo "========================"
echo ""

# Check bridge status via WebSocket
check_bridge_websocket() {
    local ws_response=$(cd ~/.paired && node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7890');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'STATUS_CHECK',
        instanceId: 'status-check',
        timestamp: Date.now()
    }));
});

ws.on('message', (data) => {
    try {
        const response = JSON.parse(data);
        console.log(JSON.stringify(response));
    } catch (e) {
        console.log('{}');
    }
    ws.close();
    process.exit(0);
});

ws.on('error', () => {
    console.log('{}');
    process.exit(1);
});

setTimeout(() => {
    console.log('{}');
    ws.close();
    process.exit(1);
}, 3000);
" 2>/dev/null || echo "{}")

    local team_active=$(echo "$ws_response" | grep -o '"teamAgentsActive":[0-9]*' | cut -d':' -f2 || echo "0")
    
    if [ "$team_active" -gt 0 ]; then
        echo -e "${GREEN}✅ Bridge Service: Active (WebSocket Port 7890)${NC}"
        echo -e "${GREEN}✅ Team Agents: $team_active/7 Active${NC}"
        return 0
    else
        echo -e "${RED}❌ Bridge Service: Not responding${NC}"
        return 1
    fi
}

# Check individual agent status
check_agents() {
    echo -e "${BLUE}🤖 Individual Agent Status:${NC}"
    local agents=("alex" "sherlock" "edison" "leonardo" "maya" "vince" "marie")
    local agent_icons=("👑" "🕵️" "⚡" "🏛️" "🎨" "🏈" "🔬")
    
    for i in "${!agents[@]}"; do
        local agent_id="${agents[$i]}"
        local icon="${agent_icons[$i]}"
        
        # Check if agent is active via WebSocket
        local agent_status=$(echo "$ws_response" | grep -o "\"${agent_id}Active\":true" || echo "")
        if [ -n "$agent_status" ]; then
            echo -e "  ${GREEN}✅ $icon $agent_id${NC} - Active"
        else
            echo -e "  ${YELLOW}⚠️ $icon $agent_id${NC} - Inactive"
        fi
    done
    echo ""
}

# Check memory system
check_memory_system() {
    echo -e "${BLUE}🧠 Memory System:${NC}"
    if [ -d "$HOME/.paired/memory" ]; then
        local memory_files=$(find "$HOME/.paired/memory" -name "*.json" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✅ Memory Directory: Present${NC}"
        echo -e "  ${CYAN}📁 Memory Files: $memory_files${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Memory Directory: Not found${NC}"
    fi
    echo ""
}

# Check project configuration
check_project_config() {
    echo -e "${BLUE}📋 Project Configuration:${NC}"
    if [ -f ".pairedrules" ]; then
        echo -e "  ${GREEN}✅ .pairedrules: Present${NC}"
    else
        echo -e "  ${YELLOW}⚠️ .pairedrules: Missing${NC}"
    fi
    
    if [ -d ".paired" ]; then
        echo -e "  ${GREEN}✅ .paired directory: Present${NC}"
    else
        echo -e "  ${YELLOW}⚠️ .paired directory: Missing${NC}"
    fi
    echo ""
}

# Main status check
echo -e "${CYAN}Checking PAIRED system components...${NC}"
echo ""

check_bridge_websocket
check_agents
check_memory_system
check_project_config

echo -e "${BLUE}💡 Tip: Use 'paired-monitor' for real-time monitoring${NC}"
echo -e "${BLUE}💡 Tip: Use 'paired-doctor' for detailed diagnostics${NC}"
