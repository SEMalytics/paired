#!/bin/bash
# Dev Agent Shell Aliases
# Integrates Development functionality with existing Windsurf alias system

# Get the project root directory
WINDSURF_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
DEV_SCRIPTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/dev_agent/scripts"
DEV_AGENTS_DIR="$WINDSURF_PROJECT_ROOT/src/agents/dev_agent"
DEV_TRACKING_DIR="$DEV_AGENTS_DIR/tracking"

# Dev Status and Monitoring
alias dev-status="$DEV_SCRIPTS_DIR/dev_notifications.sh check"
alias dev-monitor="$DEV_SCRIPTS_DIR/dev_notifications.sh start"
alias dev-notify-test="$DEV_SCRIPTS_DIR/dev_notifications.sh test"

# Dev Tracking Views
alias dev-stories="cat $DEV_TRACKING_DIR/story_progress.md"
alias dev-quality="cat $DEV_TRACKING_DIR/code_quality.md"
alias dev-debug="cat $DEV_TRACKING_DIR/debug_sessions.md"
alias dev-implementation="cat $DEV_TRACKING_DIR/implementation_status.md"

# Dev Editing
alias dev-edit-stories="open -a 'Windsurf' $DEV_TRACKING_DIR/story_progress.md"
alias dev-edit-quality="open -a 'Windsurf' $DEV_TRACKING_DIR/code_quality.md"
alias dev-edit-debug="open -a 'Windsurf' $DEV_TRACKING_DIR/debug_sessions.md"
alias dev-edit-implementation="open -a 'Windsurf' $DEV_TRACKING_DIR/implementation_status.md"

# Story Management
alias dev-story-new='function _dev_story_new() { 
    local title="${1:-New Development Story}"
    echo "📋 Creating new development story: $title"
    node "$DEV_AGENTS_DIR/cli/story.js" create "$title"
}; _dev_story_new'

alias dev-story-list='echo "📋 Development Stories:" && node "$DEV_AGENTS_DIR/cli/story.js" list'
alias dev-story-status='node "$DEV_AGENTS_DIR/cli/story.js" status'
alias dev-story-progress='node "$DEV_AGENTS_DIR/cli/story.js" progress'

alias dev-story-start='function _dev_story_start() { 
    local story_id="$1"
    if [[ -z "$story_id" ]]; then
        echo "Usage: dev-story-start <story_id>"
        return 1
    fi
    echo "🚀 Starting story $story_id"
    node "$DEV_AGENTS_DIR/cli/story.js" start "$story_id"
}; _dev_story_start'

alias dev-story-complete='function _dev_story_complete() { 
    local story_id="$1"
    if [[ -z "$story_id" ]]; then
        echo "Usage: dev-story-complete <story_id>"
        return 1
    fi
    echo "✅ Completing story $story_id"
    node "$DEV_AGENTS_DIR/cli/story.js" complete "$story_id"
}; _dev_story_complete'

# Code Quality Management
alias dev-quality-scan='echo "🔍 Scanning code quality..." && node "$DEV_AGENTS_DIR/cli/quality.js" scan'
alias dev-quality-refactor='echo "🔧 Identifying refactoring targets..." && node "$DEV_AGENTS_DIR/cli/quality.js" refactor'
alias dev-quality-improve='echo "📈 Planning quality improvements..." && node "$DEV_AGENTS_DIR/cli/quality.js" improve'
alias dev-quality-metrics='echo "📊 Code quality metrics..." && node "$DEV_AGENTS_DIR/cli/quality.js" metrics'

# Debugging Support
alias dev-debug-start='function _dev_debug_start() { 
    local issue="${1:-Debug Session}"
    echo "🐛 Starting debug session: $issue"
    node "$DEV_AGENTS_DIR/cli/debug.js" start "$issue"
}; _dev_debug_start'

