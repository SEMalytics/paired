const fs = require('fs').promises;
const path = require('path');

/**
 * Team Orchestration Module for PM Agent (Alex - Alexander)
 *
 * Manages team coordination, communication, and collaboration across projects.
 * Like Alexander's ability to unite diverse armies from different cultures,
 * effective team orchestration brings together varied skills and personalities
 * to achieve common objectives through strategic coordination.
 */
class TeamOrchestration {
  constructor(agent) {
    this.agent = agent;
    this.teamsPath = path.join(process.cwd(), 'data', 'pm_agent', 'teams.json');
    this.collaborationsPath = path.join(process.cwd(), 'data', 'pm_agent', 'collaborations.json');

    // Team orchestration state
    this.teams = new Map();
    this.collaborations = new Map();
    this.orchestrationTypes = [
      'project_kickoff',
      'daily_standup',
      'sprint_planning',
      'retrospective',
      'cross_team_sync',
      'stakeholder_review'
    ];

    this.teamRoles = [
      'project_manager',
      'tech_lead',
      'senior_developer',
      'developer',
      'designer',
      'qa_engineer',
      'devops_engineer',
      'business_analyst',
      'product_owner'
    ];
  }

  /**
   * Initialize the team orchestration module
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.teamsPath), { recursive: true });

      // Load existing teams
      await this.loadTeams();

      // Load collaboration history
      await this.loadCollaborations();

      // Initialize sample teams if none exist
      if (this.teams.size === 0) {
        await this.initializeSampleTeams();
      }

      console.log(`👥 Team Orchestration module initialized with ${this.teams.size} teams`);

    } catch (error) {
      console.error('❌ Failed to initialize Team Orchestration module:', error.message);
      throw error;
    }
  }

  /**
   * Load existing teams from storage
   */
  async loadTeams() {
    try {
      const data = await fs.readFile(this.teamsPath, 'utf8');
      const teams = JSON.parse(data);

      teams.forEach(team => {
        this.teams.set(team.id, team);
      });

      console.log(`📚 Loaded ${this.teams.size} existing teams`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading teams:', error.message);
      }
      // Create empty teams file
      await this.saveTeams();
    }
  }

