#!/bin/bash
# PAIRED (Platform for AI-Enabled Remote Development) Installation Script
# Temp-based installation with global/local architecture

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤝 PAIRED (Platform for AI-Enabled Remote Development) Installer${NC}"
echo "================================================="
echo -e "${YELLOW}🚀 Revolutionary Architecture: Universal Bridge + Collaborative Intelligence${NC}"
echo ""

# Use current directory as source (direct installation from repository)
echo -e "${BLUE}📥 Installing directly from PAIRED repository...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get project root directory (parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$SCRIPT_DIR")" && pwd)"

# Verify we're in a valid PAIRED repository
if [ ! -f "$SCRIPT_DIR/install.sh" ]; then
    echo -e "${RED}❌ Invalid PAIRED repository structure${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the PAIRED repository directory${NC}"
    # Track failed installation
    if [ -f "$HOME/.paired/monitoring/track-installation.sh" ]; then
        "$HOME/.paired/monitoring/track-installation.sh" failure "${VERSION:-unknown}"
    fi
    exit 1
fi

echo -e "${GREEN}✅ Valid PAIRED repository detected${NC}"
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

if [ -f "$HOME/.pairedrules" ] || [ -f "$HOME/.pairedfiles" ] || [ -d "$HOME/.paired" ]; then
    echo -e "${CYAN}📄 Existing Windsurf configurations detected:${NC}"
    
    [ -f "$HOME/.pairedrules" ] && echo -e "  ${YELLOW}• ~/.pairedrules${NC}"
    [ -f "$HOME/.pairedfiles" ] && echo -e "  ${YELLOW}• ~/.pairedfiles${NC}"
    [ -d "$HOME/.paired" ] && echo -e "  ${YELLOW}• ~/.paired directory${NC}"
    
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
    echo -e "${CYAN}🛡️  PAIRED will create backups before making any changes${NC}"
    echo -e "${GREEN}✅ Your existing Windsurf configurations will be safely preserved${NC}"
    echo -e "${GREEN}✅ You can restore them anytime with: paired-backup restore${NC}"
    echo ""
    
    read -p "Create backup of existing configurations? (Y/n): " -r
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}⚠️ Skipping backup - proceeding with installation${NC}"
    else
        # Create backup using our backup script
        echo -e "${YELLOW}💾 Creating safety backup of existing Windsurf configurations...${NC}"
        "$SCRIPT_DIR/windsurf-backup.sh" backup
        echo ""
    fi
else
    echo -e "${GREEN}✅ No existing Windsurf configurations found${NC}"
fi

# Step 5: Setup global PAIRED infrastructure
echo -e "${YELLOW}📁 Setting up global PAIRED infrastructure...${NC}"

# Create global PAIRED directories
mkdir -p "$HOME/.paired"/{bin,scripts,templates,config,memory,registry}

# Copy ALL essential directories from temp to global
echo -e "${BLUE}📦 Copying all PAIRED components to global installation...${NC}"

# Copy essential components to global location (exclude installer scripts)
echo -e "${BLUE}📦 Copying essential PAIRED components...${NC}"

# Copy directories
for dir in bin lib core config scripts tools windsurf-plugin; do
    if [ -d "$SCRIPT_DIR/$dir" ]; then
        cp -r "$SCRIPT_DIR/$dir" ~/.paired/
        echo -e "${GREEN}✅ Copied $dir/${NC}"
    fi
done

# Copy essential files (exclude installer scripts)
for file in package.json package-lock.json README.md LICENSE VERSION.json .cascade_config.js .pairedrules .windsurfrules; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" ~/.paired/
        echo -e "${GREEN}✅ Copied $file${NC}"
    fi
done

echo -e "${GREEN}✅ Essential components copied (installer scripts excluded)${NC}"

# Copy CASCADE bridge files to global location (required by PAIRED Doctor)
echo -e "${BLUE}🌉 Installing CASCADE bridge components...${NC}"
if [ -f "$SCRIPT_DIR/scripts/lib/bridge/cascade-bridge.js" ]; then
    echo -e "${GREEN}✅ Found unified CASCADE bridge${NC}"
else
    echo -e "${YELLOW}⚠️  CASCADE bridge files not found (optional)${NC}"
fi

