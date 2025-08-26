#!/usr/bin/env node

/**
 * PAIRED Project Knowledge CLI
 *
 * Command-line interface for managing persistent project knowledge,
 * learning from development sessions, and retrieving project context.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const PersistentProjectKnowledge = require('../core/persistent_project_knowledge');

const program = new Command();

program
  .name('paired-knowledge')
  .description('PAIRED Project Knowledge Management')
  .version('1.0.0');

/**
 * Initialize project knowledge
 */
program
  .command('init')
  .description('Initialize persistent project knowledge for current project')
  .option('--force', 'Force initialization even if already exists')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);

      console.log(chalk.blue('🧠 Initializing Persistent Project Knowledge...'));
      await knowledge.initialize();

      console.log(chalk.green('✅ Project Knowledge initialized successfully!'));
      console.log(chalk.gray(`   Project ID: ${knowledge.projectId}`));
      console.log(chalk.gray(`   Knowledge Dir: ${knowledge.config.knowledgeDir}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize project knowledge:'), error.message);
      process.exit(1);
    }
  });

/**
 * Learn from session data
 */
program
  .command('learn')
  .description('Learn from development session data')
  .option('-f, --file <file>', 'Session data file (JSON)')
  .option('-d, --data <data>', 'Session data (JSON string)')
  .option('--interactive', 'Interactive session learning')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);
      await knowledge.initialize();

      let sessionData;

      if (options.file) {
        const content = await fs.readFile(options.file, 'utf8');
        sessionData = JSON.parse(content);
      } else if (options.data) {
        sessionData = JSON.parse(options.data);
      } else if (options.interactive) {
        sessionData = await collectInteractiveSessionData();
      } else {
        console.error(chalk.red('❌ Please provide session data via --file, --data, or --interactive'));
        process.exit(1);
      }

      console.log(chalk.blue('📚 Learning from session data...'));
      const learningEntry = await knowledge.learnFromSession(sessionData);

      console.log(chalk.green('✅ Session learning complete!'));
      console.log(chalk.gray(`   Session ID: ${learningEntry.sessionId}`));
      console.log(chalk.gray(`   Patterns extracted: ${learningEntry.patterns.length}`));
      console.log(chalk.gray(`   Decisions captured: ${learningEntry.decisions.length}`));
      console.log(chalk.gray(`   Insights generated: ${learningEntry.insights.length}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to learn from session:'), error.message);
      process.exit(1);
    }
  });

/**
 * Get project context
 */
program
  .command('context')
  .description('Get project knowledge context')
  .option('-q, --query <query>', 'Search query')
  .option('--patterns', 'Include patterns in context')
  .option('--decisions', 'Include decisions in context')
  .option('--insights', 'Include insights in context')
  .option('--recommendations', 'Include recommendations in context')
  .option('--format <format>', 'Output format (json|markdown)', 'markdown')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);
      await knowledge.initialize();

      const query = {
        pattern: options.query,
        decision: options.query,
        insight: options.query,
        includePatterns: options.patterns,
        includeDecisions: options.decisions,
        includeInsights: options.insights,
        includeRecommendations: options.recommendations
      };

      console.log(chalk.blue('🔍 Retrieving project context...'));
      const context = await knowledge.getProjectContext(query);

      if (options.format === 'json') {
        console.log(JSON.stringify(context, null, 2));
      } else {
        displayContextMarkdown(context);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to get project context:'), error.message);
      process.exit(1);
    }
  });

/**
 * Search project knowledge
 */
