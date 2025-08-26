/**
 * PM Agent (Alex - Alexander) - Strategic Project Manager
 *
 * Named after Alexander the Great, the ultimate coordinator of complex campaigns
 * and strategic initiatives. Alex embodies strategic coordination with tactical
 * execution, orchestrating project workflows like Alexander orchestrated his
 * legendary military campaigns across vast territories.
 *
 * Philosophy: "Strategic Coordination with Tactical Execution"
 * - Orchestrates project workflows and team coordination
 * - Bridges strategic planning with tactical implementation
 * - Maintains project context and facilitates handoffs
 * - Leads execution like Alexander led his campaigns
 *
 * Reasoning for Name: Alexander the Great was history's greatest project manager,
 * coordinating complex multi-year campaigns across continents, managing diverse
 * teams from different cultures, allocating resources strategically, and achieving
 * ambitious objectives through meticulous planning and adaptive execution.
 */

const BaseAgent = require('../base_agent');
const path = require('path');
const fs = require('fs').promises;

// Core modules
const ProjectPlanning = require('./modules/project_planning');
const MilestoneTracking = require('./modules/milestone_tracking');
const ResourceCoordination = require('./modules/resource_coordination');
const TeamOrchestration = require('./modules/team_orchestration');

class PMAgent extends BaseAgent {
  constructor(orchestrator, config) {
    super(orchestrator, config);

    // Agent-specific properties
    this.agentType = 'project_manager';
    this.capabilities = [
      'project_planning',
      'milestone_tracking',
      'resource_coordination',
      'team_orchestration',
      'risk_management',
      'stakeholder_communication'
    ];

    // Core modules
    this.projectPlanning = null;
    this.milestoneTracking = null;
    this.resourceCoordination = null;
    this.teamOrchestration = null;

    // Agent state
    this.activeProjects = new Map();
    this.milestones = new Map();
    this.resources = new Map();
    this.teamMembers = new Map();

    console.log(`🎯 PM Agent Alex (${this.name}) initializing...`);
  }

