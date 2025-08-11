/**
 * Windsurf IDE - WEE Cascade Bridge Integration
 * 
 * This module automatically manages the WEE Cascade Bridge lifecycle
 * when Windsurf IDE starts or stops.
 * 
 * Features:
 * - Auto-start bridge service when Windsurf launches
 * - Auto-shutdown bridge service when all Windsurf instances exit
 * - Ensure agent communication is always available
 * - Direct integration with Cascade UI
 * - Graceful error handling and recovery
 */

const CascadeBridgeClient = require('./cascade_bridge_client_auto');
const CascadeBridgeAPI = require('./cascade_bridge_api');
const path = require('path');
const fs = require('fs');

class WindsurfBridgeIntegration {
  constructor() {
    this.bridgeClient = null;
    this.projectName = path.basename(process.cwd());
    this.initialized = false;
    this.cascadeApiInitialized = false;
    
    // Default agent definitions
    this.agents = [
      { name: 'Sherlock (QA)', emoji: '🕵️', id: 'qa' },
      { name: 'Leonardo (Architecture)', emoji: '🏛️', id: 'architecture' },
      { name: 'Edison (Dev)', emoji: '⚡', id: 'dev' },
      { name: 'Alex (PM)', emoji: '👑', id: 'pm' },
      { name: 'Maya (UX)', emoji: '🎨', id: 'ux' },
      { name: 'Vince (Scrum)', emoji: '🏈', id: 'scrum' },
      { name: 'Marie (Analyst)', emoji: '🔬', id: 'analyst' }
    ];
    
    // Register shutdown handler for clean exits
    this._registerProcessHandlers();
    
    console.log('✅ Windsurf Bridge Integration module loaded');
  }
  
