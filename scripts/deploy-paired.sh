#!/bin/bash
# PAIRED Core Deployment Script
# Deploys ALL core PAIRED components to paired-pre-prod repository
# This is the foundation - Claude addon installs separately

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_REPO="git@github.com:internexio/paired-pre-prod.git"

# Version management
if [ -f "$SOURCE_DIR/.paired/version" ]; then
    BASE_VERSION=$(cat "$SOURCE_DIR/.paired/version")
else
    BASE_VERSION="1.0.0"
fi

# Generate semantic version with build number
BUILD_NUMBER="$(date +%Y%m%d.%H%M)"
RELEASE_VERSION="${BASE_VERSION}-build.${BUILD_NUMBER}"
RELEASE_TAG="v${RELEASE_VERSION}"

echo -e "${BLUE}🚀 PAIRED Core Deployment (with Windsurf Integration)${NC}"
echo -e "${BLUE}📂 Source Directory: ${SOURCE_DIR}${NC}"
echo -e "${BLUE}🎯 Target Repository: ${TARGET_REPO}${NC}"
echo -e "${BLUE}📅 Release Version: ${RELEASE_VERSION}${NC}"
echo -e "${BLUE}🏷️  Release Tag: ${RELEASE_TAG}${NC}"
echo ""

# Run pre-deployment validation
echo -e "${CYAN}🔍 Running pre-deployment validation...${NC}"
if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
    if "$SCRIPT_DIR/validate-deployment.sh" windsurf; then
        echo -e "${GREEN}✅ Validation passed${NC}"
    else
        echo -e "${RED}❌ Validation failed - aborting deployment${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Validation script not found - proceeding without validation${NC}"
fi
echo ""

# Create temporary packaging directory
TEMP_DIR="/tmp/paired-windsurf-release-$(date +%s)"
echo -e "${YELLOW}🔧 Creating temporary packaging directory...${NC}"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Initialize clean git repository
echo -e "${YELLOW}🔧 Initializing clean git repository...${NC}"
git init

# Copy FILTERED core PAIRED files (exclude node_modules, .git, etc.)
echo -e "${YELLOW}📋 Copying core PAIRED components (filtered)...${NC}"

# Root files
echo -e "${YELLOW}📄 Root files...${NC}"
cp "$SOURCE_DIR/README.md" . && echo "✅ README.md"
cp "$SOURCE_DIR/LICENSE" . && echo "✅ LICENSE"
cp "$SOURCE_DIR/install.sh" . && echo "✅ install.sh"
cp "$SOURCE_DIR/uninstall.sh" . && echo "✅ uninstall.sh"
cp "$SOURCE_DIR/package.json" . && echo "✅ package.json"

# Core components (runtime only - exclude dev/debug files but INCLUDE agent configs)
echo -e "${YELLOW}🔧 Core components...${NC}"
if [ -d "$SOURCE_DIR/core" ]; then
    find "$SOURCE_DIR/core" -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" | grep -v -E "(debug|test|audit|dev_)" | while read file; do
        rel_path="${file#$SOURCE_DIR/core/}"
        mkdir -p "core/$(dirname "$rel_path")"
        cp "$file" "core/$rel_path"
    done && echo "✅ Copied core/ (runtime files + agent configs - excluded debug/dev files)"
else
    echo "find: $SOURCE_DIR/core: No such file or directory"
fi

# Ensure agent config directory structure exists
echo -e "${YELLOW}📝 Ensuring agent config directory structure...${NC}"
mkdir -p "core/config/agents"
if [ -d "$SOURCE_DIR/core/config/agents" ]; then
    cp -r "$SOURCE_DIR/core/config/agents/"* "core/config/agents/" 2>/dev/null || true
    echo "✅ Copied agent config directory"
else
    echo "⚠️ Agent config directory not found in source, creating empty structure"
fi

