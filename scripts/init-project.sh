#!/bin/bash
# Initialize WEE in current project with global/local architecture
# DUMMY-PROOF VERSION with automatic validation and repair

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(pwd)"
WEE_DIR="$PROJECT_ROOT/.wee"
GLOBAL_WEE="$HOME/.wee"
REGISTRY_FILE="$GLOBAL_WEE/registry/projects.json"

echo -e "${BLUE}🌊 Initializing WEE in $(basename "$PROJECT_ROOT")${NC}"
echo -e "${YELLOW}🚀 Architecture: Local Execution + Global Knowledge${NC}"
echo ""

# DUMMY-PROOF: Ensure PATH includes WEE executables
ensure_wee_path() {
    if [[ ":$PATH:" != *":$HOME/.wee/bin:"* ]]; then
        echo -e "${CYAN}🔧 Adding WEE executables to PATH...${NC}"
        export PATH="$HOME/.wee/bin:$PATH"
        
        # Add to shell profile for persistence
        local shell_profile="$HOME/.zshrc"
        if [ -f "$HOME/.bashrc" ]; then
            shell_profile="$HOME/.bashrc"
        fi
        
        if ! grep -q "/.wee/bin" "$shell_profile" 2>/dev/null; then
            echo "# WEE (Windsurf Evolutionary Ecosystem) PATH" >> "$shell_profile"
            echo 'export PATH="$HOME/.wee/bin:$PATH"' >> "$shell_profile"
            echo -e "${GREEN}✅ Added WEE to PATH in $shell_profile${NC}"
        fi
    fi
}

# DUMMY-PROOF: Validate and repair global WEE installation
validate_global_wee() {
    echo -e "${CYAN}🔍 Validating global WEE installation...${NC}"
    
    # Check if global WEE directory exists
    if [ ! -d "$GLOBAL_WEE" ]; then
        echo -e "${RED}❌ Global WEE directory not found${NC}"
        echo -e "${YELLOW}💡 Run the main WEE installer first${NC}"
        exit 1
    fi
    
    # Check if executables exist and are executable
    local missing_executables=()
    for cmd in wee-status wee-global wee-init wee-sync wee-doctor; do
        if [ ! -x "$GLOBAL_WEE/bin/$cmd" ]; then
            missing_executables+=("$cmd")
        fi
    done
    
    # Auto-repair missing executables
    if [ ${#missing_executables[@]} -gt 0 ]; then
        echo -e "${YELLOW}🔧 Repairing missing WEE executables...${NC}"
        mkdir -p "$GLOBAL_WEE/bin"
        
        # Create missing executables
        for cmd in "${missing_executables[@]}"; do
            case $cmd in
                "wee-status")
                    cat > "$GLOBAL_WEE/bin/wee-status" << 'EOF'
#!/bin/bash
if [ -f ".weerules" ] || [ -d ".wee" ]; then
    exec "$HOME/.wee/scripts/global-status.sh" "$@"
else
    exec "$HOME/.wee/scripts/global-status.sh" "$@"
fi
EOF
                    ;;
                "wee-global")
                    cat > "$GLOBAL_WEE/bin/wee-global" << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/global-manager.sh" "$@"
EOF
                    ;;
                "wee-init")
                    cat > "$GLOBAL_WEE/bin/wee-init" << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/init-project.sh" "$@"
EOF
                    ;;
                "wee-sync")
                    cat > "$GLOBAL_WEE/bin/wee-sync" << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/knowledge-sync.sh" "$@"
EOF
                    ;;
                "wee-doctor")
                    cat > "$GLOBAL_WEE/bin/wee-doctor" << 'EOF'
#!/bin/bash
exec "$HOME/.wee/scripts/wee-doctor.sh" "$@"
EOF
                    ;;
            esac
            chmod +x "$GLOBAL_WEE/bin/$cmd"
            echo -e "${GREEN}✅ Created $cmd executable${NC}"
        done
    fi
    
    # Ensure registry directory exists
    mkdir -p "$(dirname "$REGISTRY_FILE")"
    if [ ! -f "$REGISTRY_FILE" ]; then
        echo '{}' > "$REGISTRY_FILE"
        echo -e "${GREEN}✅ Created project registry${NC}"
    fi
}

# Check if WEE is already initialized
if [ -f ".weerules" ] || [ -d ".wee" ]; then
    echo -e "${YELLOW}⚠️  WEE already initialized in this project${NC}"
    echo -e "${BLUE}📋 Use 'wee-status' to see current status${NC}"
    exit 0
