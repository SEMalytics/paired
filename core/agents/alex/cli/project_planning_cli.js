#!/usr/bin/env node

const PMAgent = require('../../pm_agent');
const SharedMemorySystem = require('../../../core/shared_memory');

/**
 * Project Planning CLI Tool for PM Agent (Alex - Alexander)
 *
 * Command-line interface for creating comprehensive project plans,
 * managing project scope, and coordinating strategic planning activities.
 * Like Alexander's meticulous campaign planning, every project needs careful preparation.
 */

class ProjectPlanningCLI {
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
          id: 'alex-project-planning-cli',
          name: 'Alex (Project Planning CLI)',
          role: 'project_manager',
          persona: 'Strategic project coordinator focused on comprehensive planning'
        },
        integration: {
          notification_types: ['project_updates', 'milestone_alerts'],
          claude_code_priority: ['planning', 'documentation'],
          windsurf_operations: ['strategic_planning', 'stakeholder_coordination']
        }
      });

      await this.agent.initializeBaseSystems();
      console.log('📋 Project Planning CLI initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Project Planning CLI:', error.message);
      process.exit(1);
    }
  }

  async createProjectPlan(options) {
    try {
      console.log(`📋 Creating project plan: ${options.name || 'New Project'}`);

      const projectScope = {
        name: options.name || 'New Project',
        description: options.description || 'Project created via CLI',
        type: options.type || 'web_application',
        objectives: options.objectives ? options.objectives.split(',') : [
          'Deliver high-quality solution',
          'Meet timeline and budget constraints',
          'Ensure stakeholder satisfaction'
        ]
      };

      const requirements = options.requirements ?
        options.requirements.split(',').map(req => ({
          id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          description: req.trim(),
          priority: 'medium',
          type: 'functional'
        })) : [];

      const constraints = {
        start_date: options.startDate || new Date().toISOString(),
        end_date: options.endDate,
        budget: options.budget ? parseInt(options.budget) : undefined,
        team_size: options.teamSize ? parseInt(options.teamSize) : undefined,
        buffer_percentage: options.buffer ? parseInt(options.buffer) : 20
      };

      const result = await this.agent.projectPlanning.createProjectPlan(
        projectScope,
        requirements,
        constraints
      );

      this.displayProjectPlan(result, options.detailed);

      if (options.save) {
        await this.saveProjectPlan(result, options.output);
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to create project plan:', error.message);
      throw error;
    }
  }

  displayProjectPlan(result, detailed = false) {
    console.log('\n📋 PROJECT PLAN CREATED');
    console.log('========================');
    console.log(`Project ID: ${result.project_id}`);
    console.log(`Project Name: ${result.project_name}`);
    console.log(`Phases: ${result.phases}`);
    console.log(`Estimated Duration: ${result.estimated_duration}`);
    console.log(`Required Resources: ${result.required_resources}`);
    console.log(`Identified Risks: ${result.identified_risks}`);
    console.log(`Success Criteria: ${result.success_criteria}`);

    if (detailed && result.project_plan) {
      console.log('\n📋 DETAILED PROJECT PLAN');
      console.log('=========================');

      console.log('\n🎯 PROJECT PHASES:');
      result.project_plan.phases.forEach((phase, index) => {
        console.log(`${index + 1}. ${phase.name} (${phase.duration_estimate})`);
        if (detailed) {
          phase.activities.forEach(activity => {
            console.log(`   • ${activity}`);
          });
        }
      });

      console.log('\n📅 TIMELINE:');
      console.log(`Start Date: ${new Date(result.project_plan.timeline.start_date).toLocaleDateString()}`);
      console.log(`End Date: ${new Date(result.project_plan.timeline.estimated_end_date).toLocaleDateString()}`);
      console.log(`Total Duration: ${result.project_plan.timeline.total_duration}`);

      console.log('\n🎯 MILESTONES:');
      result.project_plan.timeline.milestones.forEach((milestone, index) => {
        console.log(`${index + 1}. ${milestone.name} - ${new Date(milestone.target_date).toLocaleDateString()}`);
      });

      console.log('\n👥 REQUIRED RESOURCES:');
      result.project_plan.resources.forEach(resource => {
        console.log(`• ${resource.role} (${resource.allocation})`);
      });

      console.log('\n⚠️ IDENTIFIED RISKS:');
      result.project_plan.risks.forEach((risk, index) => {
        console.log(`${index + 1}. ${risk.description} (${risk.probability}/${risk.impact})`);
        console.log(`   Mitigation: ${risk.mitigation}`);
      });

      console.log('\n✅ SUCCESS CRITERIA:');
      result.project_plan.success_criteria.forEach((criteria, index) => {
        console.log(`${index + 1}. ${criteria}`);
      });
    }
  }

  async saveProjectPlan(result, outputPath) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const filename = outputPath || `project-plan-${result.project_id}.json`;
      const fullPath = path.resolve(filename);

      await fs.writeFile(fullPath, JSON.stringify(result, null, 2));
      console.log(`\n💾 Project plan saved to: ${fullPath}`);

    } catch (error) {
      console.error('❌ Failed to save project plan:', error.message);
    }
  }

  displayHelp() {
    console.log(`
📋 PROJECT PLANNING CLI - PM Agent (Alex)
========================================

USAGE:
  node project_planning_cli.js [options]

OPTIONS:
  --name <name>           Project name
  --description <desc>    Project description
  --type <type>          Project type (web_application, api_development, research_project)
  --objectives <list>     Comma-separated list of objectives
  --requirements <list>   Comma-separated list of requirements
  --start-date <date>     Project start date (ISO format)
  --end-date <date>       Project end date (ISO format)
  --budget <amount>       Project budget
  --team-size <number>    Expected team size
  --buffer <percentage>   Buffer time percentage (default: 20)
  --detailed             Show detailed project plan
  --save                 Save project plan to file
  --output <path>        Output file path (default: project-plan-<id>.json)
  --help                 Show this help message

EXAMPLES:
  # Create a basic web application project plan
  node project_planning_cli.js --name "E-commerce Platform" --type web_application --detailed

  # Create a project with specific requirements and timeline
  node project_planning_cli.js \\
    --name "API Integration" \\
    --type api_development \\
    --requirements "User authentication,Data synchronization,Error handling" \\
    --start-date "2024-02-01" \\
    --budget 50000 \\
    --team-size 4 \\
    --save

  # Create a research project with custom objectives
  node project_planning_cli.js \\
    --name "Market Analysis" \\
    --type research_project \\
    --objectives "Identify market trends,Analyze competitors,Generate insights" \\
    --detailed --save

Like Alexander's strategic campaigns, every successful project begins with comprehensive planning.
    `);
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
      case '--name':
        options.name = args[++i];
        break;
      case '--description':
        options.description = args[++i];
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--objectives':
        options.objectives = args[++i];
        break;
      case '--requirements':
        options.requirements = args[++i];
        break;
      case '--start-date':
        options.startDate = args[++i];
        break;
      case '--end-date':
        options.endDate = args[++i];
        break;
      case '--budget':
        options.budget = args[++i];
        break;
      case '--team-size':
        options.teamSize = args[++i];
        break;
      case '--buffer':
        options.buffer = args[++i];
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
  const cli = new ProjectPlanningCLI();
  const options = cli.parseArguments();

  if (options.help) {
    cli.displayHelp();
    return;
  }

  try {
    await cli.initialize();
    await cli.createProjectPlan(options);
  } catch (error) {
    console.error('❌ Project Planning CLI failed:', error.message);
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

module.exports = ProjectPlanningCLI;
