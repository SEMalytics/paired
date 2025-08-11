#!/bin/bash
# QA Agent Shell Aliases
# Integrates QA functionality with existing Windsurf alias system

# Get the project root directory
WINDSURF_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
QA_SCRIPTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/qa_agent/scripts"
QA_AGENTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/qa_agent"
QA_TRACKING_DIR="$QA_AGENTS_DIR/tracking"

# QA Status and Monitoring
alias qa-status="$QA_SCRIPTS_DIR/qa_notifications.sh check"
alias qa-monitor="$QA_SCRIPTS_DIR/qa_notifications.sh start"
alias qa-notify-test="$QA_SCRIPTS_DIR/qa_notifications.sh test"

# QA Tracking Views
alias qa-tests="cat $QA_TRACKING_DIR/test_results.md"
alias qa-coverage="cat $QA_TRACKING_DIR/test_coverage.md"
alias qa-quality="cat $QA_TRACKING_DIR/quality_metrics.md"
alias qa-reviews="cat $QA_TRACKING_DIR/review_history.md"
alias qa-audit="cat $QA_TRACKING_DIR/audit_history.md"
alias qa-compliance="cat $QA_TRACKING_DIR/compliance_status.md"

# QA Editing
alias qa-edit-tests="open -a 'Windsurf' $QA_TRACKING_DIR/test_results.md"
alias qa-edit-coverage="open -a 'Windsurf' $QA_TRACKING_DIR/test_coverage.md"
alias qa-edit-quality="open -a 'Windsurf' $QA_TRACKING_DIR/quality_metrics.md"
alias qa-edit-reviews="open -a 'Windsurf' $QA_TRACKING_DIR/review_history.md"

# QA Quick Actions
alias qa-review='echo "👀 Starting code review..." && cd "$WINDSURF_PROJECT_ROOT" && echo "Ready to review stories in docs/stories/"'
alias qa-test='echo "🧪 Running tests..." && npm test && echo "Test run complete"'
alias qa-test-unit='echo "🧪 Running unit tests..." && npm run test:unit'
alias qa-test-integration='echo "🔗 Running integration tests..." && npm run test:integration'
alias qa-test-e2e='echo "🌐 Running E2E tests..." && npm run test:e2e'
alias qa-coverage-report='echo "📊 Generating coverage report..." && npm run coverage'
alias qa-lint='echo "🔍 Running linter..." && npm run lint'
alias qa-audit-quality='echo "📊 Running quality audit..." && node "$QA_AGENTS_DIR/cli/audit.js"'

# QA Git Integration
alias qa-update='echo "🧪 Updating QA tracking..." && git add "$QA_AGENTS_DIR/tracking/" && git commit -m "QA: Update quality tracking"'
alias qa-sync='echo "🔄 Syncing QA data..." && git pull && git push'

# QA Workflows
alias qa-workflow="cat $WINDSURF_PROJECT_ROOT/.wee/workflows/quality_assurance.md"

# QA Reports
alias qa-report='echo "📊 Generating QA Report..." && echo "=== TEST RESULTS ===" && tail -20 "$QA_TRACKING_DIR/test_results.md" && echo -e "\n=== COVERAGE ===" && tail -10 "$QA_TRACKING_DIR/test_coverage.md" && echo -e "\n=== QUALITY METRICS ===" && tail -15 "$QA_TRACKING_DIR/quality_metrics.md"'

alias qa-summary='echo "📋 QA Summary:" && echo "Tests: $(grep -c "✅\|❌" "$QA_TRACKING_DIR/test_results.md" 2>/dev/null || echo "0") runs" && echo "Coverage: $(grep -o "Overall.*[0-9][0-9]*%" "$QA_TRACKING_DIR/test_coverage.md" | tail -1 | grep -o "[0-9][0-9]*%" || echo "N/A")" && echo "Quality: $(grep -o "Overall.*[0-9][0-9]*" "$QA_TRACKING_DIR/audit_history.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "N/A")/10"'

# QA Story Review
alias qa-review-story='function _qa_review() { 
    local story_file="${1:-$(ls -t $WINDSURF_PROJECT_ROOT/docs/stories/*.md 2>/dev/null | head -1)}"
    if [[ -f "$story_file" ]]; then
        echo "🧪 Reviewing story: $story_file"
        cat "$story_file"
        echo -e "\n📋 QA Checklist:"
        echo "- [ ] Requirements are clear and testable"
        echo "- [ ] Acceptance criteria are defined"
        echo "- [ ] Test cases are identified"
        echo "- [ ] Security considerations are addressed"
        echo "- [ ] Performance requirements are specified"
    else
        echo "❌ No story file found"
        echo "Usage: qa-review-story [story-file.md]"
    fi
}; _qa_review'

