/**
 * Cascade Bridge API Integration
 * 
 * Connects the WEE agent bridge to Cascade's native agent API, enabling
 * seamless agent communication directly in the Cascade UI.
 * 
 * This module provides a clean interface for WEE agents to appear in the
 * Cascade chat UI using the proper agent formatting.
 */

const EventEmitter = require('events');

class CascadeBridgeAPI extends EventEmitter {
  constructor(options = {}) {
    super(); // Initialize EventEmitter
    this.initialized = false;
    this.connected = false;
    this.options = options;
    this.agents = {
      qa: { name: 'Sherlock (QA)', emoji: '🕵️' },
      architecture: { name: 'Leonardo (Architecture)', emoji: '🏛️' },
      dev: { name: 'Edison (Dev)', emoji: '⚡' },
      pm: { name: 'Alex (PM)', emoji: '👑' },
      ux: { name: 'Maya (UX)', emoji: '🎨' },
      scrum: { name: 'Vince (Scrum)', emoji: '🏈' },
      analyst: { name: 'Marie (Analyst)', emoji: '🔬' }
    };
  }

  /**
   * Connect to the Cascade bridge (EventEmitter-compatible method)
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) {
      return;
    }

    try {
      await this.initialize();
      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Initialize the Cascade API integration
   * @returns {Promise<boolean>} True if successful
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Check if we're in a Cascade environment
      this.inCascade = this._detectCascadeEnvironment();
      
      if (this.inCascade) {
        // Set up Cascade integration
        this._setupCascadeHooks();
        console.log('✅ Cascade API integration initialized');
      } else {
        // Fallback to console output
        console.log('⚠️ Not running in Cascade environment, using fallback');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Cascade API integration:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Detect if we're running in a Cascade environment
   * @private
   * @returns {boolean} True if in Cascade
   */
  _detectCascadeEnvironment() {
    // Check for Cascade-specific global objects or environment variables
    return (
      typeof global !== 'undefined' && 
      (global.CASCADE_API !== undefined || 
       process.env.CASCADE_ENVIRONMENT === 'true')
    );
  }

  /**
   * Set up Cascade API hooks
   * @private
   */
  _setupCascadeHooks() {
    // Register with Cascade's agent registry if available
    if (global.CASCADE_API && global.CASCADE_API.registerAgentProvider) {
      global.CASCADE_API.registerAgentProvider('wee', {
        name: 'WEE Agents',
        description: 'Windsurf Evolutionary Ecosystem Agent Team',
        getAgents: () => Object.values(this.agents),
        sendMessage: (agentId, message) => {
          // This will be called when Cascade wants to send a message to an agent
          this.onAgentMessage && this.onAgentMessage(agentId, message);
          return true;
        }
      });
    }
  }

  /**
   * Send an agent message to appear in Cascade UI
   * @param {string} agentId The agent ID (qa, architecture, etc.)
   * @param {string} message The message content
   * @returns {boolean} True if sent successfully
   */
  sendAgentMessage(agentId, message) {
    if (!this.initialized) {
      console.error('❌ Cascade API not initialized');
      return false;
    }

    const agent = this.agents[agentId];
    if (!agent) {
      console.error(`❌ Unknown agent ID: ${agentId}`);
      return false;
    }

    const messageData = {
      agentId,
      name: agent.name,
      emoji: agent.emoji,
      message,
      timestamp: Date.now()
    };

    // Emit message event for listeners
    this.emit('message', messageData);

    if (this.inCascade && global.CASCADE_API && global.CASCADE_API.receiveAgentMessage) {
      // Use Cascade's native API
      return global.CASCADE_API.receiveAgentMessage(messageData);
    } else {
      // Fallback to console output with proper formatting
      console.log(`${agent.emoji} ${agent.name}: ${message}`);
      return true;
    }
  }

  /**
   * Disconnect from the Cascade bridge
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      this.connected = false;
      this.emit('disconnected');
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Set a callback to handle messages sent to agents
   * @param {Function} callback Function(agentId, message)
   */
  setMessageHandler(callback) {
    this.onAgentMessage = callback;
  }

  /**
   * Check if we're in a Cascade environment
   * @returns {boolean} True if in Cascade
   */
  isInCascadeEnvironment() {
    return this.inCascade;
  }

  /**
   * Check if currently connected to bridge
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected;
  }
}

// Export class constructor for agent instantiation
module.exports = CascadeBridgeAPI;