program
  .command('search')
  .description('Search project knowledge')
  .argument('<query>', 'Search query')
  .option('-t, --type <type>', 'Search type (patterns|decisions|insights|all)', 'all')
  .option('--limit <limit>', 'Limit results', '10')
  .action(async (query, options) => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);
      await knowledge.initialize();

      console.log(chalk.blue(`🔍 Searching for: "${query}"`));

      const results = {};
      const limit = parseInt(options.limit);

      if (options.type === 'patterns' || options.type === 'all') {
        results.patterns = await knowledge.searchPatterns(query);
        results.patterns = results.patterns.slice(0, limit);
      }

      if (options.type === 'decisions' || options.type === 'all') {
        results.decisions = await knowledge.searchDecisions(query);
        results.decisions = results.decisions.slice(0, limit);
      }

      if (options.type === 'insights' || options.type === 'all') {
        results.insights = await knowledge.searchInsights(query);
        results.insights = results.insights.slice(0, limit);
      }

      displaySearchResults(results);
    } catch (error) {
      console.error(chalk.red('❌ Search failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Show project knowledge statistics
 */
program
  .command('stats')
  .description('Show project knowledge statistics')
  .action(async () => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);
      await knowledge.initialize();

      console.log(chalk.blue('📊 Project Knowledge Statistics'));
      console.log(chalk.gray('================================'));
      console.log();
      console.log(`${chalk.green('Project ID:')} ${knowledge.projectId}`);
      console.log(`${chalk.green('Knowledge Entries:')} ${knowledge.knowledgeStore.size}`);
      console.log(`${chalk.green('Patterns:')} ${knowledge.patterns.size}`);
      console.log(`${chalk.green('Decisions:')} ${knowledge.decisions.size}`);
      console.log(`${chalk.green('Insights:')} ${knowledge.insights.size}`);
      console.log();
      console.log(`${chalk.green('Knowledge Directory:')} ${knowledge.config.knowledgeDir}`);
      console.log(`${chalk.green('Learning Enabled:')} ${knowledge.config.learningEnabled ? 'Yes' : 'No'}`);
      console.log(`${chalk.green('Pattern Detection:')} ${knowledge.config.patternDetectionEnabled ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to get statistics:'), error.message);
      process.exit(1);
    }
  });

/**
 * Export project knowledge
 */
program
  .command('export')
  .description('Export project knowledge')
  .option('-o, --output <file>', 'Output file', 'project-knowledge.json')
  .option('--format <format>', 'Export format (json|markdown)', 'json')
  .action(async (options) => {
    try {
      const projectPath = process.cwd();
      const knowledge = new PersistentProjectKnowledge(projectPath);
      await knowledge.initialize();

      const exportData = {
        projectId: knowledge.projectId,
        timestamp: new Date().toISOString(),
        knowledge: Array.from(knowledge.knowledgeStore.values()),
        patterns: Array.from(knowledge.patterns.values()),
        decisions: Array.from(knowledge.decisions.values()),
        insights: Array.from(knowledge.insights.values())
      };

      if (options.format === 'json') {
        await fs.writeFile(options.output, JSON.stringify(exportData, null, 2), 'utf8');
      } else {
        const markdown = generateExportMarkdown(exportData);
        const outputFile = options.output.replace(/\.json$/, '.md');
        await fs.writeFile(outputFile, markdown, 'utf8');
      }

      console.log(chalk.green(`✅ Knowledge exported to: ${options.output}`));
    } catch (error) {
      console.error(chalk.red('❌ Export failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Helper Functions
 */

async function collectInteractiveSessionData() {
  const inquirer = require('inquirer');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Session description:'
    },
    {
      type: 'input',
      name: 'codeChanges',
      message: 'Code changes (comma-separated files):',
      filter: (input) => input.split(',').map(f => ({ file: f.trim(), pattern: 'manual_entry' }))
    },
    {
      type: 'input',
      name: 'decisions',
      message: 'Key decisions made:',
      filter: (input) => input ? [{ decision: input, rationale: 'User input' }] : []
    },
    {
      type: 'input',
      name: 'learnings',
      message: 'Key learnings:',
      filter: (input) => input ? [{ insight: input, context: 'User input' }] : []
    }
  ]);

  return {
    description: answers.description,
    codeChanges: answers.codeChanges,
    technicalDecisions: answers.decisions,
    learnings: answers.learnings,
    timestamp: new Date().toISOString()
  };
}

function displayContextMarkdown(context) {
  console.log(chalk.blue('\n# Project Knowledge Context\n'));

  if (context.patterns && context.patterns.length > 0) {
    console.log(chalk.green('## Patterns\n'));
    context.patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. **${pattern.type}**: ${pattern.pattern || pattern.description}`);
      if (pattern.frequency) console.log(`   - Frequency: ${pattern.frequency}`);
      if (pattern.files) console.log(`   - Files: ${pattern.files.slice(0, 3).join(', ')}`);
      console.log();
    });
  }

  if (context.decisions && context.decisions.length > 0) {
    console.log(chalk.green('## Decisions\n'));
    context.decisions.forEach((decision, index) => {
      console.log(`${index + 1}. **${decision.type}**: ${decision.decision}`);
      if (decision.rationale) console.log(`   - Rationale: ${decision.rationale}`);
      if (decision.alternatives) console.log(`   - Alternatives: ${decision.alternatives.join(', ')}`);
      console.log();
    });
  }

  if (context.insights && context.insights.length > 0) {
    console.log(chalk.green('## Insights\n'));
    context.insights.forEach((insight, index) => {
      console.log(`${index + 1}. **${insight.type}**: ${insight.insight}`);
      if (insight.recommendation) console.log(`   - Recommendation: ${insight.recommendation}`);
      console.log();
    });
  }

  if (context.recommendations && context.recommendations.length > 0) {
    console.log(chalk.green('## Recommendations\n'));
    context.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. **${rec.type}**: ${rec.recommendation}`);
      console.log(`   - Confidence: ${Math.round(rec.confidence * 100)}%`);
      console.log();
    });
  }
}

function displaySearchResults(results) {
  console.log(chalk.blue('\n# Search Results\n'));

  if (results.patterns && results.patterns.length > 0) {
    console.log(chalk.green(`## Patterns (${results.patterns.length})\n`));
    results.patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.pattern || pattern.description}`);
      console.log(`   Type: ${pattern.type}, Frequency: ${pattern.frequency || 1}`);
      console.log();
    });
  }

  if (results.decisions && results.decisions.length > 0) {
    console.log(chalk.green(`## Decisions (${results.decisions.length})\n`));
    results.decisions.forEach((decision, index) => {
      console.log(`${index + 1}. ${decision.decision}`);
      console.log(`   Type: ${decision.type}, Rationale: ${decision.rationale}`);
      console.log();
    });
  }

  if (results.insights && results.insights.length > 0) {
    console.log(chalk.green(`## Insights (${results.insights.length})\n`));
    results.insights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight.insight}`);
      console.log(`   Type: ${insight.type}`);
      console.log();
    });
  }
}

function generateExportMarkdown(exportData) {
  let markdown = '# Project Knowledge Export\n\n';
  markdown += `**Project ID:** ${exportData.projectId}\n`;
  markdown += `**Export Date:** ${exportData.timestamp}\n\n`;

  if (exportData.patterns.length > 0) {
    markdown += `## Patterns (${exportData.patterns.length})\n\n`;
    exportData.patterns.forEach((pattern, index) => {
      markdown += `### ${index + 1}. ${pattern.pattern || pattern.description}\n`;
      markdown += `- **Type:** ${pattern.type}\n`;
      markdown += `- **Frequency:** ${pattern.frequency || 1}\n`;
      if (pattern.files) markdown += `- **Files:** ${pattern.files.join(', ')}\n`;
      markdown += '\n';
    });
  }

  if (exportData.decisions.length > 0) {
    markdown += `## Decisions (${exportData.decisions.length})\n\n`;
    exportData.decisions.forEach((decision, index) => {
      markdown += `### ${index + 1}. ${decision.decision}\n`;
      markdown += `- **Type:** ${decision.type}\n`;
      markdown += `- **Rationale:** ${decision.rationale}\n`;
      if (decision.alternatives) markdown += `- **Alternatives:** ${decision.alternatives.join(', ')}\n`;
      markdown += '\n';
    });
  }

  if (exportData.insights.length > 0) {
    markdown += `## Insights (${exportData.insights.length})\n\n`;
    exportData.insights.forEach((insight, index) => {
      markdown += `### ${index + 1}. ${insight.insight}\n`;
      markdown += `- **Type:** ${insight.type}\n`;
      if (insight.recommendation) markdown += `- **Recommendation:** ${insight.recommendation}\n`;
      markdown += '\n';
    });
  }

  return markdown;
}

// Handle CLI execution
if (require.main === module) {
  program.parse();
}

module.exports = program;
