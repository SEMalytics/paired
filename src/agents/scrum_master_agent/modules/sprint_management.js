const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Sprint Management Module
 * 
 * Handles sprint lifecycle management, velocity tracking, burndown charts,
 * and sprint health monitoring for the Scrum Master Agent.
 */
class SprintManagement {
  constructor(agentDir, sharedMemory) {
    this.agentDir = agentDir;
    this.sharedMemory = sharedMemory;
    this.trackingDir = path.join(agentDir, 'tracking');
    this.sprintsDir = path.join(agentDir, 'sprints');
    
    // Sprint state
    this.currentSprint = null;
    this.sprintHistory = [];
    this.velocityData = [];
  }

  /**
   * Initialize Sprint Management module
   */
  async initialize() {
    console.log('🏃 Sprint Management module initializing...');
    
    // Ensure directories exist
    await this.ensureDirectoryExists(this.trackingDir);
    await this.ensureDirectoryExists(this.sprintsDir);
    
    // Load existing sprint data
    await this.loadSprintHistory();
    await this.loadVelocityData();
    await this.loadCurrentSprint();
    
    console.log('🏃 Sprint Management module initialized');
  }

  /**
   * Load sprint history
   */
  async loadSprintHistory() {
    try {
      const sprintFiles = await fs.readdir(this.sprintsDir);
      this.sprintHistory = [];
      
      for (const file of sprintFiles.filter(f => f.endsWith('.yml'))) {
        const sprintPath = path.join(this.sprintsDir, file);
        const content = await fs.readFile(sprintPath, 'utf8');
        const sprintData = yaml.load(content);
        this.sprintHistory.push(sprintData);
      }
      
      // Sort by sprint number
      this.sprintHistory.sort((a, b) => (a.number || 0) - (b.number || 0));
    } catch (error) {
      console.warn(`⚠️ Could not load sprint history: ${error.message}`);
    }
  }

  /**
   * Load velocity data
   */
  async loadVelocityData() {
    try {
      const velocityPath = path.join(this.trackingDir, 'velocity_metrics.md');
      if (await this.fileExists(velocityPath)) {
        const content = await fs.readFile(velocityPath, 'utf8');
        this.velocityData = this.parseVelocityData(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load velocity data: ${error.message}`);
    }
  }

  /**
   * Load current sprint
   */
  async loadCurrentSprint() {
    try {
      const currentSprintPath = path.join(this.trackingDir, 'sprint_tracking.md');
      if (await this.fileExists(currentSprintPath)) {
        const content = await fs.readFile(currentSprintPath, 'utf8');
        this.currentSprint = this.parseCurrentSprint(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load current sprint: ${error.message}`);
    }
  }

  /**
   * Parse velocity data from markdown
   */
  parseVelocityData(content) {
    const velocityData = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/Sprint (\d+).*Velocity:\s*(\d+)/);
      if (match) {
        velocityData.push({
          sprint: parseInt(match[1]),
          velocity: parseInt(match[2])
        });
      }
    }
    
