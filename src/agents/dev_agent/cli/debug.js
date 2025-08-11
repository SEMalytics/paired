#!/usr/bin/env node
/**
 * Dev Agent Debugging Assistant CLI Tool
 * Provides command-line interface for debugging support and session management
 */

const fs = require('fs');
const path = require('path');

// Get project paths
const projectRoot = path.resolve(__dirname, '../../../..');
const devAgentDir = path.resolve(__dirname, '..');
const trackingDir = path.join(devAgentDir, 'tracking');
const debugSessionsFile = path.join(trackingDir, 'debug_sessions.md');

// Ensure tracking directory exists
if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir, { recursive: true });
}

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function generateSessionId() {
    return `DEBUG-${Date.now().toString(36).toUpperCase()}`;
}

// Debug session management functions
function readDebugSessions() {
    if (!fs.existsSync(debugSessionsFile)) {
        return {
            lastUpdated: getCurrentTimestamp(),
            sessions: []
        };
    }
    
    try {
        const content = fs.readFileSync(debugSessionsFile, 'utf8');
        const sessions = [];
        
        // Parse existing sessions from markdown
        const sessionMatches = content.match(/## Debug Session: (.+?)\n([\s\S]*?)(?=\n## Debug Session:|$)/g);
        if (sessionMatches) {
            sessionMatches.forEach(match => {
                const lines = match.split('\n');
                const title = lines[0].replace('## Debug Session: ', '');
                
                const session = {
                    id: '',
                    title: title,
                    status: 'investigating',
                    priority: 'medium',
                    created: getCurrentTimestamp(),
                    updated: getCurrentTimestamp(),
                    description: '',
                    symptoms: [],
                    hypotheses: [],
                    investigation_steps: [],
                    findings: [],
                    solution: '',
                    verification_steps: []
                };
                
                // Parse session details
                lines.forEach(line => {
                    if (line.startsWith('- **ID:**')) session.id = line.replace('- **ID:**', '').trim();
                    if (line.startsWith('- **Status:**')) session.status = line.replace('- **Status:**', '').trim();
                    if (line.startsWith('- **Priority:**')) session.priority = line.replace('- **Priority:**', '').trim();
                    if (line.startsWith('- **Created:**')) session.created = line.replace('- **Created:**', '').trim();
                    if (line.startsWith('- **Updated:**')) session.updated = line.replace('- **Updated:**', '').trim();
                    if (line.startsWith('- **Description:**')) session.description = line.replace('- **Description:**', '').trim();
                    if (line.startsWith('- **Solution:**')) session.solution = line.replace('- **Solution:**', '').trim();
                });
                
                sessions.push(session);
            });
        }
        
        return {
            lastUpdated: getCurrentTimestamp(),
            sessions: sessions
        };
    } catch (error) {
        console.error(colorize(`Error reading debug sessions: ${error.message}`, 'red'));
        return {
            lastUpdated: getCurrentTimestamp(),
            sessions: []
        };
    }
}

function writeDebugSessions(data) {
    try {
        let content = `# Debug Sessions Tracking\n\n`;
        content += `**Last Updated:** ${data.lastUpdated}\n\n`;
        content += `**Total Sessions:** ${data.sessions.length}\n`;
        content += `**Active Sessions:** ${data.sessions.filter(s => s.status === 'investigating').length}\n`;
        content += `**Resolved Sessions:** ${data.sessions.filter(s => s.status === 'resolved').length}\n\n`;
        
        if (data.sessions.length === 0) {
            content += `*No debug sessions tracked yet. Use 'dev-debug-start' to create your first session.*\n`;
        } else {
            data.sessions.forEach(session => {
                content += `## Debug Session: ${session.title}\n\n`;
                content += `- **ID:** ${session.id}\n`;
                content += `- **Status:** ${session.status}\n`;
                content += `- **Priority:** ${session.priority}\n`;
                content += `- **Created:** ${session.created}\n`;
                content += `- **Updated:** ${session.updated}\n`;
                content += `- **Description:** ${session.description}\n\n`;
                
                if (session.symptoms.length > 0) {
                    content += `### Symptoms:\n`;
                    session.symptoms.forEach(symptom => {
                        content += `  - ${symptom}\n`;
                    });
                    content += `\n`;
                }
                
                if (session.hypotheses.length > 0) {
                    content += `### Hypotheses:\n`;
                    session.hypotheses.forEach(hypothesis => {
                        content += `  - ${hypothesis}\n`;
                    });
                    content += `\n`;
                }
                
                if (session.investigation_steps.length > 0) {
                    content += `### Investigation Steps:\n`;
                    session.investigation_steps.forEach(step => {
                        content += `  - ${step}\n`;
                    });
                    content += `\n`;
                }
                
                if (session.findings.length > 0) {
                    content += `### Findings:\n`;
                    session.findings.forEach(finding => {
                        content += `  - ${finding}\n`;
                    });
                    content += `\n`;
                }
                
                if (session.solution) {
                    content += `### Solution:\n${session.solution}\n\n`;
                }
                
                if (session.verification_steps.length > 0) {
                    content += `### Verification Steps:\n`;
                    session.verification_steps.forEach(step => {
                        content += `  - ${step}\n`;
                    });
                    content += `\n`;
                }
                
                content += `---\n\n`;
            });
        }
        
        fs.writeFileSync(debugSessionsFile, content);
        return true;
    } catch (error) {
        console.error(colorize(`Error writing debug sessions: ${error.message}`, 'red'));
        return false;
    }
}

function startDebugSession(issue, description = '', priority = 'medium') {
    const data = readDebugSessions();
    
    const newSession = {
        id: generateSessionId(),
        title: issue,
        status: 'investigating',
        priority: priority,
        created: getCurrentTimestamp(),
        updated: getCurrentTimestamp(),
        description: description,
        symptoms: [],
        hypotheses: [],
        investigation_steps: [],
        findings: [],
        solution: '',
        verification_steps: []
    };
    
    data.sessions.push(newSession);
    data.lastUpdated = getCurrentTimestamp();
    
    if (writeDebugSessions(data)) {
        console.log(colorize(`✅ Debug session started successfully!`, 'green'));
        console.log(colorize(`🐛 ID: ${newSession.id}`, 'blue'));
        console.log(colorize(`📝 Issue: ${newSession.title}`, 'blue'));
        console.log(colorize(`🎯 Priority: ${newSession.priority}`, 'blue'));
        
        // Provide initial debugging guidance
        console.log('');
        console.log(colorize(`🔍 Next Steps:`, 'yellow'));
        console.log(colorize(`  1. Document symptoms and error messages`, 'white'));
        console.log(colorize(`  2. Form hypotheses about potential causes`, 'white'));
        console.log(colorize(`  3. Plan investigation steps`, 'white'));
        console.log(colorize(`  4. Execute debugging plan`, 'white'));
        
        return newSession;
    } else {
        console.error(colorize(`❌ Failed to start debug session`, 'red'));
        return null;
    }
}

function listDebugSessions(statusFilter = null) {
    const data = readDebugSessions();
    
    if (data.sessions.length === 0) {
        console.log(colorize(`🐛 No debug sessions found. Start your first session with 'dev-debug-start <issue>'`, 'yellow'));
        return;
    }
    
    let sessions = data.sessions;
    if (statusFilter) {
        sessions = sessions.filter(s => s.status === statusFilter);
    }
    
    console.log(colorize(`🐛 Debug Sessions (${sessions.length} total):`, 'blue'));
    console.log('');
    
    sessions.forEach(session => {
        const statusIcon = {
            'investigating': '🔍',
            'analyzing': '🧐',
            'fixing': '🔧',
            'testing': '🧪',
            'resolved': '✅',
            'stuck': '🚫'
        }[session.status] || '❓';
        
        const priorityColor = {
            'critical': 'red',
            'high': 'red',
            'medium': 'yellow',
            'low': 'green'
        }[session.priority] || 'white';
        
        console.log(colorize(`${statusIcon} ${session.title}`, 'white'));
        console.log(colorize(`   ID: ${session.id}`, 'cyan'));
        console.log(colorize(`   Status: ${session.status}`, 'white'));
        console.log(colorize(`   Priority: ${session.priority}`, priorityColor));
        console.log(colorize(`   Created: ${new Date(session.created).toLocaleDateString()}`, 'white'));
        
        if (session.symptoms.length > 0) {
            console.log(colorize(`   Symptoms: ${session.symptoms.length} documented`, 'white'));
        }
        
        if (session.hypotheses.length > 0) {
            console.log(colorize(`   Hypotheses: ${session.hypotheses.length} formed`, 'white'));
        }
        
        if (session.solution) {
            console.log(colorize(`   ✅ Solution documented`, 'green'));
        }
        
        console.log('');
    });
}

function analyzeDebugIssue(sessionId = null) {
    const data = readDebugSessions();
    
    let session;
    if (sessionId) {
        session = data.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(colorize(`❌ Debug session not found: ${sessionId}`, 'red'));
            return false;
        }
    } else {
        // Find the most recent active session
        session = data.sessions
            .filter(s => s.status === 'investigating' || s.status === 'analyzing')
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))[0];
        
        if (!session) {
            console.error(colorize(`❌ No active debug session found`, 'red'));
            console.log(colorize(`Start a session with: dev-debug-start <issue>`, 'yellow'));
            return false;
        }
    }
    
    console.log(colorize(`🧐 Analyzing debug session: ${session.title}`, 'blue'));
    console.log('');
    
    // Provide debugging analysis framework
    console.log(colorize(`🔍 Debug Analysis Framework:`, 'yellow'));
    console.log('');
    
    console.log(colorize(`1. Problem Definition:`, 'cyan'));
    console.log(colorize(`   - What exactly is happening?`, 'white'));
    console.log(colorize(`   - When does it occur?`, 'white'));
    console.log(colorize(`   - What are the symptoms?`, 'white'));
    console.log('');
    
    console.log(colorize(`2. Environment Analysis:`, 'cyan'));
    console.log(colorize(`   - What changed recently?`, 'white'));
    console.log(colorize(`   - What's the execution context?`, 'white'));
    console.log(colorize(`   - Are there external dependencies?`, 'white'));
    console.log('');
    
    console.log(colorize(`3. Hypothesis Formation:`, 'cyan'));
    console.log(colorize(`   - What could cause this behavior?`, 'white'));
    console.log(colorize(`   - Which hypothesis is most likely?`, 'white'));
    console.log(colorize(`   - How can we test each hypothesis?`, 'white'));
    console.log('');
    
    console.log(colorize(`4. Investigation Plan:`, 'cyan'));
    console.log(colorize(`   - Add logging/debugging statements`, 'white'));
    console.log(colorize(`   - Check error logs and stack traces`, 'white'));
    console.log(colorize(`   - Isolate the problem area`, 'white'));
    console.log(colorize(`   - Test with minimal reproduction case`, 'white'));
    console.log('');
    
    // Update session status
    session.status = 'analyzing';
    session.updated = getCurrentTimestamp();
    data.lastUpdated = getCurrentTimestamp();
    
    writeDebugSessions(data);
    
    return true;
}