# Copy bridge-status script to global location
if [ -f "$SCRIPT_DIR/scripts/bridge-status.sh" ]; then
    cp "$SCRIPT_DIR/scripts/bridge-status.sh" ~/.paired/scripts/
    chmod +x ~/.paired/scripts/bridge-status.sh
    echo -e "${GREEN}✅ Copied bridge status script${NC}"
fi

# Copy project template scripts (now in config/templates/)
if [ -d "$SCRIPT_DIR/config/templates/project-scripts" ]; then
    mkdir -p ~/.paired/templates/project-scripts
    cp -r "$SCRIPT_DIR/config/templates/project-scripts/"* ~/.paired/templates/project-scripts/ 2>/dev/null || true
    echo -e "${GREEN}✅ Ensured project-scripts templates are installed${NC}"
elif [ -d "$SCRIPT_DIR/templates/project-scripts" ]; then
    mkdir -p ~/.paired/templates/project-scripts
    cp -r "$SCRIPT_DIR/templates/project-scripts/"* ~/.paired/templates/project-scripts/ 2>/dev/null || true
    echo -e "${GREEN}✅ Ensured project-scripts templates are installed (legacy path)${NC}"
fi

# Ensure CASCADE config template is available (now in config/templates/)
if [ -f "$SCRIPT_DIR/config/templates/cascade-config-template.js" ]; then
    mkdir -p ~/.paired/config/templates/
    cp "$SCRIPT_DIR/config/templates/cascade-config-template.js" ~/.paired/config/templates/
    echo -e "${GREEN}✅ CASCADE config template installed${NC}"
elif [ -f "$SCRIPT_DIR/templates/cascade-config-template.js" ]; then
    mkdir -p ~/.paired/templates/
    cp "$SCRIPT_DIR/templates/cascade-config-template.js" ~/.paired/templates/
    echo -e "${GREEN}✅ CASCADE config template installed (legacy path)${NC}"
fi

# Copy configuration templates (CRITICAL for .windsurfrules template)
if [ -d "$SCRIPT_DIR/config" ]; then
    cp -r "$SCRIPT_DIR/config" ~/.paired/
    echo -e "${GREEN}✅ Copied configuration templates${NC}"
else
    echo -e "${YELLOW}⚠️  Config directory not found in source${NC}"
fi

# Copy requirements.txt for Python dependencies
cp "$SCRIPT_DIR/requirements.txt" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied requirements.txt${NC}"

# Copy agent data if available (backward compatibility)
if [ -d "$PROJECT_ROOT/.paired/data" ]; then
    cp -r "$PROJECT_ROOT/.paired/data" ~/.paired/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied agent data from .paired/ structure${NC}"
elif [ -d "$PROJECT_ROOT/data" ]; then
    cp -r "$PROJECT_ROOT/data" ~/.paired/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied agent data from legacy structure${NC}"
fi

# Copy PAIRED executables and binaries
cp -r "$SCRIPT_DIR/bin" ~/.paired/ 2>/dev/null || true

# Copy start-agents.sh to global scripts directory (now in config/templates/)
if [ -f "$SCRIPT_DIR/config/templates/project-scripts/start-agents.sh" ]; then
    cp "$SCRIPT_DIR/config/templates/project-scripts/start-agents.sh" ~/.paired/scripts/ 2>/dev/null || true
    chmod +x ~/.paired/scripts/start-agents.sh
elif [ -f "$SCRIPT_DIR/templates/project-scripts/start-agents.sh" ]; then
    cp "$SCRIPT_DIR/templates/project-scripts/start-agents.sh" ~/.paired/scripts/ 2>/dev/null || true
    chmod +x ~/.paired/scripts/start-agents.sh
fi
# Ensure paired-claude executable exists
if [ ! -f ~/.paired/bin/paired-claude ]; then
    cat > ~/.paired/bin/paired-claude << 'EOF'
#!/bin/bash
# PAIRED Claude Code Integration Launcher
# Activates Claude Code integration with PAIRED agents

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAIRED_ROOT="$(dirname "$SCRIPT_DIR")"

# Start Claude Code integration
node "$PAIRED_ROOT/modules/claudecode-1.0/src/claudecode-bridge/claude_startup.js"
EOF
    chmod +x ~/.paired/bin/paired-claude
fi
echo -e "${GREEN}✅ Copied PAIRED executables${NC}"

# Copy platform components including agent_launcher.js
cp -r "$SCRIPT_DIR/platform" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied platform components${NC}"

