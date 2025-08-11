#!/bin/bash
# Architecture Agent Shell Aliases
# Integrates Architecture functionality with existing Windsurf alias system

# Get the project root directory
WINDSURF_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ARCH_SCRIPTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/architecture_agent/scripts"
ARCH_AGENTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/architecture_agent"
ARCH_TRACKING_DIR="$ARCH_AGENTS_DIR/tracking"

# Architecture Status and Monitoring
alias arch-status="$ARCH_SCRIPTS_DIR/arch_notifications.sh check"
alias arch-monitor="$ARCH_SCRIPTS_DIR/arch_notifications.sh start"
alias arch-notify-test="$ARCH_SCRIPTS_DIR/arch_notifications.sh test"

# Architecture Tracking Views
alias arch-adrs="cat $ARCH_TRACKING_DIR/adr_registry.md"
alias arch-patterns="cat $ARCH_TRACKING_DIR/pattern_analysis.md"
alias arch-debt="cat $ARCH_TRACKING_DIR/tech_debt.md"
alias arch-compliance="cat $ARCH_TRACKING_DIR/compliance_status.md"
alias arch-decisions="cat $ARCH_TRACKING_DIR/adr_history.md"

# Architecture Editing
alias arch-edit-adrs="open -a 'Windsurf' $ARCH_TRACKING_DIR/adr_registry.md"
alias arch-edit-patterns="open -a 'Windsurf' $ARCH_TRACKING_DIR/pattern_analysis.md"
alias arch-edit-debt="open -a 'Windsurf' $ARCH_TRACKING_DIR/tech_debt.md"
alias arch-edit-compliance="open -a 'Windsurf' $ARCH_TRACKING_DIR/compliance_status.md"

# ADR Management
alias arch-adr-new='function _arch_adr_new() { 
    local title="${1:-New Architecture Decision}"
    echo "🏗️ Creating new ADR: $title"
    node "$ARCH_AGENTS_DIR/cli/adr.js" create "$title"
}; _arch_adr_new'

alias arch-adr-list='echo "📋 Architecture Decision Records:" && node "$ARCH_AGENTS_DIR/cli/adr.js" list'
alias arch-adr-status='node "$ARCH_AGENTS_DIR/cli/adr.js" status'

alias arch-adr-accept='function _arch_adr_accept() { 
    local adr_id="$1"
    if [[ -z "$adr_id" ]]; then
        echo "Usage: arch-adr-accept <adr_id>"
        return 1
    fi
    echo "✅ Accepting ADR $adr_id"
    node "$ARCH_AGENTS_DIR/cli/adr.js" accept "$adr_id"
}; _arch_adr_accept'

alias arch-adr-reject='function _arch_adr_reject() { 
    local adr_id="$1"
    local reason="${2:-No reason provided}"
    if [[ -z "$adr_id" ]]; then
        echo "Usage: arch-adr-reject <adr_id> [reason]"
        return 1
    fi
    echo "❌ Rejecting ADR $adr_id: $reason"
    node "$ARCH_AGENTS_DIR/cli/adr.js" reject "$adr_id" "$reason"
}; _arch_adr_reject'

# Pattern Analysis
alias arch-patterns-analyze='echo "🔍 Analyzing architectural patterns..." && node "$ARCH_AGENTS_DIR/cli/patterns.js" analyze'
alias arch-patterns-violations='echo "🚨 Checking pattern violations..." && node "$ARCH_AGENTS_DIR/cli/patterns.js" violations'
alias arch-patterns-opportunities='echo "💡 Identifying pattern opportunities..." && node "$ARCH_AGENTS_DIR/cli/patterns.js" opportunities'
alias arch-patterns-health='echo "📊 Pattern health score..." && node "$ARCH_AGENTS_DIR/cli/patterns.js" health'

# Technical Debt Management
alias arch-debt-scan='echo "🔍 Scanning for technical debt..." && node "$ARCH_AGENTS_DIR/cli/debt.js" scan'
alias arch-debt-plan='echo "📋 Creating remediation plan..." && node "$ARCH_AGENTS_DIR/cli/debt.js" plan'
alias arch-debt-summary='echo "📊 Technical debt summary..." && node "$ARCH_AGENTS_DIR/cli/debt.js" summary'
alias arch-debt-priority='echo "⚡ High priority debt items..." && node "$ARCH_AGENTS_DIR/cli/debt.js" priority'