function implementDebugFix(sessionId = null, solution = '') {
    const data = readDebugSessions();
    
    let session;
    if (sessionId) {
        session = data.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(colorize(`❌ Debug session not found: ${sessionId}`, 'red'));
            return false;
        }
    } else {
        // Find the most recent session being analyzed
        session = data.sessions
            .filter(s => s.status === 'analyzing' || s.status === 'investigating')
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))[0];
        
        if (!session) {
            console.error(colorize(`❌ No active debug session found`, 'red'));
            return false;
        }
    }
    
    console.log(colorize(`🔧 Implementing fix for: ${session.title}`, 'blue'));
    
    if (solution) {
        session.solution = solution;
    }
    
    session.status = 'fixing';
    session.updated = getCurrentTimestamp();
    data.lastUpdated = getCurrentTimestamp();
    
    // Provide fix implementation guidance
    console.log('');
    console.log(colorize(`🛠️ Fix Implementation Checklist:`, 'yellow'));
    console.log(colorize(`  ☐ Implement the solution`, 'white'));
    console.log(colorize(`  ☐ Add error handling`, 'white'));
    console.log(colorize(`  ☐ Update documentation`, 'white'));
    console.log(colorize(`  ☐ Add/update tests`, 'white'));
    console.log(colorize(`  ☐ Test the fix thoroughly`, 'white'));
    console.log('');
    
    if (writeDebugSessions(data)) {
        console.log(colorize(`✅ Debug session updated to fixing status`, 'green'));
        return true;
    } else {
        console.error(colorize(`❌ Failed to update debug session`, 'red'));
        return false;
    }
}

