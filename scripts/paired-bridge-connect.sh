#!/bin/bash
# PAIRED Bridge Connection Script
# Unified script for all CASCADE bridge connection scenarios
# Replaces: activate_cascade_complete.sh, auto-connect-bridge.sh, connect_to_cascade.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BRIDGE_PORT="${BRIDGE_PORT:-7890}"
AUTO_MODE=false
SILENT_MODE=false
COMPLETE_ACTIVATION=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --silent)
            SILENT_MODE=true
            shift
            ;;
        --complete)
            COMPLETE_ACTIVATION=true
            shift
            ;;
        --port)
            BRIDGE_PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "PAIRED Bridge Connection Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --auto          Auto-connect mode (no prompts)"
            echo "  --silent        Silent mode (minimal output)"
            echo "  --complete      Complete activation (start bridge + agents)"
            echo "  --port PORT     Bridge port (default: 7890)"
            echo "  -h, --help      Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                    # Interactive project connection"
            echo "  $0 --auto            # Auto-connect current project"
            echo "  $0 --complete        # Full activation (bridge + agents)"
            echo "  $0 --silent --auto   # Silent auto-connect"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    if [[ "$SILENT_MODE" != "true" ]]; then
        echo -e "$1"
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if bridge is running
check_bridge_running() {
    if command -v node >/dev/null 2>&1; then
        node -e "
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
            ws.on('open', () => { console.log('RUNNING'); process.exit(0); });
            ws.on('error', () => { console.log('NOT_RUNNING'); process.exit(1); });
            setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 3000);
        " 2>/dev/null
        return $?
    else
        # Fallback to curl if node not available
        curl -s "http://localhost:$BRIDGE_PORT/health" >/dev/null 2>&1
        return $?
    fi
}

# Start the unified bridge
start_bridge() {
    log "${BLUE}🌉 Starting PAIRED bridge...${NC}"
    
    local bridge_script="$SCRIPT_DIR/cascade_bridge.js"
    if [[ ! -f "$bridge_script" ]]; then
        log "${RED}❌ Bridge script not found: $bridge_script${NC}"
        return 1
    fi
    
    # Start bridge in background
    nohup node "$bridge_script" > "$PAIRED_ROOT/logs/bridge.log" 2>&1 &
    local bridge_pid=$!
    disown 2>/dev/null || true
    
    # Save PID
    echo "$bridge_pid" > "$PAIRED_ROOT/pids/bridge.pid"
    
    # Wait for bridge to start
    local attempts=0
    while [[ $attempts -lt 10 ]]; do
        if check_bridge_running; then
            log "${GREEN}✅ Bridge started successfully (PID: $bridge_pid)${NC}"
            return 0
        fi
        sleep 1
        ((attempts++))
    done
    
    log "${RED}❌ Bridge failed to start within 10 seconds${NC}"
    return 1
}

# Connect current project to bridge
connect_project() {
    local project_name=$(basename "$(pwd)")
    local project_path="$(pwd)"
    
    log "${CYAN}🔗 Connecting project '$project_name' to bridge...${NC}"
    
    # Use WebSocket connection to register project
    if command -v node >/dev/null 2>&1; then
        node -e "
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
            
            ws.on('open', () => {
                const message = {
                    type: 'PROJECT_CONNECT',
                    project: {
                        name: '$project_name',
                        path: '$project_path'
                    },
                    timestamp: new Date().toISOString()
                };
                ws.send(JSON.stringify(message));
            });
            
            ws.on('message', (data) => {
                const response = JSON.parse(data);
                if (response.type === 'PROJECT_CONNECTED') {
                    console.log('✅ Project connected successfully');
                    process.exit(0);
                } else if (response.type === 'ERROR') {
                    console.log('❌ Connection failed:', response.message);
                    process.exit(1);
                }
            });
            
            ws.on('error', (error) => {
                console.log('❌ Connection error:', error.message);
                process.exit(1);
            });
            
            setTimeout(() => {
                console.log('❌ Connection timeout');
                process.exit(1);
            }, 10000);
        " 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            log "${GREEN}✅ Project connected to bridge${NC}"
            return 0
        else
            log "${RED}❌ Failed to connect project to bridge${NC}"
            return 1
        fi
    else
        log "${YELLOW}⚠️ Node.js not available, skipping project registration${NC}"
        return 0
    fi
}

# Start agents (if complete activation requested)
start_agents() {
    log "${BLUE}🚀 Starting PAIRED agents...${NC}"
    
    local start_agents_script="$SCRIPT_DIR/start-agents.sh"
    if [[ ! -f "$start_agents_script" ]]; then
        log "${RED}❌ Start agents script not found: $start_agents_script${NC}"
        return 1
    fi
    
    if [[ "$SILENT_MODE" == "true" ]]; then
        bash "$start_agents_script" >/dev/null 2>&1
    else
        bash "$start_agents_script"
    fi
    
    return $?
}

# Main execution
main() {
    if [[ "$COMPLETE_ACTIVATION" == "true" ]]; then
        log "${BLUE}🚀 PAIRED: Complete system activation${NC}"
        
        # Start bridge if not running
        if ! check_bridge_running; then
            start_bridge || exit 1
        else
            log "${GREEN}✅ Bridge already running${NC}"
        fi
        
        # Start agents
        start_agents || exit 1
        
        # Connect project
        connect_project || exit 1
        
        log "${GREEN}🎉 PAIRED system fully activated${NC}"
        
    else
        log "${BLUE}🌉 PAIRED: Connecting to bridge${NC}"
        
        # Check if bridge is running
        if ! check_bridge_running; then
            if [[ "$AUTO_MODE" == "true" ]]; then
                log "${YELLOW}⚠️ Bridge not running, starting it...${NC}"
                start_bridge || exit 1
            else
                log "${RED}❌ Bridge not running on port $BRIDGE_PORT${NC}"
                log "${YELLOW}💡 Run with --complete to start the full system${NC}"
                exit 1
            fi
        else
            log "${GREEN}✅ Bridge is running${NC}"
        fi
        
        # Connect current project
        connect_project || exit 1
        
        log "${GREEN}✅ Project connected to PAIRED bridge${NC}"
    fi
}

# Ensure required directories exist
mkdir -p "$PAIRED_ROOT/logs" "$PAIRED_ROOT/pids"

# Run main function
main
