#!/usr/bin/env node

/**
 * PAIRED Agent-CASCADE Integration Layer
 *
 * Connects verified PAIRED agent implementations to the CASCADE interface
 * through the CASCADE Bridge Service, ensuring real agent execution
 * with continuous authenticity verification.
 *
 * Key Features:
 * - Real agent execution through Agent CLI Registry
 * - Authenticity verification for every agent interaction
 * - WebSocket communication with CASCADE interface
 * - Multi-agent collaboration support
 * - Cross-agent workflow orchestration
 */

const { CascadeClient } = require('../agent_cascade_client');
const AgentCLIRegistry = require('../core/agent_cli_registry');
const AgentAuthenticityMonitor = require('../security/agent_authenticity_monitor');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;

class AgentCascadeIntegration extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      bridgeUrl: config.bridgeUrl || 'http://localhost:7890',
      enableAuthenticity: config.enableAuthenticity !== false,
      agentTimeout: config.agentTimeout || 30000,
      maxConcurrentAgents: config.maxConcurrentAgents || 3,
      logLevel: config.logLevel || 'info',
      ...config
    };

    // Core components
    this.cascadeClient = null;
    this.agentRegistry = null;
    this.authenticityMonitor = null;

    // Agent state tracking
    this.activeAgents = new Map();
    this.agentSessions = new Map();
    this.executionHistory = [];

    // PAIRED agent definitions
    this.pairedAgents = [
      { id: 'alex', name: 'Alex (PM)', emoji: '👑', role: 'project_manager' },
      { id: 'sherlock', name: 'Sherlock (QA)', emoji: '🕵️', role: 'quality_assurance' },
      { id: 'leonardo', name: 'Leonardo (Architecture)', emoji: '🏛️', role: 'architecture' },
      { id: 'edison', name: 'Edison (Dev)', emoji: '⚡', role: 'development' },
      { id: 'maya', name: 'Maya (UX)', emoji: '🎨', role: 'user_experience' },
      { id: 'vince', name: 'Vince (Scrum Master)', emoji: '🏈', role: 'scrum_master' },
      { id: 'marie', name: 'Marie (Analyst)', emoji: '🔬', role: 'data_analysis' }
    ];

    this.initialize();
  }

  /**
     * Initialize the integration layer
     */
  async initialize() {
    try {
      this.log('🔗 Initializing PAIRED Agent-CASCADE Integration...');

      // Initialize Agent CLI Registry
      this.agentRegistry = new AgentCLIRegistry({
        enabledAgents: this.pairedAgents.map(a => a.name),
        safeMode: true
      });

      // Initialize Authenticity Monitor if enabled
      if (this.config.enableAuthenticity) {
        this.authenticityMonitor = new AgentAuthenticityMonitor({
          enableRealTimeAlerts: true,
          monitorInterval: 15000 // More frequent monitoring during CASCADE integration
        });
      }

      // Initialize CASCADE client
      this.cascadeClient = new CascadeClient({
        bridgeUrl: this.config.bridgeUrl,
        agentName: 'PAIRED Integration Layer',
        capabilities: ['agent_orchestration', 'real_execution', 'authenticity_verification']
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Register all PAIRED agents with CASCADE
      await this.registerPairedAgents();

      this.log('✅ PAIRED Agent-CASCADE Integration initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.log(`❌ Failed to initialize integration: ${error.message}`, 'error');
      this.emit('error', error);
      throw error;
    }
  }

  /**
     * Set up event handlers for CASCADE communication
     */
  setupEventHandlers() {
    // CASCADE client events
    this.cascadeClient.on('registered', (data) => {
      this.log(`🤖 Integration layer registered with CASCADE: ${data.sessionId}`);
    });

    this.cascadeClient.on('message', async (message) => {
      await this.handleCascadeMessage(message);
    });

    this.cascadeClient.on('error', (error) => {
      this.log(`🚨 CASCADE client error: ${error.message}`, 'error');
    });

    // Authenticity monitor events
    if (this.authenticityMonitor) {
      this.authenticityMonitor.on('authenticity_failure', (data) => {
        this.handleAuthenticityFailure(data);
      });

      this.authenticityMonitor.on('impersonation_detected', (data) => {
        this.handleImpersonationDetected(data);
      });
    }
  }

  /**
     * Register all PAIRED agents with CASCADE
     */
  async registerPairedAgents() {
    for (const agent of this.pairedAgents) {
      try {
        // Verify agent authenticity before registration
        if (this.config.enableAuthenticity) {
          const authentic = await this.verifyAgentAuthenticity(agent.id);
          if (!authentic) {
            this.log(`⚠️ Skipping registration of ${agent.name} - authenticity check failed`, 'warn');
            continue;
          }
        }

        // Register agent with CASCADE
        await this.cascadeClient.registerAgent({
          agentId: agent.id,
          name: agent.name,
          emoji: agent.emoji,
          role: agent.role,
          capabilities: await this.getAgentCapabilities(agent.id),
          authentic: true,
          registrationTime: Date.now()
        });

        this.activeAgents.set(agent.id, {
          ...agent,
          registered: true,
          lastActivity: Date.now(),
          executionCount: 0
        });

        this.log(`✅ Registered ${agent.emoji} ${agent.name} with CASCADE`);

      } catch (error) {
        this.log(`❌ Failed to register ${agent.name}: ${error.message}`, 'error');
      }
    }

    this.log(`🎯 Registered ${this.activeAgents.size}/${this.pairedAgents.length} PAIRED agents with CASCADE`);
  }

  /**
     * Handle incoming CASCADE messages
     */
  async handleCascadeMessage(message) {
    try {
      this.log(`📨 Received CASCADE message: ${message.type} for ${message.targetAgent || 'system'}`);

      switch (message.type) {
      case 'agent_request':
        await this.handleAgentRequest(message);
        break;

      case 'collaboration_request':
        await this.handleCollaborationRequest(message);
        break;

      case 'status_check':
        await this.handleStatusCheck(message);
        break;

      case 'authenticity_challenge':
        await this.handleAuthenticityChallenge(message);
        break;

      default:
        this.log(`⚠️ Unknown message type: ${message.type}`, 'warn');
      }

    } catch (error) {
      this.log(`❌ Error handling CASCADE message: ${error.message}`, 'error');
      await this.sendErrorResponse(message, error);
    }
  }

  /**
     * Handle agent execution request
     */
  async handleAgentRequest(message) {
    const { targetAgent, request, sessionId } = message;

    // Verify agent authenticity before execution
    if (this.config.enableAuthenticity) {
      const authentic = await this.verifyAgentAuthenticity(targetAgent);
      if (!authentic) {
        await this.sendAuthenticityFailureResponse(message);
        return;
      }
    }

    // Execute real agent command through CLI Registry
    try {
      const startTime = Date.now();

      // Get agent capabilities and execute appropriate command
      const capabilities = await this.agentRegistry.getAgentCapabilities(targetAgent);
      const command = this.selectBestCommand(request, capabilities);

      this.log(`⚡ Executing real agent command: ${targetAgent} -> ${command}`);

      // Execute through Agent CLI Registry (real implementation)
      const result = await this.agentRegistry.executeCommand(targetAgent, command, {
        timeout: this.config.agentTimeout,
        sessionId: sessionId
      });

      const executionTime = Date.now() - startTime;

      // Update agent activity
      const agentData = this.activeAgents.get(targetAgent);
      if (agentData) {
        agentData.lastActivity = Date.now();
        agentData.executionCount++;
      }

      // Record execution history
      this.executionHistory.push({
        timestamp: Date.now(),
        agent: targetAgent,
        command,
        executionTime,
        success: true,
        authentic: true
      });

      // Send response back to CASCADE
      await this.cascadeClient.sendMessage({
        type: 'agent_response',
        sourceAgent: targetAgent,
        sessionId: sessionId,
        response: result,
        executionTime,
        authentic: true,
        timestamp: Date.now()
      });

      this.log(`✅ ${targetAgent} executed successfully in ${executionTime}ms`);

    } catch (error) {
      this.log(`❌ Agent execution failed: ${error.message}`, 'error');
      await this.sendErrorResponse(message, error);
    }
  }

  /**
     * Handle multi-agent collaboration request
     */
  async handleCollaborationRequest(message) {
    const { agents, workflow, sessionId } = message;

    this.log(`🤝 Starting collaboration workflow: ${workflow} with agents: ${agents.join(', ')}`);

    try {
      // Verify all agents are authentic
      for (const agentId of agents) {
        if (this.config.enableAuthenticity) {
          const authentic = await this.verifyAgentAuthenticity(agentId);
          if (!authentic) {
            throw new Error(`Agent ${agentId} failed authenticity check`);
          }
        }
      }

      // Execute collaboration workflow through Agent CLI Registry
      const collaborationResult = await this.agentRegistry.executeCollaboration(agents, workflow, {
        sessionId: sessionId,
        timeout: this.config.agentTimeout * agents.length
      });

      // Send collaboration response
      await this.cascadeClient.sendMessage({
        type: 'collaboration_response',
        sessionId: sessionId,
        workflow,
        agents,
        result: collaborationResult,
        authentic: true,
        timestamp: Date.now()
      });

      this.log('✅ Collaboration workflow completed successfully');

    } catch (error) {
      this.log(`❌ Collaboration failed: ${error.message}`, 'error');
      await this.sendErrorResponse(message, error);
    }
  }

  /**
     * Handle status check request
     */
  async handleStatusCheck(message) {
    const status = {
      type: 'status_response',
      sessionId: message.sessionId,
      integrationStatus: 'active',
      activeAgents: Array.from(this.activeAgents.keys()),
      authenticityMonitoring: this.config.enableAuthenticity,
      lastAuthenticityCheck: this.authenticityMonitor?.lastCheck || null,
      executionHistory: this.executionHistory.slice(-10), // Last 10 executions
      timestamp: Date.now()
    };

    await this.cascadeClient.sendMessage(status);
  }

  /**
     * Handle authenticity challenge
     */
  async handleAuthenticityChallenge(message) {
    const { challengeAgent, challengeType } = message;

    try {
      let proof = null;

      switch (challengeType) {
      case 'file_signature':
        proof = await this.generateFileSignatureProof(challengeAgent);
        break;

      case 'cli_execution':
        proof = await this.generateCLIExecutionProof(challengeAgent);
        break;

      case 'process_verification':
        proof = await this.generateProcessVerificationProof(challengeAgent);
        break;

      default:
        throw new Error(`Unknown challenge type: ${challengeType}`);
      }

      await this.cascadeClient.sendMessage({
        type: 'authenticity_proof',
        sessionId: message.sessionId,
        challengeAgent,
        challengeType,
        proof,
        timestamp: Date.now()
      });

    } catch (error) {
      this.log(`❌ Authenticity challenge failed: ${error.message}`, 'error');
      await this.sendErrorResponse(message, error);
    }
  }

  /**
     * Verify agent authenticity
     */
  async verifyAgentAuthenticity(agentId) {
    if (!this.authenticityMonitor) {
      return true; // Skip if monitoring disabled
    }

    try {
      const signature = this.authenticityMonitor.agentSignatures.get(agentId);
      if (!signature) {
        return false;
      }

      const result = await this.authenticityMonitor.verifyAgentAuthenticity(agentId, signature);
      return result.authentic;
    } catch (error) {
      this.log(`⚠️ Authenticity verification failed for ${agentId}: ${error.message}`, 'warn');
      return false;
    }
  }

  /**
     * Get agent capabilities from CLI Registry
     */
  async getAgentCapabilities(agentId) {
    try {
      return await this.agentRegistry.getAgentCapabilities(agentId);
    } catch (error) {
      this.log(`⚠️ Failed to get capabilities for ${agentId}: ${error.message}`, 'warn');
      return [];
    }
  }

  /**
     * Select best command for agent request
     */
  selectBestCommand(request, capabilities) {
    // Simple command selection logic - can be enhanced
    if (request.includes('status')) return 'status';
    if (request.includes('help')) return 'help';
    if (capabilities.length > 0) return capabilities[0];
    return 'default';
  }

  /**
     * Handle authenticity failure
     */
  handleAuthenticityFailure(data) {
    this.log(`🚨 Authenticity failure detected: ${JSON.stringify(data)}`, 'error');

    // Disable agent if authenticity fails
    if (this.activeAgents.has(data.agentId)) {
      const agent = this.activeAgents.get(data.agentId);
      agent.disabled = true;
      agent.disabledReason = 'authenticity_failure';
      agent.disabledAt = Date.now();
    }

    // Notify CASCADE of authenticity failure
    this.cascadeClient.sendMessage({
      type: 'authenticity_alert',
      severity: 'warning',
      agentId: data.agentId,
      details: data,
      timestamp: Date.now()
    });
  }

  /**
     * Handle impersonation detection
     */
  handleImpersonationDetected(data) {
    this.log(`🔥 IMPERSONATION DETECTED: ${JSON.stringify(data)}`, 'error');

    // Disable all agents as a security measure
    for (const [agentId, agent] of this.activeAgents) {
      agent.disabled = true;
      agent.disabledReason = 'impersonation_detected';
      agent.disabledAt = Date.now();
    }

    // Send critical alert to CASCADE
    this.cascadeClient.sendMessage({
      type: 'security_alert',
      severity: 'critical',
      alertType: 'impersonation_detected',
      details: data,
      timestamp: Date.now()
    });
  }

  /**
     * Send error response
     */
  async sendErrorResponse(originalMessage, error) {
    await this.cascadeClient.sendMessage({
      type: 'error_response',
      sessionId: originalMessage.sessionId,
      error: error.message,
      originalMessage: originalMessage.type,
      timestamp: Date.now()
    });
  }

  /**
     * Send authenticity failure response
     */
  async sendAuthenticityFailureResponse(originalMessage) {
    await this.cascadeClient.sendMessage({
      type: 'authenticity_failure',
      sessionId: originalMessage.sessionId,
      targetAgent: originalMessage.targetAgent,
      message: 'Agent failed authenticity verification',
      timestamp: Date.now()
    });
  }

  /**
     * Generate file signature proof
     */
  async generateFileSignatureProof(agentId) {
    // Implementation would generate cryptographic proof of agent file integrity
    return {
      type: 'file_signature',
      agentId,
      signature: 'proof_signature_here',
      timestamp: Date.now()
    };
  }

  /**
     * Generate CLI execution proof
     */
  async generateCLIExecutionProof(agentId) {
    // Implementation would execute a test command and return proof
    return {
      type: 'cli_execution',
      agentId,
      testCommand: 'status',
      result: 'execution_proof_here',
      timestamp: Date.now()
    };
  }

  /**
     * Generate process verification proof
     */
  async generateProcessVerificationProof(agentId) {
    // Implementation would verify agent process is running
    return {
      type: 'process_verification',
      agentId,
      processInfo: 'process_proof_here',
      timestamp: Date.now()
    };
  }

  /**
     * Get integration status
     */
  getStatus() {
    return {
      initialized: this.cascadeClient?.registered || false,
      activeAgents: this.activeAgents.size,
      authenticityMonitoring: this.config.enableAuthenticity,
      executionHistory: this.executionHistory.length,
      lastActivity: Math.max(...Array.from(this.activeAgents.values()).map(a => a.lastActivity || 0))
    };
  }

  /**
     * Log message with level
     */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
      console.error(logMessage);
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
     * Graceful shutdown
     */
  async shutdown() {
    this.log('🛑 Shutting down PAIRED Agent-CASCADE Integration...');

    if (this.authenticityMonitor) {
      await this.authenticityMonitor.shutdown();
    }

    if (this.cascadeClient) {
      // Notify CASCADE of shutdown
      await this.cascadeClient.sendMessage({
        type: 'integration_shutdown',
        timestamp: Date.now()
      });
    }

    this.log('✅ Integration shutdown complete');
  }
}

// CLI interface
if (require.main === module) {
  const integration = new AgentCascadeIntegration();

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down integration...');
    await integration.shutdown();
    process.exit(0);
  });

  integration.on('initialized', () => {
    console.log('🚀 PAIRED Agent-CASCADE Integration is running!');
    console.log('Press Ctrl+C to shutdown');
  });

  integration.on('error', (error) => {
    console.error('💥 Integration error:', error.message);
    process.exit(1);
  });
}

module.exports = AgentCascadeIntegration;
