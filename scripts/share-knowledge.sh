#!/bin/bash
# Share knowledge between projects and global knowledge base

set -euo pipefail

GLOBAL_KNOWLEDGE="$HOME/.wee/memory/global_knowledge.md"
PROJECT_MEMORY="$(pwd)/.wee/memory"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    echo "🔄 Windsurf Knowledge Sharing"
    echo "Usage: wshare [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup             🛡️  Export ALL project knowledge to global (safe backup)"
    echo "  interactive        🎯 Interactive knowledge import/export wizard"
    echo "  export <pattern>   📤 Export project insights matching pattern to global"
    echo "  import <pattern>   📥 Import global insights matching pattern to project"
    echo "  sync               🔄 Sync bidirectionally between project and global"
    echo "  list               📋 List available knowledge sources"
    echo "  all                📦 Same as backup (export everything)"
    echo ""
    echo "💡 For beginners:"
    echo "  wshare backup      # Safe: backs up all your project knowledge"
    echo "  wshare interactive # Guided: step-by-step knowledge management"
    echo ""
    echo "🔧 Advanced usage:"
    echo "  wshare export 'error handling'    # Export specific patterns"
    echo "  wshare import 'testing'           # Import specific knowledge"
}

export_to_global() {
    local pattern="$1"
    
    if [ ! -d "$PROJECT_MEMORY" ]; then
        echo -e "${YELLOW}⚠️  No project memory found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📤 Exporting '$pattern' to global knowledge...${NC}"
    
    # Find matching content in project memory
    local matches=$(find "$PROJECT_MEMORY" -name "*.md" -exec grep -l -i "$pattern" {} \; 2>/dev/null || true)
    
    if [ -z "$matches" ]; then
        echo -e "${YELLOW}⚠️  No matches found for '$pattern'${NC}"
        return 1
    fi
    
    # Add to global knowledge
    echo "" >> "$GLOBAL_KNOWLEDGE"
    echo "## $(date '+%Y-%m-%d') - Exported from $(basename $(pwd))" >> "$GLOBAL_KNOWLEDGE"
    echo "" >> "$GLOBAL_KNOWLEDGE"
    
    for file in $matches; do
        echo "### From $(basename "$file")" >> "$GLOBAL_KNOWLEDGE"
        grep -A 5 -B 2 -i "$pattern" "$file" >> "$GLOBAL_KNOWLEDGE" 2>/dev/null || true
        echo "" >> "$GLOBAL_KNOWLEDGE"
    done
    
    echo -e "${GREEN}✅ Exported knowledge to global base${NC}"
}

import_from_global() {
    local pattern="$1"
    
    if [ ! -f "$GLOBAL_KNOWLEDGE" ]; then
        echo -e "${YELLOW}⚠️  Global knowledge base not found${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📥 Importing '$pattern' from global knowledge...${NC}"
    
    # Create project memory if it doesn't exist
    mkdir -p "$PROJECT_MEMORY"
    
    local import_file="$PROJECT_MEMORY/imported_knowledge.md"
    
    # Search and import
    local matches=$(grep -A 10 -B 2 -i "$pattern" "$GLOBAL_KNOWLEDGE" 2>/dev/null || true)
    
    if [ -z "$matches" ]; then
        echo -e "${YELLOW}⚠️  No matches found for '$pattern'${NC}"
        return 1
    fi
    
    # Add header if file doesn't exist
    if [ ! -f "$import_file" ]; then
        echo "# Imported Knowledge from Global Base" > "$import_file"
        echo "" >> "$import_file"
    fi
    
    echo "" >> "$import_file"
    echo "## $(date '+%Y-%m-%d') - Imported: $pattern" >> "$import_file"
    echo "" >> "$import_file"
    echo "$matches" >> "$import_file"
    echo "" >> "$import_file"
    
    echo -e "${GREEN}✅ Imported knowledge to $import_file${NC}"
}

sync_knowledge() {
    echo -e "${BLUE}🔄 Syncing knowledge bidirectionally...${NC}"
    
    # Export recent project insights
    if [ -d "$PROJECT_MEMORY" ]; then
        local recent_files=$(find "$PROJECT_MEMORY" -name "*.md" -mtime -7 2>/dev/null || true)
        if [ -n "$recent_files" ]; then
            echo "" >> "$GLOBAL_KNOWLEDGE"
            echo "## $(date '+%Y-%m-%d') - Auto-sync from $(basename $(pwd))" >> "$GLOBAL_KNOWLEDGE"
            echo "" >> "$GLOBAL_KNOWLEDGE"
            
            for file in $recent_files; do
                echo "### Recent insights from $(basename "$file")" >> "$GLOBAL_KNOWLEDGE"
                tail -20 "$file" >> "$GLOBAL_KNOWLEDGE" 2>/dev/null || true
                echo "" >> "$GLOBAL_KNOWLEDGE"
            done
        fi
    fi
    
    # Import relevant global patterns
    local project_type=""
    if [ -f "package.json" ]; then
        project_type="javascript"
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        project_type="python"
    elif [ -f "Cargo.toml" ]; then
        project_type="rust"
    elif [ -f "go.mod" ]; then
        project_type="go"
    fi
    
    if [ -n "$project_type" ]; then
        import_from_global "$project_type"
    fi
    
    echo -e "${GREEN}✅ Knowledge sync complete${NC}"
}