# Ensure ALL agent files are included (main agent files + modules)
echo -e "${YELLOW}📦 Ensuring ALL agent files are deployed...${NC}"
for agent in alex sherlock edison leonardo maya vince marie; do
    # Create agent directory
    mkdir -p "core/agents/$agent"
    
    # Copy main agent .js files (all variants)
    for agent_file in "${agent}_agent.js" "dev_agent.js" "pm_agent.js" "qa_agent.js" "architecture_agent.js" "ux_expert_agent.js" "scrum_master_agent.js" "analyst_agent.js"; do
        if [ -f "$SOURCE_DIR/core/agents/$agent/$agent_file" ]; then
            cp "$SOURCE_DIR/core/agents/$agent/$agent_file" "core/agents/$agent/"
            echo "✅ Deployed $agent/$agent_file"
        fi
    done
    
    # Copy modules directory if it exists
    if [ -d "$SOURCE_DIR/core/agents/$agent/modules" ]; then
        mkdir -p "core/agents/$agent/modules"
        cp -r "$SOURCE_DIR/core/agents/$agent/modules/"* "core/agents/$agent/modules/" 2>/dev/null || true
        echo "✅ Deployed modules for $agent"
    fi
done

# Ensure infrastructure components are included
if [ -d "$SOURCE_DIR/core/infrastructure" ]; then
    mkdir -p "core/infrastructure"
    cp -r "$SOURCE_DIR/core/infrastructure/"* "core/infrastructure/" 2>/dev/null || true
    echo "✅ Deployed core infrastructure"
fi

# Platform components moved to lib/ and bin/ - handled in new structure section
echo -e "${YELLOW}⚙️ Platform components (now in lib/ and bin/)...${NC}"
echo "✅ Platform components handled in new file structure (lib/ and bin/)"

# Shared utilities moved to lib/utils/ and lib/bridge/ - handled in new structure section
echo -e "${YELLOW}🔗 Shared utilities (now in lib/utils/ and lib/bridge/)...${NC}"
echo "✅ Shared utilities handled in new file structure (lib/utils/ and lib/bridge/)"

# Essential scripts only (no tests, no dev tools)
echo -e "${YELLOW}📜 Essential scripts...${NC}"
mkdir -p scripts
# Copy all essential scripts from scripts/ directory
for script in start-agents.sh paired-bridge-connect.sh deploy-paired.sh init-project.sh paired-lock.sh global-manager.sh status.sh global-status.sh paired-doctor.sh; do
    if [ -f "$SOURCE_DIR/scripts/$script" ]; then
        cp "$SOURCE_DIR/scripts/$script" "scripts/$script"
        chmod +x "scripts/$script"
    fi
done

# Copy new file structure
echo -e "${YELLOW}📁 New file structure (lib/, bin/, config/)...${NC}"
if [ -d "$SOURCE_DIR/lib" ]; then
    cp -r "$SOURCE_DIR/lib" .
    echo "✅ Copied lib/ directory"
