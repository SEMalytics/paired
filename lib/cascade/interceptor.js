#!/usr/bin/env node

/**
 * Windsurf Agent Interceptor
 * 
 * This module hooks into Windsurf/Cascade to intercept agent mentions
 * and route them through the PAIRED WebSocket bridge instead of 
 * letting Cascade respond generically.
 */

const path = require('path');

class WindsurfAgentInterceptor {
  constructor() {
    this.bridgeComm = null;
    this.initialized = false;
    this.agentPatterns = {
      alex: ['alex', 'pm', 'project manager', 'coordinator', 'supreme commander'],
      sherlock: ['sherlock', 'qa', 'quality', 'detective', 'testing'],
      leonardo: ['leonardo', 'architect', 'architecture', 'design', 'system'],
      edison: ['edison', 'dev', 'developer', 'implementation', 'code'],
      maya: ['maya', 'ux', 'ui', 'user experience', 'design'],
      vince: ['vince', 'scrum', 'process', 'methodology', 'coach'],
      marie: ['marie', 'analyst', 'data', 'analysis', 'scientist']
    };
  }

  /**
   * Initialize the interceptor and load bridge communication
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      // Load bridge communication module
      const bridgeCommPath = path.join(process.env.HOME, '.paired', 'lib', 'bridge', 'communication.js');
      this.bridgeComm = require(bridgeCommPath);
      
      // Test bridge connectivity
      const isConnected = await this.bridgeComm.testConnection();
      if (!isConnected) {
        console.log('⚠️ PAIRED bridge not available - agent routing disabled');
        return false;
      }

      this.initialized = true;
      console.log('✅ Windsurf agent interceptor initialized');
      return true;
    } catch (error) {
      console.log('⚠️ Could not initialize agent interceptor:', error.message);
      return false;
    }
  }

  /**
   * Check if message should be intercepted and routed to agents
   */
  shouldIntercept(message) {
    if (!message || typeof message !== 'string') return false;
    
    const lowerMessage = message.toLowerCase();
    
    // Check for agent name mentions
    for (const [agent, patterns] of Object.entries(this.agentPatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          return { shouldIntercept: true, targetAgent: agent };
        }
      }
    }
    
    // Check for team references
    const teamReferences = ['team', 'agents', 'paired team', 'my team', 'everyone'];
    for (const teamRef of teamReferences) {
      if (lowerMessage.includes(teamRef)) {
        return { shouldIntercept: true, targetAgent: 'alex' }; // Route to Alex for coordination
      }
    }
    
    // Check for greetings that should go to Alex
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || 
        lowerMessage.includes('hey') || lowerMessage.includes('greetings')) {
      return { shouldIntercept: true, targetAgent: 'alex' };
    }
    
    return { shouldIntercept: false };
  }

  /**
   * Intercept and route message to appropriate agent
   */
  async interceptMessage(message, projectPath = process.cwd()) {
    if (!this.initialized) {
      const initSuccess = await this.initialize();
      if (!initSuccess) return null;
    }

    const { shouldIntercept, targetAgent } = this.shouldIntercept(message);
    if (!shouldIntercept) return null;

    try {
      const response = await this.bridgeComm.sendToAgent(targetAgent, message, projectPath);
      return this.bridgeComm.formatResponse(response);
    } catch (error) {
      console.error('Agent routing error:', error.message);
      return `❌ Could not reach ${targetAgent} - bridge may be down`;
    }
  }
}

// Create singleton instance
const interceptor = new WindsurfAgentInterceptor();

// Hook into global console to intercept Cascade's output
const originalConsoleLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  
  // Only intercept if this looks like a user message to agents
  if (message && typeof message === 'string' && message.length > 0) {
    const { shouldIntercept } = interceptor.shouldIntercept(message);
    
    if (shouldIntercept) {
      // Intercept and route through PAIRED bridge
      interceptor.interceptMessage(message)
        .then(agentResponse => {
          if (agentResponse) {
            originalConsoleLog(agentResponse);
          } else {
            originalConsoleLog(...args); // Fallback to original
          }
        })
        .catch(() => originalConsoleLog(...args)); // Fallback on error
      return;
    }
  }
  
  // Normal console.log behavior
  originalConsoleLog(...args);
};

module.exports = {
  WindsurfAgentInterceptor,
  interceptor,
  initialize: () => interceptor.initialize(),
  intercept: (message, projectPath) => interceptor.interceptMessage(message, projectPath)
};
