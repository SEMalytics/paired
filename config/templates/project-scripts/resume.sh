#!/bin/bash
# PAIRED Resume Script
# Usage: resume.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

MACHINE=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🚀 Resuming PAIRED work on $MACHINE..."

# Navigate to project root
cd "$PROJECT_ROOT"

# Check if we're in a git repository
if [[ ! -d .git ]]; then
    echo "❌ Not in a git repository. Please run from project root."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Check if CURRENT_PLAN.md exists
if [[ -f CURRENT_PLAN.md ]]; then
    echo ""
    echo "📋 Current Plan Status:"
    echo "========================"
    cat CURRENT_PLAN.md
    echo ""
else
    echo "⚠️  No CURRENT_PLAN.md found. Check TODO.md for project status."
fi

# Show environment status
echo "🖥️  Environment Status:"
echo "========================"
echo "Machine: $MACHINE"
echo "Environment: ${VECTORSEM_ENV:-Not set}"
echo "Model Loading: ${VECTORSEM_PRELOAD_MODEL:-Not set}"
echo ""

# Show recent commits
echo "📝 Recent Changes:"
echo "=================="
git log --oneline -5 --pretty=format:"- %s (%cr)"
echo ""
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected:"
    echo "================================="
    git status --porcelain
    echo ""
fi

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Current branch: $CURRENT_BRANCH"

# Check if .paired directory exists and show context
if [[ -d .paired ]]; then
    echo ""
    echo "🧠 Windsurf Context:"
    echo "==================="
    
    # Show current focus if exists
    if [[ -f .paired/contexts/current_focus.md ]]; then
        echo "📍 Current Focus:"
        head -10 .paired/contexts/current_focus.md
        echo ""
    fi
    
    # Show recent AI memory entries
    if [[ -f .paired/memory/ai_memory.md ]]; then
        echo "🧠 Recent AI Memory:"
        tail -20 .paired/memory/ai_memory.md | head -10
        echo ""
    fi
fi

echo "✅ Resume complete. Ready for development!"
echo "💡 Tip: Source aliases with: source .paired/scripts/aliases.sh"