# Copy modular PAIRED architecture
echo -e "${BLUE}🤖 Installing modular PAIRED architecture...${NC}"

# Copy core components (agents, infrastructure)
if [ -d "$PROJECT_ROOT/.paired/core" ]; then
    cp -r "$PROJECT_ROOT/.paired/core" ~/.paired/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied core components from .paired/ structure${NC}"
elif [ -d "$PROJECT_ROOT/core" ]; then
    cp -r "$PROJECT_ROOT/core" ~/.paired/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied core components${NC}"
fi

# Ensure ALL agent files are properly copied (main agent files + modules)
echo -e "${BLUE}📦 Ensuring ALL agent files are installed...${NC}"
for agent in alex sherlock edison leonardo maya vince marie; do
    # Create agent directory
    mkdir -p ~/.paired/core/agents/$agent/
    
    # Copy main agent .js files (all variants)
    for agent_file in "${agent}_agent.js" "dev_agent.js" "pm_agent.js" "qa_agent.js" "architecture_agent.js" "ux_expert_agent.js" "scrum_master_agent.js" "analyst_agent.js"; do
        if [ -f "$PROJECT_ROOT/core/agents/$agent/$agent_file" ]; then
            cp "$PROJECT_ROOT/core/agents/$agent/$agent_file" ~/.paired/core/agents/$agent/
            echo -e "${GREEN}✅ Copied $agent/$agent_file${NC}"
        fi
    done
    
    # Copy modules directory if it exists
    if [ -d "$PROJECT_ROOT/core/agents/$agent/modules" ]; then
        mkdir -p ~/.paired/core/agents/$agent/modules/
        cp -r "$PROJECT_ROOT/core/agents/$agent/modules/"* ~/.paired/core/agents/$agent/modules/ 2>/dev/null || true
        echo -e "${GREEN}✅ Copied modules for $agent${NC}"
    fi
done

# Ensure infrastructure components are copied
if [ -d "$PROJECT_ROOT/core/infrastructure" ]; then
    mkdir -p ~/.paired/core/infrastructure/
    cp -r "$PROJECT_ROOT/core/infrastructure/"* ~/.paired/core/infrastructure/ 2>/dev/null || true
    echo -e "${GREEN}✅ Copied core infrastructure${NC}"
fi

# Copy new consolidated file structure
echo -e "${BLUE}📁 Installing new consolidated file structure...${NC}"

# Copy lib/ directory (agents, bridge, cascade, startup, utils)
if [ -d "$PROJECT_ROOT/lib" ]; then
    cp -r "$PROJECT_ROOT/lib" ~/.paired/
    echo -e "${GREEN}✅ Copied lib/ directory (agents, bridge, cascade, startup, utils)${NC}"
else
    echo -e "${YELLOW}⚠️  lib/ directory not found${NC}"
fi

