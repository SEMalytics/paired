#!/bin/bash
#
# PAIRED Bridge Status and Control
#
# Enhanced script for PAIRED bridge diagnostics, messaging, and control
# Features:
# - Detailed status with connection metrics
# - Message broadcasting to all terminals
# - Direct messaging to specific terminals
# - Fallback to global installation when local files are missing
# - Auto-repair for common installation issues

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Path variables with fallback capability
LOCAL_PAIRED_DIR="$(pwd)/.paired"
GLOBAL_PAIRED_DIR="$HOME/.paired"

# Try to find bridge files with fallback logic
find_bridge_file() {
  local filename="$1"
  local fallback_message="$2"
  
  # Check local project first
  if [ -f "$LOCAL_PAIRED_DIR/platform/$filename" ]; then
    echo "$LOCAL_PAIRED_DIR/platform/$filename"
    return 0
  fi
  
  # Fallback to global installation
  if [ -f "$GLOBAL_PAIRED_DIR/platform/$filename" ]; then
    echo "$GLOBAL_PAIRED_DIR/platform/$filename"
    if [ "$fallback_message" = "true" ]; then
      echo -e "${YELLOW}ℹ️ Using global bridge file from ~/.paired (local file not found)${NC}" >&2
    fi
    return 0
  fi
  
  # Not found anywhere
  return 1
}

# Find bridge files with fallback
BRIDGE_SERVICE=$(find_bridge_file "cascade_bridge_service.js" true)
BRIDGE_CLIENT=$(find_bridge_file "cascade_bridge_client.js" true)
BRIDGE_API=$(find_bridge_file "cascade_bridge_api.js" true)

# Determine bridge PID file location
if [ -d "$LOCAL_PAIRED_DIR/cascade_bridge" ]; then
  BRIDGE_DIR="$LOCAL_PAIRED_DIR/cascade_bridge"
else
  BRIDGE_DIR="$GLOBAL_PAIRED_DIR/cascade_bridge"
  mkdir -p "$BRIDGE_DIR" 2>/dev/null || true
fi

BRIDGE_PID_FILE="$BRIDGE_DIR/bridge.pid"
BRIDGE_LOG_FILE="$BRIDGE_DIR/bridge.log"
BRIDGE_PORT=7890

# Function to check if bridge is running
is_bridge_running() {
  if [ -f "$BRIDGE_PID_FILE" ]; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && ps -p "$pid" >/dev/null; then
      return 0  # Running
    fi
  fi
  return 1  # Not running
}

# Get connection count via WebSocket
get_connection_count() {
  local result=$(node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
ws.on('open', () => {
  ws.send(JSON.stringify({type: 'GET_CONNECTIONS'}));
});
ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log(response.activeConnections || '?');
  ws.close();
});
ws.on('error', () => { console.log('?'); });
setTimeout(() => { ws.close(); }, 2000);
" 2>/dev/null)
  echo "$result"
}

# Get bridge uptime via WebSocket
get_bridge_uptime() {
  local result=$(node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:$BRIDGE_PORT');
ws.on('open', () => {
  ws.send(JSON.stringify({type: 'GET_UPTIME'}));
});
ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log(response.uptime || '?');
  ws.close();
});
ws.on('error', () => { console.log('?'); });
setTimeout(() => { ws.close(); }, 2000);
" 2>/dev/null)
  echo "$result"
}

# Get memory usage
get_memory_usage() {
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      ps -o rss= -p "$pid" | awk '{printf "%.1f MB", $1/1024}'
    else
      # Linux
      awk '/VmRSS/{printf "%.1f MB", $2/1024}' /proc/$pid/status 2>/dev/null || echo "?"
    fi
  else
    echo "N/A"
  fi
}

