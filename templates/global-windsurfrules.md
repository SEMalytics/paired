---
description: PAIRED Global Auto-Detection and Auto-Connect System
globs: **/*
alwaysApply: true
---

# PAIRED Global Auto-Connect System
# This file enables fully automated PAIRED onboarding and agent connection

## Auto-Detection & Auto-Connect Logic

### Phase 1: Directory Analysis
```javascript
// Auto-detect project type and PAIRED status
const isDevProject = checkForDevIndicators(); // .git, package.json, etc.
const hasPAIRED = checkForPAIRED(); // .paired/ or .pairedrules exists
const needsInit = isDevProject && !hasPAIRED;
const needsConnect = hasPAIRED && !isConnectedToBridge();
```

### Phase 2: Auto-Initialization (Fresh Directories)
```bash
# If development project detected without PAIRED
if (needsInit) {
    // Auto-run PAIRED initialization
    exec('paired-init --auto --silent');
    
    // Create project .windsurfrules for bridge connection
    createProjectWindsurfRules();
    
    // Log: "PAIRED auto-initialized in project"
}
```

### Phase 3: Auto-Connect to Bridge
```bash
# If PAIRED project detected without bridge connection
if (needsConnect) {
    // Auto-connect to CASCADE bridge
    exec('~/.paired/scripts/connect_cascade_clean.js --auto');
    
    // Verify agents are available
    verifyAgentConnection();
    
    // Log: "PAIRED agents connected and ready"
}
```

## Auto-Connect Rules

### Fresh Directory (No .windsurfrules)
- ✅ **Auto-detect** development project indicators
- ✅ **Auto-initialize** PAIRED structure if dev project
- ✅ **Auto-create** local .windsurfrules for bridge connection
- ✅ **Auto-connect** to global agent bridge
- ✅ **Silent operation** - no user prompts required

### Existing PAIRED Project (Has .windsurfrules)
- ✅ **Auto-connect** to bridge on Windsurf startup
- ✅ **Auto-register** agents in CASCADE chat
- ✅ **Auto-verify** agent availability
- ✅ **Auto-reconnect** if bridge connection lost

## Implementation Commands

### Auto-Init Command
```bash
# ~/.paired/scripts/auto-init-project.sh
#!/bin/bash
# Auto-initialize PAIRED in fresh development directories
# Called automatically by global .windsurfrules

if [[ ! -f ".pairedrules" && ! -d ".paired" ]]; then
    # Check if this looks like a development project
    if [[ -d ".git" || -f "package.json" || -f "requirements.txt" || -f "Cargo.toml" ]]; then
        echo "🚀 Auto-initializing PAIRED in development project..."
        
        # Run silent PAIRED initialization
        ~/.paired/scripts/init-project.sh --auto --silent
        
        # Create project .windsurfrules for auto-connect
        cat > .windsurfrules << 'EOF'
---
description: PAIRED Project Auto-Connect
globs: **/*
alwaysApply: true
---

# PAIRED Project Auto-Connect
# This file automatically connects this project to the PAIRED agent bridge

## Auto-Connect on Windsurf Startup
```bash
# Auto-connect to CASCADE bridge
~/.paired/scripts/connect_cascade_clean.js --project-auto-connect

# Verify agents are available
if ! curl -s http://localhost:7890/health >/dev/null 2>&1; then
    # Start bridge if not running
    ~/.paired/scripts/deploy_unified_cascade_bridge.sh --auto
fi

# Register project with bridge
~/.paired/scripts/register_project_with_bridge.js
```

## Agent Availability Check
```javascript
// Verify all 7 agents are connected
const expectedAgents = ['Alex', 'Sherlock', 'Leonardo', 'Edison', 'Maya', 'Vince', 'Marie'];
const availableAgents = await checkAgentAvailability();

if (availableAgents.length === expectedAgents.length) {
    console.log('✅ All PAIRED agents connected and ready');
} else {
    console.log('⚠️ Reconnecting missing agents...');
    await reconnectMissingAgents();
}
```

## Commands Available
- All PAIRED agents immediately available in CASCADE chat
- Alex coordinates and delegates to specialists automatically
- No manual scripts or setup required

*PAIRED agents are now available - just start asking questions!*
EOF
        
        echo "✅ PAIRED auto-initialized with agent bridge connection"
    fi
fi
```

### Auto-Connect Command
```bash
# ~/.paired/scripts/auto-connect-bridge.sh
#!/bin/bash
# Auto-connect to CASCADE bridge for existing PAIRED projects
# Called automatically by project .windsurfrules

echo "🌉 Auto-connecting to PAIRED agent bridge..."

# Check if bridge is running
if ! curl -s http://localhost:7890/health >/dev/null 2>&1; then
    echo "🚀 Starting CASCADE bridge..."
    ~/.paired/scripts/deploy_unified_cascade_bridge.sh --auto --silent
fi

# Connect current project to bridge
~/.paired/scripts/connect_cascade_clean.js --auto --silent

# Verify agents are available
if curl -s http://localhost:7890/agents | grep -q "Alex"; then
    echo "✅ All PAIRED agents connected and ready in CASCADE"
else
    echo "⚠️ Retrying agent connection..."
    ~/.paired/scripts/get_alex_speaking.js --auto
fi
```

## Expected User Experience

### Opening Fresh Development Directory:
1. **Windsurf opens** → Global .windsurfrules detects dev project
2. **Auto-initialization** → PAIRED structure created silently
3. **Auto-connect** → Agents immediately available in CASCADE
4. **Ready to work** → "Are my agents here?" → "Yes! All 7 agents ready"

### Opening Existing PAIRED Project:
1. **Windsurf opens** → Project .windsurfrules auto-connects
2. **Bridge connection** → Agents immediately available
3. **Ready to work** → No setup, no scripts, just works

## Success Metrics
- ✅ **Zero manual steps** - Everything happens automatically
- ✅ **Instant agent availability** - Agents ready when Windsurf opens
- ✅ **Multi-project support** - Each directory gets its own connection
- ✅ **Robust reconnection** - Auto-recovery from bridge disconnects
- ✅ **Silent operation** - No user prompts or interruptions

*This system delivers the "dummy-proof" experience where agents are always just there when you need them.*
