# PAIRED Troubleshooting Guide

## Common Issues

### Installation Problems

**Issue**: Installation fails with permission errors
```bash
# Solution: Run with proper permissions
curl -fsSL https://raw.githubusercontent.com/SEMalytics/paired/main/install.sh | sudo bash
```

**Issue**: Command not found after installation
```bash
# Solution: Reload shell or add to PATH
source ~/.bashrc
# or
export PATH="$HOME/.paired/bin:$PATH"
```

### Agent Issues

**Issue**: Agents not starting
```bash
# Check agent status
paired-doctor

# Restart agents
paired-start
```

**Issue**: Bridge connection problems
```bash
# Check bridge status
paired-monitor

# Restart bridge
pkill -f cascade_bridge_unified_takeover
paired-start
```

### Project Issues

**Issue**: Project initialization fails
```bash
# Clean and retry
rm -rf .paired/
paired-init
```

**Issue**: Windsurf integration not working
```bash
# Check Windsurf rules
cat .windsurfrules

# Reinstall integration
paired-init --force
```

## Diagnostic Commands

- `paired-doctor` - Full system health check
- `paired-monitor` - Real-time agent monitoring
- `paired-registry` - Script registry status

## Getting Help

For additional support:
1. Run `paired-doctor` for detailed diagnostics
2. Check logs in `~/.paired/logs/`
3. Review agent status with `paired-monitor`
