const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Ceremony Facilitation Module
 *
 * Handles Scrum ceremony facilitation including sprint planning, daily standups,
 * sprint reviews, and retrospectives with artifact management and tracking.
 */
class CeremonyFacilitation {
  constructor(agentDir, sharedMemory) {
    this.agentDir = agentDir;
    this.sharedMemory = sharedMemory;
    this.ceremoniesDir = path.join(agentDir, 'ceremonies');
    this.templatesDir = path.join(agentDir, 'templates');
    this.trackingDir = path.join(agentDir, 'tracking');

    // Ceremony state
    this.activeCeremonies = new Map();
    this.ceremonyTemplates = new Map();
    this.ceremonyHistory = [];
  }

  /**
   * Initialize Ceremony Facilitation module
   */
  async initialize() {
    console.log('🎯 Ceremony Facilitation module initializing...');

    // Ensure directories exist
    await this.ensureDirectoryExists(this.ceremoniesDir);
    await this.ensureDirectoryExists(this.templatesDir);

    // Load ceremony templates
    await this.loadCeremonyTemplates();

    // Load ceremony history
    await this.loadCeremonyHistory();

    console.log('🎯 Ceremony Facilitation module initialized');
  }

  /**
   * Load ceremony templates
   */
  async loadCeremonyTemplates() {
    try {
      // Create default templates if they don't exist
      await this.createDefaultTemplates();

      // Load all templates
      const templateFiles = await fs.readdir(this.templatesDir);
      for (const file of templateFiles.filter(f => f.endsWith('_template.md'))) {
        const templateName = file.replace('_template.md', '');
        const templatePath = path.join(this.templatesDir, file);
        const content = await fs.readFile(templatePath, 'utf8');
        this.ceremonyTemplates.set(templateName, content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load ceremony templates: ${error.message}`);
      await this.createDefaultTemplates();
    }
  }

  /**
   * Create default ceremony templates
   */
  async createDefaultTemplates() {
    const templates = {
      'sprint_planning_template.md': `# Sprint Planning - Sprint {SPRINT_NUMBER}

## Meeting Details
- **Date:** {DATE}
- **Duration:** {DURATION}
- **Participants:** {PARTICIPANTS}
- **Facilitator:** Scrum Master Agent (Bob)

## Sprint Goal
{SPRINT_GOAL}

## Capacity Planning
- **Team Capacity:** {TEAM_CAPACITY} story points
- **Sprint Length:** {SPRINT_LENGTH} days
- **Available Days:** {AVAILABLE_DAYS}

## Stories Selected
{SELECTED_STORIES}

## Sprint Backlog
{SPRINT_BACKLOG}

## Risks and Dependencies
{RISKS_DEPENDENCIES}

## Definition of Done Review
{DOD_REVIEW}

## Action Items
{ACTION_ITEMS}

---
**Created:** {CREATED_DATE}
**Status:** {STATUS}
`,

      'standup_template.md': `# Daily Standup - {DATE}

## Meeting Details
- **Date:** {DATE}
- **Duration:** 15 minutes
- **Participants:** {PARTICIPANTS}
- **Facilitator:** Scrum Master Agent (Bob)

## Sprint Progress
- **Sprint:** {SPRINT_NUMBER}
- **Days Remaining:** {DAYS_REMAINING}
- **Burndown Status:** {BURNDOWN_STATUS}

## Team Updates
{TEAM_UPDATES}

## Impediments Raised
{IMPEDIMENTS}

## Action Items
{ACTION_ITEMS}

## Follow-up Required
{FOLLOW_UP}

---
**Created:** {CREATED_DATE}
`,

      'retrospective_template.md': `# Sprint Retrospective - Sprint {SPRINT_NUMBER}

## Meeting Details
- **Date:** {DATE}
- **Duration:** {DURATION}
- **Participants:** {PARTICIPANTS}
- **Facilitator:** Scrum Master Agent (Bob)

## Sprint Summary
- **Sprint Goal:** {SPRINT_GOAL}
- **Goal Achieved:** {GOAL_ACHIEVED}
- **Velocity:** {VELOCITY}
- **Stories Completed:** {STORIES_COMPLETED}/{STORIES_PLANNED}

## What Went Well
{WENT_WELL}

## What Could Be Improved
{IMPROVEMENTS}

## Action Items
{ACTION_ITEMS}

## Process Changes
{PROCESS_CHANGES}

## Team Health Check
- **Team Satisfaction:** {TEAM_SATISFACTION}/10
- **Process Satisfaction:** {PROCESS_SATISFACTION}/10
- **Collaboration Rating:** {COLLABORATION_RATING}/10

---
**Created:** {CREATED_DATE}
**Next Review:** {NEXT_REVIEW}
`
    };

    for (const [filename, content] of Object.entries(templates)) {
      const templatePath = path.join(this.templatesDir, filename);
      if (!await this.fileExists(templatePath)) {
        await fs.writeFile(templatePath, content, 'utf8');
        const templateName = filename.replace('_template.md', '');
        this.ceremonyTemplates.set(templateName, content);
      }
    }
  }

  /**
   * Load ceremony history
   */
  async loadCeremonyHistory() {
    try {
      const ceremonyFiles = await fs.readdir(this.ceremoniesDir);
      this.ceremonyHistory = [];

      for (const file of ceremonyFiles.filter(f => f.endsWith('.md'))) {
        const ceremonyPath = path.join(this.ceremoniesDir, file);
        const content = await fs.readFile(ceremonyPath, 'utf8');
        const metadata = this.extractCeremonyMetadata(content);

        this.ceremonyHistory.push({
          file: file,
          path: ceremonyPath,
          ...metadata
        });
      }

      // Sort by date
      this.ceremonyHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.warn(`⚠️ Could not load ceremony history: ${error.message}`);
    }
  }

  /**
   * Extract ceremony metadata from content
   */
  extractCeremonyMetadata(content) {
    const metadata = {
      type: 'unknown',
      date: null,
      sprint: null,
      participants: [],
      status: 'completed'
    };

    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('Sprint Planning')) metadata.type = 'planning';
      else if (line.includes('Daily Standup')) metadata.type = 'standup';
      else if (line.includes('Retrospective')) metadata.type = 'retrospective';
      else if (line.includes('Sprint Review')) metadata.type = 'review';

      if (line.includes('**Date:**')) {
        metadata.date = line.match(/\*\*Date:\*\*\s*(.+)/)?.[1];
      }

      if (line.includes('Sprint') && line.match(/Sprint\s+(\d+)/)) {
        metadata.sprint = line.match(/Sprint\s+(\d+)/)[1];
      }
    }

    return metadata;
  }

  /**
   * Facilitate ceremony
   */
  async facilitateCeremony(parameters) {
    const { ceremony_type, participants = [], agenda = '' } = parameters;

    console.log(`🎯 Facilitating ${ceremony_type} ceremony...`);

    switch (ceremony_type) {
    case 'sprint_planning':
      return await this.conductSprintPlanning({ participants, agenda });
    case 'daily_standup':
      return await this.facilitateStandup({ participants, agenda });
    case 'sprint_review':
      return await this.conductSprintReview({ participants, agenda });
    case 'retrospective':
      return await this.facilitateRetrospective({ participants, agenda });
    default:
      throw new Error(`Unknown ceremony type: ${ceremony_type}`);
    }
  }

  /**
   * Conduct sprint planning
   */
  async conductSprintPlanning(parameters) {
    const { participants = [], agenda = '' } = parameters;

    console.log('🎯 Conducting sprint planning...');

    // Get current sprint info
    const currentSprint = await this.getCurrentSprintInfo();
    const nextSprintNumber = (currentSprint?.number || 0) + 1;

    // Prepare planning data
    const planningData = {
      sprint_number: nextSprintNumber,
      date: new Date().toISOString().split('T')[0],
      duration: '2 hours',
      participants: participants.join(', ') || 'Development Team',
      team_capacity: await this.calculateTeamCapacity(),
      sprint_length: 10, // 2 weeks
      available_days: 10
    };

    // Generate sprint goal
    planningData.sprint_goal = await this.generateSprintGoal(nextSprintNumber);

    // Get candidate stories
    const candidateStories = await this.getCandidateStories();
    planningData.selected_stories = this.formatStoriesForPlanning(candidateStories);

    // Create sprint backlog
    planningData.sprint_backlog = await this.createSprintBacklog(candidateStories);

    // Identify risks and dependencies
    planningData.risks_dependencies = await this.identifyRisksAndDependencies(candidateStories);

    // Fill template
    const template = this.ceremonyTemplates.get('sprint_planning');
    const content = this.fillTemplate(template, {
      ...planningData,
      dod_review: 'Definition of Done reviewed and confirmed',
      action_items: '- Finalize story estimates\n- Set up development environment\n- Schedule daily standups',
      created_date: new Date().toISOString(),
      status: 'completed'
    });

    // Save ceremony artifact
    const ceremonyPath = await this.saveCeremonyArtifact('planning', nextSprintNumber, content);

    // Update sprint tracking
    await this.updateSprintTracking(nextSprintNumber, planningData);

    return {
      ceremony_type: 'sprint_planning',
      sprint_number: nextSprintNumber,
      ceremony_path: ceremonyPath,
      sprint_goal: planningData.sprint_goal,
      stories_selected: candidateStories.length,
      team_capacity: planningData.team_capacity
    };
  }

  /**
   * Facilitate daily standup
   */
  async facilitateStandup(parameters) {
    const { participants = [], agenda = '' } = parameters;

    console.log('☀️ Facilitating daily standup...');

    // Get current sprint info
    const currentSprint = await this.getCurrentSprintInfo();
    if (!currentSprint) {
      throw new Error('No active sprint found for standup');
    }

    // Prepare standup data
    const standupData = {
      date: new Date().toISOString().split('T')[0],
      participants: participants.join(', ') || 'Development Team',
      sprint_number: currentSprint.number,
      days_remaining: await this.calculateDaysRemaining(currentSprint),
      burndown_status: await this.getBurndownStatus(currentSprint)
    };

    // Generate team updates (simplified for demo)
    standupData.team_updates = await this.generateTeamUpdates();

    // Check for impediments
    standupData.impediments = await this.checkForImpediments();

    // Generate action items
    standupData.action_items = await this.generateStandupActionItems(standupData);

    // Fill template
    const template = this.ceremonyTemplates.get('standup');
    const content = this.fillTemplate(template, {
      ...standupData,
      follow_up: standupData.impediments.length > 0 ? 'Follow up on impediments after standup' : 'No follow-up required',
      created_date: new Date().toISOString()
    });

    // Save ceremony artifact
    const ceremonyPath = await this.saveCeremonyArtifact('standup', currentSprint.number, content);

    return {
      ceremony_type: 'daily_standup',
      sprint_number: currentSprint.number,
      ceremony_path: ceremonyPath,
      impediments_count: standupData.impediments.length,
      days_remaining: standupData.days_remaining,
      burndown_status: standupData.burndown_status
    };
  }

  /**
   * Conduct sprint review
   */
  async conductSprintReview(parameters) {
    const { participants = [], agenda = '' } = parameters;

    console.log('🎯 Conducting sprint review...');

    // Get current sprint info
    const currentSprint = await this.getCurrentSprintInfo();
    if (!currentSprint) {
      throw new Error('No active sprint found for review');
    }

    // Calculate sprint metrics
    const sprintMetrics = await this.calculateSprintMetrics(currentSprint);

    // Create review content
    const reviewContent = `# Sprint Review - Sprint ${currentSprint.number}

## Meeting Details
- **Date:** ${new Date().toISOString().split('T')[0]}
- **Duration:** 1 hour
- **Participants:** ${participants.join(', ') || 'Development Team, Product Owner, Stakeholders'}
- **Facilitator:** Scrum Master Agent (Bob)

## Sprint Summary
- **Sprint Goal:** ${currentSprint.goal || 'Sprint goal TBD'}
- **Goal Achieved:** ${sprintMetrics.goal_achieved ? 'Yes' : 'No'}
- **Velocity:** ${sprintMetrics.velocity} story points
- **Stories Completed:** ${sprintMetrics.stories_completed}/${sprintMetrics.stories_planned}

## Completed Stories
${sprintMetrics.completed_stories.map(story => `- ${story.title} (${story.points} points)`).join('\n')}

## Demo Items
${sprintMetrics.demo_items.map(item => `- ${item}`).join('\n')}

## Stakeholder Feedback
- Feedback to be collected during review
- Action items to be created based on feedback

## Metrics
- **Completion Rate:** ${sprintMetrics.completion_rate}%
- **Burndown Status:** ${sprintMetrics.burndown_status}
- **Quality Metrics:** ${sprintMetrics.quality_score}/10

---
**Created:** ${new Date().toISOString()}
**Status:** completed
`;

    // Save ceremony artifact
    const ceremonyPath = await this.saveCeremonyArtifact('review', currentSprint.number, reviewContent);

    return {
      ceremony_type: 'sprint_review',
      sprint_number: currentSprint.number,
      ceremony_path: ceremonyPath,
      completion_rate: sprintMetrics.completion_rate,
      velocity: sprintMetrics.velocity,
      goal_achieved: sprintMetrics.goal_achieved
    };
  }

  /**
   * Facilitate retrospective
   */
  async facilitateRetrospective(parameters) {
    const { participants = [], agenda = '' } = parameters;

    console.log('🔄 Facilitating retrospective...');

    // Get current sprint info
    const currentSprint = await this.getCurrentSprintInfo();
    if (!currentSprint) {
      throw new Error('No active sprint found for retrospective');
    }

    // Calculate sprint metrics for retrospective
    const sprintMetrics = await this.calculateSprintMetrics(currentSprint);

    // Generate retrospective insights
    const retroData = {
      sprint_number: currentSprint.number,
      date: new Date().toISOString().split('T')[0],
      duration: '1 hour',
      participants: participants.join(', ') || 'Development Team',
      sprint_goal: currentSprint.goal || 'Sprint goal TBD',
      goal_achieved: sprintMetrics.goal_achieved ? 'Yes' : 'No',
      velocity: sprintMetrics.velocity,
      stories_completed: sprintMetrics.stories_completed,
      stories_planned: sprintMetrics.stories_planned
    };

    // Generate what went well
    retroData.went_well = await this.generateWentWell(sprintMetrics);

    // Generate improvements
    retroData.improvements = await this.generateImprovements(sprintMetrics);

    // Generate action items
    retroData.action_items = await this.generateRetroActionItems(sprintMetrics);

    // Generate process changes
    retroData.process_changes = await this.generateProcessChanges(sprintMetrics);

    // Team health metrics (simplified)
    retroData.team_satisfaction = Math.floor(Math.random() * 3) + 8; // 8-10
    retroData.process_satisfaction = Math.floor(Math.random() * 3) + 7; // 7-9
    retroData.collaboration_rating = Math.floor(Math.random() * 2) + 8; // 8-9

    // Fill template
    const template = this.ceremonyTemplates.get('retrospective');
    const content = this.fillTemplate(template, {
      ...retroData,
      created_date: new Date().toISOString(),
      next_review: this.calculateNextReviewDate()
    });

    // Save ceremony artifact
    const ceremonyPath = await this.saveCeremonyArtifact('retrospective', currentSprint.number, content);

    // Save action items for tracking
    await this.saveRetroActionItems(retroData.action_items, currentSprint.number);

    return {
      ceremony_type: 'retrospective',
      sprint_number: currentSprint.number,
      ceremony_path: ceremonyPath,
      action_items_count: retroData.action_items.split('\n').filter(line => line.trim().startsWith('-')).length,
      team_satisfaction: retroData.team_satisfaction,
      velocity: retroData.velocity
    };
  }

  /**
   * Get upcoming ceremonies
   */
  async getUpcomingCeremonies() {
    const upcoming = [];
    const today = new Date();

    // Check if daily standup is due (every day during sprint)
    const currentSprint = await this.getCurrentSprintInfo();
    if (currentSprint && currentSprint.status === 'active') {
      const lastStandup = await this.getLastCeremonyDate('standup');
      if (!lastStandup || this.daysSince(lastStandup) >= 1) {
        upcoming.push({
          type: 'daily_standup',
          due_date: today.toISOString().split('T')[0],
          priority: 'high'
        });
      }
    }

    // Check if sprint planning is due
    if (!currentSprint || currentSprint.status === 'completed') {
      upcoming.push({
        type: 'sprint_planning',
        due_date: today.toISOString().split('T')[0],
        priority: 'critical'
      });
    }

    // Check if sprint review/retro is due (end of sprint)
    if (currentSprint && this.isSprintEnding(currentSprint)) {
      upcoming.push({
        type: 'sprint_review',
        due_date: currentSprint.endDate || today.toISOString().split('T')[0],
        priority: 'high'
      });
      upcoming.push({
        type: 'retrospective',
        due_date: currentSprint.endDate || today.toISOString().split('T')[0],
        priority: 'high'
      });
    }

    return upcoming;
  }

  /**
   * Helper methods
   */
  async getCurrentSprintInfo() {
    try {
      const sprintTrackingPath = path.join(this.trackingDir, 'sprint_tracking.md');
      if (await this.fileExists(sprintTrackingPath)) {
        const content = await fs.readFile(sprintTrackingPath, 'utf8');
        return this.parseSprintInfo(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not get current sprint info: ${error.message}`);
    }
    return null;
  }

  parseSprintInfo(content) {
    const sprint = { number: 1, status: 'active', stories: [] };
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('Sprint') && line.match(/Sprint\s+(\d+)/)) {
        sprint.number = parseInt(line.match(/Sprint\s+(\d+)/)[1]);
      }
      if (line.includes('**Sprint Goal:**')) {
        sprint.goal = line.match(/\*\*Sprint Goal:\*\*\s*(.+)/)?.[1];
      }
      if (line.includes('**End Date:**')) {
        sprint.endDate = line.match(/\*\*End Date:\*\*\s*(.+)/)?.[1];
      }
    }

