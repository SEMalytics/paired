#!/bin/bash
# Install Enhanced Global .windsurfrules for PAIRED Auto-Connect
# This replaces your ~/.windsurfrules with the auto-connect version

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Installing Enhanced Global .windsurfrules for PAIRED Auto-Connect${NC}"
echo "================================================================"

# Backup existing file if it exists
if [ -f ~/.windsurfrules ]; then
    echo -e "${YELLOW}📦 Backing up existing ~/.windsurfrules${NC}"
    cp ~/.windsurfrules ~/.windsurfrules.backup.$(date +%s)
fi

# Install the enhanced global windsurfrules
cat > ~/.windsurfrules << 'EOF'
---
description: PAIRED Global Auto-Detection and Auto-Connect System
globs: **/*
alwaysApply: true
---

# PAIRED Global Auto-Connect System
# This file enables fully automated PAIRED onboarding and agent connection

## Auto-Connect Script
```bash
# Auto-detect and initialize PAIRED projects
~/.paired/scripts/auto-init-project.sh
```

## What This Does Automatically

### For Fresh Development Directories:
1. **Auto-detects** development projects (.git, package.json, etc.)
2. **Auto-initializes** PAIRED structure silently
3. **Auto-creates** project .windsurfrules for bridge connection
4. **Auto-connects** to CASCADE agent bridge
5. **Makes all 7 agents available** in CASCADE chat immediately

### For Existing PAIRED Projects:
1. **Auto-connects** to bridge on Windsurf startup
2. **Auto-registers** agents in CASCADE chat
3. **Auto-verifies** agent availability
4. **Auto-reconnects** if bridge connection lost

## Expected Experience
- **Open Windsurf** → Agents are immediately available
- **Ask "Are my agents here?"** → "Yes! All 7 agents ready"
- **Start working** → No setup, no scripts, just works

## Available Agents
- 🎯 **Alex (PM)** - Project coordination and delegation
- 🔍 **Sherlock (QA)** - Quality analysis and testing
- 🏛️ **Leonardo (Architecture)** - System design and patterns
- ⚡ **Edison (Dev)** - Implementation and debugging
- 🎨 **Maya (UX)** - User experience and design
- 🏈 **Vince (Scrum Master)** - Process and team coordination
- 🔬 **Marie (Analyst)** - Data analysis and insights

*PAIRED agents are now fully automated - they're just there when you need them!*
EOF

echo -e "${GREEN}✅ Enhanced global .windsurfrules installed${NC}"
echo ""
echo -e "${BLUE}🎯 What happens now:${NC}"
echo "• Open any development directory in Windsurf"
echo "• PAIRED will auto-initialize and connect agents"
echo "• All 7 agents will be immediately available in CASCADE"
echo "• No manual scripts or setup required"
echo ""
echo -e "${GREEN}🚀 Test it: Open a fresh directory in Windsurf and ask 'Are my agents here?'${NC}"