function verifyDebugFix(sessionId = null) {
    const data = readDebugSessions();
    
    let session;
    if (sessionId) {
        session = data.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(colorize(`❌ Debug session not found: ${sessionId}`, 'red'));
            return false;
        }
    } else {
        // Find the most recent session being fixed
        session = data.sessions
            .filter(s => s.status === 'fixing')
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))[0];
        
        if (!session) {
            console.error(colorize(`❌ No debug session in fixing status found`, 'red'));
            return false;
        }
    }
    
    console.log(colorize(`🧪 Verifying fix for: ${session.title}`, 'blue'));
    
    session.status = 'testing';
    session.updated = getCurrentTimestamp();
    data.lastUpdated = getCurrentTimestamp();
    
    // Provide verification guidance
    console.log('');
    console.log(colorize(`✅ Fix Verification Checklist:`, 'yellow'));
    console.log(colorize(`  ☐ Original issue is resolved`, 'white'));
    console.log(colorize(`  ☐ No new issues introduced`, 'white'));
    console.log(colorize(`  ☐ All tests pass`, 'white'));
    console.log(colorize(`  ☐ Edge cases handled`, 'white'));
    console.log(colorize(`  ☐ Performance not degraded`, 'white'));
    console.log('');
    
    console.log(colorize(`🎯 Next Steps:`, 'cyan'));
    console.log(colorize(`  1. Run comprehensive tests`, 'white'));
    console.log(colorize(`  2. Test in different environments`, 'white'));
    console.log(colorize(`  3. Verify with original reproduction case`, 'white'));
    console.log(colorize(`  4. Mark as resolved if verification passes`, 'white'));
    
    if (writeDebugSessions(data)) {
        console.log(colorize(`✅ Debug session updated to testing status`, 'green'));
        return true;
    } else {
        console.error(colorize(`❌ Failed to update debug session`, 'red'));
        return false;
    }
}

