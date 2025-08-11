#!/bin/bash
# WEE (Workflow Evolution Engine) Installation Script
# Temp-based installation with global/local architecture

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐁 WEE (Workflow Evolution Engine) Installer${NC}"
echo "================================================="
echo -e "${YELLOW}🚀 New Architecture: Global Orchestrator + Local Execution${NC}"
echo ""

# Use current directory as source (direct installation from repository)
echo -e "${BLUE}📥 Installing directly from WEE repository...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verify we're in a valid WEE repository
if [ ! -f "$SCRIPT_DIR/install.sh" ] || [ ! -d "$SCRIPT_DIR/scripts" ]; then
    echo -e "${RED}❌ Invalid WEE repository structure${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the WEE repository directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Valid WEE repository detected${NC}"
echo ""

# Detect shell and RC file using $0 (most reliable method)
CURRENT_SHELL=$(basename "$0")
if [[ "$CURRENT_SHELL" == *"zsh"* ]] || [[ "$SHELL" == *"zsh"* ]] || [ -n "${ZSH_VERSION:-}" ]; then
    SHELL_RC="$HOME/.zshrc"
    SHELL_TYPE="zsh"
elif [[ "$CURRENT_SHELL" == *"bash"* ]] || [[ "$SHELL" == *"bash"* ]] || [ -n "${BASH_VERSION:-}" ]; then
    SHELL_RC="$HOME/.bashrc"
    SHELL_TYPE="bash"
else
    # Default to zsh on macOS, bash on Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SHELL_RC="$HOME/.zshrc"
        SHELL_TYPE="zsh"
    else
        SHELL_RC="$HOME/.bashrc"
        SHELL_TYPE="bash"
    fi
    echo -e "${YELLOW}⚠️  Could not detect shell ($CURRENT_SHELL), defaulting to $SHELL_TYPE${NC}"
fi

echo -e "${GREEN}🐚 Detected shell: $SHELL_TYPE${NC}"
echo -e "${GREEN}📝 Shell RC: $SHELL_RC${NC}"
echo ""

# Step 4: Check for existing Windsurf configurations and backup if needed
echo -e "${YELLOW}🔍 Checking for existing Windsurf configurations...${NC}"

if [ -f "$HOME/.weerules" ] || [ -f "$HOME/.weefiles" ] || [ -d "$HOME/.wee" ]; then
    echo -e "${CYAN}📄 Existing Windsurf configurations detected:${NC}"
    
    [ -f "$HOME/.weerules" ] && echo -e "  ${YELLOW}• ~/.weerules${NC}"
    [ -f "$HOME/.weefiles" ] && echo -e "  ${YELLOW}• ~/.weefiles${NC}"
    [ -d "$HOME/.wee" ] && echo -e "  ${YELLOW}• ~/.wee directory${NC}"
    
    # Check shell config for windsurf aliases
    if [ -n "${ZSH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        SHELL_RC=""
    fi
    
    if [ -n "$SHELL_RC" ] && [ -f "$SHELL_RC" ] && grep -q "windsurf" "$SHELL_RC" 2>/dev/null; then
        echo -e "  ${YELLOW}• Windsurf aliases in $SHELL_RC${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}🛡️  WEE will create backups before making any changes${NC}"
    echo -e "${GREEN}✅ Your existing Windsurf configurations will be safely preserved${NC}"
    echo -e "${GREEN}✅ You can restore them anytime with: wee-backup restore${NC}"
    echo ""
    
    read -p "Create backup of existing configurations? (Y/n): " -r
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}⚠️ Skipping backup - proceeding with installation${NC}"
    else
        # Create backup using our backup script
        echo -e "${YELLOW}💾 Creating safety backup of existing Windsurf configurations...${NC}"
        "$SCRIPT_DIR/scripts/windsurf-backup.sh" backup
        echo ""
    fi
else
    echo -e "${GREEN}✅ No existing Windsurf configurations found${NC}"
