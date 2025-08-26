---
description: PAIRED Project with Complete CASCADE Integration
globs: **/*
alwaysApply: true
---

# PAIRED Project Auto-Connect with Complete CASCADE Integration
# This file automatically connects this project to PAIRED agents AND activates CASCADE API

# Include PAIRED configuration
include .paired/rules/*.md
include .paired/config/*.yml

# PAIRED Agent Integration - CRITICAL: Auto-load official agent definitions
agent_config: .paired/config/agents/
memory_path: .paired/memory/
context_path: .paired/contexts/

## Complete CASCADE Activation
```bash
# Complete activation: bridge connection + CASCADE API environment
~/.paired/scripts/activate_cascade_complete.sh
```

## What This Does Automatically

### 1. Bridge Connection
- Connects to global CASCADE agent bridge
- Registers all 7 PAIRED agents with the bridge
- Ensures bridge health and connectivity

### 2. CASCADE API Activation  
- Activates CASCADE API environment in this Windsurf instance
- Registers agents as chat participants in CASCADE UI
- Enables direct agent communication through CASCADE chat

### 3. Agent Availability
All 7 PAIRED agents become immediately available as chat participants:
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

*PAIRED agents are now fully integrated with CASCADE chat interface!*

# CRITICAL WINDSURF IDE AGENT INTEGRATION
# These directives are REQUIRED for Windsurf IDE to recognize and load PAIRED agents
agent_config: .paired/config/agents/
memory_path: .paired/memory/
context_path: .paired/contexts/

# Include PAIRED configuration files
include .paired/rules/*.md
include .paired/config/*.yml

# PAIRED Agent Integration Configuration
paired_agent_integration:
  agent_definitions_file: ".paired/windsurf_agent_types.yml"
  mandatory_consultation: true
  auto_load_on_startup: true
  
  agent_introduction_protocol: |
    When introducing the PAIRED agent team, ALWAYS:
    1. Read .paired/windsurf_agent_types.yml first
    2. Use exact agent names and personalities as defined
    3. Never improvise or create generic agent names
    4. Reference historical figure inspirations for each agent
    5. Use SHORT names format: "FirstName (Function)" - NO "Agent" suffix
