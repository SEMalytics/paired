# PAIRED Memory Preservation Guide

## Overview

PAIRED's memory system learns from your development patterns and preserves AI context across sessions. When performing fresh installs, it's crucial to preserve these memories to maintain continuity of AI assistance.

## Memory Preservation Workflow

### Automatic Memory Preservation (Recommended)

The install script automatically handles memory preservation:

```bash
# Fresh install with automatic memory preservation
./install.sh
# 1. Auto-detects existing ~/.paired installation
# 2. Creates backup of memories before installation
# 3. Performs fresh install with new configurations
# 4. Restores memories after installation complete
```

### Manual Memory Management

For advanced users who need explicit control:

```bash
# Before fresh install - backup memories
./scripts/memory-backup.sh backup my_backup_name

# Perform fresh install
./install.sh

# After fresh install - restore specific backup
./scripts/memory-backup.sh restore my_backup_name
```

## What Gets Preserved

### AI Learning Data
- **`~/.paired/memory/`** - AI memories and learned patterns
- **`~/.paired/cache/`** - Performance optimizations and cached data
- **`~/.paired/sessions/`** - Session history and context

### Project Data
- **`~/.paired/registry/`** - Project registry and relationships
- **`~/.pairedrules`** - Global PAIRED configuration

### What Gets Reset
- **Scripts and executables** - Updated to latest versions
- **Agent configurations** - Reset to current templates
- **System integrations** - Refreshed for compatibility

## Memory Backup Commands

### Basic Operations
```bash
# Create manual backup
./scripts/memory-backup.sh backup

# List all available backups
./scripts/memory-backup.sh list

# Restore specific backup
./scripts/memory-backup.sh restore backup_name
```

### Automated Operations
```bash
# Pre-install backup (called by install script)
./scripts/memory-backup.sh auto-backup

# Post-install restore (called by install script)
./scripts/memory-backup.sh auto-restore
```

## Fresh Install Process Walkthrough

### Step 1: Pre-Install State
```
~/.paired/
├── memory/           # AI learned patterns
├── cache/            # Performance data
├── sessions/         # Session history
├── registry/         # Project tracking
└── scripts/          # Current version scripts
```

### Step 2: Auto-Backup (Automatic)
```bash
# Install script detects existing installation
if [ -d ~/.paired ]; then
    memory-backup.sh auto-backup
fi

# Creates timestamped backup:
~/.paired-memory-backups/pre_install_20250820_092144/
├── memory/           # Preserved AI learning
├── cache/            # Preserved performance data  
├── sessions/         # Preserved session history
├── registry/         # Preserved project registry
└── backup_info.txt   # Backup metadata
```

### Step 3: Fresh Install
```bash
# Install script proceeds with fresh installation:
# 1. Removes old ~/.paired directory
# 2. Creates new ~/.paired with latest scripts
# 3. Installs updated agent configurations
# 4. Sets up new system integrations
```

### Step 4: Auto-Restore (Automatic)
```bash
# Install script restores preserved data:
memory-backup.sh auto-restore

# Result: Fresh system + preserved memories
~/.paired/
├── memory/           # RESTORED - AI keeps learning context
├── cache/            # RESTORED - Performance optimizations kept
├── sessions/         # RESTORED - Session continuity maintained
├── registry/         # RESTORED - Project relationships preserved
└── scripts/          # FRESH - Latest version installed
```

### Step 5: Post-Install State
- **Fresh PAIRED installation** with latest features
- **Preserved AI memories** and learning context
- **Maintained project relationships** and registry
- **Updated system integrations** and configurations

## Memory Safety Features

### Backup Validation
- Backup metadata includes system info and timestamps
- Contents verification before restore operations
- Graceful handling of missing or corrupted backups

### Incremental Preservation
- Only memory/cache/session data is preserved
- System files are always refreshed for security
- Configuration templates updated to latest versions

### Rollback Protection
- Multiple backup retention (not just latest)
- Named backups for specific restore points
- Manual backup before major changes

## Troubleshooting Memory Issues

### Memory Not Preserved
```bash
# Check for available backups
./scripts/memory-backup.sh list

# Manually restore if auto-restore failed
./scripts/memory-backup.sh restore backup_name
```

### Corrupted Memory Data
```bash
# Create backup of current state
./scripts/memory-backup.sh backup before_cleanup

# Remove corrupted files and start fresh
rm -rf ~/.paired/memory ~/.paired/cache

# Let PAIRED rebuild memory from clean state
```

### Missing Project Registry
```bash
# Check if registry was backed up
ls ~/.paired-memory-backups/latest_pre_install/registry/

# Manually restore registry if needed
cp -r ~/.paired-memory-backups/latest_pre_install/registry ~/.paired/
```

## Best Practices

### Regular Backups
```bash
# Weekly backup for safety
./scripts/memory-backup.sh backup weekly_$(date +%Y%m%d)

# Before major system changes
./scripts/memory-backup.sh backup before_major_update
```

### Clean Install Strategy
```bash
# For completely clean start (loses memories)
rm -rf ~/.paired ~/.paired-memory-backups
./install.sh

# For fresh install with preserved learning
./install.sh  # Automatic backup/restore
```

### Development Workflow
```bash
# Before PAIRED development work
./scripts/memory-backup.sh backup before_dev_work

# After testing changes
./scripts/memory-backup.sh backup after_testing

# Restore stable state if needed
./scripts/memory-backup.sh restore before_dev_work
```

## Memory Architecture

### Storage Locations
- **Primary**: `~/.paired/memory/` - Active AI memories
- **Backup**: `~/.paired-memory-backups/` - Preserved copies
- **Temp**: `/tmp/paired-memory-*` - Temporary processing

### Data Types
- **Learning patterns** - Code patterns and solutions AI has learned
- **Context history** - Previous session contexts and handoffs  
- **Performance cache** - Optimizations for faster AI responses
- **Project relationships** - Cross-project learning connections

### Security Considerations
- Memory backups stored in user home directory only
- No sensitive data (credentials, secrets) in memory files
- Backup files have restricted permissions (600)
- Automatic cleanup of old backups (configurable retention)

This memory preservation system ensures AI learning continuity across PAIRED updates while maintaining security and system freshness.
