/**
 * Scrum Master Agent (Vince - Vince Lombardi) - Master Team Coach
 *
 * Named after Vince Lombardi, the legendary football coach who transformed
 * teams through discipline, systematic processes, and relentless focus on
 * excellence. Like Lombardi's championship teams that executed flawless plays
 * through rigorous practice, Vince orchestrates development sprints with
 * precision, accountability, and unwavering commitment to team success.
 *
 * Philosophy: "Excellence Through Disciplined Execution"
 * - Story creation with Lombardi's attention to game-planning detail
 * - Sprint ceremony facilitation like coaching championship teams
 * - Sprint health monitoring with a coach's eye for team performance
 * - Impediment management through decisive leadership and problem-solving
 *
 * Reasoning for Name: Vince Lombardi epitomized the Scrum Master role -
 * he was a servant leader who removed obstacles, facilitated team success,
 * maintained discipline and process, and created an environment where
 * teams could achieve their highest potential. His famous quote "Practice
 * does not make perfect. Only perfect practice makes perfect" mirrors
 * the Scrum Master's commitment to continuous improvement.
 *
 * Core responsibilities:
 */

const BaseAgent = require('../base_agent');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { EventEmitter } = require('events');

// Import Scrum Master modules
const SprintManagement = require('./modules/sprint_management');
const StoryCreation = require('./modules/story_creation');
const CeremonyFacilitation = require('./modules/ceremony_facilitation');
const ImpedimentTracking = require('./modules/impediment_tracking');

class ScrumMasterAgent extends BaseAgent {
  constructor(orchestrator, config = {}) {
    super(orchestrator, config);

    this.agentDir = path.join(process.cwd(), '.windsurf', 'agents', 'scrum_master');
    this.configPath = path.join(this.agentDir, 'agent_config.yml');
    this.trackingDir = path.join(this.agentDir, 'tracking');
    this.templatesDir = path.join(this.agentDir, 'templates');

    // Initialize modules
    this.sprintManagement = null;
    this.storyCreation = null;
    this.ceremonyFacilitation = null;
    this.impedimentTracking = null;

    // Scrum Master specific state
    this.currentSprint = null;
    this.activeStories = new Map();
    this.impediments = new Map();
    this.ceremonies = new Map();

    this.emit('agent_created', { agent: this.name, role: this.role });
  }

