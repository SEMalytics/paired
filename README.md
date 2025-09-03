# 🤝 PAIRED - Platform for AI-Enabled Remote Development

**Never code alone - Whether paired with AI or humans**

## 🤔 What is PAIRED?

PAIRED is like having a **smart development team** that works alongside you in your IDE. Think of it as:

- **🤖 Your AI Development Team** - 7 specialized AI agents (Project Manager, QA Expert, Architect, Developer, UX Designer, Scrum Master, Data Analyst)
- **🔗 Universal Bridge** - Connects any AI platform to any development environment
- **⚡ One-Click Setup** - Install once, works everywhere
- **💬 Natural Integration** - Agents appear in your IDE chat like real teammates

**Perfect for:**
- Developers who want AI assistance without complexity
- Teams needing consistent AI collaboration workflows
- Anyone tired of juggling multiple AI tools

*Revolutionary middleware that transforms how developers collaborate* ✨

**"Partnership is our platform, collaboration is our code"** - The PAIRED manifesto.

## 🤖 Your 7-Agent Development Team

Each agent has **real capabilities** - not just chat responses:

- 👑 **Alex (PM)** - Project coordination and strategic planning
  - Real project planning tools and milestone tracking
- 🕵️ **Sherlock (QA)** - Quality investigation and code auditing
  - Runs actual code quality audits and metrics analysis
- 🏛️ **Leonardo (Architecture)** - System design and architectural patterns
  - Performs real architectural pattern detection and analysis
- ⚡ **Edison (Dev)** - Development implementation and debugging
  - Provides actual debugging assistance and development tools
- 🎨 **Maya (UX)** - User experience design and accessibility
  - Conducts real WCAG accessibility audits and UX analysis
- 🏈 **Vince (Scrum Master)** - Team coordination and process management
  - Manages actual sprint health monitoring and team processes
- 🔬 **Marie (Analyst)** - Data analysis and market research
  - Performs real market research and competitive analysis

## ✨ Why PAIRED is Revolutionary

- **🤝 Universal Bridge** - One platform, every AI, infinite collaboration
- **🔧 Real Agent Tools** - Each agent uses actual analysis tools, not just chat
- **🌍 Works Everywhere** - Same intelligent bridge connects any project
- **⚡ One-Command Magic** - Single activation script, instant agent team
- **💬 Seamless Integration** - Agents appear naturally in CASCADE chat
- **🛡️ Rock-Solid Reliable** - Manual activation (always works)
- **📚 Beautifully Simple** - Clear docs that respect your time

## 📋 Prerequisites

**Before installing, make sure you have:**

