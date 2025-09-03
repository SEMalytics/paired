#!/usr/bin/env node

/**
 * Claude Agent Relay - Windsurf Integration
 *
 * This module provides clean agent communication for Windsurf without exposing
 * the underlying bridge mechanics to users.
 */

const http = require('http');

class CascadeAgentRelay {
  constructor(options = {}) {
    this.bridgePort = options.bridgePort || 7890;
    this.bridgeHost = options.bridgeHost || 'localhost';
    this.timeout = options.timeout || 3000;
    this.projectPath = options.projectPath || process.cwd();
  }

  /**
     * Send message to agent and return clean response
     * All messages route through Alex (PM) first, who delegates to specialists
     */
  async sendToAgent(agentName, message, instanceId = 'windsurf-cascade') {
    try {
      const requestData = {
        instanceId,
        message: message, // Let Alex handle routing - don't specify agent directly
        type: 'user_request',
        projectPath: this.projectPath
      };

      const response = await this.makeRequest('/cascade-intercept', 'POST', requestData);

      // Parse and format response cleanly
      if (response && response.type === 'specialist_response') {
        // Handle specialist delegation responses
        let output = '';
        if (response.primary) {
          const p = response.primary;
          output += `${p.emoji} **${p.name}**: ${p.content}\n`;
        }
        if (response.specialist) {
          const s = response.specialist;
          output += `${s.emoji} **${s.name}**: ${s.content}`;
        }
        return output.trim();
      } else if (response && response.content) {
        const emoji = response.emoji || '🤖';
        const name = response.name || agentName || 'Agent';
        return `${emoji} **${name}**: ${response.content}`;
      } else if (response && response.response) {
        return response.response;
      } else {
        return `Agent ${agentName} responded but format was unclear`;
      }

    } catch (error) {
      return `❌ Could not reach ${agentName}: ${error.message}`;
    }
  }

  /**
     * Make HTTP request to bridge (internal method)
     */
  makeRequest(path, method = 'POST', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.bridgeHost,
        port: this.bridgePort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = body ? JSON.parse(body) : {};
            resolve(response);
          } catch (error) {
            resolve({ response: body });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  /**
     * Quick access methods for common agents
     * All route through Alex (PM) who coordinates and delegates
     */
  async alex(message) { return this.sendToAgent(null, message); }
  async sherlock(message) { return this.sendToAgent(null, `I need Sherlock's QA expertise: ${message}`); }
  async edison(message) { return this.sendToAgent(null, `I need Edison's development help: ${message}`); }
  async leonardo(message) { return this.sendToAgent(null, `I need Leonardo's architecture guidance: ${message}`); }
  async maya(message) { return this.sendToAgent(null, `I need Maya's UX expertise: ${message}`); }
  async vince(message) { return this.sendToAgent(null, `I need Vince's process management: ${message}`); }
  async marie(message) { return this.sendToAgent(null, `I need Marie's data analysis: ${message}`); }
}

// Global instance for Cascade to use
const relay = new CascadeAgentRelay({
  projectPath: process.env.PWD || process.cwd()
});

module.exports = { CascadeAgentRelay, relay };