    return sprint;
  }

  async calculateTeamCapacity() {
    // Simplified capacity calculation
    return 40; // 40 story points per sprint
  }

  async generateSprintGoal(sprintNumber) {
    return `Complete core functionality for Sprint ${sprintNumber} deliverables`;
  }

  async getCandidateStories() {
    // Simplified - return mock stories
    return [
      { id: 'STORY-001', title: 'User authentication', points: 5, priority: 'high' },
      { id: 'STORY-002', title: 'Dashboard implementation', points: 8, priority: 'medium' },
      { id: 'STORY-003', title: 'API integration', points: 3, priority: 'high' }
    ];
  }

  formatStoriesForPlanning(stories) {
    return stories.map(story =>
      `- ${story.title} (${story.points} points) - ${story.priority} priority`
    ).join('\n');
  }

  async createSprintBacklog(stories) {
    const totalPoints = stories.reduce((sum, story) => sum + story.points, 0);
    return `Total: ${totalPoints} story points\n${this.formatStoriesForPlanning(stories)}`;
  }

  async identifyRisksAndDependencies(stories) {
    return '- External API dependency for authentication\n- Database migration required\n- UI design approval pending';
  }

  async calculateDaysRemaining(sprint) {
    if (!sprint.endDate) return 5;
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  async getBurndownStatus(sprint) {
    return 'On track'; // Simplified
  }

  async generateTeamUpdates() {
    return `- Developer 1: Completed authentication module, working on API integration
- Developer 2: Dashboard UI 80% complete, testing in progress
- Developer 3: Database schema updated, starting data migration`;
  }

  async checkForImpediments() {
    return []; // Simplified - no impediments
  }

  async generateStandupActionItems(standupData) {
    const actions = [];
    if (standupData.impediments.length > 0) {
      actions.push('- Address reported impediments');
    }
    if (standupData.days_remaining <= 2) {
      actions.push('- Prepare for sprint review');
    }
    actions.push('- Continue daily progress tracking');
    return actions.join('\n');
  }

  async calculateSprintMetrics(sprint) {
    return {
      goal_achieved: true,
      velocity: 16,
      stories_completed: 3,
      stories_planned: 4,
      completion_rate: 75,
      completed_stories: [
        { title: 'User authentication', points: 5 },
        { title: 'Dashboard implementation', points: 8 },
        { title: 'API integration', points: 3 }
      ],
      demo_items: [
        'User login and registration',
        'Main dashboard with widgets',
        'API data integration'
      ],
      burndown_status: 'On track',
      quality_score: 8
    };
  }

  async generateWentWell(metrics) {
    const items = [];
    if (metrics.goal_achieved) items.push('- Sprint goal was achieved');
    if (metrics.completion_rate >= 80) items.push('- High story completion rate');
    if (metrics.velocity >= 15) items.push('- Good team velocity maintained');
    items.push('- Strong team collaboration');
    items.push('- Effective daily standups');
    return items.join('\n');
  }

  async generateImprovements(metrics) {
    const items = [];
    if (metrics.completion_rate < 80) items.push('- Improve story estimation accuracy');
    if (metrics.quality_score < 8) items.push('- Enhance code review process');
    items.push('- Better sprint planning preparation');
    items.push('- More frequent stakeholder feedback');
    return items.join('\n');
  }

  async generateRetroActionItems(metrics) {
    const items = [];
    items.push('- Implement story point estimation workshop');
    items.push('- Set up automated testing pipeline');
    items.push('- Schedule mid-sprint check-ins');
    return items.join('\n');
  }

  async generateProcessChanges(metrics) {
    return '- Adopt planning poker for estimation\n- Implement WIP limits on board\n- Add definition of ready checklist';
  }

  calculateNextReviewDate() {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 14); // Next sprint
    return nextReview.toISOString().split('T')[0];
  }

  fillTemplate(template, data) {
    let content = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key.toUpperCase()}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value || '');
    }
    return content;
  }

  async saveCeremonyArtifact(ceremonyType, sprintNumber, content) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${ceremonyType}_sprint_${sprintNumber}_${timestamp}.md`;
    const ceremonyPath = path.join(this.ceremoniesDir, filename);

    await fs.writeFile(ceremonyPath, content, 'utf8');

    // Update ceremony history
    this.ceremonyHistory.unshift({
      file: filename,
      path: ceremonyPath,
      type: ceremonyType,
      date: timestamp,
      sprint: sprintNumber.toString(),
      status: 'completed'
    });

    return ceremonyPath;
  }

  async updateSprintTracking(sprintNumber, planningData) {
    const trackingPath = path.join(this.trackingDir, 'sprint_tracking.md');
    const content = `# Sprint ${sprintNumber} Tracking

