/**
 * CASCADE Configuration for PAIRED Agent Relay
 * This file tells Cascade to use the silent relay system
 */

// PAIRED Agent Communication Relay for CASCADE
// This configuration enables seamless agent communication through CASCADE chat

const path = require('path');
const fs = require('fs');

// CASCADE Onboarding Context
const CASCADE_ONBOARDING = {
  systemContext: `
CRITICAL CASCADE CONTEXT: You are now connected to a PAIRED project with 7 AI agents.

PAIRED ARCHITECTURE:
- Bridge runs on port 7890 (WebSocket hub)
- 7 agents: Alex (PM), Sherlock (QA), Edison (Dev), Leonardo (Arch), Maya (UX), Vince (Scrum), Marie (Analyst)
- .cascade_config.js intercepts agent mentions and routes through bridge
- Agents respond with real capabilities, not just chat

COMMUNICATION FLOW:
1. User mentions agent name → .cascade_config.js intercepts
2. Message sent to bridge (port 7890) 
3. Bridge routes to specific agent
4. Agent responds through bridge
5. Response formatted as: "👑 Alex (PM): [message]"

KEY BEHAVIOR CHANGES:
- When user says "Hi Alex" → Route to PAIRED Alex, don't respond as CASCADE
- Agent names trigger PAIRED routing: alex, sherlock, edison, leonardo, maya, vince, marie
- Show agent responses, not CASCADE responses
- If bridge unavailable, inform user to run 'paired-start'

NEVER pretend to BE the agents - you relay what they actually say.
`,
  
  agentNames: ['alex', 'sherlock', 'edison', 'leonardo', 'maya', 'vince', 'marie'],
  
  shouldIntercept: function(message) {
    const lowerMessage = message.toLowerCase();
    return this.agentNames.some(name => lowerMessage.includes(name)) ||
           lowerMessage.includes('team') || lowerMessage.includes('agents') ||
           lowerMessage.includes('paired team');
  }
};

// Load bridge communication modules with auto-start
let bridgeComm;
let autoStartAttempted = false;

async function ensureBridgeRunning() {
  if (bridgeComm) return bridgeComm;
  
  try {
    const startupHandler = require(path.join(process.env.HOME, '.paired', 'lib', 'startup', 'cascade-handler.js'));
    bridgeComm = require(path.join(process.env.HOME, '.paired', 'lib', 'bridge', 'communication.js'));
    return bridgeComm;
  } catch (error) {
    // Auto-start PAIRED using new startup controller if not already attempted
    if (!autoStartAttempted) {
      autoStartAttempted = true;
      console.log('🚀 PAIRED not running - auto-starting with unified controller...');
      
      const { spawn } = require('child_process');
      const startupController = path.join(process.env.HOME, '.paired', 'bin', 'startup-controller.js');
      
      try {
        const startProcess = spawn('node', [startupController, 'ensure', 'cascade'], { 
          detached: true, 
          stdio: 'ignore' 
        });
        startProcess.unref();
        
        // Wait longer for unified startup
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try loading modules again
        try {
          const startupHandler = require(path.join(process.env.HOME, '.paired', 'lib', 'startup', 'cascade-handler.js'));
          bridgeComm = require(path.join(process.env.HOME, '.paired', 'lib', 'bridge', 'communication.js'));
          console.log('✅ PAIRED auto-started successfully with unified controller');
          return bridgeComm;
        } catch (retryError) {
          console.log('⚠️ PAIRED auto-start may need more time');
        }
      } catch (startError) {
        console.log('❌ PAIRED auto-start failed:', startError.message);
      }
    }
    
    console.log('PAIRED modules not found, using fallback mode');
    return null;
  }
}

