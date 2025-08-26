/**
 * Agent Response Relay Utility
 * Handles formatting and relaying agent responses through the bridge system
 * Used by Claude IDE Bridge and other components
 */

const { EventEmitter } = require('events');

class AgentResponseRelay extends EventEmitter {
  constructor(options = {}) {
    super();
    this.bridgePort = options.bridgePort || 7890;
    this.bridgeHost = options.bridgeHost || 'localhost';
    this.timeout = options.timeout || 3000;
  }

  /**
   * Format agent response for display
   * @param {Object} response - Raw agent response
   * @returns {string} - Formatted response
   */
  formatResponse(response) {
    if (!response) return 'No response received';

    // Handle different response formats
    if (response.type === 'alex_response' || response.agent) {
      const emoji = response.emoji || '🤖';
      const name = response.name || response.agent || 'Agent';
      const content = response.content || response.message || 'No content';
      return `${emoji} ${name}: ${content}`;
    }

    // Handle raw content
    if (response.content) {
      return response.content;
    }

    // Handle message field
    if (response.message) {
      return response.message;
    }

    // Fallback to JSON string
    return JSON.stringify(response);
  }

  /**
   * Relay message to agent and format response
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @param {Object} context - Additional context
   * @returns {Promise<string>} - Formatted response
   */
  async relayToAgent(agentName, message, context = {}) {
    try {
      const { sendToAgent } = require('../bridge_communication');
      const response = await sendToAgent(agentName, message, context.projectPath);
      return this.formatResponse(response);
    } catch (error) {
      return `❌ Error communicating with ${agentName}: ${error.message}`;
    }
  }

  /**
   * Relay message to Alex (PM) for coordination
   * @param {string} message - Message to send
   * @param {Object} context - Additional context
   * @returns {Promise<string>} - Formatted response
   */
  async relayToAlex(message, context = {}) {
    return this.relayToAgent('alex', message, context);
  }

  /**
   * Test bridge connectivity
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const { testConnection } = require('../bridge_communication');
      return await testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * Emit formatted response event
   * @param {Object} response - Raw response
   * @param {string} agentName - Source agent name
   */
  emitResponse(response, agentName) {
    const formatted = this.formatResponse(response);
    this.emit('agent_response', {
      agent: agentName,
      formatted: formatted,
      raw: response
    });
  }
}

module.exports = AgentResponseRelay;
