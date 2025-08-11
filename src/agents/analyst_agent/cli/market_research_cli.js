#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

// Import the Analyst Agent and its modules
const AnalystAgent = require('../../analyst_agent');

/**
 * Market Research CLI Tool
 * Provides command-line interface for conducting market research
 */
class MarketResearchCLI {
  constructor() {
    this.agent = null;
    this.options = {
      topic: null,
      methodology: 'mixed_methods',
      scope: 'comprehensive',
      timeline: '2_weeks',
      save: false,
      detailed: false
    };
  }

  /**
   * Initialize the CLI tool
   */
  async initialize() {
    try {
      // Create mock orchestrator for CLI usage
      const mockOrchestrator = {
        memoryManager: null,
        notificationSystem: null,
        claudeCodeIntegration: null
      };

      const config = {
        agent: {
          id: 'analyst-market-research-cli',
          name: 'Marie (Market Research CLI)',
          role: 'Analyst',
          persona: 'Strategic market research specialist'
        }
      };

      this.agent = new AnalystAgent(mockOrchestrator, config);
      await this.agent.initializeBaseSystems();
      
      console.log('📊 Market Research CLI initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Market Research CLI:', error.message);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  parseArguments() {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--topic=')) {
        this.options.topic = arg.split('=')[1];
      } else if (arg.startsWith('--methodology=')) {
        this.options.methodology = arg.split('=')[1];
      } else if (arg.startsWith('--scope=')) {
        this.options.scope = arg.split('=')[1];
      } else if (arg.startsWith('--timeline=')) {
        this.options.timeline = arg.split('=')[1];
      } else if (arg === '--save') {
        this.options.save = true;
      } else if (arg === '--detailed') {
        this.options.detailed = true;
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (!arg.startsWith('--')) {
        // Treat as topic if no topic specified
        if (!this.options.topic) {
          this.options.topic = arg;
        }
      }
    }

    // Default topic if none provided
    if (!this.options.topic) {
      this.options.topic = 'ai-development-tools-market';
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
📊 Market Research CLI Tool

Usage: node market_research_cli.js [topic] [options]

Arguments:
  topic                    Research topic (default: ai-development-tools-market)

Options:
  --methodology=METHOD     Research methodology (mixed_methods, qualitative, quantitative)
  --scope=SCOPE           Research scope (comprehensive, focused, quick)
  --timeline=TIMELINE     Research timeline (1_week, 2_weeks, 1_month)
  --save                  Save detailed research report
  --detailed              Show detailed analysis results
  --help, -h              Show this help message

Examples:
  node market_research_cli.js "cloud-development-platforms"
  node market_research_cli.js --topic="mobile-app-development" --methodology=qualitative --save
  node market_research_cli.js "ai-coding-assistants" --scope=focused --detailed

Methodology Options:
  - mixed_methods: Combines qualitative and quantitative research
  - qualitative: Focus on interviews, surveys, and behavioral analysis
  - quantitative: Focus on metrics, statistics, and numerical data
  - secondary: Focus on existing reports and published data

Scope Options:
  - comprehensive: Full market analysis with all aspects
  - focused: Targeted analysis on specific market segments
  - quick: Rapid assessment for immediate insights
    `);
  }

  /**
   * Conduct market research
   */
  async conductResearch() {
    try {
      console.log('📊 Starting Market Research Analysis...\n');
      
      const researchOptions = {
        methodology: this.options.methodology,
        scope: this.options.scope,
        timeline: this.options.timeline,
        objectives: this.generateObjectives(),
        include_primary: this.options.scope !== 'quick'
      };

      // Conduct the research
      const result = await this.agent.marketResearch.conductResearch(
        this.options.topic,
        researchOptions
      );

      // Display results
      await this.displayResults(result);

      // Save detailed report if requested
      if (this.options.save) {
        await this.saveDetailedReport(result);
      }

      console.log('\n✅ Market research analysis completed successfully!');
      
    } catch (error) {
      console.error('❌ Market research failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Generate research objectives based on topic
   */
  generateObjectives() {
    const topic = this.options.topic.toLowerCase();
    const objectives = [];

    // Base objectives for any topic
    objectives.push(
      `Analyze market size and growth potential for ${this.options.topic}`,
      `Identify key market segments and target audiences`,
      `Assess competitive landscape and opportunities`
    );

    // Topic-specific objectives
    if (topic.includes('ai') || topic.includes('artificial intelligence')) {
      objectives.push(
        'Evaluate AI technology adoption trends',
        'Analyze AI market maturity and barriers'
      );
    } else if (topic.includes('development') || topic.includes('coding')) {
      objectives.push(
        'Assess developer tool preferences and workflows',
        'Identify pain points in current development processes'
      );
    } else if (topic.includes('cloud') || topic.includes('saas')) {
      objectives.push(
        'Analyze cloud adoption patterns',
        'Evaluate pricing models and customer preferences'
      );
    }

    return objectives;
  }

  /**
   * Display research results
   */
  async displayResults(result) {
    console.log('📊 Market Research Results');
    console.log('================================\n');

    // Basic information
    console.log(`📋 Research Topic: ${this.options.topic}`);
    console.log(`🔬 Methodology: ${this.options.methodology}`);
    console.log(`🎯 Scope: ${this.options.scope}`);
    console.log(`⏱️  Timeline: ${this.options.timeline}`);
    console.log(`📊 Research ID: ${result.research_id}`);
    console.log(`✅ Status: ${result.status}`);
    console.log(`🔍 Findings: ${result.findings_count} collected`);
    console.log(`💡 Insights: ${result.insights_count} generated`);
    console.log(`📈 Confidence Level: ${result.confidence_level}%\n`);

    // Key insights
    if (result.key_insights && result.key_insights.length > 0) {
      console.log('🔑 Key Insights');
      console.log('---------------');
      result.key_insights.forEach((insight, index) => {
        const confidenceIcon = this.getConfidenceIcon(insight.confidence);
        const impactIcon = this.getImpactIcon(insight.impact);
        console.log(`${index + 1}. ${insight.insight}`);
        console.log(`   ${confidenceIcon} Confidence: ${Math.round(insight.confidence * 100)}%`);
        console.log(`   ${impactIcon} Impact: ${insight.impact}`);
        console.log(`   ⏰ Timeframe: ${insight.timeframe}\n`);
      });
    }

    // Next steps
    if (result.next_steps && result.next_steps.length > 0) {
      console.log('🚀 Recommended Next Steps');
      console.log('-------------------------');
      result.next_steps.forEach((step, index) => {
        const priorityIcon = this.getPriorityIcon(step.priority);
        console.log(`${index + 1}. ${step.description}`);
        console.log(`   ${priorityIcon} Priority: ${step.priority}`);
        console.log(`   ⏱️  Timeline: ${step.timeline}\n`);
      });
    }

    // Detailed analysis if requested
    if (this.options.detailed) {
      await this.showDetailedAnalysis(result);
    }
  }

  /**
   * Show detailed analysis
   */
  async showDetailedAnalysis(result) {
    console.log('📈 Detailed Analysis');
    console.log('===================\n');

    // Get full research data from agent
    const researchData = this.agent.marketResearch.researchProjects.get(result.research_id);
    
    if (researchData) {
      // Research objectives
      if (researchData.objectives && researchData.objectives.length > 0) {
        console.log('🎯 Research Objectives');
        console.log('---------------------');
        researchData.objectives.forEach((obj, index) => {
          const priorityIcon = this.getPriorityIcon(obj.priority);
          console.log(`${index + 1}. ${obj.description}`);
          console.log(`   ${priorityIcon} Priority: ${obj.priority}`);
          console.log(`   📊 Status: ${obj.status}\n`);
        });
      }

      // Data sources
      if (researchData.data_sources && researchData.data_sources.length > 0) {
        console.log('📚 Data Sources');
        console.log('---------------');
        researchData.data_sources.forEach((source, index) => {
          console.log(`${index + 1}. ${source.description} (${source.type})`);
          console.log(`   📅 Timeline: ${source.timeline}`);
          if (source.estimated_responses) {
            console.log(`   📊 Expected responses: ${source.estimated_responses}`);
          }
          console.log();
        });
      }

      // Sample findings
      if (researchData.findings && researchData.findings.length > 0) {
        console.log('🔍 Sample Findings');
        console.log('------------------');
        researchData.findings.slice(0, 5).forEach((finding, index) => {
          const confidenceIcon = this.getConfidenceIcon(finding.confidence);
          console.log(`${index + 1}. ${finding.finding}`);
          console.log(`   📊 Source: ${finding.source} (${finding.type})`);
          console.log(`   ${confidenceIcon} Confidence: ${Math.round(finding.confidence * 100)}%`);
          if (finding.sample_size) {
            console.log(`   👥 Sample size: ${finding.sample_size}`);
          }
          console.log();
        });
      }
    }
  }

  /**
   * Save detailed report
   */
  async saveDetailedReport(result) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `market_research_${this.options.topic.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.md`;
      const reportPath = path.join(process.cwd(), '.wee', 'agents', 'analyst', 'reports', filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });

      // Generate markdown report
      const report = await this.generateMarkdownReport(result);
      
      // Save report
      await fs.writeFile(reportPath, report);
      
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save detailed report:', error.message);
    }
  }

  /**
   * Generate markdown report
   */
  async generateMarkdownReport(result) {
    const timestamp = new Date().toLocaleString();
    
    let report = `# Market Research Report: ${this.options.topic}\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Research ID:** ${result.research_id}\n`;
    report += `**Methodology:** ${this.options.methodology}\n`;
    report += `**Scope:** ${this.options.scope}\n`;
    report += `**Confidence Level:** ${result.confidence_level}%\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This market research analysis of "${this.options.topic}" identified ${result.findings_count} key findings and generated ${result.insights_count} strategic insights with a confidence level of ${result.confidence_level}%.\n\n`;

    // Key insights
    if (result.key_insights && result.key_insights.length > 0) {
      report += `## Key Insights\n\n`;
      result.key_insights.forEach((insight, index) => {
        report += `### ${index + 1}. ${insight.insight}\n\n`;
        report += `- **Confidence:** ${Math.round(insight.confidence * 100)}%\n`;
        report += `- **Impact:** ${insight.impact}\n`;
        report += `- **Timeframe:** ${insight.timeframe}\n\n`;
        if (insight.supporting_evidence) {
          report += `**Supporting Evidence:**\n`;
          insight.supporting_evidence.forEach(evidence => {
            report += `- ${evidence}\n`;
          });
          report += `\n`;
        }
      });
    }

    // Next steps
    if (result.next_steps && result.next_steps.length > 0) {
      report += `## Recommended Next Steps\n\n`;
      result.next_steps.forEach((step, index) => {
        report += `### ${index + 1}. ${step.description}\n\n`;
        report += `- **Priority:** ${step.priority}\n`;
        report += `- **Timeline:** ${step.timeline}\n`;
        report += `- **Action:** ${step.action}\n\n`;
      });
    }

    report += `## Methodology\n\n`;
    report += `This research was conducted using a ${this.options.methodology} approach with ${this.options.scope} scope over a ${this.options.timeline} timeline.\n\n`;

    report += `---\n*Report generated by Marie (Analyst) Market Research CLI*\n`;

    return report;
  }

  // Helper methods for icons and formatting
  getConfidenceIcon(confidence) {
    if (confidence >= 0.8) return '🟢';
    if (confidence >= 0.6) return '🟡';
    return '🔴';
  }

  getImpactIcon(impact) {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  }

  getPriorityIcon(priority) {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const cli = new MarketResearchCLI();
  
  try {
    cli.parseArguments();
    await cli.initialize();
    await cli.conductResearch();
  } catch (error) {
    console.error('❌ Market Research CLI failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MarketResearchCLI;