# Show detailed bridge status
show_detailed_status() {
  echo -e "${CYAN}=========================================${NC}"
  echo -e "${CYAN}      PAIRED Cascade Bridge Status         ${NC}"
  echo -e "${CYAN}=========================================${NC}"
  
  # Check if bridge is running
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    local active_connections=$(get_connection_count)
    local uptime=$(get_bridge_uptime)
    local memory=$(get_memory_usage)
    local uptime_human
    
    # Convert seconds to human readable format
    if [ "$uptime" != "?" ]; then
      uptime_human=$(printf '%dd %dh %dm %ds' $((uptime/86400)) $((uptime%86400/3600)) $((uptime%3600/60)) $((uptime%60)))
    else
      uptime_human="?"
    fi
    
    echo -e "${GREEN}● Bridge Status: Running${NC}"
    echo -e "  PID: $pid"
    echo -e "  Port: $BRIDGE_PORT"
    echo -e "  Active Connections: $active_connections"
    echo -e "  Uptime: $uptime_human"
    echo -e "  Memory Usage: $memory"
    echo -e "  Log File: $BRIDGE_LOG_FILE"
    
    # Show recent activity
    echo -e "\n${CYAN}Recent Activity:${NC}"
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      tail -n 5 "$BRIDGE_LOG_FILE" | while read -r line; do
        echo -e "  $line"
      done
    else
      echo -e "  ${YELLOW}No log file found${NC}"
    fi
    
    # Show bridge file locations
    echo -e "\n${CYAN}Bridge Files:${NC}"
    echo -e "  Service: $BRIDGE_SERVICE"
    echo -e "  Client: $BRIDGE_CLIENT"
    echo -e "  API: $BRIDGE_API"
    
  else
    echo -e "${RED}✖ Bridge Status: Not Running${NC}"
    echo -e "${YELLOW}ℹ️ To start the bridge, use: bridge-status --start${NC}"
  fi
  
  echo -e "${CYAN}=========================================${NC}"
}

# Start the bridge
start_bridge() {
  if is_bridge_running; then
    echo -e "${YELLOW}ℹ️ Bridge is already running${NC}"
    return 0
  fi
  
  if [ ! -f "$BRIDGE_SERVICE" ]; then
    echo -e "${RED}✖ Bridge service file not found: $BRIDGE_SERVICE${NC}"
    echo -e "${YELLOW}ℹ️ Trying to repair...${NC}"
    repair_bridge_installation
    
    # Check again after repair
    if [ ! -f "$BRIDGE_SERVICE" ]; then
      echo -e "${RED}✖ Bridge service file still missing after repair attempt${NC}"
      return 1
    fi
  fi
  
  # Create bridge directory if it doesn't exist
  mkdir -p "$BRIDGE_DIR"
  
  echo -e "${BLUE}⏳ Starting bridge service...${NC}"
  nohup node "$BRIDGE_SERVICE" > "$BRIDGE_LOG_FILE" 2>&1 & 
  
  local pid=$!
  echo $pid > "$BRIDGE_PID_FILE"
  
  # Wait a moment for the server to start
  sleep 2
  
  if is_bridge_running; then
    echo -e "${GREEN}✅ Bridge started successfully (PID: $pid)${NC}"
  else
    echo -e "${RED}✖ Bridge failed to start${NC}"
    return 1
  fi
}

# Stop the bridge
stop_bridge() {
  if is_bridge_running; then
    local pid=$(cat "$BRIDGE_PID_FILE" 2>/dev/null)
    echo -e "${BLUE}⏳ Stopping bridge service (PID: $pid)...${NC}"
    
    kill $pid 2>/dev/null
    sleep 1
    
    # Check if process is still running
    if ps -p $pid >/dev/null; then
      echo -e "${YELLOW}⚠️ Bridge didn't stop gracefully, forcing...${NC}"
      kill -9 $pid 2>/dev/null
      sleep 1
    fi
    
    rm -f "$BRIDGE_PID_FILE"
    
    if ! is_bridge_running; then
      echo -e "${GREEN}✅ Bridge stopped successfully${NC}"
    else
      echo -e "${RED}✖ Failed to stop bridge${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}ℹ️ Bridge is not running${NC}"
  fi
}

# Restart the bridge
restart_bridge() {
  echo -e "${BLUE}⏳ Restarting bridge service...${NC}"
  stop_bridge
  sleep 1
  start_bridge
}

# Send a message through the bridge
send_message() {
  local recipient="$1"
  local message="$2"
  
  if ! is_bridge_running; then
    echo -e "${RED}✖ Bridge is not running. Start it first with --start${NC}"
    return 1
  fi
  
  if [ ! -f "$BRIDGE_CLIENT" ]; then
    echo -e "${RED}✖ Bridge client file not found: $BRIDGE_CLIENT${NC}"
    return 1
  fi
  
  if [ -z "$message" ]; then
    echo -e "${YELLOW}ℹ️ Message content required${NC}"
    echo -e "Usage: bridge-status --message \"Your message\""
    echo -e "       bridge-status --to <terminal_id> \"Your message\""
    return 1
  fi
  
  if [ -z "$recipient" ] || [ "$recipient" = "broadcast" ]; then
    echo -e "${BLUE}⏳ Broadcasting message to all terminals...${NC}"
    node -e "
      const client = require('$BRIDGE_CLIENT');
      client.sendMessage({
        type: 'broadcast',
        content: '$message'
      });
      setTimeout(() => process.exit(0), 1000);
    "
  else
    echo -e "${BLUE}⏳ Sending message to terminal $recipient...${NC}"
    node -e "
      const client = require('$BRIDGE_CLIENT');
      client.sendMessage({
        type: 'direct',
        recipient: '$recipient',
        content: '$message'
      });
      setTimeout(() => process.exit(0), 1000);
    "
  fi
  
  echo -e "${GREEN}✅ Message sent successfully${NC}"
}

