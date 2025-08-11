# 🚀 WEE Quick Reference Guide
*Essential commands and workflows for the Workflow Evolution Engine*

## 🔥 Most Used Commands

```bash
# 🏁 Project Setup
./setup.sh                     # Complete project initialization
./resume.sh                    # Resume from previous session

# 🔍 Navigation & Discovery
./doc_discovery.sh --help      # Show all navigation options
./doc_discovery.sh context     # Current project state
./doc_discovery.sh agents      # AI agent configurations
./doc_discovery.sh --recent    # Recently modified files

# 🔧 Development Tools
python3 type_cleanup.py        # Analyze type coverage
python3 type_cleanup.py --modernize  # Convert legacy typing
./handoff.sh                   # Generate session handoff

# 🤖 AI Agents Quick Access
cd .wee/agents/qa_agent && node cli/quality_check.js     # Quality analysis
cd .wee/agents/pm_agent && node cli/project_planning_cli.js  # Project planning
cd .wee/agents/architecture_agent && node cli/adr.js    # Architecture decisions
```

## 📋 Daily Workflow Cheat Sheet

### 🌅 Session Start
```bash
./resume.sh                    # Load previous context
./doc_discovery.sh context     # Check current focus
git status                     # Review changes
```

### 💻 Development
```bash
python3 type_cleanup.py        # Ensure type safety
# ... your development work ...
git add . && git commit -m "Description"
```

### 🌙 Session End
```bash
./handoff.sh                   # Generate handoff
git push                       # Sync changes
```

## 🤖 AI Agent Personalities & Specializations

| Agent | Command | Best For |
|-------|---------|----------|
| **Alex** (PM) | `pm_agent/cli/project_planning_cli.js` | Milestones, coordination, roadmaps |
| **Sherlock** (QA) | `qa_agent/cli/quality_check.js` | Testing, quality gates, bug analysis |
| **Edison** (Dev) | `dev_agent/cli/debug.js` | Debugging, implementation, code review |
| **Leonardo** (Arch) | `architecture_agent/cli/adr.js` | System design, patterns, decisions |
| **Maya** (UX) | `ux_expert_agent/cli/` | User experience, design systems |
| **Vince** (Scrum) | `scrum_master_agent/cli/` | Process optimization, ceremonies |
| **Marie** (Analyst) | `analyst_agent/cli/competitive_analysis_cli.js` | Data analysis, insights, research |

## 🔍 Documentation Navigation

### Quick Access Patterns
```bash
# Context & State
./doc_discovery.sh context     # Current project focus
./doc_discovery.sh memory      # AI learning repository
./doc_discovery.sh config      # Configuration files

# Development Resources
./doc_discovery.sh rules       # Development principles
./doc_discovery.sh workflows   # Process documentation
./doc_discovery.sh scripts     # Utility tools

# Agent Resources
./doc_discovery.sh agents      # AI agent configurations
./doc_discovery.sh performance # Performance tracking
```

### Key File Locations
```
📁 Essential Files
├── README.md                  # Project overview
├── QUICK_REFERENCE.md         # This file
├── requirements.txt           # Python dependencies
└── setup.sh                  # Automated setup

📁 WEE Core (.wee/)
├── contexts/context_discovery.md    # Current project state
├── memory/ai_memory.md             # AI knowledge base
├── memory/reasoning_log.md         # Decision history
├── config/project_config.yml       # Project settings
└── docs/KNOWLEDGE_NAVIGATOR.md     # Navigation guide

📁 Tools
├── type_cleanup.py            # Type analysis tool
├── doc_discovery.sh          # Documentation navigator
├── handoff.sh               # Session handoff generator
└── resume.sh                # Session resume tool
```

## 🔧 Type Analysis Tool Reference

### Basic Usage
```bash
python3 type_cleanup.py                    # Full analysis
python3 type_cleanup.py --help            # Show options
python3 type_cleanup.py --modernize       # Convert legacy typing
python3 type_cleanup.py --src-dirs src/   # Analyze specific directory
```

### Understanding Output
- **Functions**: Typed/Total functions ratio
- **Variables**: Type annotation coverage
- **Issues**: Specific problems found
- **Modernizations**: Legacy syntax conversions

## 🚨 Troubleshooting

### Common Issues
```bash
# Permission denied on scripts
chmod +x *.sh

# Python dependencies missing
pip3 install -r requirements.txt

# Node.js dependencies missing
cd .wee && npm install

# Git not initialized (affects handoff.sh)
git init && git add . && git commit -m "Initial commit"

# MyPy not found
pip3 install mypy

# Type cleanup finds no files
# Ensure you have Python files in the project directory
```

### Validation Commands
```bash
# Test all tools
./setup.sh                     # Comprehensive validation

# Individual tool tests
python3 type_cleanup.py --help
./doc_discovery.sh --help
./handoff.sh
```

## 💡 Pro Tips

### Efficiency Boosters
- Use `./doc_discovery.sh --recent` to see what changed
- Run `python3 type_cleanup.py` before commits
- Keep `CURRENT_SESSION_HANDOFF.md` for context
- Use agent CLI tools for specialized tasks

### Advanced Workflows
```bash
# Quality gate before commit
python3 type_cleanup.py && git add . && git commit

# Comprehensive project review
./doc_discovery.sh --all | less

# Agent-assisted debugging
cd .wee/agents/dev_agent && node cli/debug.js

# Architecture decision recording
cd .wee/agents/architecture_agent && node cli/adr.js
```

### Knowledge Management
- Update `.wee/memory/ai_memory.md` with learnings
- Document decisions in `.wee/memory/reasoning_log.md`
- Use global knowledge sync for pattern sharing
- Maintain context in `.wee/contexts/context_discovery.md`

## 🎯 Quick Wins

### Immediate Value
1. **Run Setup**: `./setup.sh` for complete initialization
2. **Check Context**: `./doc_discovery.sh context` for current state
3. **Type Safety**: `python3 type_cleanup.py` for code quality
4. **Generate Handoff**: `./handoff.sh` for session documentation

### Next Level
1. **Agent Integration**: Use specialized agents for complex tasks
2. **Pattern Recognition**: Leverage AI memory for similar problems
3. **Global Sync**: Contribute patterns to ecosystem knowledge
4. **Workflow Automation**: Create custom scripts for repetitive tasks

---

*💡 Remember: This is a living document. Update it as you discover new patterns and workflows!*