  /**
   * Load collaboration history
   */
  async loadCollaborations() {
    try {
      const data = await fs.readFile(this.collaborationsPath, 'utf8');
      const collaborations = JSON.parse(data);

      collaborations.forEach(collaboration => {
        this.collaborations.set(collaboration.id, collaboration);
      });

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading collaborations:', error.message);
      }
      this.collaborations = new Map();
      await this.saveCollaborations();
    }
  }

  /**
   * Save teams to storage
   */
  async saveTeams() {
    try {
      const teams = Array.from(this.teams.values());
      await fs.writeFile(this.teamsPath, JSON.stringify(teams, null, 2));
    } catch (error) {
      console.error('❌ Error saving teams:', error.message);
      throw error;
    }
  }

  /**
   * Save collaborations to storage
   */
  async saveCollaborations() {
    try {
      const collaborations = Array.from(this.collaborations.values());
      await fs.writeFile(this.collaborationsPath, JSON.stringify(collaborations, null, 2));
    } catch (error) {
      console.error('❌ Error saving collaborations:', error.message);
      throw error;
    }
  }

  /**
   * Initialize sample teams
   */
  async initializeSampleTeams() {
    const sampleTeams = [
      {
        id: 'team-alpha',
        name: 'Alpha Development Team',
        description: 'Core product development team',
        type: 'development',
        status: 'active',
        members: [
          { id: 'member-001', name: 'Sarah Chen', role: 'tech_lead', skills: ['React', 'Node.js', 'Architecture'] },
          { id: 'member-002', name: 'Mike Rodriguez', role: 'senior_developer', skills: ['Python', 'PostgreSQL', 'DevOps'] },
          { id: 'member-003', name: 'Emma Thompson', role: 'designer', skills: ['Figma', 'User Research', 'Prototyping'] },
          { id: 'member-004', name: 'David Kim', role: 'qa_engineer', skills: ['Automation', 'Testing', 'Quality Assurance'] }
        ],
        projects: ['project-001', 'project-002'],
        performance_metrics: {
          velocity: 85,
          collaboration_score: 92,
          delivery_rate: 88
        }
      },
      {
        id: 'team-beta',
        name: 'Beta Innovation Team',
        description: 'Research and innovation focused team',
        type: 'innovation',
        status: 'active',
        members: [
          { id: 'member-005', name: 'Alex Johnson', role: 'project_manager', skills: ['Agile', 'Stakeholder Management', 'Strategy'] },
          { id: 'member-006', name: 'Lisa Wang', role: 'business_analyst', skills: ['Requirements', 'Process Design', 'Analytics'] },
          { id: 'member-007', name: 'Tom Baker', role: 'developer', skills: ['JavaScript', 'APIs', 'Integration'] }
        ],
        projects: ['project-003'],
        performance_metrics: {
          velocity: 78,
          collaboration_score: 85,
          delivery_rate: 82
        }
      }
    ];

    for (const team of sampleTeams) {
      team.created_date = new Date().toISOString();
      team.last_updated = new Date().toISOString();
      team.communication_channels = ['Slack', 'Email', 'Video Calls'];
      team.meeting_cadence = 'Daily standups, Weekly planning';
      this.teams.set(team.id, team);
    }

    await this.saveTeams();
    console.log('👥 Sample teams initialized');
  }

  /**
   * Orchestrate team coordination
   */
  async orchestrateTeam(teamMembers, coordinationType) {
    try {
      console.log(`👥 Orchestrating team coordination: ${coordinationType}`);

      const orchestration = {
        id: `orchestration-${Date.now()}`,
        type: coordinationType,
        created: new Date().toISOString(),
        team_members: teamMembers,
        coordination_plan: {},
        activities: [],
        outcomes: {},
        success_metrics: {},
        follow_up_actions: []
      };

      // Create coordination plan based on type
      orchestration.coordination_plan = this.createCoordinationPlan(coordinationType, teamMembers);

      // Execute coordination activities
      orchestration.activities = await this.executeCoordinationActivities(orchestration.coordination_plan);

      // Assess coordination outcomes
      orchestration.outcomes = this.assessCoordinationOutcomes(orchestration.activities);

      // Define success metrics
      orchestration.success_metrics = this.defineSuccessMetrics(coordinationType, orchestration.outcomes);

      // Generate follow-up actions
      orchestration.follow_up_actions = this.generateFollowUpActions(orchestration.outcomes);

      // Store orchestration record
      this.collaborations.set(orchestration.id, orchestration);
      await this.saveCollaborations();

      console.log(`✅ Team orchestration completed: ${orchestration.activities.length} activities executed`);

      return {
        orchestration_id: orchestration.id,
        coordination_type: coordinationType,
        team_size: teamMembers.length,
        activities_completed: orchestration.activities.length,
        success_score: orchestration.success_metrics.overall_score || 85,
        follow_up_actions: orchestration.follow_up_actions.length,
        detailed_results: orchestration
      };

    } catch (error) {
      console.error('❌ Failed to orchestrate team:', error.message);
      throw error;
    }
  }

  /**
   * Create coordination plan based on type
   */
  createCoordinationPlan(coordinationType, teamMembers) {
    const planTemplates = {
      'project_kickoff': {
        duration: '2 hours',
        objectives: [
          'Align team on project vision and goals',
          'Define roles and responsibilities',
          'Establish communication protocols',
          'Set initial milestones and timeline'
        ],
        activities: [
          'Project overview presentation',
          'Team introductions and role clarification',
          'Q&A and discussion session',
          'Next steps planning'
        ],
        deliverables: ['Project charter', 'Team contact list', 'Communication plan']
      },
      'daily_standup': {
        duration: '15 minutes',
        objectives: [
          'Share progress updates',
          'Identify blockers and dependencies',
          'Coordinate daily activities',
          'Maintain team alignment'
        ],
        activities: [
          'Individual progress updates',
          'Blocker identification and resolution',
          'Priority alignment',
          'Quick coordination'
        ],
        deliverables: ['Updated task status', 'Blocker list', 'Daily priorities']
      },
      'sprint_planning': {
        duration: '4 hours',
        objectives: [
          'Plan upcoming sprint work',
          'Estimate effort and capacity',
          'Define sprint goals',
          'Assign tasks and responsibilities'
        ],
        activities: [
          'Sprint goal definition',
          'Backlog refinement',
          'Task estimation and assignment',
          'Capacity planning'
        ],
        deliverables: ['Sprint backlog', 'Sprint goals', 'Task assignments']
      },
      'cross_team_sync': {
        duration: '1 hour',
        objectives: [
          'Coordinate between multiple teams',
          'Resolve inter-team dependencies',
          'Share progress and blockers',
          'Align on shared objectives'
        ],
        activities: [
          'Team status updates',
          'Dependency mapping',
          'Conflict resolution',
          'Coordination planning'
        ],
        deliverables: ['Dependency matrix', 'Action items', 'Sync schedule']
      }
    };

    const template = planTemplates[coordinationType] || planTemplates['daily_standup'];

    return {
      ...template,
      team_size: teamMembers.length,
      participants: teamMembers.map(member => ({
        id: member.id || `member-${Date.now()}`,
        name: member.name || member.role,
        role: member.role,
        responsibilities: this.defineParticipantResponsibilities(member.role, coordinationType)
      })),
      success_criteria: this.defineCoordinationSuccessCriteria(coordinationType),
      risk_mitigation: this.identifyCoordinationRisks(coordinationType, teamMembers)
    };
  }

  /**
   * Execute coordination activities
   */
  async executeCoordinationActivities(coordinationPlan) {
    const executedActivities = [];

    for (const activity of coordinationPlan.activities) {
      const execution = {
        activity: activity,
        status: 'completed',
        duration: this.estimateActivityDuration(activity, coordinationPlan.team_size),
        participants: coordinationPlan.participants.filter(p =>
          this.shouldParticipateInActivity(p.role, activity)
        ),
        outcomes: this.simulateActivityOutcomes(activity, coordinationPlan.participants),
        timestamp: new Date().toISOString()
      };

      executedActivities.push(execution);
    }

    return executedActivities;
  }

  /**
   * Assess coordination outcomes
   */
  assessCoordinationOutcomes(activities) {
    const outcomes = {
      participation_rate: 0,
      engagement_score: 0,
      objective_completion: 0,
      communication_effectiveness: 0,
      identified_issues: [],
      resolved_blockers: [],
      new_action_items: []
    };

    // Calculate participation rate
    const totalParticipants = activities.reduce((sum, activity) =>
      sum + activity.participants.length, 0
    );
    outcomes.participation_rate = Math.round((totalParticipants / (activities.length * 4)) * 100);

    // Simulate engagement score based on activity types
    outcomes.engagement_score = Math.round(75 + Math.random() * 20);

    // Simulate objective completion
    outcomes.objective_completion = Math.round(80 + Math.random() * 15);

    // Simulate communication effectiveness
    outcomes.communication_effectiveness = Math.round(85 + Math.random() * 10);

    // Generate sample issues and resolutions
    outcomes.identified_issues = [
      'Resource allocation conflicts',
      'Timeline dependencies',
      'Technical integration challenges'
    ].slice(0, Math.floor(Math.random() * 3) + 1);

    outcomes.resolved_blockers = [
      'API endpoint specification clarified',
      'Database schema conflicts resolved',
      'Testing environment access granted'
    ].slice(0, Math.floor(Math.random() * 3) + 1);

    outcomes.new_action_items = [
      'Schedule follow-up technical discussion',
      'Update project timeline based on new requirements',
      'Coordinate with external stakeholders'
    ].slice(0, Math.floor(Math.random() * 4) + 2);

    return outcomes;
  }

  /**
   * Define success metrics for coordination
   */
  defineSuccessMetrics(coordinationType, outcomes) {
    const baseScore = (
      outcomes.participation_rate * 0.2 +
      outcomes.engagement_score * 0.3 +
      outcomes.objective_completion * 0.3 +
      outcomes.communication_effectiveness * 0.2
    );

    return {
      overall_score: Math.round(baseScore),
      participation_rate: outcomes.participation_rate,
      engagement_level: outcomes.engagement_score,
      objective_achievement: outcomes.objective_completion,
      communication_quality: outcomes.communication_effectiveness,
      issues_identified: outcomes.identified_issues.length,
      blockers_resolved: outcomes.resolved_blockers.length,
      action_items_generated: outcomes.new_action_items.length,
      success_threshold: this.getSuccessThreshold(coordinationType)
    };
  }

  /**
   * Generate follow-up actions
   */
  generateFollowUpActions(outcomes) {
    const actions = [];

    // Actions based on participation rate
    if (outcomes.participation_rate < 80) {
      actions.push({
        type: 'process_improvement',
        priority: 'high',
        description: 'Improve meeting attendance and participation',
        owner: 'project_manager',
        due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }

    // Actions based on identified issues
    outcomes.identified_issues.forEach((issue, index) => {
      actions.push({
        type: 'issue_resolution',
        priority: index === 0 ? 'high' : 'medium',
        description: `Address: ${issue}`,
        owner: 'team_lead',
        due_date: new Date(Date.now() + ((index + 3) * 24 * 60 * 60 * 1000)).toISOString()
      });
    });

    // Actions for new action items
    outcomes.new_action_items.forEach((item, index) => {
      actions.push({
        type: 'action_item',
        priority: 'medium',
        description: item,
        owner: 'assigned_team_member',
        due_date: new Date(Date.now() + ((index + 5) * 24 * 60 * 60 * 1000)).toISOString()
      });
    });

    return actions;
  }

  /**
   * Get team health metrics
   */
  async getTeamHealth(projectId) {
    try {
      const projectTeams = Array.from(this.teams.values())
        .filter(t => !projectId || t.projects.includes(projectId));

      if (projectTeams.length === 0) {
        return { score: 100, status: 'no_teams', issues: [] };
      }

      const health = {
        score: 0,
        status: 'healthy',
        issues: [],
        metrics: {}
      };

      // Calculate team health metrics
      const avgVelocity = projectTeams.reduce((sum, team) =>
        sum + (team.performance_metrics?.velocity || 75), 0
      ) / projectTeams.length;

      const avgCollaboration = projectTeams.reduce((sum, team) =>
        sum + (team.performance_metrics?.collaboration_score || 80), 0
      ) / projectTeams.length;

      const avgDelivery = projectTeams.reduce((sum, team) =>
        sum + (team.performance_metrics?.delivery_rate || 85), 0
      ) / projectTeams.length;

      // Calculate overall health score
      health.score = Math.round((avgVelocity + avgCollaboration + avgDelivery) / 3);

      health.metrics = {
        total_teams: projectTeams.length,
        average_velocity: Math.round(avgVelocity),
        collaboration_score: Math.round(avgCollaboration),
        delivery_rate: Math.round(avgDelivery),
        active_teams: projectTeams.filter(t => t.status === 'active').length
      };

      // Determine status
      if (health.score >= 80) health.status = 'healthy';
      else if (health.score >= 60) health.status = 'at_risk';
      else health.status = 'critical';

      // Add issues
      if (avgVelocity < 70) {
        health.issues.push('Team velocity below target');
      }
      if (avgCollaboration < 75) {
        health.issues.push('Collaboration scores need improvement');
      }

      return health;

    } catch (error) {
      console.error('❌ Failed to get team health:', error.message);
      return { score: 0, status: 'error', issues: [error.message] };
    }
  }

  /**
   * Get team status summary
   */
  async getTeamStatus() {
    const teams = Array.from(this.teams.values());
    const collaborations = Array.from(this.collaborations.values());

    // Calculate team metrics
    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
    const avgTeamSize = teams.length > 0 ? Math.round(totalMembers / teams.length) : 0;

    // Recent collaboration activity
    const recentCollaborations = collaborations.filter(c => {
      const created = new Date(c.created);
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      return created >= sevenDaysAgo;
    });

    return {
      total_teams: teams.length,
      active_teams: teams.filter(t => t.status === 'active').length,
      total_members: totalMembers,
      average_team_size: avgTeamSize,
      teams_by_type: this.groupTeamsByType(teams),
      velocity: this.calculateAverageVelocity(teams),
      collaboration_activities: recentCollaborations.length,
      health_score: (await this.getTeamHealth()).score,
      recent_orchestrations: recentCollaborations.slice(0, 5)
    };
  }

  /**
   * Helper methods
   */
  defineParticipantResponsibilities(role, coordinationType) {
    const responsibilities = {
      'project_manager': ['Facilitate discussion', 'Track action items', 'Ensure objectives are met'],
      'tech_lead': ['Provide technical guidance', 'Identify technical risks', 'Coordinate development activities'],
      'developer': ['Share progress updates', 'Identify blockers', 'Estimate effort'],
      'designer': ['Present design updates', 'Gather feedback', 'Coordinate with development'],
      'qa_engineer': ['Report testing status', 'Identify quality risks', 'Plan testing activities']
    };

    return responsibilities[role] || ['Participate actively', 'Share relevant updates', 'Contribute to discussions'];
  }

  defineCoordinationSuccessCriteria(coordinationType) {
    const criteria = {
      'project_kickoff': ['All team members understand project goals', 'Roles and responsibilities are clear', 'Communication plan is established'],
      'daily_standup': ['All blockers are identified', 'Progress is shared', 'Daily priorities are aligned'],
      'sprint_planning': ['Sprint goals are defined', 'Tasks are estimated and assigned', 'Team capacity is planned']
    };

    return criteria[coordinationType] || ['Objectives are met', 'Participants are engaged', 'Action items are defined'];
  }

  identifyCoordinationRisks(coordinationType, teamMembers) {
    const risks = [];

    if (teamMembers.length > 8) {
      risks.push('Large team size may reduce meeting efficiency');
    }

    if (coordinationType === 'cross_team_sync') {
      risks.push('Coordination complexity increases with multiple teams');
    }

    return risks;
  }

  estimateActivityDuration(activity, teamSize) {
    const baseDurations = {
      'Project overview presentation': 30,
      'Team introductions and role clarification': teamSize * 3,
      'Individual progress updates': teamSize * 2,
      'Sprint goal definition': 20,
      'Team status updates': teamSize * 5
    };

    return baseDurations[activity] || 15;
  }

  shouldParticipateInActivity(role, activity) {
    // Simple logic - can be enhanced
    if (activity.includes('technical') && !['developer', 'tech_lead'].includes(role)) {
      return false;
    }
    return true;
  }

  simulateActivityOutcomes(activity, participants) {
    return {
      engagement_level: Math.round(80 + Math.random() * 15),
      information_shared: Math.round(75 + Math.random() * 20),
      decisions_made: Math.floor(Math.random() * 3) + 1,
      action_items_created: Math.floor(Math.random() * 4) + 1
    };
  }

  getSuccessThreshold(coordinationType) {
    const thresholds = {
      'project_kickoff': 85,
      'daily_standup': 75,
      'sprint_planning': 80,
      'cross_team_sync': 70
    };

    return thresholds[coordinationType] || 75;
  }

  groupTeamsByType(teams) {
    return teams.reduce((acc, team) => {
      acc[team.type] = (acc[team.type] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAverageVelocity(teams) {
    if (teams.length === 0) return 0;
    const totalVelocity = teams.reduce((sum, team) =>
      sum + (team.performance_metrics?.velocity || 75), 0
    );
    return Math.round(totalVelocity / teams.length);
  }
}

module.exports = TeamOrchestration;
