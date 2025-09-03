#!/bin/bash

# PAIRED Universal Handoff Generator
# Supports multiple handoff types: session, project, milestone
# Usage: ./handoff.sh [type] [options]

# Default values
HANDOFF_TYPE="session"
CONFIG_FILE="$(dirname "$0")/../../templates/handoff-config.yml"
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        session|project|milestone)
            HANDOFF_TYPE="$1"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "PAIRED Universal Handoff Generator"
            echo "Usage: $0 [type] [options]"
            echo ""
            echo "Types:"
            echo "  session    - Development session handoff (default)"
            echo "  project    - Complete project handoff"
            echo "  milestone  - Milestone completion handoff"
            echo ""
            echo "Options:"
            echo "  -v, --verbose  Enable verbose output"
            echo "  -c, --config   Use custom configuration file"
            echo "  -h, --help     Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Capitalize handoff type for display
case $HANDOFF_TYPE in
    session)
        HANDOFF_TYPE_DISPLAY="Session"
        ;;
    project)
        HANDOFF_TYPE_DISPLAY="Project"
        ;;
    milestone)
        HANDOFF_TYPE_DISPLAY="Milestone"
        ;;
esac
echo "🔄 Generating PAIRED $HANDOFF_TYPE_DISPLAY Handoff..."

# Set handoff filename based on type
case $HANDOFF_TYPE in
    session)
        HANDOFF_FILE="CURRENT_SESSION_HANDOFF.md"
        ;;
    project)
        HANDOFF_FILE="PROJECT_HANDOFF_$(date +%Y%m%d).md"
        ;;
    milestone)
        HANDOFF_FILE="MILESTONE_HANDOFF_$(date +%Y%m%d).md"
        ;;
esac

if [[ "$VERBOSE" == "true" ]]; then
    echo "📄 Output file: $HANDOFF_FILE"
    echo "⚙️ Configuration: $CONFIG_FILE"
    echo "🎯 Handoff type: $HANDOFF_TYPE"
fi

# Generate type-specific header
case $HANDOFF_TYPE in
    session)
        echo "# 🔄 PAIRED Development Session Handoff" > "$HANDOFF_FILE"
        echo "*Generated: $(date '+%Y-%m-%d %H:%M:%S')*" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "This handoff documents the current development session state and provides context for continuing work." >> "$HANDOFF_FILE"
        ;;
    project)
        echo "# 📋 PAIRED Complete Project Handoff" > "$HANDOFF_FILE"
        echo "*Generated: $(date '+%Y-%m-%d %H:%M:%S')*" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "This comprehensive handoff documents the complete project state for transfer or major milestone review." >> "$HANDOFF_FILE"
        ;;
    milestone)
        echo "# 🎯 PAIRED Milestone Completion Handoff" > "$HANDOFF_FILE"
        echo "*Generated: $(date '+%Y-%m-%d %H:%M:%S')*" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "This handoff documents the completion of a major milestone and sets context for next objectives." >> "$HANDOFF_FILE"
        ;;
esac
echo "" >> "$HANDOFF_FILE"

# Include current plan if it exists (search for any Windsurf brain plan)
WINDSURF_BRAIN_DIR="$HOME/.codeium/windsurf/brain"
PLAN_FILE=""

if [ -d "$WINDSURF_BRAIN_DIR" ]; then
    # Find the most recent plan.md file in any brain directory
    PLAN_FILE=$(find "$WINDSURF_BRAIN_DIR" -name "plan.md" -type f -exec ls -t {} + 2>/dev/null | head -1)
fi

if [ -n "$PLAN_FILE" ] && [ -f "$PLAN_FILE" ]; then
    echo "## 📋 Current Plan Status" >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
    cat "$PLAN_FILE" >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
else
    echo "## 📋 Current Plan Status" >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
    echo "⚠️ No active plan found. Check Windsurf brain or create new plan." >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
fi

# Project structure overview
echo "## 🏗️ Project Structure" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
echo "**Key Files and Directories:**" >> "$HANDOFF_FILE"
echo "\`\`\`" >> "$HANDOFF_FILE"
find . -type f -name "*.js" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | grep -v node_modules | grep -v .git | sort >> "$HANDOFF_FILE"
echo "\`\`\`" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Recent changes
echo "## 📝 Recent Changes (Last 10 Commits)" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
git log --oneline -10 >> "$HANDOFF_FILE" 2>/dev/null || echo "No previous commits found" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Current branch and status
echo "## 🌿 Git Status" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
echo "**Current Branch:** $(git branch --show-current)" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
echo "**Modified Files:**" >> "$HANDOFF_FILE"
echo "\`\`\`" >> "$HANDOFF_FILE"
git status --porcelain >> "$HANDOFF_FILE"
echo "\`\`\`" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Add type-specific sections
case $HANDOFF_TYPE in
    project)
        # Executive Summary for project handoffs
        echo "## 📊 Executive Summary" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "**Project Status:** [Update with current status]" >> "$HANDOFF_FILE"
        echo "**Key Achievements:** [List major accomplishments]" >> "$HANDOFF_FILE"
        echo "**Current Phase:** [Describe current development phase]" >> "$HANDOFF_FILE"
        echo "**Next Major Milestone:** [Describe upcoming milestone]" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        
        # Architecture Overview for project handoffs
        echo "## 🏗️ Architecture Overview" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "**System Architecture:** PAIRED Agent-based Development Platform" >> "$HANDOFF_FILE"
        echo "**Core Components:**" >> "$HANDOFF_FILE"
        echo "- Agent CLI Registry and Integration Layer" >> "$HANDOFF_FILE"
        echo "- Universal Deployment System" >> "$HANDOFF_FILE"
        echo "- Project Knowledge Management" >> "$HANDOFF_FILE"
        echo "- Multi-repository Development Workflow" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        ;;
    milestone)
        # Milestone Summary for milestone handoffs
        echo "## 🎯 Milestone Summary" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "**Completed Milestone:** [Describe completed milestone]" >> "$HANDOFF_FILE"
        echo "**Objectives Achieved:** [List completed objectives]" >> "$HANDOFF_FILE"
        echo "**Deliverables:** [List key deliverables]" >> "$HANDOFF_FILE"
        echo "**Success Metrics:** [Describe how success was measured]" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        
        # Key Achievements for milestone handoffs
        echo "## 🏆 Key Achievements" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "**Technical Achievements:**" >> "$HANDOFF_FILE"
        echo "- [List technical accomplishments]" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        echo "**Process Improvements:**" >> "$HANDOFF_FILE"
        echo "- [List process improvements]" >> "$HANDOFF_FILE"
        echo "" >> "$HANDOFF_FILE"
        ;;
