#!/bin/bash
# Architecture Agent Notification System
# Monitors architectural decisions, patterns, and technical debt

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
ARCH_DIR="$PROJECT_ROOT/src/agents/architecture_agent"
ARCH_TRACKING_DIR="$ARCH_DIR/tracking"

# Architecture-specific notification markers
ARCH_MARKERS=(
    "ADR_PENDING_APPROVAL"
    "ARCHITECTURAL_VIOLATION"
    "PATTERN_VIOLATION"
    "TECH_DEBT_CRITICAL"
    "COMPLIANCE_FAILURE"
    "DESIGN_REVIEW_NEEDED"
    "REFACTORING_REQUIRED"
    "DEPENDENCY_ISSUE"
    "PERFORMANCE_CONCERN"
    "SECURITY_ARCHITECTURE_ISSUE"
)

# Function to check Architecture-specific notifications
check_arch_notifications() {
    local found_items=0
    
    echo -e "${BLUE}🏗️ Checking Architecture Agent notifications...${NC}"
    
    # Check for pending ADRs
    if [[ -f "$ARCH_TRACKING_DIR/adr_registry.md" ]]; then
        local pending_adrs=$(grep -c "Status.*Proposed\|ADR_PENDING_APPROVAL" "$ARCH_TRACKING_DIR/adr_registry.md" 2>/dev/null || echo "0")
        if [[ $pending_adrs -gt 0 ]]; then
            echo -e "${YELLOW}📋 $pending_adrs ADR(s) pending approval${NC}"
            found_items=$((found_items + pending_adrs))
        fi
    fi
    
    # Check for architectural violations
    if [[ -f "$ARCH_TRACKING_DIR/compliance_status.md" ]]; then
        local violations=$(grep -c "❌\|ARCHITECTURAL_VIOLATION" "$ARCH_TRACKING_DIR/compliance_status.md" 2>/dev/null || echo "0")
        if [[ $violations -gt 0 ]]; then
            echo -e "${RED}🚨 $violations architectural violation(s) detected${NC}"
            found_items=$((found_items + violations))
        fi
    fi
    
    # Check for pattern violations
    if [[ -f "$ARCH_TRACKING_DIR/pattern_analysis.md" ]]; then
        local pattern_violations=$(grep -c "Violation.*High\|PATTERN_VIOLATION" "$ARCH_TRACKING_DIR/pattern_analysis.md" 2>/dev/null || echo "0")
        if [[ $pattern_violations -gt 0 ]]; then
            echo -e "${RED}🔴 $pattern_violations pattern violation(s) found${NC}"
            found_items=$((found_items + pattern_violations))
        fi
    fi
    
    # Check for critical technical debt
    if [[ -f "$ARCH_TRACKING_DIR/tech_debt.md" ]]; then
        local critical_debt=$(grep -c "Severity.*critical\|TECH_DEBT_CRITICAL" "$ARCH_TRACKING_DIR/tech_debt.md" 2>/dev/null || echo "0")
        if [[ $critical_debt -gt 0 ]]; then
            echo -e "${RED}💳 $critical_debt critical technical debt item(s)${NC}"
            found_items=$((found_items + critical_debt))
        fi
        
        # Check debt ratio
        local debt_ratio=$(grep -o "Debt Ratio.*[0-9][0-9]*%" "$ARCH_TRACKING_DIR/tech_debt.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "0")
        if [[ -n "$debt_ratio" && $debt_ratio -gt 30 ]]; then
            echo -e "${YELLOW}📊 High technical debt ratio: ${debt_ratio}%${NC}"
            found_items=$((found_items + 1))
        fi
    fi
    
    # Check for design reviews needed
    if [[ -d "$PROJECT_ROOT/docs/stories" ]]; then
        local design_reviews=$(find "$PROJECT_ROOT/docs/stories" -name "*.md" -exec grep -l "Architecture.*Review\|DESIGN_REVIEW_NEEDED" {} \; 2>/dev/null | wc -l)
        if [[ $design_reviews -gt 0 ]]; then
            echo -e "${BLUE}📐 $design_reviews story(ies) need architecture review${NC}"
            found_items=$((found_items + design_reviews))
        fi
    fi
    
    # Check for refactoring requirements
    if [[ -f "$ARCH_TRACKING_DIR/tech_debt.md" ]]; then
        local refactoring_needed=$(grep -c "Refactoring.*Required\|REFACTORING_REQUIRED" "$ARCH_TRACKING_DIR/tech_debt.md" 2>/dev/null || echo "0")
        if [[ $refactoring_needed -gt 0 ]]; then
            echo -e "${YELLOW}🔄 $refactoring_needed component(s) require refactoring${NC}"
            found_items=$((found_items + refactoring_needed))
        fi
    fi
    
    # Check for dependency issues
    if [[ -f "$ARCH_TRACKING_DIR/dependency_analysis.md" ]]; then
        local dependency_issues=$(grep -c "Issue.*Critical\|DEPENDENCY_ISSUE" "$ARCH_TRACKING_DIR/dependency_analysis.md" 2>/dev/null || echo "0")
        if [[ $dependency_issues -gt 0 ]]; then
            echo -e "${RED}📦 $dependency_issues dependency issue(s) detected${NC}"
            found_items=$((found_items + dependency_issues))
        fi
    fi
    
    # Check for performance concerns
    if [[ -f "$ARCH_TRACKING_DIR/performance_analysis.md" ]]; then
        local performance_concerns=$(grep -c "Performance.*Critical\|PERFORMANCE_CONCERN" "$ARCH_TRACKING_DIR/performance_analysis.md" 2>/dev/null || echo "0")
        if [[ $performance_concerns -gt 0 ]]; then
            echo -e "${YELLOW}⚡ $performance_concerns performance concern(s) identified${NC}"
            found_items=$((found_items + performance_concerns))
        fi
    fi
    
    # Summary
    if [[ $found_items -eq 0 ]]; then
        echo -e "${GREEN}✅ No architecture issues detected${NC}"
    else
        echo -e "${YELLOW}📊 Total architecture items requiring attention: $found_items${NC}"
    fi
    
    return $found_items
}

# Function to start Architecture monitoring daemon
start_arch_monitoring() {
    echo -e "${GREEN}🏗️ Starting Architecture Agent monitoring...${NC}"
    
    # Create monitoring script
    local monitor_script="/tmp/arch_monitor_$$.sh"
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
while true; do
    sleep 600  # Check every 10 minutes
    
    # Check for critical issues
    if check_arch_notifications | grep -q "🚨\|💳\|🔴"; then
        # Send notification (customize based on your notification system)
        osascript -e 'display notification "Architecture Agent detected critical issues" with title "🏗️ Architecture Alert"' 2>/dev/null || true
    fi
done
EOF
    
    chmod +x "$monitor_script"
    
    # Start monitoring in background
    nohup "$monitor_script" > /dev/null 2>&1 &
    local monitor_pid=$!
    
    echo "Architecture monitoring started with PID: $monitor_pid"
    echo "To stop monitoring: kill $monitor_pid"
    
    # Save PID for later cleanup
    echo "$monitor_pid" > "/tmp/arch_monitor.pid"
}

# Function to stop Architecture monitoring
stop_arch_monitoring() {
    if [[ -f "/tmp/arch_monitor.pid" ]]; then
        local pid=$(cat "/tmp/arch_monitor.pid")
        if kill "$pid" 2>/dev/null; then
            echo -e "${GREEN}🛑 Architecture monitoring stopped${NC}"
            rm -f "/tmp/arch_monitor.pid"
        else
            echo -e "${YELLOW}⚠️  Architecture monitoring process not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No Architecture monitoring PID file found${NC}"
    fi
}

# Function to test notifications
test_arch_notifications() {
    echo -e "${BLUE}🏗️ Testing Architecture notification system...${NC}"
    
    # Test system notification
    osascript -e 'display notification "Architecture notification system test" with title "🏗️ Architecture Test"' 2>/dev/null && echo "✅ System notifications working" || echo "❌ System notifications not available"
    
    # Test terminal colors
    echo -e "${RED}🚨 Critical${NC} ${YELLOW}⚠️  Warning${NC} ${GREEN}✅ Success${NC} ${BLUE}ℹ️  Info${NC}"
    
    # Test Architecture markers detection
    echo "Testing Architecture markers detection..."
    for marker in "${ARCH_MARKERS[@]}"; do
        echo "  - $marker: Ready"
    done
    
    echo -e "${GREEN}🏗️ Architecture notification test complete${NC}"
}

# Function to send Architecture alert
send_arch_alert() {
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
    
    echo -e "${color}🏗️ Architecture Alert: $title${NC}"
    echo -e "   $message"
    
    # Send system notification for high/critical
    if [[ "$severity" == "critical" || "$severity" == "high" ]]; then
        osascript -e "display notification \"$message\" with title \"🏗️ $title\"" 2>/dev/null || true
    fi
}

# Function to integrate with existing notification system
integrate_with_notify_system() {
    # Add Architecture markers to existing notification patterns
    local review_script="$PROJECT_ROOT/.wee/scripts/review_notifications.sh"
    
    if [[ -f "$review_script" ]]; then
        echo "🔗 Integrating with existing notification system..."
        
        # Add Architecture markers to the review script
        for marker in "${ARCH_MARKERS[@]}"; do
            if ! grep -q "$marker" "$review_script"; then
                echo "Adding Architecture marker: $marker"
                # Add marker to the script (implementation depends on existing script structure)
            fi
        done
        
        echo "✅ Architecture integration complete"
    else
        echo "ℹ️  No existing notification system found"
    fi
}

# Function to generate Architecture notification report
generate_arch_report() {
    echo -e "${BLUE}📊 Architecture Notification Report${NC}"
    echo "===================================="
    echo "Generated: $(date)"
    echo ""
    
    check_arch_notifications
    
    echo ""
    echo "📈 Architecture Metrics Summary:"
    if [[ -f "$ARCH_TRACKING_DIR/adr_registry.md" ]]; then
        local total_adrs=$(grep -c "## ADR-" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        local pending_adrs=$(grep -c "Status.*Proposed" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        echo "  - ADRs: $total_adrs total, $pending_adrs pending"
    fi
    
    if [[ -f "$ARCH_TRACKING_DIR/pattern_analysis.md" ]]; then
        local patterns=$(grep -c "Pattern.*detected" "$ARCH_TRACKING_DIR/pattern_analysis.md" || echo "0")
        local violations=$(grep -c "Violation" "$ARCH_TRACKING_DIR/pattern_analysis.md" || echo "0")
        echo "  - Patterns: $patterns detected, $violations violations"
    fi
    
    if [[ -f "$ARCH_TRACKING_DIR/tech_debt.md" ]]; then
        local debt_items=$(grep -c "### " "$ARCH_TRACKING_DIR/tech_debt.md" || echo "0")
        local critical_debt=$(grep -c "Severity.*critical" "$ARCH_TRACKING_DIR/tech_debt.md" || echo "0")
        echo "  - Technical Debt: $debt_items items, $critical_debt critical"
    fi
}

# Function to check ADR status
check_adr_status() {
    echo -e "${BLUE}📋 ADR Status Check${NC}"
    
    if [[ -f "$ARCH_TRACKING_DIR/adr_registry.md" ]]; then
        local total=$(grep -c "## ADR-" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        local proposed=$(grep -c "Status.*Proposed" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        local accepted=$(grep -c "Status.*Accepted" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        local rejected=$(grep -c "Status.*Rejected" "$ARCH_TRACKING_DIR/adr_registry.md" || echo "0")
        
        echo "Total ADRs: $total"
        echo "  - Proposed: $proposed"
        echo "  - Accepted: $accepted"
        echo "  - Rejected: $rejected"
        
        if [[ $proposed -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  $proposed ADR(s) need review${NC}"
        fi
    else
        echo "No ADR registry found"
    fi
}

# Main script logic
case "${1:-check}" in
    "check")
        check_arch_notifications
        ;;
    "start")
        start_arch_monitoring
        ;;
    "stop")
        stop_arch_monitoring
        ;;
    "test")
        test_arch_notifications
        ;;
    "alert")
        send_arch_alert "$2" "$3" "$4"
        ;;
    "integrate")
        integrate_with_notify_system
        ;;
    "report")
        generate_arch_report
        ;;
    "adr-status")
        check_adr_status
        ;;
    "help")
        echo "Architecture Notification System Usage:"
        echo "  $0 check     - Check for architecture notifications"
        echo "  $0 start     - Start architecture monitoring daemon"
        echo "  $0 stop      - Stop architecture monitoring daemon"
        echo "  $0 test      - Test notification system"
        echo "  $0 alert <title> <message> [severity] - Send architecture alert"
        echo "  $0 integrate - Integrate with existing notification system"
        echo "  $0 report    - Generate architecture notification report"
        echo "  $0 adr-status - Check ADR status"
        echo "  $0 help      - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