  /**
   * Initialize agent-specific systems
   */
  async initializeAgentSystems() {
    try {
      console.log(`🎯 PM config loaded for ${this.name}`);

      // Initialize core modules (skip if modules don't exist to allow basic startup)
      try {
        this.projectPlanning = new ProjectPlanning(this);
        await this.projectPlanning.initialize();
      } catch (error) {
        console.log(`⚠️  ProjectPlanning module not available: ${error.message}`);
        this.projectPlanning = null;
      }

      try {
        this.milestoneTracking = new MilestoneTracking(this);
        await this.milestoneTracking.initialize();
      } catch (error) {
        console.log(`⚠️  MilestoneTracking module not available: ${error.message}`);
        this.milestoneTracking = null;
      }

      try {
        this.resourceCoordination = new ResourceCoordination(this);
        await this.resourceCoordination.initialize();
      } catch (error) {
        console.log(`⚠️  ResourceCoordination module not available: ${error.message}`);
        this.resourceCoordination = null;
      }

      try {
        this.teamOrchestration = new TeamOrchestration(this);
        await this.teamOrchestration.initialize();
      } catch (error) {
        console.log(`⚠️  TeamOrchestration module not available: ${error.message}`);
        this.teamOrchestration = null;
      }

      // Ensure PM directories exist
      await this.ensurePMDirectories();

      console.log(`🎯 PM systems initialized for ${this.name}`);

    } catch (error) {
      console.error(`❌ Failed to initialize PM systems: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process PM-specific requests
   */
  async processRequest(request) {
    const startTime = Date.now();
    request.startTime = startTime;

    console.log(`🎯 ${this.name} processing PM request: ${request.type}`);

    try {
      let result;

      switch (request.type) {
      case 'create_project_plan':
        console.log('📋 Creating project plan...');
        result = await this.projectPlanning.createProjectPlan(
          request.project_scope || {},
          request.requirements || [],
          request.constraints || {}
        );
        break;

      case 'track_milestone':
        console.log('🎯 Tracking milestone progress...');
        result = await this.milestoneTracking.trackMilestone(
          request.milestone_id,
          request.progress_data || {}
        );
        break;

      case 'coordinate_resources':
        console.log('🔧 Coordinating resources...');
        result = await this.resourceCoordination.coordinateResources(
          request.resource_requirements || [],
          request.timeline || {}
        );
        break;

      case 'orchestrate_team':
        console.log('👥 Orchestrating team coordination...');
        result = await this.teamOrchestration.orchestrateTeam(
          request.team_members || [],
          request.coordination_type || 'general'
        );
        break;

      case 'assess_project_health':
        console.log('📊 Assessing project health...');
        result = await this.assessProjectHealth(
          request.project_id,
          request.assessment_scope || 'comprehensive'
        );
        break;

      case 'generate_status_report':
        console.log('📄 Generating status report...');
        result = await this.generateStatusReport(
          request.report_type || 'weekly',
          request.stakeholders || []
        );
        break;

      default:
        throw new Error(`Unknown PM request type: ${request.type}`);
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

      console.log(`✅ ${this.name} completed PM request: ${request.type}`);
      this.emit('request_completed', { agent: this.name, request: request.type, result });

      return result;

    } catch (error) {
      console.error(`❌ PM request failed: ${error.message}`);
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
   * Assess overall project health
   */
  async assessProjectHealth(projectId, scope) {
    try {
      const health = {
        project_id: projectId,
        assessment_date: new Date().toISOString(),
        scope,
        overall_score: 0,
        dimensions: {},
        risks: [],
        recommendations: []
      };

      // Get data from all modules
      const planningHealth = await this.projectPlanning.getProjectHealth(projectId);
      const milestoneHealth = await this.milestoneTracking.getMilestoneHealth(projectId);
      const resourceHealth = await this.resourceCoordination.getResourceHealth(projectId);
      const teamHealth = await this.teamOrchestration.getTeamHealth(projectId);

      // Combine health dimensions
      health.dimensions = {
        planning: planningHealth,
        milestones: milestoneHealth,
        resources: resourceHealth,
        team: teamHealth
      };

      // Calculate overall score
      const scores = Object.values(health.dimensions).map(d => d.score || 0);
      health.overall_score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Identify risks and recommendations
      health.risks = this.identifyProjectRisks(health.dimensions);
      health.recommendations = this.generateHealthRecommendations(health.dimensions);

      return health;

    } catch (error) {
      console.error('❌ Failed to assess project health:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive status report
   */
  async generateStatusReport(reportType, stakeholders) {
    try {
      const report = {
        id: `report-${Date.now()}`,
        type: reportType,
        generated: new Date().toISOString(),
        stakeholders,
        summary: {},
        details: {},
        action_items: [],
        next_period_focus: []
      };

      // Gather data from all modules
      const projectStatus = await this.projectPlanning.getProjectStatus();
      const milestoneStatus = await this.milestoneTracking.getMilestoneStatus();
      const resourceStatus = await this.resourceCoordination.getResourceStatus();
      const teamStatus = await this.teamOrchestration.getTeamStatus();

      // Create executive summary
      report.summary = {
        active_projects: projectStatus.active_projects,
        completed_milestones: milestoneStatus.completed_this_period,
        upcoming_milestones: milestoneStatus.upcoming.length,
        resource_utilization: resourceStatus.utilization_percentage,
        team_velocity: teamStatus.velocity,
        overall_health: this.calculateOverallHealth([
          projectStatus.health_score,
          milestoneStatus.health_score,
          resourceStatus.health_score,
          teamStatus.health_score
        ])
      };

      // Detailed sections
      report.details = {
        projects: projectStatus,
        milestones: milestoneStatus,
        resources: resourceStatus,
        team: teamStatus
      };

      // Generate action items and focus areas
      report.action_items = this.generateActionItems(report.details);
      report.next_period_focus = this.generateNextPeriodFocus(report.summary);

      return report;

    } catch (error) {
      console.error('❌ Failed to generate status report:', error.message);
      throw error;
    }
  }

  /**
   * Ensure PM directories exist
   */
  async ensurePMDirectories() {
    try {
      const directories = [
        'data/pm_agent',
        'data/shared_memory'
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Failed to create PM directories:', error.message);
    }
  }

  /**
   * Helper methods for PM agent functionality
   */
  identifyProjectRisks(dimensions) {
    const risks = [];

    Object.entries(dimensions).forEach(([area, health]) => {
      if (health.score < 60) {
        risks.push({
          area,
          severity: health.score < 40 ? 'high' : 'medium',
          description: `${area} health is below acceptable threshold`,
          issues: health.issues || []
        });
      }
    });

    return risks;
  }

  generateHealthRecommendations(dimensions) {
    const recommendations = [];

    Object.entries(dimensions).forEach(([area, health]) => {
      if (health.score < 80) {
        recommendations.push({
          area,
          priority: health.score < 60 ? 'high' : 'medium',
          recommendation: `Improve ${area} processes and monitoring`,
          specific_actions: health.issues || []
        });
      }
    });

    return recommendations;
  }

  calculateOverallHealth(scores) {
    if (scores.length === 0) return 100;
    const validScores = scores.filter(score => typeof score === 'number' && !isNaN(score));
    if (validScores.length === 0) return 75;

    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }

  generateActionItems(details) {
    const actionItems = [];

    // Generate action items based on project status
    if (details.projects && details.projects.active_projects > 5) {
      actionItems.push({
        priority: 'medium',
        description: 'Review project portfolio for optimization opportunities',
        owner: 'PM Team',
        due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }

    // Generate action items based on milestone status
    if (details.milestones && details.milestones.overdue > 0) {
      actionItems.push({
        priority: 'high',
        description: `Address ${details.milestones.overdue} overdue milestones`,
        owner: 'Project Leads',
        due_date: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }

    return actionItems;
  }

  generateNextPeriodFocus(summary) {
    const focusAreas = [];

    if (summary.overall_health < 80) {
      focusAreas.push('Improve overall project health metrics');
    }

    if (summary.resource_utilization > 90) {
      focusAreas.push('Optimize resource allocation and prevent burnout');
    }

    if (summary.team_velocity < 75) {
      focusAreas.push('Enhance team productivity and remove blockers');
    }

    focusAreas.push('Continue strategic planning and stakeholder communication');

    return focusAreas;
  }
}

module.exports = PMAgent;
