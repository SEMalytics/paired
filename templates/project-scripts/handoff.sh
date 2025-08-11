#!/bin/bash

# WEE Manual Handoff Generator
# Use this to generate handoff documentation manually

echo "🔄 Generating WEE Project Handoff..."

HANDOFF_FILE="CURRENT_SESSION_HANDOFF.md"

echo "# 🔄 WEE Project Handoff - $(date '+%Y-%m-%d %H:%M:%S')" > "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Include current plan if it exists
if [ -f "/Users/davidpedersen/.codeium/windsurf/brain/c46cf8de-30d8-4eb4-b4e2-cceef0d1cbf9/plan.md" ]; then
    echo "## 📋 Current Plan Status" >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
    cat "/Users/davidpedersen/.codeium/windsurf/brain/c46cf8de-30d8-4eb4-b4e2-cceef0d1cbf9/plan.md" >> "$HANDOFF_FILE"
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

# Key implementation status
echo "## 🤖 WEE Agents Implementation Status" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Check which agents exist
if [ -d "src/agents" ]; then
    echo "**Implemented Agents:**" >> "$HANDOFF_FILE"
    for agent_file in src/agents/*.js; do
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
echo "5. **Follow WEE Rules:** Check \`.wee/rules/\` for development guidelines" >> "$HANDOFF_FILE"
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
echo "- **WEE Documentation:** Check \`.wee/docs/\` directory" >> "$HANDOFF_FILE"
echo "- **Agent Plans:** \`planning/Agent_Plans/\` contains detailed implementation specs" >> "$HANDOFF_FILE"
echo "- **Development Rules:** \`.wee/rules/\` contains coding standards" >> "$HANDOFF_FILE"
echo "- **Project Config:** \`.wee/config/project_config.yml\`" >> "$HANDOFF_FILE"
echo "" >> "$HANDOFF_FILE"

# Add timestamp
echo "---" >> "$HANDOFF_FILE"
echo "*Generated on $(date) by WEE Handoff System*" >> "$HANDOFF_FILE"
echo "*To regenerate: \`./generate-handoff.sh\`*" >> "$HANDOFF_FILE"

echo "✅ Handoff documentation generated: $HANDOFF_FILE"
echo "📋 This file will be automatically included in your next git commit!"