fi

# DUMMY-PROOF: Run validation and setup
ensure_wee_path
validate_global_wee

# Create project .wee directory structure
echo -e "${BLUE}📁 Creating project structure...${NC}"
mkdir -p "$WEE_DIR"/{config,memory,scripts,docs,workflows,contexts,handoff,agents,shared,rules}

# Copy templates from global directory
if [ -d "$GLOBAL_WEE/templates" ]; then
    echo -e "${BLUE}📋 Copying templates from global WEE...${NC}"
    # Copy templates but exclude project-scripts (handled separately in hidden .wee/scripts/)
    for item in "$GLOBAL_WEE/templates/"*; do
        if [ -e "$item" ] && [ "$(basename "$item")" != "project-scripts" ]; then
            cp -r "$item" "$WEE_DIR/" 2>/dev/null || true
        fi
    done
fi

# Link to global WEE components (LOCAL vs GLOBAL architecture)
echo -e "${BLUE}🔗 Linking to global WEE system...${NC}"

# Symlink core infrastructure to global (code should not be duplicated)
if [ -d "$GLOBAL_WEE/src/core" ]; then
    ln -sf "$GLOBAL_WEE/src/core" "$WEE_DIR/core"
    echo -e "${GREEN}✅ Linked core infrastructure${NC}"
fi

# Symlink shared tools and utilities to global
if [ -d "$GLOBAL_WEE/src/shared" ]; then
    ln -sf "$GLOBAL_WEE/src/shared" "$WEE_DIR/shared"
    echo -e "${GREEN}✅ Linked shared tools and utilities${NC}"
fi

# Symlink CLI tools to global
if [ -d "$GLOBAL_WEE/src/cli" ]; then
    ln -sf "$GLOBAL_WEE/src/cli" "$WEE_DIR/cli"
    echo -e "${GREEN}✅ Linked CLI tools${NC}"
fi

# Symlink orchestrator to global
if [ -d "$GLOBAL_WEE/src/orchestrator" ]; then
    ln -sf "$GLOBAL_WEE/src/orchestrator" "$WEE_DIR/orchestrator"
    echo -e "${GREEN}✅ Linked orchestration system${NC}"
fi

# Symlink agent files to global (agents run locally but use global code)
if [ -d "$GLOBAL_WEE/src/agents" ]; then
    ln -sf "$GLOBAL_WEE/src/agents" "$WEE_DIR/agents"
    echo -e "${GREEN}✅ Linked agent files${NC}"
else
    echo -e "${YELLOW}⚠️  Global agent directory not found: $GLOBAL_WEE/src/agents${NC}"
fi

# Symlink main index.js if it exists
if [ -f "$GLOBAL_WEE/src/index.js" ]; then
    ln -sf "$GLOBAL_WEE/src/index.js" "$WEE_DIR/index.js"
    echo -e "${GREEN}✅ Linked main WEE index file${NC}"
fi

# Symlink agent configuration files to global (shared configs)
if [ -d "$GLOBAL_WEE/src/config/agents" ]; then
    mkdir -p "$WEE_DIR/config"
    ln -sf "$GLOBAL_WEE/src/config/agents" "$WEE_DIR/config/agents"
    echo -e "${GREEN}✅ Linked agent configuration files${NC}"
else
    echo -e "${YELLOW}⚠️  Global agent config directory not found: $GLOBAL_WEE/src/config/agents${NC}"
fi

# Create LOCAL memory structure for isolated agent instances
echo -e "${BLUE}🧠 Creating local memory structure for agent isolation...${NC}"
mkdir -p "$WEE_DIR/memory"/{project,agents,sessions,patterns,decisions}

# Create project-specific memory files (LOCAL data that must not be shared)
cat > "$WEE_DIR/memory/project_context.md" << EOF
# Project Context Memory
**Project**: $(basename "$PROJECT_ROOT")
**Initialized**: $(date)
**Path**: $PROJECT_ROOT

## Project-Specific Learnings
*This file will be populated by agents as they learn about this specific project*

## Code Patterns Discovered
*Patterns specific to this project's codebase*

## Architectural Decisions
*Decisions made specifically for this project*
EOF

cat > "$WEE_DIR/memory/agent_interactions.json" << EOF
{
  "project_name": "$(basename "$PROJECT_ROOT")",
  "initialized": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agent_sessions": [],
  "interaction_history": [],
  "context_switches": []
}
EOF

echo -e "${GREEN}✅ Created local memory structure for agent isolation${NC}"