**Start Date:** ${planningData.date}
**End Date:** ${this.calculateSprintEndDate(planningData.date, planningData.sprint_length)}
**Sprint Goal:** ${planningData.sprint_goal}
**Status:** active

## Progress Summary
- **Completion Rate:** 0%
- **Stories Completed:** 0/${planningData.selected_stories.split('\n').length}
- **Current Velocity:** 0

## Stories
${planningData.selected_stories}

---
*Last updated: ${new Date().toISOString()}*
`;

    await fs.writeFile(trackingPath, content, 'utf8');
  }

  calculateSprintEndDate(startDate, sprintLength) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + sprintLength);
    return start.toISOString().split('T')[0];
  }

  async saveRetroActionItems(actionItems, sprintNumber) {
    const actionPath = path.join(this.trackingDir, 'retrospective_actions.md');
    const timestamp = new Date().toISOString();

    const content = `
## Sprint ${sprintNumber} Retrospective Actions - ${timestamp}
${actionItems}
**Status:** Open
**Due Date:** ${this.calculateNextReviewDate()}

`;

    try {
      await fs.appendFile(actionPath, content, 'utf8');
    } catch (error) {
      const header = '# Retrospective Action Items\n\nTracking action items from sprint retrospectives.\n';
      await fs.writeFile(actionPath, header + content, 'utf8');
    }
  }

  async getLastCeremonyDate(ceremonyType) {
    const ceremony = this.ceremonyHistory.find(c => c.type === ceremonyType);
    return ceremony ? ceremony.date : null;
  }

  daysSince(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today - date;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isSprintEnding(sprint) {
    if (!sprint.endDate) return false;
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysRemaining <= 1;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = CeremonyFacilitation;
