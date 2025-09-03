#!/bin/bash
# Windsurf Configuration Backup and Restore Utility
# Safely backs up existing Windsurf configs before PAIRED installation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Use external backup directory to prevent recursive copy disaster
BACKUP_DIR="$HOME/.paired-backups/windsurf-$(date +%Y%m%d-%H%M%S)"
RESTORE_MANIFEST="$HOME/.paired/backups/restore-manifest.json"

# Help function
show_help() {
    echo -e "${BLUE}💾 Windsurf Configuration Backup & Restore${NC}"
    echo "==========================================="
    echo ""
    echo "Usage: windsurf-backup <command> [options]"
    echo ""
    echo "Commands:"
    echo "  backup               - Create backup of existing Windsurf configs"
    echo "  restore [timestamp]  - Restore from backup (latest if no timestamp)"
    echo "  list                 - List available backups"
    echo "  status               - Show backup status and conflicts"
    echo "  clean [days]         - Clean backups older than N days (default: 30)"
    echo "  help                 - Show this help"
    echo ""
    echo "What gets backed up:"
    echo "  - ~/.pairedrules"
    echo "  - ~/.pairedfiles"
    echo "  - Shell aliases (from .bashrc/.zshrc)"
    echo "  - Any windsurf-related shell configuration"
    echo ""
    exit 0
}

# Detect shell configuration file
detect_shell_config() {
    if [ -n "${ZSH_VERSION:-}" ]; then
        echo "$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ]; then
        echo "$HOME/.bashrc"
    else
        # Try to detect from environment
        if [ -f "$HOME/.zshrc" ]; then
            echo "$HOME/.zshrc"
        elif [ -f "$HOME/.bashrc" ]; then
            echo "$HOME/.bashrc"
        else
            echo ""
        fi
    fi
}

# Check what Windsurf configs exist
check_existing_configs() {
    local configs_found=false
    
    echo -e "${CYAN}🔍 Scanning for existing Windsurf configurations...${NC}"
    
    # Check for global Windsurf rules
    if [ -f "$HOME/.pairedrules" ]; then
        echo -e "${YELLOW}📄 Found: ~/.pairedrules${NC}"
        configs_found=true
    fi
    
    # Check for Windsurf files
    if [ -f "$HOME/.pairedfiles" ]; then
        echo -e "${YELLOW}📄 Found: ~/.pairedfiles${NC}"
        configs_found=true
    fi
    
    # Check for shell aliases
    local shell_config
    shell_config=$(detect_shell_config)
    if [ -n "$shell_config" ] && [ -f "$shell_config" ]; then
        if grep -q "windsurf" "$shell_config" 2>/dev/null; then
            echo -e "${YELLOW}📄 Found: Windsurf aliases in $shell_config${NC}"
            configs_found=true
        fi
    fi
    
    # Check for Windsurf directory
    if [ -d "$HOME/.paired" ]; then
        echo -e "${YELLOW}📁 Found: ~/.paired directory${NC}"
        configs_found=true
    fi
    
    if [ "$configs_found" = false ]; then
        echo -e "${GREEN}✅ No existing Windsurf configurations found${NC}"
        return 1
    else
        echo ""
        return 0
    fi
}