# Copy bin/ directory (executables including startup-controller.js)
if [ -d "$PROJECT_ROOT/bin" ]; then
    cp -r "$PROJECT_ROOT/bin" ~/.paired/
    chmod +x ~/.paired/bin/*
    echo -e "${GREEN}✅ Copied bin/ directory with execute permissions${NC}"
else
    echo -e "${YELLOW}⚠️  bin/ directory not found${NC}"
fi

# Copy config/ directory (templates and configurations)
if [ -d "$PROJECT_ROOT/config" ]; then
    cp -r "$PROJECT_ROOT/config" ~/.paired/
    echo -e "${GREEN}✅ Copied config/ directory (templates and configurations)${NC}"
else
    echo -e "${YELLOW}⚠️  config/ directory not found${NC}"
fi

# Copy CASCADE configuration for global installation
if [ -f "$SCRIPT_DIR/.cascade_config.js" ]; then
    cp "$SCRIPT_DIR/.cascade_config.js" ~/.paired/
    echo -e "${GREEN}✅ CASCADE configuration installed globally${NC}"
elif [ -f "$SCRIPT_DIR/config/templates/cascade-config-template.js" ]; then
    cp "$SCRIPT_DIR/config/templates/cascade-config-template.js" ~/.paired/.cascade_config.js
    echo -e "${GREEN}✅ CASCADE configuration template installed globally${NC}"
elif [ -f "$SCRIPT_DIR/templates/cascade-config-template.js" ]; then
    cp "$SCRIPT_DIR/templates/cascade-config-template.js" ~/.paired/.cascade_config.js
    echo -e "${GREEN}✅ CASCADE configuration template installed globally (legacy path)${NC}"
fi

# Copy shell scripts (handle case where none exist)
if ls "$SCRIPT_DIR/"*.sh 1> /dev/null 2>&1; then
    cp "$SCRIPT_DIR/"*.sh ~/.paired/scripts/
fi

# Copy JavaScript scripts
if ls "$SCRIPT_DIR/scripts/"*.js 1> /dev/null 2>&1; then
    cp "$SCRIPT_DIR/scripts/"*.js ~/.paired/scripts/
    chmod +x ~/.paired/scripts/*.js
fi

# Copy shell scripts from scripts/ directory
if ls "$SCRIPT_DIR/scripts/"*.sh 1> /dev/null 2>&1; then
    cp "$SCRIPT_DIR/scripts/"*.sh ~/.paired/scripts/
    chmod +x ~/.paired/scripts/*.sh
fi

# Create working aliases file (not template)
echo -e "${BLUE}📝 Creating PAIRED aliases file...${NC}"
cat > ~/.paired/aliases.sh << 'EOF'
#!/bin/bash
# PAIRED (Platform for AI-Enabled Remote Development) Installation Scriptases
# Auto-generated aliases for Windsurf development workflow

# Global PAIRED Commands
alias paired-init='~/.paired/scripts/init-project.sh'
alias paired-status='~/.paired/scripts/global-status.sh'
alias paired-knowledge='~/.paired/scripts/knowledge-sync.sh'
alias wglobal='~/.paired/scripts/global-manager.sh'
alias wproject='~/.paired/scripts/global-status.sh --project'
alias wlearn='~/.paired/scripts/knowledge-sync.sh --learn'
alias wshare='~/.paired/scripts/knowledge-sync.sh --share'

# Project-specific PAIRED Commands (work when in PAIRED project)
# These check for .paired directory and use project-local scripts
alias wh='if [ -d ".paired/scripts" ]; then .paired/scripts/handoff.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wr='if [ -d ".paired/scripts" ]; then .paired/scripts/resume.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wdocs='if [ -d ".paired/scripts" ]; then .paired/scripts/doc_discovery.sh; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wtype='if [ -d ".paired/scripts" ]; then .paired/scripts/type_cleanup.py; else echo "Not in PAIRED project. Run: paired-init"; fi'

# Environment management aliases
alias wenv-dev='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh dev; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wenv-test='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh test; else echo "Not in PAIRED project. Run: paired-init"; fi'
alias wenv-prod='if [ -d ".paired/scripts" ]; then .paired/scripts/set-env.sh prod; else echo "Not in PAIRED project. Run: paired-init"; fi'

# PAIRED Doctor and diagnostics
alias paired-doctor='~/.paired/scripts/paired-doctor.sh'
alias paired-test='~/.paired/scripts/test-paired.sh'
alias paired-validate='~/.paired/scripts/validate-system.sh'

# Agent control aliases
alias paired-start='~/.paired/scripts/start-agents.sh'
alias paired-stop='~/.paired/bin/paired-stop'

# Quick PAIRED status and help
alias paired-help='echo "PAIRED Commands: paired-init, paired-start, paired-stop, paired-status, wh, wr, wdocs, wtype, wenv-*, paired-doctor"'
alias paired-version='echo "PAIRED (Platform for AI-Enabled Remote Development) - Production Ready"'

EOF
echo -e "${GREEN}✅ Created working PAIRED aliases file${NC}"
# Scripts already copied above

# Copy package.json for dependency management
cp "$SCRIPT_DIR/package.json" ~/.paired/ 2>/dev/null || true
echo -e "${GREEN}✅ Copied package.json${NC}"

# Install Node.js dependencies (CRITICAL for agent functionality)
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
cd ~/.paired

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Node.js not found - checking for nvm...${NC}"
    
    # Try to load nvm if available
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        echo -e "${BLUE}🔧 Loading nvm...${NC}"
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        if command -v node >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Node.js loaded via nvm${NC}"
        else
            echo -e "${RED}❌ Node.js still not available${NC}"
            echo -e "${YELLOW}💡 Please install Node.js and run 'cd ~/.paired && npm install' manually${NC}"
            cd "$SCRIPT_DIR"
            exit 0
        fi
    else
        echo -e "${RED}❌ Node.js not found and nvm not available${NC}"
        echo -e "${YELLOW}💡 Please install Node.js and run 'cd ~/.paired && npm install' manually${NC}"
        cd "$SCRIPT_DIR"
        exit 0
    fi
fi

if command -v npm >/dev/null 2>&1; then
    echo -e "${CYAN}Installing dependencies from package.json...${NC}"
    
    # Use package.json for reliable dependency installation
    if [ -f "package.json" ]; then
        if npm install --production >/dev/null 2>&1; then
            echo -e "${GREEN}✅ All dependencies installed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️ npm install failed, trying alternative approach...${NC}"
            # Fallback to individual installs if package.json install fails
            DEPS=("js-yaml" "express" "ws" "uuid")
            for dep in "${DEPS[@]}"; do
                echo -e "${CYAN}  Installing $dep...${NC}"
                if npm install "$dep" --save >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✅ $dep installed${NC}"
                else
                    echo -e "${RED}  ❌ Failed to install $dep${NC}"
                fi
            done
        fi
    else
        echo -e "${RED}❌ package.json not found in ~/.paired${NC}"
        echo -e "${YELLOW}💡 Please run 'cd ~/.paired && npm install js-yaml express ws uuid' manually${NC}"
    fi
else
    echo -e "${RED}❌ npm not available after Node.js check${NC}"
    echo -e "${YELLOW}💡 Please install npm and run 'cd ~/.paired && npm install' manually${NC}"
fi

cd "$SCRIPT_DIR"  # Return to original directory
echo -e "${BLUE}📊 Initializing global registry...${NC}"
cat > ~/.paired/registry/projects.json << 'EOF'
{
  "projects": [],
  "global_stats": {
    "active_projects": 0,
    "total_learning_items": 0,
    "last_aggregation": null,
    "paired_version": "2.0.0-alpha",
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
    sed -i '' "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.paired/registry/projects.json
else
    sed -i "s/\"installation_date\": null/\"installation_date\": \"$INSTALL_DATE\"/" ~/.paired/registry/projects.json
fi

# Create global memory system
echo -e "${BLUE}🧠 Initializing global memory...${NC}"
cat > ~/.paired/memory/global_knowledge.md << 'EOF'
# PAIRED Global Knowledge Base

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
cat > ~/.paired/bin/paired-status << 'EOF'
#!/bin/bash
# Check if in PAIRED project, show project status; otherwise show global status
if [ -f ".pairedrules" ] || [ -d ".paired" ]; then
    exec "$HOME/.paired/scripts/status.sh" "$@"
else
    exec "$HOME/.paired/scripts/global-status.sh" "$@"
fi
EOF

cat > ~/.paired/bin/paired-init << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/init-project.sh" "$@"
EOF

cat > ~/.paired/bin/paired-verify << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/verify-shell-integration.sh" "$@"
EOF

cat > ~/.paired/bin/paired-global << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/global-manager.sh" "$@"
EOF

cat > ~/.paired/bin/paired-sync << 'EOF'
#!/bin/bash
exec "$HOME/.paired/scripts/knowledge-sync.sh" "$@"
EOF

chmod +x ~/.paired/bin/*

# Make all scripts executable
find ~/.paired -name "*.sh" -exec chmod +x {} \;

# Set proper permissions for write protection while preserving execute
echo -e "${BLUE}🔒 Setting proper file permissions...${NC}"
# Make directories readable and executable, files readable
find ~/.paired -type d -exec chmod 755 {} \;
find ~/.paired -type f -exec chmod 644 {} \;
# Restore execute permissions for scripts and binaries
find ~/.paired -name "*.sh" -exec chmod 755 {} \;
find ~/.paired/bin -type f -exec chmod 755 {} \;

# Make JavaScript and Python scripts in scripts/ and templates/ executable
find ~/.paired -name "*.js" -path "*/scripts/*" -exec chmod 755 {} \;
find ~/.paired -name "*.js" -path "*/templates/*" -exec chmod 755 {} \;
find ~/.paired -name "*.py" -path "*/scripts/*" -exec chmod 755 {} \;
find ~/.paired -name "*.py" -path "*/templates/*" -exec chmod 755 {} \;
echo "✅ JavaScript and Python scripts made executable"

# Ensure critical writable directories have proper permissions for runtime
if [ -d ~/.paired/memory ]; then
    chmod -R 755 ~/.paired/memory/
    echo "✅ Memory directory set to writable (755)"
fi
if [ -d ~/.paired/registry ]; then
    chmod -R 755 ~/.paired/registry/
    echo "✅ Registry directory set to writable (755)"
fi
if [ -d ~/.paired/cache ]; then
    chmod -R 755 ~/.paired/cache/
    echo "✅ Cache directory set to writable (755)"
fi

# Create runtime directories that paired-start needs
mkdir -p ~/.paired/pids ~/.paired/logs
chmod 755 ~/.paired/pids ~/.paired/logs
echo "✅ Runtime directories (pids, logs) created with proper permissions"

# Create global Windsurf rules for auto-onboarding
echo -e "${BLUE}🎯 Setting up global auto-onboarding...${NC}"
cat > ~/.pairedrules << 'EOF'
---
description: PAIRED Global Auto-Detection and Onboarding
globs: **/*
alwaysApply: true
---

