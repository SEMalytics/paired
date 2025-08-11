#!/usr/bin/env node
/**
 * WEE Agent Launcher
 * 
 * Launches and manages WEE agent processes that connect to the Cascade Bridge.
 * Each agent runs as a persistent process from startup to shutdown.
 * 
 * Usage:
 *   node agent_launcher.js --agent alex
 *   node agent_launcher.js --agent sherlock
 *   node agent_launcher.js --all
 */

const CascadeBridgeClient = require('./cascade_bridge_client');
const path = require('path');
const fs = require('fs');

class WEEAgentProcess {
  constructor(agentConfig, options = {}) {
    this.config = agentConfig;
    this.options = options;
    this.client = null;
    this.connected = false;
    this.messageHandlers = new Map();
    
    this.log(`Initializing ${this.config.name} agent process`);
    this.setupClient();
    this.setupMessageHandlers();
  }
  
  setupClient() {
    this.client = new CascadeBridgeClient({
      url: this.options.bridgeUrl || 'ws://localhost:7890',
      projectName: this.options.projectName || 'WEE-NextGen',
      debug: this.options.debug || false
    });
    
    this.client.on('connected', () => {
      this.log('Connected to bridge');
      this.connected = true;
      this.registerAgent();
    });
    
    this.client.on('disconnected', () => {
      this.log('Disconnected from bridge');
      this.connected = false;
    });
    
    this.client.on('message', (message) => {
      this.handleMessage(message);
    });
    
    this.client.on('error', (error) => {
      this.log(`Bridge client error: ${error.message}`);
    });
  }
  
  setupMessageHandlers() {
    // Register message handlers for different message types
    this.messageHandlers.set('agent_query', this.handleAgentQuery.bind(this));
    this.messageHandlers.set('collaboration_request', this.handleCollaborationRequest.bind(this));
    this.messageHandlers.set('status_request', this.handleStatusRequest.bind(this));
    this.messageHandlers.set('ping', this.handlePing.bind(this));
  }
  
  async start() {
    this.log('Starting agent process');
    try {
      await this.client.connect();
      this.log('Agent process started successfully');
    } catch (error) {
      this.log(`Failed to start agent process: ${error.message}`);
      throw error;
    }
  }
  
  registerAgent() {
    const registrationMessage = {
      type: 'agent_register',
      agentId: this.config.id,
      agentName: this.config.name,
      emoji: this.config.emoji,
      role: this.config.specialization,
      capabilities: this.config.capabilities,
      personality: this.config.personality,
      timestamp: new Date().toISOString()
    };
    
    this.client.sendMessage(registrationMessage);
    this.log(`Registered with bridge as ${this.config.name}`);
  }
  
  handleMessage(message) {
    try {
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      } else {
        this.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.log(`Error handling message: ${error.message}`);
    }
  }
  