# Repair common bridge installation issues
repair_bridge_installation() {
  echo -e "${BLUE}⏳ Repairing bridge installation...${NC}"
  
  # Check global installation
  if [ ! -d "$GLOBAL_PAIRED_DIR/src" ]; then
    echo -e "${RED}✖ Global PAIRED installation appears incomplete${NC}"
    echo -e "${YELLOW}ℹ️ Please run 'paired-doctor' or reinstall PAIRED${NC}"
    return 1
  fi
  
  # Check if bridge service exists globally
  if [ ! -f "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_service.js" ]; then
    echo -e "${RED}✖ Bridge service not found in global installation${NC}"
    echo -e "${YELLOW}ℹ️ Please run 'paired-doctor' or reinstall PAIRED${NC}"
    return 1
  fi
  
  # Ensure local .paired directory exists
  if [ ! -d "$LOCAL_PAIRED_DIR" ]; then
    echo -e "${YELLOW}ℹ️ Creating local .paired directory...${NC}"
    mkdir -p "$LOCAL_PAIRED_DIR/src"
  fi
  
  # Copy required bridge files from global to local
  if [ ! -d "$LOCAL_PAIRED_DIR/src" ]; then
    mkdir -p "$LOCAL_PAIRED_DIR/src"
  fi
  
  echo -e "${BLUE}⏳ Copying bridge files from global installation...${NC}"
  mkdir -p "$LOCAL_PAIRED_DIR/platform/"
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_service.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_client.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_api.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_lifecycle.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_client_auto.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  cp "$GLOBAL_PAIRED_DIR/platform/cascade_bridge_integration.js" "$LOCAL_PAIRED_DIR/platform/" 2>/dev/null || true
  
  echo -e "${GREEN}✅ Repair completed${NC}"
}

# Show usage
show_usage() {
  echo -e "${CYAN}PAIRED Bridge Status and Control${NC}"
  echo -e "Usage: bridge-status [options] [message]"
  echo -e ""
  echo -e "Options:"
  echo -e "  --start                Start the bridge"
  echo -e "  --stop                 Stop the bridge"
  echo -e "  --restart              Restart the bridge"
  echo -e "  --status               Show detailed status (default)"
  echo -e "  --message \"text\"       Broadcast message to all terminals"
  echo -e "  --to <id> \"text\"       Send message to specific terminal"
  echo -e "  --logs                 Show bridge logs"
  echo -e "  --tail                 Follow logs in real-time"
  echo -e "  --repair               Repair bridge installation"
  echo -e "  --help                 Show this help message"
  echo -e ""
  echo -e "Examples:"
  echo -e "  bridge-status                     # Show status"
  echo -e "  bridge-status --message \"Hello\"   # Broadcast message"
  echo -e "  bridge-status --to term1 \"Hello\"  # Send to specific terminal"
}

# Main execution
case "$1" in
  --start)
    start_bridge
    ;;
  --stop)
    stop_bridge
    ;;
  --restart)
    restart_bridge
    ;;
  --status)
    show_detailed_status
    ;;
  --message)
    send_message "broadcast" "$2"
    ;;
  --to)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo -e "${RED}✖ Missing terminal ID or message${NC}"
      echo -e "Usage: bridge-status --to <terminal_id> \"Your message\""
      exit 1
    fi
    send_message "$2" "$3"
    ;;
  --logs)
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      cat "$BRIDGE_LOG_FILE"
    else
      echo -e "${RED}✖ Log file not found: $BRIDGE_LOG_FILE${NC}"
    fi
    ;;
  --tail)
    if [ -f "$BRIDGE_LOG_FILE" ]; then
      tail -f "$BRIDGE_LOG_FILE"
    else
      echo -e "${RED}✖ Log file not found: $BRIDGE_LOG_FILE${NC}"
    fi
    ;;
  --repair)
    repair_bridge_installation
    ;;
  --help)
    show_usage
    ;;
  *)
    # Default is to show status
    show_detailed_status
    ;;
esac

exit 0
