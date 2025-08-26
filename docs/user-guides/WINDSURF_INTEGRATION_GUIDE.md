# PAIRED Windsurf Integration Guide

## Overview

PAIRED is specifically designed for Windsurf IDE integration. This guide covers Windsurf-specific setup, configuration, and usage patterns for optimal PAIRED experience.

## Why Windsurf is Required

### Technical Requirements
- **CASCADE Chat Panel** - PAIRED agents communicate through CASCADE
- **Built-in AI Integration** - Windsurf provides the AI infrastructure PAIRED extends
- **Project Context Awareness** - Windsurf understands your codebase structure
- **Real-time Collaboration** - Seamless integration with PAIRED's bridge system

### Alternative IDEs
Currently, PAIRED is **Windsurf-exclusive**. Other IDEs lack the CASCADE integration layer required for agent communication.

## Windsurf Setup for PAIRED

### Initial Windsurf Configuration

**1. Ensure Windsurf is Updated**
```bash
# Check Windsurf version
windsurf --version

# Update if needed (follow Windsurf documentation)
```

**2. Verify CASCADE Panel Access**
- Open Windsurf
- Look for CASCADE chat panel (usually right sidebar)
- If missing, check View menu → Panels → CASCADE

**3. Project Opening Best Practices**
```bash
# Always open from project root
cd /path/to/your/project
windsurf .

# Not from subdirectories - PAIRED needs full project context
```

### Windsurf Settings Optimization

**Recommended Settings for PAIRED:**

**1. CASCADE Panel Configuration**
- Keep CASCADE panel visible and docked
- Set reasonable width (300-400px recommended)
- Enable chat history persistence

**2. File Explorer Settings**
- Show hidden files (to see `.paired` directory)
- Enable file watching for real-time updates

**3. Terminal Integration**
- Ensure integrated terminal has access to PAIRED commands
- Verify PATH includes `~/.paired/bin`

## PAIRED + Windsurf Workflow

### Session Startup Sequence

**Every time you open Windsurf:**

1. **Open your PAIRED project**
   ```bash
   cd /path/to/your/project
   windsurf .
   ```

2. **Activate PAIRED agents**
   ```bash
   paired-start
   ```

3. **Wait for initialization** (5-10 seconds)
   - Bridge starts on port 7890
   - Agents connect to CASCADE
   - System ready indicator

4. **Test agent connectivity**
   - In CASCADE chat: "Alex, are you there?"
   - Expected: Personalized response from Alex

### CASCADE Chat Panel Usage

**Effective Communication Patterns:**

**Direct Agent Addressing:**
```
Alex, what's the status of this project?
Sherlock, can you audit this code for issues?
Leonardo, how should I architect this feature?
```

**Multi-Agent Collaboration:**
```
Alex and Leonardo, help me plan the architecture for user authentication
Sherlock and Edison, debug this performance issue together
```

**Context-Rich Requests:**
```
Maya, review the UX of our checkout flow in src/components/checkout/
Marie, analyze the user engagement data in our analytics dashboard
```

### File and Project Context

**PAIRED agents automatically understand:**
- Your project structure and file organization
- Recent changes and git history
- Open files and current editing context
- Project dependencies and configuration

**Best practices for context:**
- Keep relevant files open when asking questions
- Reference specific files/functions in requests
- Mention project goals and constraints

## Common Windsurf + PAIRED Issues

### CASCADE Panel Issues

**Problem: CASCADE panel not visible**
```
Solution:
1. View menu → Panels → CASCADE
2. If still missing, restart Windsurf
3. Check Windsurf version compatibility
```

**Problem: CASCADE shows generic AI responses**
```
Solution:
1. Verify paired-start was run successfully
2. Check bridge status: ./scripts/bridge-status.sh
3. Test connectivity: "Alex, are you there?"
```

### Agent Connectivity Issues

**Problem: Agents not responding**
```
Diagnosis:
- Bridge not running (most common)
- Port 7890 blocked or in use
- Windsurf CASCADE not connected to bridge

Solution:
1. Run paired-start
2. Check for port conflicts: lsof -i :7890
3. Restart Windsurf if needed
```

**Problem: Generic responses instead of agent personalities**
```
Diagnosis:
- Bridge connected but agents not properly initialized
- CASCADE using default AI instead of PAIRED agents

Solution:
1. Verify bridge status: ./scripts/bridge-status.sh
2. Check agent processes: ps aux | grep agent
3. Restart with: paired-start
```

### Performance Issues

