#!/usr/bin/env node

const PMAgent = require('../../pm_agent');
const SharedMemorySystem = require('../../../core/shared_memory');

/**
 * Milestone Tracking CLI Tool for PM Agent (Alex - Alexander)
 *
 * Command-line interface for tracking milestone progress, managing deadlines,
 * and monitoring project achievements. Like Alexander's systematic conquest
 * of territories, every milestone represents strategic progress toward victory.
 */

class MilestoneTrackingCLI {
  constructor() {
    this.agent = null;
  }

  async initialize() {
    try {
      // Initialize mock orchestrator for CLI usage
      const mockOrchestrator = {
        memoryManager: new SharedMemorySystem({ storage_path: './data/shared_memory' }),
        notificationSystem: null,
        claudeCodeIntegration: null
      };

      // Initialize PM Agent
      this.agent = new PMAgent(mockOrchestrator, {
        agent: {
          id: 'alex-milestone-tracking-cli',
          name: 'Alex (Milestone Tracking CLI)',
          role: 'project_manager',
          persona: 'Strategic milestone coordinator focused on progress tracking'
        },
        integration: {
          notification_types: ['milestone_updates', 'deadline_alerts'],
          claude_code_priority: ['tracking', 'reporting'],
          windsurf_operations: ['milestone_management', 'progress_coordination']
        }
      });

      await this.agent.initializeBaseSystems();
      console.log('🎯 Milestone Tracking CLI initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Milestone Tracking CLI:', error.message);
      process.exit(1);
    }
  }

  async trackMilestone(options) {
    try {
      if (options.list) {
        return await this.listMilestones(options);
      }

      if (options.create) {
        return await this.createMilestone(options);
      }

      if (options.update && options.milestoneId) {
        return await this.updateMilestoneProgress(options);
      }

      if (options.report) {
        return await this.generateMilestoneReport(options);
      }

      console.log('❌ Please specify an action: --list, --create, --update, or --report');
      this.displayHelp();

    } catch (error) {
      console.error('❌ Failed to track milestone:', error.message);
      throw error;
    }
  }