    return velocityData;
  }

  /**
   * Parse current sprint data
   */
  parseCurrentSprint(content) {
    const lines = content.split('\n');
    const sprint = {
      number: null,
      startDate: null,
      endDate: null,
      goal: null,
      stories: [],
      velocity: 0,
      status: 'active',
      burndown: []
    };

    let inStoriesSection = false;
    let inBurndownSection = false;

    for (const line of lines) {
      if (line.includes('## Sprint')) {
        sprint.number = line.match(/Sprint\s*(\d+)/)?.[1];
      } else if (line.includes('**Start Date:**')) {
        sprint.startDate = line.match(/\*\*Start Date:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('**End Date:**')) {
        sprint.endDate = line.match(/\*\*End Date:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('**Sprint Goal:**')) {
        sprint.goal = line.match(/\*\*Sprint Goal:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('## Stories')) {
        inStoriesSection = true;
        inBurndownSection = false;
      } else if (line.includes('## Burndown')) {
        inBurndownSection = true;
        inStoriesSection = false;
      } else if (inStoriesSection && line.startsWith('- ')) {
        const storyMatch = line.match(/- \[(.)\] (.+) \((\d+) points?\)/);
        if (storyMatch) {
          sprint.stories.push({
            status: storyMatch[1] === 'x' ? 'completed' : 'in_progress',
            title: storyMatch[2],
            points: parseInt(storyMatch[3])
          });
        }
      } else if (inBurndownSection && line.includes('Day')) {
        const burndownMatch = line.match(/Day (\d+):\s*(\d+)\s*points/);
        if (burndownMatch) {
          sprint.burndown.push({
            day: parseInt(burndownMatch[1]),
            remaining: parseInt(burndownMatch[2])
          });
        }
      }
    }

    return sprint;
  }

  /**
   * Update story status
   */
  async updateStoryStatus(parameters) {
    const { story_id, status, notes } = parameters;
    
    if (!this.currentSprint) {
      throw new Error('No active sprint found');
    }

    // Find and update story
    const story = this.currentSprint.stories.find(s => s.id === story_id || s.title.includes(story_id));
    if (!story) {
      throw new Error(`Story not found: ${story_id}`);
    }

    const oldStatus = story.status;
    story.status = status;
    story.lastUpdated = new Date().toISOString();
    
    if (notes) {
      story.notes = notes;
    }

    // Update sprint tracking file
    await this.updateSprintTrackingFile();
    
    // Log the status change
    await this.logStatusChange(story_id, oldStatus, status, notes);
    
    return {
      story_id,
      old_status: oldStatus,
      new_status: status,
      updated_at: story.lastUpdated
    };
  }

  /**
   * Analyze sprint health
   */
  async analyzeSprintHealth(parameters = {}) {
    if (!this.currentSprint) {
      return {
        overall_score: 0,
        message: 'No active sprint',
        recommendations: ['Start a new sprint']
      };
    }

    const analysis = {
      overall_score: 0,
      velocity_trend: this.calculateVelocityTrend(),
      story_completion: this.calculateStoryCompletion(),
      burndown_health: this.calculateBurndownHealth(),
      impediment_impact: await this.calculateImpedimentImpact(),
      recommendations: []
    };

    // Calculate overall score (0-100)
    let score = 0;
    
    // Velocity trend (25 points)
    if (analysis.velocity_trend.trend === 'improving') score += 25;
    else if (analysis.velocity_trend.trend === 'stable') score += 20;
    else score += 10;
    
    // Story completion (35 points)
    score += Math.min(35, analysis.story_completion.percentage * 0.35);
    
    // Burndown health (25 points)
    if (analysis.burndown_health.status === 'on_track') score += 25;
    else if (analysis.burndown_health.status === 'at_risk') score += 15;
    else score += 5;
    
    // Impediment impact (15 points)
    score += Math.max(0, 15 - (analysis.impediment_impact.critical_count * 5));
    
    analysis.overall_score = Math.round(score);
    
    // Generate recommendations
    analysis.recommendations = this.generateHealthRecommendations(analysis);
    
    return analysis;
  }

  /**
   * Calculate velocity trend
   */
  calculateVelocityTrend() {
    if (this.velocityData.length < 2) {
      return { trend: 'insufficient_data', message: 'Need more sprint data' };
    }

    const recent = this.velocityData.slice(-3);
    const average = recent.reduce((sum, v) => sum + v.velocity, 0) / recent.length;
    const latest = recent[recent.length - 1].velocity;
    
    let trend = 'stable';
    if (latest > average * 1.1) trend = 'improving';
    else if (latest < average * 0.9) trend = 'declining';
    
    return {
      trend,
      current_velocity: latest,
      average_velocity: Math.round(average),
      change_percentage: Math.round(((latest - average) / average) * 100)
    };
  }

  /**
   * Calculate story completion rate
   */
  calculateStoryCompletion() {
    if (!this.currentSprint || !this.currentSprint.stories.length) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    const completed = this.currentSprint.stories.filter(s => s.status === 'completed').length;
    const total = this.currentSprint.stories.length;
    
    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      total,
      in_progress: this.currentSprint.stories.filter(s => s.status === 'in_progress').length,
      blocked: this.currentSprint.stories.filter(s => s.status === 'blocked').length
    };
  }

  /**
   * Calculate burndown health
   */
  calculateBurndownHealth() {
    if (!this.currentSprint || !this.currentSprint.burndown.length) {
      return { status: 'no_data', message: 'No burndown data available' };
    }

    const burndown = this.currentSprint.burndown;
    const latest = burndown[burndown.length - 1];
    const sprintLength = this.getSprintLengthDays();
    const expectedRemaining = this.calculateExpectedRemaining(latest.day, sprintLength);
    
    let status = 'on_track';
    if (latest.remaining > expectedRemaining * 1.2) status = 'behind';
    else if (latest.remaining > expectedRemaining * 1.1) status = 'at_risk';
    
    return {
      status,
      current_remaining: latest.remaining,
      expected_remaining: expectedRemaining,
      days_left: sprintLength - latest.day,
      burn_rate: this.calculateBurnRate()
    };
  }

  /**
   * Calculate impediment impact
   */
  async calculateImpedimentImpact() {
    try {
      const impedimentPath = path.join(this.trackingDir, 'impediment_log.md');
      if (!await this.fileExists(impedimentPath)) {
        return { critical_count: 0, total_count: 0, impact_score: 0 };
      }

      const content = await fs.readFile(impedimentPath, 'utf8');
      const lines = content.split('\n');
      
      let critical = 0;
      let total = 0;
      
      for (const line of lines) {
        if (line.includes('Priority: Critical')) critical++;
        if (line.includes('Priority:')) total++;
      }
      
      return {
        critical_count: critical,
        total_count: total,
        impact_score: Math.max(0, 100 - (critical * 20 + (total - critical) * 5))
      };
    } catch (error) {
      return { critical_count: 0, total_count: 0, impact_score: 100 };
    }
  }

  /**
   * Generate health recommendations
   */
  generateHealthRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.overall_score < 60) {
      recommendations.push({
        priority: 'high',
        category: 'sprint_health',
        message: 'Sprint health is critical - immediate attention needed',
        actions: ['Review sprint scope', 'Address impediments', 'Consider scope reduction']
      });
    }
    
    if (analysis.velocity_trend.trend === 'declining') {
      recommendations.push({
        priority: 'medium',
        category: 'velocity',
        message: 'Velocity is declining - investigate root causes',
        actions: ['Analyze story complexity', 'Check team capacity', 'Review impediments']
      });
    }
    
    if (analysis.story_completion.percentage < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'completion',
        message: 'Story completion rate is low',
        actions: ['Break down large stories', 'Focus on WIP limits', 'Daily progress check']
      });
    }
    
    if (analysis.burndown_health.status === 'behind') {
      recommendations.push({
        priority: 'high',
        category: 'burndown',
        message: 'Sprint is significantly behind schedule',
        actions: ['Scope reduction', 'Resource reallocation', 'Impediment resolution']
      });
    }
    
    if (analysis.impediment_impact.critical_count > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'impediments',
        message: `${analysis.impediment_impact.critical_count} critical impediment(s) blocking progress`,
        actions: ['Escalate to management', 'Assign impediment owners', 'Daily impediment review']
      });
    }
    
    return recommendations;
  }

  /**
   * Generate sprint report
   */
  async generateSprintReport(parameters) {
    const { sprint_number, report_type = 'summary' } = parameters;
    
    let sprint;
    if (sprint_number) {
      sprint = this.sprintHistory.find(s => s.number == sprint_number);
    } else {
      sprint = this.currentSprint;
    }
    
    if (!sprint) {
      throw new Error(`Sprint not found: ${sprint_number || 'current'}`);
    }
    
    const report = {
      sprint_number: sprint.number,
      sprint_goal: sprint.goal,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      status: sprint.status,
      summary: await this.generateSprintSummary(sprint),
      metrics: await this.generateSprintMetrics(sprint),
      stories: sprint.stories,
      recommendations: []
    };
    
    if (report_type === 'detailed') {
      report.burndown_chart = sprint.burndown;
      report.daily_progress = await this.getDailyProgress(sprint);
      report.impediment_history = await this.getImpedimentHistory(sprint);
    }
    
    // Save report
    const reportPath = path.join(this.sprintsDir, `sprint_${sprint.number}_report.md`);
    await this.saveSprintReport(report, reportPath);
    
    return report;
  }

  /**
   * Generate sprint summary
   */
  async generateSprintSummary(sprint) {
    const completed = sprint.stories.filter(s => s.status === 'completed').length;
    const total = sprint.stories.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completion_rate: completionRate,
      stories_completed: completed,
      stories_total: total,
      velocity: sprint.velocity || 0,
      goal_achieved: completionRate >= 80
    };
  }

  /**
   * Generate sprint metrics
   */
  async generateSprintMetrics(sprint) {
    return {
      velocity: sprint.velocity || 0,
      story_points_completed: sprint.stories
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.points || 0), 0),
      story_points_planned: sprint.stories
        .reduce((sum, s) => sum + (s.points || 0), 0),
      cycle_time_avg: await this.calculateAverageCycleTime(sprint),
      impediment_count: await this.getSprintImpedimentCount(sprint)
    };
  }

  /**
   * Update sprint tracking file
   */
  async updateSprintTrackingFile() {
    if (!this.currentSprint) return;
    
    const trackingPath = path.join(this.trackingDir, 'sprint_tracking.md');
    const content = this.generateSprintTrackingContent(this.currentSprint);
    await fs.writeFile(trackingPath, content, 'utf8');
  }

  /**
   * Generate sprint tracking content
   */
  generateSprintTrackingContent(sprint) {
    const completed = sprint.stories.filter(s => s.status === 'completed').length;
    const total = sprint.stories.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return `# Sprint ${sprint.number} Tracking

**Start Date:** ${sprint.startDate}
**End Date:** ${sprint.endDate}
**Sprint Goal:** ${sprint.goal}
**Status:** ${sprint.status}

## Progress Summary
- **Completion Rate:** ${completionRate}%
- **Stories Completed:** ${completed}/${total}
- **Current Velocity:** ${sprint.velocity || 0}

## Stories
${sprint.stories.map(story => 
  `- [${story.status === 'completed' ? 'x' : ' '}] ${story.title} (${story.points || 0} points)`
).join('\n')}

## Burndown Chart
${sprint.burndown.map(point => 
  `Day ${point.day}: ${point.remaining} points remaining`
).join('\n')}

---
*Last updated: ${new Date().toISOString()}*
`;
  }

  /**
   * Log status change
   */
  async logStatusChange(storyId, oldStatus, newStatus, notes) {
    const logPath = path.join(this.trackingDir, 'story_status_log.md');
    const timestamp = new Date().toISOString();
    const logEntry = `\n## ${timestamp}\n- **Story:** ${storyId}\n- **Status Change:** ${oldStatus} → ${newStatus}\n- **Notes:** ${notes || 'No notes'}\n`;
    
    try {
      await fs.appendFile(logPath, logEntry, 'utf8');
    } catch (error) {
      // Create file if it doesn't exist
      await fs.writeFile(logPath, `# Story Status Change Log\n${logEntry}`, 'utf8');
    }
  }

  /**
   * Helper methods
   */
  getSprintLengthDays() {
    return 10; // Default 2-week sprint
  }

  calculateExpectedRemaining(currentDay, sprintLength) {
    if (!this.currentSprint || !this.currentSprint.stories.length) return 0;
    
    const totalPoints = this.currentSprint.stories.reduce((sum, s) => sum + (s.points || 0), 0);
    const dailyBurnRate = totalPoints / sprintLength;
    return Math.max(0, totalPoints - (currentDay * dailyBurnRate));
  }

  calculateBurnRate() {
    if (!this.currentSprint || this.currentSprint.burndown.length < 2) return 0;
    
    const burndown = this.currentSprint.burndown;
    const recent = burndown.slice(-2);
    return recent[0].remaining - recent[1].remaining;
  }

  async calculateAverageCycleTime(sprint) {
    // Simplified cycle time calculation
    return 3.5; // Default average in days
  }

  async getSprintImpedimentCount(sprint) {
    try {
      const impedimentPath = path.join(this.trackingDir, 'impediment_log.md');
      if (!await this.fileExists(impedimentPath)) return 0;
      
      const content = await fs.readFile(impedimentPath, 'utf8');
      return (content.match(/Sprint.*${sprint.number}/g) || []).length;
    } catch (error) {
      return 0;
    }
  }

  async getDailyProgress(sprint) {
    return sprint.burndown || [];
  }

  async getImpedimentHistory(sprint) {
    return []; // Simplified for now
  }

  async saveSprintReport(report, reportPath) {
    const content = `# Sprint ${report.sprint_number} Report

## Sprint Overview
- **Goal:** ${report.sprint_goal}
- **Duration:** ${report.start_date} to ${report.end_date}
- **Status:** ${report.status}

## Summary
- **Completion Rate:** ${report.summary.completion_rate}%
- **Stories Completed:** ${report.summary.stories_completed}/${report.summary.stories_total}
- **Velocity:** ${report.summary.velocity}
- **Goal Achieved:** ${report.summary.goal_achieved ? 'Yes' : 'No'}

## Metrics
- **Story Points Completed:** ${report.metrics.story_points_completed}
- **Story Points Planned:** ${report.metrics.story_points_planned}
- **Average Cycle Time:** ${report.metrics.cycle_time_avg} days
- **Impediments:** ${report.metrics.impediment_count}

## Stories
${report.stories.map(story => 
  `- [${story.status === 'completed' ? 'x' : ' '}] ${story.title} (${story.points || 0} points) - ${story.status}`
).join('\n')}

---
*Generated: ${new Date().toISOString()}*
`;
    
    await fs.writeFile(reportPath, content, 'utf8');
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

module.exports = SprintManagement;
