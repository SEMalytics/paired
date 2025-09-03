#!/bin/bash
# PAIRED Global Status Check
# Shows global PAIRED installation status and health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🌍 PAIRED Global Status${NC}"
echo "========================"
echo ""

# Check global installation
check_global_installation() {
    echo -e "${BLUE}📦 Global Installation:${NC}"
    
    if [ -d "$HOME/.paired" ]; then
        echo -e "  ${GREEN}✅ Global Directory: $HOME/.paired${NC}"
        
        # Check key directories
        local dirs=("bin" "scripts" "config" "memory" "agents")
        for dir in "${dirs[@]}"; do
            if [ -d "$HOME/.paired/$dir" ]; then
                echo -e "  ${GREEN}✅ $dir/: Present${NC}"
            else
                echo -e "  ${YELLOW}⚠️ $dir/: Missing${NC}"
            fi
        done
    else
        echo -e "  ${RED}❌ Global Directory: Not found${NC}"
        echo -e "  ${YELLOW}💡 Run 'install.sh' to set up PAIRED globally${NC}"
    fi
    echo ""
}

# Check shell configuration
check_shell_config() {
    echo -e "${BLUE}🐚 Shell Configuration:${NC}"
    
    local shell_files=("$HOME/.bashrc" "$HOME/.zshrc")
    local configured=false
    
    for shell_file in "${shell_files[@]}"; do
        if [ -f "$shell_file" ] && grep -q "PAIRED" "$shell_file" 2>/dev/null; then
            echo -e "  ${GREEN}✅ $(basename "$shell_file"): PAIRED configured${NC}"
            configured=true
        fi
    done
    
    if [ "$configured" = false ]; then
        echo -e "  ${YELLOW}⚠️ Shell: PAIRED not configured${NC}"
        echo -e "  ${YELLOW}💡 Run 'install.sh' to configure shell aliases${NC}"
    fi
    echo ""
}

# Check available commands
check_commands() {
    echo -e "${BLUE}⚙️ Available Commands:${NC}"
    
    local commands=("paired" "paired-help" "paired-start" "paired-stop" "paired-monitor" "paired-status")
    
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✅ $cmd: Available${NC}"
        else
            echo -e "  ${YELLOW}⚠️ $cmd: Not in PATH${NC}"
        fi
    done
    echo ""
}

# Check bridge service
check_bridge_service() {
    echo -e "${BLUE}🌉 Bridge Service:${NC}"
    
    # Check if bridge is running
    if pgrep -f "cascade-bridge" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Bridge Process: Running${NC}"
        
        # Test WebSocket connection
        if cd ~/.paired && node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7890');
ws.on('open', () => { ws.close(); process.exit(0); });
ws.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; then
            echo -e "  ${GREEN}✅ WebSocket: Responding (Port 7890)${NC}"
        else
            echo -e "  ${YELLOW}⚠️ WebSocket: Not responding${NC}"
        fi
    else
        echo -e "  ${RED}❌ Bridge Process: Not running${NC}"
        echo -e "  ${YELLOW}💡 Run 'paired-start' to start the bridge${NC}"
    fi
    echo ""
}

# Main execution
check_global_installation
check_shell_config
check_commands
check_bridge_service

echo -e "${BLUE}💡 Tips:${NC}"
echo -e "  ${CYAN}• Use 'paired-status' for project-specific status${NC}"
echo -e "  ${CYAN}• Use 'paired-monitor' for real-time monitoring${NC}"
echo -e "  ${CYAN}• Use 'paired-doctor' for detailed diagnostics${NC}"
