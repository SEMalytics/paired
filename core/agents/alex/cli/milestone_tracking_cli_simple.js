#!/usr/bin/env node

/**
 * Simplified Milestone Tracking CLI Tool for PM Agent (Alex - Alexander)
 *
 * Bypasses complex memory system initialization to provide immediate functionality
 * for MVP launch. Focuses on core milestone tracking without the overhead.
 */

const fs = require('fs').promises;
const path = require('path');

class SimplifiedMilestoneTrackingCLI {
  constructor() {
    this.milestonesPath = path.join(process.cwd(), 'data', 'pm_agent', 'milestones.json');
    this.projectsPath = path.join(process.cwd(), 'data', 'pm_agent', 'projects.json');
    this.milestones = [];
    this.projects = [];
  }

  async initialize() {
    try {
      console.log('🎯 PM Agent Alex (Simplified Milestone Tracking CLI) initializing...');

      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.milestonesPath), { recursive: true });

      // Load existing data
      await this.loadMilestones();
      await this.loadProjects();

      console.log('🎯 Simplified Milestone Tracking CLI initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Simplified Milestone Tracking CLI:', error.message);
      process.exit(1);
    }
  }

  async loadMilestones() {
    try {
      const data = await fs.readFile(this.milestonesPath, 'utf8');
      this.milestones = JSON.parse(data);
      console.log(`📚 Loaded ${this.milestones.length} existing milestones`);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      this.milestones = [];
      console.log('📚 No existing milestones found, starting fresh');
    }
  }

  async loadProjects() {
    try {
      const data = await fs.readFile(this.projectsPath, 'utf8');
      this.projects = JSON.parse(data);
      console.log(`📚 Loaded ${this.projects.length} existing projects`);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      this.projects = [];
      console.log('📚 No existing projects found, starting fresh');
    }
  }

  async saveMilestones() {
    try {
      await fs.writeFile(this.milestonesPath, JSON.stringify(this.milestones, null, 2));
    } catch (error) {
      console.error('❌ Failed to save milestones:', error.message);
    }
  }

  async listMilestones() {
    console.log('\n🎯 MILESTONE STATUS OVERVIEW');
    console.log('============================');

    const totalMilestones = this.milestones.length;
    const completedMilestones = this.milestones.filter(m => m.status === 'completed').length;
    const overdueMilestones = this.milestones.filter(m => {
      return m.target_date && new Date(m.target_date) < new Date() && m.status !== 'completed';
    }).length;

    const healthScore = totalMilestones > 0 ? Math.round(((totalMilestones - overdueMilestones) / totalMilestones) * 100) : 100;

    console.log(`Total Milestones: ${totalMilestones}`);
    console.log(`Completed This Period: ${completedMilestones}`);
    console.log(`Overdue: ${overdueMilestones}`);
    console.log(`Health Score: ${healthScore}%`);

    console.log('\n📊 BY STATUS:');
    const statusCounts = {};
    this.milestones.forEach(milestone => {
      statusCounts[milestone.status] = (statusCounts[milestone.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = this.getStatusEmoji(status);
      console.log(`${emoji} ${status}: ${count}`);
    });

    if (totalMilestones === 0) {
      console.log('📝 No milestones found. Use --create to add your first milestone.');
    }

    console.log('\n🎯 Like Alexander\'s systematic conquest, every milestone marks strategic progress toward victory.');
  }

  getStatusEmoji(status) {
    const emojiMap = {
      'planning': '📋',
      'in_progress': '🚀',
      'completed': '✅',
      'blocked': '🚫',
      'on_hold': '⏸️'
    };
    return emojiMap[status] || '📌';
  }

  async createMilestone(options) {
    const milestone = {
      id: `milestone-${Date.now()}`,
      name: options.name || 'New Milestone',
      description: options.description || '',
      target_date: options.targetDate || null,
      status: 'planning',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.milestones.push(milestone);
    await this.saveMilestones();

    console.log(`✅ Created milestone: ${milestone.name}`);
    console.log(`📅 Target Date: ${milestone.target_date || 'Not set'}`);
    console.log(`🆔 Milestone ID: ${milestone.id}`);
  }

  showHelp() {
    console.log('\n🎯 SIMPLIFIED MILESTONE TRACKING CLI - Alex (PM)');
    console.log('=====================================================');
    console.log('\nUSAGE:');
    console.log('  node milestone_tracking_cli_simple.js [action] [options]');
    console.log('\nACTIONS:');
    console.log('  --list                 List all milestones and status overview');
    console.log('  --create               Create a new milestone');
    console.log('  --help                 Show this help message');
    console.log('\nCREATE OPTIONS:');
    console.log('  --name <name>          Milestone name');
    console.log('  --description <desc>   Milestone description');
    console.log('  --target-date <date>   Target completion date (YYYY-MM-DD)');
    console.log('\nEXAMPLES:');
    console.log('  # List all milestones');
    console.log('  node milestone_tracking_cli_simple.js --list');
    console.log('\n  # Create a new milestone');
    console.log('  node milestone_tracking_cli_simple.js --create --name "MVP Release" --target-date "2024-08-02"');
    console.log('\nLike Alexander\'s systematic conquest, every milestone marks strategic progress toward victory.');
  }
}

async function main() {
  const cli = new SimplifiedMilestoneTrackingCLI();
  await cli.initialize();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    cli.showHelp();
    return;
  }

  if (args.includes('--list')) {
    await cli.listMilestones();
    return;
  }

  if (args.includes('--create')) {
    const nameIndex = args.indexOf('--name');
    const descIndex = args.indexOf('--description');
    const dateIndex = args.indexOf('--target-date');

    const options = {
      name: nameIndex !== -1 ? args[nameIndex + 1] : undefined,
      description: descIndex !== -1 ? args[descIndex + 1] : undefined,
      targetDate: dateIndex !== -1 ? args[dateIndex + 1] : undefined
    };

    await cli.createMilestone(options);
    return;
  }

  console.log('❌ Unknown action. Use --help for usage information.');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = SimplifiedMilestoneTrackingCLI;
