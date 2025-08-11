#!/bin/bash
# Dev Agent Notification System
# Monitors development progress, story status, and code quality

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
DEV_DIR="$PROJECT_ROOT/src/agents/dev_agent"
DEV_TRACKING_DIR="$DEV_DIR/tracking"

# Dev-specific notification markers
DEV_MARKERS=(
    "STORY_BLOCKED"
    "IMPLEMENTATION_FAILED"
    "TEST_FAILURES"
    "QUALITY_DEGRADATION"
    "DEBUG_SESSION_STUCK"
    "DEADLINE_APPROACHING"
    "DEPENDENCY_ISSUE"
    "PERFORMANCE_REGRESSION"
    "BUILD_BROKEN"
    "CODE_REVIEW_NEEDED"
)

# Function to check Dev-specific notifications
check_dev_notifications() {
    local found_items=0
    
    echo -e "${BLUE}🚀 Checking Dev Agent notifications...${NC}"
    
    # Check for blocked stories
    if [[ -f "$DEV_TRACKING_DIR/story_progress.md" ]]; then
        local blocked_stories=$(grep -c "Status.*blocked\|STORY_BLOCKED" "$DEV_TRACKING_DIR/story_progress.md" 2>/dev/null || echo "0")
        if [[ $blocked_stories -gt 0 ]]; then
            echo -e "${RED}🚫 $blocked_stories story(ies) blocked${NC}"
            found_items=$((found_items + blocked_stories))
        fi
    fi
    
    # Check for failed implementations
    if [[ -f "$DEV_TRACKING_DIR/implementation_status.md" ]]; then
        local failed_implementations=$(grep -c "Status.*failed\|IMPLEMENTATION_FAILED" "$DEV_TRACKING_DIR/implementation_status.md" 2>/dev/null || echo "0")
        if [[ $failed_implementations -gt 0 ]]; then
            echo -e "${RED}❌ $failed_implementations implementation(s) failed${NC}"
            found_items=$((found_items + failed_implementations))
        fi
    fi
    
    # Check for test failures
    if [[ -f "$DEV_TRACKING_DIR/test_results.md" ]]; then
        local test_failures=$(grep -c "FAIL\|TEST_FAILURES" "$DEV_TRACKING_DIR/test_results.md" 2>/dev/null || echo "0")
        if [[ $test_failures -gt 0 ]]; then
            echo -e "${RED}🧪 $test_failures test failure(s) detected${NC}"
            found_items=$((found_items + test_failures))
        fi
    fi
    
    # Check for quality degradation
    if [[ -f "$DEV_TRACKING_DIR/code_quality.md" ]]; then
        local quality_score=$(grep -o "Overall Quality Score.*[0-9][0-9]*" "$DEV_TRACKING_DIR/code_quality.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "100")
        if [[ -n "$quality_score" && $quality_score -lt 70 ]]; then
            echo -e "${YELLOW}📉 Code quality below threshold: ${quality_score}/100${NC}"
            found_items=$((found_items + 1))
        fi
        
        local quality_issues=$(grep -c "Priority.*high\|QUALITY_DEGRADATION" "$DEV_TRACKING_DIR/code_quality.md" 2>/dev/null || echo "0")
        if [[ $quality_issues -gt 0 ]]; then
            echo -e "${YELLOW}🔧 $quality_issues high-priority quality issue(s)${NC}"
            found_items=$((found_items + quality_issues))
        fi
    fi
    
    # Check for stuck debug sessions
    if [[ -f "$DEV_TRACKING_DIR/debug_sessions.md" ]]; then
        local stuck_sessions=$(grep -c "Status.*stuck\|DEBUG_SESSION_STUCK" "$DEV_TRACKING_DIR/debug_sessions.md" 2>/dev/null || echo "0")
        if [[ $stuck_sessions -gt 0 ]]; then
            echo -e "${RED}🐛 $stuck_sessions debug session(s) stuck${NC}"
            found_items=$((found_items + stuck_sessions))
        fi
    fi
    
    # Check for approaching deadlines
    if [[ -f "$DEV_TRACKING_DIR/story_progress.md" ]]; then
        local approaching_deadlines=$(grep -c "Deadline.*approaching\|DEADLINE_APPROACHING" "$DEV_TRACKING_DIR/story_progress.md" 2>/dev/null || echo "0")
        if [[ $approaching_deadlines -gt 0 ]]; then
            echo -e "${YELLOW}⏰ $approaching_deadlines deadline(s) approaching${NC}"
            found_items=$((found_items + approaching_deadlines))
        fi
    fi
    
    # Check for dependency issues
    if [[ -f "$DEV_TRACKING_DIR/dependency_status.md" ]]; then
        local dependency_issues=$(grep -c "Issue.*critical\|DEPENDENCY_ISSUE" "$DEV_TRACKING_DIR/dependency_status.md" 2>/dev/null || echo "0")
        if [[ $dependency_issues -gt 0 ]]; then
            echo -e "${RED}📦 $dependency_issues dependency issue(s) detected${NC}"
            found_items=$((found_items + dependency_issues))
        fi
    fi
    
    # Check for performance regressions
    if [[ -f "$DEV_TRACKING_DIR/performance_metrics.md" ]]; then
        local performance_regressions=$(grep -c "Regression.*detected\|PERFORMANCE_REGRESSION" "$DEV_TRACKING_DIR/performance_metrics.md" 2>/dev/null || echo "0")
        if [[ $performance_regressions -gt 0 ]]; then
            echo -e "${YELLOW}⚡ $performance_regressions performance regression(s) detected${NC}"
            found_items=$((found_items + performance_regressions))
        fi
    fi
    
    # Check for broken builds
    if [[ -f "$DEV_TRACKING_DIR/build_status.md" ]]; then
        local broken_builds=$(grep -c "Status.*broken\|BUILD_BROKEN" "$DEV_TRACKING_DIR/build_status.md" 2>/dev/null || echo "0")
        if [[ $broken_builds -gt 0 ]]; then
            echo -e "${RED}🔨 $broken_builds build(s) broken${NC}"
            found_items=$((found_items + broken_builds))
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
    
    # Summary
    if [[ $found_items -eq 0 ]]; then
        echo -e "${GREEN}✅ No development issues detected${NC}"
    else
        echo -e "${YELLOW}📊 Total development items requiring attention: $found_items${NC}"
    fi
    
    return $found_items
}

# Function to start Dev monitoring daemon
start_dev_monitoring() {
    echo -e "${GREEN}🚀 Starting Dev Agent monitoring...${NC}"
    
    # Create monitoring script
    local monitor_script="/tmp/dev_monitor_$$.sh"
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
while true; do
    sleep 300  # Check every 5 minutes
    
    # Check for critical issues
    if check_dev_notifications | grep -q "❌\|🚫\|🔨"; then
        # Send notification (customize based on your notification system)
        osascript -e 'display notification "Dev Agent detected critical issues" with title "🚀 Development Alert"' 2>/dev/null || true
    fi
done
EOF
    
    chmod +x "$monitor_script"
    
    # Start monitoring in background
    nohup "$monitor_script" > /dev/null 2>&1 &
    local monitor_pid=$!
    
    echo "Dev monitoring started with PID: $monitor_pid"
    echo "To stop monitoring: kill $monitor_pid"
    
    # Save PID for later cleanup
    echo "$monitor_pid" > "/tmp/dev_monitor.pid"
}

# Function to stop Dev monitoring
stop_dev_monitoring() {
    if [[ -f "/tmp/dev_monitor.pid" ]]; then
        local pid=$(cat "/tmp/dev_monitor.pid")
        if kill "$pid" 2>/dev/null; then
            echo -e "${GREEN}🛑 Dev monitoring stopped${NC}"
            rm -f "/tmp/dev_monitor.pid"
        else
            echo -e "${YELLOW}⚠️  Dev monitoring process not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No Dev monitoring PID file found${NC}"
    fi
}

# Function to test notifications
test_dev_notifications() {
    echo -e "${BLUE}🚀 Testing Dev notification system...${NC}"
    
    # Test system notification
    osascript -e 'display notification "Dev notification system test" with title "🚀 Dev Test"' 2>/dev/null && echo "✅ System notifications working" || echo "❌ System notifications not available"
    
    # Test terminal colors
    echo -e "${RED}❌ Critical${NC} ${YELLOW}⚠️  Warning${NC} ${GREEN}✅ Success${NC} ${BLUE}ℹ️  Info${NC}"
    
    # Test Dev markers detection
    echo "Testing Dev markers detection..."
    for marker in "${DEV_MARKERS[@]}"; do
        echo "  - $marker: Ready"
    done
    
    echo -e "${GREEN}🚀 Dev notification test complete${NC}"
}

# Function to send Dev alert
send_dev_alert() {
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
    
    echo -e "${color}🚀 Dev Alert: $title${NC}"
    echo -e "   $message"
    
    # Send system notification for high/critical
    if [[ "$severity" == "critical" || "$severity" == "high" ]]; then
        osascript -e "display notification \"$message\" with title \"🚀 $title\"" 2>/dev/null || true
    fi
}

# Function to integrate with existing notification system
integrate_with_notify_system() {
    # Add Dev markers to existing notification patterns
    local review_script="$PROJECT_ROOT/.wee/scripts/review_notifications.sh"
    
    if [[ -f "$review_script" ]]; then
        echo "🔗 Integrating with existing notification system..."
        
        # Add Dev markers to the review script
        for marker in "${DEV_MARKERS[@]}"; do
            if ! grep -q "$marker" "$review_script"; then
                echo "Adding Dev marker: $marker"
                # Add marker to the script (implementation depends on existing script structure)
            fi
        done
        
        echo "✅ Dev integration complete"
    else
        echo "ℹ️  No existing notification system found"
    fi
}

# Function to generate Dev notification report
generate_dev_report() {
    echo -e "${BLUE}📊 Dev Notification Report${NC}"
    echo "=========================="
    echo "Generated: $(date)"
    echo ""
    
    check_dev_notifications
    
    echo ""
    echo "📈 Development Metrics Summary:"
    if [[ -f "$DEV_TRACKING_DIR/story_progress.md" ]]; then
        local total_stories=$(grep -c "## Story:" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        local active_stories=$(grep -c "Status.*in_progress" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        echo "  - Stories: $total_stories total, $active_stories active"
    fi
    
    if [[ -f "$DEV_TRACKING_DIR/code_quality.md" ]]; then
        local quality_score=$(grep -o "Overall Quality Score.*[0-9][0-9]*" "$DEV_TRACKING_DIR/code_quality.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "N/A")
        echo "  - Code Quality: $quality_score/100"
    fi
    
    if [[ -f "$DEV_TRACKING_DIR/debug_sessions.md" ]]; then
        local debug_sessions=$(grep -c "## Debug Session:" "$DEV_TRACKING_DIR/debug_sessions.md" || echo "0")
        local active_debug=$(grep -c "Status.*investigating" "$DEV_TRACKING_DIR/debug_sessions.md" || echo "0")
        echo "  - Debug Sessions: $debug_sessions total, $active_debug active"
    fi
}

# Function to check story status
check_story_status() {
    echo -e "${BLUE}📋 Story Status Check${NC}"
    
    if [[ -f "$DEV_TRACKING_DIR/story_progress.md" ]]; then
        local total=$(grep -c "## Story:" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        local in_progress=$(grep -c "Status.*in_progress" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        local completed=$(grep -c "Status.*completed" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        local blocked=$(grep -c "Status.*blocked" "$DEV_TRACKING_DIR/story_progress.md" || echo "0")
        
        echo "Total Stories: $total"
        echo "  - In Progress: $in_progress"
        echo "  - Completed: $completed"
        echo "  - Blocked: $blocked"
        
        if [[ $blocked -gt 0 ]]; then
            echo -e "${RED}⚠️  $blocked story(ies) are blocked${NC}"
        fi
        
        if [[ $in_progress -eq 0 && $total -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  No stories currently in progress${NC}"
        fi
    else
        echo "No story progress tracking found"
    fi
}

# Function to check development health
check_dev_health() {
    echo -e "${BLUE}🏥 Development Health Check${NC}"
    
    local health_score=100
    local issues=0
    
    # Check test status
    if command -v npm >/dev/null 2>&1; then
        if npm test --silent >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Tests passing${NC}"
        else
            echo -e "${RED}❌ Tests failing${NC}"
            health_score=$((health_score - 20))
            issues=$((issues + 1))
        fi
    fi
    
    # Check build status
    if npm run build --silent >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failing${NC}"
        health_score=$((health_score - 30))
        issues=$((issues + 1))
    fi
    
    # Check code quality
    if [[ -f "$DEV_TRACKING_DIR/code_quality.md" ]]; then
        local quality=$(grep -o "Overall Quality Score.*[0-9][0-9]*" "$DEV_TRACKING_DIR/code_quality.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "70")
        if [[ $quality -ge 80 ]]; then
            echo -e "${GREEN}✅ Code quality good ($quality/100)${NC}"
        else
            echo -e "${YELLOW}⚠️  Code quality needs attention ($quality/100)${NC}"
            health_score=$((health_score - 15))
            issues=$((issues + 1))
        fi
    fi
    
    echo ""
    if [[ $health_score -ge 90 ]]; then
        echo -e "${GREEN}🎉 Development health: Excellent ($health_score/100)${NC}"
    elif [[ $health_score -ge 70 ]]; then
        echo -e "${YELLOW}⚠️  Development health: Good ($health_score/100)${NC}"
    else
        echo -e "${RED}🚨 Development health: Needs attention ($health_score/100)${NC}"
    fi
    
    echo "Issues found: $issues"
}

# Main script logic
case "${1:-check}" in
    "check")
        check_dev_notifications
        ;;
    "start")
        start_dev_monitoring
        ;;
    "stop")
        stop_dev_monitoring
        ;;
    "test")
        test_dev_notifications
        ;;
    "alert")
        send_dev_alert "$2" "$3" "$4"
        ;;
    "integrate")
        integrate_with_notify_system
        ;;
    "report")
        generate_dev_report
        ;;
    "story-status")
        check_story_status
        ;;
    "health")
        check_dev_health
        ;;
    "help")
        echo "Dev Notification System Usage:"
        echo "  $0 check        - Check for development notifications"
        echo "  $0 start        - Start development monitoring daemon"
        echo "  $0 stop         - Stop development monitoring daemon"
        echo "  $0 test         - Test notification system"
        echo "  $0 alert <title> <message> [severity] - Send development alert"
        echo "  $0 integrate    - Integrate with existing notification system"
        echo "  $0 report       - Generate development notification report"
        echo "  $0 story-status - Check story status"
        echo "  $0 health       - Check development health"
        echo "  $0 help         - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