  handleAgentQuery(message) {
    // Handle queries directed to this agent
    if (message.targetAgent === this.config.id || message.targetAgent === 'all') {
      const response = this.generateResponse(message.content);
      
      this.client.sendMessage({
        type: 'agent_response',
        agentId: this.config.id,
        agentName: this.config.name,
        emoji: this.config.emoji,
        responseId: message.messageId,
        content: response,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  handleCollaborationRequest(message) {
    // Handle collaboration requests from other agents
    this.log(`Collaboration request from ${message.fromAgent}: ${message.content}`);
    
    const response = this.generateCollaborationResponse(message);
    
    this.client.sendMessage({
      type: 'collaboration_response',
      agentId: this.config.id,
      agentName: this.config.name,
      toAgent: message.fromAgent,
      content: response,
      timestamp: new Date().toISOString()
    });
  }
  
  handleStatusRequest(message) {
    const status = {
      type: 'agent_status',
      agentId: this.config.id,
      agentName: this.config.name,
      emoji: this.config.emoji,
      status: 'active',
      connected: this.connected,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    this.client.sendMessage(status);
  }
  
  handlePing(message) {
    this.client.sendMessage({
      type: 'pong',
      agentId: this.config.id,
      agentName: this.config.name,
      timestamp: new Date().toISOString()
    });
  }
  
  generateResponse(query) {
    // Generate agent-specific response based on personality and capabilities
    const personality = this.config.personality;
    const specialization = this.config.specialization;
    
    // This is a simplified response generator - in a full implementation,
    // this would use the agent's specific modules and AI capabilities
    return `${this.config.emoji} **${this.config.name}** (${specialization}): ${personality}\\n\\nRegarding your query: "${query}"\\n\\nI'll apply my expertise in ${this.getExpertiseAreas()} to help you with this.`;
  }
  
  generateCollaborationResponse(message) {
    return `${this.config.emoji} **${this.config.name}**: I'm ready to collaborate on this. My ${this.config.specialization} expertise can contribute to ${message.content}`;
  }
  
  getExpertiseAreas() {
    if (this.config.expertise_domains) {
      return this.config.expertise_domains.slice(0, 2).join(' and ');
    }
    return this.config.specialization;
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.config.name}] ${message}`);
  }
  
  async shutdown() {
    this.log('Shutting down agent process');
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

// Agent configuration loader
function loadAgentConfig(agentId) {
  // Try multiple possible config paths
  const possiblePaths = [
    path.join(process.cwd(), '.wee', 'windsurf_agent_types.yml'),
    path.join(__dirname, '..', '.wee', 'windsurf_agent_types.yml'),
    path.join(__dirname, '..', '..', '.wee', 'windsurf_agent_types.yml')
  ];
  
  let configPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      configPath = testPath;
      break;
    }
  }
  
  if (!configPath) {
    throw new Error(`Agent configuration file not found in any of these locations: ${possiblePaths.join(', ')}`);
  }
  
  // Simple YAML parsing for agent config (in production, use a proper YAML parser)
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Extract agent configuration based on ID
  const agentConfigs = {
    alex: {
      id: 'alex',
      name: '👑 Alex (PM)',
      emoji: '👑',
      specialization: 'Strategic Project Manager',
      personality: 'Like Alexander the Great commanding armies, coordinates projects with strategic vision and decisive leadership',
      capabilities: ['strategic_planning', 'resource_coordination', 'stakeholder_management'],
      expertise_domains: ['Project management methodologies', 'Strategic planning and execution']
    },
    sherlock: {
      id: 'sherlock',
      name: '🕵️ Sherlock (QA)',
      emoji: '🕵️',
      specialization: 'Master Quality Detective',
      personality: 'Like Sherlock Holmes examining crime scenes, scrutinizes code for the tiniest bugs with detective-like precision',
      capabilities: ['systematic_investigation', 'comprehensive_testing', 'quality_gates'],
      expertise_domains: ['Systematic testing methodologies', 'Quality assurance frameworks']
    },
    edison: {
      id: 'edison',
      name: '⚡ Edison (Dev)',
      emoji: '⚡',
      specialization: 'Master Problem Solver',
      personality: 'Like Thomas Edison in his laboratory, approaches coding challenges with relentless experimentation and innovative solutions',
      capabilities: ['rapid_prototyping', 'problem_solving', 'technical_implementation'],
      expertise_domains: ['Full-stack development', 'System integration']
    },
    leonardo: {
      id: 'leonardo',
      name: '🏛️ Leonardo (Architecture)',
      emoji: '🏛️',
      specialization: 'Master System Architect',
      personality: 'Like Leonardo da Vinci designing flying machines, creates system architectures that are both beautiful and functionally superior',
      capabilities: ['system_design', 'architectural_patterns', 'scalability_planning'],
      expertise_domains: ['System architecture design', 'Scalability and performance optimization']
    },
    maya: {
      id: 'maya',
      name: '🎨 Maya (UX)',
      emoji: '🎨',
      specialization: 'Master of Human Experience',
      personality: 'Like Maya Angelou understanding human experience, creates interfaces that resonate deeply with users\' needs and emotions',
      capabilities: ['user_research', 'interface_design', 'accessibility_optimization'],
      expertise_domains: ['User experience design', 'Human-computer interaction']
    },
    vince: {
      id: 'vince',
      name: '🏈 Vince (Scrum Master)',
      emoji: '🏈',
      specialization: 'Master Team Coach',
      personality: 'Like Vince Lombardi coaching championship teams, drives team excellence through disciplined agile practices and motivational leadership',
      capabilities: ['team_coordination', 'agile_facilitation', 'performance_optimization'],
      expertise_domains: ['Agile methodologies', 'Team dynamics and coaching']
    },
    marie: {
      id: 'marie',
      name: '🔬 Marie (Analyst)',
      emoji: '🔬',
      specialization: 'Master Data Scientist',
      personality: 'Like Marie Curie discovering radium through meticulous research, transforms raw data into strategic intelligence through rigorous analysis',
      capabilities: ['data_analysis', 'pattern_recognition', 'strategic_insights'],
      expertise_domains: ['Data science and analytics', 'Statistical analysis and modeling']
    }
  };
  
  const config = agentConfigs[agentId];
  if (!config) {
    throw new Error(`Unknown agent ID: ${agentId}`);
  }
  
  return config;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
WEE Agent Launcher

Usage:
  node agent_launcher.js --agent <agent_id>  Start specific agent
  node agent_launcher.js --all               Start all agents
  
Available agents:
  alex      - 👑 Alex (PM) - Strategic Project Manager
  sherlock  - 🕵️ Sherlock (QA) - Master Quality Detective  
  edison    - ⚡ Edison (Dev) - Master Problem Solver
  leonardo  - 🏛️ Leonardo (Architecture) - Master System Architect
  maya      - 🎨 Maya (UX) - Master of Human Experience
  vince     - 🏈 Vince (Scrum Master) - Master Team Coach
  marie     - 🔬 Marie (Analyst) - Master Data Scientist
`);
    process.exit(0);
  }
  
  let agentIds = [];
  
  if (args.includes('--all')) {
    agentIds = ['alex', 'sherlock', 'edison', 'leonardo', 'maya', 'vince', 'marie'];
  } else {
    const agentIndex = args.indexOf('--agent');
    if (agentIndex !== -1 && args[agentIndex + 1]) {
      agentIds = [args[agentIndex + 1]];
    } else {
      console.error('Please specify --agent <agent_id> or --all');
      process.exit(1);
    }
  }
  
  const agents = [];
  
  // Start each agent process
  for (const agentId of agentIds) {
    try {
      const config = loadAgentConfig(agentId);
      const agent = new WEEAgentProcess(config, {
        projectName: process.env.WEE_PROJECT_NAME || 'WEE-NextGen',
        debug: process.env.WEE_DEBUG === 'true'
      });
      
      await agent.start();
      agents.push(agent);
    } catch (error) {
      console.error(`Failed to start agent ${agentId}: ${error.message}`);
    }
  }
  
  console.log(`\\n🌊 WEE Agents Started: ${agents.length} active agents`);
  agents.forEach(agent => {
    console.log(`  ${agent.config.emoji} ${agent.config.name} - ${agent.config.specialization}`);
  });
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down WEE agents...');
    
    for (const agent of agents) {
      await agent.shutdown();
    }
    
    console.log('✅ All agents shut down gracefully');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\\n🛑 Received SIGTERM, shutting down...');
    
    for (const agent of agents) {
      await agent.shutdown();
    }
    
    process.exit(0);
  });

  // Keep the process alive - agents run as persistent background processes
  console.log('🔄 Agents running in persistent mode. Press Ctrl+C to stop.');
  
  // Keep-alive loop to prevent process from exiting
  const keepAlive = () => {
    setTimeout(keepAlive, 60000); // Check every minute
  };
  keepAlive();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { WEEAgentProcess, loadAgentConfig };