alias dev-debug-analyze='echo "🔍 Analyzing debug issue..." && node "$DEV_AGENTS_DIR/cli/debug.js" analyze'
alias dev-debug-fix='echo "🔧 Implementing debug fix..." && node "$DEV_AGENTS_DIR/cli/debug.js" fix'
alias dev-debug-verify='echo "✅ Verifying debug fix..." && node "$DEV_AGENTS_DIR/cli/debug.js" verify'
alias dev-debug-sessions='echo "📋 Debug sessions..." && node "$DEV_AGENTS_DIR/cli/debug.js" list'

# Development Quick Actions
alias dev-implement='echo "🚀 Starting implementation..." && cd "$WINDSURF_PROJECT_ROOT" && echo "Ready to implement stories in docs/stories/"'
alias dev-test='echo "🧪 Running development tests..." && npm test'
alias dev-test-unit='echo "🧪 Running unit tests..." && npm run test:unit'
alias dev-test-integration='echo "🔗 Running integration tests..." && npm run test:integration'
alias dev-test-coverage='echo "📊 Generating test coverage..." && npm run coverage'

# Code Generation and Scaffolding
alias dev-generate='function _dev_generate() {
    local type="${1:-component}"
    local name="${2:-NewComponent}"
    echo "🏗️ Generating $type: $name"
    case "$type" in
        "component"|"comp")
            echo "Creating component: $name"
            mkdir -p "src/components"
            echo "// $name Component" > "src/components/${name}.js"
            echo "// $name Tests" > "test/unit/${name}.test.js"
            ;;
        "service"|"svc")
            echo "Creating service: $name"
            mkdir -p "src/services"
            echo "// $name Service" > "src/services/${name}_service.js"
            echo "// $name Service Tests" > "test/unit/${name}_service.test.js"
            ;;
        "model")
            echo "Creating model: $name"
            mkdir -p "src/models"
            echo "// $name Model" > "src/models/${name}.js"
            echo "// $name Model Tests" > "test/unit/${name}.test.js"
            ;;
        *)
            echo "Unknown type: $type"
            echo "Available types: component, service, model"
            ;;
    esac
}; _dev_generate'

# Development Git Integration
alias dev-update='echo "🚀 Updating development tracking..." && git add "$DEV_AGENTS_DIR/tracking/" && git commit -m "Dev: Update development tracking and progress"'
alias dev-sync='echo "🔄 Syncing development data..." && git pull && git push'

# Development Workflows
alias dev-workflow="cat $WINDSURF_PROJECT_ROOT/.wee/workflows/development_process.md"

# Development Reports
alias dev-report='echo "📊 Generating Development Report..." && echo "=== STORY PROGRESS ===" && tail -20 "$DEV_TRACKING_DIR/story_progress.md" && echo -e "\n=== CODE QUALITY ===" && tail -15 "$DEV_TRACKING_DIR/code_quality.md" && echo -e "\n=== DEBUG SESSIONS ===" && tail -15 "$DEV_TRACKING_DIR/debug_sessions.md"'

alias dev-summary='echo "📋 Development Summary:" && echo "Stories: $(grep -c "## Story:" "$DEV_TRACKING_DIR/story_progress.md" 2>/dev/null || echo "0") tracked" && echo "Quality Score: $(grep -o "Overall Quality Score.*[0-9][0-9]*" "$DEV_TRACKING_DIR/code_quality.md" | tail -1 | grep -o "[0-9][0-9]*" || echo "N/A")/100" && echo "Debug Sessions: $(grep -c "## Debug Session:" "$DEV_TRACKING_DIR/debug_sessions.md" 2>/dev/null || echo "0") sessions"'