# Architecture Quick Actions
alias arch-review='echo "🏗️ Starting architecture review..." && cd "$WINDSURF_PROJECT_ROOT" && echo "Ready to review architecture in docs/architecture/"'
alias arch-design='echo "📐 Architecture design session..." && echo "Opening architecture documentation..."'
alias arch-compliance-check='echo "✅ Checking architectural compliance..." && node "$ARCH_AGENTS_DIR/cli/compliance.js"'

# Architecture Git Integration
alias arch-update='echo "🏗️ Updating architecture tracking..." && git add "$ARCH_AGENTS_DIR/tracking/" && git commit -m "Architecture: Update tracking and decisions"'
alias arch-sync='echo "🔄 Syncing architecture data..." && git pull && git push'

# Architecture Workflows
alias arch-workflow="cat $WINDSURF_PROJECT_ROOT/.wee/workflows/architecture_governance.md"

# Architecture Reports
alias arch-report='echo "📊 Generating Architecture Report..." && echo "=== ADR SUMMARY ===" && tail -20 "$ARCH_TRACKING_DIR/adr_registry.md" && echo -e "\n=== PATTERN ANALYSIS ===" && tail -15 "$ARCH_TRACKING_DIR/pattern_analysis.md" && echo -e "\n=== TECHNICAL DEBT ===" && tail -15 "$ARCH_TRACKING_DIR/tech_debt.md"'

alias arch-summary='echo "📋 Architecture Summary:" && echo "ADRs: $(grep -c "## ADR-" "$ARCH_TRACKING_DIR/adr_registry.md" 2>/dev/null || echo "0") decisions" && echo "Patterns: $(grep -c "Pattern.*detected" "$ARCH_TRACKING_DIR/pattern_analysis.md" 2>/dev/null || echo "0") detected" && echo "Tech Debt: $(grep -c "Debt.*Item" "$ARCH_TRACKING_DIR/tech_debt.md" 2>/dev/null || echo "0") items"'

# Architecture Story Review
alias arch-review-story='function _arch_review() { 
    local story_file="${1:-$(ls -t $WINDSURF_PROJECT_ROOT/docs/stories/*.md 2>/dev/null | head -1)}"
    if [[ -f "$story_file" ]]; then
        echo "🏗️ Reviewing story architecture: $story_file"
        cat "$story_file"
        echo -e "\n📋 Architecture Checklist:"
        echo "- [ ] Architectural impact assessed"
        echo "- [ ] Design patterns identified"
        echo "- [ ] Technical debt implications considered"
        echo "- [ ] ADR needed for significant decisions"
        echo "- [ ] Compliance with architectural standards"
        echo "- [ ] Performance and scalability considerations"
    else
        echo "❌ No story file found"
        echo "Usage: arch-review-story [story-file.md]"
    fi
}; _arch_review'

# Architecture Integration Status
alias arch-integration='echo "🔧 Architecture Integration Status:" && echo "ADR System: $(ls "$ARCH_TRACKING_DIR/adr_registry.md" 2>/dev/null && echo "✅" || echo "❌")" && echo "Pattern Catalog: $(ls "$ARCH_AGENTS_DIR/modules/pattern_catalog.js" 2>/dev/null && echo "✅" || echo "❌")" && echo "Debt Tracker: $(ls "$ARCH_AGENTS_DIR/modules/tech_debt_tracker.js" 2>/dev/null && echo "✅" || echo "❌")" && echo "CLI Tools: $(ls "$ARCH_AGENTS_DIR/cli" 2>/dev/null && echo "✅" || echo "❌")"'

# Architecture Documentation
alias arch-docs='echo "📚 Architecture Documentation:" && echo "ADRs: docs/architecture/adrs/" && echo "Patterns: docs/architecture/patterns/" && echo "Decisions: docs/architecture/decisions/" && ls -la "$WINDSURF_PROJECT_ROOT/docs/architecture/" 2>/dev/null || echo "Architecture docs directory not found"'

# Architecture Quality Gates
alias arch-gate='echo "🚪 Architecture Quality Gate Check:" && arch-compliance-check && arch-patterns-violations && arch-debt-priority'
alias arch-gate-strict='echo "🔒 Strict Architecture Gate:" && arch-gate && echo "Checking for blocking issues..." && echo "Gate status: $(arch-gate 2>&1 | grep -q "❌\|🚨" && echo "BLOCKED" || echo "PASSED")"'

