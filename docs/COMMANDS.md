# 🌊 Windsurf Ecosystem - Command Reference

Complete reference for all available Windsurf commands and aliases.

## 🚀 Installation Commands

### Primary Installation Method
- **`./install-windsurf.sh`** - Dummy-proof installer that auto-detects and handles both fresh installs and upgrades
- **`./install-windsurf.sh --help`** - Show detailed help and usage information

### Manual Installation Methods (Advanced)
- **`./onboard.sh`** - Fresh installation with global setup and project initialization
- **`./migrate-windsurf.sh`** - Upgrade existing installation while preserving knowledge and memories
- **`./validate-system.sh`** - Validate system requirements before installation

## 🌍 Global Commands (Available Everywhere)

These commands work from any directory once Windsurf is installed:

### Core System Commands
- **`windsurf-init`** - Initialize Windsurf in current project
- **`windsurf-status`** - Show ecosystem status and available commands
- **`windsurf-knowledge [view|edit|search]`** - Manage global knowledge base

### Navigation Commands
- **`wglobal`** - Navigate to global Windsurf directory (`~/.wee`)
- **`wproject`** - Navigate to current project root

### Knowledge Management
- **`wlearn`** - Add learning to global knowledge base
- **`wshare [export|import|sync|list]`** - Share knowledge between projects

## 🏠 Project Commands (Available in Windsurf Projects)

These commands are available when you're in a directory with `.wee` or `.weerules`:

### Development Workflow
- **`wh`** - Handoff work (save current state for session continuity)
- **`wr`** - Resume work (load previous state and context)

### Documentation & Discovery
- **`wdocs`** - Document discovery and navigation
- **`wtype`** - Type safety analysis and cleanup

### Environment Management
- **`wenv-dev`** - Switch to development environment
- **`wenv-test`** - Switch to test environment  
- **`wenv-prod`** - Switch to production environment

## 📚 Knowledge Sharing Commands

### `wshare` Subcommands
```bash
wshare export "pattern"     # Export project insights matching pattern to global
wshare import "pattern"     # Import global insights matching pattern to project
wshare sync                 # Sync bidirectionally between project and global
wshare list                 # List available knowledge sources
```

### `windsurf-knowledge` Subcommands
```bash
windsurf-knowledge view     # View global knowledge base
windsurf-knowledge edit     # Edit global knowledge base
windsurf-knowledge search "term"  # Search global knowledge base
```

## 🚀 Setup & Migration Commands

### Initial Setup
```bash
./onboard.sh              # Fresh installation and setup
./migrate-windsurf.sh      # Upgrade from earlier versions (preserves knowledge)
```

### Project Initialization
```bash
windsurf-init             # Initialize Windsurf in current project
```

## 📊 Status & Information Commands

### System Status
```bash
windsurf-status           # Show ecosystem status
```

### Project Information
When in a Windsurf project, the system automatically shows:
- Current project name
- Available project-specific commands
- Global commands

## 🔄 Workflow Examples

### Starting a New Project
```bash
cd my-new-project
windsurf-init                    # Initialize Windsurf
windsurf-status                  # Check available commands
```

### Daily Development Workflow
```bash
wr                              # Resume previous session
# ... do development work ...
wh                              # Handoff current state
```

### Knowledge Management Workflow
```bash
# Discover useful pattern in current project
wshare export "error handling"   # Export to global knowledge

# In another project, import that knowledge
wshare import "error handling"   # Import from global knowledge

# Auto-sync recent insights
wshare sync                     # Bidirectional sync
```

### Cross-Project Navigation
```bash
wglobal                         # Go to global Windsurf directory
cat projects/registry.json      # See all registered projects
cd /path/to/other/project       # Switch to another project
windsurf-status                 # Check project status
```

## 🎯 Context-Aware Behavior

The Windsurf ecosystem is **context-aware**:

### In a Windsurf Project
- Shows project name and project-specific commands
- `wproject` navigates to project root
- Project commands (`wh`, `wr`, `wdocs`, `wtype`, `wenv-*`) are available

### Outside a Windsurf Project
- Shows message about initializing Windsurf
- Only global commands are available
- `windsurf-init` can set up Windsurf in current directory

### Global Commands Always Available
- Navigation: `wglobal`, `wproject`
- Knowledge: `windsurf-knowledge`, `wlearn`, `wshare`
- System: `windsurf-init`, `windsurf-status`

## 🔧 Advanced Usage

### Environment Variables
The system uses these environment variables:
- `WINDSURF_PROJECT_ROOT` - Current project root (auto-detected)
- `WINDSURF_GLOBAL_DIR` - Global Windsurf directory (`~/.wee`)

### File Locations
- **Global Knowledge**: `~/.wee/memory/global_knowledge.md`
- **Project Registry**: `~/.wee/projects/registry.json`
- **Project Memory**: `.wee/memory/`
- **Project Config**: `.wee/config/project_config.yml`

### Customization
- **Global Aliases**: Edit `~/.wee/aliases.sh`
- **Project Templates**: Add to `~/.wee/templates/`
- **Knowledge Categories**: Organize in global knowledge base with markdown headers

## 🆘 Troubleshooting

### Commands Not Found
```bash
# Restart shell or reload aliases
source ~/.zshrc
# or
source ~/.bashrc
```

### Check Installation
```bash
windsurf-status           # Verify installation
ls -la ~/.wee        # Check global directory
```

### Migration Issues
```bash
# Check migration backup
ls -la ~/.wee-migration-backup-*

# Re-run migration if needed
./migrate-windsurf.sh
```

---

**💡 Pro Tip**: Use `windsurf-status` anytime to see what commands are available in your current context!