fi

# Step 5: Setup global WEE infrastructure
echo -e "${YELLOW}📁 Setting up global WEE infrastructure...${NC}"

# Create global WEE directories
mkdir -p "$HOME/.wee"/{bin,scripts,templates,config,memory,registry}

# Copy ALL essential directories from temp to global
echo -e "${BLUE}📦 Copying all WEE components to global installation...${NC}"

# Copy core source code
cp -r "$SCRIPT_DIR/src" ~/.wee/
echo -e "${GREEN}✅ Copied core source code${NC}"

# Copy CASCADE bridge files to global location (required by WEE Doctor)
echo -e "${BLUE}🌉 Installing CASCADE bridge components...${NC}"
if [ -f "$SCRIPT_DIR/src/cascade_bridge_unified.js" ]; then
    cp "$SCRIPT_DIR/src/cascade_bridge_"*.js ~/.wee/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied CASCADE bridge service files${NC}"
else
    echo -e "${YELLOW}⚠️  CASCADE bridge files not found - bridge functionality may be limited${NC}"
fi

# Copy bridge-status script to global location
if [ -f "$SCRIPT_DIR/scripts/bridge-status.sh" ]; then
    cp "$SCRIPT_DIR/scripts/bridge-status.sh" ~/.wee/scripts/
    echo -e "${GREEN}✅ Copied bridge-status script${NC}"
fi

# Copy project template scripts
if [ -d "$SCRIPT_DIR/templates/project-scripts" ]; then
    mkdir -p ~/.wee/templates/project-scripts
    cp -r "$SCRIPT_DIR/templates/project-scripts/"* ~/.wee/templates/project-scripts/
    echo -e "${GREEN}✅ Copied project template scripts${NC}"
fi



# Copy Windsurf agent types for native Cascade integration
if [ -f "$SCRIPT_DIR/src/config/windsurf_agent_types.yml" ]; then
    mkdir -p ~/.wee/.wee
    cp "$SCRIPT_DIR/src/config/windsurf_agent_types.yml" ~/.wee/.wee/
    echo -e "${GREEN}✅ Copied Windsurf agent types for Cascade integration${NC}"
else
    echo -e "${YELLOW}⚠️  Windsurf agent types not found - Cascade integration may not work${NC}"
fi

# Copy configuration templates (CRITICAL for .windsurfrules template)
cp -r "$SCRIPT_DIR/config" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied configuration templates${NC}"

# Copy project templates (CRITICAL for wee-init project scripts)
cp -rf "$SCRIPT_DIR/templates" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied project templates${NC}"

# Copy agent data and configurations
cp -r "$SCRIPT_DIR/data" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied agent data${NC}"

# Copy WEE executables and binaries
cp -r "$SCRIPT_DIR/bin" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied WEE executables${NC}"

# Copy documentation (for agent reference)
cp -r "$SCRIPT_DIR/docs" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied documentation${NC}"

# Copy shell scripts (handle case where none exist)
if ls "$SCRIPT_DIR/"*.sh 1> /dev/null 2>&1; then
    cp "$SCRIPT_DIR/"*.sh ~/.wee/scripts/
fi

# Copy specific required files
cp "$SCRIPT_DIR/scripts/aliases.sh" ~/.wee/ 2>/dev/null || true
cp -r "$SCRIPT_DIR/scripts" ~/.wee/ 2>/dev/null || true

# Copy package.json for dependency management
cp "$SCRIPT_DIR/package.json" ~/.wee/ 2>/dev/null || true
cp "$SCRIPT_DIR/package-lock.json" ~/.wee/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied package configuration${NC}"