# PAIRED Auto-Detection System
# This file enables intelligent project onboarding when Windsurf opens directories

## Detection Logic:
1. **Development Indicators**: Check for .git, package.json, requirements.txt, etc.
2. **PAIRED Status**: Check if PAIRED is already installed (.paired/ or .pairedrules)
3. **User Preferences**: Respect auto-onboard settings from global config
4. **Smart Prompts**: Context-aware installation offers

## Auto-Onboarding Rules:
- If development project + no PAIRED → Offer installation
- If PAIRED detected but not initialized → Offer setup
- If PAIRED update available → Offer upgrade
- Respect user preferences (auto-install, never ask, etc.)

## Commands Available After Detection:
- `paired-init` - Initialize PAIRED in current project
- `paired-status` - Check project/global status
- `paired-global registry` - View all PAIRED projects
- `paired-sync` - Sync knowledge between global/local

*This global configuration enables seamless PAIRED onboarding across all projects*
EOF

# Add to shell configuration (handle BOTH .bashrc AND .zshrc for maximum compatibility)
echo -e "${BLUE}🐚 Configuring shell aliases for all shells...${NC}"

# Function to add PAIRED configuration to a shell RC file
add_paired_to_shell() {
    local rc_file="$1"
    local shell_name="$2"
    
    if [ -f "$rc_file" ]; then
        if ! grep -q "PAIRED (Platform for AI-Enabled Remote Development)" "$rc_file" 2>/dev/null; then
            echo -e "${BLUE}📝 Adding PAIRED to $rc_file ($shell_name)...${NC}"
            echo "" >> "$rc_file"
            echo "# 🤝 PAIRED (Platform for AI-Enabled Remote Development) Installer" >> "$rc_file"
            echo "export PATH=\"\$HOME/.paired/bin:\$PATH\"" >> "$rc_file"
            echo "source ~/.paired/aliases.sh" >> "$rc_file"
            
            # Warn about conflicts
            if grep -q "windsurf/aliases.sh" "$rc_file" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Warning: Found old Windsurf aliases in $rc_file${NC}"
                echo -e "${YELLOW}💡 Consider removing old Windsurf alias sources to avoid conflicts${NC}"
            fi
            echo -e "${GREEN}✅ PAIRED configured in $rc_file${NC}"
        else
            echo -e "${GREEN}✅ PAIRED already configured in $rc_file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  $rc_file not found, creating it...${NC}"
        touch "$rc_file"
        echo "# PAIRED (Platform for AI-Enabled Remote Development) - Global Architecture" >> "$rc_file"
        echo "export PATH=\"\$HOME/.paired/bin:\$PATH\"" >> "$rc_file"
        echo "source ~/.paired/aliases.sh" >> "$rc_file"
        echo -e "${GREEN}✅ Created and configured $rc_file${NC}"
    fi
}

