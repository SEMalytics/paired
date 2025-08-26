/**
 * Unified Bridge Communication Module
 * Uses CLI cleanup utility for reliable timeout handling
 * Replaces ad-hoc curl and manual HTTP methods
 */

const http = require('http');
const { wrapPromiseWithTimeout } = require('./cli_cleanup');

class BridgeCommunication {
  constructor(host = 'localhost', port = 7890) {
    this.host = host;
    this.port = port;
    this.defaultTimeout = 3000;
  }

  /**
   * Send message to CASCADE bridge with automatic timeout handling
   * @param {Object} message - Message object to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} - Bridge response
   */
  async sendMessage(message, timeout = this.defaultTimeout) {
    const data = JSON.stringify(message);
    
    const requestPromise = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.host,
        port: this.port,
        path: '/cascade-intercept',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            // Clean the response body before parsing
            const cleanBody = body.trim().replace(/\n/g, '').replace(/\r/g, '');
            if (cleanBody) {
              const response = JSON.parse(cleanBody);
              resolve(response);
            } else {
              resolve({ content: 'Empty response', raw: true });
            }
          } catch (err) {
            // If JSON parsing fails, return the raw body for debugging
            resolve({ content: body, raw: true, error: err.message });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(data);
      req.end();
    });

    return wrapPromiseWithTimeout(
      requestPromise, 
      timeout, 
      `Bridge communication timeout after ${timeout}ms`
    );
  }

  /**
   * Send user request to specific agent
   * @param {string} agentName - Target agent name
   * @param {string} message - Message content
   * @param {string} projectPath - Project path context
   * @returns {Promise<Object>} - Agent response
   */
  async sendToAgent(agentName, message, projectPath = process.cwd()) {
    return this.sendMessage({
      instanceId: `windsurf-${agentName}-${Date.now()}`,
      message: message,
      type: 'user_request',
      projectPath: projectPath,
      targetAgent: agentName
    });
  }

  /**
   * Send general request to Alex (PM) for coordination
   * @param {string} message - Message content
   * @param {string} projectPath - Project path context
   * @returns {Promise<Object>} - Alex response
   */
  async sendToAlex(message, projectPath = process.cwd()) {
    return this.sendToAgent('alex', message, projectPath);
  }

  /**
   * Test bridge connectivity
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await this.sendMessage({
        instanceId: 'bridge-test',
        message: 'Bridge connectivity test',
        type: 'ping'
      }, 1000);
      return !!response;
    } catch (err) {
      return false;
    }
  }

  /**
   * Format agent response for user display
   * @param {Object} response - Raw bridge response
   * @returns {string} - Formatted response
   */
  formatAgentResponse(response) {
    // Handle error responses
    if (response.error || response.raw) {
      if (response.content && response.content.includes('Alex (PM)')) {
        // Extract clean agent response from raw content
        const lines = response.content.split('\n');
        for (const line of lines) {
          if (line.includes('Alex (PM):') || line.includes('👑 Alex:')) {
            return line.trim();
          }
        }
      }
      return 'Bridge communication error - please try again';
    }

    // Handle structured responses
    if (response.type === 'alex_response' || response.agent) {
      const emoji = response.emoji || '🤖';
      const name = response.name || response.agent || 'Agent';
      const content = response.content || response.message || 'No response';
      return `${emoji} ${name}: ${content}`;
    }

    // Handle specialist responses
    if (response.type === 'specialist_response' && response.primary) {
      const emoji = response.primary.emoji || '👑';
      const name = response.primary.name || 'Alex (PM)';
      const content = response.primary.content || 'No response';
      return `${emoji} ${name}: ${content}`;
    }

    return response.content || response.message || 'No response available';
  }
}

// Export singleton instance and class
const bridgeComm = new BridgeCommunication();

module.exports = {
  BridgeCommunication,
  sendMessage: (message, timeout) => bridgeComm.sendMessage(message, timeout),
  sendToAgent: (agent, message, path) => bridgeComm.sendToAgent(agent, message, path),
  sendToAlex: (message, path) => bridgeComm.sendToAlex(message, path),
  testConnection: () => bridgeComm.testConnection(),
  formatResponse: (response) => bridgeComm.formatAgentResponse(response)
};
