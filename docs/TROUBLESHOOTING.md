# 🛠️ Windsurf Troubleshooting Guide

Comprehensive guide for resolving common issues and recovering from problems.

## 🚨 Emergency Recovery

### If Install Script Fails
```bash
# 1. Check if you're in the WEE repository directory
ls -la onboard.sh migrate-windsurf.sh install-windsurf.sh

# 2. Make sure scripts are executable
chmod +x install-windsurf.sh onboard.sh migrate-windsurf.sh

# 3. Run with verbose output to see what's happening
./install-windsurf.sh --help

# 4. Check system requirements
./validate-system.sh

# 5. If auto-detection fails, use manual methods:
# For fresh install:
./onboard.sh
# For upgrade:
./migrate-windsurf.sh

# 6. Check temporary files (if script fails mid-process)
ls -la /tmp/windsurf_check_results
rm -f /tmp/windsurf_check_results  # Clean up if needed
```

### If Onboarding Fails
```bash
# 1. Check system requirements
./validate-system.sh

# 2. If validation fails, fix the issues and retry
./onboard.sh

# 3. If still failing, check permissions
ls -la ~/.wee
chmod -R 755 ~/.wee  # If needed

# 4. Manual alias installation
echo 'source ~/.wee/aliases.sh' >> ~/.zshrc
source ~/.zshrc
```

### If Migration Fails
```bash
# Your data is safe! Migration creates backups automatically
ls -la ~/.wee-migration-backup-*

# To restore from backup:
rm -rf ~/.wee
cp -r ~/.wee-migration-backup-YYYYMMDD_HHMMSS/global-windsurf ~/.wee

# To retry migration:
./migrate-windsurf.sh
```

### If Commands Don't Work
```bash
# 1. Reload shell configuration
source ~/.zshrc
# or
source ~/.bashrc

# 2. Check if aliases are loaded
alias | grep windsurf

# 3. Manual alias check
cat ~/.wee/aliases.sh

# 4. Re-run onboarding
./onboard.sh
```

## 🔍 Common Issues

### Issue: "Command not found: windsurf-init"
**Cause**: Aliases not loaded or shell RC files not updated

**Solutions**:
```bash
# Check if global directory exists
ls -la ~/.wee

# Check if aliases file exists
ls -la ~/.wee/aliases.sh

# Manually source aliases
source ~/.wee/aliases.sh

# Check shell RC files
grep -n "windsurf" ~/.zshrc ~/.bashrc

# Re-run onboarding if needed
./onboard.sh
```

### Issue: "Permission denied" errors
**Cause**: Insufficient file permissions

**Solutions**:
```bash
# Check home directory permissions
ls -la ~ | grep windsurf

# Fix global directory permissions
chmod -R 755 ~/.wee

# Check current directory permissions
ls -la .wee

# Fix project directory permissions
chmod -R 755 .wee
```

### Issue: Python errors during installation
**Cause**: Python version incompatibility or missing Python

**Solutions**:
```bash
# Check Python version
python3 --version

# Install Python 3.8+ if needed (macOS with Homebrew)
brew install python@3.11

# Install Python 3.8+ if needed (Ubuntu/Debian)
sudo apt update && sudo apt install python3 python3-pip

# Verify Python works
python3 -c "import json; print('Python OK')"
```

### Issue: "No such file or directory" during migration
**Cause**: Running migration from wrong directory

**Solutions**:
```bash
# Ensure you're in the Windsurf repository directory
ls -la onboard.sh migrate-windsurf.sh

# If not, navigate to correct directory
cd path/to/windsurf-repository

# Verify files are executable
chmod +x *.sh
```

### Issue: Shell aliases conflict
**Cause**: Existing aliases with same names

**Solutions**:
```bash
# Check existing aliases
alias | grep -E "^(wh|wr|wglobal|wproject)="

# Backup existing aliases
alias > ~/aliases_backup.txt

# Remove conflicting aliases (add to ~/.zshrc or ~/.bashrc)
unalias wh wr wglobal wproject 2>/dev/null || true

# Reload Windsurf aliases
source ~/.wee/aliases.sh
```

### Issue: Knowledge sharing not working
**Cause**: Missing directories or permission issues

**Solutions**:
```bash
# Check global knowledge base
ls -la ~/.wee/memory/global_knowledge.md

# Create if missing
mkdir -p ~/.wee/memory
touch ~/.wee/memory/global_knowledge.md

# Check project memory
ls -la .wee/memory/

# Initialize project if needed
windsurf-init
```