  async listMilestones(options) {
    try {
      const status = await this.agent.milestoneTracking.getMilestoneStatus();

      console.log('\n🎯 MILESTONE STATUS OVERVIEW');
      console.log('============================');
      console.log(`Total Milestones: ${status.total_milestones}`);
      console.log(`Completed This Period: ${status.completed_this_period}`);
      console.log(`Overdue: ${status.overdue}`);
      console.log(`Health Score: ${status.health_score}%`);

      if (status.by_status) {
        console.log('\n📊 BY STATUS:');
        Object.entries(status.by_status).forEach(([statusType, count]) => {
          console.log(`  ${statusType}: ${count}`);
        });
      }

      if (status.upcoming && status.upcoming.length > 0) {
        console.log('\n📅 UPCOMING MILESTONES:');
        status.upcoming.forEach((milestone, index) => {
          const dueDate = new Date(milestone.target_date);
          const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
          console.log(`${index + 1}. ${milestone.name}`);
          console.log(`   Due: ${dueDate.toLocaleDateString()} (${daysUntil} days)`);
          console.log(`   Progress: ${milestone.progress || 0}%`);
          console.log(`   Status: ${milestone.status}`);
        });
      }

      if (options.detailed && status.recent_progress) {
        console.log('\n📈 RECENT PROGRESS UPDATES:');
        status.recent_progress.forEach((update, index) => {
          console.log(`${index + 1}. ${update.milestone_name}: +${update.progress_change}% (now ${update.new_progress}%)`);
          console.log(`   Updated by: ${update.updated_by} at ${new Date(update.timestamp).toLocaleString()}`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to list milestones:', error.message);
      throw error;
    }
  }

  async createMilestone(options) {
    try {
      const milestoneData = {
        name: options.name || 'New Milestone',
        description: options.description || 'Milestone created via CLI',
        type: options.type || 'custom',
        project_id: options.projectId || 'default-project',
        target_date: options.targetDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        success_criteria: options.criteria ? options.criteria.split(',') : [
          'All deliverables completed',
          'Quality standards met',
          'Stakeholder approval received'
        ],
        deliverables: options.deliverables ? options.deliverables.split(',') : [],
        dependencies: options.dependencies ? options.dependencies.split(',') : [],
        stakeholders: options.stakeholders ? options.stakeholders.split(',') : [],
        priority: options.priority || 'medium',
        category: options.category || 'general'
      };

      const milestone = await this.agent.milestoneTracking.createMilestone(milestoneData);

      console.log('\n🎯 MILESTONE CREATED');
      console.log('===================');
      console.log(`ID: ${milestone.id}`);
      console.log(`Name: ${milestone.name}`);
      console.log(`Target Date: ${new Date(milestone.target_date).toLocaleDateString()}`);
      console.log(`Status: ${milestone.status}`);
      console.log(`Priority: ${milestone.priority}`);

      if (milestone.success_criteria.length > 0) {
        console.log('\n✅ SUCCESS CRITERIA:');
        milestone.success_criteria.forEach((criteria, index) => {
          console.log(`${index + 1}. ${criteria}`);
        });
      }

      if (milestone.dependencies.length > 0) {
        console.log('\n🔗 DEPENDENCIES:');
        milestone.dependencies.forEach((dep, index) => {
          console.log(`${index + 1}. ${dep}`);
        });
      }

      return milestone;

    } catch (error) {
      console.error('❌ Failed to create milestone:', error.message);
      throw error;
    }
  }

  async updateMilestoneProgress(options) {
    try {
      const progressData = {
        progress: parseInt(options.progress) || 0,
        notes: options.notes || 'Progress updated via CLI',
        updated_by: options.updatedBy || 'CLI User'
      };

      const result = await this.agent.milestoneTracking.trackMilestone(
        options.milestoneId,
        progressData
      );

      console.log('\n🎯 MILESTONE PROGRESS UPDATED');
      console.log('============================');
      console.log(`Milestone: ${result.milestone_name}`);
      console.log(`Previous Progress: ${result.previous_progress}%`);
      console.log(`Current Progress: ${result.current_progress}%`);
      console.log(`Progress Change: +${result.progress_change}%`);
      console.log(`Status: ${result.status}`);

      if (result.completion_date) {
        console.log(`🎉 Completed: ${new Date(result.completion_date).toLocaleDateString()}`);
      }

      if (result.next_milestones && result.next_milestones.length > 0) {
        console.log('\n🎯 NEXT AVAILABLE MILESTONES:');
        result.next_milestones.forEach((milestone, index) => {
          console.log(`${index + 1}. ${milestone.name} (Due: ${new Date(milestone.target_date).toLocaleDateString()})`);
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to update milestone progress:', error.message);
      throw error;
    }
  }

  async generateMilestoneReport(options) {
    try {
      const reportType = options.reportType || 'summary';
      const projectId = options.projectId || null;

      const report = await this.agent.milestoneTracking.generateMilestoneReport(
        projectId,
        reportType
      );

      console.log('\n📄 MILESTONE REPORT');
      console.log('==================');
      console.log(`Report ID: ${report.id}`);
      console.log(`Type: ${report.type}`);
      console.log(`Generated: ${new Date(report.generated).toLocaleString()}`);

      if (report.project_id) {
        console.log(`Project: ${report.project_id}`);
      }

      console.log('\n📊 SUMMARY:');
      Object.entries(report.summary).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log(`  ${label}: ${value}`);
      });

      if (options.detailed && report.details && report.details.milestones) {
        console.log('\n🎯 DETAILED MILESTONE STATUS:');
        report.details.milestones.forEach((milestone, index) => {
          console.log(`\n${index + 1}. ${milestone.name}`);
          console.log(`   Status: ${milestone.status}`);
          console.log(`   Progress: ${milestone.progress}%`);
          console.log(`   Target Date: ${new Date(milestone.target_date).toLocaleDateString()}`);

          if (milestone.completed_date) {
            console.log(`   Completed: ${new Date(milestone.completed_date).toLocaleDateString()}`);
          }

          if (milestone.days_until_due !== null) {
            console.log(`   Days Until Due: ${milestone.days_until_due}`);
          }

          if (milestone.is_overdue) {
            console.log('   ⚠️ OVERDUE');
          }
        });
      }

      if (options.save) {
        await this.saveReport(report, options.output);
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate milestone report:', error.message);
      throw error;
    }
  }

  async saveReport(report, outputPath) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const filename = outputPath || `milestone-report-${report.id}.json`;
      const fullPath = path.resolve(filename);

      await fs.writeFile(fullPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved to: ${fullPath}`);

    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
    }
  }

  displayHelp() {
    console.log(`
🎯 MILESTONE TRACKING CLI - PM Agent (Alex)
==========================================

USAGE:
  node milestone_tracking_cli.js [action] [options]

ACTIONS:
  --list                 List all milestones and status overview
  --create               Create a new milestone
  --update               Update milestone progress
  --report               Generate milestone report

CREATE OPTIONS:
  --name <name>          Milestone name
  --description <desc>   Milestone description
  --type <type>          Milestone type
  --project-id <id>      Project ID
  --target-date <date>   Target completion date (ISO format)
  --criteria <list>      Comma-separated success criteria
  --deliverables <list>  Comma-separated deliverables
  --dependencies <list>  Comma-separated dependency IDs
  --stakeholders <list>  Comma-separated stakeholder list
  --priority <level>     Priority (low, medium, high)
  --category <cat>       Category

UPDATE OPTIONS:
  --milestone-id <id>    Milestone ID to update
  --progress <percent>   Progress percentage (0-100)
  --notes <notes>        Progress notes
  --updated-by <name>    Name of person updating

REPORT OPTIONS:
  --report-type <type>   Report type (summary, detailed)
  --project-id <id>      Filter by project ID
  --save                 Save report to file
  --output <path>        Output file path

GENERAL OPTIONS:
  --detailed             Show detailed information
  --help                 Show this help message

EXAMPLES:
  # List all milestones with detailed progress
  node milestone_tracking_cli.js --list --detailed

  # Create a new milestone
  node milestone_tracking_cli.js --create \\
    --name "MVP Release" \\
    --target-date "2024-03-15" \\
    --criteria "All features complete,Testing passed,Documentation ready" \\
    --priority high

  # Update milestone progress
  node milestone_tracking_cli.js --update \\
    --milestone-id milestone-123 \\
    --progress 75 \\
    --notes "Backend API completed, frontend in progress"

  # Generate detailed milestone report
  node milestone_tracking_cli.js --report \\
    --report-type detailed \\
    --project-id project-001 \\
    --save

Like Alexander's systematic conquest, every milestone marks strategic progress toward victory.
    `);
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
      case '--list':
        options.list = true;
        break;
      case '--create':
        options.create = true;
        break;
      case '--update':
        options.update = true;
        break;
      case '--report':
        options.report = true;
        break;
      case '--name':
        options.name = args[++i];
        break;
      case '--description':
        options.description = args[++i];
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--project-id':
        options.projectId = args[++i];
        break;
      case '--target-date':
        options.targetDate = args[++i];
        break;
      case '--criteria':
        options.criteria = args[++i];
        break;
      case '--deliverables':
        options.deliverables = args[++i];
        break;
      case '--dependencies':
        options.dependencies = args[++i];
        break;
      case '--stakeholders':
        options.stakeholders = args[++i];
        break;
      case '--priority':
        options.priority = args[++i];
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--milestone-id':
        options.milestoneId = args[++i];
        break;
      case '--progress':
        options.progress = args[++i];
        break;
      case '--notes':
        options.notes = args[++i];
        break;
      case '--updated-by':
        options.updatedBy = args[++i];
        break;
      case '--report-type':
        options.reportType = args[++i];
        break;
      case '--detailed':
        options.detailed = true;
        break;
      case '--save':
        options.save = true;
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️ Unknown option: ${arg}`);
        }
      }
    }

    return options;
  }
}

// Main execution
async function main() {
  const cli = new MilestoneTrackingCLI();
  const options = cli.parseArguments();

  if (options.help) {
    cli.displayHelp();
    return;
  }

  try {
    await cli.initialize();
    await cli.trackMilestone(options);
  } catch (error) {
    console.error('❌ Milestone Tracking CLI failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = MilestoneTrackingCLI;
