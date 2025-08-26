/**
 * CASCADE Configuration for PAIRED Agent Relay
 * This file tells Cascade to use the silent relay system for agent communication
 * Automatically activates bridge communication for seamless startup
 */

// Import bridge communication system
let bridgeComm = null;
try {
  const { sendToAgent, sendToAlex, formatResponse } = require('./shared/bridge_communication');
  bridgeComm = { sendToAgent, sendToAlex, formatResponse };
} catch (error) {
  console.error('Bridge communication not available:', error.message);
  bridgeComm = null;
}

// Configure CASCADE to use agent relay
global.PAIRED_AGENT_RELAY = {
  enabled: true,
  
  // Handle agent greetings and mentions
  async handleAgentGreeting(message, projectPath) {
    if (!bridgeComm) return null; // Bridge not available
    
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
    
    // Check for specific agent mentions
    for (const [agent, patterns] of Object.entries(agentPatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          const response = await bridgeComm.sendToAgent(agent, message, projectPath);
          return bridgeComm.formatResponse(response);
        }
      }
    }
    
    // Check for team references - route to Alex for coordination
    for (const teamRef of teamReferences) {
      if (lowerMessage.includes(teamRef)) {
        const response = await bridgeComm.sendToAlex(message, projectPath);
        return bridgeComm.formatResponse(response);
      }
    }
    
    // Check for general greetings - route to Alex
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || 
        lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
      const response = await bridgeComm.sendToAlex(message, projectPath);
      return bridgeComm.formatResponse(response);
    }
    
    return null; // Not an agent-related message
  },
  
  // Send messages to specific agents
  async relayToAgent(agentName, message, projectPath) {
    if (!bridgeComm) return null;
    const response = await bridgeComm.sendToAgent(agentName, message, projectPath);
    return bridgeComm.formatResponse(response);
  },
  
  // Send messages to Alex (PM) for coordination
  async relayToAlex(message, projectPath) {
    if (!bridgeComm) return null;
    const response = await bridgeComm.sendToAlex(message, projectPath);
    return bridgeComm.formatResponse(response);
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
        global.PAIRED_AGENT_RELAY.handleAgentGreeting(message, process.cwd())
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