  /**
   * Initialize the Scrum Master Agent
   */
  async initialize() {
    try {
      console.log(`🏃 Scrum Master Agent (${this.name}) initializing...`);

      // Initialize base systems
      await this.initializeBaseSystems();

      // Ensure directory structure
      await this.ensureDirectoryStructure();

      // Load configuration
      await this.loadConfiguration();

      // Initialize Scrum Master systems
      await this.initializeScrumMasterSystems();

      // Load current sprint data
      await this.loadCurrentSprint();

      console.log(`🏃 Scrum Master systems initialized for ${this.name}`);
      this.emit('agent_initialized', { agent: this.name });

      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize Scrum Master Agent: ${error.message}`);
      this.emit('agent_error', { agent: this.name, error: error.message });
      throw error;
    }
  }

  /**
   * Ensure required directory structure exists
   */
  async ensureDirectoryStructure() {
    const dirs = [
      this.agentDir,
      this.trackingDir,
      this.templatesDir,
      path.join(this.agentDir, 'ceremonies'),
      path.join(this.agentDir, 'stories'),
      path.join(this.agentDir, 'sprints'),
      path.join(this.agentDir, 'cli')
    ];

    for (const dir of dirs) {
      await this.ensureDirectoryExists(dir);
    }
  }

  /**
   * Load Scrum Master configuration
   */
  async loadConfiguration() {
    try {
      if (await this.fileExists(this.configPath)) {
        const configContent = await fs.readFile(this.configPath, 'utf8');
        this.config = { ...this.config, ...yaml.load(configContent) };
        console.log(`🏃 Scrum Master config loaded for ${this.name}`);
      } else {
        // Create default configuration
        await this.createDefaultConfiguration();
      }
    } catch (error) {
      console.warn(`⚠️ Could not load Scrum Master config: ${error.message}`);
      await this.createDefaultConfiguration();
    }
  }

  /**
   * Create default Scrum Master configuration
   */
  async createDefaultConfiguration() {
    const defaultConfig = {
      agent_type: 'scrum_master',
      version: '1.0',
      scope: 'windsurf_ecosystem',
      integration_level: 'full',
      story_creation_enabled: true,
      ceremony_tracking: true,
      impediment_management: true,
      velocity_calculation: true,
      git_auto_capture: true,
      sprint_length_weeks: 2,
      wip_limits: {
        in_progress: 3,
        review: 2,
        testing: 2
      },
      ceremony_schedule: {
        standup: 'daily',
        planning: 'sprint_start',
        review: 'sprint_end',
        retrospective: 'sprint_end'
      }
    };

    await fs.writeFile(this.configPath, yaml.dump(defaultConfig), 'utf8');
    this.config = { ...this.config, ...defaultConfig };
    console.log(`🏃 Created default Scrum Master config for ${this.name}`);
  }

  /**
   * Initialize Scrum Master specific systems
   */
  async initializeScrumMasterSystems() {
    // Initialize Sprint Management module
    this.sprintManagement = new SprintManagement(this.agentDir, this.sharedMemory);
    await this.sprintManagement.initialize();

    // Initialize Story Creation module
    this.storyCreation = new StoryCreation(this.agentDir, this.sharedMemory);
    await this.storyCreation.initialize();

    // Initialize Ceremony Facilitation module
    this.ceremonyFacilitation = new CeremonyFacilitation(this.agentDir, this.sharedMemory);
    await this.ceremonyFacilitation.initialize();

    // Initialize Impediment Tracking module
    this.impedimentTracking = new ImpedimentTracking(this.agentDir, this.sharedMemory);
    await this.impedimentTracking.initialize();
  }

  /**
   * Load current sprint data
   */
  async loadCurrentSprint() {
    try {
      const sprintTrackingPath = path.join(this.trackingDir, 'sprint_tracking.md');
      if (await this.fileExists(sprintTrackingPath)) {
        const content = await fs.readFile(sprintTrackingPath, 'utf8');
        this.currentSprint = this.parseSprintData(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load current sprint data: ${error.message}`);
    }
  }

  /**
   * Parse sprint data from tracking file
   */
  parseSprintData(content) {
    const lines = content.split('\n');
    const sprint = {
      number: null,
      startDate: null,
      endDate: null,
      goal: null,
      stories: [],
      velocity: 0,
      status: 'active'
    };

    for (const line of lines) {
      if (line.includes('Sprint:')) {
        sprint.number = line.match(/Sprint:\s*(\d+)/)?.[1];
      } else if (line.includes('Start Date:')) {
        sprint.startDate = line.match(/Start Date:\s*(.+)/)?.[1];
      } else if (line.includes('End Date:')) {
        sprint.endDate = line.match(/End Date:\s*(.+)/)?.[1];
      } else if (line.includes('Sprint Goal:')) {
        sprint.goal = line.match(/Sprint Goal:\s*(.+)/)?.[1];
      }
    }

    return sprint;
  }

  /**
   * Get available Scrum Master tools
   */
  getAvailableTools() {
    return [
      {
        name: 'create_story',
        description: 'Create next story from sharded documents',
        parameters: {
          epic_reference: 'string',
          story_type: 'string',
          priority: 'string'
        }
      },
      {
        name: 'update_story_status',
        description: 'Update story progress and status',
        parameters: {
          story_id: 'string',
          status: 'string',
          notes: 'string'
        }
      },
      {
        name: 'track_impediment',
        description: 'Log and track team impediments',
        parameters: {
          title: 'string',
          description: 'string',
          priority: 'string',
          affected_stories: 'array'
        }
      },
      {
        name: 'facilitate_ceremony',
        description: 'Facilitate Scrum ceremonies',
        parameters: {
          ceremony_type: 'string',
          participants: 'array',
          agenda: 'string'
        }
      },
      {
        name: 'analyze_sprint_health',
        description: 'Analyze current sprint metrics and health',
        parameters: {
          include_velocity: 'boolean',
          include_burndown: 'boolean'
        }
      },
      {
        name: 'generate_sprint_report',
        description: 'Generate comprehensive sprint report',
        parameters: {
          sprint_number: 'string',
          report_type: 'string'
        }
      }
    ];
  }

  /**
   * Process Scrum Master specific requests
   */
  async processRequest(request) {
    try {
      console.log(`🏃 ${this.name} processing Scrum request: ${request.type}`);

      let result;

      switch (request.type) {
      case 'create_story':
        result = await this.createStoryFromShards(request.parameters);
        break;

      case 'update_story_status':
        result = await this.updateStoryStatus(request.parameters);
        break;

      case 'track_impediment':
        result = await this.trackImpediment(request.parameters);
        break;

      case 'facilitate_ceremony':
        result = await this.facilitateCeremony(request.parameters);
        break;

      case 'analyze_sprint_health':
        result = await this.analyzeSprintHealth(request.parameters);
        break;

      case 'generate_sprint_report':
        result = await this.generateSprintReport(request.parameters);
        break;

      case 'sprint_planning':
        result = await this.conductSprintPlanning(request.parameters);
        break;

      case 'daily_standup':
        result = await this.facilitateStandup(request.parameters);
        break;

      case 'retrospective':
        result = await this.facilitateRetrospective(request.parameters);
        break;

      default:
        throw new Error(`Unknown Scrum Master request type: ${request.type}`);
      }

      // Track performance metrics
      if (this.performance && typeof this.performance.recordMetric === 'function') {
        this.performance.recordMetric({
          type: request.type,
          duration: Date.now() - request.startTime,
          success: true,
          agent: this.name
        });
      }

      console.log(`✅ ${this.name} completed Scrum request: ${request.type}`);
      this.emit('request_completed', { agent: this.name, request: request.type, result });

      return result;

    } catch (error) {
      console.error(`❌ Scrum Master request failed: ${error.message}`);
      if (this.performance && typeof this.performance.recordMetric === 'function') {
        this.performance.recordMetric({
          type: request.type,
          duration: Date.now() - request.startTime,
          success: false,
          error: error.message,
          agent: this.name
        });
      }

      this.emit('request_failed', { agent: this.name, request: request.type, error: error.message });
      throw error;
    }
  }

  /**
   * Create story from sharded documents
   */
  async createStoryFromShards(parameters) {
    console.log('📝 Creating story from sharded documents...');
    return await this.storyCreation.createFromShards(parameters);
  }

  /**
   * Update story status and progress
   */
  async updateStoryStatus(parameters) {
    console.log('📊 Updating story status...');
    return await this.sprintManagement.updateStoryStatus(parameters);
  }

  /**
   * Track impediment
   */
  async trackImpediment(parameters) {
    console.log('🚧 Tracking impediment...');
    return await this.impedimentTracking.trackImpediment(parameters);
  }

  /**
   * Facilitate ceremony
   */
  async facilitateCeremony(parameters) {
    console.log('🎯 Facilitating ceremony...');
    return await this.ceremonyFacilitation.facilitateCeremony(parameters);
  }

  /**
   * Analyze sprint health
   */
  async analyzeSprintHealth(parameters) {
    console.log('📈 Analyzing sprint health...');
    return await this.sprintManagement.analyzeSprintHealth(parameters);
  }

  /**
   * Generate sprint report
   */
  async generateSprintReport(parameters) {
    console.log('📋 Generating sprint report...');
    return await this.sprintManagement.generateSprintReport(parameters);
  }

  /**
   * Conduct sprint planning
   */
  async conductSprintPlanning(parameters) {
    console.log('🎯 Conducting sprint planning...');
    return await this.ceremonyFacilitation.conductSprintPlanning(parameters);
  }

  /**
   * Facilitate daily standup
   */
  async facilitateStandup(parameters) {
    console.log('☀️ Facilitating daily standup...');
    return await this.ceremonyFacilitation.facilitateStandup(parameters);
  }

  /**
   * Facilitate retrospective
   */
  async facilitateRetrospective(parameters) {
    console.log('🔄 Facilitating retrospective...');
    return await this.ceremonyFacilitation.facilitateRetrospective(parameters);
  }

  /**
   * Get agent status
   */
  async getStatus() {
    const baseStatus = {
      status: this.status || 'available',
      agent_id: this.id,
      agent_name: this.name,
      agent_role: this.role,
      current_tasks: this.currentTasks ? this.currentTasks.size : 0,
      last_activity: new Date().toISOString()
    };

    return {
      ...baseStatus,
      scrum_metrics: {
        current_sprint: this.currentSprint?.number || 'None',
        active_stories: this.activeStories.size,
        open_impediments: this.impediments.size,
        upcoming_ceremonies: await this.getUpcomingCeremonies(),
        sprint_health_score: await this.calculateSprintHealthScore()
      }
    };
  }

  /**
   * Get upcoming ceremonies
   */
  async getUpcomingCeremonies() {
    try {
      return await this.ceremonyFacilitation.getUpcomingCeremonies();
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate sprint health score
   */
  async calculateSprintHealthScore() {
    try {
      const healthData = await this.sprintManagement.analyzeSprintHealth({});
      return healthData.overall_score || 85;
    } catch (error) {
      return 85; // Default score
    }
  }

  /**
   * Get recent story creations
   */
  getRecentStoryCreations() {
    const metrics = this.performance.getRecentMetrics();
    return Array.isArray(metrics) ? metrics.filter(m => m.type === 'create_story').slice(0, 5) : [];
  }

  /**
   * Get recent impediment tracking
   */
  getRecentImpedimentTracking() {
    const metrics = this.performance.getRecentMetrics();
    return Array.isArray(metrics) ? metrics.filter(m => m.type === 'track_impediment').slice(0, 5) : [];
  }

  /**
   * Get recent ceremony facilitations
   */
  getRecentCeremonies() {
    const metrics = this.performance.getRecentMetrics();
    return Array.isArray(metrics) ? metrics.filter(m => m.type === 'facilitate_ceremony').slice(0, 5) : [];
  }

  /**
   * Utility method to ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Utility method to check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ScrumMasterAgent;