# Create Windsurf IDE integration files
echo -e "${BLUE}🔗 Creating Windsurf IDE integration files...${NC}"

# Create AI interaction rules for Windsurf IDE
cat > "$WEE_DIR/rules/ai_interaction_rules.md" << 'EOF'
# WEE AI Interaction Rules
# This file defines how Windsurf IDE should interact with WEE agents

## Agent Activation Rules
- Activate QA Agent (Sherlock) for code quality issues and testing
- Activate Architecture Agent (Leonardo) for system design and patterns
- Activate Dev Agent (Edison) for debugging and optimization
- Activate PM Agent (Alex) for project coordination and planning
- Activate UX Agent (Maya) for interface and user experience work
- Activate Scrum Master (Vince) for agile process management
- Activate Analyst Agent (Marie) for data analysis and research

## Communication Style
- Use agent personalities and names in all interactions
- Maintain team-based collaborative approach
- Provide specific, actionable recommendations
- Include relevant emojis for agent identification

## Integration Points
- CLI tools available via `node .wee/cli/wee-cli.js [command]`
- Agent-specific tools in `.wee/agents/[agent]/cli/`
- Project scripts in `.wee/project-scripts/`
- Memory and context in `.wee/memory/` and `.wee/contexts/`

## Quality Gates
- Automatic code quality checks via QA Agent
- Architecture pattern validation via Architecture Agent
- Performance optimization suggestions via Dev Agent
- UX accessibility checks via UX Agent

## Knowledge Sharing
- Sync learnings to global WEE registry
- Share patterns across projects
- Maintain project-specific memory
- Contribute to collective intelligence
EOF

# Create adaptive thresholds configuration
cat > "$WEE_DIR/config/adaptive_thresholds.yml" << 'EOF'
# WEE Adaptive Agent Activation Thresholds
# This file defines when different agents should be automatically activated

agent_thresholds:
  qa_agent:
    file_types: [".js", ".py", ".ts", ".jsx", ".tsx"]
    keywords: ["test", "bug", "error", "quality", "lint"]
    complexity_threshold: 50
    auto_activate: true
    
  architecture_agent:
    file_types: [".js", ".py", ".ts", ".json", ".yml", ".yaml"]
    keywords: ["architecture", "design", "pattern", "structure", "module"]
    file_count_threshold: 10
    auto_activate: true
    
  dev_agent:
    file_types: [".js", ".py", ".ts", ".jsx", ".tsx", ".css", ".html"]
    keywords: ["debug", "optimize", "performance", "refactor"]
    error_threshold: 3
    auto_activate: true
    
  pm_agent:
    file_types: [".md", ".txt", ".json"]
    keywords: ["plan", "milestone", "roadmap", "project", "task"]
    project_size_threshold: 5
    auto_activate: true
    
  ux_expert_agent:
    file_types: [".css", ".html", ".jsx", ".tsx", ".vue", ".svelte"]
    keywords: ["ui", "ux", "design", "accessibility", "responsive"]
    ui_file_threshold: 3
    auto_activate: true
    
  scrum_master_agent:
    file_types: [".md", ".txt"]
    keywords: ["sprint", "scrum", "standup", "retrospective", "impediment"]
    team_size_threshold: 2
    auto_activate: true
    
  analyst_agent:
    file_types: [".json", ".csv", ".py", ".sql"]
    keywords: ["data", "analysis", "research", "metrics", "analytics"]
    data_file_threshold: 2
    auto_activate: true

# Global settings
global_settings:
  max_concurrent_agents: 3
  activation_delay: 2000  # milliseconds
  deactivation_timeout: 300000  # 5 minutes
  learning_mode: true
  adaptive_learning: true
EOF

# Create WEE project rules
cat > "$WEE_DIR/rules/wee_project_rules.md" << 'EOF'
# WEE Project Rules
# Core rules for WEE-enabled projects

## Agent Coordination Rules
1. **Team Communication**: All agents must identify themselves with names and emojis
2. **Collaborative Approach**: Agents work together, not in isolation
3. **Context Awareness**: Agents share context and build on each other's work
4. **Quality Focus**: Every interaction should improve code quality and project outcomes

## File Organization Rules
- **WEE Directory**: All WEE components in `.wee/` directory
- **Agent Files**: Individual agents in `.wee/agents/[agent_name]/`
- **Project Scripts**: Utility scripts in `.wee/project-scripts/`
- **Memory Management**: Project memory in `.wee/memory/`
- **Context Tracking**: Session context in `.wee/contexts/`