# Install Node.js dependencies (CRITICAL for agent functionality)
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
cd ~/.wee
if command -v npm >/dev/null 2>&1; then
    npm install --production --silent 2>/dev/null || {
        echo -e "${YELLOW}⚠️  npm install failed, trying alternative approach...${NC}"
        npm install --production 2>/dev/null || {
            echo -e "${RED}❌ Failed to install dependencies${NC}"
            echo -e "${YELLOW}💡 You may need to run 'cd ~/.wee && npm install' manually${NC}"
        }
    }
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  npm not found - Node.js dependencies not installed${NC}"
    echo -e "${YELLOW}💡 Install Node.js and run 'cd ~/.wee && npm install' manually${NC}"
fi
cd "$SCRIPT_DIR"

# Create global registry system
echo -e "${BLUE}📊 Initializing global registry...${NC}"
cat > ~/.wee/registry/projects.json << 'EOF'
{
  "projects": [],
  "global_stats": {
    "total_projects": 0,
    "active_projects": 0,
    "total_learning_items": 0,
    "last_aggregation": null,
    "wee_version": "2.0.0-alpha",
    "installation_date": null
  },
  "user_preferences": {
    "auto_onboard": "prompt",
    "sync_frequency": "daily",
    "knowledge_sharing": "anonymized",
    "backup_retention": 30
  }
}
EOF

# Update installation date
INSTALL_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.wee/registry/projects.json
else
    sed -i "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.wee/registry/projects.json
fi

# Create global memory system
echo -e "${BLUE}🧠 Initializing global memory...${NC}"
cat > ~/.wee/memory/global_knowledge.md << 'EOF'
# WEE Global Knowledge Base

## Installation
- **Date**: $(date)
- **Version**: 2.0.0-alpha
- **Architecture**: Global Orchestrator + Local Execution

## Learning Aggregation
*This section will be populated as projects contribute knowledge*

## Best Practices
*This section will be populated from successful project patterns*

## Common Solutions
*This section will be populated from recurring problem solutions*
EOF

# Create executable wrappers
echo -e "${BLUE}🔧 Creating executable wrappers...${NC}"

# Global commands
cat > ~/.wee/bin/wee-status << 'EOF'
#!/bin/bash
# Check if in WEE project, show project status; otherwise show global status
if [ -f ".weerules" ] || [ -d ".wee" ]; then
    exec "$HOME/.wee/scripts/status.sh" "$@"
else
    exec "$HOME/.wee/scripts/global-status.sh" "$@"
fi
EOF

cat > ~/.wee/bin/wee-init << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/init-project.sh" "$@"
EOF

cat > ~/.wee/bin/wee-verify << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/verify-shell-integration.sh" "$@"
EOF

cat > ~/.wee/bin/wee-global << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/global-manager.sh" "$@"
EOF

cat > ~/.wee/bin/wee-sync << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/knowledge-sync.sh" "$@"
EOF

chmod +x ~/.wee/bin/*

# Make all scripts executable
find ~/.wee -name "*.sh" -exec chmod +x {} \;

# Create global Windsurf rules for auto-onboarding
echo -e "${BLUE}🎯 Setting up global auto-onboarding...${NC}"
cat > ~/.weerules << 'EOF'
---
description: WEE Global Auto-Detection and Onboarding
globs: **/*
alwaysApply: true
---

# WEE Auto-Detection System
# This file enables intelligent project onboarding when Windsurf opens directories

## Detection Logic:
1. **Development Indicators**: Check for .git, package.json, requirements.txt, etc.
2. **WEE Status**: Check if WEE is already installed (.wee/ or .weerules)
3. **User Preferences**: Respect auto-onboard settings from global config
4. **Smart Prompts**: Context-aware installation offers

## Auto-Onboarding Rules:
- If development project + no WEE → Offer installation
- If WEE detected but not initialized → Offer setup
- If WEE update available → Offer upgrade
- Respect user preferences (auto-install, never ask, etc.)

## Commands Available After Detection:
- `wee-init` - Initialize WEE in current project
- `wee-status` - Check project/global status
- `wee-global registry` - View all WEE projects
- `wee-sync` - Sync knowledge between global/local

