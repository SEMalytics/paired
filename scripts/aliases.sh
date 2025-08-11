#!/bin/bash
# WEE (Windsurf Evolutionary Ecosystem) Aliases
# This file is sourced by shell RC files for WEE integration

# Detect current project's WEE directory
if [ -d "$(pwd)/.wee" ]; then
    WEE_PROJECT_ROOT="$(pwd)"
elif [ -f "$(pwd)/.weerules" ]; then
    WEE_PROJECT_ROOT="$(pwd)"
else
    # Look for .wee directory in parent directories
    current_dir="$(pwd)"
    while [ "$current_dir" != "/" ]; do
        if [ -d "$current_dir/.wee" ] || [ -f "$current_dir/.weerules" ]; then
            WEE_PROJECT_ROOT="$current_dir"
            break
        fi
        current_dir="$(dirname "$current_dir")"
    done
fi

# WEE global directory
WEE_GLOBAL_DIR="$HOME/.wee"

# Core WEE aliases
alias wee-init="$WEE_GLOBAL_DIR/scripts/init-project.sh"
alias wee-status="$WEE_GLOBAL_DIR/scripts/global-status.sh"
alias wee-knowledge="$WEE_GLOBAL_DIR/scripts/share-knowledge.sh"
alias wee-doctor="$WEE_GLOBAL_DIR/scripts/wee-doctor.sh"
alias wee-backup="$WEE_GLOBAL_DIR/scripts/windsurf-backup.sh"
alias wee-sync="$WEE_GLOBAL_DIR/scripts/knowledge-sync.sh"
alias wee-global="$WEE_GLOBAL_DIR/scripts/global-manager.sh"
# alias wee-verify="$WEE_GLOBAL_DIR/scripts/verify-shell-integration.sh"  # TODO: Create this script

# Project-specific aliases (if in a WEE project)
if [ -n "${WEE_PROJECT_ROOT:-}" ]; then
    # Check for scripts in .wee/scripts/ directory (clean install location)
    if [ -x "$WEE_PROJECT_ROOT/.wee/scripts/handoff.sh" ]; then
        alias wh="$WEE_PROJECT_ROOT/.wee/scripts/handoff.sh"
    fi
    
    if [ -x "$WEE_PROJECT_ROOT/.wee/scripts/resume.sh" ]; then
        alias wr="$WEE_PROJECT_ROOT/.wee/scripts/resume.sh"
    fi
    
    if [ -x "$WEE_PROJECT_ROOT/.wee/scripts/doc_discovery.sh" ]; then
        alias wdocs="$WEE_PROJECT_ROOT/.wee/scripts/doc_discovery.sh"
    fi
    
    if [ -x "$WEE_PROJECT_ROOT/.wee/scripts/type_cleanup.py" ]; then
        alias wtype="$WEE_PROJECT_ROOT/.wee/scripts/type_cleanup.py"
    fi
    
    # Environment management
    if [ -x "$WEE_PROJECT_ROOT/.wee/scripts/set-env.sh" ]; then
        alias wenv-dev="$WEE_PROJECT_ROOT/.wee/scripts/set-env.sh dev"
        alias wenv-test="$WEE_PROJECT_ROOT/.wee/scripts/set-env.sh test"
        alias wenv-prod="$WEE_PROJECT_ROOT/.wee/scripts/set-env.sh prod"
    fi
fi

# Navigation aliases
alias wglobal="cd $WEE_GLOBAL_DIR"
alias wproject="cd ${WEE_PROJECT_ROOT:-$(pwd)}"

# Knowledge management aliases
alias wlearn="$WEE_GLOBAL_DIR/scripts/share-knowledge.sh"
alias wshare="$WEE_GLOBAL_DIR/scripts/share-knowledge.sh"

# Backward compatibility aliases (windsurf-* → wee-*)
alias windsurf-init="wee-init"
alias windsurf-status="wee-status"
alias windsurf-knowledge="wee-knowledge"
# alias windsurf-verify="wee-verify"  # TODO: Create verify script

# Display WEE branding message
echo "🌊 WEE (Windsurf Evolutionary Ecosystem) loaded"
echo "💡 Use 'wee-status' to see available commands"