  /**
   * Initialize the bridge integration
   * @returns {Promise<boolean>} True if initialized successfully
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }
    
    try {
      console.log('🌊 Initializing WEE Cascade Bridge Integration...');
      
      // Initialize Cascade API for UI integration
      try {
        await CascadeBridgeAPI.initialize();
        this.cascadeApiInitialized = true;
        console.log('✅ Cascade API integration initialized');
      } catch (apiError) {
        console.warn('⚠️ Failed to initialize Cascade API:', apiError);
        this.cascadeApiInitialized = false;
      }
      
      // Create bridge client (even if Cascade API is available)
      this.bridgeClient = new CascadeBridgeClient({
        projectName: this.projectName,
        debug: true
      });
      
      // Auto-start the bridge and connect
      const started = await this.bridgeClient.autoStart();
      
      if (!started) {
        console.error('❌ Failed to start bridge service');
        
        // We can still proceed if Cascade API is initialized
        if (!this.cascadeApiInitialized) {
          return false;
        }
      }
      
      // Setup event listeners
      this._setupEventListeners();
      
      this.initialized = true;
      console.log('✅ WEE Cascade Bridge Integration initialized');
      
      // Send welcome message
      setTimeout(() => {
        this._sendTeamWelcomeMessage();
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing bridge integration:', error);
      return false;
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Connection events
    this.bridgeClient.on('connected', (data) => {
      console.log(`🌊 Connected to bridge service with instance ID: ${data.instanceId}`);
    });
    
    this.bridgeClient.on('close', () => {
      console.log('🔌 Disconnected from bridge service');
    });
    
    this.bridgeClient.on('error', (error) => {
      console.error('⚠️ Bridge client error:', error.message);
    });
    
    // Agent messages
    this.bridgeClient.on('agentMessage', (message) => {
      const agent = message.agent || { name: 'Unknown', emoji: '❓' };
      console.log(`${agent.emoji} ${agent.name}: ${message.content}`);
      
      // Forward to Windsurf UI system (if applicable)
      this._forwardAgentMessage(agent, message.content);
    });
    
    // Context sharing
    this.bridgeClient.on('contextShare', (message) => {
      console.log(`📑 Received shared context: ${message.contextId}`);
    });
  }
  
  /**
   * Forward agent message to Windsurf UI
   * @param {Object} agent Agent definition
   * @param {string} content Message content
   * @private
   */
  _forwardAgentMessage(agent, content) {
    // Use Cascade API if available
    if (this.cascadeApiInitialized) {
      // Convert agent object to agentId for API
      const agentId = this.agents.find(a => a.emoji === agent.emoji)?.id || 'unknown';
      CascadeBridgeAPI.sendAgentMessage(agentId, content);
      return;
    }
    
    // Fallback to console output
    const formattedMessage = `${agent.emoji} ${agent.name}: ${content}`;
    console.log(formattedMessage);
    
    // Windsurf integration if available
    if (global.windsurf && global.windsurf.notifications) {
      global.windsurf.notifications.showAgentMessage({
        agent: agent.name,
        emoji: agent.emoji,
        message: content,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Send a team welcome message
   * @private
   */
  _sendTeamWelcomeMessage() {
    if (!this.initialized) {
      return;
    }
    
    const welcomeMessage = "👋 Hello! The WEE agent team is ready to assist you with your development tasks.";
    
    // Send from Alex (PM) as the team leader
    this.sendAgentMessage('pm', welcomeMessage);
  }
  
  /**
   * Register process handlers for clean shutdown
   * @private
   */
  _registerProcessHandlers() {
    // Handle process exit
    process.on('exit', () => {
      this.shutdown();
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('👋 Shutting down bridge integration...');
      this.shutdown();
      process.exit(0);
    });
    
    // Handle termination
    process.on('SIGTERM', () => {
      console.log('👋 Shutting down bridge integration...');
      this.shutdown();
      process.exit(0);
    });
  }
  
  /**
   * Send a message from an agent
   * @param {string} agentId Agent ID (qa, architecture, dev, etc.)
   * @param {string} message Message content
   * @param {string} targetInstanceId Target instance ID or 'all'
   * @returns {boolean} True if sent successfully
   */
  sendAgentMessage(agentId, message, targetInstanceId = 'all') {
    if (!this.initialized) {
      console.error('❌ Bridge integration not initialized');
      return false;
    }
    
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) {
      console.error(`❌ Unknown agent ID: ${agentId}`);
      return false;
    }
    
    // Send via Cascade API if available
    if (this.cascadeApiInitialized) {
      return CascadeBridgeAPI.sendAgentMessage(agentId, message);
    } else if (this.bridgeClient) {
      // Fallback to bridge client
      return this.bridgeClient.sendAgentMessage(agent, message, targetInstanceId);
    } else {
      console.error('❌ No message transport available');
      return false;
    }
  }
  
  /**
   * Share context with other instances
   * @param {string} contextId Context ID
   * @param {Object} contextData Context data
   * @param {string} summary Context summary
   * @returns {boolean} True if shared successfully
   */
  shareContext(contextId, contextData, summary = null) {
    if (!this.initialized || !this.bridgeClient) {
      console.error('❌ Bridge client not initialized');
      return false;
    }
    
    return this.bridgeClient.shareContext(contextId, contextData, summary);
  }
  
  /**
   * Get list of active instances
   * @returns {boolean} True if request sent successfully
   */
  getInstances() {
    if (!this.initialized || !this.bridgeClient) {
      console.error('❌ Bridge client not initialized');
      return false;
    }
    
    return this.bridgeClient.getInstances();
  }
  
  /**
   * Shutdown the integration and bridge client
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this.bridgeClient) {
      await this.bridgeClient.autoShutdown();
      this.bridgeClient = null;
    }
    
    this.initialized = false;
    console.log('👋 Windsurf Bridge Integration shutdown complete');
  }
}

// Create singleton instance
const windsurfBridgeIntegration = new WindsurfBridgeIntegration();

module.exports = windsurfBridgeIntegration;
