/**
 * Dev Agent (Edison - Thomas Edison) - Master Problem Solver
 * 
 * Named after Thomas Edison, the prolific inventor who created over 1,000 patents
 * through relentless experimentation, iteration, and practical problem-solving.
 * Like Edison's famous quote "Genius is 1% inspiration, 99% perspiration,"
 * Edison the agent tackles coding challenges through systematic implementation,
 * debugging, and continuous improvement.
 * 
 * Philosophy: "Innovation Through Persistent Implementation"
 * - Executes story tasks with Edison's experimental approach
 * - Maintains code quality through iterative refinement like Edison's inventions
 * - Applies best practices learned from countless "failed" attempts
 * - Provides detailed explanations like Edison's meticulous lab notebooks
 * 
 * Reasoning for Name: Thomas Edison embodied the developer mindset - he was
 * a hands-on problem solver who learned from failures, iterated rapidly,
 * and turned ideas into working solutions. His systematic approach to invention,
 * attention to practical details, and persistence through debugging mirrors
 * the ideal development process.
 */

const BaseAgent = require('../core/base_agent');
const StoryTracker = require('./dev_agent/modules/story_tracker');
const CodeQualityManager = require('./dev_agent/modules/code_quality_manager');
const DebuggingAssistant = require('./dev_agent/modules/debugging_assistant');
const fs = require('fs').promises;
const path = require('path');

/**
 * Development Agent (Edison)
 * Specializes in story implementation, code quality, and debugging support
 * Uses modular architecture for enhanced maintainability and functionality
 */
class DevAgent extends BaseAgent {
  constructor(orchestrator, config) {
    super(orchestrator, config);
    
    // Agent-specific properties
    this.agentType = 'development';
    this.capabilities = [
      'story_implementation',
      'code_quality_assessment', 
      'debugging_support',
      'test_development',
      'refactoring_guidance',
      'performance_optimization'
    ];
    
    // Core modules (initialized in initializeAgentSystems)
    this.storyTracker = null;
    this.codeQualityManager = null;
    this.debuggingAssistant = null;
    
    // Agent state
    this.activeStories = new Map();
    this.qualityMetrics = new Map();
    this.debugSessions = new Map();
    
    console.log(`⚡ Edison (Dev) initializing...`);
  }
  
  /**
   * Initialize agent-specific systems
   */
  async initializeAgentSystems() {
    try {
      console.log(`⚡ Dev config loaded for ${this.name}`);
      
      // Initialize core modules
      this.storyTracker = new StoryTracker(this);
      await this.storyTracker.initialize();
      
      this.codeQualityManager = new CodeQualityManager(this);
      await this.codeQualityManager.initialize();
      
      this.debuggingAssistant = new DebuggingAssistant(this);
      await this.debuggingAssistant.initialize();
      
      // Ensure Dev directories exist
      await this.ensureDevDirectories();
      
      console.log(`⚡ Dev systems initialized for ${this.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize Dev agent systems: ${error.message}`);
      this.status = 'error';
      throw error;
    }
  }
  
  /**
   * Ensure Dev agent directories exist
   */
  async ensureDevDirectories() {
    const dirs = [
      path.join(process.cwd(), 'data', 'dev_agent'),
      path.join(process.cwd(), 'data', 'dev_agent', 'stories'),
      path.join(process.cwd(), 'data', 'dev_agent', 'quality'),
      path.join(process.cwd(), 'data', 'dev_agent', 'debug')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  
  /**
   * Process a development request
   */
  async processRequest(request, context = {}) {
    try {
      console.log(`⚡ Edison processing request: ${request.type}`);
      
      // Determine request type and route to appropriate module
      switch (request.type) {
        case 'story_implementation':
          return await this.storyTracker.breakDownStory(request.task, request.analysis);
          
        case 'code_quality_assessment':
          return await this.codeQualityManager.identifyRefactoringTargets(context);
          
        case 'debugging_support':
          return await this.debuggingAssistant.performRootCauseAnalysis(request.task, context);
          
        default:
          return {
            type: 'general_development',
            message: 'Development task processed',
            agent: 'Edison',
            timestamp: new Date().toISOString()
          };
      }
      
    } catch (error) {
      console.error(`❌ Edison request processing failed: ${error.message}`);
      return {
        type: 'error',
        message: error.message,
        agent: 'Edison',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get agent status and health metrics
   */
  async getStatus() {
    try {
      const storyStatus = this.storyTracker ? await this.storyTracker.getStatus() : {};
      const qualityStatus = this.codeQualityManager ? await this.codeQualityManager.getStatus() : {};
      const debugStatus = this.debuggingAssistant ? await this.debuggingAssistant.getStatus() : {};
      
      return {
        agent: 'Edison (Thomas Edison)',
        role: 'Development Agent',
        status: this.status,
        capabilities: this.capabilities,
        modules: {
          story_tracker: storyStatus,
          code_quality: qualityStatus,
          debugging: debugStatus
        },
        active_stories: this.activeStories.size,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Edison status check failed: ${error.message}`);
      return {
        agent: 'Edison',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = DevAgent;
