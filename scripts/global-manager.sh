#!/bin/bash
# PAIRED Global Manager Script
# Manages global PAIRED operations: registry, aggregation, updates

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY_FILE="$HOME/.paired/registry/projects.json"
GLOBAL_MEMORY="$HOME/.paired/memory/global_knowledge.md"

# Help function
show_help() {
    echo -e "${BLUE}🌍 PAIRED Global Manager${NC}"
    echo "===================="
    echo ""
    echo "Usage: paired-global <command> [options]"
    echo ""
    echo "Commands:"
    echo "  registry              - Show all registered projects"
    echo "  status               - Show global system status"
    echo "  register <path>      - Register a project manually"
    echo "  unregister <path>    - Unregister a project"
    echo "  aggregate-learning   - Collect learning from all projects"
    echo "  sync-patterns        - Update pattern library"
    echo "  health-check         - Verify all local instances"
    echo "  update-all           - Push updates to all projects"
    echo "  cleanup              - Clean up inactive projects"
    echo ""
    echo "Examples:"
    echo "  paired-global registry"
    echo "  paired-global register /path/to/project"
    echo "  paired-global aggregate-learning"
}

# Registry functions
show_registry() {
    echo -e "${BLUE}📊 PAIRED Project Registry${NC}"
    echo "======================="
    echo ""
    
    if [ ! -f "$REGISTRY_FILE" ]; then
        echo -e "${RED}❌ Registry file not found${NC}"
        return 1
    fi
    
    local total=$(jq -r '.global_stats.total_projects' "$REGISTRY_FILE" 2>/dev/null || echo "0")
    
    if [ "$total" -eq 0 ]; then
        echo "No projects registered yet"
        echo -e "${YELLOW}💡 Use 'paired-init' in a project to register it${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Total Projects: $total${NC}"
    echo ""
    
    # Show projects in table format
    echo -e "${BLUE}Name${NC}                ${BLUE}Path${NC}                                    ${BLUE}Status${NC}     ${BLUE}Agents${NC}"
    echo "----                ----                                    ------     ------"
    
    jq -r '.projects[] | "\(.name)|\(.path)|\(.status)|\(.agents_active | join(","))"' "$REGISTRY_FILE" 2>/dev/null | \
    while IFS='|' read -r name path status agents; do
        printf "%-20s %-40s %-10s %s\n" "$name" "$path" "$status" "$agents"
    done
}

register_project() {
    local project_path="${1:-$(pwd)}"
    project_path=$(realpath "$project_path")
    
    echo -e "${BLUE}📝 Registering project: $project_path${NC}"
    
    # Check if project has PAIRED
    if [ ! -f "$project_path/.pairedrules" ] && [ ! -d "$project_path/.paired" ]; then
        echo -e "${YELLOW}⚠️  Project doesn't appear to have PAIRED initialized${NC}"
        echo -e "${YELLOW}💡 Run 'paired-init' in the project first${NC}"
        return 1
    fi
    
    # Generate project data
    local project_name=$(basename "$project_path")
    local project_id="proj_$(date +%s)"
    local tech_stack="[]"
    
    # Detect tech stack
    if [ -f "$project_path/package.json" ]; then
        tech_stack='["node", "javascript"]'
    elif [ -f "$project_path/requirements.txt" ]; then
        tech_stack='["python"]'
    elif [ -f "$project_path/Cargo.toml" ]; then
        tech_stack='["rust"]'
    elif [ -f "$project_path/go.mod" ]; then
        tech_stack='["go"]'
    fi
    
    # Add to registry
    local temp_file=$(mktemp)
    jq --arg id "$project_id" \
       --arg name "$project_name" \
       --arg path "$project_path" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       --argjson tech_stack "$tech_stack" \
       '.projects += [{
         "id": $id,
         "path": $path,
         "name": $name,
         "tech_stack": $tech_stack,
         "paired_version": "2.0.0-alpha",
         "last_sync": $timestamp,
         "agents_active": ["pm"],
         "learning_contributions": 0,
         "status": "active"
       }] | .global_stats.total_projects = (.projects | length) | .global_stats.active_projects = (.projects | map(select(.status == "active")) | length)' \
       "$REGISTRY_FILE" > "$temp_file" && mv "$temp_file" "$REGISTRY_FILE"
    
    echo -e "${GREEN}✅ Project registered successfully${NC}"
}

