#!/bin/bash
# Documentation Discovery and Navigation Script
# Usage: doc_discovery.sh [search_term|category|--help]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WINDSURF_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$WINDSURF_ROOT")"

echo -e "${BLUE}🔍 Windsurf Documentation Discovery${NC}"
echo "===================================="
echo ""

# Function to print help
show_help() {
    echo -e "${CYAN}📚 Documentation Discovery Help${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  doc_discovery.sh [search_term|category|--help]"
    echo ""
    echo -e "${YELLOW}Categories:${NC}"
    echo "  docs        - Long-form documentation"
    echo "  context     - Current project state"
    echo "  workflows   - Development processes"
    echo "  scripts     - Development utilities"
    echo "  memory      - AI learning repository"
    echo "  config      - Configuration files"
    echo "  agents      - AI agent configurations"
    echo "  performance - Performance tracking"
    echo "  rules       - Development principles"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  doc_discovery.sh architecture"
    echo "  doc_discovery.sh docs"
    echo "  doc_discovery.sh current"
    echo "  doc_discovery.sh handoff"
    echo ""
    echo -e "${YELLOW}Special Commands:${NC}"
    echo "  --all       - Show all documentation"
    echo "  --recent    - Show recently modified files"
    echo "  --help      - Show this help"
}

# Function to show file info with metadata
show_file_info() {
    local file_path="$1"
    local category="$2"
    local description="$3"
    
    if [[ -f "$file_path" ]]; then
        local mod_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file_path")
        local size=$(stat -f "%z" "$file_path")
        local size_kb=$((size / 1024))
        
        echo -e "${GREEN}📄${NC} ${YELLOW}$(basename "$file_path")${NC}"
        echo -e "   ${PURPLE}Category:${NC} $category"
        echo -e "   ${PURPLE}Description:${NC} $description"
        echo -e "   ${PURPLE}Path:${NC} $file_path"
        echo -e "   ${PURPLE}Modified:${NC} $mod_time"
        echo -e "   ${PURPLE}Size:${NC} ${size_kb}KB"
        echo ""
    fi
}

# Function to search documentation by term
search_docs() {
    local search_term="$1"
    echo -e "${CYAN}🔍 Searching for: \"$search_term\"${NC}"
    echo ""
    
    # Search in file names and content
    find "$WINDSURF_ROOT" -name "*.md" -o -name "*.yml" -o -name "*.mdc" | while read -r file; do
        if grep -l -i "$search_term" "$file" 2>/dev/null || [[ "$(basename "$file")" == *"$search_term"* ]]; then
            local rel_path="${file#$WINDSURF_ROOT/}"
            local category=$(dirname "$rel_path")
            echo -e "${GREEN}📄${NC} ${YELLOW}$rel_path${NC}"
            echo -e "   ${PURPLE}Match in:${NC} $(grep -i -n "$search_term" "$file" 2>/dev/null | head -1 | cut -d: -f1-2 || echo "filename")"
            echo ""
        fi
    done
}