- **Node.js 18+** and **npm** ([Download here](https://nodejs.org/))
- **Python 3.8+** ([Download here](https://python.org/)) - Required for learning tracker and type analysis
- **Git** ([Download here](https://git-scm.com/))
- **Windsurf IDE** or compatible editor
- **Terminal/Command Line** access

**Supported Platforms:**
- ✅ **macOS** (Fully tested and supported)
- ✅ **Linux** (Ubuntu, Debian, CentOS, Arch)
- ❌ **Windows** (Not currently supported - would welcome community contributions)

> 💡 **New to these tools?** See our [Beginner Setup Guide](docs/BEGINNER_SETUP.md) for step-by-step installation help.
> 🪟 **Windows users**: PAIRED doesn't currently support Windows, but we'd be very interested in community contributions to add Windows support! See [docs/WINDOWS_SUPPORT.md](docs/WINDOWS_SUPPORT.md)

## 🚀 Quick Start

**Get your 7-agent AI development team running in 3 simple steps:**

### Installation

1. **Check your system** (optional but recommended):
   ```bash
   git clone https://github.com/SEMalytics/paired-dev.git paired
   cd paired
   ./bin/paired-check
   ```

2. **Install PAIRED**:
   ```bash
   ./install.sh
   ```

3. **Initialize in your project**:
   ```bash
   cd ~/your-project
   paired-init
   ```

4. **Start PAIRED** (simple unified startup):
   ```bash
   bin/paired-start
   ```

5. **Open in Windsurf**:
   ```bash
   windsurf .
   ```

6. **Test with CASCADE**:
   Type "Hi Alex!" in the CASCADE chat panel

### Alternative Startup Methods
```bash
# ✅ Direct script access
~/.paired/scripts/start-agents.sh --auto

# ❌ Avoid complex scripts (may fail)
# Complex CASCADE activation scripts are deprecated
```

✅ **That's it!** Your 7 AI agents are ready to help - no additional commands needed!

---

## 📋 What Each Step Does

**Step 1** creates your global PAIRED system with all 7 agents and commands. The `source` command loads the new commands into your current shell.

**Step 2** sets up your project with agent memory and Windsurf integration.

**Step 3** opens Windsurf with automatic agent integration - the bridge starts automatically when you open the project.


## 🏢 Advanced Setup

### Quick Installation

**Core PAIRED Foundation:**
```bash
git clone https://github.com/internexio/paired.git
cd paired
./install.sh
```


### Team Deployment
```bash
# Each team member
scripts/install.sh

# Project lead
paired-init --team-mode
```

## 📚 Complete Command Reference

### Global Commands
- `paired-init` - Initialize PAIRED in current project
- `paired-start` - Start bridge and launch all 7 agents
- `paired-stop` - Stop bridge and all agents
- `paired-status` - Show global and project status
- `paired-doctor` - Comprehensive health check and repair
- `paired-lock` - Lock/unlock .paired directory protection
- `paired-knowledge` - Sync knowledge between projects
- `paired knowledge <cmd>` - Project knowledge management (init, learn, context, search, stats, export)
- `paired-global` - Manage global PAIRED registry
- `paired-sync` - Sync project data with global knowledge

### Project Commands (work in PAIRED projects)
- `paired handoff` - Generate handoff documentation
- `paired resume` - Resume from last session
- `paired docs` - Discover and analyze documentation
- `paired type-cleanup` - Clean up type definitions
- `paired env-dev/test/prod` - Set environment configurations

### Lock & Security Commands
- `paired-lock status` - Show .paired directory protection status
- `paired-lock lock` - Lock .paired directory (read-only protection)
- `paired-lock unlock` - Request permission to unlock .paired directory
- `paired-lock sync` - Sync .paired changes back to repo templates

### Diagnostic Commands
- `paired-test` - Run PAIRED system tests
- `paired-validate` - Validate system configuration
- `paired-help` - Show all available commands
- `paired-version` - Show PAIRED version info

## 🔧 Troubleshooting

### Agents Not Responding?
**Most common fix:** Close and reopen Windsurf

**Still not working?**
1. `paired-doctor` (full health check)
2. `./scripts/bridge-status.sh` (check bridge)
3. Close other Windsurf instances and try again

### Common Issues
- **"Hi Alex!" no response** → Close and reopen Windsurf
- **Bridge connection failed** → Close other Windsurf instances
- **Commands not found** → Run `source ~/.zshrc` or restart terminal

### Essential Workflow
**Every time you open a PAIRED project:**
1. `windsurf .` (agents start automatically)
2. Test: "Hi Alex!"
3. Start coding with your agents

## 🧠 Project Knowledge System

PAIRED includes an intelligent project knowledge system that learns from your development sessions and provides contextual recommendations.

### Quick Start
```bash
# Initialize knowledge system
paired knowledge init

# Learn from development session
paired knowledge learn --interactive

# Get project context and recommendations
paired knowledge context

# Search project knowledge
paired knowledge search "authentication"
```

### Key Features
- **🔍 Pattern Recognition** - Automatically detects code patterns and development approaches
- **📋 Decision Tracking** - Captures architectural and technical decisions with rationale
- **💡 Insight Generation** - Generates actionable insights from development activities
- **🔄 Cross-Session Learning** - Maintains knowledge across development sessions
- **📤 Export Capabilities** - Export knowledge in JSON or Markdown formats


## 📚 Complete Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - One-command activation
- **[Complete System Guide](docs/PAIRED_COMPLETE_SYSTEM_GUIDE.md)** - Comprehensive setup and configuration
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment for teams and enterprises
- **[Philosophy](docs/PHILOSOPHY.md)** - PAIRED principles and positioning
- **[Essential Files Checklist](docs/ESSENTIAL_FILES_CHECKLIST.md)** - Required files

## 🎯 The Tiny Revolution

**"Why build massive infrastructure when a tiny bridge will do?"**

- **🐁 Intentionally Small** - Microscopic footprint, massive impact
- **🕰️ Quietly Effective** - Barely there, always helping
- **🎉 Joyfully Simple** - "Wheee!" - the delight of smooth workflows
- **🔗 Perfect Middleware** - Connects what you have, adds what you need
- **💫 Humble Confidence** - Small but mighty, like the best assistants

*From Internexio's "Between the Networks" philosophy comes PAIRED's mission: prove that the smallest bridges carry the most important traffic.*

## 🤝 Contributing

PAIRED is open source and we'd love your help making it better!

### 🚀 Jump In!

- **🐛 Found a bug?** [Open an issue](https://github.com/internexio/paired/issues) - we'll figure it out together
- **💡 Got an idea?** [Open an issue](https://github.com/internexio/paired/issues) with the "enhancement" label - all ideas welcome!
- **📖 Improve docs** - Fix typos, add examples, make things clearer
- **🔧 Submit code** - Bug fixes, new features, whatever helps
- **🧪 Test stuff** - Try new features, break things, report what happens
- **🎨 Enhance agents** - Make the AI agents smarter and more useful

### 📋 How to Contribute

1. **Fork it** - Make your own copy to work on
2. **Test it** - Make sure you didn't break anything
3. **Document it** - Help others understand your changes
4. **Keep it simple** - One thing per pull request works best

### 🏗️ Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/paired.git
cd paired

# Install development dependencies
scripts/install.sh

# Run tests
paired doctor --validate
```

### 📞 Get Help

- **🐛 Issues** - Bug reports, feature requests, and general questions
- **📧 Email** - Direct contact for sensitive topics

We're excited to see what you'll build with PAIRED! 🎉

---

**Ready to transform your development workflow? Follow the Quick Start guide above and meet your new AI development team!**

*For detailed setup instructions, troubleshooting, and advanced features, see the complete documentation linked above.*