# QA Integration Status
alias qa-integration='echo "🔧 QA Integration Status:" && echo "Workflows: $(ls "$WINDSURF_PROJECT_ROOT/.wee/workflows/quality_assurance.md" 2>/dev/null && echo "✅" || echo "❌")" && echo "Notifications: $(ls "$QA_SCRIPTS_DIR/qa_notifications.sh" 2>/dev/null && echo "✅" || echo "❌")" && echo "Tracking: $(ls "$QA_TRACKING_DIR" 2>/dev/null && echo "✅" || echo "❌")" && echo "CLI Tools: $(ls "$QA_AGENTS_DIR/cli" 2>/dev/null && echo "✅" || echo "❌")"'

# QA Performance Testing
alias qa-perf='echo "⚡ Running performance tests..." && npm run test:performance'
alias qa-load='echo "🏋️ Running load tests..." && npm run test:load'
alias qa-stress='echo "💪 Running stress tests..." && npm run test:stress'

# QA Security Testing
alias qa-security='echo "🔒 Running security tests..." && npm run test:security'
alias qa-vuln='echo "🛡️ Scanning for vulnerabilities..." && npm audit'
alias qa-deps='echo "📦 Checking dependencies..." && npm outdated'

# QA Code Quality
alias qa-complexity='echo "🔄 Analyzing code complexity..." && npx plato -r -d reports/complexity src/'
alias qa-duplication='echo "👥 Checking for code duplication..." && npx jscpd src/'
alias qa-maintainability='echo "🔧 Calculating maintainability index..." && echo "Maintainability analysis not yet implemented"'

# QA Metrics Dashboard
alias qa-dashboard='echo "📊 QA Metrics Dashboard:" && echo "===================" && qa-summary && echo -e "\n📈 Recent Trends:" && echo "Tests: $(grep -c "✅ PASS\|❌ FAIL" "$QA_TRACKING_DIR/test_results.md" | tail -5 | tr "\n" " " || echo "No data")" && echo "Coverage: $(grep -o "[0-9][0-9]*%" "$QA_TRACKING_DIR/test_coverage.md" | tail -5 | tr "\n" " " || echo "No data")"'

# QA Help
alias qa-help='echo "🧪 QA Agent Commands:

Status & Monitoring:
  qa-status          - Check current QA notifications
  qa-monitor         - Start QA monitoring daemon
  qa-notify-test     - Test QA notifications
  qa-summary         - Quick QA status summary
  qa-dashboard       - Full QA metrics dashboard

Tracking Views:
  qa-tests           - View test results
  qa-coverage        - View test coverage
  qa-quality         - View quality metrics
  qa-reviews         - View code review history
  qa-audit           - View quality audit history
  qa-compliance      - View compliance status

Testing:
  qa-test            - Run all tests
  qa-test-unit       - Run unit tests only
  qa-test-integration - Run integration tests
  qa-test-e2e        - Run end-to-end tests
  qa-perf            - Run performance tests
  qa-security        - Run security tests

Code Quality:
  qa-lint            - Run code linter
  qa-complexity      - Analyze code complexity
  qa-duplication     - Check for code duplication
  qa-audit-quality   - Run comprehensive quality audit

Reports & Analysis:
  qa-report          - Generate QA report
  qa-review-story    - Review story for QA readiness
  qa-coverage-report - Generate coverage report

Git Integration:
  qa-update          - Commit QA tracking updates
  qa-sync            - Sync QA data with remote

Configuration:
  qa-workflow        - View QA workflow
  qa-integration     - Check integration status
  qa-help            - Show this help message

Examples:
  qa-review-story docs/stories/user-login.md
  qa-test-unit && qa-coverage-report
  qa-audit-quality && qa-report
"'

# QA Initialization
alias qa-init='echo "🚀 Initializing QA Agent..." && mkdir -p "$QA_TRACKING_DIR" && echo "QA Agent tracking directory created" && qa-integration'

# QA Cleanup
alias qa-clean='echo "🧹 Cleaning QA temporary files..." && rm -f "$QA_TRACKING_DIR"/*.tmp && echo "QA cleanup complete"'

# Export QA environment variables
export QA_AGENTS_DIR
export QA_TRACKING_DIR
export QA_SCRIPTS_DIR

echo "🧪 QA Agent aliases loaded. Type 'qa-help' for available commands."
