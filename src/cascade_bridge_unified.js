#!/usr/bin/env node

/**
 * Unified CASCADE Bridge Service
 * 
 * Intelligently merged from all CASCADE bridge implementations:
 * - Global daemon architecture with lifecycle management
 * - Multi-instance WebSocket handling with session persistence
 * - Direct CASCADE UI integration for agent chat
 * - Memory management and crash recovery
 * - Per-project context isolation
 * 
 * This is the SINGLE, AUTHORITATIVE CASCADE bridge service.
 * Located in /src for proper WEE repository inclusion.
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class UnifiedCascadeBridge extends EventEmitter {
  constructor() {
    super();
    
    // Configuration
    this.port = process.env.CASCADE_BRIDGE_PORT || 7890;
    this.configPath = path.join(process.env.HOME, '.wee', 'config', 'cascade-global.json');
    this.logPath = path.join(process.env.HOME, '.wee', 'logs', 'cascade-bridge.log');
    this.sessionsPath = path.join(process.env.HOME, '.wee', 'cascade_bridge', 'sessions.json');
    
    // Core state
    this.instances = new Map(); // instanceId -> { ws, projectPath, context, agents, lastSeen }
    this.agents = new Map();    // agentId -> { name, emoji, capabilities, instanceIds }
    this.sessions = new Map();  // instanceId -> persistent session data
    this.messageQueue = [];     // Memory-limited message queue
    
    // Server components
    this.app = null;
    this.server = null;
    this.wss = null;
    
    // Lifecycle management
    this.startTime = Date.now();
    this.isShuttingDown = false;
    this.heartbeatInterval = null;
    this.maxMemoryBytes = 512 * 1024 * 1024; // 512MB
    this.maxInstances = 3;
    
    // CASCADE API Integration
    this.cascadeAPI = {
      qa: { name: 'Sherlock (QA)', emoji: '🕵️' },
      architecture: { name: 'Leonardo (Architecture)', emoji: '🏛️' },
      dev: { name: 'Edison (Dev)', emoji: '⚡' },
      pm: { name: 'Alex (PM)', emoji: '👑' },
      ux: { name: 'Maya (UX)', emoji: '🎨' },
      scrum: { name: 'Vince (Scrum)', emoji: '🏈' },
      analyst: { name: 'Marie (Analyst)', emoji: '🔬' }
    };
  }

  async initialize() {
    try {
      await this.loadConfig();
      await this.setupLogging();
      await this.loadSessions();
      await this.startServer();
      await this.setupHeartbeat();
      
      this.log('✅ Unified CASCADE Bridge initialized successfully');
      this.log(`🌐 WebSocket server running on port ${this.port}`);
      this.log(`📁 Logs: ${this.logPath}`);
      
      return true;
    } catch (error) {
      this.error('Failed to initialize Unified CASCADE Bridge', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      // Apply config overrides
      if (this.config.bridge?.port) this.port = this.config.bridge.port;
      if (this.config.bridge?.maxInstances) this.maxInstances = this.config.bridge.maxInstances;
      if (this.config.bridge?.maxMemoryMB) this.maxMemoryBytes = this.config.bridge.maxMemoryMB * 1024 * 1024;
      
    } catch (error) {
      this.log('⚠️ Using default config (config file not found)');
      this.config = { bridge: {}, agents: {}, lifecycle: {} };
    }
  }

  async setupLogging() {
    const logDir = path.dirname(this.logPath);
    await fs.mkdir(logDir, { recursive: true });
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - INFO: ${message}`;
    console.log(logEntry);
    
    // Async write to log file
    fs.appendFile(this.logPath, logEntry + '\n').catch(() => {});
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? ` - ${error.message}` : '';
    const logEntry = `${timestamp} - ERROR: ${message}${errorDetails}`;
    console.error(logEntry);
    
    // Async write to log file
    fs.appendFile(this.logPath, logEntry + '\n').catch(() => {});
  }

  async loadSessions() {
    try {
      const sessionsDir = path.dirname(this.sessionsPath);
      await fs.mkdir(sessionsDir, { recursive: true });
      
      const sessionsData = await fs.readFile(this.sessionsPath, 'utf8');
      const sessions = JSON.parse(sessionsData);
      
      for (const [instanceId, sessionData] of Object.entries(sessions)) {
        this.sessions.set(instanceId, sessionData);
      }
      
      this.log(`📂 Loaded ${this.sessions.size} persistent sessions`);
    } catch (error) {
      this.log('📂 No existing sessions found, starting fresh');
    }
  }

  async saveSessions() {
    try {
      const sessionsData = {};
      for (const [instanceId, sessionData] of this.sessions.entries()) {
        sessionsData[instanceId] = sessionData;
      }
      
      await fs.writeFile(this.sessionsPath, JSON.stringify(sessionsData, null, 2));
    } catch (error) {
      this.error('Failed to save sessions', error);
    }
  }

  async startServer() {
    // Express app for REST endpoints
    this.app = express();
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        instances: this.instances.size,
        agents: this.agents.size,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      });
    });
    
    // Agent registration endpoint
    this.app.post('/register-agent', (req, res) => {
      try {
        const { id, name, emoji, capabilities, projectPath, instanceId } = req.body;
        
        if (!id || !name || !instanceId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Register agent
        this.agents.set(id, {
          name,
          emoji,
          capabilities: capabilities || [],
          instanceIds: [instanceId],
          projectPath,
          registeredAt: Date.now()
        });
        
        // Associate with instance
        const instance = this.instances.get(instanceId);
        if (instance) {
          if (!instance.agents) instance.agents = [];
          instance.agents.push(id);
        }
        
        this.log(`🤖 Agent registered: ${emoji} ${name} (${id})`);
        
        // Broadcast agent availability
        this.broadcastToAllInstances({
          type: 'agent-registered',
          agent: { id, name, emoji, capabilities }
        }, instanceId);
        
        res.json({ success: true, agentId: id });
      } catch (error) {
        this.error('Agent registration failed', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    });
    
    // CASCADE comment injection endpoint
    this.app.post('/cascade/comment', (req, res) => {
      try {
        const { agentId, message, projectPath } = req.body;
        
        if (!agentId || !message) {
          return res.status(400).json({ error: 'Missing agentId or message' });
        }
        
        const agent = this.agents.get(agentId);
        if (!agent) {
          return res.status(404).json({ error: `Agent not found: ${agentId}` });
        }
        
        // Route message to appropriate instances
        this.routeAgentMessage(agentId, {
          type: 'agent-message',
          agentId,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          message,
          projectPath,
          timestamp: Date.now()
        });
        
        this.log(`💬 Message from ${agent.emoji} ${agent.name}: ${message.substring(0, 50)}...`);
        res.json({ success: true });
      } catch (error) {
        this.error('Message routing failed', error);
        res.status(500).json({ error: 'Message routing failed' });
      }
    });
    
    // Create HTTP server
    this.server = http.createServer(this.app);
    
    // WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws, req) => {
      const instanceId = uuidv4();
      this.handleNewConnection(ws, instanceId, req);
    });
    
    // Start listening
    await new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  handleNewConnection(ws, instanceId, req) {
    this.log(`🔌 New Windsurf instance connected: ${instanceId}`);
    
    // Check instance limit
    if (this.instances.size >= this.maxInstances) {
      this.log(`⚠️ Instance limit reached (${this.maxInstances}), dropping oldest`);
      const oldestInstance = Array.from(this.instances.keys())[0];
      this.handleDisconnect(oldestInstance);
    }
    
    // Store instance
    this.instances.set(instanceId, {
      ws,
      instanceId,
      projectPath: null,
      context: {},
      agents: [],
      lastSeen: Date.now(),
      connectedAt: Date.now()
    });
    
    // Set up WebSocket handlers
    ws.on('message', (data) => {
      this.handleMessage(instanceId, data.toString());
    });
    
    ws.on('close', () => {
      this.handleDisconnect(instanceId);
    });
    
    ws.on('error', (error) => {
      this.error(`WebSocket error for ${instanceId}`, error);
      this.handleDisconnect(instanceId);
    });
    
    // Send welcome message
    this.sendToInstance(instanceId, {
      type: 'welcome',
      instanceId,
      availableAgents: Array.from(this.agents.keys()),
      serverInfo: {
        version: '1.0.0',
        startTime: this.startTime,
        capabilities: ['multi-instance', 'session-persistence', 'cascade-integration']
      }
    });
  }

  handleMessage(instanceId, rawMessage) {
    try {
      const message = JSON.parse(rawMessage);
      const instance = this.instances.get(instanceId);
      
      if (!instance) {
        this.error(`Message from unknown instance: ${instanceId}`);
        return;
      }
      
      instance.lastSeen = Date.now();
      
      switch (message.type) {
        case 'register':
          this.handleInstanceRegistration(instanceId, message);
          break;
          
        case 'agent-message':
          this.routeAgentMessage(instanceId, message);
          break;
          
        case 'context-share':
          this.handleContextShare(instanceId, message);
          break;
          
        case 'heartbeat':
          this.sendToInstance(instanceId, { type: 'heartbeat-ack' });
          break;
          
        case 'project-info':
          instance.projectPath = message.projectPath;
          instance.context = { ...instance.context, ...message.context };
          break;
          
        default:
          this.log(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.error(`Failed to handle message from ${instanceId}`, error);
    }
  }

  handleInstanceRegistration(instanceId, message) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    instance.projectPath = message.projectPath;
    instance.context = message.context || {};
    
    // Create or restore session
    let session = this.sessions.get(instanceId);
    if (!session) {
      session = {
        instanceId,
        projectPath: message.projectPath,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      this.sessions.set(instanceId, session);
    }
    
    session.lastActive = Date.now();
    
    this.log(`📝 Instance registered: ${instanceId} (${message.projectPath})`);
    
    // Send available agents
    this.sendToInstance(instanceId, {
      type: 'agents-available',
      agents: Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        capabilities: agent.capabilities
      }))
    });
    
    this.saveSessions();
  }

  routeAgentMessage(sourceInstanceId, message) {
    // Add to message queue with memory management
    this.messageQueue.push({
      ...message,
      sourceInstanceId,
      timestamp: Date.now()
    });
    
    // Memory management
    while (this.getMemoryUsage() > this.maxMemoryBytes && this.messageQueue.length > 0) {
      this.messageQueue.shift(); // Drop oldest message
    }
    
    // Route to appropriate instances
    if (message.targetInstanceId) {
      // Route to specific instance
      this.sendToInstance(message.targetInstanceId, message);
    } else {
      // Broadcast to all instances
      this.broadcastToAllInstances(message, sourceInstanceId);
    }
    
    // CASCADE UI Integration
    this.integrateWithCascadeUI(message);
  }

  integrateWithCascadeUI(message) {
    // This is where we integrate with Windsurf's CASCADE chat interface
    if (message.type === 'agent-message') {
      // Try to surface in CASCADE UI if available
      if (typeof global !== 'undefined' && global.CASCADE_API) {
        global.CASCADE_API.receiveAgentMessage({
          agentId: message.agentId,
          name: message.agentName,
          emoji: message.agentEmoji,
          message: message.message,
          timestamp: message.timestamp
        });
      }
    }
  }

  handleContextShare(sourceInstanceId, message) {
    // Share context across instances
    const sharedContext = {
      type: 'shared-context',
      sourceInstanceId,
      context: message.context,
      timestamp: Date.now()
    };
    
    this.broadcastToAllInstances(sharedContext, sourceInstanceId);
  }

  sendToInstance(instanceId, message) {
    const instance = this.instances.get(instanceId);
    if (instance && instance.ws.readyState === WebSocket.OPEN) {
      instance.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcastToAllInstances(message, excludeInstanceId = null) {
    let sent = 0;
    for (const [instanceId, instance] of this.instances.entries()) {
      if (instanceId !== excludeInstanceId && instance.ws.readyState === WebSocket.OPEN) {
        instance.ws.send(JSON.stringify(message));
        sent++;
      }
    }
    return sent;
  }

  handleDisconnect(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    this.log(`🔌 Instance disconnected: ${instanceId}`);
    
    // Clean up agents associated with this instance
    for (const [agentId, agent] of this.agents.entries()) {
      agent.instanceIds = agent.instanceIds.filter(id => id !== instanceId);
      if (agent.instanceIds.length === 0) {
        this.agents.delete(agentId);
        this.log(`🤖 Agent removed: ${agent.emoji} ${agent.name}`);
      }
    }
    
    // Remove instance
    this.instances.delete(instanceId);
    
    // Update session
    const session = this.sessions.get(instanceId);
    if (session) {
      session.lastActive = Date.now();
      this.saveSessions();
    }
    
    // Check if we should shut down
    if (this.instances.size === 0 && this.config.lifecycle?.autoShutdown) {
      this.log('🛑 No instances connected, scheduling shutdown...');
      setTimeout(() => {
        if (this.instances.size === 0) {
          this.shutdown();
        }
      }, 30000); // 30 second grace period
    }
  }

  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute timeout
      
      for (const [instanceId, instance] of this.instances.entries()) {
        if (now - instance.lastSeen > timeout) {
          this.log(`💔 Instance ${instanceId} timed out`);
          this.handleDisconnect(instanceId);
        } else {
          // Send heartbeat
          this.sendToInstance(instanceId, { type: 'heartbeat' });
        }
      }
    }, 30000); // Every 30 seconds
  }

  getMemoryUsage() {
    return process.memoryUsage().heapUsed;
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    this.log('🛑 Shutting down Unified CASCADE Bridge...');
    
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all WebSocket connections
    for (const [instanceId, instance] of this.instances.entries()) {
      instance.ws.close();
    }
    
    // Save sessions
    await this.saveSessions();
    
    // Close server
    if (this.server) {
      this.server.close();
    }
    
    this.log('✅ Unified CASCADE Bridge shut down gracefully');
    process.exit(0);
  }
}

// Initialize and start the unified bridge
const bridge = new UnifiedCascadeBridge();

// Handle process signals
process.on('SIGTERM', () => bridge.shutdown());
process.on('SIGINT', () => bridge.shutdown());

// Start the bridge
bridge.initialize().catch((error) => {
  console.error('❌ Failed to start Unified CASCADE Bridge:', error);
  process.exit(1);
});

module.exports = UnifiedCascadeBridge;