# Create backup
create_backup() {
    echo -e "${BLUE}💾 Creating Windsurf configuration backup...${NC}"
    
    # Check if anything needs backing up
    if ! check_existing_configs; then
        echo -e "${GREEN}✅ No backup needed - no existing Windsurf configs found${NC}"
        return 0
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create backup manifest
    local manifest_file="$BACKUP_DIR/manifest.json"
    cat > "$manifest_file" << EOF
{
  "backup_timestamp": "$(date -Iseconds)",
  "backup_reason": "Pre-PAIRED installation safety backup",
  "backed_up_files": [],
  "shell_config": "$(detect_shell_config)",
  "paired_version": "2.0.0-alpha"
}
EOF
    
    local files_backed_up=0
    
    # Backup .pairedrules
    if [ -f "$HOME/.pairedrules" ]; then
        cp "$HOME/.pairedrules" "$BACKUP_DIR/windsurfrules.backup"
        echo -e "${GREEN}✅ Backed up ~/.pairedrules${NC}"
        files_backed_up=$((files_backed_up + 1))
    fi
    
    # Backup .pairedfiles
    if [ -f "$HOME/.pairedfiles" ]; then
        cp "$HOME/.pairedfiles" "$BACKUP_DIR/windsurffiles.backup"
        echo -e "${GREEN}✅ Backed up ~/.pairedfiles${NC}"
        files_backed_up=$((files_backed_up + 1))
    fi
    
    # Backup shell configuration (Windsurf-related lines only)
    local shell_config
    shell_config=$(detect_shell_config)
    if [ -n "$shell_config" ] && [ -f "$shell_config" ]; then
        if grep -q "windsurf" "$shell_config" 2>/dev/null; then
            # Extract only Windsurf-related lines
            grep -n "windsurf" "$shell_config" > "$BACKUP_DIR/shell-windsurf-lines.backup" 2>/dev/null || true
            # Also backup the entire file for safety
            cp "$shell_config" "$BACKUP_DIR/shell-config-full.backup"
            echo -e "${GREEN}✅ Backed up Windsurf shell configuration from $shell_config${NC}"
            files_backed_up=$((files_backed_up + 1))
        fi
    fi
    
    # Backup .paired directory if it exists (EXCLUDE backups dir to prevent recursion)
    if [ -d "$HOME/.paired" ]; then
        # Create temp directory for safe backup
        local temp_backup_dir
        temp_backup_dir=$(mktemp -d)
        
        # Copy .paired contents EXCLUDING the backups directory to prevent recursion
        rsync -av --exclude='backups/' "$HOME/.paired/" "$temp_backup_dir/" 2>/dev/null || {
            # Fallback: manual copy excluding backups
            mkdir -p "$temp_backup_dir"
            find "$HOME/.paired" -maxdepth 1 -not -name 'backups' -not -path "$HOME/.paired" -exec cp -r {} "$temp_backup_dir/" \; 2>/dev/null || true
        }
        
        # Move the safe backup to final location
        mv "$temp_backup_dir" "$BACKUP_DIR/windsurf-directory.backup"
        echo -e "${GREEN}✅ Backed up ~/.paired directory (excluding backups to prevent recursion)${NC}"
        files_backed_up=$((files_backed_up + 1))
    fi
    
    # Update global restore manifest
    mkdir -p "$(dirname "$RESTORE_MANIFEST")"
    if [ ! -f "$RESTORE_MANIFEST" ]; then
        echo "[]" > "$RESTORE_MANIFEST"
    fi
    
    # Add this backup to the manifest
    local temp_manifest
    temp_manifest=$(mktemp)
    jq ". += [{
        \"timestamp\": \"$(date -Iseconds)\",
        \"backup_dir\": \"$BACKUP_DIR\",
        \"files_count\": $files_backed_up,
        \"reason\": \"Pre-PAIRED installation safety backup\"
    }]" "$RESTORE_MANIFEST" > "$temp_manifest" && mv "$temp_manifest" "$RESTORE_MANIFEST"
    
    echo ""
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo -e "${CYAN}📁 Backup location: $BACKUP_DIR${NC}"
    echo -e "${CYAN}📊 Files backed up: $files_backed_up${NC}"
    echo ""
    echo -e "${YELLOW}💡 To restore later: windsurf-backup restore${NC}"
}

# List available backups
list_backups() {
    echo -e "${BLUE}📋 Available Windsurf Configuration Backups${NC}"
    echo "==========================================="
    
    if [ ! -f "$RESTORE_MANIFEST" ]; then
        echo -e "${YELLOW}No backups found${NC}"
        return 0
    fi
    
    local backup_count
    backup_count=$(jq length "$RESTORE_MANIFEST")
    
    if [ "$backup_count" -eq 0 ]; then
        echo -e "${YELLOW}No backups found${NC}"
        return 0
    fi
    
    echo ""
    jq -r '.[] | "\(.timestamp) - \(.files_count) files - \(.reason)"' "$RESTORE_MANIFEST" | \
    while read -r line; do
        echo -e "${GREEN}📦 $line${NC}"
    done
    
    echo ""
    echo -e "${CYAN}Total backups: $backup_count${NC}"
}