# Architecture Metrics Dashboard
alias arch-dashboard='echo "📊 Architecture Metrics Dashboard:" && echo "===============================" && arch-summary && echo -e "\n📈 Recent Trends:" && echo "ADRs: $(grep -c "## ADR-" "$ARCH_TRACKING_DIR/adr_registry.md" | tail -5 | tr "\n" " " || echo "No data")" && echo "Debt Items: $(grep -c "### " "$ARCH_TRACKING_DIR/tech_debt.md" | tail -5 | tr "\n" " " || echo "No data")"'

# Architecture Decision Support
alias arch-decide='function _arch_decide() {
    local decision_topic="${1:-Architecture Decision}"
    echo "🤔 Architecture Decision Support: $decision_topic"
    echo "1. What is the problem or opportunity?"
    echo "2. What are the constraints and requirements?"
    echo "3. What are the alternative solutions?"
    echo "4. What are the trade-offs for each alternative?"
    echo "5. What is the recommended solution and why?"
    echo ""
    echo "Use: arch-adr-new \"$decision_topic\" to create an ADR"
}; _arch_decide'

# Architecture Refactoring Support
alias arch-refactor='echo "🔄 Architecture Refactoring Support:" && echo "1. Identify refactoring target" && echo "2. Assess impact and dependencies" && echo "3. Create refactoring plan" && echo "4. Execute in phases" && echo "5. Validate and measure" && echo "" && echo "Use arch-debt-plan for technical debt remediation"'

# Architecture Help
alias arch-help='echo "🏗️ Architecture Agent Commands:

Status & Monitoring:
  arch-status          - Check current architecture notifications
  arch-monitor         - Start architecture monitoring daemon
  arch-notify-test     - Test architecture notifications
  arch-summary         - Quick architecture status summary
  arch-dashboard       - Full architecture metrics dashboard

ADR Management:
  arch-adr-new <title> - Create new Architecture Decision Record
  arch-adr-list        - List all ADRs
  arch-adr-status      - Show ADR status summary
  arch-adr-accept <id> - Accept an ADR
  arch-adr-reject <id> - Reject an ADR with reason

Pattern Analysis:
  arch-patterns-analyze     - Analyze architectural patterns
  arch-patterns-violations  - Check for pattern violations
  arch-patterns-opportunities - Identify pattern opportunities
  arch-patterns-health      - Calculate pattern health score

Technical Debt:
  arch-debt-scan       - Scan for technical debt
  arch-debt-plan       - Create debt remediation plan
  arch-debt-summary    - Show debt summary
  arch-debt-priority   - Show high priority debt items

Quality Gates:
  arch-gate            - Run architecture quality gate
  arch-gate-strict     - Run strict quality gate (blocking)
  arch-compliance-check - Check architectural compliance

Reports & Analysis:
  arch-report          - Generate architecture report
  arch-review-story    - Review story for architecture impact
  arch-decide <topic>  - Architecture decision support

Documentation:
  arch-docs            - View architecture documentation
  arch-workflow        - View architecture workflow

Git Integration:
  arch-update          - Commit architecture tracking updates
  arch-sync            - Sync architecture data with remote

Configuration:
  arch-integration     - Check integration status
  arch-help            - Show this help message

Examples:
  arch-adr-new \"Microservices Migration\"
  arch-patterns-analyze && arch-debt-scan
  arch-review-story docs/stories/user-service.md
  arch-gate-strict
"'

# Architecture Initialization
alias arch-init='echo "🚀 Initializing Architecture Agent..." && mkdir -p "$ARCH_TRACKING_DIR" && mkdir -p "$WINDSURF_PROJECT_ROOT/docs/architecture/adrs" && echo "Architecture Agent tracking directories created" && arch-integration'

# Architecture Cleanup
alias arch-clean='echo "🧹 Cleaning architecture temporary files..." && rm -f "$ARCH_TRACKING_DIR"/*.tmp && echo "Architecture cleanup complete"'

# Export Architecture environment variables
export ARCH_AGENTS_DIR
export ARCH_TRACKING_DIR
export ARCH_SCRIPTS_DIR

echo "🏗️ Architecture Agent aliases loaded. Type 'arch-help' for available commands."