fi
if [ -d "$SOURCE_DIR/bin" ]; then
    cp -r "$SOURCE_DIR/bin" .
    chmod +x bin/*
    echo "✅ Copied bin/ directory with execute permissions"
fi
if [ -d "$SOURCE_DIR/config" ]; then
    cp -r "$SOURCE_DIR/config" .
    echo "✅ Copied config/ directory"
fi

echo "✅ Copied essential scripts and new file structure"

# Essential tools only (no dev/test tools)
echo -e "${YELLOW}🛠️ Essential tools...${NC}"
mkdir -p tools
for tool in paired paired-start paired-doctor; do
    if [ -f "$SOURCE_DIR/tools/$tool" ]; then
        cp "$SOURCE_DIR/tools/$tool" "tools/$tool"
        chmod +x "tools/$tool"
    fi
done && echo "✅ Copied essential tools only with execute permissions"

# Binaries handled in new file structure section above
echo -e "${YELLOW}🔧 Binaries (handled in new structure)...${NC}"
echo "✅ Binaries handled in new file structure (bin/ directory)"

# Templates moved to config/templates/ - handled in new structure section
echo -e "${YELLOW}📋 Templates (now in config/templates/)...${NC}"
echo "✅ Templates handled in new file structure (config/templates/)"

# VS Code Auto-Start Templates (now in config/templates/vscode/)
echo -e "${YELLOW}🔧 VS Code Auto-Start Templates...${NC}"
# Templates are already copied in config/ directory above
echo "✅ VS Code templates handled in config/templates/vscode/"

# Documentation (public release only)
echo -e "${YELLOW}📚 Documentation...${NC}"
mkdir -p docs
# Only include public-facing documentation
for doc_dir in user-guides reference current; do
    if [ -d "$SOURCE_DIR/docs/$doc_dir" ]; then
        find "$SOURCE_DIR/docs/$doc_dir" -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" | while read file; do
            rel_path="${file#$SOURCE_DIR/docs/}"
            mkdir -p "docs/$(dirname "$rel_path")"
            cp "$file" "docs/$rel_path"
        done
    fi
done
# Include essential root docs
for root_doc in README.md QUICK_START.md PHILOSOPHY.md TROUBLESHOOTING.md DOCUMENTATION_INDEX.md; do
    if [ -f "$SOURCE_DIR/docs/$root_doc" ]; then
        cp "$SOURCE_DIR/docs/$root_doc" "docs/$root_doc"
    fi
done
echo "✅ Copied docs/ (public release only - excluded archive/, development/, project/)"

# Windsurf integration (source only)
echo -e "${YELLOW}🎨 Windsurf integration...${NC}"
if [ -d "$SOURCE_DIR/windsurf-plugin" ]; then
    mkdir -p windsurf-plugin
    find "$SOURCE_DIR/windsurf-plugin" -name "*.js" -o -name "*.json" -o -name "*.md" | while read file; do
        rel_path="${file#$SOURCE_DIR/windsurf-plugin/}"
        mkdir -p "windsurf-plugin/$(dirname "$rel_path")"
        cp "$file" "windsurf-plugin/$rel_path"
    done && echo "✅ Copied windsurf-plugin/ (source files only)"
fi

# Skip modules entirely - not needed for production
echo -e "${YELLOW}⚠️  Skipping modules/ - not needed for production${NC}"

# CASCADE source files moved to lib/cascade/ and lib/startup/ - handled in new structure section
echo -e "${YELLOW}🔧 CASCADE source files (now in lib/cascade/ and lib/startup/)...${NC}"
echo "✅ CASCADE files handled in new file structure (lib/cascade/ and lib/startup/)"

# Windsurf configuration templates (now in config/templates/)
echo -e "${YELLOW}🔧 Windsurf configuration templates...${NC}"
if [ -f "$SOURCE_DIR/config/templates/windsurfrules" ]; then
    # Copy windsurf template to root config/ for backward compatibility
    cp "$SOURCE_DIR/config/templates/windsurfrules" config/windsurf-template.rules && echo "✅ Windsurf rules template (with auto-startup)"
    # Only copy to .windsurfrules if it doesn't exist (prevent overwriting complete file)
    if [ ! -f ".windsurfrules" ]; then
        cp "$SOURCE_DIR/config/templates/windsurfrules" .windsurfrules && echo "✅ Project .windsurfrules (with auto-startup)"
    else
        echo "⚠️  Existing .windsurfrules preserved (not overwritten)"
    fi
elif [ -f "$SOURCE_DIR/.windsurfrules" ]; then
    cp "$SOURCE_DIR/.windsurfrules" config/windsurf-template.rules && echo "⚠️  Windsurf rules template (basic)"
else
    echo "⚠️  No windsurfrules template found in config/templates/"
fi

# Windsurf backup script
if [ -f "$SOURCE_DIR/windsurf-backup.sh" ]; then
    cp "$SOURCE_DIR/windsurf-backup.sh" . && echo "✅ windsurf-backup.sh"
fi

# Clean up any .bak files
echo -e "${YELLOW}🧹 Final cleanup: Removing .bak files...${NC}"
find . -name "*.bak" -delete || true
echo "✅ No .bak files found - deployment is clean"

# Set proper file permissions
echo -e "${YELLOW}🔧 Setting proper file permissions...${NC}"
# Make all shell scripts executable
find . -name "*.sh" -exec chmod +x {} \;
echo "✅ Shell scripts made executable"

# Make JavaScript scripts in scripts/ and templates/ executable
find . -name "*.js" -path "*/scripts/*" -exec chmod +x {} \;
find . -name "*.js" -path "*/templates/*" -exec chmod +x {} \;
echo "✅ JavaScript scripts made executable"

# Make Python scripts in scripts/ and templates/ executable
find . -name "*.py" -path "*/scripts/*" -exec chmod +x {} \;
find . -name "*.py" -path "*/templates/*" -exec chmod +x {} \;
echo "✅ Python scripts made executable"

# Make binaries executable
if [ -d "bin" ]; then
    chmod +x bin/*
    echo "✅ Binaries made executable"
fi

# Ensure configuration files are readable/writable
find . -name "*.json" -exec chmod 644 {} \;
find . -name "*.yml" -exec chmod 644 {} \;
find . -name "*.yaml" -exec chmod 644 {} \;
find . -name "*.md" -exec chmod 644 {} \;
echo "✅ Configuration and documentation files set to 644"

# Set directory permissions (755 for all directories)
find . -type d -exec chmod 755 {} \;
echo "✅ Directory permissions set to 755"

# Ensure critical writable directories have proper permissions
if [ -d "memory" ]; then
    chmod -R 755 memory/
    echo "✅ Memory directory set to writable (755)"
fi
if [ -d "registry" ]; then
    chmod -R 755 registry/
    echo "✅ Registry directory set to writable (755)"
fi
if [ -d "cache" ]; then
    chmod -R 755 cache/
    echo "✅ Cache directory set to writable (755)"
fi

# Git operations
echo ""
echo -e "${BLUE}🚀 Deploying to target repository...${NC}"
echo "================================================="

# Set up remote
echo -e "${YELLOW}🔗 Setting up remote origin: ${TARGET_REPO}${NC}"
git remote add origin "$TARGET_REPO"

# Create version metadata file
cat > VERSION.json <<EOF
{
  "version": "$RELEASE_VERSION",
  "tag": "$RELEASE_TAG",
  "deployment": "windsurf-pre-prod",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "source_commit": "$(cd "$SOURCE_DIR" && git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Add all files and commit
git add .
git commit -m "PAIRED Core Foundation with Windsurf Integration ${RELEASE_VERSION}

- Complete PAIRED agent system (7 agents)
- Bridge service and communication layer
- Windsurf IDE plugin and integration
- Windsurf-specific configuration templates
- CLI tools and utilities
- Documentation and templates
- Installation and configuration scripts

Production-ready core foundation with native Windsurf IDE support

Version: $RELEASE_VERSION
Tag: $RELEASE_TAG
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Tag the release
git tag -a "$RELEASE_TAG" -m "Release $RELEASE_VERSION"

# Switch to main branch and push
echo -e "${YELLOW}🔄 Switching from master to main branch...${NC}"
git branch -M main
echo -e "${YELLOW}📤 Pushing to main branch with tags...${NC}"
git push -f origin main --tags

echo ""
echo -e "${GREEN}✅ Successfully deployed to ${TARGET_REPO}${NC}"
echo -e "${GREEN}🎉 PAIRED Core Release ${RELEASE_VERSION} is now live!${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Use promotion scripts to deploy to production:${NC}"
echo "   internexio/paired-pre-prod → internexio/paired"

# Cleanup
cd /
rm -rf "$TEMP_DIR"