function resolveDebugSession(sessionId) {
    const data = readDebugSessions();
    const session = data.sessions.find(s => s.id === sessionId);
    
    if (!session) {
        console.error(colorize(`❌ Debug session not found: ${sessionId}`, 'red'));
        return false;
    }
    
    session.status = 'resolved';
    session.updated = getCurrentTimestamp();
    data.lastUpdated = getCurrentTimestamp();
    
    if (writeDebugSessions(data)) {
        console.log(colorize(`✅ Debug session resolved!`, 'green'));
        console.log(colorize(`🎉 Issue: ${session.title}`, 'blue'));
        
        if (session.solution) {
            console.log(colorize(`💡 Solution: ${session.solution}`, 'cyan'));
        }
        
        return true;
    } else {
        console.error(colorize(`❌ Failed to resolve debug session`, 'red'));
        return false;
    }
}

function showHelp() {
    console.log(colorize(`🐛 Dev Agent Debugging Assistant CLI`, 'blue'));
    console.log('');
    console.log(colorize(`Usage: node debug.js <command> [options]`, 'white'));
    console.log('');
    console.log(colorize(`Commands:`, 'yellow'));
    console.log(colorize(`  start <issue> [description] [priority]  - Start new debug session`, 'white'));
    console.log(colorize(`  list [status]                          - List debug sessions`, 'white'));
    console.log(colorize(`  analyze [session_id]                   - Analyze debug issue`, 'white'));
    console.log(colorize(`  fix [session_id] [solution]            - Implement debug fix`, 'white'));
    console.log(colorize(`  verify [session_id]                    - Verify debug fix`, 'white'));
    console.log(colorize(`  resolve <session_id>                   - Mark session as resolved`, 'white'));
    console.log(colorize(`  help                                   - Show this help`, 'white'));
    console.log('');
    console.log(colorize(`Examples:`, 'yellow'));
    console.log(colorize(`  node debug.js start "Login not working" "Users can't authenticate" high`, 'cyan'));
    console.log(colorize(`  node debug.js list investigating`, 'cyan'));
    console.log(colorize(`  node debug.js analyze DEBUG-ABC123`, 'cyan'));
    console.log(colorize(`  node debug.js resolve DEBUG-ABC123`, 'cyan'));
}

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'start':
        const issue = args[1];
        const description = args[2] || '';
        const priority = args[3] || 'medium';
        
        if (!issue) {
            console.error(colorize(`❌ Issue description is required`, 'red'));
            console.log(colorize(`Usage: node debug.js start <issue> [description] [priority]`, 'yellow'));
            process.exit(1);
        }
        
        startDebugSession(issue, description, priority);
        break;
        
    case 'list':
        const statusFilter = args[1];
        listDebugSessions(statusFilter);
        break;
        
    case 'analyze':
        const analyzeSessionId = args[1];
        analyzeDebugIssue(analyzeSessionId);
        break;
        
    case 'fix':
        const fixSessionId = args[1];
        const solution = args[2] || '';
        implementDebugFix(fixSessionId, solution);
        break;
        
    case 'verify':
        const verifySessionId = args[1];
        verifyDebugFix(verifySessionId);
        break;
        
    case 'resolve':
        const resolveSessionId = args[1];
        if (!resolveSessionId) {
            console.error(colorize(`❌ Session ID is required`, 'red'));
            console.log(colorize(`Usage: node debug.js resolve <session_id>`, 'yellow'));
            process.exit(1);
        }
        resolveDebugSession(resolveSessionId);
        break;
        
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;
        
    default:
        if (command) {
            console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
        }
        showHelp();
        process.exit(1);
}