# Development Story Review
alias dev-review-story='function _dev_review() { 
    local story_file="${1:-$(ls -t $WINDSURF_PROJECT_ROOT/docs/stories/*.md 2>/dev/null | head -1)}"
    if [[ -f "$story_file" ]]; then
        echo "🚀 Reviewing story for development: $story_file"
        cat "$story_file"
        echo -e "\n📋 Development Checklist:"
        echo "- [ ] Requirements are clear and implementable"
        echo "- [ ] Acceptance criteria are testable"
        echo "- [ ] Technical approach is defined"
        echo "- [ ] Dependencies are identified"
        echo "- [ ] Test strategy is planned"
        echo "- [ ] Implementation timeline is realistic"
    else
        echo "❌ No story file found"
        echo "Usage: dev-review-story [story-file.md]"
    fi
}; _dev_review'

# Development Integration Status
alias dev-integration='echo "🔧 Development Integration Status:" && echo "Story Tracker: $(ls "$DEV_AGENTS_DIR/modules/story_tracker.js" 2>/dev/null && echo "✅" || echo "❌")" && echo "Quality Manager: $(ls "$DEV_AGENTS_DIR/modules/code_quality_manager.js" 2>/dev/null && echo "✅" || echo "❌")" && echo "Debug Assistant: $(ls "$DEV_AGENTS_DIR/modules/debugging_assistant.js" 2>/dev/null && echo "✅" || echo "❌")" && echo "CLI Tools: $(ls "$DEV_AGENTS_DIR/cli" 2>/dev/null && echo "✅" || echo "❌")"'

# Development Environment Setup
alias dev-setup='echo "🛠️ Development Environment Setup:" && echo "Node.js: $(node --version 2>/dev/null || echo "Not installed")" && echo "NPM: $(npm --version 2>/dev/null || echo "Not installed")" && echo "Git: $(git --version 2>/dev/null || echo "Not installed")" && echo "Tests: $(npm run test --silent 2>/dev/null && echo "✅ Working" || echo "❌ Issues detected")"'

# Development Performance
alias dev-perf='echo "⚡ Running performance analysis..." && npm run test:performance 2>/dev/null || echo "Performance tests not configured"'
alias dev-profile='echo "📊 Profiling application..." && npm run profile 2>/dev/null || echo "Profiling not configured"'
alias dev-benchmark='echo "🏃 Running benchmarks..." && npm run benchmark 2>/dev/null || echo "Benchmarks not configured"'

# Development Code Analysis
alias dev-lint='echo "🔍 Running code linter..." && npm run lint'
alias dev-format='echo "💅 Formatting code..." && npm run format 2>/dev/null || echo "Code formatting not configured"'
alias dev-analyze='echo "📊 Analyzing code..." && npm run analyze 2>/dev/null || echo "Code analysis not configured"'

# Development Documentation
alias dev-docs='echo "📚 Development Documentation:" && echo "Stories: docs/stories/" && echo "Implementation: docs/development/" && echo "API: docs/api/" && ls -la "$WINDSURF_PROJECT_ROOT/docs/" 2>/dev/null || echo "Documentation directory not found"'

# Development Metrics Dashboard
alias dev-dashboard='echo "📊 Development Metrics Dashboard:" && echo "===============================" && dev-summary && echo -e "\n📈 Recent Activity:" && echo "Stories: $(grep -c "## Story:" "$DEV_TRACKING_DIR/story_progress.md" | tail -5 | tr "\n" " " || echo "No data")" && echo "Quality: $(grep -c "Quality Score" "$DEV_TRACKING_DIR/code_quality.md" | tail -5 | tr "\n" " " || echo "No data")"'