# Configure both bash and zsh (ensures aliases work regardless of shell)
add_paired_to_shell "$HOME/.bashrc" "bash"
add_paired_to_shell "$HOME/.zshrc" "zsh"

# Also handle the detected shell RC if it's different
if [ -n "$SHELL_RC" ] && [ "$SHELL_RC" != "$HOME/.bashrc" ] && [ "$SHELL_RC" != "$HOME/.zshrc" ]; then
    add_paired_to_shell "$SHELL_RC" "detected shell"
fi

# Load PAIRED for current session
echo -e "${BLUE}🚀 Loading PAIRED for current session...${NC}"
export PATH="$HOME/.paired/bin:$PATH"
source ~/.paired/aliases.sh 2>/dev/null || true

# Note: aliases.sh is a template file and will be set up during paired-init
# For Claude integration, aliases are not needed

# Verification
echo ""
echo -e "${BLUE}🔍 Verifying installation...${NC}"

VERIFICATION_FAILED=false

# Essential components verification
if [ ! -f ~/.paired/scripts/install.sh ]; then
    echo -e "${RED}❌ Missing: install.sh${NC}"
    VERIFICATION_FAILED=true
fi

if [ ! -f ~/.paired/bin/paired ]; then
    echo -e "${RED}❌ Missing: paired executable${NC}"
    VERIFICATION_FAILED=true
