/**
 * Project Planning Module for PM Agent (Alex - Alexander)
 *
 * Handles comprehensive project planning including scope definition,
 * requirement analysis, timeline creation, and strategic planning.
 * Like Alexander's strategic campaigns, every project needs careful planning.
 */

const fs = require('fs').promises;
const path = require('path');

class ProjectPlanning {
  constructor(agent) {
    this.agent = agent;
    this.projectsPath = path.join(process.cwd(), 'data', 'pm_agent', 'projects.json');
    this.templatesPath = path.join(process.cwd(), 'data', 'pm_agent', 'project_templates.json');

    // Project planning state
    this.activeProjects = new Map();
    this.projectTemplates = new Map();
    this.planningMethodologies = [
      'agile',
      'waterfall',
      'hybrid',
      'lean',
      'kanban'
    ];

    // Initialization guard
    this.isInitialized = false;
  }

  /**
   * Initialize the project planning module
   */
  async initialize() {
    if (this.isInitialized) {
      return; // Already initialized, skip
    }

    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.projectsPath), { recursive: true });

      // Load existing projects
      await this.loadProjects();

      // Load project templates
      await this.loadProjectTemplates();

      this.isInitialized = true;
      console.log(`📋 Project Planning module initialized with ${this.activeProjects.size} active projects`);

    } catch (error) {
      console.error('❌ Failed to initialize Project Planning module:', error.message);
      throw error;
    }
  }

  /**
   * Load existing projects from storage
   */
  async loadProjects() {
    try {
      const data = await fs.readFile(this.projectsPath, 'utf8');
      const projects = JSON.parse(data);

      projects.forEach(project => {
        this.activeProjects.set(project.id, project);
      });

      console.log(`📚 Loaded ${this.activeProjects.size} existing projects`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading projects:', error.message);
      }
      // Create empty projects file
      await this.saveProjects();
    }
  }

  /**
   * Load project templates
   */
  async loadProjectTemplates() {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf8');
      const templates = JSON.parse(data);

      templates.forEach(template => {
        this.projectTemplates.set(template.type, template);
      });

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading project templates:', error.message);
      }
      // Initialize default templates
      await this.initializeDefaultTemplates();
    }
  }

  /**
   * Save projects to storage
   */
  async saveProjects() {
    try {
      const projects = Array.from(this.activeProjects.values());
      await fs.writeFile(this.projectsPath, JSON.stringify(projects, null, 2));
    } catch (error) {
      console.error('❌ Error saving projects:', error.message);
      throw error;
    }
  }

  /**
   * Initialize default project templates
   */
  async initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        type: 'web_application',
        name: 'Web Application Development',
        phases: ['Planning', 'Design', 'Development', 'Testing', 'Deployment'],
        typical_duration: '12-16 weeks',
        key_roles: ['PM', 'UX Designer', 'Frontend Dev', 'Backend Dev', 'QA'],
        deliverables: ['Requirements Doc', 'Design System', 'MVP', 'Test Suite', 'Production Deploy']
      },
      {
        type: 'api_development',
        name: 'API Development Project',
        phases: ['Analysis', 'Design', 'Implementation', 'Documentation', 'Integration'],
        typical_duration: '6-10 weeks',
        key_roles: ['PM', 'Backend Dev', 'DevOps', 'QA'],
        deliverables: ['API Spec', 'Implementation', 'Documentation', 'Test Suite']
      },
      {
        type: 'research_project',
        name: 'Research & Analysis Project',
        phases: ['Scoping', 'Research', 'Analysis', 'Reporting', 'Presentation'],
        typical_duration: '4-8 weeks',
        key_roles: ['PM', 'Analyst', 'Researcher', 'Stakeholders'],
        deliverables: ['Research Plan', 'Data Collection', 'Analysis Report', 'Recommendations']
      }
    ];

    defaultTemplates.forEach(template => {
      this.projectTemplates.set(template.type, template);
    });

    // Save templates
    await fs.writeFile(this.templatesPath, JSON.stringify(defaultTemplates, null, 2));
    console.log('📋 Project templates initialized');
  }

  /**
   * Create a comprehensive project plan
   */
  async createProjectPlan(projectScope, requirements, constraints) {
    try {
      const projectId = `project-${Date.now()}`;

      console.log(`📋 Creating project plan: ${projectScope.name || projectId}`);

      // Analyze project scope and select appropriate template
      const template = this.selectProjectTemplate(projectScope, requirements);

      // Create project structure
      const project = {
        id: projectId,
        name: projectScope.name || `Project ${projectId}`,
        description: projectScope.description || '',
        created: new Date().toISOString(),
        status: 'planning',
        template_type: template.type,

        // Project details
        scope: projectScope,
        requirements: requirements,
        constraints: constraints,

        // Planning outputs
        phases: this.createProjectPhases(template, requirements, constraints),
        timeline: this.createProjectTimeline(template, constraints),
        resources: this.identifyRequiredResources(template, requirements),
        risks: this.identifyProjectRisks(projectScope, requirements, constraints),
        success_criteria: this.defineSuccessCriteria(projectScope, requirements),

        // Tracking
        progress: 0,
        current_phase: template.phases[0],
        milestones: [],
        decisions: [],
        changes: []
      };

      // Generate detailed work breakdown structure
      project.work_breakdown = this.createWorkBreakdownStructure(project);

      // Create communication plan
      project.communication_plan = this.createCommunicationPlan(project);

      // Store project
      this.activeProjects.set(projectId, project);
      await this.saveProjects();

      console.log(`✅ Project plan created: ${project.name} (${project.phases.length} phases, ${project.resources.length} resources)`);

      return {
        project_id: projectId,
        project_name: project.name,
        phases: project.phases.length,
        estimated_duration: project.timeline.total_duration,
        required_resources: project.resources.length,
        identified_risks: project.risks.length,
        success_criteria: project.success_criteria.length,
        project_plan: project
      };

    } catch (error) {
      console.error('❌ Failed to create project plan:', error.message);
      throw error;
    }
  }

  /**
   * Select appropriate project template based on scope and requirements
   */
  selectProjectTemplate(scope, requirements) {
    // Simple template selection logic - can be enhanced
    if (scope.type && this.projectTemplates.has(scope.type)) {
      return this.projectTemplates.get(scope.type);
    }

    // Default to web application template
    return this.projectTemplates.get('web_application') || {
      type: 'custom',
      name: 'Custom Project',
      phases: ['Planning', 'Execution', 'Review'],
      typical_duration: '8-12 weeks',
      key_roles: ['PM', 'Developer', 'QA'],
      deliverables: ['Requirements', 'Implementation', 'Documentation']
    };
  }

  /**
   * Create project phases with detailed activities
   */
  createProjectPhases(template, requirements, constraints) {
    return template.phases.map((phaseName, index) => ({
      id: `phase-${index + 1}`,
      name: phaseName,
      order: index + 1,
      status: index === 0 ? 'ready' : 'pending',
      activities: this.generatePhaseActivities(phaseName, requirements),
      deliverables: this.generatePhaseDeliverables(phaseName, template),
      duration_estimate: this.estimatePhaseDuration(phaseName, requirements, constraints),
      dependencies: index > 0 ? [`phase-${index}`] : [],
      resources_needed: this.identifyPhaseResources(phaseName, template)
    }));
  }

  /**
   * Generate activities for a project phase
   */
  generatePhaseActivities(phaseName, requirements) {
    const activityMap = {
      'Planning': [
        'Stakeholder identification and analysis',
        'Requirements gathering and validation',
        'Risk assessment and mitigation planning',
        'Resource allocation and team formation',
        'Timeline and milestone definition'
      ],
      'Design': [
        'System architecture design',
        'User experience design',
        'Technical specification creation',
        'Design review and approval',
        'Prototype development'
      ],
      'Development': [
        'Environment setup and configuration',
        'Core functionality implementation',
        'Integration development',
        'Code review and quality assurance',
        'Unit testing and debugging'
      ],
      'Testing': [
        'Test plan creation and review',
        'Test case development and execution',
        'Bug identification and resolution',
        'Performance and security testing',
        'User acceptance testing'
      ],
      'Deployment': [
        'Production environment preparation',
        'Deployment pipeline setup',
        'Go-live execution and monitoring',
        'Post-deployment validation',
        'Documentation and handover'
      ]
    };

    return activityMap[phaseName] || [
      `${phaseName} planning and preparation`,
      `${phaseName} execution and monitoring`,
      `${phaseName} review and validation`
    ];
  }

  /**
   * Generate deliverables for a project phase
   */
  generatePhaseDeliverables(phaseName, template) {
    const deliverableMap = {
      'Planning': ['Project Charter', 'Requirements Document', 'Project Plan', 'Risk Register'],
      'Design': ['System Architecture', 'UI/UX Designs', 'Technical Specifications', 'Prototype'],
      'Development': ['Source Code', 'Unit Tests', 'Integration Tests', 'Code Documentation'],
      'Testing': ['Test Plans', 'Test Results', 'Bug Reports', 'Quality Metrics'],
      'Deployment': ['Production System', 'Deployment Guide', 'User Documentation', 'Support Procedures']
    };

    return deliverableMap[phaseName] || [`${phaseName} Deliverables`];
  }

  /**
   * Create project timeline with milestones
   */
  createProjectTimeline(template, constraints) {
    const startDate = constraints.start_date ? new Date(constraints.start_date) : new Date();
    const estimatedWeeks = this.parseTypicalDuration(template.typical_duration);

    return {
      start_date: startDate.toISOString(),
      estimated_end_date: new Date(startDate.getTime() + (estimatedWeeks * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      total_duration: `${estimatedWeeks} weeks`,
      milestones: this.generateMilestones(template, startDate, estimatedWeeks),
      buffer_time: constraints.buffer_percentage || 20
    };
  }

  /**
   * Parse typical duration string to weeks
   */
  parseTypicalDuration(duration) {
    const match = duration.match(/(\d+)-?(\d+)?\s*weeks?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return Math.round((min + max) / 2);
    }
    return 12; // Default fallback
  }

  /**
   * Generate project milestones
   */
  generateMilestones(template, startDate, totalWeeks) {
    const milestones = [];
    const weeksPerPhase = Math.floor(totalWeeks / template.phases.length);

    template.phases.forEach((phase, index) => {
      const milestoneDate = new Date(startDate.getTime() + ((index + 1) * weeksPerPhase * 7 * 24 * 60 * 60 * 1000));
      milestones.push({
        id: `milestone-${index + 1}`,
        name: `${phase} Complete`,
        description: `Completion of ${phase} phase`,
        target_date: milestoneDate.toISOString(),
        status: 'pending',
        criteria: [`All ${phase.toLowerCase()} activities completed`, `${phase} deliverables approved`]
      });
    });

    return milestones;
  }

  /**
   * Get project health metrics
   */
  async getProjectHealth(projectId) {
    try {
      const project = this.activeProjects.get(projectId);
      if (!project) {
        return { score: 0, status: 'not_found', issues: ['Project not found'] };
      }

      const health = {
        score: 0,
        status: 'healthy',
        issues: [],
        metrics: {}
      };

      // Calculate health based on various factors
      const progressScore = this.calculateProgressScore(project);
      const timelineScore = this.calculateTimelineScore(project);
      const riskScore = this.calculateRiskScore(project);

      health.score = Math.round((progressScore + timelineScore + riskScore) / 3);
      health.metrics = {
        progress: progressScore,
        timeline: timelineScore,
        risk: riskScore
      };

      // Determine overall status
      if (health.score >= 80) health.status = 'healthy';
      else if (health.score >= 60) health.status = 'at_risk';
      else health.status = 'critical';

      return health;

    } catch (error) {
      console.error('❌ Failed to get project health:', error.message);
      return { score: 0, status: 'error', issues: [error.message] };
    }
  }

  /**
   * Get current project status
   */
  async getProjectStatus() {
    const activeProjects = Array.from(this.activeProjects.values());

    return {
      active_projects: activeProjects.length,
      projects_by_status: this.groupProjectsByStatus(activeProjects),
      health_score: this.calculateOverallHealthScore(activeProjects),
      recent_activities: this.getRecentActivities(activeProjects),
      upcoming_milestones: this.getUpcomingMilestones(activeProjects)
    };
  }

  /**
   * Helper methods for calculations
   */
  calculateProgressScore(project) {
    return Math.min(project.progress || 0, 100);
  }

  calculateTimelineScore(project) {
    // Simple timeline health - can be enhanced
    const now = new Date();
    const endDate = new Date(project.timeline.estimated_end_date);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 30) return 100;
    if (daysRemaining > 7) return 75;
    if (daysRemaining > 0) return 50;
    return 25;
  }

  calculateRiskScore(project) {
    const highRisks = project.risks.filter(r => r.severity === 'high').length;
    const mediumRisks = project.risks.filter(r => r.severity === 'medium').length;

    const riskImpact = (highRisks * 20) + (mediumRisks * 10);
    return Math.max(0, 100 - riskImpact);
  }

  groupProjectsByStatus(projects) {
    return projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});
  }

  calculateOverallHealthScore(projects) {
    if (projects.length === 0) return 100;

    const totalScore = projects.reduce((sum, project) => {
      return sum + (project.health_score || 75);
    }, 0);

    return Math.round(totalScore / projects.length);
  }

  getRecentActivities(projects) {
    // Placeholder for recent activities
    return projects.slice(0, 5).map(project => ({
      project_id: project.id,
      project_name: project.name,
      activity: `${project.current_phase} phase in progress`,
      timestamp: new Date().toISOString()
    }));
  }

  getUpcomingMilestones(projects) {
    const allMilestones = projects.flatMap(project =>
      project.milestones.map(milestone => ({
        ...milestone,
        project_id: project.id,
        project_name: project.name
      }))
    );

    return allMilestones
      .filter(milestone => milestone.status === 'pending')
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
      .slice(0, 10);
  }

  // Additional helper methods for project planning
  identifyRequiredResources(template, requirements) {
    return template.key_roles.map(role => ({
      type: 'human_resource',
      role: role,
      allocation: '100%',
      duration: 'full_project',
      skills_required: this.getSkillsForRole(role)
    }));
  }

  getSkillsForRole(role) {
    const skillMap = {
      'PM': ['Project Management', 'Stakeholder Communication', 'Risk Management'],
      'UX Designer': ['User Research', 'UI/UX Design', 'Prototyping'],
      'Frontend Dev': ['JavaScript', 'React/Vue', 'CSS/HTML'],
      'Backend Dev': ['Node.js/Python', 'Database Design', 'API Development'],
      'QA': ['Test Planning', 'Automation', 'Bug Tracking'],
      'DevOps': ['CI/CD', 'Cloud Platforms', 'Infrastructure']
    };

    return skillMap[role] || ['Domain Expertise'];
  }

  identifyProjectRisks(scope, requirements, constraints) {
    const risks = [];

    // Common project risks
    risks.push({
      id: 'risk-timeline',
      category: 'schedule',
      description: 'Project timeline may be too aggressive',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Add buffer time and regular progress reviews'
    });

    risks.push({
      id: 'risk-scope-creep',
      category: 'scope',
      description: 'Requirements may expand during development',
      probability: 'high',
      impact: 'medium',
      mitigation: 'Implement change control process and regular stakeholder reviews'
    });

    return risks;
  }

  defineSuccessCriteria(scope, requirements) {
    return [
      'All functional requirements implemented and tested',
      'Project delivered on time and within budget',
      'Stakeholder acceptance and approval received',
      'Quality standards met and documented',
      'Team knowledge transfer completed'
    ];
  }

  createWorkBreakdownStructure(project) {
    // Simplified WBS generation
    return project.phases.map(phase => ({
      phase_id: phase.id,
      phase_name: phase.name,
      work_packages: phase.activities.map((activity, index) => ({
        id: `${phase.id}-wp-${index + 1}`,
        name: activity,
        estimated_effort: '1-2 days',
        assigned_to: 'TBD',
        dependencies: []
      }))
    }));
  }

  createCommunicationPlan(project) {
    return {
      stakeholder_meetings: 'Weekly',
      status_reports: 'Bi-weekly',
      milestone_reviews: 'At each milestone',
      escalation_process: 'PM -> Sponsor -> Executive',
      communication_channels: ['Email', 'Slack', 'Project Dashboard']
    };
  }

  estimatePhaseDuration(phaseName, requirements, constraints) {
    // Simple estimation logic - can be enhanced
    const baseDurations = {
      'Planning': '2-3 weeks',
      'Design': '3-4 weeks',
      'Development': '6-8 weeks',
      'Testing': '2-3 weeks',
      'Deployment': '1-2 weeks'
    };

    return baseDurations[phaseName] || '2-4 weeks';
  }

  identifyPhaseResources(phaseName, template) {
    const resourceMap = {
      'Planning': ['PM', 'Business Analyst'],
      'Design': ['UX Designer', 'Architect'],
      'Development': ['Frontend Dev', 'Backend Dev'],
      'Testing': ['QA', 'Test Engineer'],
      'Deployment': ['DevOps', 'PM']
    };

    return resourceMap[phaseName] || ['PM'];
  }
}

module.exports = ProjectPlanning;