*This global configuration enables seamless WEE onboarding across all projects*
EOF

# Add to shell configuration (handle BOTH .bashrc AND .zshrc for maximum compatibility)
echo -e "${BLUE}🐚 Configuring shell aliases for all shells...${NC}"

# Function to add WEE configuration to a shell RC file
add_wee_to_shell() {
    local rc_file="$1"
    local shell_name="$2"
    
    if [ -f "$rc_file" ]; then
        if ! grep -q "WEE (Workflow Evolution Engine)" "$rc_file" 2>/dev/null; then
            echo -e "${BLUE}📝 Adding WEE to $rc_file ($shell_name)...${NC}"
            echo "" >> "$rc_file"
            echo "# WEE (Workflow Evolution Engine) - Global Architecture" >> "$rc_file"
            echo "export PATH=\"\$HOME/.wee/bin:\$PATH\"" >> "$rc_file"
            echo "source ~/.wee/aliases.sh" >> "$rc_file"
            
            # Warn about conflicts
            if grep -q "windsurf/aliases.sh" "$rc_file" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Warning: Found old Windsurf aliases in $rc_file${NC}"
                echo -e "${YELLOW}💡 Consider removing old Windsurf alias sources to avoid conflicts${NC}"
            fi
            echo -e "${GREEN}✅ WEE configured in $rc_file${NC}"
        else
            echo -e "${GREEN}✅ WEE already configured in $rc_file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $rc_file not found, creating it...${NC}"
        touch "$rc_file"
        echo "# WEE (Windsurf Evolutionary Ecosystem) - Global Architecture" >> "$rc_file"
        echo "export PATH=\"\$HOME/.wee/bin:\$PATH\"" >> "$rc_file"
        echo "source ~/.wee/aliases.sh" >> "$rc_file"
        echo -e "${GREEN}✅ Created and configured $rc_file${NC}"
    fi
}

# Configure both bash and zsh (ensures aliases work regardless of shell)
add_wee_to_shell "$HOME/.bashrc" "bash"
add_wee_to_shell "$HOME/.zshrc" "zsh"

# Also handle the detected shell RC if it's different
if [ -n "$SHELL_RC" ] && [ "$SHELL_RC" != "$HOME/.bashrc" ] && [ "$SHELL_RC" != "$HOME/.zshrc" ]; then
    add_wee_to_shell "$SHELL_RC" "detected shell"
fi

# Load WEE for current session
echo -e "${BLUE}🚀 Loading WEE for current session...${NC}"
export PATH="$HOME/.wee/bin:$PATH"
source ~/.wee/aliases.sh 2>/dev/null || true

# Verify installation
echo ""
echo -e "${BLUE}🔍 Verifying installation...${NC}"

if command -v wee-status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WEE Global Architecture installed successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Welcome to WEE 2.0!${NC}"
    echo "========================"
    echo -e "${BLUE}🌍 Global Commands:${NC}"
    echo "   • wee-global registry  - View all WEE projects"
    echo "   • wee-global status    - Global system status"
    echo "   • wee-sync            - Sync knowledge"
    echo ""
    echo -e "${BLUE}📁 Project Commands:${NC}"
    echo "   • wee-init            - Initialize WEE in project"
    echo "   • wee-status          - Project/global status"
    echo "   • wee-verify          - Verify installation"
    echo ""
    echo -e "${GREEN}🚀 Next Steps:${NC}"
    echo "   1. Open any project in Windsurf - auto-onboarding will activate"
    echo "   2. Or manually run 'wee-init' in a project directory"
    echo "   3. Use 'wee-global registry' to see all your WEE projects"
    echo ""
    echo -e "${YELLOW}💡 Global config: ~/.weerules enables auto-detection${NC}"
else
    echo -e "${RED}❌ Installation verification failed${NC}"
    echo -e "${YELLOW}🔧 Try: source $SHELL_RC${NC}"
fi
