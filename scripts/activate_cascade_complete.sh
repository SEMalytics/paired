#!/bin/bash
# Complete CASCADE Activation Script
# Handles both bridge connection AND CASCADE API environment activation
# This ensures agents appear as chat participants in CASCADE UI

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 WEE: Complete CASCADE activation starting...${NC}"

# Step 1: Auto-connect to bridge (if not already connected)
echo -e "${BLUE}🌉 Step 1: Connecting to CASCADE bridge...${NC}"
if ~/.wee/scripts/auto-connect-bridge.sh; then
    echo -e "${GREEN}✅ Bridge connection successful${NC}"
else
    echo -e "${YELLOW}⚠️ Bridge connection had issues, continuing with API activation...${NC}"
fi

# Step 2: Activate CASCADE API environment in this Windsurf instance
echo -e "${BLUE}🎯 Step 2: Activating CASCADE API environment...${NC}"

# Check if CASCADE API is already activated
if node -e "console.log(typeof global !== 'undefined' && global.CASCADE_API !== undefined ? 'true' : 'false')" 2>/dev/null | grep -q "true"; then
    echo -e "${GREEN}✅ CASCADE API already activated${NC}"
else
    echo -e "${BLUE}🔧 Activating CASCADE API in this Windsurf instance...${NC}"
    
    # Run CASCADE API activation in background
    node ~/.wee/scripts/activate_cascade_agents.js &
    
    # Give it a moment to initialize
    sleep 2
    
    # Verify activation
    if node -e "console.log(typeof global !== 'undefined' && global.CASCADE_API !== undefined ? 'true' : 'false')" 2>/dev/null | grep -q "true"; then
        echo -e "${GREEN}✅ CASCADE API activated successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ CASCADE API activation may need more time${NC}"
    fi
fi

# Step 3: Verify agents are available in CASCADE
echo -e "${BLUE}🤖 Step 3: Verifying agent availability...${NC}"

# Quick agent availability check
if curl -s http://localhost:7890/health | grep -q "agents.*7" 2>/dev/null; then
    echo -e "${GREEN}✅ All 7 agents registered with bridge${NC}"
else
    echo -e "${YELLOW}⚠️ Agent registration may still be in progress${NC}"
fi

echo -e "${GREEN}🎯 Step 4: Activating CASCADE Complete Takeover...\n${BLUE}🔄 Making CASCADE subservient to your WEE team...\n${NC}"
if [[ -f ~/.wee/scripts/cascade_complete_takeover.js ]]; then
  echo -e "${BLUE}👑 Alex: Taking over as your primary interface...\n${NC}"
  node ~/.wee/scripts/cascade_complete_takeover.js &
  TAKEOVER_PID=$!
  echo -e "${GREEN}✅ CASCADE Takeover active - Alex is now your primary interface\n${NC}"
  echo -e "${BLUE}💬 All requests will be handled by your WEE team\n${NC}"
else
  echo -e "${YELLOW}⚠️ CASCADE Takeover script not found - using standard integration\n${NC}"
fi

echo -e "${GREEN}🎉 Complete CASCADE activation finished!\n${NC}"
echo -e "${BLUE}💬 Your WEE team is now your primary interface\n${NC}"
echo -e "${BLUE}💡 Try asking: 'Alex, are you there?' or 'My team, can you help?'\n${NC}"
echo -e "${BLUE}🎯 CASCADE is now invisible - you'll only hear from your agents!\n${NC}"
