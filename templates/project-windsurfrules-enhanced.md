---
description: WEE Project with Complete CASCADE Integration
globs: **/*
alwaysApply: true
---

# WEE Project Auto-Connect with Complete CASCADE Integration
# This file automatically connects this project to WEE agents AND activates CASCADE API

## Complete CASCADE Activation
```bash
# Complete activation: bridge connection + CASCADE API environment
~/.wee/scripts/activate_cascade_complete.sh
```

## What This Does Automatically

### 1. Bridge Connection
- Connects to global CASCADE agent bridge
- Registers all 7 WEE agents with the bridge
- Ensures bridge health and connectivity

### 2. CASCADE API Activation  
- Activates CASCADE API environment in this Windsurf instance
- Registers agents as chat participants in CASCADE UI
- Enables direct agent communication through CASCADE chat

### 3. Agent Availability
All 7 WEE agents become immediately available as chat participants:
- 👑 **Alex (PM)** - Project coordination and delegation
- 🕵️ **Sherlock (QA)** - Quality analysis and testing
- 🏛️ **Leonardo (Architecture)** - System design and patterns
- ⚡ **Edison (Dev)** - Implementation and debugging
- 🎨 **Maya (UX)** - User experience and design
- 🏈 **Vince (Scrum Master)** - Process and team coordination
- 🔬 **Marie (Analyst)** - Data analysis and insights

## Expected Experience
- **Open Windsurf** → Agents are immediately available as chat participants
- **Ask "Alex, are you there?"** → Alex responds directly in CASCADE chat
- **Start working** → All agents available for consultation and collaboration

## Troubleshooting
If agents don't appear immediately:
1. Refresh CASCADE interface
2. Try typing `@Alex` to see if autocomplete shows the agent
3. Ask directly: "Alex, can you hear me?"

*WEE agents are now fully integrated with CASCADE chat interface!*

# CRITICAL WINDSURF IDE AGENT INTEGRATION
# These directives are REQUIRED for Windsurf IDE to recognize and load WEE agents
agent_config: .wee/config/agents/
memory_path: .wee/memory/
context_path: .wee/contexts/

# Include WEE configuration files
include .wee/rules/*.md
include .wee/config/*.yml

# WEE Agent Integration Configuration
wee_agent_integration:
  agent_definitions_file: ".wee/windsurf_agent_types.yml"
  mandatory_consultation: true
  auto_load_on_startup: true
  
  agent_introduction_protocol: |
    When introducing the WEE agent team, ALWAYS:
    1. Read .wee/windsurf_agent_types.yml first
    2. Use exact agent names and personalities as defined
    3. Never improvise or create generic agent names
    4. Reference historical figure inspirations for each agent
    5. Use SHORT names format: "FirstName (Function)" - NO "Agent" suffix