list_knowledge() {
    echo -e "${BLUE}📚 Available Knowledge Sources${NC}"
    echo ""
    
    echo "Global Knowledge Base:"
    if [ -f "$GLOBAL_KNOWLEDGE" ]; then
        echo "  📄 $(wc -l < "$GLOBAL_KNOWLEDGE") lines in global knowledge"
        echo "  🔍 Recent topics:"
        grep "^##" "$GLOBAL_KNOWLEDGE" | tail -5 | sed 's/^/    /'
    else
        echo "  ❌ Global knowledge base not found"
    fi
    
    echo ""
    echo "Project Memory:"
    if [ -d "$PROJECT_MEMORY" ]; then
        local file_count=$(find "$PROJECT_MEMORY" -name "*.md" | wc -l)
        echo "  📁 $file_count memory files in project"
        find "$PROJECT_MEMORY" -name "*.md" -exec basename {} \; | sed 's/^/    📄 /'
    else
        echo "  ❌ Project memory not found"
    fi
}

# Backup all project knowledge to global (dummy-proof)
backup_all_knowledge() {
    echo -e "${BLUE}🛡️  Backing up ALL project knowledge to global knowledge base...${NC}"
    
    if [ ! -d "$PROJECT_MEMORY" ]; then
        echo -e "${YELLOW}⚠️  No project memory found - nothing to backup${NC}"
        return 0
    fi
    
    local backup_count=0
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Add backup header to global knowledge
    echo "" >> "$GLOBAL_KNOWLEDGE"
    echo "## Project Backup: $(basename "$(pwd)") - $timestamp" >> "$GLOBAL_KNOWLEDGE"
    echo "" >> "$GLOBAL_KNOWLEDGE"
    
    # Export all .md files from project memory
    find "$PROJECT_MEMORY" -name "*.md" -type f | while read -r file; do
        if [ -s "$file" ]; then  # Only process non-empty files
            echo "📄 Backing up: $(basename "$file")"
            echo "### $(basename "$file")" >> "$GLOBAL_KNOWLEDGE"
            echo "" >> "$GLOBAL_KNOWLEDGE"
            cat "$file" >> "$GLOBAL_KNOWLEDGE"
            echo "" >> "$GLOBAL_KNOWLEDGE"
            echo "---" >> "$GLOBAL_KNOWLEDGE"
            echo "" >> "$GLOBAL_KNOWLEDGE"
            backup_count=$((backup_count + 1))
        fi
    done
    
    echo -e "${GREEN}✅ Backup complete! Exported $backup_count files to global knowledge${NC}"
    echo -e "${BLUE}💡 Your knowledge is now safely stored in: $GLOBAL_KNOWLEDGE${NC}"
}

# Interactive knowledge management wizard
interactive_mode() {
    echo -e "${BLUE}🎯 Interactive Knowledge Management Wizard${NC}"
    echo "================================================"
    echo ""
    
    while true; do
        echo "What would you like to do?"
        echo "1. 🛡️  Backup all project knowledge to global (recommended)"
        echo "2. 📥 Import knowledge from global to this project"
        echo "3. 📋 View available knowledge topics"
        echo "4. 🔍 Search for specific knowledge"
        echo "5. 📊 Show knowledge statistics"
        echo "6. ❌ Exit"
        echo ""
        read -p "Choose an option (1-6): " choice
        
        case $choice in
            1)
                backup_all_knowledge
                echo ""
                ;;
            2)
                echo "Available knowledge topics:"
                list_knowledge
                echo ""
                read -p "Enter topic to import (or 'all' for everything): " topic
                if [ "$topic" = "all" ]; then
                    sync_knowledge
                else
                    import_from_global "$topic"
                fi
                echo ""
                ;;
            3)
                list_knowledge
                echo ""
                ;;
            4)
                read -p "Enter search term: " search_term
                echo "Searching for '$search_term'..."
                grep -i "$search_term" "$GLOBAL_KNOWLEDGE" 2>/dev/null | head -10 || echo "No matches found"
                echo ""
                ;;
            5)
                echo "📊 Knowledge Statistics:"
                echo "Global knowledge: $(wc -l < "$GLOBAL_KNOWLEDGE" 2>/dev/null || echo "0") lines"
                if [ -d "$PROJECT_MEMORY" ]; then
                    echo "Project files: $(find "$PROJECT_MEMORY" -name "*.md" | wc -l) files"
                    echo "Project lines: $(find "$PROJECT_MEMORY" -name "*.md" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0") lines"
                else
                    echo "Project files: 0 files"
                fi
                echo ""
                ;;
            6)
                echo "👋 Goodbye!"
                break
                ;;
            *)
                echo "❌ Invalid option. Please choose 1-6."
                echo ""
                ;;
        esac
    done
}

# Main execution
case "${1:-help}" in
    "backup"|"all")
        backup_all_knowledge
        ;;
    "interactive")
        interactive_mode
        ;;
    "export")
        if [ -z "${2:-}" ]; then
            echo "Usage: wshare export <pattern>"
            exit 1
        fi
        export_to_global "$2"
        ;;
    "import")
        if [ -z "${2:-}" ]; then
            echo "Usage: wshare import <pattern>"
            exit 1
        fi
        import_from_global "$2"
        ;;
    "sync")
        sync_knowledge
        ;;
    "list")
        list_knowledge
        ;;
    "help"|*)
        show_help
        ;;
esac