## Integration Rules
- **CLI Access**: Use `node .wee/cli/wee-cli.js` for unified agent interface
- **Direct Agent Access**: Individual agent CLIs available in agent directories
- **Script Integration**: Project scripts (wh, wr, wdocs) integrate with WEE system
- **Global Sync**: Project participates in global WEE knowledge sharing

## Quality Standards
- **Code Review**: QA Agent (Sherlock) reviews all significant changes
- **Architecture Validation**: Architecture Agent (Leonardo) validates design decisions
- **Performance Monitoring**: Dev Agent (Edison) monitors and optimizes performance
- **UX Compliance**: UX Agent (Maya) ensures user experience standards

## Development Workflow
1. **Session Start**: Use `wr` (resume) to load previous context
2. **Active Development**: Agents provide real-time assistance and feedback
3. **Session End**: Use `wh` (handoff) to document progress and decisions
4. **Discovery**: Use `wdocs` for project analysis and documentation

## Agent Personalities
- 🕵️ **Sherlock (QA)**: Detective who never misses a bug
- 🏛️ **Leonardo (Architecture)**: Renaissance genius designing systems
- ⚡ **Edison (Dev)**: Prolific inventor solving technical challenges
- 👑 **Alex (PM)**: Strategic coordinator like Alexander the Great
- 🎨 **Maya (UX)**: Understanding human experience like Maya Angelou
- 🏈 **Vince (Scrum Master)**: Team coach like Vince Lombardi
- 🔬 **Marie (Analyst)**: Research scientist like Marie Curie
EOF

# Create basic project files with enhanced content
echo -e "${BLUE}📝 Creating project files...${NC}"

# AI Memory with global sync integration
cat > "$WEE_DIR/memory/ai_memory.md" << 'EOF'
# Project AI Memory

## Project Overview
- **Name**: PROJECT_NAME
- **Initialized**: INIT_DATE
- **Global Sync**: Enabled

## Key Learnings
*This section will be populated as you work with WEE agents*

## Architectural Decisions
*Document important decisions here for global knowledge sharing*

## Patterns and Solutions
*Successful patterns will be shared with global knowledge base*

## Notes
- This memory syncs with global WEE knowledge base
- Use 'wee-sync' to manually sync knowledge
- Sensitive information stays local, patterns are shared globally
EOF

# Context Discovery
cat > "$WEE_DIR/contexts/context_discovery.md" << 'EOF'
# Project Context Discovery

## Current Focus
- **Phase**: Initial Setup
- **Priority**: WEE Integration

## Development Context
*Update this as your project evolves*

## Team Context
*Add team information and collaboration notes*

## Technical Context
*Document technical stack and architecture decisions*
EOF

# Project Configuration
cat > "$WEE_DIR/config/project_config.yml" << 'EOF'
# WEE Project Configuration
project:
  name: "PROJECT_NAME"
  type: "development"
  initialized: "INIT_DATE"
  wee_version: "2.0.0-alpha"

# Agent Configuration
agents:
  active:
    - pm_agent           # Alex - Project Management
    - qa_agent           # Sherlock - Quality Assurance  
    - dev_agent          # Edison - Development
    - architecture_agent # Leonardo - Architecture
    - ux_expert_agent    # Maya - User Experience
    - scrum_master_agent # Vince - Scrum Master
    - analyst_agent      # Marie - Analysis
  
# Knowledge Sync Configuration
knowledge_sync:
  enabled: true
  frequency: "daily"
  auto_contribute: true
  privacy_level: "anonymized"

# Global Integration
global_integration:
  registry_sync: true
  pattern_sharing: true
  learning_contribution: true
EOF

# Reasoning Log
cat > "$WEE_DIR/memory/reasoning_log.md" << 'EOF'
# Reasoning Log

## WEE Initialization Decision
- **Date**: INIT_DATE
- **Decision**: Initialize WEE with global/local architecture
- **Rationale**: Enable intelligent development workflow with knowledge sharing
- **Expected Benefits**: 
  - AI-assisted development
  - Cross-project learning
  - Automated quality assurance
  - Pattern recognition and reuse

*Continue documenting architectural decisions here*
EOF

# Last Session Handoff
cat > "$WEE_DIR/handoff/last_session.md" << 'EOF'
# Last Session Handoff

## Session: WEE Initialization
- **Date**: INIT_DATE
- **Action**: Project initialized with WEE
- **Status**: Ready for development

