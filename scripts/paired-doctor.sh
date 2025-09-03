#!/bin/bash
# PAIRED Doctor - Comprehensive System Diagnostics
# Diagnoses and reports on all PAIRED system components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🩺 PAIRED System Doctor${NC}"
echo "========================"
echo ""

# Global variable for bridge response
BRIDGE_RESPONSE=""

# Check bridge health via WebSocket
check_bridge_health() {
    echo -e "${BLUE}🌉 Bridge Health Check:${NC}"
    
    BRIDGE_RESPONSE=$(cd ~/.paired 2>/dev/null && node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7890');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'HEALTH_CHECK',
        instanceId: 'doctor-diagnostic',
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

    if [ -n "$BRIDGE_RESPONSE" ] && [ "$BRIDGE_RESPONSE" != "{}" ]; then
        echo -e "  ${GREEN}✅ Bridge communication working${NC}"
        
        local team_active=$(echo "$BRIDGE_RESPONSE" | node -e "try { const data=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(data.agents || 0); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
        if [ -n "$team_active" ] && [ "$team_active" -gt 0 ] 2>/dev/null; then
            echo -e "  ${GREEN}✅ Bridge running on port 7890 with $team_active agents${NC}"
        else
            echo -e "  ${YELLOW}⚠️ Bridge responding but no agents active${NC}"
        fi
    else
        echo -e "  ${RED}❌ Bridge not responding on port 7890${NC}"
        echo -e "  ${YELLOW}💡 Try: paired-start${NC}"
    fi
    echo ""
}

# Check agent health via bridge
check_agent_health() {
    echo -e "${BLUE}🤖 Checking Agent Health...${NC}"
    local agents=("alex" "sherlock" "edison" "leonardo" "maya" "vince" "marie")
    local agent_icons=("👑" "🕵️" "⚡" "🏛️" "🎨" "🏈" "🔬")
    local healthy_count=0
    
    # Get fresh bridge status for agent health
    local bridge_response=$(cd ~/.paired 2>/dev/null && node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7890');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'HEALTH_CHECK',
        instanceId: 'doctor-agent-check',
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

    # Use the global bridge response from check_bridge_health
    local team_active=$(echo "$BRIDGE_RESPONSE" | node -e "try { const data=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(data.agents || 0); } catch(e) { console.log('0'); }" 2>/dev/null || echo "0")
    
    if [ -n "$team_active" ] && [ "$team_active" -gt 0 ] 2>/dev/null; then
        echo -e "  ${GREEN}✅ Bridge reports $team_active/7 agents active${NC}"
        echo -e "  ${GREEN}✅ All agents accessible via unified bridge${NC}"
        healthy_count=$team_active
    else
        echo -e "  ${RED}❌ Bridge not responding or no agents active${NC}"
        for i in "${!agents[@]}"; do
            local agent_id="${agents[$i]}"
            local icon="${agent_icons[$i]}"
            echo -e "  ${RED}❌ $icon $agent_id${NC} - Not active"
        done
    fi
    
    echo -e "${CYAN}Summary: $healthy_count/7 agents healthy${NC}"
    echo ""
}

# Check project setup
check_project_setup() {
    echo -e "${BLUE}📁 Checking Project Setup...${NC}"
    
    if [ -f ".cascade_config.js" ]; then
        echo -e "  ${GREEN}✅ CASCADE config present${NC}"
    else
        echo -e "  ${YELLOW}⚠️ CASCADE config missing${NC}"
    fi
    
    if [ -f ".pairedrules" ]; then
        echo -e "  ${GREEN}✅ Windsurf rules present${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Windsurf rules missing${NC}"
    fi
    
    if [ -d ".paired" ]; then
        echo -e "  ${GREEN}✅ Project PAIRED directory present${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Project PAIRED directory missing${NC}"
        echo -e "  ${YELLOW}💡 Try: paired-init${NC}"
    fi
    echo ""
}

# Check memory system health
check_memory_health() {
    echo -e "${BLUE}🧠 Memory System Health:${NC}"
    
    if [ -d ".paired/memory" ]; then
        local memory_files=$(find ".paired/memory" -name "*_memory.json" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✅ Local memory directory present${NC}"
        echo -e "  ${CYAN}📁 Agent memory files: $memory_files${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Local memory directory missing${NC}"
    fi
    
    if [ -d "$HOME/.paired/memory" ]; then
        local global_memory_files=$(find "$HOME/.paired/memory" -name "*.json" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✅ Global memory directory present${NC}"
        echo -e "  ${CYAN}📁 Global memory files: $global_memory_files${NC}"
    else
        echo -e "  ${YELLOW}⚠️ Global memory directory missing${NC}"
    fi
    echo ""
}

# Run diagnostics
echo -e "${CYAN}Running comprehensive diagnostics...${NC}"
echo ""

check_bridge_health
check_agent_health  
check_project_setup
check_memory_health

echo -e "${BLUE}📋 Diagnostic Summary${NC}"
echo "===================="

# Count issues
issues=0
if ! pgrep -f "cascade-bridge" >/dev/null 2>&1; then
    issues=$((issues + 1))
fi

if [ ! -f ".cascade_config.js" ]; then
    issues=$((issues + 1))
fi

if [ ! -d ".paired" ]; then
    issues=$((issues + 1))
fi

if [ "$issues" -eq 0 ]; then
    echo -e "${GREEN}✅ All systems healthy${NC}"
    echo -e "${GREEN}🎉 PAIRED is ready for use!${NC}"
else
    echo -e "${YELLOW}⚠️ $issues issues detected${NC}"
    echo -e "${YELLOW}💡 Review diagnostics above for details${NC}"
fi
