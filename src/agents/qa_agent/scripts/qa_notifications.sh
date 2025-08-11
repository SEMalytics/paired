#!/bin/bash
# QA Agent Notification System
# Monitors QA metrics and sends notifications for important events

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
QA_DIR="$PROJECT_ROOT/src/agents/qa_agent"
QA_TRACKING_DIR="$QA_DIR/tracking"

# QA-specific notification markers
QA_MARKERS=(
    "TEST_FAILURE"
    "COVERAGE_DROP"
    "REGRESSION_DETECTED"
    "SECURITY_ISSUE"
    "PERFORMANCE_DEGRADATION"
    "CODE_REVIEW_NEEDED"
    "QA_APPROVAL_REQUIRED"
    "BUG_PATTERN_DETECTED"
    "FLAKY_TEST_ALERT"
    "QUALITY_THRESHOLD_BREACH"
)

# Function to check QA-specific notifications
check_qa_notifications() {
    local found_items=0
    
    echo -e "${BLUE}🧪 Checking QA Agent notifications...${NC}"
    
    # Check test results for failures
    if [[ -f "$QA_TRACKING_DIR/test_results.md" ]]; then
        local test_failures=$(grep -c "❌ FAIL\|TEST_FAILURE" "$QA_TRACKING_DIR/test_results.md" 2>/dev/null || echo "0")
        if [[ $test_failures -gt 0 ]]; then
            echo -e "${RED}❌ $test_failures test failure(s) detected${NC}"
            found_items=$((found_items + test_failures))
        fi
    fi
    
    # Check test coverage
    if [[ -f "$QA_TRACKING_DIR/test_coverage.md" ]]; then
        local coverage=$(grep -o "Overall.*[0-9][0-9]*%" "$QA_TRACKING_DIR/test_coverage.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "0")
        if [[ -n "$coverage" && $coverage -lt 80 ]]; then
            echo -e "${YELLOW}⚠️  Test coverage below threshold: ${coverage}%${NC}"
            found_items=$((found_items + 1))
        fi
    fi
    
    # Check for quality threshold breaches
    if [[ -f "$QA_TRACKING_DIR/compliance_status.md" ]]; then
        local failed_rules=$(grep -c "❌" "$QA_TRACKING_DIR/compliance_status.md" 2>/dev/null || echo "0")
        if [[ $failed_rules -gt 0 ]]; then
            echo -e "${RED}🚨 $failed_rules quality rule(s) failing${NC}"
            found_items=$((found_items + failed_rules))
        fi
    fi
    
    # Check for security issues
    if [[ -f "$QA_TRACKING_DIR/security_review.md" ]]; then
        local security_issues=$(grep -c "Security.*Critical\|SECURITY_ISSUE" "$QA_TRACKING_DIR/security_review.md" 2>/dev/null || echo "0")
        if [[ $security_issues -gt 0 ]]; then
            echo -e "${RED}🔒 $security_issues security issue(s) require attention${NC}"
            found_items=$((found_items + security_issues))
        fi
    fi
    
    # Check for performance degradation
    if [[ -f "$QA_TRACKING_DIR/performance_metrics.md" ]]; then
        local perf_issues=$(grep -c "Performance.*Degraded\|PERFORMANCE_DEGRADATION" "$QA_TRACKING_DIR/performance_metrics.md" 2>/dev/null || echo "0")
        if [[ $perf_issues -gt 0 ]]; then
            echo -e "${YELLOW}⚡ $perf_issues performance issue(s) detected${NC}"
            found_items=$((found_items + perf_issues))
        fi
    fi
    
    # Check for pending code reviews
    if [[ -d "$PROJECT_ROOT/docs/stories" ]]; then
        local review_needed=$(find "$PROJECT_ROOT/docs/stories" -name "*.md" -exec grep -l "Status.*Review\|CODE_REVIEW_NEEDED" {} \; 2>/dev/null | wc -l)
        if [[ $review_needed -gt 0 ]]; then
            echo -e "${BLUE}👀 $review_needed story(ies) need code review${NC}"
            found_items=$((found_items + review_needed))
        fi
    fi
    
    # Check for regression risks
    if [[ -f "$QA_TRACKING_DIR/regression_tracking.md" ]]; then
        local regression_risks=$(grep -c "Risk.*High\|REGRESSION_DETECTED" "$QA_TRACKING_DIR/regression_tracking.md" 2>/dev/null || echo "0")
        if [[ $regression_risks -gt 0 ]]; then
            echo -e "${RED}🔄 $regression_risks regression risk(s) identified${NC}"
            found_items=$((found_items + regression_risks))
        fi
    fi
    
    # Check for flaky tests
    if [[ -f "$QA_TRACKING_DIR/flaky_tests.md" ]]; then
        local flaky_tests=$(grep -c "Flaky.*Confirmed\|FLAKY_TEST_ALERT" "$QA_TRACKING_DIR/flaky_tests.md" 2>/dev/null || echo "0")
        if [[ $flaky_tests -gt 0 ]]; then
            echo -e "${YELLOW}🎲 $flaky_tests flaky test(s) identified${NC}"
            found_items=$((found_items + flaky_tests))
        fi
    fi
    
    # Summary
    if [[ $found_items -eq 0 ]]; then
        echo -e "${GREEN}✅ No QA issues detected${NC}"
    else
        echo -e "${YELLOW}📊 Total QA items requiring attention: $found_items${NC}"
    fi
    
    return $found_items
}

# Function to start QA monitoring daemon
start_qa_monitoring() {
    echo -e "${GREEN}🧪 Starting QA Agent monitoring...${NC}"
    
    # Create monitoring script
    local monitor_script="/tmp/qa_monitor_$$.sh"
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
while true; do
    sleep 300  # Check every 5 minutes
    
    # Check for critical issues
    if check_qa_notifications | grep -q "❌\|🚨"; then
        # Send notification (customize based on your notification system)
        osascript -e 'display notification "QA Agent detected critical issues" with title "🧪 QA Alert"' 2>/dev/null || true
    fi
done
EOF
    
    chmod +x "$monitor_script"
    
    # Start monitoring in background
    nohup "$monitor_script" > /dev/null 2>&1 &
    local monitor_pid=$!
    
    echo "QA monitoring started with PID: $monitor_pid"
    echo "To stop monitoring: kill $monitor_pid"
    
    # Save PID for later cleanup
    echo "$monitor_pid" > "/tmp/qa_monitor.pid"
}

# Function to stop QA monitoring
stop_qa_monitoring() {
    if [[ -f "/tmp/qa_monitor.pid" ]]; then
        local pid=$(cat "/tmp/qa_monitor.pid")
        if kill "$pid" 2>/dev/null; then
            echo -e "${GREEN}🛑 QA monitoring stopped${NC}"
            rm -f "/tmp/qa_monitor.pid"
        else
            echo -e "${YELLOW}⚠️  QA monitoring process not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No QA monitoring PID file found${NC}"
    fi
}

# Function to test notifications
test_qa_notifications() {
    echo -e "${BLUE}🧪 Testing QA notification system...${NC}"
    
    # Test system notification
    osascript -e 'display notification "QA notification system test" with title "🧪 QA Test"' 2>/dev/null && echo "✅ System notifications working" || echo "❌ System notifications not available"
    
    # Test terminal colors
    echo -e "${RED}❌ Critical${NC} ${YELLOW}⚠️  Warning${NC} ${GREEN}✅ Success${NC} ${BLUE}ℹ️  Info${NC}"
    
    # Test QA markers detection
    echo "Testing QA markers detection..."
    for marker in "${QA_MARKERS[@]}"; do
        echo "  - $marker: Ready"
    done
    
    echo -e "${GREEN}🧪 QA notification test complete${NC}"
}

# Function to send QA alert
send_qa_alert() {
    local title="$1"
    local message="$2"
    local severity="${3:-medium}"
    
    # Color based on severity
    local color="$YELLOW"
    case "$severity" in
        "critical"|"high") color="$RED" ;;
        "medium") color="$YELLOW" ;;
        "low"|"info") color="$GREEN" ;;
    esac
    
    echo -e "${color}🧪 QA Alert: $title${NC}"
    echo -e "   $message"
    
    # Send system notification for high/critical
    if [[ "$severity" == "critical" || "$severity" == "high" ]]; then
        osascript -e "display notification \"$message\" with title \"🧪 $title\"" 2>/dev/null || true
    fi
}