# Function to show category contents
show_category() {
    local category="$1"
    
    case "$category" in
        "docs")
            echo -e "${CYAN}📚 Documentation (Long-form)${NC}"
            echo "================================"
            echo ""
            show_file_info "$WINDSURF_ROOT/docs/ARCHITECTURE.md" "Architecture" "System design overview and technical architecture"
            show_file_info "$WINDSURF_ROOT/docs/ROADMAP.md" "Planning" "Long-term project vision and strategic direction"
            show_file_info "$WINDSURF_ROOT/docs/CONTRIBUTING.md" "Development" "Contribution guidelines and development standards"
            show_file_info "$WINDSURF_ROOT/docs/MULTI_ENVIRONMENT.md" "Setup" "Multi-machine development setup guide"
            show_file_info "$WINDSURF_ROOT/docs/TESTING_FRAMEWORK.md" "Testing" "Testing approach and capabilities"
            ;;
        "context")
            echo -e "${CYAN}🎯 Context (Current State)${NC}"
            echo "=========================="
            echo ""
            show_file_info "$WINDSURF_ROOT/context/CURRENT_PLAN.md" "Planning" "Active development plan and priorities"
            show_file_info "$WINDSURF_ROOT/context/CONVERSATION_SUMMARY.md" "Tracking" "Development context tracking"
            show_file_info "$WINDSURF_ROOT/context/CURRENT_STATUS.md" "Status" "Real-time project status and progress"
            ;;
        "workflows")
            echo -e "${CYAN}🔄 Workflows (Processes)${NC}"
            echo "========================"
            echo ""
            show_file_info "$WINDSURF_ROOT/workflows/HANDOFF.md" "Process" "Multi-machine development workflow and handoff procedures"
            ;;
        "scripts")
            echo -e "${CYAN}🛠️ Scripts (Development Utilities)${NC}"
            echo "=================================="
            echo ""
            show_file_info "$WINDSURF_ROOT/scripts/resume.sh" "Utility" "Resume development work on any machine"
            show_file_info "$WINDSURF_ROOT/scripts/handoff.sh" "Utility" "Hand off work to another machine/developer"
            show_file_info "$WINDSURF_ROOT/scripts/aliases.sh" "Configuration" "Development aliases and shortcuts"
            show_file_info "$WINDSURF_ROOT/scripts/set-env.sh" "Configuration" "Environment configuration management"
            show_file_info "$WINDSURF_ROOT/scripts/type_cleanup.py" "Analysis" "Type safety analysis and improvement"
            ;;
        "memory")
            echo -e "${CYAN}🧠 Memory (AI Learning)${NC}"
            echo "======================="
            echo ""
            show_file_info "$WINDSURF_ROOT/memory/ai_memory.md" "Learning" "AI learning repository and insights"
            show_file_info "$WINDSURF_ROOT/memory/type_improvement_insights.md" "Learning" "Type safety learning and patterns"
            show_file_info "$WINDSURF_ROOT/memory/type_annotation_guidelines.md" "Standards" "Type annotation standards and guidelines"
            ;;
        *)
            echo -e "${RED}❌ Unknown category: $category${NC}"
            echo ""
            echo -e "${YELLOW}Available categories:${NC} docs, context, workflows, scripts, memory, config, agents, performance, rules"
            ;;
    esac
}

# Function to show recently modified files
show_recent() {
    echo -e "${CYAN}⏰ Recently Modified Documentation${NC}"
    echo "=================================="
    echo ""
    
    find "$WINDSURF_ROOT" -name "*.md" -o -name "*.yml" -o -name "*.mdc" | \
    xargs stat -f "%m %N" | \
    sort -rn | \
    head -10 | \
    while read -r timestamp filepath; do
        local mod_time=$(date -r "$timestamp" "+%Y-%m-%d %H:%M")
        local rel_path="${filepath#$WINDSURF_ROOT/}"
        echo -e "${GREEN}📄${NC} ${YELLOW}$rel_path${NC} (${mod_time})"
    done
    echo ""
}

# Function to show all documentation
show_all() {
    echo -e "${CYAN}📚 Complete Documentation Index${NC}"
    echo "==============================="
    echo ""
    
    for category in docs context workflows scripts memory; do
        show_category "$category"
        echo ""
    done
}

# Main execution
main() {
    local search_term="${1:-}"
    
    case "$search_term" in
        "--help"|"-h"|"help")
            show_help
            ;;
        "--all")
            show_all
            ;;
        "--recent")
            show_recent
            ;;
        "docs"|"context"|"workflows"|"scripts"|"memory"|"config"|"agents"|"performance"|"rules")
            show_category "$search_term"
            ;;
        "")
            echo -e "${YELLOW}💡 Quick Navigation:${NC}"
            echo ""
            echo -e "${GREEN}📄${NC} Current Plan: ${YELLOW}.paired/context/CURRENT_PLAN.md${NC}"
            echo -e "${GREEN}📄${NC} Architecture: ${YELLOW}.paired/docs/ARCHITECTURE.md${NC}"
            echo -e "${GREEN}📄${NC} Master Guide: ${YELLOW}.paired/README.md${NC}"
            echo ""
            echo -e "${CYAN}Use 'doc_discovery.sh --help' for more options${NC}"
            ;;
        *)
            search_docs "$search_term"
            ;;
    esac
}

# Run main function
main "$@"
