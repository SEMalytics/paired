const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Impediment Tracking Module
 *
 * Handles identification, tracking, escalation, and resolution of team impediments
 * with priority management and impact assessment.
 */
class ImpedimentTracking {
  constructor(agentDir, sharedMemory) {
    this.agentDir = agentDir;
    this.sharedMemory = sharedMemory;
    this.trackingDir = path.join(agentDir, 'tracking');

    // Impediment state
    this.activeImpediments = new Map();
    this.impedimentHistory = [];
    this.impedimentCounter = 0;
  }

  /**
   * Initialize Impediment Tracking module
   */
  async initialize() {
    console.log('🚧 Impediment Tracking module initializing...');

    // Ensure directories exist
    await this.ensureDirectoryExists(this.trackingDir);

    // Load existing impediments
    await this.loadExistingImpediments();

    // Load impediment history
    await this.loadImpedimentHistory();

    console.log('🚧 Impediment Tracking module initialized');
  }

  /**
   * Load existing impediments
   */
  async loadExistingImpediments() {
    try {
      const impedimentLogPath = path.join(this.trackingDir, 'impediment_log.md');
      if (await this.fileExists(impedimentLogPath)) {
        const content = await fs.readFile(impedimentLogPath, 'utf8');
        this.parseActiveImpediments(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load existing impediments: ${error.message}`);
    }
  }

  /**
   * Parse active impediments from log content
   */
  parseActiveImpediments(content) {
    const lines = content.split('\n');
    let currentImpediment = null;

    for (const line of lines) {
      // Look for impediment headers
      const headerMatch = line.match(/^## (IMP-\d+): (.+)/);
      if (headerMatch) {
        if (currentImpediment) {
          this.activeImpediments.set(currentImpediment.id, currentImpediment);
        }

        currentImpediment = {
          id: headerMatch[1],
          title: headerMatch[2],
          status: 'open',
          priority: 'medium',
          created_date: new Date().toISOString(),
          affected_stories: [],
          resolution_notes: []
        };

        // Update counter
        const impNumber = parseInt(headerMatch[1].replace('IMP-', ''));
        this.impedimentCounter = Math.max(this.impedimentCounter, impNumber);
      }

      // Parse impediment details
      if (currentImpediment) {
        if (line.includes('**Status:**')) {
          currentImpediment.status = line.match(/\*\*Status:\*\*\s*(.+)/)?.[1] || 'open';
        } else if (line.includes('**Priority:**')) {
          currentImpediment.priority = line.match(/\*\*Priority:\*\*\s*(.+)/)?.[1] || 'medium';
        } else if (line.includes('**Created:**')) {
          currentImpediment.created_date = line.match(/\*\*Created:\*\*\s*(.+)/)?.[1] || new Date().toISOString();
        } else if (line.includes('**Description:**')) {
          currentImpediment.description = line.match(/\*\*Description:\*\*\s*(.+)/)?.[1] || '';
        }
      }
    }

    // Add the last impediment
    if (currentImpediment) {
      this.activeImpediments.set(currentImpediment.id, currentImpediment);
    }
  }

  /**
   * Load impediment history
   */
  async loadImpedimentHistory() {
    try {
      const historyPath = path.join(this.trackingDir, 'impediment_history.md');
      if (await this.fileExists(historyPath)) {
        const content = await fs.readFile(historyPath, 'utf8');
        this.parseImpedimentHistory(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load impediment history: ${error.message}`);
    }
  }

  /**
   * Parse impediment history
   */
  parseImpedimentHistory(content) {
    // Simplified history parsing
    const resolvedCount = (content.match(/Status:\s*resolved/gi) || []).length;
    this.impedimentHistory = Array.from({ length: resolvedCount }, (_, i) => ({
      id: `IMP-${i + 1}`,
      status: 'resolved',
      resolved_date: new Date().toISOString()
    }));
  }

  /**
   * Track new impediment
   */
  async trackImpediment(parameters) {
    const { title, description, priority = 'medium', affected_stories = [] } = parameters;

    console.log(`🚧 Tracking new impediment: ${title}`);

    // Generate impediment ID
    this.impedimentCounter++;
    const impedimentId = `IMP-${this.impedimentCounter.toString().padStart(3, '0')}`;

    // Create impediment object
    const impediment = {
      id: impedimentId,
      title: title,
      description: description || 'No description provided',
      priority: this.validatePriority(priority),
      status: 'open',
      created_date: new Date().toISOString(),
      created_by: 'Scrum Master Agent (Bob)',
      affected_stories: Array.isArray(affected_stories) ? affected_stories : [],
      impact_assessment: await this.assessImpedimentImpact(priority, affected_stories),
      escalation_level: this.determineEscalationLevel(priority),
      resolution_notes: [],
      updates: []
    };

    // Store in active impediments
    this.activeImpediments.set(impedimentId, impediment);

    // Log impediment
    await this.logImpediment(impediment);

    // Check if escalation is needed
    if (impediment.escalation_level === 'immediate') {
      await this.escalateImpediment(impediment);
    }

    // Update impediment tracking
    await this.updateImpedimentTracking();

    return {
      impediment_id: impedimentId,
      title: title,
      priority: impediment.priority,
      escalation_level: impediment.escalation_level,
      impact_assessment: impediment.impact_assessment,
      affected_stories_count: impediment.affected_stories.length
    };
  }

  /**
   * Validate priority level
   */
  validatePriority(priority) {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(priority.toLowerCase()) ? priority.toLowerCase() : 'medium';
  }

  /**
   * Assess impediment impact
   */
  async assessImpedimentImpact(priority, affectedStories) {
    const impact = {
      severity: priority,
      affected_stories_count: affectedStories.length,
      estimated_delay_days: 0,
      team_impact: 'low',
      sprint_risk: 'low'
    };

    // Calculate estimated delay
    switch (priority) {
    case 'critical':
      impact.estimated_delay_days = 3 + affectedStories.length;
      impact.team_impact = 'high';
      impact.sprint_risk = 'high';
      break;
    case 'high':
      impact.estimated_delay_days = 1 + Math.floor(affectedStories.length / 2);
      impact.team_impact = 'medium';
      impact.sprint_risk = 'medium';
      break;
    case 'medium':
      impact.estimated_delay_days = Math.floor(affectedStories.length / 3);
      impact.team_impact = 'low';
      impact.sprint_risk = 'low';
      break;
    default:
      impact.estimated_delay_days = 0;
    }

    // Assess team impact
    if (affectedStories.length > 3) {
      impact.team_impact = 'high';
      impact.sprint_risk = 'medium';
    }

    return impact;
  }

  /**
   * Determine escalation level
   */
  determineEscalationLevel(priority) {
    switch (priority) {
    case 'critical':
      return 'immediate';
    case 'high':
      return 'same_day';
    case 'medium':
      return 'next_standup';
    default:
      return 'next_planning';
    }
  }

  /**
   * Log impediment to file
   */
  async logImpediment(impediment) {
    const logPath = path.join(this.trackingDir, 'impediment_log.md');

    const logEntry = `
## ${impediment.id}: ${impediment.title}

**Status:** ${impediment.status}
**Priority:** ${impediment.priority}
**Created:** ${impediment.created_date}
**Created By:** ${impediment.created_by}

**Description:** ${impediment.description}

**Impact Assessment:**
- **Severity:** ${impediment.impact_assessment.severity}
- **Affected Stories:** ${impediment.impact_assessment.affected_stories_count}
- **Estimated Delay:** ${impediment.impact_assessment.estimated_delay_days} days
- **Team Impact:** ${impediment.impact_assessment.team_impact}
- **Sprint Risk:** ${impediment.impact_assessment.sprint_risk}

**Escalation Level:** ${impediment.escalation_level}

**Affected Stories:**
${impediment.affected_stories.map(story => `- ${story}`).join('\n') || '- None specified'}

**Resolution Notes:**
- Impediment logged and tracked
- Escalation level: ${impediment.escalation_level}

---
`;

    try {
      await fs.appendFile(logPath, logEntry, 'utf8');
    } catch (error) {
      // Create file if it doesn't exist
      const header = `# Impediment Log

This file tracks all impediments identified and managed by the Scrum Master Agent.

## Active Impediments
`;
      await fs.writeFile(logPath, header + logEntry, 'utf8');
    }
  }

  /**
   * Escalate impediment
   */
  async escalateImpediment(impediment) {
    console.log(`🚨 Escalating ${impediment.priority} priority impediment: ${impediment.title}`);

    const escalationNote = {
      timestamp: new Date().toISOString(),
      action: 'escalated',
      level: impediment.escalation_level,
      reason: `${impediment.priority} priority impediment requires immediate attention`
    };

    impediment.updates.push(escalationNote);

    // Log escalation
    await this.logImpedimentUpdate(impediment.id, escalationNote);

    // In a real implementation, this would send notifications, create tickets, etc.
    return {
      escalated: true,
      escalation_level: impediment.escalation_level,
      notification_sent: true
    };
  }

  /**
   * Update impediment status
   */
  async updateImpedimentStatus(impedimentId, newStatus, notes = '') {
    const impediment = this.activeImpediments.get(impedimentId);
    if (!impediment) {
      throw new Error(`Impediment not found: ${impedimentId}`);
    }

    const oldStatus = impediment.status;
    impediment.status = newStatus;
    impediment.last_updated = new Date().toISOString();

    // Add update note
    const updateNote = {
      timestamp: impediment.last_updated,
      action: 'status_change',
      old_status: oldStatus,
      new_status: newStatus,
      notes: notes
    };

    impediment.updates.push(updateNote);

    // If resolved, move to history
    if (newStatus === 'resolved') {
      impediment.resolved_date = impediment.last_updated;
      this.impedimentHistory.push(impediment);
      this.activeImpediments.delete(impedimentId);
    }

    // Log update
    await this.logImpedimentUpdate(impedimentId, updateNote);

    // Update tracking file
    await this.updateImpedimentTracking();

    return {
      impediment_id: impedimentId,
      old_status: oldStatus,
      new_status: newStatus,
      updated_at: impediment.last_updated
    };
  }

  /**
   * Log impediment update
   */
  async logImpedimentUpdate(impedimentId, updateNote) {
    const logPath = path.join(this.trackingDir, 'impediment_log.md');

    const updateEntry = `
### Update - ${updateNote.timestamp}
**Action:** ${updateNote.action}
${updateNote.old_status ? `**Status Change:** ${updateNote.old_status} → ${updateNote.new_status}` : ''}
**Notes:** ${updateNote.notes || 'No additional notes'}
${updateNote.reason ? `**Reason:** ${updateNote.reason}` : ''}

`;

    try {
      // Read current content and insert update after the impediment header
      const content = await fs.readFile(logPath, 'utf8');
      const impedimentHeaderRegex = new RegExp(`(## ${impedimentId}:.*?)(\\n---)`);
      const updatedContent = content.replace(impedimentHeaderRegex, `$1${updateEntry}$2`);
      await fs.writeFile(logPath, updatedContent, 'utf8');
    } catch (error) {
      console.warn(`⚠️ Could not update impediment log: ${error.message}`);
    }
  }

  /**
   * Get impediment status report
   */
  async getImpedimentStatusReport() {
    const report = {
      active_impediments: this.activeImpediments.size,
      resolved_impediments: this.impedimentHistory.length,
      critical_impediments: 0,
      high_priority_impediments: 0,
      escalated_impediments: 0,
      average_resolution_time: 0,
      impediments_by_priority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      recent_impediments: []
    };

    // Analyze active impediments
    for (const impediment of this.activeImpediments.values()) {
      report.impediments_by_priority[impediment.priority]++;

      if (impediment.priority === 'critical') {
        report.critical_impediments++;
      } else if (impediment.priority === 'high') {
        report.high_priority_impediments++;
      }

      if (impediment.escalation_level === 'immediate') {
        report.escalated_impediments++;
      }

      report.recent_impediments.push({
        id: impediment.id,
        title: impediment.title,
        priority: impediment.priority,
        status: impediment.status,
        days_open: this.calculateDaysOpen(impediment.created_date)
      });
    }

    // Calculate average resolution time
    if (this.impedimentHistory.length > 0) {
      const totalResolutionTime = this.impedimentHistory.reduce((sum, imp) => {
        if (imp.resolved_date && imp.created_date) {
          return sum + this.calculateDaysBetween(imp.created_date, imp.resolved_date);
        }
        return sum;
      }, 0);
      report.average_resolution_time = Math.round(totalResolutionTime / this.impedimentHistory.length * 10) / 10;
    }

    // Sort recent impediments by priority and date
    report.recent_impediments.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return report;
  }

  /**
   * Generate impediment recommendations
   */
  async generateImpedimentRecommendations() {
    const recommendations = [];
    const report = await this.getImpedimentStatusReport();

    // Critical impediment recommendations
    if (report.critical_impediments > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'impediment_resolution',
        message: `${report.critical_impediments} critical impediment(s) require immediate attention`,
        actions: [
          'Escalate to senior management',
          'Assign dedicated resources',
          'Daily impediment review meetings',
          'Consider scope reduction if needed'
        ]
      });
    }

