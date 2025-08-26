const fs = require('fs').promises;
const path = require('path');

/**
 * Milestone Tracking Module for PM Agent (Alex - Alexander)
 *
 * Manages milestone definition, progress tracking, and achievement validation.
 * Like Alexander's systematic conquest of territories, every milestone
 * represents a strategic victory toward the ultimate objective.
 */
class MilestoneTracking {
  constructor(agent) {
    this.agent = agent;
    this.milestonesPath = path.join(process.cwd(), 'data', 'pm_agent', 'milestones.json');
    this.progressPath = path.join(process.cwd(), 'data', 'pm_agent', 'milestone_progress.json');

    // Milestone tracking state
    this.milestones = new Map();
    this.progressHistory = [];
    this.milestoneTypes = [
      'project_kickoff',
      'requirements_complete',
      'design_approved',
      'development_complete',
      'testing_complete',
      'deployment_ready',
      'project_complete'
    ];
  }

  /**
   * Initialize the milestone tracking module
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.milestonesPath), { recursive: true });

      // Load existing milestones
      await this.loadMilestones();

      // Load progress history
      await this.loadProgressHistory();

      console.log(`🎯 Milestone Tracking module initialized with ${this.milestones.size} milestones`);

    } catch (error) {
      console.error('❌ Failed to initialize Milestone Tracking module:', error.message);
      throw error;
    }
  }

  /**
   * Load existing milestones from storage
   */
  async loadMilestones() {
    try {
      const data = await fs.readFile(this.milestonesPath, 'utf8');
      const milestones = JSON.parse(data);

      milestones.forEach(milestone => {
        this.milestones.set(milestone.id, milestone);
      });

      console.log(`📚 Loaded ${this.milestones.size} existing milestones`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading milestones:', error.message);
      }
      // Create empty milestones file
      await this.saveMilestones();
    }
  }