# Development Task Management
alias dev-task='function _dev_task() {
    local action="${1:-list}"
    local task_name="${2:-}"
    
    case "$action" in
        "add"|"create")
            if [[ -z "$task_name" ]]; then
                echo "Usage: dev-task add <task_name>"
                return 1
            fi
            echo "📝 Adding development task: $task_name"
            echo "- [ ] $task_name" >> "$DEV_TRACKING_DIR/tasks.md"
            ;;
        "list"|"ls")
            echo "📋 Development Tasks:"
            if [[ -f "$DEV_TRACKING_DIR/tasks.md" ]]; then
                cat "$DEV_TRACKING_DIR/tasks.md"
            else
                echo "No tasks found"
            fi
            ;;
        "done"|"complete")
            if [[ -z "$task_name" ]]; then
                echo "Usage: dev-task done <task_name>"
                return 1
            fi
            echo "✅ Marking task complete: $task_name"
            sed -i.bak "s/- \[ \] $task_name/- [x] $task_name/" "$DEV_TRACKING_DIR/tasks.md" 2>/dev/null || echo "Task not found"
            ;;
        *)
            echo "Usage: dev-task [add|list|done] [task_name]"
            ;;
    esac
}; _dev_task'

# Development Help
alias dev-help='echo "🚀 Dev Agent Commands:

Status & Monitoring:
  dev-status           - Check current development notifications
  dev-monitor          - Start development monitoring daemon
  dev-notify-test      - Test development notifications
  dev-summary          - Quick development status summary
  dev-dashboard        - Full development metrics dashboard

Story Management:
  dev-story-new <title> - Create new development story
  dev-story-list       - List all stories
  dev-story-status     - Show story status summary
  dev-story-start <id> - Start working on a story
  dev-story-complete <id> - Complete a story

Code Quality:
  dev-quality-scan     - Scan code quality issues
  dev-quality-refactor - Identify refactoring targets
  dev-quality-improve  - Plan quality improvements
  dev-quality-metrics  - Show quality metrics

Debugging:
  dev-debug-start <issue> - Start debug session
  dev-debug-analyze    - Analyze debug issue
  dev-debug-fix        - Implement debug fix
  dev-debug-verify     - Verify debug fix
  dev-debug-sessions   - List debug sessions

Testing:
  dev-test             - Run all tests
  dev-test-unit        - Run unit tests
  dev-test-integration - Run integration tests
  dev-test-coverage    - Generate test coverage

Code Generation:
  dev-generate <type> <name> - Generate code (component, service, model)

Development Tools:
  dev-lint             - Run code linter
  dev-format           - Format code
  dev-analyze          - Analyze code
  dev-perf             - Run performance analysis

Environment:
  dev-setup            - Check development environment
  dev-docs             - View development documentation
  dev-workflow         - View development workflow

Task Management:
  dev-task add <name>  - Add development task
  dev-task list        - List development tasks
  dev-task done <name> - Mark task as complete

Reports & Analysis:
  dev-report           - Generate development report
  dev-review-story     - Review story for development

Git Integration:
  dev-update           - Commit development tracking updates
  dev-sync             - Sync development data with remote

Configuration:
  dev-integration      - Check integration status
  dev-help             - Show this help message

Examples:
  dev-story-new \"User Authentication Feature\"
  dev-quality-scan && dev-quality-refactor
  dev-debug-start \"Login not working\"
  dev-generate component UserProfile
  dev-task add \"Implement password validation\"
"'

# Development Initialization
alias dev-init='echo "🚀 Initializing Dev Agent..." && mkdir -p "$DEV_TRACKING_DIR" && mkdir -p "$WINDSURF_PROJECT_ROOT/src/components" && mkdir -p "$WINDSURF_PROJECT_ROOT/src/services" && mkdir -p "$WINDSURF_PROJECT_ROOT/test/unit" && echo "Dev Agent directories created" && dev-integration'

# Development Cleanup
alias dev-clean='echo "🧹 Cleaning development temporary files..." && rm -f "$DEV_TRACKING_DIR"/*.tmp && rm -f "$WINDSURF_PROJECT_ROOT"/*.log && echo "Development cleanup complete"'

# Export Dev environment variables
export DEV_AGENTS_DIR
export DEV_TRACKING_DIR
export DEV_SCRIPTS_DIR

echo "🚀 Dev Agent aliases loaded. Type 'dev-help' for available commands."