**Problem: Slow agent responses**
```
Common causes:
- First startup (normal - system warming up)
- Multiple Windsurf instances competing for resources
- Bridge connection instability

Solutions:
1. Wait for warmup period (first 30 seconds)
2. Close other Windsurf instances
3. Restart bridge: paired-start
```

**Problem: Windsurf becomes unresponsive**
```
Diagnosis:
- Resource contention between Windsurf and PAIRED
- Memory usage too high

Solution:
1. Close unnecessary browser tabs/applications
2. Restart Windsurf
3. Check system resources: Activity Monitor (Mac) / Task Manager (Windows)
```

## Windsurf-Specific Features

### Project File Integration

**PAIRED agents can:**
- Read and analyze any file in your project
- Understand project structure and dependencies
- Reference specific code sections and functions
- Track changes across editing sessions

**Usage examples:**
```
Edison, explain the logic in src/utils/auth.js lines 45-60
Sherlock, audit the security of our API endpoints in routes/
Leonardo, review the database schema in migrations/
```

### Real-Time Collaboration

**Multi-cursor editing with agent guidance:**
- Agents can reference your current cursor position
- Real-time suggestions as you type
- Context-aware code completion enhancement

**Live debugging assistance:**
- Agents can see your debugging session
- Real-time error analysis and suggestions
- Step-through debugging guidance

### Integrated Terminal Support

**PAIRED commands work in Windsurf terminal:**
```bash
# All PAIRED commands available
paired-status
paired-start
./scripts/bridge-status.sh

# Agents can reference terminal output
# Ask: "Edison, explain this error message"
```

## Optimization Tips

### Windsurf Performance with PAIRED

**Memory Management:**
- Close unused projects in Windsurf
- Limit number of open files
- Regular Windsurf restarts for long sessions

**Network Optimization:**
- Ensure stable internet connection
- Close bandwidth-heavy applications
- Use wired connection if possible

**System Resources:**
- Minimum 8GB RAM recommended
- SSD storage for better performance
- Close unnecessary background applications

### Workflow Efficiency

**Keyboard Shortcuts:**
- Set up shortcuts for CASCADE panel toggle
- Quick access to integrated terminal
- File navigation shortcuts

**Panel Layout:**
- Keep CASCADE panel always visible
- Optimize panel sizes for your workflow
- Use split views for code + chat

**Session Management:**
- Always run paired-start when opening projects
- Keep agent test phrase handy: "Alex, are you there?"
- Bookmark frequently used PAIRED commands

## Advanced Integration

### Custom Windsurf Extensions

PAIRED can work alongside other Windsurf extensions:
- Code formatters and linters
- Git integration tools
- Database management extensions

**Compatibility notes:**
- Some extensions may conflict with CASCADE
- Test new extensions with PAIRED agents
- Report compatibility issues

### Multi-Project Workflows

**Working with multiple PAIRED projects:**
```bash
# Each project needs its own Windsurf instance
# Each instance needs paired-start run separately
# Agents maintain separate context per project
```

**Best practices:**
- Use separate Windsurf windows for each project
- Run paired-start in each project's terminal
- Test agent connectivity in each instance

## Troubleshooting Checklist

### Before Asking for Help

**Verify these basics:**
- [ ] Windsurf is updated to latest version
- [ ] CASCADE panel is visible and responsive
- [ ] Project opened from root directory (`windsurf .`)
- [ ] `paired-start` completed successfully
- [ ] "Alex, are you there?" gets personalized response
- [ ] No port conflicts on 7890
- [ ] System has adequate resources (RAM/CPU)

### Common Solutions

**"Nothing works":**
1. Restart Windsurf completely
2. Run paired-start from project root
3. Test with "Alex, are you there?"

**"Agents are generic":**
1. Check bridge status: `./scripts/bridge-status.sh`
2. Verify agent processes are running
3. Restart PAIRED: `paired-start`

**"Performance is poor":**
1. Close other applications
2. Restart Windsurf
3. Check system resources

## Getting Help

### Documentation Resources
- **[Expectations Guide](EXPECTATIONS_GUIDE.md)** - What to expect from PAIRED
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Technical issue resolution
- **[Agent Collaboration Guide](user-guides/AGENT_COLLABORATION_GUIDE.md)** - Usage patterns

### Support Channels
- GitHub Issues for technical problems
- Documentation for usage questions
- Community forums for best practices

Remember: PAIRED + Windsurf integration is designed to be seamless. Most issues resolve with a simple restart of either Windsurf or PAIRED agents.
