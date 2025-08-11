#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Sprint Health Monitor CLI Tool
 * 
 * Provides comprehensive sprint health analysis including velocity tracking,
 * burndown status, impediment impact, and actionable recommendations.
 */
class SprintHealthMonitor {
  constructor() {
    this.projectRoot = process.cwd();
    this.agentDir = path.join(this.projectRoot, '.wee', 'agents', 'scrum_master');
    this.trackingDir = path.join(this.agentDir, 'tracking');
    this.sprintsDir = path.join(this.agentDir, 'sprints');
  }

  /**
   * Run sprint health analysis
   */
  async run(options = {}) {
    try {
      console.log('🏃 Starting Sprint Health Analysis...\n');
      
      // Load current sprint data
      const currentSprint = await this.loadCurrentSprint();
      if (!currentSprint) {
        console.log('❌ No active sprint found');
        console.log('💡 Run sprint planning to start a new sprint');
        return;
      }
      
      // Perform health analysis
      const healthAnalysis = await this.analyzeSprintHealth(currentSprint);
      
      // Display results
      await this.displayHealthReport(healthAnalysis, options);
      
      // Save report if requested
      if (options.save) {
        await this.saveHealthReport(healthAnalysis);
      }
      
    } catch (error) {
      console.error(`❌ Sprint health analysis failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Load current sprint data
   */
  async loadCurrentSprint() {
    try {
      const sprintTrackingPath = path.join(this.trackingDir, 'sprint_tracking.md');
      if (!await this.fileExists(sprintTrackingPath)) {
        return null;
      }
      
      const content = await fs.readFile(sprintTrackingPath, 'utf8');
      return this.parseSprintData(content);
    } catch (error) {
      console.warn(`⚠️ Could not load current sprint: ${error.message}`);
      return null;
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
      status: 'active'
    };

    let inStoriesSection = false;

    for (const line of lines) {
      if (line.includes('# Sprint')) {
        const match = line.match(/Sprint\s+(\d+)/);
        if (match) sprint.number = parseInt(match[1]);
      } else if (line.includes('**Start Date:**')) {
        sprint.startDate = line.match(/\*\*Start Date:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('**End Date:**')) {
        sprint.endDate = line.match(/\*\*End Date:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('**Sprint Goal:**')) {
        sprint.goal = line.match(/\*\*Sprint Goal:\*\*\s*(.+)/)?.[1];
      } else if (line.includes('## Stories')) {
        inStoriesSection = true;
      } else if (inStoriesSection && line.startsWith('- ')) {
        const storyMatch = line.match(/- \[(.)\] (.+?) \((\d+) points?\)/);
        if (storyMatch) {
          sprint.stories.push({
            status: storyMatch[1] === 'x' ? 'completed' : 'in_progress',
            title: storyMatch[2],
            points: parseInt(storyMatch[3])
          });
        }
      } else if (line.startsWith('#') && inStoriesSection) {
        inStoriesSection = false;
      }
    }

    return sprint;
  }

  /**
   * Analyze sprint health
   */
  async analyzeSprintHealth(sprint) {
    const analysis = {
      sprint_info: {
        number: sprint.number,
        goal: sprint.goal,
        start_date: sprint.startDate,
        end_date: sprint.endDate,
        days_remaining: this.calculateDaysRemaining(sprint.endDate)
      },
      velocity_analysis: await this.analyzeVelocity(sprint),
      story_progress: this.analyzeStoryProgress(sprint),
      burndown_analysis: await this.analyzeBurndown(sprint),
      impediment_impact: await this.analyzeImpediments(),
      team_health: await this.analyzeTeamHealth(),
      overall_score: 0,
      recommendations: []
    };

    // Calculate overall health score
    analysis.overall_score = this.calculateOverallScore(analysis);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    return analysis;
  }

  /**
   * Analyze velocity trends
   */
  async analyzeVelocity(sprint) {
    try {
      const velocityPath = path.join(this.trackingDir, 'velocity_metrics.md');
      const velocityHistory = await this.loadVelocityHistory(velocityPath);
      
      const currentVelocity = this.calculateCurrentVelocity(sprint);
      const averageVelocity = this.calculateAverageVelocity(velocityHistory);
      
      let trend = 'stable';
      let trendPercentage = 0;
      
      if (velocityHistory.length > 0) {
        const lastVelocity = velocityHistory[velocityHistory.length - 1].velocity;
        trendPercentage = ((currentVelocity - lastVelocity) / lastVelocity) * 100;
        
        if (trendPercentage > 10) trend = 'improving';
        else if (trendPercentage < -10) trend = 'declining';
      }
      
      return {
        current_velocity: currentVelocity,
        average_velocity: averageVelocity,
        trend: trend,
        trend_percentage: Math.round(trendPercentage),
        historical_data: velocityHistory.slice(-5) // Last 5 sprints
      };
    } catch (error) {
      return {
        current_velocity: 0,
        average_velocity: 0,
        trend: 'no_data',
        trend_percentage: 0,
        historical_data: []
      };
    }
  }

  /**
   * Analyze story progress
   */
  analyzeStoryProgress(sprint) {
    const total = sprint.stories.length;
    const completed = sprint.stories.filter(s => s.status === 'completed').length;
    const inProgress = sprint.stories.filter(s => s.status === 'in_progress').length;
    const blocked = sprint.stories.filter(s => s.status === 'blocked').length;
    
    const totalPoints = sprint.stories.reduce((sum, s) => sum + s.points, 0);
    const completedPoints = sprint.stories
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.points, 0);
    
    return {
      total_stories: total,
      completed_stories: completed,
      in_progress_stories: inProgress,
      blocked_stories: blocked,
      completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      total_points: totalPoints,
      completed_points: completedPoints,
      points_completion_percentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
  }

  /**
   * Analyze burndown status
   */
  async analyzeBurndown(sprint) {
    const daysRemaining = this.calculateDaysRemaining(sprint.endDate);
    const sprintLength = this.calculateSprintLength(sprint.startDate, sprint.endDate);
    const daysPassed = sprintLength - daysRemaining;
    
    const storyProgress = this.analyzeStoryProgress(sprint);
    const expectedProgress = daysPassed / sprintLength * 100;
    const actualProgress = storyProgress.points_completion_percentage;
    
    let status = 'on_track';
    if (actualProgress < expectedProgress - 20) status = 'behind';
    else if (actualProgress < expectedProgress - 10) status = 'at_risk';
    else if (actualProgress > expectedProgress + 10) status = 'ahead';
    
    return {
      status: status,
      days_remaining: daysRemaining,
      days_passed: daysPassed,
      sprint_length: sprintLength,
      expected_progress: Math.round(expectedProgress),
      actual_progress: actualProgress,
      variance: Math.round(actualProgress - expectedProgress)
    };
  }

  /**
   * Analyze impediments impact
   */
  async analyzeImpediments() {
    try {
      const impedimentPath = path.join(this.trackingDir, 'impediment_log.md');
      if (!await this.fileExists(impedimentPath)) {
        return {
          active_count: 0,
          critical_count: 0,
          high_count: 0,
          impact_score: 100,
          blocking_stories: 0
        };
      }
      
      const content = await fs.readFile(impedimentPath, 'utf8');
      const impediments = this.parseImpediments(content);
      
      const active = impediments.filter(imp => imp.status === 'open');
      const critical = active.filter(imp => imp.priority === 'critical');
      const high = active.filter(imp => imp.priority === 'high');
      
      // Calculate impact score (0-100, lower is worse)
      let impactScore = 100;
      impactScore -= critical.length * 25; // Critical impediments have major impact
      impactScore -= high.length * 15; // High priority impediments
      impactScore -= (active.length - critical.length - high.length) * 5; // Other impediments
      impactScore = Math.max(0, impactScore);
      
      return {
        active_count: active.length,
        critical_count: critical.length,
        high_count: high.length,
        impact_score: impactScore,
        blocking_stories: this.countBlockingStories(active)
      };
    } catch (error) {
      return {
        active_count: 0,
        critical_count: 0,
        high_count: 0,
        impact_score: 100,
        blocking_stories: 0
      };
    }
  }

  /**
   * Analyze team health
   */
  async analyzeTeamHealth() {
    // Simplified team health analysis
    // In a real implementation, this would integrate with team surveys, metrics, etc.
    
    const baseHealth = 85;
    let healthScore = baseHealth;
    
    // Adjust based on impediments
    const impediments = await this.analyzeImpediments();
    healthScore -= impediments.critical_count * 10;
    healthScore -= impediments.high_count * 5;
    
    // Adjust based on sprint progress
    // This would be more sophisticated in a real implementation
    
    return {
      overall_score: Math.max(0, Math.min(100, healthScore)),
      collaboration_score: 88,
      satisfaction_score: 82,
      workload_balance: 'good',
      stress_level: 'low'
    };
  }

  /**
   * Calculate overall health score
   */
  calculateOverallScore(analysis) {
    let score = 0;
    
    // Velocity component (25%)
    if (analysis.velocity_analysis.trend === 'improving') score += 25;
    else if (analysis.velocity_analysis.trend === 'stable') score += 20;
    else if (analysis.velocity_analysis.trend === 'declining') score += 10;
    else score += 15; // no_data
    
    // Story progress component (30%)
    score += (analysis.story_progress.completion_percentage * 0.3);
    
    // Burndown component (25%)
    if (analysis.burndown_analysis.status === 'ahead') score += 25;
    else if (analysis.burndown_analysis.status === 'on_track') score += 22;
    else if (analysis.burndown_analysis.status === 'at_risk') score += 15;
    else score += 8; // behind
    
    // Impediment impact component (20%)
    score += (analysis.impediment_impact.impact_score * 0.2);
    
    return Math.round(Math.min(100, score));
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Critical impediment recommendations
    if (analysis.impediment_impact.critical_count > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'impediments',
        message: `${analysis.impediment_impact.critical_count} critical impediment(s) blocking progress`,
        actions: [
          'Escalate to management immediately',
          'Assign dedicated resources to resolution',
          'Consider scope reduction if needed',
          'Daily impediment review meetings'
        ]
      });
    }
    
    // Burndown recommendations
    if (analysis.burndown_analysis.status === 'behind') {
      recommendations.push({
        priority: 'high',
        category: 'burndown',
        message: 'Sprint is significantly behind schedule',
        actions: [
          'Review and reduce sprint scope',
          'Identify and remove blockers',
          'Increase team focus on current stories',
          'Consider additional resources'
        ]
      });
    } else if (analysis.burndown_analysis.status === 'at_risk') {
      recommendations.push({
        priority: 'medium',
        category: 'burndown',
        message: 'Sprint progress is at risk',
        actions: [
          'Monitor daily progress closely',
          'Address any emerging blockers quickly',
          'Focus on completing in-progress stories',
          'Prepare contingency plans'
        ]
      });
    }
    
    // Velocity recommendations
    if (analysis.velocity_analysis.trend === 'declining') {
      recommendations.push({
        priority: 'medium',
        category: 'velocity',
        message: 'Team velocity is declining',
        actions: [
          'Analyze root causes of slowdown',
          'Review story estimation accuracy',
          'Check team capacity and workload',
          'Address process inefficiencies'
        ]
      });
    }
    
    // Story progress recommendations
    if (analysis.story_progress.blocked_stories > 0) {
      recommendations.push({
        priority: 'high',
        category: 'story_progress',
        message: `${analysis.story_progress.blocked_stories} story(ies) are blocked`,
        actions: [
          'Identify and resolve blockers immediately',
          'Reassign resources if possible',
          'Escalate external dependencies',
          'Update story status and communicate'
        ]
      });
    }
    
    // Team health recommendations
    if (analysis.team_health.overall_score < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'team_health',
        message: 'Team health indicators show concern',
        actions: [
          'Conduct team health check-in',
          'Address workload and stress issues',
          'Improve team communication',
          'Consider process improvements'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Display health report
   */
  async displayHealthReport(analysis, options) {
    const { sprint_info, overall_score } = analysis;
    
    // Header
    console.log('\n🏃 Sprint Health Report');
    console.log('================================\n');
    
    // Sprint info
    console.log(`📊 Sprint ${sprint_info.number} Overview`);
    console.log(`   Goal: ${sprint_info.goal || 'No goal set'}`);
    console.log(`   Days Remaining: ${sprint_info.days_remaining}`);
    console.log(`   Overall Health Score: ${this.getScoreEmoji(overall_score)} ${overall_score}/100\n`);
    
    // Velocity analysis
    console.log('📈 Velocity Analysis');
    console.log(`   Current Velocity: ${analysis.velocity_analysis.current_velocity} points`);
    console.log(`   Average Velocity: ${analysis.velocity_analysis.average_velocity} points`);
    console.log(`   Trend: ${this.getTrendEmoji(analysis.velocity_analysis.trend)} ${analysis.velocity_analysis.trend}`);
    if (analysis.velocity_analysis.trend_percentage !== 0) {
      console.log(`   Change: ${analysis.velocity_analysis.trend_percentage > 0 ? '+' : ''}${analysis.velocity_analysis.trend_percentage}%`);
    }
    console.log('');
    
    // Story progress
    console.log('📋 Story Progress');
    console.log(`   Completed: ${analysis.story_progress.completed_stories}/${analysis.story_progress.total_stories} stories (${analysis.story_progress.completion_percentage}%)`);
    console.log(`   Story Points: ${analysis.story_progress.completed_points}/${analysis.story_progress.total_points} (${analysis.story_progress.points_completion_percentage}%)`);
    console.log(`   In Progress: ${analysis.story_progress.in_progress_stories}`);
    if (analysis.story_progress.blocked_stories > 0) {
      console.log(`   🚧 Blocked: ${analysis.story_progress.blocked_stories}`);
    }
    console.log('');
    
    // Burndown analysis
    console.log('🔥 Burndown Analysis');
    console.log(`   Status: ${this.getBurndownEmoji(analysis.burndown_analysis.status)} ${analysis.burndown_analysis.status}`);
    console.log(`   Expected Progress: ${analysis.burndown_analysis.expected_progress}%`);
    console.log(`   Actual Progress: ${analysis.burndown_analysis.actual_progress}%`);
    console.log(`   Variance: ${analysis.burndown_analysis.variance > 0 ? '+' : ''}${analysis.burndown_analysis.variance}%`);
    console.log('');
    
    // Impediment impact
    if (analysis.impediment_impact.active_count > 0) {
      console.log('🚧 Impediment Impact');
      console.log(`   Active Impediments: ${analysis.impediment_impact.active_count}`);
      if (analysis.impediment_impact.critical_count > 0) {
        console.log(`   🔴 Critical: ${analysis.impediment_impact.critical_count}`);
      }
      if (analysis.impediment_impact.high_count > 0) {
        console.log(`   🟠 High Priority: ${analysis.impediment_impact.high_count}`);
      }
      console.log(`   Impact Score: ${analysis.impediment_impact.impact_score}/100`);
      console.log('');
    }
    
    // Team health
    console.log('👥 Team Health');
    console.log(`   Overall Score: ${analysis.team_health.overall_score}/100`);
    console.log(`   Collaboration: ${analysis.team_health.collaboration_score}/100`);
    console.log(`   Satisfaction: ${analysis.team_health.satisfaction_score}/100`);
    console.log('');
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      console.log('💡 Recommendations');
      console.log('==================');
      
      for (const rec of analysis.recommendations) {
        console.log(`\n${this.getPriorityEmoji(rec.priority)} ${rec.category.toUpperCase()} (${rec.priority} priority)`);
        console.log(`   ${rec.message}`);
        console.log('   Actions:');
        for (const action of rec.actions) {
          console.log(`   • ${action}`);
        }
      }
    } else {
      console.log('✅ No specific recommendations - sprint health looks good!');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Sprint health analysis completed at ${new Date().toLocaleString()}`);
  }

  /**
   * Save health report
   */
  async saveHealthReport(analysis) {
    const reportPath = path.join(this.sprintsDir, `health_report_sprint_${analysis.sprint_info.number}_${new Date().toISOString().split('T')[0]}.md`);
    
    const content = `# Sprint ${analysis.sprint_info.number} Health Report

Generated: ${new Date().toISOString()}

## Overall Health Score: ${analysis.overall_score}/100

## Sprint Overview
- **Goal:** ${analysis.sprint_info.goal || 'No goal set'}
- **Days Remaining:** ${analysis.sprint_info.days_remaining}
- **Start Date:** ${analysis.sprint_info.start_date}
- **End Date:** ${analysis.sprint_info.end_date}

## Velocity Analysis
- **Current Velocity:** ${analysis.velocity_analysis.current_velocity} points
- **Average Velocity:** ${analysis.velocity_analysis.average_velocity} points
- **Trend:** ${analysis.velocity_analysis.trend}
- **Change:** ${analysis.velocity_analysis.trend_percentage}%

## Story Progress
- **Completed:** ${analysis.story_progress.completed_stories}/${analysis.story_progress.total_stories} stories (${analysis.story_progress.completion_percentage}%)
- **Story Points:** ${analysis.story_progress.completed_points}/${analysis.story_progress.total_points} (${analysis.story_progress.points_completion_percentage}%)
- **In Progress:** ${analysis.story_progress.in_progress_stories}
- **Blocked:** ${analysis.story_progress.blocked_stories}

## Burndown Analysis
- **Status:** ${analysis.burndown_analysis.status}
- **Expected Progress:** ${analysis.burndown_analysis.expected_progress}%
- **Actual Progress:** ${analysis.burndown_analysis.actual_progress}%
- **Variance:** ${analysis.burndown_analysis.variance}%

## Impediment Impact
- **Active Impediments:** ${analysis.impediment_impact.active_count}
- **Critical:** ${analysis.impediment_impact.critical_count}
- **High Priority:** ${analysis.impediment_impact.high_count}
- **Impact Score:** ${analysis.impediment_impact.impact_score}/100

## Team Health
- **Overall Score:** ${analysis.team_health.overall_score}/100
- **Collaboration:** ${analysis.team_health.collaboration_score}/100
- **Satisfaction:** ${analysis.team_health.satisfaction_score}/100

## Recommendations
${analysis.recommendations.map(rec => `
### ${rec.category.toUpperCase()} (${rec.priority} priority)
${rec.message}

**Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

---
*Report generated by Vince (Scrum)*
`;
    
    await this.ensureDirectoryExists(this.sprintsDir);
    await fs.writeFile(reportPath, content, 'utf8');
    console.log(`\n💾 Health report saved to: ${reportPath}`);
  }

  /**
   * Helper methods
   */
  calculateDaysRemaining(endDate) {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  calculateSprintLength(startDate, endDate) {
    if (!startDate || !endDate) return 10; // Default 2 weeks
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateCurrentVelocity(sprint) {
    return sprint.stories
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.points, 0);
  }

  async loadVelocityHistory(velocityPath) {
    try {
      if (!await this.fileExists(velocityPath)) return [];
      
      const content = await fs.readFile(velocityPath, 'utf8');
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
    } catch (error) {
      return [];
    }
  }

  calculateAverageVelocity(velocityHistory) {
    if (velocityHistory.length === 0) return 0;
    const sum = velocityHistory.reduce((total, v) => total + v.velocity, 0);
    return Math.round(sum / velocityHistory.length);
  }

  parseImpediments(content) {
    const impediments = [];
    const lines = content.split('\n');
    let currentImpediment = null;
    
    for (const line of lines) {
      const headerMatch = line.match(/^## (IMP-\d+): (.+)/);
      if (headerMatch) {
        if (currentImpediment) impediments.push(currentImpediment);
        currentImpediment = {
          id: headerMatch[1],
          title: headerMatch[2],
          status: 'open',
          priority: 'medium'
        };
      }
      
      if (currentImpediment) {
        if (line.includes('**Status:**')) {
          currentImpediment.status = line.match(/\*\*Status:\*\*\s*(.+)/)?.[1] || 'open';
        } else if (line.includes('**Priority:**')) {
          currentImpediment.priority = line.match(/\*\*Priority:\*\*\s*(.+)/)?.[1] || 'medium';
        }
      }
    }
    
    if (currentImpediment) impediments.push(currentImpediment);
    return impediments;
  }

  countBlockingStories(impediments) {
    // Simplified - count stories mentioned in impediments
    let blockingCount = 0;
    for (const imp of impediments) {
      if (imp.priority === 'critical' || imp.priority === 'high') {
        blockingCount += 1; // Assume each high/critical impediment blocks at least one story
      }
    }
    return blockingCount;
  }

  // Display helper methods
  getScoreEmoji(score) {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
  }

  getTrendEmoji(trend) {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }

  getBurndownEmoji(status) {
    switch (status) {
      case 'ahead': return '🚀';
      case 'on_track': return '✅';
      case 'at_risk': return '⚠️';
      case 'behind': return '🚨';
      default: return '❓';
    }
  }

  getPriorityEmoji(priority) {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '📝';
    }
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

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    save: args.includes('--save'),
    detailed: args.includes('--detailed')
  };
  
  const monitor = new SprintHealthMonitor();
  monitor.run(options).catch(error => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = SprintHealthMonitor;
