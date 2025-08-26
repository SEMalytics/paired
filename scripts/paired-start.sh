#!/bin/bash
#
# PAIRED Simple Startup Script
# 
# Starts the minimal bridge + agent setup for PAIRED repository
# Can be auto-triggered when opening Windsurf in a PAIRED directory
#
# Usage:
#   ./scripts/paired-start.sh              - Start bridge and agents
#   ./scripts/paired-start.sh --status     - Check status only
#   ./scripts/paired-start.sh --stop       - Stop all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"
BRIDGE_SCRIPT="$SCRIPT_DIR/cascade_bridge_unified_takeover.js"
AGENT_SCRIPT="$SCRIPT_DIR/start-agents.sh"

echo -e "${BLUE}🌊 PAIRED Simple Startup${NC}"
echo "========================="

# Function to check if bridge is running
is_bridge_running() {
    curl -s http://localhost:7890/health > /dev/null 2>&1
    return $?
}

# Function to check status
check_status() {
    echo -e "${CYAN}📊 PAIRED Status Check${NC}"
    echo "---------------------"
    
    local all_healthy=true
    
    if is_bridge_running; then
        echo -e "✅ Bridge: ${GREEN}Running${NC} (port 7890)"
        
        # Get bridge health details
        HEALTH=$(curl -s http://localhost:7890/health 2>/dev/null || echo '{}')
        ALEX_ACTIVE=$(echo "$HEALTH" | grep -o '"alexActive":[^,]*' | cut -d':' -f2 || echo "unknown")
        TEAM_AGENTS=$(echo "$HEALTH" | grep -o '"teamAgentsActive":[^,]*' | cut -d':' -f2 || echo "unknown")
        
        echo -e "   👑 Alex: ${GREEN}Active${NC} ($ALEX_ACTIVE)"
        echo -e "   🤖 Team Agents: ${GREEN}$TEAM_AGENTS active${NC}"
        
        # Test bridge relay chain
        echo -e "\n${CYAN}🔗 Testing Relay Chain${NC}"
        RELAY_TEST=$(curl -s http://localhost:7890/test-relay 2>/dev/null || echo "failed")
        if [[ "$RELAY_TEST" == *"success"* ]]; then
            echo -e "   ✅ Relay chain: ${GREEN}Operational${NC}"
        else
            echo -e "   ❌ Relay chain: ${RED}Failed${NC}"
            all_healthy=false
        fi
    else
        echo -e "❌ Bridge: ${RED}Not Running${NC}"
        all_healthy=false
    fi
    
    # Check memory system
    echo -e "\n${CYAN}🧠 Memory System${NC}"
    if [ -d "$PAIRED_ROOT/.paired/memory" ]; then
        MEMORY_FILES=$(find "$PAIRED_ROOT/.paired/memory" -type f -name "*.json" 2>/dev/null | wc -l)
        MEMORY_SIZE=$(du -sh "$PAIRED_ROOT/.paired/memory" 2>/dev/null | cut -f1)
        echo -e "   📚 Memory files: ${GREEN}$MEMORY_FILES${NC}"
        echo -e "   💾 Total size: ${GREEN}$MEMORY_SIZE${NC}"
        
        # Check if memory is accessible
        if [ -r "$PAIRED_ROOT/.paired/memory" ]; then
            echo -e "   ✅ Memory access: ${GREEN}OK${NC}"
        else
            echo -e "   ❌ Memory access: ${RED}Failed${NC}"
            all_healthy=false
        fi
    else
        echo -e "   ⚠️  Memory system: ${YELLOW}Not initialized${NC}"
    fi
    
    # Check individual agent ports
    echo -e "\n${CYAN}🔌 Agent Port Status${NC}"
    
    # Check agent ports (compatible with older bash)
    for port_check in "Sherlock:7891" "Edison:7892" "Leonardo:7893" "Maya:7894" "Vince:7895" "Marie:7896"; do
        agent=$(echo $port_check | cut -d: -f1)
        port=$(echo $port_check | cut -d: -f2)
        if nc -z localhost $port 2>/dev/null; then
            echo -e "   ✅ $agent (port $port): ${GREEN}Open${NC}"
        else
            echo -e "   ⚠️  $agent (port $port): ${YELLOW}Not responding${NC}"
        fi
    done
    
    # Check agent processes
    echo ""
    if command -v "$AGENT_SCRIPT" >/dev/null 2>&1; then
        "$AGENT_SCRIPT" --status 2>/dev/null || echo -e "⚠️  Agent status check failed"
    else
        echo -e "⚠️  Agent status script not found"
    fi
    
    # Overall health status
    echo -e "\n${CYAN}📋 Overall Health${NC}"
    if $all_healthy; then
        echo -e "   ${GREEN}✅ All systems operational${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️  Some issues detected${NC}"
        return 1
    fi
}

# Function to start services
start_services() {
    echo -e "${CYAN}🚀 Starting PAIRED Services${NC}"
    echo "----------------------------"
    
    # Check if already running
    if is_bridge_running; then
        echo -e "✅ Bridge already running on port 7890"
    else
        echo -e "🌉 Starting unified bridge..."
        cd "$PAIRED_ROOT"
        node "$BRIDGE_SCRIPT" > /dev/null 2>&1 &
        
        # Wait for bridge to start
        for i in {1..10}; do
            if is_bridge_running; then
                echo -e "✅ Bridge started successfully"
                break
            fi
            sleep 1
        done
        
        if ! is_bridge_running; then
            echo -e "${RED}❌ Bridge failed to start${NC}"
            exit 1
        fi
    fi
    
    # Start agents
    echo -e "🤖 Starting agents..."
    if [ -f "$AGENT_SCRIPT" ]; then
        "$AGENT_SCRIPT" > /dev/null 2>&1
        echo -e "✅ Agents started"
    else
        echo -e "${RED}❌ Agent startup script not found${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 PAIRED is ready!${NC}"
    echo -e "Bridge: http://localhost:7890"
    echo -e "Alex and team agents are active and ready to help."
}

# Function to stop services
stop_services() {
    echo -e "${CYAN}🛑 Stopping PAIRED Services${NC}"
    echo "---------------------------"
    
    # Stop agents first
    if [ -f "$AGENT_SCRIPT" ]; then
        "$AGENT_SCRIPT" --stop
    fi
    
    # Stop bridge
    pkill -f "cascade_bridge_unified_takeover" || echo "Bridge not running"
    
    echo -e "${GREEN}✅ PAIRED services stopped${NC}"
}

# Main execution
case "${1:-start}" in
    "start")
        start_services
        ;;
    "status")
        check_status
        ;;
    "stop")
        stop_services
        ;;
    "--help"|"-h")
        echo "Usage: $0 [start|status|stop]"
        echo "  start   - Start bridge and agents (default)"
        echo "  status  - Check service status"
        echo "  stop    - Stop all services"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
