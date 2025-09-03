# PAIRED Windsurf Startup Guide

## **Seamless Startup Experience**

When you open Windsurf in a PAIRED project, everything should "just work" automatically.

### **Expected User Experience:**
```
🔗 PAIRED Bridge Connected
👑 Alex (PM): Strategic coordination ready
🏛️ Leonardo (Architecture): System design ready  
⚡ Edison (Dev): Implementation ready
🎨 Maya (UX): User experience ready
🕵️ Sherlock (QA): Quality assurance ready
🏈 Vince (Scrum): Process management ready
🔬 Marie (Analyst): Data analysis ready
```

---

## **Auto-Startup Configuration**

### **Windsurf Rules Integration:**
The `.windsurfrules` file contains startup commands that execute automatically:

```yaml
startup_commands:
  - name: "Auto-start PAIRED agents"
    command: "~/.paired/scripts/start-agents.sh --auto"
    async: true
    description: "Connect if running, start if stopped"
```

### **Bridge Architecture:**
- **Transport**: WebSocket on port 7890
- **Coordination**: Alex handles all agent routing
- **Communication**: Silent background operation
- **Response Format**: Clean agent messages only

---

## **Troubleshooting Startup Issues**

### **Quick Start Commands**

```bash
# ✅ RECOMMENDED: Simple unified startup
bin/paired-start

# ✅ Alternative: Direct script access
~/.paired/scripts/start-agents.sh --auto

# ❌ AVOID: Complex scripts (may fail)
# activate_cascade_complete.sh  # Use simple methods above instead
```

### **If Agents Don't Respond:**
```bash
./scripts/paired-doctor.sh
./scripts/start-agents.sh --auto
```

---

## **Manual Startup (Fallback)**

```bash
# 1. Start the bridge
./scripts/activate_cascade_complete.sh

# 2. Start all agents  
./scripts/start-agents.sh --auto

# 3. Verify connection
./scripts/bridge-status.sh
```

---

## **Communication Standards**

### **Agent Response Format:**
```
🎨 Maya (UX): [Response content]
```

### **Background Operation:**
- All WebSocket communication happens silently
- No raw Node.js commands visible to user
- Clean agent responses only
- Technical details hidden

---

## **Success Indicators:**
- ✅ Bridge running on port 7890
- ✅ All 7 agents responding
- ✅ Clean formatted responses
- ✅ No technical command output
- ✅ Seamless user experience