// Configure CASCADE to use agent relay
global.PAIRED_AGENT_RELAY = {
  enabled: true,
  
  // Handle agent greetings and mentions
  async handleAgentGreeting(message, projectPath) {
    const bridge = await ensureBridgeRunning();
    if (!bridge) return null; // Bridge not available
    
    const agentPatterns = {
      alex: ['alex', 'pm', 'project manager', 'coordinator', 'supreme commander'],
      sherlock: ['sherlock', 'qa', 'quality', 'detective', 'testing'],
      leonardo: ['leonardo', 'architect', 'architecture', 'design', 'system'],
      edison: ['edison', 'dev', 'developer', 'implementation', 'code'],
      maya: ['maya', 'ux', 'ui', 'user experience', 'design'],
      vince: ['vince', 'scrum', 'process', 'methodology', 'coach'],
      marie: ['marie', 'analyst', 'data', 'analysis', 'scientist']
    };
    
    const teamReferences = ['team', 'agents', 'paired team', 'my team', 'everyone'];
    const lowerMessage = message.toLowerCase();
    
    // Special handling for Alex greetings - trigger comprehensive project assessment
    if (lowerMessage.includes('hi alex') || lowerMessage.includes('hello alex') || 
        lowerMessage.includes('hey alex') || (lowerMessage.includes('hi') && lowerMessage.includes('alex'))) {
      // Send special assessment trigger to unified bridge
      const WebSocket = require('ws');
      try {
        const ws = new WebSocket('ws://localhost:7890');
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'user_request',
            instanceId: 'windsurf-cascade',
            message: 'COMPREHENSIVE_PROJECT_ASSESSMENT',
            projectPath: projectPath || process.cwd(),
            timestamp: Date.now()
          }));
        });
        
        return new Promise((resolve) => {
          ws.on('message', (data) => {
            try {
              const response = JSON.parse(data);
              ws.close();
              resolve(response.content || response.message || 'Assessment complete');
            } catch (error) {
              ws.close();
              resolve('👑 **Alex (PM)**: Assessment system ready - what\'s your priority?');
            }
          });
          
          // Timeout fallback
          setTimeout(() => {
            ws.close();
            resolve('👑 **Alex (PM)**: Assessment system ready - what\'s your priority?');
          }, 3000);
        });
      } catch (error) {
        return '👑 **Alex (PM)**: Assessment system ready - what\'s your priority?';
      }
    }
    
    // Check for specific agent mentions
    for (const [agent, patterns] of Object.entries(agentPatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          const response = await bridge.sendToAgent(agent, message, projectPath);
          return bridge.formatResponse(response);
        }
      }
    }
    
    // Check for team references - route to Alex for coordination
    for (const teamRef of teamReferences) {
      if (lowerMessage.includes(teamRef)) {
        const response = await bridge.sendToAlex(message, projectPath);
        return bridge.formatResponse(response);
      }
    }
    
    // Check for general greetings - route to Alex
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || 
        lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
      const response = await bridge.sendToAlex(message, projectPath);
      return bridge.formatResponse(response);
    }
    
    return null; // Not an agent-related message
  },
  
  // Send messages to specific agents
  async relayToAgent(agentName, message, projectPath) {
    const bridge = await ensureBridgeRunning();
    if (!bridge) return null;
    const response = await bridge.sendToAgent(agentName, message, projectPath);
    return bridge.formatResponse(response);
  },
  
  // Send messages to Alex (PM) for coordination
  async relayToAlex(message, projectPath) {
    const bridge = await ensureBridgeRunning();
    if (!bridge) return null;
    const response = await bridge.sendToAlex(message, projectPath);
    return bridge.formatResponse(response);
  }
};

// Auto-intercept Cascade agent requests
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Override console.log to intercept Cascade's agent communication attempts
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    const lowerMessage = message.toLowerCase();
    
    // Check for any agent/team references using the same patterns
    const shouldIntercept = 
      // Agent names
      lowerMessage.includes('alex') || lowerMessage.includes('sherlock') || 
      lowerMessage.includes('leonardo') || lowerMessage.includes('edison') ||
      lowerMessage.includes('maya') || lowerMessage.includes('vince') || 
      lowerMessage.includes('marie') ||
      // Roles
      lowerMessage.includes('pm') || lowerMessage.includes('qa') || 
      lowerMessage.includes('architect') || lowerMessage.includes('dev') ||
      lowerMessage.includes('ux') || lowerMessage.includes('scrum') || 
      lowerMessage.includes('analyst') ||
      // Team references
      lowerMessage.includes('team') || lowerMessage.includes('agents') ||
      lowerMessage.includes('paired team') || lowerMessage.includes('my team') ||
      // Greetings
      lowerMessage.includes('hi') || lowerMessage.includes('hello') ||
      lowerMessage.includes('hey') || lowerMessage.includes('greetings');
    
    if (shouldIntercept) {
      // Use the relay system instead
      if (global.PAIRED_AGENT_RELAY && global.PAIRED_AGENT_RELAY.enabled) {
        global.PAIRED_AGENT_RELAY.handleAgentGreeting(message, require('path').join(require('os').homedir(), '.paired'))
          .then(response => {
            if (response) {
              originalLog(response);
            } else {
              originalLog(...args); // Fallback to original
            }
          })
          .catch(err => originalLog(...args)); // Fallback on error
        return;
      }
    }
    
    // Normal console.log behavior
    originalLog(...args);
  };
}

// Export for use by CASCADE
module.exports = global.PAIRED_AGENT_RELAY;