## 🔧 System Requirements Issues

### Missing Required Commands
```bash
# Check what's missing
./validate-system.sh

# Install missing commands (macOS)
brew install python3 bash grep findutils coreutils

# Install missing commands (Ubuntu/Debian)
sudo apt update && sudo apt install python3 bash grep findutils coreutils

# Install missing commands (CentOS/RHEL)
sudo yum install python3 bash grep findutils coreutils
```

### Shell Compatibility Issues
```bash
# Check current shell
echo $SHELL

# Switch to bash if needed
chsh -s /bin/bash

# Switch to zsh if needed
chsh -s /bin/zsh

# Or use explicit shell for Windsurf
bash ./onboard.sh
```

### Disk Space Issues
```bash
# Check available space
df -h ~

# Clean up if needed
rm -rf ~/.wee-migration-backup-* # Old backups
find ~ -name "*.log" -mtime +30 -delete # Old logs

# Check Windsurf usage
du -sh ~/.wee
```

## 🧹 Clean Installation

### Complete Reset (Nuclear Option)
```bash
# ⚠️  WARNING: This removes ALL Windsurf data
# Make sure you have backups of important knowledge!

# Remove global installation
rm -rf ~/.wee

# Remove project installation
rm -rf .wee .weerules

# Remove aliases from shell RC files
sed -i.bak '/# Windsurf/,/^$/d' ~/.zshrc ~/.bashrc

# Fresh installation
./onboard.sh
```

### Selective Reset
```bash
# Reset only global installation
rm -rf ~/.wee
./onboard.sh

# Reset only project installation
rm -rf .wee .weerules
windsurf-init

# Reset only aliases
sed -i.bak '/# Windsurf/,/^$/d' ~/.zshrc ~/.bashrc
./onboard.sh
```

## 🔍 Debugging Tools

### System Information
```bash
# Comprehensive system check
./validate-system.sh

# Manual system info
echo "OS: $(uname -s)"
echo "Shell: $SHELL"
echo "Python: $(python3 --version)"
echo "Home: $HOME"
echo "PWD: $(pwd)"
echo "PATH: $PATH"
```

### Windsurf Status Check
```bash
# Check installation status
windsurf-status

# Check global directory
ls -la ~/.wee/

# Check project directory
ls -la .wee/

# Check aliases
alias | grep windsurf
```

### Knowledge Base Health
```bash
# Check global knowledge
windsurf-knowledge view

# Check project registry
cat ~/.wee/projects/registry.json

# Check knowledge sharing
wshare list
```

## 📞 Getting Help

### Self-Diagnosis
```bash
# Run comprehensive validation
./validate-system.sh

# Check system status
windsurf-status

# View recent logs (if any)
find ~/.wee -name "*.log" -mtime -1
```

### Information to Collect
When reporting issues, include:

1. **System Information**:
   ```bash
   uname -a
   echo $SHELL
   python3 --version
   ```

2. **Windsurf Status**:
   ```bash
   windsurf-status
   ls -la ~/.wee/
   ```

3. **Error Messages**: Copy the exact error output

4. **Steps to Reproduce**: What you were trying to do

5. **Recent Changes**: Any recent system updates or changes

### Common Error Patterns

| Error Pattern | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| `command not found` | Aliases not loaded | `source ~/.zshrc` |
| `permission denied` | File permissions | `chmod +x script.sh` |
| `no such file` | Wrong directory | `cd` to correct location |
| `python: command not found` | Missing Python | Install Python 3.8+ |
| `cannot create directory` | Permission issue | Check `~/.wee` permissions |

## 🛡️ Prevention

### Best Practices
- Always run `./validate-system.sh` before installation
- Keep backups of important knowledge
- Don't modify Windsurf files manually
- Use provided commands for all operations
- Test in a separate directory first if unsure

### Regular Maintenance
```bash
# Monthly health check
./validate-system.sh
windsurf-status

# Clean old backups (keep last 3)
ls -t ~/.wee-migration-backup-* | tail -n +4 | xargs rm -rf

# Update knowledge base
windsurf-knowledge edit
```

---

**Remember**: Windsurf is designed to be safe and recoverable. When in doubt, backups are automatically created, and you can always start fresh! 🌊✨
