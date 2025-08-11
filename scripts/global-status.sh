#!/bin/bash
# WEE Global Status Script
# Shows global WEE system status and registered projects

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY_FILE="$HOME/.wee/registry/projects.json"
GLOBAL_MEMORY="$HOME/.wee/memory/global_knowledge.md"

echo -e "${BLUE}🌍 WEE Global System Status${NC}"
echo "=========================="
echo ""

# Check if WEE is properly installed
if [ ! -f "$REGISTRY_FILE" ]; then
    echo -e "${RED}❌ WEE global registry not found${NC}"
    echo -e "${YELLOW}💡 Run the install script to set up WEE${NC}"
    exit 1
fi

# Parse registry data
TOTAL_PROJECTS=$(jq -r '.global_stats.total_projects' "$REGISTRY_FILE" 2>/dev/null || echo "0")
ACTIVE_PROJECTS=$(jq -r '.global_stats.active_projects' "$REGISTRY_FILE" 2>/dev/null || echo "0")
WEE_VERSION=$(jq -r '.global_stats.wee_version' "$REGISTRY_FILE" 2>/dev/null || echo "unknown")
INSTALL_DATE=$(jq -r '.global_stats.installation_date' "$REGISTRY_FILE" 2>/dev/null || echo "unknown")
LEARNING_ITEMS=$(jq -r '.global_stats.total_learning_items' "$REGISTRY_FILE" 2>/dev/null || echo "0")

echo -e "${GREEN}📊 System Overview${NC}"
echo "   Version: $WEE_VERSION"
echo "   Installed: $INSTALL_DATE"
echo "   Total Projects: $TOTAL_PROJECTS"
echo "   Active Projects: $ACTIVE_PROJECTS"
echo "   Learning Items: $LEARNING_ITEMS"
echo ""

# Show recent projects
echo -e "${BLUE}📁 Recent Projects${NC}"
if [ "$TOTAL_PROJECTS" -gt 0 ]; then
    jq -r '.projects[] | "   • \(.name) (\(.path)) - \(.status)"' "$REGISTRY_FILE" 2>/dev/null | head -5
else
    echo "   No projects registered yet"
    echo -e "${YELLOW}   💡 Use 'wee-init' in a project directory to get started${NC}"
fi
echo ""

# Global memory status
echo -e "${BLUE}🧠 Global Knowledge${NC}"
if [ -f "$GLOBAL_MEMORY" ]; then
    MEMORY_SIZE=$(wc -l < "$GLOBAL_MEMORY")
    echo "   Knowledge base: $MEMORY_SIZE lines"
    echo "   Location: $GLOBAL_MEMORY"
else
    echo -e "${YELLOW}   Knowledge base not found${NC}"
fi
echo ""

# Auto-onboarding status
echo -e "${BLUE}🎯 Auto-Onboarding${NC}"
if [ -f "$HOME/.weerules" ]; then
    echo -e "${GREEN}   ✅ Global rules active${NC}"
    echo "   Location: ~/.weerules"
else
    echo -e "${YELLOW}   ⚠️  Global rules not found${NC}"
    echo -e "${YELLOW}   💡 Auto-onboarding may not work properly${NC}"
fi
echo ""

# Available commands
echo -e "${BLUE}🔧 Available Commands${NC}"
echo "   Global:"
echo "     wee-global registry    - View all projects"
echo "     wee-global status      - This status display"
echo "     wee-sync              - Sync knowledge"
echo ""
echo "   Project:"
echo "     wee-init              - Initialize WEE in project"
echo "     wee-status            - Project status"
echo ""

echo -e "${GREEN}🚀 WEE Global System Ready${NC}"
