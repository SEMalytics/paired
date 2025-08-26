# Agent Safety Protocols

## Git Commit Safety System

### Overview
This repository implements a **double-override system** to prevent AI agents from accidentally bypassing quality controls using `--no-verify`.

### Implementation

#### 1. Safe Git Commit Wrapper
- **Location**: `.paired/scripts/safe_git_commit.sh`
- **Purpose**: Intercepts all git commit commands and checks for `--no-verify` usage
- **Requirements**: Double confirmation with specific phrases

#### 2. Git Alias Override
```bash
git config alias.commit '!.paired/scripts/safe_git_commit.sh'
```

### Double Override Process
When `--no-verify` is detected:

1. **First Confirmation**: User must type `BYPASS` exactly
2. **Second Confirmation**: User must type `I_UNDERSTAND_THE_RISKS` exactly

### For AI Agents
- **NEVER** attempt to use `--no-verify` without explicit user permission
- **ALWAYS** run normal commits first to identify issues
- **EXPLAIN** pre-commit failures to the user before suggesting bypasses
- **RESPECT** the double-override system - it exists for quality protection

### Benefits
- ✅ Prevents accidental quality control bypasses
- ✅ Forces conscious decision-making about code quality
- ✅ Maintains audit trail of when bypasses are used
- ✅ Agent-proof design that requires human intervention

### Usage
Normal commits work exactly as before:
```bash
git commit -m "your message"
```

Only `--no-verify` triggers the safety system.
