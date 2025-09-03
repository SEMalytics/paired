/**
 * KnowledgeForge 3.2 Agent Factory
 *
 * Factory class for creating and managing agents in the unified architecture.
 * Handles agent instantiation, configuration loading, and lifecycle management.
 *
 * Philosophy: "Intelligent Agent Orchestration with Configuration-Driven Specialization"
 * - Standardized agent creation and initialization
 * - Configuration-driven agent specialization
 * - Centralized agent lifecycle management
 * - Dynamic agent discovery and registration
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const EventEmitter = require('events');
const http = require('http');

// Import base agent and specialized agents
const BaseAgent = require('./base_agent');
const PMAgent = require('./alex/pm_agent');
const QAAgent = require('./sherlock/qa_agent');
const DevAgent = require('./edison/dev_agent');
const ArchitectureAgent = require('./leonardo/architecture_agent');
const UXAgent = require('./maya/ux_expert_agent');
const ScrumMasterAgent = require('./vince/scrum_master_agent');
const AnalystAgent = require('./marie/analyst_agent');

class AgentFactory extends EventEmitter {
  constructor(orchestrator) {
    super();

    this.orchestrator = orchestrator;
    this.agents = new Map();
    this.agentConfigs = new Map();
    this.agentClasses = new Map();
    
    // HTTP server management for individual agents
    this.agentServers = new Map();
    this.basePort = 7890;
    this.agentPorts = {
      'alex': 7890,      // Alex coordinates through unified bridge
      'sherlock': 7891,
      'edison': 7892,
      'leonardo': 7893,
      'maya': 7894,
      'vince': 7895,
      'marie': 7896
    };

    // Register available agent classes
    this.registerAgentClasses();

    console.log('🏭 Agent Factory initialized');
  }

  /**
   * Register available agent classes
   */
  registerAgentClasses() {
    // All PAIRED agents
    this.agentClasses.set('pm_agent', PMAgent);
    this.agentClasses.set('qa_agent', QAAgent);
    this.agentClasses.set('dev_agent', DevAgent);
    this.agentClasses.set('architecture_agent', ArchitectureAgent);
    this.agentClasses.set('ux_agent', UXAgent);
    this.agentClasses.set('scrum_master_agent', ScrumMasterAgent);
    this.agentClasses.set('analyst_agent', AnalystAgent);

    console.log(`📋 Registered ${this.agentClasses.size} agent classes`);
  }

  /**
   * Load all agent configurations from the config directory
   */
  async loadAgentConfigurations() {
    try {
      // Try multiple possible config directories
      const possibleConfigDirs = [
        path.join(__dirname, '..', 'config', 'agents'),
        path.join(process.env.HOME, '.paired', 'core', 'config', 'agents'),
        path.join(__dirname, '..', '..', '..', '.paired', 'core', 'config', 'agents')
      ];

      let configDir = null;
      for (const dir of possibleConfigDirs) {
        try {
          await fs.access(dir);
          configDir = dir;
          console.log(`📁 Using config directory: ${configDir}`);
          break;
        } catch (error) {
          // Directory doesn't exist, try next one
        }
      }

      if (!configDir) {
        throw new Error(`No agent configuration directory found. Tried: ${possibleConfigDirs.join(', ')}`);
      }

      const configFiles = await fs.readdir(configDir);

      for (const configFile of configFiles) {
        if (configFile.endsWith('.yml') || configFile.endsWith('.yaml')) {
          await this.loadAgentConfiguration(path.join(configDir, configFile));
        }
      }

      console.log(`📚 Loaded ${this.agentConfigs.size} agent configurations`);
    } catch (error) {
      console.error('❌ Failed to load agent configurations:', error.message);
      throw error;
    }
  }

  /**
   * Load a specific agent configuration
   */
  async loadAgentConfiguration(configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configContent);

      // Validate configuration
      this.validateAgentConfiguration(config);

      // Store configuration
      this.agentConfigs.set(config.agent.id, config);

      console.log(`📄 Loaded configuration for ${config.agent.name} (${config.agent.id})`);

      return config;
    } catch (error) {
      console.error(`❌ Failed to load agent configuration from ${configPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate agent configuration structure
   */
  validateAgentConfiguration(config) {
    const requiredFields = [
      'agent.id',
      'agent.name',
      'agent.role',
      'agent.version'
    ];

    for (const field of requiredFields) {
      if (!this.getNestedProperty(config, field)) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }

    // Validate agent ID format
    if (!/^[a-z_]+$/.test(config.agent.id)) {
      throw new Error(`Invalid agent ID format: ${config.agent.id}. Must be lowercase with underscores only.`);
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(config.agent.version)) {
      throw new Error(`Invalid version format: ${config.agent.version}. Must be semantic version (x.y.z).`);
    }
  }

  /**
   * Create an agent instance with optional HTTP server
   */
  async createAgent(agentId, customConfig = null) {
    try {
      console.log(`🔧 Creating agent: ${agentId}`);

      // Get agent configuration
      const config = customConfig || this.agentConfigs.get(agentId);
      if (!config) {
        throw new Error(`No configuration found for agent: ${agentId}`);
      }

      // Get agent class - use agent type from config, not agentId
      const agentType = config.agent.type;
      const AgentClass = this.agentClasses.get(agentType) || BaseAgent;

      // Create agent instance
      const agent = new AgentClass(this.orchestrator, config);

      // Store agent instance
      this.agents.set(agentId, agent);

      // Set up event listeners
      this.setupAgentEventListeners(agent);

      console.log(`✅ Created ${config.agent.name} agent (${agentId})`);

      // Create HTTP server for direct agent communication (except Alex)
      if (agentId !== 'alex') {
        await this.createAgentServer(agentId, agent);
      }

      this.emit('agentCreated', { agentId, agent, config });

      return agent;
    } catch (error) {
      console.error(`❌ Failed to create agent ${agentId}:`, error.message);
      this.emit('agentCreationFailed', { agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Initialize all configured agents
   */
  async initializeAllAgents() {
    console.log('🚀 Initializing all configured agents...');

    const initializationResults = [];

    for (const [agentId, config] of this.agentConfigs) {
      try {
        // Only initialize agents that are active
        if (config.agent.status === 'active') {
          const agent = await this.createAgent(agentId);
          initializationResults.push({ agentId, status: 'success', agent });
        } else {
          console.log(`⏸️ Skipping ${agentId} (status: ${config.agent.status})`);
          initializationResults.push({ agentId, status: 'skipped', reason: config.agent.status });
        }
      } catch (error) {
        console.error(`❌ Failed to initialize ${agentId}:`, error.message);
        initializationResults.push({ agentId, status: 'failed', error: error.message });
      }
    }

    const successCount = initializationResults.filter(r => r.status === 'success').length;
    const failedCount = initializationResults.filter(r => r.status === 'failed').length;
    const skippedCount = initializationResults.filter(r => r.status === 'skipped').length;

    console.log(`🎯 Agent initialization complete: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

    this.emit('allAgentsInitialized', { results: initializationResults });

    return initializationResults;
  }

  /**
   * Get an agent instance
   */
  getAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  /**
   * Get all active agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category) {
    return Array.from(this.agents.values()).filter(agent => {
      const config = this.agentConfigs.get(agent.id);
      return config && config.agent.category === category;
    });
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability) {
    return Array.from(this.agents.values()).filter(agent => {
      const config = this.agentConfigs.get(agent.id);
      return config && config.specializations?.capabilities?.some(cap => cap.name === capability);
    });
  }

  /**
   * Find best agent for a task
   */
  findBestAgentForTask(taskDescription, context = {}) {
    const candidates = [];

    for (const [agentId, agent] of this.agents) {
      const config = this.agentConfigs.get(agentId);
      if (!config) continue;

      const score = this.calculateAgentScore(taskDescription, context, config);
      if (score > 0) {
        candidates.push({ agentId, agent, config, score });
      }
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Calculate agent suitability score for a task
   */
  calculateAgentScore(taskDescription, context, config) {
    let score = 0;

    // Check routing rules
    if (config.orchestration?.routing_rules) {
      for (const rule of config.orchestration.routing_rules) {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(taskDescription)) {
          if (rule.action === 'accept') {
            score += rule.confidence * 100;
          } else if (rule.action === 'collaborate') {
            score += rule.confidence * 50;
          } else if (rule.action === 'handoff') {
            score -= rule.confidence * 50;
          }
        }
      }
    }

    // Check expertise areas
    if (config.specializations?.expertise_areas) {
      for (const expertise of config.specializations.expertise_areas) {
        if (taskDescription.toLowerCase().includes(expertise.toLowerCase())) {
          score += 30;
        }
      }
    }

    // Check capabilities
    if (config.specializations?.capabilities) {
      for (const capability of config.specializations.capabilities) {
        if (taskDescription.toLowerCase().includes(capability.name.toLowerCase())) {
          score += capability.confidence * 40;
        }
      }
    }

    // Adjust for agent priority
    score *= (config.agent.priority || 5) / 10;

    return Math.max(0, score);
  }

  /**
   * Shutdown an agent
   */
  async shutdownAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    console.log(`🛑 Shutting down agent: ${agentId}`);

    // Remove event listeners
    agent.removeAllListeners();

    // Remove from active agents
    this.agents.delete(agentId);

    console.log(`✅ Agent ${agentId} shut down successfully`);

    this.emit('agentShutdown', { agentId });
  }

  /**
   * Shutdown all agents
   */
  async shutdownAllAgents() {
    console.log('🛑 Shutting down all agents...');

    const shutdownPromises = Array.from(this.agents.keys()).map(agentId =>
      this.shutdownAgent(agentId).catch(error =>
        console.error(`Failed to shutdown ${agentId}:`, error.message)
      )
    );

    await Promise.all(shutdownPromises);

    console.log('✅ All agents shut down');

    this.emit('allAgentsShutdown');
  }

  /**
   * Reload agent configuration
   */
  async reloadAgentConfiguration(agentId) {
    console.log(`🔄 Reloading configuration for agent: ${agentId}`);

    // Shutdown existing agent if running
    if (this.agents.has(agentId)) {
      await this.shutdownAgent(agentId);
    }

    // Reload configuration
    const configPath = path.join(__dirname, '..', 'config', 'agents', `${agentId}_config.yml`);
    await this.loadAgentConfiguration(configPath);

    // Recreate agent
    const agent = await this.createAgent(agentId);

    console.log(`✅ Agent ${agentId} reloaded successfully`);

    this.emit('agentReloaded', { agentId, agent });

    return agent;
  }

  /**
   * Get factory status and statistics
   */
  getFactoryStatus() {
    const agentStats = {};

    for (const [agentId, agent] of this.agents) {
      agentStats[agentId] = agent.getAgentStatus();
    }

    return {
      totalConfigurations: this.agentConfigs.size,
      activeAgents: this.agents.size,
      registeredClasses: this.agentClasses.size,
      agentStats,
      categories: this.getCategoryStats(),
      capabilities: this.getCapabilityStats()
    };
  }

  /**
   * Get statistics by category
   */
  getCategoryStats() {
    const categories = {};

    for (const config of this.agentConfigs.values()) {
      const category = config.agent.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    }

    return categories;
  }

  /**
   * Get statistics by capability
   */
  getCapabilityStats() {
    const capabilities = {};

    for (const config of this.agentConfigs.values()) {
      if (config.specializations?.capabilities) {
        for (const capability of config.specializations.capabilities) {
          capabilities[capability.name] = (capabilities[capability.name] || 0) + 1;
        }
      }
    }

    return capabilities;
  }

  /**
   * Set up event listeners for an agent
   */
  setupAgentEventListeners(agent) {
    agent.on('initialized', (data) => {
      console.log(`🎯 Agent ${data.agent} initialized`);
      this.emit('agentInitialized', data);
    });

    agent.on('taskCompleted', (data) => {
      this.emit('agentTaskCompleted', data);
    });

    agent.on('taskFailed', (data) => {
      console.error(`❌ Agent ${data.agent} task failed: ${data.error}`);
      this.emit('agentTaskFailed', data);
    });

    agent.on('error', (data) => {
      console.error(`❌ Agent ${data.agent} error: ${data.error}`);
      this.emit('agentError', data);
    });
  }

  /**
   * Create agent from template
   */
  async createAgentFromTemplate(agentId, templateConfig) {
    console.log(`📋 Creating agent ${agentId} from template`);

    // Merge template with agent-specific overrides
    const config = this.mergeConfigurations(templateConfig, {
      agent: { id: agentId }
    });

    // Validate merged configuration
    this.validateAgentConfiguration(config);

    // Store configuration
    this.agentConfigs.set(agentId, config);

    // Create agent
    return await this.createAgent(agentId);
  }

  /**
   * Merge configurations with deep merge
   */
  mergeConfigurations(base, override) {
    const merged = JSON.parse(JSON.stringify(base)); // Deep clone

    function deepMerge(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    deepMerge(merged, override);
    return merged;
  }

  /**
   * Get nested property from object
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Export agent configuration
   */
  async exportAgentConfiguration(agentId, outputPath) {
    const config = this.agentConfigs.get(agentId);
    if (!config) {
      throw new Error(`No configuration found for agent: ${agentId}`);
    }

    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    await fs.writeFile(outputPath, yamlContent, 'utf8');

    console.log(`📤 Exported ${agentId} configuration to ${outputPath}`);
  }

  /**
   * Import agent configuration
   */
  async importAgentConfiguration(configPath) {
    const config = await this.loadAgentConfiguration(configPath);

    console.log(`📥 Imported ${config.agent.id} configuration from ${configPath}`);

    return config;
  }

  /**
   * List available agent templates
   */
  async listAvailableTemplates() {
    const templateDir = path.join(__dirname, '..', 'config', 'templates');

    try {
      const templateFiles = await fs.readdir(templateDir);
      return templateFiles
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => path.basename(file, path.extname(file)));
    } catch (error) {
      console.warn('⚠️ Could not list templates:', error.message);
      return [];
    }
  }

  /**
   * Validate all agent configurations
   */
  async validateAllConfigurations() {
    const validationResults = [];

    for (const [agentId, config] of this.agentConfigs) {
      try {
        this.validateAgentConfiguration(config);
        validationResults.push({ agentId, status: 'valid' });
      } catch (error) {
        validationResults.push({ agentId, status: 'invalid', error: error.message });
      }
    }

    return validationResults;
  }

  /**
   * Create HTTP server for individual agent with dynamic port allocation
   */
  async createAgentServer(agentId, agent) {
    let port = this.agentPorts[agentId];
    if (!port) {
      throw new Error(`No port configured for agent: ${agentId}`);
    }

    // Try ports starting from configured port, increment if busy
    const maxAttempts = 10;
    let attempts = 0;
    let server;

    while (attempts < maxAttempts) {
      try {
        server = http.createServer((req, res) => {
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

        // Try to start server on current port
        await new Promise((resolve, reject) => {
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
        
        return server; // Success - exit loop
        
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} busy, trying ${port + 1}`);
          port++;
          attempts++;
        } else {
          throw error; // Other errors should be thrown
        }
      }
    }
    
    throw new Error(`Failed to find available port for agent ${agentId} after ${maxAttempts} attempts`);
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

    // Remove agent instance
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      console.log(`🤖 Agent ${agentId} removed`);
    }
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

    // Remove all agents
    this.agents.clear();
    console.log('🤖 All agents removed');
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

module.exports = AgentFactory;