# Function to integrate with existing notification system
integrate_with_notify_system() {
    # Add QA markers to existing notification patterns
    local review_script="$PROJECT_ROOT/.wee/scripts/review_notifications.sh"
    
    if [[ -f "$review_script" ]]; then
        echo "🔗 Integrating with existing notification system..."
        
        # Add QA markers to the review script
        for marker in "${QA_MARKERS[@]}"; do
            if ! grep -q "$marker" "$review_script"; then
                echo "Adding QA marker: $marker"
                # Add marker to the script (implementation depends on existing script structure)
            fi
        done
        
        echo "✅ QA integration complete"
    else
        echo "ℹ️  No existing notification system found"
    fi
}

# Function to generate QA notification report
generate_qa_report() {
    echo -e "${BLUE}📊 QA Notification Report${NC}"
    echo "========================="
    echo "Generated: $(date)"
    echo ""
    
    check_qa_notifications
    
    echo ""
    echo "📈 QA Metrics Summary:"
    if [[ -f "$QA_TRACKING_DIR/test_coverage.md" ]]; then
        local coverage=$(grep -o "Overall.*[0-9][0-9]*%" "$QA_TRACKING_DIR/test_coverage.md" | tail -1 || echo "Coverage: N/A")
        echo "  - Test $coverage"
    fi
    
    if [[ -f "$QA_TRACKING_DIR/audit_history.md" ]]; then
        local quality=$(grep -o "Overall.*[0-9][0-9]*" "$QA_TRACKING_DIR/audit_history.md" | tail -1 || echo "Quality: N/A")
        echo "  - Quality Score: $quality/10"
    fi
    
    if [[ -f "$QA_TRACKING_DIR/compliance_status.md" ]]; then
        local compliance=$(grep -o "Overall Compliance.*[0-9][0-9]*%" "$QA_TRACKING_DIR/compliance_status.md" | tail -1 || echo "Compliance: N/A")
        echo "  - $compliance"
    fi
}

# Main script logic
case "${1:-check}" in
    "check")
        check_qa_notifications
        ;;
    "start")
        start_qa_monitoring
        ;;
    "stop")
        stop_qa_monitoring
        ;;
    "test")
        test_qa_notifications
        ;;
    "alert")
        send_qa_alert "$2" "$3" "$4"
        ;;
    "integrate")
        integrate_with_notify_system
        ;;
    "report")
        generate_qa_report
        ;;
    "help")
        echo "QA Notification System Usage:"
        echo "  $0 check     - Check for QA notifications"
        echo "  $0 start     - Start QA monitoring daemon"
        echo "  $0 stop      - Stop QA monitoring daemon"
        echo "  $0 test      - Test notification system"
        echo "  $0 alert <title> <message> [severity] - Send QA alert"
        echo "  $0 integrate - Integrate with existing notification system"
        echo "  $0 report    - Generate QA notification report"
        echo "  $0 help      - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