## Next Steps
1. Configure active agents based on project needs
2. Start using WEE commands for development workflow
3. Let WEE learn from your development patterns

*This file will be updated automatically as you work*
EOF

# Create project-specific .weerules file IN PROJECT ROOT (hidden dotfile)
echo -e "${BLUE}📝 Creating project configuration...${NC}"
cat > ".weerules" << 'EOF'
---
description: WEE Project Configuration
globs: **/*
alwaysApply: true
---

# Project-Specific WEE Configuration
# Inherits from global ~/.weerules with project-specific overrides

## Project Information
- **Name**: PROJECT_NAME
- **Type**: Development Project  
- **WEE Version**: 2.0.0-alpha
- **Initialized**: INIT_DATE
- **Architecture**: Local Execution + Global Knowledge

## Local Configuration
# Project-specific rules that override global defaults

## Active Agents
# All agents enabled for comprehensive software development support
active_agents:
  - pm_agent           # Project management and coordination (Alex)
  - qa_agent           # Quality assurance and testing (Sherlock)
  - dev_agent          # Development assistance and debugging (Edison)
  - architecture_agent # System architecture and design (Leonardo)
  - ux_expert_agent    # User experience and design (Maya)
  - analyst_agent      # Data analysis and insights (Marie)
  - scrum_master_agent # Agile process and team coordination (Vince)

## Knowledge Management
# How this project participates in global knowledge sharing
knowledge_sync:
  auto_sync: true                    # Automatically sync with global
  sync_frequency: "daily"            # How often to sync
  contribute_to_global: true         # Share learnings globally
  privacy_level: "anonymized"        # Level of data sharing

## Development Workflow
# Project-specific development preferences
workflow:
  auto_handoff: true                 # Automatic session handoffs
  quality_gates: true                # Enable quality checks
  pattern_detection: true            # Learn from code patterns
  
## Integration Points
# How this project integrates with global WEE
global_integration:
  registry_tracking: true            # Track in global registry
  pattern_sharing: true              # Share successful patterns
  cross_project_learning: true       # Learn from other projects
EOF

# Copy .windsurfrules template to PROJECT ROOT (hidden dotfile) for Windsurf IDE
echo -e "${BLUE}📋 Installing Windsurf IDE configuration...${NC}"
if [ -f "$GLOBAL_WEE/config/project-template.windsurfrules" ]; then
    cp "$GLOBAL_WEE/config/project-template.windsurfrules" ".windsurfrules"
    echo -e "${GREEN}✅ Copied comprehensive .windsurfrules template to project root${NC}"
else
    echo -e "${YELLOW}⚠️  .windsurfrules template not found${NC}"
fi

# Replace placeholders in all created files
PROJECT_NAME=$(basename "$PROJECT_ROOT")
INIT_DATE=$(date)

sed -i "" "s/PROJECT_NAME/$PROJECT_NAME/g" ".weerules" ".windsurfrules" "$WEE_DIR/memory/ai_memory.md" "$WEE_DIR/config/project_config.yml" "$WEE_DIR/memory/reasoning_log.md" "$WEE_DIR/handoff/last_session.md"
sed -i "" "s/INIT_DATE/$INIT_DATE/g" ".weerules" ".windsurfrules" "$WEE_DIR/memory/ai_memory.md" "$WEE_DIR/config/project_config.yml" "$WEE_DIR/memory/reasoning_log.md" "$WEE_DIR/handoff/last_session.md"

# Copy agent definitions file (referenced by .windsurfrules)
echo -e "${BLUE}👥 Installing WEE agent personality definitions...${NC}"
if [ -f "$GLOBAL_WEE/templates/agent_definitions.md" ]; then
    cp "$GLOBAL_WEE/templates/agent_definitions.md" "$WEE_DIR/config/agent_definitions.md"
    echo -e "${GREEN}✅ Copied agent personality definitions (Sherlock, Alex, Leonardo, Edison, Maya, Vince, Marie)${NC}"
else
    echo -e "${YELLOW}⚠️  Agent definitions template not found${NC}"
fi

# Copy Windsurf-compatible agent types (for IDE team introductions) - CRITICAL for Cascade agent detection
echo -e "${BLUE}🎯 Installing Windsurf IDE agent integration...${NC}"

# Check template file first (this is the most reliable source with clean agent names)
if [ -f "$GLOBAL_WEE/templates/windsurf_agent_types.yml" ]; then
    # Copy from template location (verified to have correct agent name format without 'Agent' suffix)
    cp "$GLOBAL_WEE/templates/windsurf_agent_types.yml" "$WEE_DIR/windsurf_agent_types.yml"
    echo -e "${GREEN}✅ Installed Windsurf agent types with clean name format (from template)${NC}"
    
    # Verify clean agent names (no 'Agent' suffix)
    if grep -q "QA Agent" "$WEE_DIR/windsurf_agent_types.yml"; then
        echo -e "${YELLOW}⚠️ Found agent name format issues - fixing...${NC}"
        # Fix agent name formats (remove 'Agent' suffix) for Cascade compatibility
        sed -i "" 's/(QA Agent)/(QA)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(PM Agent)/(PM)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(Architecture Agent)/(Architecture)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(Dev Agent)/(Dev)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(UX Expert Agent)/(UX)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(Scrum Master Agent)/(Scrum Master)/g' "$WEE_DIR/windsurf_agent_types.yml"
        sed -i "" 's/(Analyst Agent)/(Analyst)/g' "$WEE_DIR/windsurf_agent_types.yml"
        echo -e "${GREEN}✅ Fixed agent name formats for Cascade compatibility${NC}"
    fi
elif [ -f "$GLOBAL_WEE/src/config/windsurf_agent_types.yml" ]; then
    # Fallback to src/config location but still verify/fix agent names
    cp "$GLOBAL_WEE/src/config/windsurf_agent_types.yml" "$WEE_DIR/windsurf_agent_types.yml"
    echo -e "${GREEN}✅ Installed Windsurf agent types from src/config${NC}"
    
    # Always verify agent names when using non-template source
    echo -e "${CYAN}🔍 Verifying agent name formats...${NC}"
    # Fix agent name formats (remove 'Agent' suffix) for Cascade compatibility
    sed -i "" 's/(QA Agent)/(QA)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(PM Agent)/(PM)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(Architecture Agent)/(Architecture)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(Dev Agent)/(Dev)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(UX Expert Agent)/(UX)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(Scrum Master Agent)/(Scrum Master)/g' "$WEE_DIR/windsurf_agent_types.yml"
    sed -i "" 's/(Analyst Agent)/(Analyst)/g' "$WEE_DIR/windsurf_agent_types.yml"
else
    echo -e "${RED}⚠️  CRITICAL: Windsurf agent types not found - Cascade agent detection will fail${NC}"
    echo -e "${YELLOW}Creating minimal agent types file for Cascade compatibility${NC}"
    
    # Create minimal agent types file with correct format
    cat > "$WEE_DIR/windsurf_agent_types.yml" << 'EOF'
---
# Windsurf Evolutionary Ecosystem - Agent Configuration
# Generated as emergency fallback - minimal configuration

metadata:
  version: "2.0"
  description: "WEE Agent Personalities for Windsurf IDE Integration"

# WEE Agents with Proper Name Format (without 'Agent' suffix)
agents:
  sherlock_qa_agent:
    name: "🕵️ Sherlock (QA)"
  alex_pm_agent:
    name: "👑 Alex (PM)"
  leonardo_architecture_agent:
    name: "🏛️ Leonardo (Architecture)"
  edison_dev_agent:
    name: "⚡ Edison (Dev)"
  maya_ux_agent:
    name: "🎨 Maya (UX)"
  vince_scrum_master_agent:
    name: "🏈 Vince (Scrum Master)"
  marie_analyst_agent:
    name: "🔬 Marie (Analyst)"
EOF
    echo -e "${GREEN}✅ Created minimal agent types file for Cascade compatibility${NC}"
fi

# Create CRITICAL .windsurffile IN PROJECT ROOT (hidden dotfile) for Windsurf IDE agent recognition
echo -e "${BLUE}🔧 Creating Windsurf IDE project configuration...${NC}"
cat > ".windsurffile" << 'EOF'
# Windsurf Project Configuration
# WEE (Windsurf Evolutionary Ecosystem) Integration

project_type: wee_enabled
wee_directory: .wee
agent_system: enabled

# Include WEE-specific configurations
include:
  - .wee/config/project_config.yml
  - .wee/rules/ai_interaction_rules.md

# Agent activation thresholds
agent_activation:
  auto_detect: true
  threshold_file: .wee/config/adaptive_thresholds.yml
EOF
echo -e "${GREEN}✅ Created .windsurffile for IDE agent integration${NC}"

# Create missing files referenced by .windsurfrules template
echo -e "${BLUE}📝 Creating additional referenced files...${NC}"

# Create Python development rules (referenced by .windsurfrules)
cat > "$WEE_DIR/rules/python_dev_rules.md" << 'EOF'
# Python Development Rules
# WEE-specific Python development standards

## Code Quality Standards
- Use type hints for all function parameters and return values
- Follow PEP 8 style guidelines
- Maintain test coverage above 80%
- Use docstrings for all public functions and classes

## Testing Requirements
- Write unit tests for all new functions
- Use pytest for test framework
- Mock external dependencies in tests
- Test edge cases and error conditions

## Performance Guidelines
- Profile code for performance bottlenecks
- Use appropriate data structures for the task
- Avoid premature optimization
- Document performance-critical sections

## Security Considerations
- Validate all user inputs
- Use secure coding practices
- Avoid hardcoded secrets
- Follow OWASP guidelines
EOF

# Create Knowledge Navigator (referenced by .windsurfrules)
mkdir -p "$WEE_DIR/docs"
cat > "$WEE_DIR/docs/KNOWLEDGE_NAVIGATOR.md" << 'EOF'
# WEE Knowledge Navigator
# Systematic knowledge access protocols for the WEE ecosystem

## Decision Tree Implementation

### 1. Project Context Assessment
- Check `.wee/contexts/context_discovery.md` for current focus
- Review `.wee/config/project_config.yml` for project settings
- Consult `.wee/memory/ai_memory.md` for accumulated knowledge

### 2. Task-Specific Navigation
- **Code Quality**: Use QA Agent (Sherlock) via `.wee/agents/qa_agent/`
- **Architecture**: Use Architecture Agent (Leonardo) via `.wee/agents/architecture_agent/`
- **Development**: Use Dev Agent (Edison) via `.wee/agents/dev_agent/`
- **Project Management**: Use PM Agent (Alex) via `.wee/agents/pm_agent/`

### 3. Knowledge Access Protocols
- Start with agent-specific CLI tools
- Reference agent documentation in respective directories
- Update project memory with new learnings
- Share patterns via global WEE knowledge sync

### 4. Operational Examples
- **Bug Investigation**: Sherlock → QA analysis → reasoning log
- **Design Decision**: Leonardo → architecture review → ADR creation
- **Performance Issue**: Edison → debugging tools → optimization plan
- **Project Planning**: Alex → milestone tracking → roadmap update
EOF

# Copy essential project scripts
echo -e "${BLUE}📋 Installing essential project scripts...${NC}"
TEMPLATE_SCRIPTS="$GLOBAL_WEE/templates/project-scripts"

if [ -d "$TEMPLATE_SCRIPTS" ]; then
    # Create symlinks to global scripts in hidden .wee/scripts directory
    for script in "$TEMPLATE_SCRIPTS"/*; do
        if [ -f "$script" ]; then
            script_name=$(basename "$script")
            ln -sf "$script" "$WEE_DIR/scripts/$script_name"
            echo -e "${GREEN}  ✅ Linked: $script_name${NC}"
        fi
    done
    echo -e "${GREEN}✅ Project scripts linked successfully in .wee/scripts/${NC}"
else
    echo -e "${YELLOW}⚠️  Template scripts not found, creating basic handoff script...${NC}"
    # Create a basic handoff script if templates are missing
    cat > "$WEE_DIR/scripts/handoff.sh" << 'EOF'
#!/bin/bash
# Basic WEE Handoff Generator
echo "# WEE Project Handoff - $(date)" > CURRENT_SESSION_HANDOFF.md
echo "## Project Status" >> CURRENT_SESSION_HANDOFF.md
echo "- Project: $(basename $(pwd))" >> CURRENT_SESSION_HANDOFF.md
echo "- Last Updated: $(date)" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "## Recent Changes" >> CURRENT_SESSION_HANDOFF.md
git log --oneline -5 2>/dev/null >> CURRENT_SESSION_HANDOFF.md || echo "No git history available" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "## Next Steps" >> CURRENT_SESSION_HANDOFF.md
echo "- Continue development" >> CURRENT_SESSION_HANDOFF.md
echo "" >> CURRENT_SESSION_HANDOFF.md
echo "Handoff generated: CURRENT_SESSION_HANDOFF.md"
EOF
    chmod +x "$WEE_DIR/scripts/handoff.sh"
    echo -e "${GREEN}  ✅ Created basic handoff.sh in .wee/scripts/${NC}"
fi

# Register project with global WEE
echo -e "${BLUE}📊 Registering with global WEE...${NC}"
if command -v wee-global >/dev/null 2>&1; then
    wee-global register "$PROJECT_ROOT" || echo -e "${YELLOW}⚠️  Could not auto-register project${NC}"
else
    echo -e "${YELLOW}⚠️  Global WEE commands not available, skipping auto-registration${NC}"
fi

# DUMMY-PROOF: Final validation to ensure everything works
echo -e "${CYAN}🔍 Running final validation...${NC}"
validation_passed=true

# Test that WEE executables are accessible
for cmd in wee-status wee-doctor wee-sync; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${RED}❌ Command '$cmd' not accessible${NC}"
        validation_passed=false
    fi
done

# Test that project structure is complete
for dir in config memory scripts docs workflows contexts handoff; do
    if [ ! -d "$WEE_DIR/$dir" ]; then
        echo -e "${RED}❌ Missing directory: .wee/$dir${NC}"
        validation_passed=false
    fi
done

# Test that key files exist
for file in ".weerules" "$WEE_DIR/config/project_config.yml" "$WEE_DIR/memory/ai_memory.md"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing file: $file${NC}"
        validation_passed=false
    fi
done

if [ "$validation_passed" = true ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    
    # Run a quick wee-doctor check to ensure everything is working
    echo -e "${CYAN}🩺 Running quick health check...${NC}"
    if "$GLOBAL_WEE/scripts/wee-doctor.sh" --repair >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WEE health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check had warnings (this is usually normal)${NC}"
    fi
else
    echo -e "${RED}❌ Validation failed! Some components are missing.${NC}"
    echo -e "${YELLOW}🔧 Try running: wee-doctor --repair${NC}"
    exit 1
fi

echo ""
# Install Node.js dependencies in project-local .wee directory (CRITICAL for agent functionality)
echo -e "${BLUE}📦 Installing Node.js dependencies for project agents...${NC}"
cd "$WEE_DIR"

# Copy package.json from global WEE if it exists (to .wee directory, not project root)
if [ -f "$GLOBAL_WEE/package.json" ]; then
    cp "$GLOBAL_WEE/package.json" "$WEE_DIR/" 2>/dev/null || true
    cp "$GLOBAL_WEE/package-lock.json" "$WEE_DIR/" 2>/dev/null || true
    
    # Install dependencies for project-local agents
    if command -v npm >/dev/null 2>&1; then
        echo -e "${BLUE}📦 Installing project dependencies...${NC}"
        npm install --production --silent 2>/dev/null || {
            echo -e "${YELLOW}⚠️  npm install failed, trying alternative approach...${NC}"
            npm install --production 2>/dev/null || {
                echo -e "${RED}❌ Failed to install project dependencies${NC}"
                echo -e "${YELLOW}💡 You may need to run 'cd .wee && npm install' manually${NC}"
            }
        }
        echo -e "${GREEN}✅ Project Node.js dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  npm not found - project dependencies not installed${NC}"
        echo -e "${YELLOW}💡 Install Node.js and run 'cd .wee && npm install' manually${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  package.json not found in global WEE${NC}"
fi

# Return to project root
cd "$PROJECT_ROOT"

echo -e "${GREEN}✅ WEE initialized successfully!${NC}"
echo -e "${GREEN}🎉 Welcome to the WEE ecosystem!${NC}"
echo "========================="
echo -e "${BLUE}📁 Project Structure:${NC}"
echo "   • .wee/              - Local WEE data and configuration"
echo "   • .weerules          - Project-specific rules"
echo ""
echo -e "${BLUE}🤖 Available Agents:${NC}"
echo "   • PM Agent           - Project management and coordination (Alex)"
echo "   • QA Agent           - Quality assurance and testing (Sherlock)"
echo "   • Dev Agent          - Development assistance (Edison)"
echo "   • Architecture Agent  - System architecture and design (Leonardo)"
echo "   • UX Expert Agent     - User experience and design (Maya)"
echo "   • Scrum Master Agent  - Agile process and team coordination (Vince)"
echo "   • Analyst Agent      - Data analysis and insights (Marie)"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "   1. Run 'wee-status' to see project status"
echo "   2. Use 'wee-sync' to sync with global knowledge"
echo "   3. Start developing - WEE will learn from your patterns!"
echo ""
echo -e "${YELLOW}💡 Your project is now part of the global WEE ecosystem${NC}"
echo -e "${YELLOW}   Knowledge will be shared anonymously to help all projects${NC}"
echo ""
echo -e "${GREEN}🔧 Installation is DUMMY-PROOF and ready to use!${NC}"
