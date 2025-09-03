/**
 * CASCADE Startup Handler
 * 
 * Provides initialization and startup functionality for CASCADE integration
 * with PAIRED agents and bridge communication.
 */

const path = require('path');
const fs = require('fs');

class CascadeStartupHandler {
  constructor() {
    this.version = '1.0.0';
    this.initialized = false;
    this.bridgeConnected = false;
  }

  /**
   * Initialize CASCADE startup handler
   */
  async initialize() {
    console.log('🚀 PAIRED CASCADE startup handler initializing...');
    
    try {
      // Check if bridge is available
      await this.checkBridgeHealth();
      
      // Initialize agent communication
      this.setupAgentCommunication();
      
      this.initialized = true;
      console.log('✅ CASCADE startup handler initialized successfully');
      
      return {
        success: true,
        version: this.version,
        bridgeConnected: this.bridgeConnected
      };
    } catch (error) {
      console.error('❌ CASCADE startup handler initialization failed:', error.message);
      return {
        success: false,
        error: error.message,
        version: this.version
      };
    }
  }

  /**
   * Check bridge health and connectivity via WebSocket
   */
  async checkBridgeHealth() {
    try {
      const WebSocket = require('ws');
      
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:7890');
        
        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'HEALTH_CHECK' }));
        });
        
        ws.on('message', (data) => {
          try {
            const health = JSON.parse(data.toString());
            if (health.status === 'active') {
              this.bridgeConnected = true;
              console.log('✅ Bridge health check passed');
              ws.close();
              resolve(health);
            } else {
              ws.close();
              reject(new Error('Bridge not active'));
            }
          } catch (parseError) {
            ws.close();
            reject(new Error('Invalid bridge response'));
          }
        });
        
        ws.on('error', (error) => {
          console.warn('⚠️  Bridge not available:', error.message);
          ws.close();
          reject(error);
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close();
            reject(new Error('Bridge health check timeout'));
          }
        }, 3000);
      });
    } catch (error) {
      console.warn('⚠️  Bridge health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup agent communication channels
   */
  setupAgentCommunication() {
    console.log('🔗 Setting up agent communication channels...');
    
    // Agent port mapping
    this.agentPorts = {
      alex: 7890,      // Uses bridge
      sherlock: 7891,
      edison: 7892,
      leonardo: 7893,
      maya: 7894,
      vince: 7895,
      marie: 7896
    };
    
    console.log('📡 Agent communication channels configured');
  }

  /**
   * Get startup handler status
   */
  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      bridgeConnected: this.bridgeConnected,
      agentPorts: this.agentPorts || {},
      timestamp: Date.now()
    };
  }

  /**
   * Shutdown handler
   */
  async shutdown() {
    console.log('🛑 CASCADE startup handler shutting down...');
    this.initialized = false;
    this.bridgeConnected = false;
    console.log('✅ CASCADE startup handler shutdown complete');
  }
}

// Create singleton instance
const startupHandler = new CascadeStartupHandler();

// Export both the class and instance for flexibility
module.exports = {
  CascadeStartupHandler,
  initialize: () => startupHandler.initialize(),
  getStatus: () => startupHandler.getStatus(),
  shutdown: () => startupHandler.shutdown(),
  version: startupHandler.version,
  instance: startupHandler
};