# Restore from backup
restore_backup() {
    local target_timestamp="$1"
    
    echo -e "${BLUE}🔄 Restoring Windsurf configuration...${NC}"
    
    if [ ! -f "$RESTORE_MANIFEST" ]; then
        echo -e "${RED}❌ No backup manifest found${NC}"
        exit 1
    fi
    
    local backup_dir
    if [ -n "$target_timestamp" ]; then
        backup_dir=$(jq -r ".[] | select(.timestamp | startswith(\"$target_timestamp\")) | .backup_dir" "$RESTORE_MANIFEST" | head -1)
    else
        backup_dir=$(jq -r ".[-1].backup_dir" "$RESTORE_MANIFEST")
    fi
    
    if [ -z "$backup_dir" ] || [ "$backup_dir" = "null" ]; then
        echo -e "${RED}❌ No backup found for timestamp: $target_timestamp${NC}"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        echo -e "${RED}❌ Backup directory not found: $backup_dir${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}📁 Restoring from: $backup_dir${NC}"
    echo ""
    
    # Restore files
    local restored_count=0
    
    if [ -f "$backup_dir/windsurfrules.backup" ]; then
        cp "$backup_dir/windsurfrules.backup" "$HOME/.pairedrules"
        echo -e "${GREEN}✅ Restored ~/.pairedrules${NC}"
        restored_count=$((restored_count + 1))
    fi
    
    if [ -f "$backup_dir/windsurffiles.backup" ]; then
        cp "$backup_dir/windsurffiles.backup" "$HOME/.pairedfiles"
        echo -e "${GREEN}✅ Restored ~/.pairedfiles${NC}"
        restored_count=$((restored_count + 1))
    fi
    
    if [ -f "$backup_dir/shell-config-full.backup" ]; then
        local shell_config
        shell_config=$(detect_shell_config)
        if [ -n "$shell_config" ]; then
            echo -e "${YELLOW}⚠️  Shell config restoration requires manual review${NC}"
            echo -e "${CYAN}💡 Backup available at: $backup_dir/shell-config-full.backup${NC}"
            echo -e "${CYAN}💡 Windsurf lines at: $backup_dir/shell-windsurf-lines.backup${NC}"
        fi
    fi
    
    if [ -d "$backup_dir/windsurf-directory.backup" ]; then
        if [ -d "$HOME/.paired" ]; then
            echo -e "${YELLOW}⚠️  ~/.paired already exists, creating .paired.paired-replaced${NC}"
            mv "$HOME/.paired" "$HOME/.paired.paired-replaced"
        fi
        cp -r "$backup_dir/windsurf-directory.backup" "$HOME/.paired"
        echo -e "${GREEN}✅ Restored ~/.paired directory${NC}"
        restored_count=$((restored_count + 1))
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Restoration completed!${NC}"
    echo -e "${CYAN}📊 Files restored: $restored_count${NC}"
    echo -e "${YELLOW}💡 You may need to restart your terminal for changes to take effect${NC}"
}

# Show status
show_status() {
    echo -e "${BLUE}📊 Windsurf Configuration Status${NC}"
    echo "================================"
    echo ""
    
    check_existing_configs
    echo ""
    
    if [ -f "$RESTORE_MANIFEST" ]; then
        local backup_count
        backup_count=$(jq length "$RESTORE_MANIFEST")
        echo -e "${CYAN}📦 Available backups: $backup_count${NC}"
        
        if [ "$backup_count" -gt 0 ]; then
            local latest_backup
            latest_backup=$(jq -r ".[-1].timestamp" "$RESTORE_MANIFEST")
            echo -e "${CYAN}📅 Latest backup: $latest_backup${NC}"
        fi
    else
        echo -e "${YELLOW}📦 No backups available${NC}"
    fi
}

# Clean old backups
clean_backups() {
    local days="${1:-30}"
    
    echo -e "${BLUE}🧹 Cleaning backups older than $days days...${NC}"
    
    if [ ! -f "$RESTORE_MANIFEST" ]; then
        echo -e "${GREEN}✅ No backups to clean${NC}"
        return 0
    fi
    
    local cutoff_date
    cutoff_date=$(date -d "$days days ago" -Iseconds 2>/dev/null || date -v-"$days"d -Iseconds)
    
    local temp_manifest
    temp_manifest=$(mktemp)
    
    # Filter out old backups and remove their directories
    jq --arg cutoff "$cutoff_date" '
        map(select(.timestamp >= $cutoff))
    ' "$RESTORE_MANIFEST" > "$temp_manifest"
    
    # Remove old backup directories
    jq --arg cutoff "$cutoff_date" -r '
        .[] | select(.timestamp < $cutoff) | .backup_dir
    ' "$RESTORE_MANIFEST" | while read -r backup_dir; do
        if [ -d "$backup_dir" ]; then
            rm -rf "$backup_dir"
            echo -e "${GREEN}🗑️  Removed old backup: $(basename "$backup_dir")${NC}"
        fi
    done
    
    mv "$temp_manifest" "$RESTORE_MANIFEST"
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main command handling
case "${1:-help}" in
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup "${2:-}"
        ;;
    "list")
        list_backups
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_backups "${2:-30}"
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        ;;
esac