esac

# Key implementation status
echo "## 🤖 PAIRED Agents Implementation Status" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Check which agents exist
if [ -d ".paired/core/agents" ]; then
    echo "**Implemented Agents:**" >> "$HANDOFF_FILE"
    for agent_file in .paired/core/agents/*/*.js; do
        if [ -f "$agent_file" ]; then
            agent_name=$(basename "$agent_file" .js)
            # Get first few lines to check if it's implemented
            first_lines=$(head -10 "$agent_file" | grep -E "(class|function|module\.exports)" | head -1)
            if [ -n "$first_lines" ]; then
                echo "- ✅ $agent_name ($(wc -l < "$agent_file") lines)" >> "$HANDOFF_FILE"
            else
                echo "- 🚧 $agent_name (stub/incomplete)" >> "$HANDOFF_FILE"
            fi
        fi
    done
    echo "" >> "$HANDOFF_FILE"
else
    echo "⚠️ No agents directory found. Agents may need to be implemented." >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
fi

# Check for planning documents
if [ -d "planning" ]; then
    echo "**Available Planning Documents:**" >> "$HANDOFF_FILE"
    find planning -name "*.md" | head -10 | while read -r plan_file; do
        echo "- 📄 $plan_file" >> "$HANDOFF_FILE"
    done
    echo "" >> "$HANDOFF_FILE"
fi

# Next steps guidance
echo "## 🎯 Next Steps for New Developer" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
echo "1. **Review the Current Plan** above to understand current objectives" >> "$HANDOFF_FILE"
echo "2. **Check Recent Changes** to see what was last worked on" >> "$HANDOFF_FILE"
echo "3. **Run Tests:** \`npm test\` or check existing test files" >> "$HANDOFF_FILE"
echo "4. **Review Agent Documentation:** Check \`planning/Agent_Plans/\` for detailed specs" >> "$HANDOFF_FILE"
echo "5. **Follow PAIRED Rules:** Check \`.paired/rules/\` for development guidelines" >> "$HANDOFF_FILE"
echo "6. **Check Dependencies:** Run \`npm install\` or \`pip install -r requirements.txt\`" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Environment setup
echo "## 🔧 Environment Setup" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
if [ -f "package.json" ]; then
    echo "**Node.js Project:**" >> "$HANDOFF_FILE"
    echo "- Run \`npm install\` to install dependencies" >> "$HANDOFF_FILE"
    echo "- Available scripts:" >> "$HANDOFF_FILE"
    grep -A 10 '"scripts"' package.json | grep -E '^\s*"' | head -5 >> "$HANDOFF_FILE" 2>/dev/null || echo "  - Check package.json for scripts" >> "$HANDOFF_FILE"
fi
if [ -f "requirements.txt" ]; then
    echo "**Python Project:**" >> "$HANDOFF_FILE"
    echo "- Run \`pip install -r requirements.txt\` to install dependencies" >> "$HANDOFF_FILE"
fi
echo "" >> "$HANDOFF_FILE"

# Important contacts/resources
echo "## 📚 Important Resources" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"
echo "- **PAIRED Documentation:** Check \`.paired/docs/\` directory" >> "$HANDOFF_FILE"
echo "- **Agent Plans:** \`planning/Agent_Plans/\` contains detailed implementation specs" >> "$HANDOFF_FILE"
echo "- **Development Rules:** \`.paired/rules/\` contains coding standards" >> "$HANDOFF_FILE"
echo "- **Project Config:** \`.paired/config/project_config.yml\`" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Add timestamp and generation info
echo "---" >> "$HANDOFF_FILE"
echo "*Generated on $(date) by PAIRED Universal Handoff System*" >> "$HANDOFF_FILE"
echo "*Handoff Type: $HANDOFF_TYPE_DISPLAY*" >> "$HANDOFF_FILE"
echo "*To regenerate: \`./handoff.sh $HANDOFF_TYPE\`*" >> "$HANDOFF_FILE"

echo "✅ $HANDOFF_TYPE_DISPLAY handoff documentation generated: $HANDOFF_FILE"
case $HANDOFF_TYPE in
    session)
        echo "📋 This file documents your current development session state."
        ;;
    project)
        echo "📋 This comprehensive handoff is ready for project transfer or review."
        ;;
    milestone)
        echo "📋 This milestone handoff documents your completed achievements."
        ;;
esac
echo "🔄 File will be automatically included in your next git commit!"