aggregate_learning() {
    echo -e "${BLUE}🧠 Aggregating learning from all projects...${NC}"
    
    local learning_count=0
    local backup_file="$HOME/.paired/memory/global_knowledge_backup_$(date +%Y%m%d_%H%M%S).md"
    
    # Backup current knowledge
    if [ -f "$GLOBAL_MEMORY" ]; then
        cp "$GLOBAL_MEMORY" "$backup_file"
        echo -e "${YELLOW}📋 Backed up current knowledge to: $backup_file${NC}"
    fi
    
    # Collect learning from each project
    jq -r '.projects[] | select(.status == "active") | .path' "$REGISTRY_FILE" 2>/dev/null | \
    while read -r project_path; do
        if [ -f "$project_path/.paired/memory/ai_memory.md" ]; then
            echo "## Learning from $(basename "$project_path")" >> "$GLOBAL_MEMORY"
            echo "**Source**: $project_path" >> "$GLOBAL_MEMORY"
            echo "**Date**: $(date)" >> "$GLOBAL_MEMORY"
            echo "" >> "$GLOBAL_MEMORY"
            
            # Extract key insights (simplified for MVP)
            grep -E "^(#|##|\*\*|Key|Important|Solution|Pattern)" "$project_path/.paired/memory/ai_memory.md" 2>/dev/null >> "$GLOBAL_MEMORY" || true
            echo "" >> "$GLOBAL_MEMORY"
            
            ((learning_count++))
        fi
    done
    
    # Update stats
    local temp_file=$(mktemp)
    jq --arg count "$learning_count" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.global_stats.total_learning_items = ($count | tonumber) | .global_stats.last_aggregation = $timestamp' \
       "$REGISTRY_FILE" > "$temp_file" && mv "$temp_file" "$REGISTRY_FILE"
    
    echo -e "${GREEN}✅ Aggregated learning from $learning_count projects${NC}"
}

health_check() {
    echo -e "${BLUE}🔍 Checking health of all PAIRED projects...${NC}"
    
    local healthy=0
    local unhealthy=0
    
    jq -r '.projects[] | "\(.path)|\(.name)"' "$REGISTRY_FILE" 2>/dev/null | \
    while IFS='|' read -r project_path project_name; do
        if [ -d "$project_path" ] && ([ -f "$project_path/.pairedrules" ] || [ -d "$project_path/.paired" ]); then
            echo -e "${GREEN}✅ $project_name${NC} ($project_path)"
            ((healthy++))
        else
            echo -e "${RED}❌ $project_name${NC} ($project_path) - Missing or moved"
            ((unhealthy++))
        fi
    done
    
    echo ""
    echo -e "${GREEN}Healthy: $healthy${NC}"
    echo -e "${RED}Unhealthy: $unhealthy${NC}"
}

# Main command handling
case "${1:-help}" in
    "registry")
        show_registry
        ;;
    "status")
        exec "$HOME/.paired/scripts/global-status.sh"
        ;;
    "register")
        register_project "${2:-}"
        ;;
    "unregister")
        echo -e "${YELLOW}🚧 Unregister functionality coming soon${NC}"
        ;;
    "aggregate-learning")
        aggregate_learning
        ;;
    "sync-patterns")
        echo -e "${YELLOW}🚧 Pattern sync functionality coming soon${NC}"
        ;;
    "health-check")
        health_check
        ;;
    "update-all")
        echo -e "${YELLOW}🚧 Update all functionality coming soon${NC}"
        ;;
    "cleanup")
        echo -e "${YELLOW}🚧 Cleanup functionality coming soon${NC}"
        ;;
    "help"|*)
        show_help
        ;;
esac
