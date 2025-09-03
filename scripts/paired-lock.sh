#!/bin/bash
# PAIRED Lock System - Selective Write Protection
# Protects .paired directories while allowing memory/cache writes

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PAIRED_DIR="$HOME/.paired"
LOCK_FILE="$HOME/.paired/.paired-lock"

echo -e "${BLUE}🔒 PAIRED Lock System${NC}"
echo "====================="

check_paired_dir() {
    if [ ! -d "$PAIRED_DIR" ]; then
        echo -e "${RED}❌ No .paired directory found at $PAIRED_DIR${NC}"
        exit 1
    fi
}

lock_paired() {
    echo -e "${YELLOW}🔒 Locking .paired directory...${NC}"
    
    # Create lock file with timestamp and reason
    echo "Locked at: $(date)" > "$LOCK_FILE"
    echo "Reason: ${LOCK_REASON:-Auto-lock after install}" >> "$LOCK_FILE"
    
    # Make most .paired files read-only, but preserve execute permissions for scripts/binaries
    find "$PAIRED_DIR" -type f -not -path "*/memory/*" -not -path "*/cache/*" -not -path "*/sessions/*" -not -path "*/registry/*" -not -name "*.sh" -not -path "*/bin/*" -exec chmod 444 {} \;
    
    # Keep scripts and binaries executable
    find "$PAIRED_DIR" -name "*.sh" -not -path "*/memory/*" -not -path "*/cache/*" -not -path "*/sessions/*" -not -path "*/registry/*" -exec chmod 555 {} \;
    find "$PAIRED_DIR/bin" -type f -exec chmod 555 {} \; 2>/dev/null || true
    
    # Keep memory/cache/registry directories writable
    find "$PAIRED_DIR/memory" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$PAIRED_DIR/cache" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$PAIRED_DIR/sessions" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$PAIRED_DIR/registry" -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    # Make directories readable/executable but not writable
    find "$PAIRED_DIR" -type d -not -path "*/memory*" -not -path "*/cache*" -not -path "*/sessions*" -not -path "*/registry*" -exec chmod 555 {} \;
    
    # Keep memory/cache/registry directories writable
    chmod 755 "$PAIRED_DIR/memory" 2>/dev/null || true
    chmod 755 "$PAIRED_DIR/cache" 2>/dev/null || true  
    chmod 755 "$PAIRED_DIR/sessions" 2>/dev/null || true
    chmod 755 "$PAIRED_DIR/registry" 2>/dev/null || true
    
    echo -e "${GREEN}✅ .paired directory locked${NC}"
    echo -e "${BLUE}💡 Memory/cache/registry directories remain writable${NC}"
}

unlock_paired() {
    echo -e "${YELLOW}🔓 Unlocking .paired directory...${NC}"
    
    # Restore write permissions while preserving execute for scripts/binaries
    find "$PAIRED_DIR" -type f -not -name "*.sh" -not -path "*/bin/*" -exec chmod 644 {} \;
    find "$PAIRED_DIR" -name "*.sh" -exec chmod 755 {} \;
    find "$PAIRED_DIR/bin" -type f -exec chmod 755 {} \; 2>/dev/null || true
    find "$PAIRED_DIR" -type d -exec chmod 755 {} \;
    
    # Remove lock file
    rm -f "$LOCK_FILE"
    
    echo -e "${GREEN}✅ .paired directory unlocked${NC}"
}

status_paired() {
    if [ -f "$LOCK_FILE" ]; then
        echo -e "${RED}🔒 .paired directory is LOCKED${NC}"
        echo -e "${BLUE}Lock created: $(cat "$LOCK_FILE")${NC}"
        
        # Show what's writable
        echo -e "${YELLOW}Writable directories:${NC}"
        find "$PAIRED_DIR" -type d -writable 2>/dev/null | sed 's/^/  ✅ /'
        
        echo -e "${YELLOW}Read-only directories:${NC}"
        find "$PAIRED_DIR" -type d -not -writable 2>/dev/null | sed 's/^/  🔒 /'
    else
        echo -e "${GREEN}🔓 .paired directory is UNLOCKED${NC}"
    fi
}

sync_changes() {
    echo -e "${YELLOW}🔄 Syncing .paired changes back to repo...${NC}"
    
    # Create templates directory if it doesn't exist
    mkdir -p templates
    
    # Sync key configuration files back to repo templates
    if [ -f "$PAIRED_DIR/windsurfrules" ]; then
        echo "✅ Syncing windsurfrules"
        cp "$PAIRED_DIR/windsurfrules" templates/windsurfrules
    fi
    
    if [ -f "$PAIRED_DIR/windsurf_agent_types.yml" ]; then
        echo "✅ Syncing windsurf_agent_types.yml"
        cp "$PAIRED_DIR/windsurf_agent_types.yml" templates/windsurf_agent_types.yml
    fi
    
    if [ -f "$PAIRED_DIR/agent_definitions.md" ]; then
        echo "✅ Syncing agent_definitions.md"
        cp "$PAIRED_DIR/agent_definitions.md" templates/agent_definitions.md
    fi
    
    if [ -d "$PAIRED_DIR/project-scripts" ]; then
        echo "✅ Syncing project-scripts"
        cp -r "$PAIRED_DIR/project-scripts/"* templates/project-scripts/ 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Sync complete - check git status for changes${NC}"
}

request_unlock() {
    echo -e "${YELLOW}🔓 Requesting unlock permission...${NC}"
    echo -e "${BLUE}This will unlock .paired directory for AI modifications.${NC}"
    echo -e "${RED}⚠️  AI changes in .paired will NOT be automatically saved to repo!${NC}"
    echo -e "${CYAN}💡 Use 'paired-lock sync' to capture changes back to repo${NC}"
    echo ""
    read -p "Are you sure you want to unlock .paired? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        LOCK_REASON="User-requested unlock for AI modifications"
        unlock_paired
        echo -e "${YELLOW}⏰ Remember to run 'paired-lock sync' to save any AI fixes!${NC}"
    else
        echo -e "${GREEN}✅ .paired remains locked and protected${NC}"
    fi
}

auto_lock() {
    echo -e "${BLUE}🔒 Auto-locking .paired after install...${NC}"
    LOCK_REASON="Auto-lock after install - protects configuration files"
    lock_paired
}

case "${1:-status}" in
    lock)
        check_paired_dir
        lock_paired
        ;;
    unlock)
        check_paired_dir
        request_unlock
        ;;
    force-unlock)
        check_paired_dir
        unlock_paired
        ;;
    auto-lock)
        check_paired_dir
        auto_lock
        ;;
    status)
        check_paired_dir
        status_paired
        ;;
    sync)
        check_paired_dir
        sync_changes
        ;;
    *)
        echo "Usage: $0 {lock|unlock|force-unlock|auto-lock|status|sync}"
        echo "  lock        - Lock .paired directory (read-only except memory/cache)"
        echo "  unlock      - Request permission to unlock .paired directory"
        echo "  force-unlock- Force unlock without confirmation (for scripts)"
        echo "  auto-lock   - Auto-lock after install (called by install script)"
        echo "  status      - Show current lock status"
        echo "  sync        - Sync .paired changes back to repo templates"
        exit 1
        ;;
esac
