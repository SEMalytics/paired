#!/usr/bin/env node
/**
 * Agent Collaboration Templates CLI Interface
 *
 * Command-line interface for managing and executing multi-agent collaboration workflows
 */

const AgentCollaborationTemplates = require('../shared/templates/agent_collaboration_templates');
const AgentCollaborationOrchestrator = require('../shared/templates/agent_collaboration_orchestrator');

class CollaborationTemplatesCLI {
  constructor() {
    this.templates = new AgentCollaborationTemplates();
    this.orchestrator = null; // Initialize when needed
  }

  /**
   * List all available collaboration templates
   */
  listTemplates() {
    console.log('\n🤝 Available Agent Collaboration Templates:');
    console.log('===========================================\n');

    const templateNames = this.templates.getAllTemplates();

    templateNames.forEach((templateName, index) => {
      const template = this.templates.getTemplate(templateName);
      console.log(`${index + 1}. ${templateName.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   📝 ${template.description}`);
      console.log(`   👥 Lead Agent: ${template.leadAgent}`);
      console.log(`   ⏱️  Duration: ${template.estimatedDuration}`);
      console.log(`   🎯 Phases: ${template.phases.length}\n`);
    });

    console.log(`📊 Total Templates: ${templateNames.length}`);
    console.log('💡 Use "paired collaborate show <template_name>" for detailed information');
  }

  /**
   * Show detailed information about a specific template
   */
  showTemplate(templateName) {
    const template = this.templates.getTemplate(templateName);

    if (!template) {
      console.error(`❌ Template "${templateName}" not found`);
      console.log('\n💡 Available templates:');
      this.templates.getAllTemplates().forEach(name => {
        console.log(`   • ${name}`);
      });
      process.exit(1);
    }

    console.log(`\n🤝 ${templateName.replace(/_/g, ' ').toUpperCase()}`);
    console.log('='.repeat(50));
    console.log(`📝 Description: ${template.description}`);
    console.log(`👥 Lead Agent: ${template.leadAgent}`);
    console.log(`⏱️  Estimated Duration: ${template.estimatedDuration}`);
    console.log(`🎯 Success Criteria: ${template.successCriteria.join(', ')}`);

    console.log('\n📋 WORKFLOW PHASES:');
    template.phases.forEach((phase, index) => {
      console.log(`\n${index + 1}. ${phase.name.toUpperCase()}`);
      console.log(`   👤 Agent: ${phase.agent}`);
      console.log(`   📝 Description: ${phase.description}`);
      console.log('   📋 Tasks:');
      phase.tasks.forEach(task => {
        console.log(`      • ${task}`);
      });
      console.log(`   📊 Deliverables: ${phase.deliverables.join(', ')}`);
    });

    if (template.escalationTriggers && template.escalationTriggers.length > 0) {
      console.log('\n⚠️  ESCALATION TRIGGERS:');
      template.escalationTriggers.forEach(trigger => {
        console.log(`   • ${trigger}`);
      });
    }

    console.log('\n🚀 To start this workflow:');
    console.log(`   paired collaborate start ${templateName}`);
  }

  /**
   * Start a collaboration workflow
   */
  async startWorkflow(templateName, options = {}) {
    const template = this.templates.getTemplate(templateName);

    if (!template) {
      console.error(`❌ Template "${templateName}" not found`);
      process.exit(1);
    }

    console.log(`\n🚀 Starting Agent Collaboration: ${templateName.replace(/_/g, ' ').toUpperCase()}`);
    console.log('='.repeat(60));

    // Initialize orchestrator if needed
    if (!this.orchestrator) {
      console.log('🎭 Initializing Agent Collaboration Orchestrator...');
      // For now, create a simple mock agent registry
      const mockAgentRegistry = new Map([
        ['Sherlock', { status: 'available', capabilities: ['qa', 'testing', 'analysis'] }],
        ['Alex', { status: 'available', capabilities: ['pm', 'coordination', 'planning'] }],
        ['Leonardo', { status: 'available', capabilities: ['architecture', 'design', 'review'] }],
        ['Edison', { status: 'available', capabilities: ['development', 'implementation', 'debugging'] }],
        ['Maya', { status: 'available', capabilities: ['ux', 'design', 'user-research'] }],
        ['Vince', { status: 'available', capabilities: ['scrum', 'process', 'facilitation'] }],
        ['Marie', { status: 'available', capabilities: ['analysis', 'research', 'data'] }]
      ]);

      this.orchestrator = new AgentCollaborationOrchestrator(mockAgentRegistry);
    }

    try {
      console.log(`📋 Template: ${template.description}`);
      console.log(`👥 Lead Agent: ${template.leadAgent}`);
      console.log(`⏱️  Estimated Duration: ${template.estimatedDuration}`);
      console.log(`🎯 Phases: ${template.phases.length}\n`);

      // Start the workflow
      const workflowId = await this.orchestrator.startWorkflow(templateName, options);

      console.log('✅ Workflow started successfully!');
      console.log(`🆔 Workflow ID: ${workflowId}`);
      console.log('📊 Status: In Progress');
      console.log('\n💡 Use "paired collaborate status" to check progress');

    } catch (error) {
      console.error(`❌ Failed to start workflow: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
    case 'list':
      this.listTemplates();
      break;

    case 'show':
      if (!args[1]) {
        console.error('❌ Template name required');
        console.log('💡 Usage: node collaboration-templates-cli.js show <template_name>');
        process.exit(1);
      }
      this.showTemplate(args[1]);
      break;

    case 'start':
      if (!args[1]) {
        console.error('❌ Template name required');
        console.log('💡 Usage: node collaboration-templates-cli.js start <template_name>');
        process.exit(1);
      }
      await this.startWorkflow(args[1], { args: args.slice(2) });
      break;

    default:
      console.log('🤝 Agent Collaboration Templates CLI');
      console.log('===================================');
      console.log('');
      console.log('Commands:');
      console.log('  list              List all available templates');
      console.log('  show <template>   Show detailed template information');
      console.log('  start <template>  Start a collaboration workflow');
      console.log('');
      console.log('Examples:');
      console.log('  node collaboration-templates-cli.js list');
      console.log('  node collaboration-templates-cli.js show code_review_workflow');
      console.log('  node collaboration-templates-cli.js start feature_development');
      break;
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new CollaborationTemplatesCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = CollaborationTemplatesCLI;
