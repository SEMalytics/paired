/**
 * Enhanced PAIRED Agent Factory
 * 
 * Creates individual agent servers on separate ports for direct communication
 * while maintaining unified bridge coordination through Alex.
 */

const http = require('http');
const AgentFactory = require('./agent_factory');

class EnhancedAgentFactory extends AgentFactory {
  constructor(orchestrator) {
    super(orchestrator);
    
    this.agentServers = new Map();
    this.agentPorts = {
      'alex': 7890,      // Alex coordinates through unified bridge
      'sherlock': 7891,
      'edison': 7892,
      'leonardo': 7893,
      'maya': 7894,
      'vince': 7895,
      'marie': 7896
    };
  }

  /**
   * Create agent with individual HTTP server
   */
  async createAgent(agentId, customConfig = null) {
    const agent = await super.createAgent(agentId, customConfig);
    
    // Don't create separate server for Alex - he uses unified bridge
    if (agentId === 'alex') {
      return agent;
    }
    
    // Create HTTP server for direct agent communication
    await this.createAgentServer(agentId, agent);
    
    return agent;
  }

  /**
   * Create HTTP server for individual agent
   */
  async createAgentServer(agentId, agent) {
    const port = this.agentPorts[agentId];
    if (!port) {
      throw new Error(`No port configured for agent: ${agentId}`);
    }

    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/message') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            
            // Process request through agent
            const response = await this.processAgentRequest(agentId, agent, request);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: error.message,
              agent: agentId,
              timestamp: Date.now()
            }));
          }
        });
      } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'active',
          agent: agentId,
          port: port,
          timestamp: Date.now()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    return new Promise((resolve, reject) => {
      server.listen(port, 'localhost', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🔌 Agent ${agentId} server listening on port ${port}`);
          this.agentServers.set(agentId, server);
          resolve(server);
        }
      });
    });
  }

  /**
   * Process request for individual agent
   */
  async processAgentRequest(agentId, agent, request) {
    const config = this.agentConfigs.get(agentId);
    const agentName = config?.agent?.name || agentId;
    const agentEmoji = this.getAgentEmoji(agentId);

    // Simulate agent processing the request
    const response = {
      type: `${agentId}_response`,
      agent: agentId,
      name: `${agentEmoji} ${agentName}`,
      emoji: agentEmoji,
      content: `✅ I have domain authority for ${config?.agent?.role || 'this area'}. Beginning ${request.message || 'analysis'}.`,
      timestamp: Date.now(),
      directResponse: true
    };

    return response;
  }

  /**
   * Get agent emoji
   */
  getAgentEmoji(agentId) {
    const emojis = {
      'alex': '👑',
      'sherlock': '🕵️',
      'edison': '⚡',
      'leonardo': '🏛️',
      'maya': '🎨',
      'vince': '🏈',
      'marie': '🔬'
    };
    return emojis[agentId] || '🤖';
  }

  /**
   * Shutdown agent and its server
   */
  async shutdownAgent(agentId) {
    // Close agent server if it exists
    const server = this.agentServers.get(agentId);
    if (server) {
      server.close();
      this.agentServers.delete(agentId);
      console.log(`🔌 Agent ${agentId} server closed`);
    }

    // Call parent shutdown
    await super.shutdownAgent(agentId);
  }

  /**
   * Shutdown all agents and servers
   */
  async shutdownAllAgents() {
    console.log('🛑 Shutting down all agent servers...');

    // Close all servers
    for (const [agentId, server] of this.agentServers) {
      server.close();
      console.log(`🔌 Agent ${agentId} server closed`);
    }
    this.agentServers.clear();

    // Call parent shutdown
    await super.shutdownAllAgents();
  }

  /**
   * Get server status for all agents
   */
  getServerStatus() {
    const status = {};
    
    for (const [agentId, port] of Object.entries(this.agentPorts)) {
      status[agentId] = {
        port: port,
        hasServer: this.agentServers.has(agentId),
        isRunning: this.agents.has(agentId)
      };
    }
    
    return status;
  }
}

module.exports = EnhancedAgentFactory;