  /**
   * Load progress history
   */
  async loadProgressHistory() {
    try {
      const data = await fs.readFile(this.progressPath, 'utf8');
      this.progressHistory = JSON.parse(data);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Error loading progress history:', error.message);
      }
      this.progressHistory = [];
      await this.saveProgressHistory();
    }
  }

  /**
   * Save milestones to storage
   */
  async saveMilestones() {
    try {
      const milestones = Array.from(this.milestones.values());
      await fs.writeFile(this.milestonesPath, JSON.stringify(milestones, null, 2));
    } catch (error) {
      console.error('❌ Error saving milestones:', error.message);
      throw error;
    }
  }

  /**
   * Save progress history
   */
  async saveProgressHistory() {
    try {
      await fs.writeFile(this.progressPath, JSON.stringify(this.progressHistory, null, 2));
    } catch (error) {
      console.error('❌ Error saving progress history:', error.message);
      throw error;
    }
  }

  /**
   * Track milestone progress
   */
  async trackMilestone(milestoneId, progressData) {
    try {
      console.log(`🎯 Tracking milestone progress: ${milestoneId}`);

      const milestone = this.milestones.get(milestoneId);
      if (!milestone) {
        throw new Error(`Milestone not found: ${milestoneId}`);
      }

      // Update milestone progress
      const previousProgress = milestone.progress || 0;
      milestone.progress = Math.min(100, Math.max(0, progressData.progress || 0));
      milestone.last_updated = new Date().toISOString();
      milestone.updated_by = progressData.updated_by || 'system';

      // Add progress notes if provided
      if (progressData.notes) {
        milestone.progress_notes = milestone.progress_notes || [];
        milestone.progress_notes.push({
          timestamp: new Date().toISOString(),
          notes: progressData.notes,
          updated_by: progressData.updated_by || 'system'
        });
      }

      // Update status based on progress
      if (milestone.progress >= 100) {
        milestone.status = 'completed';
        milestone.completed_date = new Date().toISOString();
      } else if (milestone.progress > 0) {
        milestone.status = 'in_progress';
      }

      // Record progress history
      this.progressHistory.push({
        milestone_id: milestoneId,
        milestone_name: milestone.name,
        previous_progress: previousProgress,
        new_progress: milestone.progress,
        change: milestone.progress - previousProgress,
        timestamp: new Date().toISOString(),
        updated_by: progressData.updated_by || 'system',
        notes: progressData.notes || ''
      });

      // Check for milestone completion
      if (milestone.status === 'completed' && previousProgress < 100) {
        await this.handleMilestoneCompletion(milestone);
      }

      // Save updates
      await this.saveMilestones();
      await this.saveProgressHistory();

      console.log(`✅ Milestone progress updated: ${milestone.name} (${milestone.progress}%)`);

      return {
        milestone_id: milestoneId,
        milestone_name: milestone.name,
        previous_progress: previousProgress,
        current_progress: milestone.progress,
        status: milestone.status,
        progress_change: milestone.progress - previousProgress,
        completion_date: milestone.completed_date || null,
        next_milestones: this.getNextMilestones(milestone)
      };

    } catch (error) {
      console.error('❌ Failed to track milestone:', error.message);
      throw error;
    }
  }

  /**
   * Handle milestone completion
   */
  async handleMilestoneCompletion(milestone) {
    console.log(`🎉 Milestone completed: ${milestone.name}`);

    // Update dependent milestones
    const dependentMilestones = Array.from(this.milestones.values())
      .filter(m => m.dependencies && m.dependencies.includes(milestone.id));

    for (const dependent of dependentMilestones) {
      if (this.areDependenciesMet(dependent)) {
        dependent.status = 'ready';
        console.log(`🟢 Milestone ready: ${dependent.name}`);
      }
    }

    // Notify stakeholders (placeholder)
    await this.notifyMilestoneCompletion(milestone);
  }

  /**
   * Check if milestone dependencies are met
   */
  areDependenciesMet(milestone) {
    if (!milestone.dependencies || milestone.dependencies.length === 0) {
      return true;
    }

    return milestone.dependencies.every(depId => {
      const dependency = this.milestones.get(depId);
      return dependency && dependency.status === 'completed';
    });
  }

  /**
   * Get next available milestones
   */
  getNextMilestones(completedMilestone) {
    return Array.from(this.milestones.values())
      .filter(m =>
        m.status === 'ready' &&
        m.id !== completedMilestone.id &&
        this.areDependenciesMet(m)
      )
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
      .slice(0, 3);
  }

  /**
   * Create a new milestone
   */
  async createMilestone(milestoneData) {
    try {
      const milestoneId = `milestone-${Date.now()}`;

      const milestone = {
        id: milestoneId,
        name: milestoneData.name,
        description: milestoneData.description || '',
        type: milestoneData.type || 'custom',
        project_id: milestoneData.project_id,

        // Timeline
        target_date: milestoneData.target_date,
        created_date: new Date().toISOString(),

        // Status tracking
        status: 'pending',
        progress: 0,

        // Dependencies
        dependencies: milestoneData.dependencies || [],

        // Success criteria
        success_criteria: milestoneData.success_criteria || [],

        // Deliverables
        deliverables: milestoneData.deliverables || [],

        // Tracking
        progress_notes: [],
        stakeholders: milestoneData.stakeholders || [],

        // Metadata
        priority: milestoneData.priority || 'medium',
        category: milestoneData.category || 'general',
        tags: milestoneData.tags || []
      };

      // Set status to ready if no dependencies
      if (this.areDependenciesMet(milestone)) {
        milestone.status = 'ready';
      }

      this.milestones.set(milestoneId, milestone);
      await this.saveMilestones();

      console.log(`✅ Milestone created: ${milestone.name}`);

      return milestone;

    } catch (error) {
      console.error('❌ Failed to create milestone:', error.message);
      throw error;
    }
  }

  /**
   * Get milestone health metrics
   */
  async getMilestoneHealth(projectId) {
    try {
      const projectMilestones = Array.from(this.milestones.values())
        .filter(m => !projectId || m.project_id === projectId);

      if (projectMilestones.length === 0) {
        return { score: 100, status: 'no_milestones', issues: [] };
      }

      const health = {
        score: 0,
        status: 'healthy',
        issues: [],
        metrics: {}
      };

      // Calculate health metrics
      const completedCount = projectMilestones.filter(m => m.status === 'completed').length;
      const overdueMilestones = this.getOverdueMilestones(projectMilestones);
      const atRiskMilestones = this.getAtRiskMilestones(projectMilestones);

      const completionRate = (completedCount / projectMilestones.length) * 100;
      const overdueRate = (overdueMilestones.length / projectMilestones.length) * 100;
      const atRiskRate = (atRiskMilestones.length / projectMilestones.length) * 100;

      // Calculate overall score
      health.score = Math.max(0, 100 - (overdueRate * 2) - (atRiskRate * 1.5));

      health.metrics = {
        total_milestones: projectMilestones.length,
        completed: completedCount,
        completion_rate: Math.round(completionRate),
        overdue: overdueMilestones.length,
        at_risk: atRiskMilestones.length,
        on_track: projectMilestones.length - overdueMilestones.length - atRiskMilestones.length
      };

      // Determine status
      if (health.score >= 80) health.status = 'healthy';
      else if (health.score >= 60) health.status = 'at_risk';
      else health.status = 'critical';

      // Add issues
      if (overdueMilestones.length > 0) {
        health.issues.push(`${overdueMilestones.length} overdue milestones`);
      }
      if (atRiskMilestones.length > 0) {
        health.issues.push(`${atRiskMilestones.length} at-risk milestones`);
      }

      return health;

    } catch (error) {
      console.error('❌ Failed to get milestone health:', error.message);
      return { score: 0, status: 'error', issues: [error.message] };
    }
  }

  /**
   * Get overdue milestones
   */
  getOverdueMilestones(milestones) {
    const now = new Date();
    return milestones.filter(m =>
      m.status !== 'completed' &&
      new Date(m.target_date) < now
    );
  }

  /**
   * Get at-risk milestones (due within 7 days)
   */
  getAtRiskMilestones(milestones) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    return milestones.filter(m =>
      m.status !== 'completed' &&
      new Date(m.target_date) <= sevenDaysFromNow &&
      new Date(m.target_date) >= now
    );
  }

  /**
   * Get milestone status summary
   */
  async getMilestoneStatus() {
    const allMilestones = Array.from(this.milestones.values());
    const now = new Date();

    // Group milestones by status
    const byStatus = allMilestones.reduce((acc, milestone) => {
      acc[milestone.status] = (acc[milestone.status] || 0) + 1;
      return acc;
    }, {});

    // Get recent completions (last 7 days)
    const recentCompletions = allMilestones.filter(m => {
      if (!m.completed_date) return false;
      const completedDate = new Date(m.completed_date);
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      return completedDate >= sevenDaysAgo;
    });

    // Get upcoming milestones (next 30 days)
    const upcomingMilestones = allMilestones.filter(m => {
      if (m.status === 'completed') return false;
      const targetDate = new Date(m.target_date);
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      return targetDate <= thirtyDaysFromNow && targetDate >= now;
    }).sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

    return {
      total_milestones: allMilestones.length,
      by_status: byStatus,
      completed_this_period: recentCompletions.length,
      upcoming: upcomingMilestones.slice(0, 10),
      overdue: this.getOverdueMilestones(allMilestones).length,
      health_score: await this.calculateOverallMilestoneHealth(allMilestones),
      recent_progress: this.getRecentProgressUpdates()
    };
  }

  /**
   * Calculate overall milestone health score
   */
  async calculateOverallMilestoneHealth(milestones) {
    if (milestones.length === 0) return 100;

    const overdue = this.getOverdueMilestones(milestones).length;
    const atRisk = this.getAtRiskMilestones(milestones).length;
    const total = milestones.length;

    const overdueRate = (overdue / total) * 100;
    const atRiskRate = (atRisk / total) * 100;

    return Math.max(0, Math.round(100 - (overdueRate * 2) - (atRiskRate * 1.5)));
  }

  /**
   * Get recent progress updates
   */
  getRecentProgressUpdates() {
    return this.progressHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(entry => ({
        milestone_name: entry.milestone_name,
        progress_change: entry.change,
        new_progress: entry.new_progress,
        timestamp: entry.timestamp,
        updated_by: entry.updated_by
      }));
  }

  /**
   * Notify milestone completion (placeholder)
   */
  async notifyMilestoneCompletion(milestone) {
    // This would integrate with notification system
    console.log(`📧 Notifying stakeholders of milestone completion: ${milestone.name}`);

    // Add to agent's notification queue if available
    if (this.agent.notifications) {
      this.agent.notifications.queueNotification({
        type: 'milestone_completed',
        milestone_id: milestone.id,
        milestone_name: milestone.name,
        project_id: milestone.project_id,
        stakeholders: milestone.stakeholders,
        message: `Milestone "${milestone.name}" has been completed successfully.`
      });
    }
  }

  /**
   * Generate milestone report
   */
  async generateMilestoneReport(projectId, reportType = 'summary') {
    try {
      const milestones = Array.from(this.milestones.values())
        .filter(m => !projectId || m.project_id === projectId);

      const report = {
        id: `milestone-report-${Date.now()}`,
        type: reportType,
        project_id: projectId,
        generated: new Date().toISOString(),
        summary: {},
        details: {}
      };

      // Generate summary
      const health = await this.getMilestoneHealth(projectId);
      report.summary = {
        total_milestones: milestones.length,
        completed: milestones.filter(m => m.status === 'completed').length,
        in_progress: milestones.filter(m => m.status === 'in_progress').length,
        pending: milestones.filter(m => m.status === 'pending').length,
        overdue: this.getOverdueMilestones(milestones).length,
        health_score: health.score,
        health_status: health.status
      };

      // Add detailed information if requested
      if (reportType === 'detailed') {
        report.details = {
          milestones: milestones.map(m => ({
            id: m.id,
            name: m.name,
            status: m.status,
            progress: m.progress,
            target_date: m.target_date,
            completed_date: m.completed_date,
            days_until_due: this.calculateDaysUntilDue(m),
            is_overdue: this.isOverdue(m),
            success_criteria_met: this.calculateSuccessCriteriaMet(m)
          })),
          progress_history: this.progressHistory.filter(h =>
            milestones.some(m => m.id === h.milestone_id)
          ).slice(-20)
        };
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate milestone report:', error.message);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  calculateDaysUntilDue(milestone) {
    if (milestone.status === 'completed') return null;

    const now = new Date();
    const targetDate = new Date(milestone.target_date);
    const diffTime = targetDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(milestone) {
    if (milestone.status === 'completed') return false;
    return new Date(milestone.target_date) < new Date();
  }

  calculateSuccessCriteriaMet(milestone) {
    if (!milestone.success_criteria || milestone.success_criteria.length === 0) {
      return milestone.progress >= 100 ? 100 : 0;
    }

    // This would need more sophisticated logic to track individual criteria
    return milestone.progress;
  }
}

module.exports = MilestoneTracking;