    // High volume recommendations
    if (report.active_impediments > 5) {
      recommendations.push({
        priority: 'high',
        category: 'impediment_volume',
        message: 'High number of active impediments may indicate systemic issues',
        actions: [
          'Conduct root cause analysis',
          'Review team processes',
          'Implement preventive measures',
          'Consider additional resources'
        ]
      });
    }

    // Long-running impediment recommendations
    const longRunningImpediments = report.recent_impediments.filter(imp => imp.days_open > 5);
    if (longRunningImpediments.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'resolution_time',
        message: `${longRunningImpediments.length} impediment(s) have been open for more than 5 days`,
        actions: [
          'Review impediment resolution process',
          'Assign specific owners to impediments',
          'Set resolution deadlines',
          'Consider alternative solutions'
        ]
      });
    }

    // Process improvement recommendations
    if (report.average_resolution_time > 3) {
      recommendations.push({
        priority: 'low',
        category: 'process_improvement',
        message: 'Average impediment resolution time is higher than target',
        actions: [
          'Streamline escalation process',
          'Improve impediment identification',
          'Create impediment resolution playbook',
          'Regular impediment review sessions'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Update impediment tracking file
   */
  async updateImpedimentTracking() {
    const trackingPath = path.join(this.trackingDir, 'impediment_tracking.md');
    const report = await this.getImpedimentStatusReport();
    const recommendations = await this.generateImpedimentRecommendations();

    const content = `# Impediment Tracking Dashboard

## Summary
- **Active Impediments:** ${report.active_impediments}
- **Resolved Impediments:** ${report.resolved_impediments}
- **Critical Impediments:** ${report.critical_impediments}
- **Average Resolution Time:** ${report.average_resolution_time} days

## Impediments by Priority
- **Critical:** ${report.impediments_by_priority.critical}
- **High:** ${report.impediments_by_priority.high}
- **Medium:** ${report.impediments_by_priority.medium}
- **Low:** ${report.impediments_by_priority.low}

## Active Impediments
${report.recent_impediments.map(imp =>
    `- **${imp.id}:** ${imp.title} (${imp.priority} priority, ${imp.days_open} days open)`
  ).join('\n') || 'No active impediments'}

## Recommendations
${recommendations.map(rec =>
    `### ${rec.category.replace('_', ' ').toUpperCase()} (${rec.priority} priority)
${rec.message}

**Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('\n') || 'No specific recommendations at this time'}

---
*Last updated: ${new Date().toISOString()}*
`;

    await fs.writeFile(trackingPath, content, 'utf8');
  }

  /**
   * Helper methods
   */
  calculateDaysOpen(createdDate) {
    const created = new Date(createdDate);
    const today = new Date();
    const diffTime = today - created;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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

module.exports = ImpedimentTracking;
