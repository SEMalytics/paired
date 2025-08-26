/**
 * PAIRED (Platform for AI-Enabled Remote Development) Main Entry Point
 *
 * Central orchestration system for AI-powered knowledge management
 * with Claude Code integration and unified agent architecture.
 *
 * Philosophy: "Intelligent Orchestration with Seamless Integration"
 * - Unified system initialization and coordination
 * - Graceful startup and shutdown procedures
 * - Comprehensive error handling and recovery
 * - Production-ready monitoring and health checks
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const EventEmitter = require('events');

// Import core components
const ClaudeOrchestrator = require('./claude_orchestrator');
const AgentFactory = require('../core/agents/agent_factory');
const SharedMemorySystem = require('../core/infrastructure/shared_memory');
const { CLICleanup, safeExit } = require('../shared/cli_cleanup');

class PAIREDSystem extends EventEmitter {
  constructor(configPath = null) {
    super();

    this.configPath = configPath || path.join(__dirname, 'config', 'paired_config.yml');
    this.config = null;
    this.orchestrator = null;
    this.agentFactory = null;
    this.memorySystem = null;
    this.isInitialized = false;
    this.isShuttingDown = false;

    // Performance tracking
    this.startTime = Date.now();
    this.metrics = {
      requests: 0,
      errors: 0,
      agentTasks: 0,
      tokensSaved: 0
    };

    console.log('🚀 PAIRED System initializing...');

    // Use singleton CLI cleanup to prevent hanging
    this.cliCleanup = require('./shared/cli_cleanup');
  }

  /**
   * Initialize the PAIRED system
   */
  async initialize() {
    try {
      console.log('📋 Loading configuration...');
      await this.loadConfiguration();

      console.log('🧠 Initializing shared memory system...');
      await this.initializeMemorySystem();

      console.log('🎯 Initializing Claude orchestrator...');
      await this.initializeOrchestrator();

      console.log('🏭 Initializing agent factory...');
      await this.initializeAgentFactory();

      console.log('🤖 Loading and initializing agents...');
      await this.initializeAgents();

      console.log('📊 Setting up monitoring and health checks...');
      await this.setupMonitoring();

      console.log('🔧 Setting up signal handlers...');
      this.setupSignalHandlers();

      this.isInitialized = true;

      console.log('✅ PAIRED System initialized successfully');
      console.log(`🎯 System ready in ${Date.now() - this.startTime}ms`);

      this.emit('initialized', {
        startTime: this.startTime,
        initializationTime: Date.now() - this.startTime,
        agents: this.agentFactory.getAllAgents().length
      });

      return this;
    } catch (error) {
      console.error('❌ Failed to initialize PAIRED System:', error.message);
      this.emit('initializationFailed', { error: error.message });
      throw error;
    }
  }

  /**
   * Load system configuration
   */
  async loadConfiguration() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = yaml.load(configContent);

      // Validate configuration
      this.validateConfiguration();

      console.log(`📄 Configuration loaded: ${this.config.system?.name || 'PAIRED System'}`);
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);

      // Use default configuration
      this.config = this.getDefaultConfiguration();
      console.log('⚠️ Using default configuration');
    }
  }

  /**
   * Initialize shared memory system
   */
  async initializeMemorySystem() {
    const memoryConfig = this.config.memory || {};
    this.memorySystem = new SharedMemorySystem(memoryConfig);
    await this.memorySystem.initialize();

    console.log('🧠 Shared memory system initialized');
  }

  /**
   * Initialize Claude orchestrator
   */
  async initializeOrchestrator() {
    const orchestrationConfig = this.config.orchestration || {};
    this.orchestrator = new ClaudeOrchestrator(orchestrationConfig);
    this.orchestrator.memoryManager = this.memorySystem;

    // Set up orchestrator event listeners
    this.orchestrator.on('operationCompleted', (data) => {
      this.metrics.requests++;
      this.metrics.tokensSaved += data.tokensSaved || 0;
      this.emit('operationCompleted', data);
    });

    this.orchestrator.on('operationFailed', (data) => {
      this.metrics.errors++;
      this.emit('operationFailed', data);
    });

    console.log('🎯 Claude orchestrator initialized');
  }

  /**
   * Initialize agent factory
   */
  async initializeAgentFactory() {
    this.agentFactory = new AgentFactory(this.orchestrator);

    // Set up agent factory event listeners
    this.agentFactory.on('agentTaskCompleted', (data) => {
      this.metrics.agentTasks++;
      this.emit('agentTaskCompleted', data);
    });

    this.agentFactory.on('agentTaskFailed', (data) => {
      this.metrics.errors++;
      this.emit('agentTaskFailed', data);
    });

    console.log('🏭 Agent factory initialized');
  }

  /**
   * Initialize agents
   */
  async initializeAgents() {
    await this.agentFactory.loadAgentConfigurations();

    const agentConfig = this.config.agents || {};
    if (agentConfig.auto_initialize !== false) {
      const results = await this.agentFactory.initializeAllAgents();

      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      console.log(`🤖 Agents initialized: ${successCount} success, ${failedCount} failed`);

      if (failedCount > 0) {
        console.warn('⚠️ Some agents failed to initialize. System will continue with available agents.');
      }
    } else {
      console.log('⏸️ Agent auto-initialization disabled');
    }
  }

  /**
   * Set up monitoring and health checks
   */
  async setupMonitoring() {
    const performanceConfig = this.config.performance || {};

    if (performanceConfig.monitoring_enabled !== false) {
      const interval = performanceConfig.metrics_interval || 30000;

      this.monitoringInterval = setInterval(() => {
        this.collectMetrics();
      }, interval);

      console.log(`📊 Monitoring enabled (interval: ${interval}ms)`);
    }

    // Set up health check endpoint
    this.setupHealthCheck();
  }

  /**
   * Set up signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);
        await this.shutdown();
        safeExit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught exception:', error);
      this.emit('uncaughtException', { error: error.message });
      // Don't exit immediately, let the system try to recover
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      this.emit('unhandledRejection', { reason, promise });
    });
  }

  /**
   * Start Workflow Agent Bridge for active agent collaboration
   */
  async startAgentBridge() {
    try {
      // Only start bridge if we're not in CLI mode and agents are available
      const args = process.argv.slice(2);
      if (args.length > 0) {
        // Skip bridge for CLI commands
        return;
      }

      const agents = this.agentFactory?.getAllAgents();
      if (!agents || agents.length === 0) {
        console.log('⏸️ Skipping agent bridge - no agents available');
        return;
      }

      console.log('🌊 Starting PAIRED Agent Communication Bridge...');

      const WorkflowAgentBridge = require('./core/workflow_agent_bridge');
      this.agentBridge = new WorkflowAgentBridge(__dirname);

      // Start monitoring for agent triggers
      await this.agentBridge.startMonitoring();

      // Register bridge cleanup with CLI cleanup system
      this.cliCleanup.addCleanupHandler(() => {
        if (this.agentBridge) {
          this.agentBridge.stopMonitoring();
          this.agentBridge = null;
        }
      });

      console.log('✅ PAIRED Agent Bridge is now ACTIVE!');
      console.log('🎯 Your agents will now participate in your workflow');

    } catch (error) {
      console.warn('⚠️ Failed to start agent bridge:', error.message);
      console.log('💡 Continuing without agent bridge - you can start it manually if needed');
    }
  }

  /**
   * Process a request through the system
   */
  async processRequest(request, context = {}) {
    if (!this.isInitialized) {
      throw new Error('PAIRED system not initialized');
    }

    if (this.isShuttingDown) {
      throw new Error('PAIRED system is shutting down');
    }

    try {
      console.log(`🎯 Processing request: ${request.substring(0, 100)}...`);

      // Find best agent for the request
      const bestAgent = this.agentFactory.findBestAgentForTask(request, context);

      if (!bestAgent) {
        // Fallback to orchestrator
        console.log('🔄 No specific agent found, using orchestrator');
        return await this.orchestrator.orchestrate({
          type: 'general-request',
          request,
          context
        }, context);
      }

      console.log(`🤖 Routing to ${bestAgent.agent.name} (score: ${bestAgent.score.toFixed(2)})`);

      // Process through selected agent
      const result = await bestAgent.agent.processRequest(request, context);

      console.log(`✅ Request processed successfully by ${bestAgent.agent.name}`);

      this.emit('requestProcessed', {
        request: request.substring(0, 100),
        agent: bestAgent.agent.name,
        success: true,
        duration: result.duration
      });

      return result;
    } catch (error) {
      console.error('❌ Request processing failed:', error.message);

      this.emit('requestFailed', {
        request: request.substring(0, 100),
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const uptime = Date.now() - this.startTime;

    return {
      system: {
        name: this.config.system?.name || 'PAIRED System',
        version: this.config.system?.version || '1.0.0',
        environment: this.config.system?.environment || 'development',
        uptime,
        initialized: this.isInitialized,
        shuttingDown: this.isShuttingDown
      },
      metrics: {
        ...this.metrics,
        uptime,
        requestsPerMinute: this.metrics.requests / (uptime / 60000),
        errorRate: this.metrics.errors / Math.max(this.metrics.requests, 1)
      },
      orchestrator: this.orchestrator ? this.orchestrator.getStatus() : null,
      agents: this.agentFactory ? this.agentFactory.getFactoryStatus() : null,
      memory: this.memorySystem ? this.memorySystem.getSystemStatus() : null
    };
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    const status = this.getSystemStatus();

    // Check alert thresholds
    const thresholds = this.config.performance?.alert_thresholds || {};

    if (status.metrics.errorRate > (thresholds.error_rate || 0.1)) {
      console.warn(`⚠️ High error rate: ${(status.metrics.errorRate * 100).toFixed(2)}%`);
      this.emit('highErrorRate', { errorRate: status.metrics.errorRate });
    }

    if (status.memory?.usage > (thresholds.memory_usage || 0.8)) {
      console.warn(`⚠️ High memory usage: ${(status.memory.usage * 100).toFixed(2)}%`);
      this.emit('highMemoryUsage', { usage: status.memory.usage });
    }

    this.emit('metricsCollected', status);
  }

  /**
   * Set up health check
   */
  setupHealthCheck() {
    this.healthCheck = {
      status: 'healthy',
      lastCheck: Date.now(),
      checks: {
        orchestrator: true,
        agents: true,
        memory: true
      }
    };

    // Perform health check
    this.performHealthCheck = () => {
      const status = this.getSystemStatus();

      this.healthCheck.lastCheck = Date.now();
      this.healthCheck.status = 'healthy';
      this.healthCheck.checks = {
        orchestrator: !!this.orchestrator,
        agents: this.agentFactory?.getAllAgents().length > 0,
        memory: !!this.memorySystem
      };

      const unhealthyChecks = Object.entries(this.healthCheck.checks)
        .filter(([_, healthy]) => !healthy)
        .map(([check, _]) => check);

      if (unhealthyChecks.length > 0) {
        this.healthCheck.status = 'unhealthy';
        console.warn(`⚠️ Health check failed: ${unhealthyChecks.join(', ')}`);
      }

      return this.healthCheck;
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.isShuttingDown) {
      console.log('🛑 Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;

    console.log('🛑 Initiating graceful shutdown...');

    try {
      // Clear monitoring interval
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
        console.log('📊 Monitoring stopped');
      }

      // Shutdown agent bridge first
      if (this.agentBridge) {
        console.log('🛑 Shutting down agent bridge...');
        this.agentBridge.stopMonitoring();
        this.agentBridge = null;
        console.log('🌊 Agent bridge shut down');
      }

      // Shutdown agents
      if (this.agentFactory) {
        console.log('🛑 Shutting down all agents...');
        await this.agentFactory.shutdownAllAgents();
        console.log('🤖 All agents shut down');
      }

      // Shutdown orchestrator
      if (this.orchestrator && this.orchestrator.shutdown) {
        await this.orchestrator.shutdown();
        console.log('🎯 Orchestrator shut down');
      }

      // Shutdown memory system
      if (this.memorySystem && this.memorySystem.shutdown) {
        await this.memorySystem.shutdown();
        console.log('🧠 Memory system shut down');
      }

      // Remove all listeners to prevent memory leaks
      this.removeAllListeners();

      console.log('✅ PAIRED System shut down gracefully');

      this.emit('shutdown', {
        uptime: Date.now() - this.startTime,
        metrics: this.metrics
      });

      // Force exit after a short delay to ensure clean shutdown
      setTimeout(() => {
        if (process.env.NODE_ENV !== 'test') {
          process.exit(0);
        }
      }, 100);

    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
      this.emit('shutdownError', { error: error.message });
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration() {
    if (!this.config) {
      throw new Error('Configuration is required');
    }

    // Basic validation
    const requiredSections = ['system'];
    for (const section of requiredSections) {
      if (!this.config[section]) {
        console.warn(`⚠️ Missing configuration section: ${section}`);
      }
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfiguration() {
    return {
      system: {
        name: 'PAIRED System',
        version: '1.0.0',
        environment: 'development'
      },
      orchestration: {
        claude_code: { enabled: true },
        windsurf: { enabled: true }
      },
      agents: {
        auto_initialize: true
      },
      memory: {
        storage_path: './data/memory'
      },
      performance: {
        monitoring_enabled: true
      }
    };
  }
}

// Export main class and components
module.exports = {
  PAIREDSystem,
  ClaudeOrchestrator,
  AgentFactory,
  SharedMemorySystem
};

// CLI execution
if (require.main === module) {
  const main = async () => {
    try {
      const paired = new PAIREDSystem();

      // Set up event listeners
      paired.on('initialized', (data) => {
        console.log(`🎉 System ready with ${data.agents} agents in ${data.initializationTime}ms`);
      });

      paired.on('requestProcessed', (data) => {
        console.log(`✅ ${data.agent} completed request in ${data.duration}ms`);
      });

      paired.on('highErrorRate', (data) => {
        console.warn(`⚠️ High error rate detected: ${(data.errorRate * 100).toFixed(2)}%`);
      });

      // Initialize system
      await paired.initialize();

      // Auto-start Workflow Agent Bridge for active agent collaboration
      await paired.startAgentBridge();

      // Keep the process running
      console.log('🎯 PAIRED System is running. Press Ctrl+C to stop.');

      // CLI usage detection - if arguments provided, process and exit
      const args = process.argv.slice(2);
      if (args.length > 0) {
        const request = args.join(' ');
        console.log(`\n🎯 Processing CLI request: ${request}`);

        try {
          const result = await kf.processRequest(request);
          console.log('📋 Result:', JSON.stringify(result, null, 2));

          // For CLI usage, clean up and exit after processing
          console.log('✅ CLI request completed successfully');
          await kf.shutdown();
          safeExit(0);
        } catch (error) {
          console.error('❌ CLI request failed:', error.message);
          await kf.shutdown();
          safeExit(1);
        }
      }

    } catch (error) {
      console.error('💥 Fatal error:', error.message);
      safeExit(1);
    }
  };

  main().catch(console.error);
}
