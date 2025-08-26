/**
 * KnowledgeForge 3.2 Base Agent Class
 *
 * Foundation class for all specialized AI agents in the unified architecture.
 * Provides shared functionality while allowing agent-specific specializations.
 *
 * Philosophy: "Shared Intelligence with Individual Expertise"
 * - Common infrastructure shared across all agents
 * - Specialized capabilities defined by agent implementations
 * - Seamless integration with orchestration and memory systems
 */

const EventEmitter = require('events');
const SharedMemorySystem = require('../infrastructure/shared_memory');

class BaseAgent extends EventEmitter {
  constructor(orchestrator, config) {
    super();

    this.orchestrator = orchestrator;
    this.config = config;
    this.id = config.agent.id;
    this.name = config.agent.name;
    this.role = config.agent.role;
    this.persona = config.agent.persona || null;

    // Memory systems
    this.sharedMemory = orchestrator?.memoryManager || new SharedMemorySystem();
    this.memory = this.sharedMemory.getAgentMemory(this.name);
    this.notifications = orchestrator?.notificationSystem;
    this.claudeCode = orchestrator?.claudeCodeIntegration;

    // Agent state
    this.status = 'initializing';
    this.currentTasks = new Set();
    this.performance = null; // Initialize later to avoid circular dependencies
    this.expertise = null; // To be set by subclasses
    this.tools = null; // To be set by subclasses

    // Learning and adaptation
    this.learningEngine = null; // Initialize later to avoid circular dependencies
    this.contextCache = new Map();

    // Initialize base systems
    this.initializeBaseSystems();
  }

  /**
   * Initialize shared systems and register with orchestrator
   */
  async initializeBaseSystems() {
    try {
      // Initialize performance tracker and learning engine
      this.performance = new PerformanceTracker(this.id);
      this.learningEngine = new AgentLearningEngine(this.id);

      // Register with notification system
      if (this.notifications) {
        this.notifications.registerAgent(this.id, {
          name: this.name,
          role: this.role,
          notificationTypes: this.config.integration.notification_types,
          handlers: this.getNotificationHandlers()
        });
      }

      // Register with Claude Code integration
      if (this.claudeCode) {
        this.claudeCode.registerAgentRouting(this.id, {
          claudeCodeOperations: this.config.integration.claude_code_priority,
          windsurfOperations: this.getWindsurfOperations(),
          hybridOperations: this.getHybridOperations()
        });
      }

      // Load agent-specific memory
      await this.loadAgentMemory();

      // Initialize agent-specific systems (to be overridden)
      await this.initializeAgentSystems();

      this.status = 'available';
      console.log(`✅ ${this.name} agent initialized successfully`);

      this.emit('initialized', { agent: this.id, status: this.status });
    } catch (error) {
      this.status = 'error';
      console.error(`❌ Failed to initialize ${this.name} agent:`, error.message);
      this.emit('error', { agent: this.id, error: error.message });
    }
  }