fi

if [ ! -d ~/.paired/templates ]; then
    echo -e "${RED}❌ Missing: templates directory${NC}"
    VERIFICATION_FAILED=true
fi

# Verify core components were copied
CORE_FILES=$(find ~/.paired/core -name "*.js" 2>/dev/null | wc -l)
if [ "$CORE_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ Core components installed ($CORE_FILES files)${NC}"
else
    echo -e "${YELLOW}⚠️ No core component files found${NC}"
fi

# Verify new file structure was copied
LIB_FILES=$(find ~/.paired/lib -name "*.js" 2>/dev/null | wc -l)
if [ "$LIB_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ Library components installed ($LIB_FILES files)${NC}"
else
    echo -e "${YELLOW}⚠️ No library component files found${NC}"
fi

BIN_FILES=$(find ~/.paired/bin -type f 2>/dev/null | wc -l)
if [ "$BIN_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ Binary executables installed ($BIN_FILES files)${NC}"
else
    echo -e "${YELLOW}⚠️ No binary executable files found${NC}"
fi

CONFIG_FILES=$(find ~/.paired/config -name "*.js" -o -name "*.json" -o -name "*.yml" 2>/dev/null | wc -l)
if [ "$CONFIG_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ Configuration files installed ($CONFIG_FILES files)${NC}"
else
    echo -e "${YELLOW}⚠️ No configuration files found${NC}"
fi

if [ "$VERIFICATION_FAILED" = true ]; then
    echo -e "${RED}❌ Installation verification failed${NC}"
    echo "Missing essential components. Please check the installation."
    # Track failed installation
    if [ -f "$HOME/.paired/monitoring/track-installation.sh" ]; then
        "$HOME/.paired/monitoring/track-installation.sh" failure "${VERSION:-unknown}"
    fi
    exit 1
else
    echo -e "${GREEN}✅ PAIRED Global Architecture installed successfully!${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Welcome to PAIRED 2.0!${NC}"
echo "========================"
echo -e "${CYAN}🌍 Global Commands:${NC}"
echo "   • paired-global registry  - View all PAIRED projects"
echo "   • paired-global status    - Global system status"
echo "   • paired-sync            - Sync knowledge"
echo ""
echo -e "${CYAN}📁 Project Commands:${NC}"
echo "   • paired-init            - Initialize PAIRED in project"
echo "   • paired-status          - Project/global status"
echo "   • paired-verify          - Verify installation"
echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo "   1. Open any project in Windsurf - auto-onboarding will activate"
echo "   2. Or manually run 'paired-init' in a project directory"
echo "   3. Use 'paired-global registry' to see all your PAIRED projects"
# Auto-backup existing memories before fresh install
if [ -f "$SCRIPT_DIR/memory-backup.sh" ] && [ -d ~/.paired ]; then
    echo -e "${BLUE}💾 Backing up existing memories...${NC}"
    bash "$SCRIPT_DIR/memory-backup.sh" auto-backup
fi

# Configure production .codeiumignore by default
echo -e "${BLUE}🔒 Configuring secure defaults...${NC}"
if [ -f "$SCRIPT_DIR/../config/production.codeiumignore" ]; then
    cp "$SCRIPT_DIR/../config/production.codeiumignore" ~/.paired/.codeiumignore
    echo -e "${GREEN}✅ Production .codeiumignore installed (secure defaults)${NC}"
fi

# Skip auto-locking for now - can be enabled manually with 'paired-lock lock'

# Set up VS Code auto-start configuration
echo -e "${BLUE}🔧 Setting up VS Code auto-start configuration...${NC}"
setup_vscode_autostart() {
    local project_dir="$1"
    
    if [ -d "$project_dir" ]; then
        echo -e "${BLUE}📁 Setting up VS Code auto-start for: $project_dir${NC}"
        
        # Create .vscode directory
        mkdir -p "$project_dir/.vscode"
        
        # Copy VS Code templates if they exist (now in config/templates/vscode/)
        if [ -f "$SCRIPT_DIR/../config/templates/vscode/vscode-tasks-template.json" ]; then
            cp "$SCRIPT_DIR/../config/templates/vscode/vscode-tasks-template.json" "$project_dir/.vscode/tasks.json"
            echo -e "${GREEN}✅ VS Code tasks.json configured${NC}"
        elif [ -f "$SCRIPT_DIR/../templates/vscode/vscode-tasks-template.json" ]; then
            cp "$SCRIPT_DIR/../templates/vscode/vscode-tasks-template.json" "$project_dir/.vscode/tasks.json"
            echo -e "${GREEN}✅ VS Code tasks.json configured (legacy path)${NC}"
        elif [ -f "$SCRIPT_DIR/../templates/vscode-tasks-template.json" ]; then
            cp "$SCRIPT_DIR/../templates/vscode-tasks-template.json" "$project_dir/.vscode/tasks.json"
            echo -e "${GREEN}✅ VS Code tasks.json configured (legacy path)${NC}"
        fi
        
        # Copy CASCADE config template (now in config/templates/)
        if [ -f "$SCRIPT_DIR/../config/templates/cascade-config-template.js" ]; then
            cp "$SCRIPT_DIR/../config/templates/cascade-config-template.js" "$project_dir/.cascade_config.js"
            echo -e "${GREEN}✅ CASCADE config template configured${NC}"
        elif [ -f "$SCRIPT_DIR/../templates/cascade-config-template.js" ]; then
            cp "$SCRIPT_DIR/../templates/cascade-config-template.js" "$project_dir/.cascade_config.js"
            echo -e "${GREEN}✅ CASCADE config template configured (legacy path)${NC}"
        fi
        
        if [ -f "$SCRIPT_DIR/../config/templates/vscode/vscode-settings-template.json" ]; then
            cp "$SCRIPT_DIR/../config/templates/vscode/vscode-settings-template.json" "$project_dir/.vscode/settings.json"
            echo -e "${GREEN}✅ VS Code settings.json configured${NC}"
        elif [ -f "$SCRIPT_DIR/../templates/vscode/vscode-settings-template.json" ]; then
            cp "$SCRIPT_DIR/../templates/vscode/vscode-settings-template.json" "$project_dir/.vscode/settings.json"
            echo -e "${GREEN}✅ VS Code settings.json configured (legacy path)${NC}"
        elif [ -f "$SCRIPT_DIR/../templates/vscode-settings-template.json" ]; then
            cp "$SCRIPT_DIR/../templates/vscode-settings-template.json" "$project_dir/.vscode/settings.json"
            echo -e "${GREEN}✅ VS Code settings.json configured (legacy path)${NC}"
        fi
        
        echo -e "${CYAN}💡 VS Code auto-start configured! Bridge will start automatically when you open this project.${NC}"
    fi
}

# Set up auto-start for current directory if it looks like a project
if [ -f "package.json" ] || [ -f ".git/config" ] || [ -f "README.md" ]; then
    setup_vscode_autostart "$(pwd)"
fi
echo -e "${BLUE}💡 Directory locking available via 'paired-lock lock' command${NC}"

# Auto-restore memories after fresh install
if [ -f "$SCRIPT_DIR/memory-backup.sh" ]; then
    echo -e "${BLUE}🔄 Checking for preserved memories...${NC}"
    
    # Check if backups exist
    if [ -d "$HOME/.backup-paired" ] && [ -n "$(ls -A "$HOME/.backup-paired" 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Memory backups found - restoring automatically${NC}"
        bash "$SCRIPT_DIR/memory-backup.sh" auto-restore
    else
        echo -e "${YELLOW}💡 No memory backups found - starting fresh${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Memory backup system not available${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Global config: ~/.pairedrules enables auto-detection${NC}"
echo -e "${CYAN}🔒 Directory locking: Use 'paired-lock lock/unlock' to manage protection${NC}"
echo -e "${YELLOW}💾 Memory backup system: 'memory-backup.sh help' for manual backup/restore${NC}"
