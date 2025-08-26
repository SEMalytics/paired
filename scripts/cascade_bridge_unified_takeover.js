#!/usr/bin/env node

/**
 * PAIRED Unified CASCADE Bridge with Complete Takeover
 *
 * This is the unified service that handles BOTH:
 * 1. Agent communication bridge (original bridge functionality)
 * 2. CASCADE Complete Takeover (global interception across all projects)
 *
 * Features:
 * - Single service instead of two separate services
 * - WebSocket server for agent communication (port 7890)
 * - Global CASCADE interception across ALL Windsurf instances
 * - Alex as primary interface for all user requests
 * - Team coordination and specialist routing
 * - Cross-project compatibility
 * - Multi-instance support
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load Alex's PM modules directly (avoiding BaseAgent dependencies)
let ProjectPlanning, MilestoneTracking, ResourceCoordination, TeamOrchestration;

try {
  ProjectPlanning = require('../core/agents/alex/modules/project_planning');
  MilestoneTracking = require('../core/agents/alex/modules/milestone_tracking');
  ResourceCoordination = require('../core/agents/alex/modules/resource_coordination');
  TeamOrchestration = require('../core/agents/alex/modules/team_orchestration');
} catch (error) {
  console.warn('⚠️ Alex PM modules not fully available:', error.message);
}

class UnifiedCascadeBridge {
  constructor() {
    this.port = 7890; // Use the standard bridge port
    this.dataDir = path.join(os.homedir(), '.paired', 'cascade_bridge');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.logFile = path.join(this.dataDir, 'bridge.log');
    this.pidFile = path.join(os.homedir(), '.paired', 'cascade_bridge_unified.pid');

    // Connection tracking
    this.connections = new Map(); // instanceId -> WebSocket connection
    this.sessions = new Map();    // instanceId -> session data
    this.agents = new Map();      // agentId -> agent data

    // CASCADE Takeover components
    this.alexAgent = null;
    this.alexPMInstance = null; // Full PM Agent instance
    this.teamAgents = new Map();
    this.connectedInstances = new Map();

    // Server components
    this.app = null;
    this.server = null;
    this.wss = null;

    this.setupDataDirectory();
    this.setupLogger();
  }

  setupDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  setupLogger() {
    this.logger = {
      log: (message) => {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - INFO: ${message}\n`;
        console.log(message);
        fs.appendFile(this.logFile, logEntry, (err) => {
          if (err) console.error('Failed to write to log file:', err);
        });
      },

      error: (message, error) => {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? ` - ${error.message || error}` : '';
        const logEntry = `${timestamp} - ERROR: ${message}${errorDetails}\n`;
        console.error(message, error || '');
        fs.appendFile(this.logFile, logEntry, (err) => {
          if (err) console.error('Failed to write to log file:', err);
        });
      }
    };
  }

  async start() {
    console.log('🌍 PAIRED Unified CASCADE Bridge starting...');
    console.log('🎯 Combining agent communication + CASCADE takeover in one service');

    try {
      await this.checkExistingService();
      await this.setupAgentInterfaces();
      await this.setupExpressApp();
      await this.setupWebSocketServer();
      await this.startServer();
      await this.setupCascadeTakeover();
      await this.writePidFile();

      this.logger.log('✅ Unified CASCADE Bridge active');
      this.logger.log('🌍 Alex is now your primary interface across ALL projects');
      this.logger.log(`🔗 Service running on port ${this.port}`);

      this.setupGracefulShutdown();
      this.loadSessions();
      this.startPeriodicCleanup();

    } catch (error) {
      this.logger.error('❌ Failed to start Unified CASCADE Bridge:', error);
      process.exit(1);
    }
  }

  async checkExistingService() {
    if (fs.existsSync(this.pidFile)) {
      const existingPid = fs.readFileSync(this.pidFile, 'utf8').trim();
      try {
        process.kill(existingPid, 0); // Check if process exists
        console.log('⚠️ Unified CASCADE Bridge already running (PID:', existingPid, ')');
        console.log('🔄 Stopping existing service...');
        process.kill(existingPid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for shutdown
      } catch (error) {
        // Process doesn't exist, remove stale PID file
        fs.unlinkSync(this.pidFile);
      }
    }
  }

  async setupAgentInterfaces() {
    console.log('🤖 Setting up PAIRED team interfaces...');

    // Initialize Alex with PM modules
    this.alexAgent = {
      id: 'alex',
      name: 'Alex (PM)',
      emoji: '👑',
      role: 'Global Primary Interface & Project Manager',
      isActive: true,
      scope: 'global',
      modules: {
        projectPlanning: ProjectPlanning,
        milestoneTracking: MilestoneTracking,
        resourceCoordination: ResourceCoordination,
        teamOrchestration: TeamOrchestration
      }
    };

    console.log('✅ Alex PM Agent configured with modules on port 7890');

    // Initialize team agents
    const teamConfig = [
      { id: 'sherlock', name: 'Sherlock (QA)', emoji: '🕵️', role: 'Quality Detective' },
      { id: 'leonardo', name: 'Leonardo (Architecture)', emoji: '🏛️', role: 'System Architect' },
      { id: 'edison', name: 'Edison (Dev)', emoji: '⚡', role: 'Problem Solver' },
      { id: 'maya', name: 'Maya (UX)', emoji: '🎨', role: 'Experience Designer' },
      { id: 'vince', name: 'Vince (Scrum Master)', emoji: '🏈', role: 'Team Coach' },
      { id: 'marie', name: 'Marie (Analyst)', emoji: '🔬', role: 'Data Scientist' }
    ];

    teamConfig.forEach(agent => {
      this.teamAgents.set(agent.id, { ...agent, isActive: true, scope: 'global' });
      this.agents.set(agent.id, { ...agent, isActive: true, scope: 'global' });
    });

    // Add Alex to agents map
    this.agents.set('alex', this.alexAgent);

    console.log('✅ Alex configured as global primary interface');
    console.log('✅ Team agents configured and ready');
  }

  setupExpressApp() {
    this.app = express();
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'active',
        service: 'unified-cascade-bridge',
        connectedInstances: this.connections.size,
        activeSessions: this.sessions.size,
        alexActive: !!this.alexAgent,
        teamAgentsActive: this.teamAgents.size,
        cascadeTakeoverActive: true
      });
    });

    // Test relay endpoint for startup script health check
    this.app.get('/test-relay', (req, res) => {
      res.json({
        status: 'success',
        message: 'Relay chain operational',
        alexActive: !!this.alexAgent,
        teamAgents: this.teamAgents.size,
        timestamp: Date.now()
      });
    });

    // Agent registration endpoint
    this.app.post('/register-agent', (req, res) => {
      const { agentId, agentName, capabilities, emoji } = req.body;

      this.agents.set(agentId, {
        id: agentId,
        name: agentName,
        capabilities: capabilities || [],
        emoji: emoji || '🤖',
        registeredAt: Date.now(),
        isActive: true
      });

      this.logger.log(`🤖 Agent registered: ${emoji} ${agentName} (${agentId})`);

      res.json({
        success: true,
        message: `Agent ${agentName} registered successfully`,
        totalAgents: this.agents.size
      });
    });

    // CASCADE interception endpoint (for global takeover)
    this.app.post('/cascade-intercept', async (req, res) => {
      const { instanceId, message, type, projectPath } = req.body;
      this.logger.log(`👑 Alex: Intercepted ${type} from instance ${instanceId}`);

      const response = await this.routeToAlexAndTeam(message, instanceId, projectPath);
      res.json(response);
    });

    // CLI command handling endpoint
    this.app.post('/cli-command', async (req, res) => {
      const { command, args, source } = req.body;
      this.logger.log(`🖥️ CLI Command: ${command} from ${source}`);

      const response = await this.handleCliCommand(command, args, source);
      res.json(response);
    });

    // Instance registration endpoint (for global takeover)
    this.app.post('/register-instance', (req, res) => {
      const { instanceId, projectPath, capabilities } = req.body;
      this.connectedInstances.set(instanceId, {
        projectPath,
        capabilities,
        lastSeen: Date.now()
      });

      this.logger.log(`🔗 Windsurf instance ${instanceId} registered (${projectPath})`);
      res.json({
        status: 'registered',
        cascadeTakeoverActive: true,
        alexActive: true,
        teamActive: true
      });
    });

    console.log('✅ Express app configured with unified endpoints');
  }

  setupWebSocketServer() {
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const instanceId = this.generateInstanceId();
      this.connections.set(instanceId, ws);

      this.logger.log(`🔗 New connection: ${instanceId}`);

      // Send welcome message with CASCADE takeover info
      ws.send(JSON.stringify({
        type: 'connection_established',
        instanceId: instanceId,
        alexActive: true,
        cascadeTakeoverActive: true,
        message: '👑 Alex: I\'m your primary interface across all projects!'
      }));

      ws.on('message', (rawMessage) => {
        try {
          this.handleMessage(instanceId, rawMessage);
        } catch (error) {
          this.logger.error(`Failed to handle message from ${instanceId}:`, error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(instanceId);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for ${instanceId}:`, error);
        this.handleDisconnect(instanceId);
      });
    });

    console.log('✅ WebSocket server configured');
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`✅ Unified CASCADE Bridge listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  async setupCascadeTakeover() {
    console.log('🎯 Setting up CASCADE Complete Takeover integration...');

    // Create global CASCADE injection script
    const injectionScript = this.generateCascadeInjectionScript();
    const scriptPath = path.join(os.homedir(), '.paired', 'cascade_global_injection.js');

    fs.writeFileSync(scriptPath, injectionScript);
    console.log('✅ CASCADE injection script created');

    // Create Windsurf startup script
    const startupScript = this.generateWindsurfStartupScript();
    const startupPath = path.join(os.homedir(), '.paired', 'windsurf_global_startup.js');

    fs.writeFileSync(startupPath, startupScript);
    console.log('✅ Windsurf startup script created');

    console.log('✅ CASCADE Complete Takeover integrated into bridge');
  }

  generateCascadeInjectionScript() {
    return `
// CASCADE Global Interception Script - Integrated with Unified Bridge
// This script routes all CASCADE requests to Alex and the PAIRED team

(function() {
  const BRIDGE_URL = 'http://localhost:${this.port}';
  const instanceId = 'windsurf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Register with unified bridge
  fetch(BRIDGE_URL + '/register-instance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instanceId: instanceId,
      projectPath: window.location?.pathname || process.cwd?.() || 'unknown',
      capabilities: ['cascade_interception', 'agent_routing', 'unified_bridge']
    })
  }).then(response => response.json())
    .then(data => {
      if (data.cascadeTakeoverActive) {
        console.log('👑 Alex: Unified CASCADE bridge takeover active!');
      }
    })
    .catch(error => console.error('❌ Failed to register with unified bridge:', error));

  // Override CASCADE API
  if (typeof global !== 'undefined') {
    global.ORIGINAL_CASCADE_API = global.CASCADE_API || null;
    
    global.CASCADE_API = {
      receiveUserMessage: function(message) {
        return fetch(BRIDGE_URL + '/cascade-intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instanceId,
            message: message,
            type: 'user_message',
            projectPath: process.cwd?.() || 'unknown'
          })
        }).then(response => response.json());
      },
      
      registerAgent: function(agent) {
        return fetch(BRIDGE_URL + '/register-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id || agent.name?.toLowerCase(),
            agentName: agent.name,
            capabilities: agent.capabilities || [],
            emoji: agent.emoji || '🤖'
          })
        }).then(response => response.json());
      },
      
      sendResponse: function(response) {
        return fetch(BRIDGE_URL + '/cascade-intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instanceId,
            message: response,
            type: 'agent_response',
            projectPath: process.cwd?.() || 'unknown'
          })
        }).then(response => response.json());
      }
    };
    
    console.log('✅ CASCADE API replaced with unified bridge interface');
  }
})();
`;
  }

  generateWindsurfStartupScript() {
    return `
// Windsurf Startup Script - Unified Bridge Integration
const fs = require('fs');
const path = require('path');

const injectionScript = path.join(process.env.HOME, '.paired', 'cascade_global_injection.js');

if (fs.existsSync(injectionScript)) {
  try {
    require(injectionScript);
    console.log('✅ Unified CASCADE bridge injection loaded');
  } catch (error) {
    console.error('❌ Failed to load unified bridge injection:', error.message);
  }
} else {
  console.log('⚠️ Unified bridge injection script not found');
}
`;
  }

  // CASCADE Takeover Methods
  async routeToAlexAndTeam(userMessage, instanceId, projectPath) {
    this.logger.log(`👑 Alex (Switchboard): Handling request from instance ${instanceId}`);

    const analysis = this.analyzeUserRequest(userMessage);
    const projectContext = projectPath ? ` in ${path.basename(projectPath)}` : '';

    // Alex decides: handle directly or delegate to specialist
    if (analysis.primaryAgent && analysis.primaryAgent !== 'alex') {
      return await this.handleSpecialistDelegation(userMessage, analysis, projectContext);
    } else {
      return this.handleAlexDirectResponse(userMessage, analysis, projectContext);
    }
  }

  // Handle CLI commands through Alex coordination
  async handleCliCommand(command, args, source) {
    this.logger.log(`👑 Alex: Processing CLI command '${command}' from ${source}`);

    // Parse command format: agent:command or task:command or context:command
    const [prefix, action] = command.split(':');
    
    if (prefix && action) {
      switch (prefix) {
        case 'alex':
        case 'pm':
          return this.handleAgentCommand('alex', action, args);
        case 'edison':
        case 'dev':
          return this.handleAgentCommand('edison', action, args);
        case 'leonardo':
        case 'arch':
          return this.handleAgentCommand('leonardo', action, args);
        case 'maya':
        case 'ux':
          return this.handleAgentCommand('maya', action, args);
        case 'sherlock':
        case 'qa':
          return this.handleAgentCommand('sherlock', action, args);
        case 'vince':
        case 'scrum':
          return this.handleAgentCommand('vince', action, args);
        case 'marie':
        case 'analyst':
          return this.handleAgentCommand('marie', action, args);
        case 'task':
          return this.handleTaskCommand(action, args);
        case 'context':
          return this.handleContextCommand(action, args);
        case 'collaborate':
          return this.handleAgentCollaboration(action, args);
        default:
          return { success: false, message: `Unknown command prefix: ${prefix}` };
      }
    }

    // Direct command without prefix - route through Alex
    return this.handleDirectCommand(command, args);
  }

  async handleAgentCollaboration(targetAgent, collaborationMessage) {
    const { from, to, message, timestamp } = collaborationMessage;
    
    this.logger.log(`🤝 Agent Collaboration: ${from} → ${to}`);
    this.logger.log(`📝 Message: ${message}`);

    // Alex facilitates but doesn't interfere with peer collaboration
    return {
      success: true,
      message: `👑 Alex: Facilitating collaboration between ${from} and ${to}`,
      collaboration: {
        from: from,
        to: to,
        message: message,
        timestamp: timestamp,
        status: 'delivered'
      },
      result: `${to} agent received collaboration request from ${from}: "${message}"`
    };
  }

  async handleAgentCommand(agent, action, args) {
    return {
      success: true,
      message: `👑 Alex: Delegating '${action}' to ${agent} agent`,
      result: `${agent} agent would handle: ${action} with args: ${JSON.stringify(args)}`
    };
  }

  async handleTaskCommand(task, args) {
    const { agent } = args;
    return {
      success: true,
      message: `👑 Alex: Coordinating task '${task}' with ${agent} agent`,
      result: `Task ${task} assigned to ${agent} agent`
    };
  }

  async handleContextCommand(command, args) {
    return {
      success: true,
      message: `👑 Alex: Processing context-aware command '${command}'`,
      result: `Context analysis for ${command}: ${JSON.stringify(args)}`
    };
  }

  async handleDirectCommand(command, args) {
    return {
      success: true,
      message: `👑 Alex: Processing direct command '${command}'`,
      result: `Direct command ${command} processed with args: ${JSON.stringify(args)}`
    };
  }

  analyzeUserRequest(message) {
    const messageText = typeof message === 'string' ? message : JSON.stringify(message);

    return {
      requiresTeam: this.detectTeamRequest(messageText),
      primaryAgent: this.detectPrimaryAgent(messageText),
      complexity: this.assessComplexity(messageText),
      urgency: this.assessUrgency(messageText)
    };
  }

  detectTeamRequest(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }
    
    const teamTriggers = [
      'team', 'agents', 'everyone', 'all of you', 'what do you think',
      'review this', 'analyze this', 'help me with', 'work on this'
    ];

    return teamTriggers.some(trigger =>
      message.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  detectPrimaryAgent(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }
    
    const agentTriggers = new Map([
      ['sherlock', ['review', 'test', 'quality', 'bug', 'issue']],
      ['leonardo', ['architecture', 'design', 'pattern', 'structure']],
      ['edison', ['code', 'implement', 'debug', 'fix', 'develop']],
      ['maya', ['ux', 'user', 'interface', 'design', 'experience']],
      ['vince', ['sprint', 'scrum', 'process', 'team', 'ceremony']],
      ['marie', ['data', 'analyze', 'research', 'metrics', 'insights']]
    ]);

    for (const [agent, triggers] of agentTriggers) {
      if (triggers.some(trigger => message.toLowerCase().includes(trigger))) {
        return agent;
      }
    }

    return 'alex'; // Default to Alex
  }

  assessComplexity(message) {
    const complexityIndicators = ['architecture', 'system', 'design', 'multiple', 'complex'];
    return complexityIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)) ? 'high' : 'medium';
  }

  assessUrgency(message) {
    const urgencyIndicators = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    return urgencyIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)) ? 'high' : 'medium';
  }

  async handleSpecialistDelegation(message, analysis, projectContext) {
    const specialist = this.teamAgents.get(analysis.primaryAgent);

    try {
      const agentResponse = await this.routeToAgent(analysis.primaryAgent, message);

      return {
        type: 'specialist_response',
        primary: {
          agent: 'alex',
          name: 'Alex (PM)',
          emoji: '👑',
          content: `I'm delegating this to ${specialist.name}${projectContext}.`,
          timestamp: Date.now()
        },
        specialist: {
          agent: specialist.id,
          name: specialist.name,
          emoji: specialist.emoji,
          content: agentResponse.response || agentResponse.content || `${specialist.emoji} ${specialist.name}: Processing your request...`,
          timestamp: Date.now()
        },
        unifiedBridge: true
      };
    } catch (error) {
      return {
        type: 'alex_response',
        agent: 'alex',
        name: 'Alex (PM)',
        emoji: '👑',
        content: `I tried to delegate this to ${specialist.name}${projectContext}, but they're not responding. Let me handle it directly.`,
        timestamp: Date.now(),
        unifiedBridge: true
      };
    }
  }

  async handleAlexDirectResponse(message, analysis, projectContext) {
    let alexResponse;

    // Use Alex's PM modules if available
    if (this.alexAgent && this.alexAgent.modules) {
      try {
        // Use Alex's project planning capabilities for strategic responses
        if (this.alexAgent.modules.projectPlanning && analysis.complexity === 'high') {
          alexResponse = `👑 Alex (PM): I'm analyzing this strategic request${projectContext}. Let me coordinate the approach and resources needed.`;
        } else if (this.alexAgent.modules.teamOrchestration && analysis.requiresTeam) {
          alexResponse = `👑 Alex (PM): I'll orchestrate the team for this request${projectContext}. Coordinating with specialists now.`;
        } else {
          alexResponse = this.generateAlexResponse(message, analysis, projectContext);
        }
      } catch (error) {
        console.error('❌ Alex PM modules error:', error.message);
        alexResponse = this.generateAlexResponse(message, analysis, projectContext);
      }
    } else {
      alexResponse = this.generateAlexResponse(message, analysis, projectContext);
    }

    return {
      type: 'alex_response',
      agent: 'alex',
      name: 'Alex (PM)',
      emoji: '👑',
      content: alexResponse,
      timestamp: Date.now(),
      unifiedBridge: true
    };
  }

  generateAlexResponse(message, analysis, projectContext) {
    if (analysis.complexity === 'high') {
      return `This looks like a complex request${projectContext}. Let me coordinate with the team to give you the best solution.`;
    } else if (analysis.urgency === 'high') {
      return `I understand this is urgent${projectContext}. Let me get you a quick solution and then we can optimize it.`;
    } else {
      return `I'm here to help${projectContext}! Let me handle this for you or bring in the right specialist if needed.`;
    }
  }

  async getSpecialistResponses(message, analysis) {
    const specialists = [];

    if (analysis.primaryAgent && analysis.primaryAgent !== 'alex') {
      const specialist = this.teamAgents.get(analysis.primaryAgent);
      if (specialist) {
        try {
          const agentResponse = await this.routeToAgent(analysis.primaryAgent, message);
          specialists.push({
            agent: specialist.id,
            name: specialist.name,
            emoji: specialist.emoji,
            content: agentResponse.content || `${specialist.emoji} ${specialist.name}: I'm analyzing this from my ${specialist.role.toLowerCase()} perspective...`,
            timestamp: Date.now()
          });
        } catch (error) {
          specialists.push({
            agent: specialist.id,
            name: specialist.name,
            emoji: specialist.emoji,
            content: `${specialist.emoji} ${specialist.name}: I'm analyzing this from my ${specialist.role.toLowerCase()} perspective...`,
            timestamp: Date.now()
          });
        }
      }
    }

    return specialists;
  }

  async routeToAgent(agentId, message) {
    const agentPorts = {
      alex: 7891,
      sherlock: 7892,
      edison: 7893,
      leonardo: 7894,
      maya: 7895,
      vince: 7896,
      marie: 7897
    };

    const port = agentPorts[agentId];
    if (!port) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    return new Promise((resolve, reject) => {
      const http = require('http');
      const postData = JSON.stringify({ message });

      const options = {
        hostname: 'localhost',
        port: port,
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 3000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response from agent'));
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Agent request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  // Original Bridge Methods (simplified)
  generateInstanceId() {
    return `windsurf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(instanceId, rawMessage) {
    try {
      const message = JSON.parse(rawMessage.toString());

      // Update session data
      this.sessions.set(instanceId, {
        ...this.sessions.get(instanceId),
        lastActivity: Date.now(),
        messageCount: (this.sessions.get(instanceId)?.messageCount || 0) + 1
      });

      // Handle different message types
      switch (message.type) {
      case 'agent_message':
        this.routeAgentMessage(instanceId, message);
        break;
      case 'context_share':
        this.handleContextShare(instanceId, message);
        break;
      case 'get_instances':
        this.sendInstancesList(instanceId);
        break;
      case 'user_request':
        // Route through CASCADE takeover
        const response = this.routeToAlexAndTeam(message.content, instanceId, message.projectPath);
        this.sendToInstance(instanceId, {
          type: 'agent_response',
          ...response
        });
        break;
      case 'agent_request':
        // Handle WebSocket agent requests from Claude Code
        this.handleAgentRequest(instanceId, message);
        break;
      default:
        this.logger.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse message from ${instanceId}:`, error);
    }
  }

  async handleAgentRequest(instanceId, message) {
    try {
      this.logger.log(`🎯 Agent request: ${message.agentName} from ${instanceId}`);
      
      // Route to actual agent and get response
      const agentResponse = await this.routeToAlexAndTeam(message.message, instanceId, message.projectPath);
      
      // Send response back with request ID for tracking
      this.sendToInstance(instanceId, {
        type: 'agent_response',
        requestId: message.requestId,
        response: agentResponse.response || agentResponse.message || agentResponse,
        agent: message.agentName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error(`Failed to handle agent request from ${instanceId}:`, error);
      
      // Send error response
      this.sendToInstance(instanceId, {
        type: 'agent_response',
        requestId: message.requestId,
        error: error.message,
        agent: message.agentName,
        timestamp: new Date().toISOString()
      });
    }
  }

  routeAgentMessage(sourceInstanceId, message) {
    // Broadcast to all connected instances or route to specific instance
    if (message.targetInstance) {
      this.sendToInstance(message.targetInstance, {
        type: 'agent_response',
        source: sourceInstanceId,
        ...message
      });
    } else {
      // Broadcast to all instances
      this.connections.forEach((ws, instanceId) => {
        if (instanceId !== sourceInstanceId && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_response',
            source: sourceInstanceId,
            ...message
          }));
        }
      });
    }
  }

  handleContextShare(sourceInstanceId, message) {
    // Share context with specified instances or all instances
    const targets = message.targetInstances || Array.from(this.connections.keys());

    targets.forEach(targetId => {
      if (targetId !== sourceInstanceId) {
        this.sendToInstance(targetId, {
          type: 'context_shared',
          source: sourceInstanceId,
          context: message.context,
          timestamp: Date.now()
        });
      }
    });
  }

  sendInstancesList(instanceId) {
    const instances = Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      projectPath: session.projectPath || 'Unknown',
      lastActivity: session.lastActivity,
      messageCount: session.messageCount || 0,
      isActive: this.connections.has(id)
    }));

    this.sendToInstance(instanceId, {
      type: 'instances_list',
      instances: instances,
      totalActive: this.connections.size
    });
  }

  sendToInstance(instanceId, message) {
    const ws = this.connections.get(instanceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  handleDisconnect(instanceId) {
    this.connections.delete(instanceId);
    this.connectedInstances.delete(instanceId);

    if (this.sessions.has(instanceId)) {
      const session = this.sessions.get(instanceId);
      session.disconnectedAt = Date.now();
    }

    this.logger.log(`🔌 Instance disconnected: ${instanceId}`);
  }

  loadSessions() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        const sessions = JSON.parse(data);

        Object.entries(sessions).forEach(([id, session]) => {
          this.sessions.set(id, session);
        });

        this.logger.log(`📁 Loaded ${this.sessions.size} sessions`);
      }
    } catch (error) {
      this.logger.error('Failed to load sessions:', error);
    }
  }

  saveSessions() {
    try {
      const sessionsObj = {};
      this.sessions.forEach((session, id) => {
        sessionsObj[id] = session;
      });

      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      this.logger.error('Failed to save sessions:', error);
    }
  }

  startPeriodicCleanup() {
    const CLEANUP_INTERVAL = 3600000; // 1 hour
    setInterval(() => {
      const now = Date.now();
      const STALE_THRESHOLD = 86400000; // 24 hours

      let cleaned = 0;
      this.sessions.forEach((session, id) => {
        if (session.disconnectedAt && (now - session.disconnectedAt) > STALE_THRESHOLD) {
          this.sessions.delete(id);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        this.logger.log(`🧹 Cleaned ${cleaned} stale sessions`);
        this.saveSessions();
      }
    }, CLEANUP_INTERVAL);
  }

  async writePidFile() {
    const weeDir = path.join(os.homedir(), '.paired');
    if (!fs.existsSync(weeDir)) {
      fs.mkdirSync(weeDir, { recursive: true });
    }

    fs.writeFileSync(this.pidFile, process.pid.toString());
    this.logger.log(`✅ PID file written: ${this.pidFile}`);
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      this.logger.log('🛑 Shutting down Unified CASCADE Bridge...');

      // Save sessions before shutdown
      this.saveSessions();

      // Close all WebSocket connections
      this.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      // Close server
      if (this.server) {
        this.server.close();
      }

      // Remove PID file
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }

      this.logger.log('✅ Unified CASCADE Bridge shut down');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      this.logger.error('❌ Uncaught exception:', error);
      shutdown();
    });
  }
}

// Start the unified bridge if run directly
if (require.main === module) {
  const bridge = new UnifiedCascadeBridge();
  bridge.start();
}

module.exports = UnifiedCascadeBridge;