  /**
   * Main request processing method - to be enhanced by subclasses
   */
  async processRequest(request, context = {}) {
    const taskId = this.generateTaskId();
    this.currentTasks.add(taskId);

    try {
      console.log(`🎯 ${this.name} processing: ${request.substring(0, 100)}...`);

      // Record start time
      const startTime = Date.now();

      // Enrich context with agent-specific information
      const enrichedContext = await this.enrichContext(context);

      // Analyze request with agent expertise
      const analysis = await this.analyzeRequest(request, enrichedContext);

      // Determine execution strategy
      const strategy = await this.determineExecutionStrategy(analysis);

      // Execute request based on strategy
      const result = await this.executeRequest(request, enrichedContext, analysis, strategy);

      // Post-process and learn
      await this.postProcessResult(result, analysis, enrichedContext);

      // Record performance
      const duration = Date.now() - startTime;
      this.performance.recordTask(taskId, duration, 'success', result);

      console.log(`✅ ${this.name} completed task in ${duration}ms`);

      this.emit('taskCompleted', {
        agent: this.id,
        taskId,
        duration,
        success: true
      });

      return {
        success: true,
        result,
        agent: this.name,
        duration,
        strategy: strategy.type,
        taskId
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.performance.recordTask(taskId, duration, 'error', error);

      console.error(`❌ ${this.name} task failed:`, error.message);

      this.emit('taskFailed', {
        agent: this.id,
        taskId,
        error: error.message
      });

      return await this.handleError(error, request, context);
    } finally {
      this.currentTasks.delete(taskId);
    }
  }

  /**
   * Enrich context with agent-specific information
   */
  async enrichContext(context) {
    const enriched = {
      ...context,
      agent: {
        id: this.id,
        name: this.name,
        role: this.role,
        expertise: this.getExpertiseAreas()
      },
      timestamp: Date.now()
    };

    // Add relevant memory
    enriched.relevantMemory = await this.getRelevantMemory(context);

    // Add agent-specific context
    if (this.expertise) {
      enriched.agentContext = await this.expertise.getContext(context);
    }

    return enriched;
  }

  /**
   * Analyze request with agent expertise - to be enhanced by subclasses
   */
  async analyzeRequest(request, context) {
    const analysis = {
      request,
      context,
      complexity: this.assessComplexity(request, context),
      urgency: this.assessUrgency(request, context),
      requiredCapabilities: this.identifyRequiredCapabilities(request, context),
      estimatedEffort: this.estimateEffort(request, context),
      riskLevel: this.assessRisk(request, context)
    };

    // Add agent-specific analysis
    if (this.expertise) {
      analysis.expertiseAnalysis = await this.expertise.analyze(request, context);
    }

    return analysis;
  }

  /**
   * Determine execution strategy based on analysis
   */
  async determineExecutionStrategy(analysis) {
    const strategy = {
      type: 'windsurf', // Default to Windsurf
      confidence: 0.5,
      reasoning: 'Default strategy',
      useClaudeCode: false,
      requiresHandoff: false,
      collaborationNeeded: false
    };

    // Check if suitable for Claude Code
    if (this.isSuitableForClaudeCode(analysis)) {
      strategy.type = 'claude-code';
      strategy.useClaudeCode = true;
      strategy.confidence = 0.8;
      strategy.reasoning = 'Simple operation suitable for Claude Code';
    }

    // Check if requires handoff to another agent
    const handoffAgent = this.shouldHandoffTo(analysis);
    if (handoffAgent) {
      strategy.requiresHandoff = true;
      strategy.handoffAgent = handoffAgent;
      strategy.reasoning = `Task better suited for ${handoffAgent} agent`;
    }

    // Check if requires collaboration
    const collaborators = this.identifyCollaborators(analysis);
    if (collaborators.length > 0) {
      strategy.collaborationNeeded = true;
      strategy.collaborators = collaborators;
      strategy.reasoning = 'Task requires multi-agent collaboration';
    }

    return strategy;
  }

  /**
   * Execute request based on strategy - to be enhanced by subclasses
   */
  async executeRequest(request, context, analysis, strategy) {
    switch (strategy.type) {
    case 'claude-code':
      return await this.executeViaClaudeCode(request, context, analysis);
    case 'windsurf':
      return await this.executeViaWindsurf(request, context, analysis);
    case 'hybrid':
      return await this.executeHybrid(request, context, analysis);
    default:
      throw new Error(`Unknown execution strategy: ${strategy.type}`);
    }
  }

  /**
   * Execute via Claude Code for simple operations
   */
  async executeViaClaudeCode(request, context, analysis) {
    console.log(`🤖 ${this.name} executing via Claude Code`);

    // Map request to Claude Code operation
    const operation = this.mapToClaudeOperation(request, context, analysis);

    // Execute through orchestrator
    const result = await this.orchestrator.orchestrate(operation, context);

    return {
      method: 'claude-code',
      operation: operation.type,
      result: result.result,
      tokensSaved: result.tokensSaved || 0
    };
  }

  /**
   * Execute via Windsurf for complex operations
   */
  async executeViaWindsurf(request, context, analysis) {
    console.log(`🌊 ${this.name} executing via Windsurf`);

    // This is where agent-specific logic would be implemented
    // For now, return a placeholder response
    return {
      method: 'windsurf',
      agent: this.name,
      request,
      analysis,
      note: 'Executed via Windsurf with full AI reasoning',
      timestamp: Date.now()
    };
  }

  /**
   * Execute using hybrid approach
   */
  async executeHybrid(request, context, analysis) {
    console.log(`🔄 ${this.name} executing hybrid approach`);

    // Use Claude Code for simple parts
    const claudeResult = await this.executeViaClaudeCode(request, context, analysis);

    // Use Windsurf for complex reasoning
    const windsurfResult = await this.executeViaWindsurf(request, context, analysis);

    return {
      method: 'hybrid',
      claudeResult,
      windsurfResult,
      combined: this.combineResults(claudeResult, windsurfResult)
    };
  }

  /**
   * Post-process result and update learning
   */
  async postProcessResult(result, analysis, context) {
    // Store result in memory if significant
    if (this.isSignificantResult(result, analysis)) {
      await this.storeResultInMemory(result, analysis, context);
    }

    // Update learning engine
    await this.learningEngine.learn(analysis, result, context);

    // Update agent-specific post-processing
    if (this.expertise) {
      await this.expertise.postProcess(result, analysis, context);
    }
  }

  /**
   * Handle handoff to another agent
   */
  async prepareHandoff(toAgent, context, task) {
    console.log(`🤝 ${this.name} preparing handoff to ${toAgent}`);

    const handoffPackage = {
      fromAgent: this.id,
      toAgent,
      timestamp: Date.now(),
      context: {
        ...context,
        agentWork: await this.getRecentWork(task),
        sharedMemory: await this.getRelevantMemory(context),
        handoffReason: this.determineHandoffReason(toAgent, task),
        agentInsights: await this.getAgentInsights(task)
      },
      task,
      performance: this.performance.getRecentMetrics(),
      recommendations: await this.getHandoffRecommendations(toAgent, task)
    };

    // Store handoff in memory
    await this.storeHandoffInMemory(handoffPackage);

    return handoffPackage;
  }

  /**
   * Receive handoff from another agent
   */
  async receiveHandoff(handoffPackage) {
    console.log(`🤝 ${this.name} receiving handoff from ${handoffPackage.fromAgent}`);

    // Process handoff context
    const handoffContext = await this.processHandoffContext(handoffPackage);

    // Update agent state with handoff information
    await this.updateStateFromHandoff(handoffContext);

    // Store handoff in memory
    await this.storeReceivedHandoff(handoffPackage);

    return {
      success: true,
      agent: this.name,
      handoffReceived: true,
      context: handoffContext
    };
  }

  /**
   * Get agent status and metrics
   */
  getAgentStatus() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      currentTasks: Array.from(this.currentTasks),
      performance: this.performance.getSummary(),
      memory: this.getMemoryUsage(),
      lastActivity: this.getLastActivity(),
      expertise: this.getExpertiseStatus(),
      learningStats: this.learningEngine.getStats()
    };
  }

  /**
   * Get current agent status for monitoring and testing
   */
  async getStatus() {
    return {
      agent: {
        id: this.id,
        name: this.name,
        role: this.role,
        persona: this.persona,
        status: this.status
      },
      performance: this.performance.getSummary(),
      currentTasks: Array.from(this.currentTasks),
      lastActivity: this.performance.getLastActivity(),
      capabilities: this.getExpertiseAreas(),
      health: this.status === 'available' ? 'healthy' : 'degraded',
      timestamp: Date.now()
    };
  }

  /**
   * Error handling with intelligent recovery
   */
  async handleError(error, request, context) {
    console.error(`❌ ${this.name} Agent Error:`, error.message);

    // Record error for learning
    this.performance.recordError(error, request, context);
    await this.learningEngine.learnFromError(error, request, context);

    // Attempt recovery
    const recovery = await this.attemptRecovery(error, request, context);

    // Notify orchestrator
    if (this.orchestrator.handleAgentError) {
      await this.orchestrator.handleAgentError(this.id, error, request, context);
    }

    return {
      success: false,
      error: error.message,
      agent: this.name,
      recovery,
      suggestion: this.getSuggestionForError(error),
      alternativeAgents: this.suggestAlternativeAgents(request, context)
    };
  }

  /**
   * Attempt to recover from error
   */
  async attemptRecovery(error, request, context) {
    // Simple recovery strategies
    if (error.message.includes('timeout')) {
      return { strategy: 'retry', suggestion: 'Retry with longer timeout' };
    }

    if (error.message.includes('permission')) {
      return { strategy: 'escalate', suggestion: 'Escalate to user for permissions' };
    }

    if (error.message.includes('not found')) {
      return { strategy: 'search', suggestion: 'Search for alternative resources' };
    }

    return { strategy: 'handoff', suggestion: 'Consider handoff to another agent' };
  }

  // Utility methods

  generateTaskId() {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  assessComplexity(request, context) {
    // Simple complexity assessment (1-10 scale)
    let complexity = 1;

    if (request.length > 200) complexity += 1;
    if (context.files && context.files.length > 5) complexity += 1;
    if (request.includes('complex') || request.includes('advanced')) complexity += 2;

    return Math.min(complexity, 10);
  }

  assessUrgency(request, context) {
    // Simple urgency assessment
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const hasUrgentKeyword = urgentKeywords.some(keyword =>
      request.toLowerCase().includes(keyword)
    );

    return hasUrgentKeyword ? 'high' : 'normal';
  }

  identifyRequiredCapabilities(request, context) {
    // To be enhanced by subclasses
    return ['basic'];
  }

  estimateEffort(request, context) {
    // Simple effort estimation (in minutes)
    const baseEffort = 5;
    const complexity = this.assessComplexity(request, context);
    return baseEffort * complexity;
  }

  assessRisk(request, context) {
    // Simple risk assessment (1-10 scale)
    let risk = 1;

    if (request.includes('delete') || request.includes('remove')) risk += 3;
    if (context.environment === 'production') risk += 2;
    if (request.includes('system') || request.includes('critical')) risk += 2;

    return Math.min(risk, 10);
  }

  isSuitableForClaudeCode(analysis) {
    return analysis.complexity <= 3 && analysis.riskLevel <= 5;
  }

  shouldHandoffTo(analysis) {
    // To be enhanced by subclasses
    return null;
  }

  identifyCollaborators(analysis) {
    // To be enhanced by subclasses
    return [];
  }

  mapToClaudeOperation(request, context, analysis) {
    // Default mapping - to be enhanced by subclasses
    return {
      type: 'general-task',
      request,
      context,
      analysis
    };
  }

  combineResults(claudeResult, windsurfResult) {
    return {
      claude: claudeResult,
      windsurf: windsurfResult,
      synthesis: 'Combined results from both approaches'
    };
  }

  isSignificantResult(result, analysis) {
    return analysis.complexity > 5 || analysis.estimatedEffort > 30;
  }

  async storeResultInMemory(result, analysis, context) {
    const memoryKey = `result_${Date.now()}`;
    await this.sharedMemory.storeMemory(this.id, memoryKey, {
      result,
      analysis,
      context
    }, {
      scope: 'agent',
      tags: ['result', 'significant'],
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  async getRelevantMemory(context, query = '') {
    return await this.sharedMemory.getRelevantMemory(this.id, context, query, 10);
  }

  async loadAgentMemory() {
    // Load agent-specific memory on initialization
    this.agentMemory = await this.getRelevantMemory({}, '', 50);
    console.log(`📚 Loaded ${this.agentMemory.length} memory entries for ${this.name}`);
  }

  getExpertiseAreas() {
    return this.config.specializations?.expertise_areas || [];
  }

  getExpertiseStatus() {
    return this.expertise ? this.expertise.getStatus() : { status: 'not_initialized' };
  }

  getMemoryUsage() {
    return {
      agentMemory: this.agentMemory?.length || 0,
      contextCache: this.contextCache.size
    };
  }

  getLastActivity() {
    return this.performance.getLastActivity();
  }

  // Methods to be implemented by subclasses
  async initializeAgentSystems() {
    // Override in subclasses
  }

  getNotificationHandlers() {
    return {}; // Override in subclasses
  }

  getWindsurfOperations() {
    return []; // Override in subclasses
  }

  getHybridOperations() {
    return []; // Override in subclasses
  }

  getSuggestionForError(error) {
    return 'Consider trying a different approach or consulting documentation';
  }

  suggestAlternativeAgents(request, context) {
    return []; // Override in subclasses
  }

  async getRecentWork(task) {
    return {}; // Override in subclasses
  }

  determineHandoffReason(toAgent, task) {
    return `Task requires expertise of ${toAgent} agent`;
  }

  async getAgentInsights(task) {
    return {}; // Override in subclasses
  }

  async getHandoffRecommendations(toAgent, task) {
    return []; // Override in subclasses
  }

  async storeHandoffInMemory(handoffPackage) {
    const memoryKey = `handoff_${handoffPackage.toAgent}_${Date.now()}`;
    await this.sharedMemory.storeMemory(this.id, memoryKey, handoffPackage, {
      scope: 'team',
      tags: ['handoff', 'coordination'],
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  async processHandoffContext(handoffPackage) {
    return handoffPackage.context;
  }

  async updateStateFromHandoff(handoffContext) {
    // Update agent state based on handoff
  }

  async storeReceivedHandoff(handoffPackage) {
    const memoryKey = `received_handoff_${handoffPackage.fromAgent}_${Date.now()}`;
    await this.sharedMemory.storeMemory(this.id, memoryKey, handoffPackage, {
      scope: 'agent',
      tags: ['handoff', 'received'],
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
}

/**
 * Performance tracking for agents
 */
class PerformanceTracker {
  constructor(agentId) {
    this.agentId = agentId;
    this.tasks = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  recordTask(taskId, duration, status, result) {
    this.tasks.push({
      taskId,
      duration,
      status,
      result: status === 'success' ? 'completed' : 'failed',
      timestamp: Date.now()
    });

    // Keep only last 1000 tasks
    if (this.tasks.length > 1000) {
      this.tasks = this.tasks.slice(-1000);
    }
  }

  recordError(error, request, context) {
    this.errors.push({
      error: error.message,
      request: request.substring(0, 100),
      context: context.currentTask || 'unknown',
      timestamp: Date.now()
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  getSummary() {
    const totalTasks = this.tasks.length;
    const successfulTasks = this.tasks.filter(t => t.status === 'success').length;
    const averageDuration = totalTasks > 0
      ? Math.round(this.tasks.reduce((sum, t) => sum + t.duration, 0) / totalTasks)
      : 0;

    return {
      totalTasks,
      successfulTasks,
      successRate: totalTasks > 0 ? (successfulTasks / totalTasks) : 0,
      averageDuration,
      totalErrors: this.errors.length,
      uptime: Date.now() - this.startTime
    };
  }

  getRecentMetrics() {
    const recentTasks = this.tasks.slice(-10);
    return {
      recentTasks: recentTasks.length,
      recentSuccessRate: recentTasks.length > 0
        ? recentTasks.filter(t => t.status === 'success').length / recentTasks.length
        : 0,
      recentErrors: this.errors.slice(-5)
    };
  }

  getLastActivity() {
    const lastTask = this.tasks[this.tasks.length - 1];
    return lastTask ? lastTask.timestamp : this.startTime;
  }
}

/**
 * Learning engine for agents
 */
class AgentLearningEngine {
  constructor(agentId) {
    this.agentId = agentId;
    this.patterns = new Map();
    this.errorPatterns = new Map();
    this.successPatterns = new Map();
  }

  async learn(analysis, result, context) {
    // Learn from successful patterns
    if (result.success) {
      this.learnSuccessPattern(analysis, result, context);
    }

    // Update general patterns
    this.updatePatterns(analysis, result, context);
  }

  async learnFromError(error, request, context) {
    const errorPattern = {
      error: error.message,
      request: request.substring(0, 100),
      context: context.currentTask || 'unknown',
      timestamp: Date.now()
    };

    const key = this.generatePatternKey(errorPattern);
    this.errorPatterns.set(key, errorPattern);
  }

  learnSuccessPattern(analysis, result, context) {
    const successPattern = {
      complexity: analysis.complexity,
      strategy: result.strategy,
      duration: result.duration,
      context: context.currentTask || 'unknown',
      timestamp: Date.now()
    };

    const key = this.generatePatternKey(successPattern);
    this.successPatterns.set(key, successPattern);
  }

  updatePatterns(analysis, result, context) {
    const pattern = {
      analysis,
      result,
      context,
      timestamp: Date.now()
    };

    const key = this.generatePatternKey(pattern);
    this.patterns.set(key, pattern);
  }

  generatePatternKey(pattern) {
    return `${this.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      totalPatterns: this.patterns.size,
      successPatterns: this.successPatterns.size,
      errorPatterns: this.errorPatterns.size,
      learningRate: this.calculateLearningRate()
    };
  }

  calculateLearningRate() {
    // Simple learning rate calculation
    const total = this.patterns.size;
    const recent = Array.from(this.patterns.values())
      .filter(p => Date.now() - p.timestamp < 24 * 60 * 60 * 1000)
      .length;

    return total > 0 ? recent / total : 0;
  }
}

module.exports = BaseAgent;
