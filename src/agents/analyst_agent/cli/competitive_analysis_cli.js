#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

// Import the Analyst Agent
const AnalystAgent = require('../../analyst_agent');

/**
 * Competitive Analysis CLI Tool
 * Provides command-line interface for analyzing competitors
 */
class CompetitiveAnalysisCLI {
  constructor() {
    this.agent = null;
    this.options = {
      competitors: [],
      focus_areas: ['features', 'pricing', 'positioning'],
      save: false,
      detailed: false,
      format: 'summary'
    };
  }

  /**
   * Initialize the CLI tool
   */
  async initialize() {
    try {
      const mockOrchestrator = {
        memoryManager: null,
        notificationSystem: null,
        claudeCodeIntegration: null
      };

      const config = {
        agent: {
          id: 'analyst-competitive-cli',
          name: 'Marie (Competitive Analysis CLI)',
          role: 'Analyst',
          persona: 'Competitive intelligence specialist'
        }
      };

      this.agent = new AnalystAgent(mockOrchestrator, config);
      await this.agent.initializeBaseSystems();
      
      console.log('🎯 Competitive Analysis CLI initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Competitive Analysis CLI:', error.message);
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
      
      if (arg.startsWith('--competitors=')) {
        this.options.competitors = arg.split('=')[1].split(',').map(c => c.trim());
      } else if (arg.startsWith('--focus=')) {
        this.options.focus_areas = arg.split('=')[1].split(',').map(f => f.trim());
      } else if (arg.startsWith('--format=')) {
        this.options.format = arg.split('=')[1];
      } else if (arg === '--save') {
        this.options.save = true;
      } else if (arg === '--detailed') {
        this.options.detailed = true;
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (!arg.startsWith('--')) {
        // Treat as competitor name
        this.options.competitors.push(arg);
      }
    }

    // Use default competitors if none specified
    if (this.options.competitors.length === 0) {
      this.options.competitors = ['GitHub Copilot', 'Cursor', 'Tabnine'];
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🎯 Competitive Analysis CLI Tool

Usage: node competitive_analysis_cli.js [competitors] [options]

Arguments:
  competitors              Competitor names (space or comma separated)

Options:
  --competitors=LIST       Comma-separated list of competitors
  --focus=AREAS           Focus areas: features,pricing,positioning,market_share
  --format=FORMAT         Output format: summary, detailed, comparison
  --save                  Save analysis report
  --detailed              Show detailed competitive intelligence
  --help, -h              Show this help message

Examples:
  node competitive_analysis_cli.js "GitHub Copilot" "Cursor" "Tabnine"
  node competitive_analysis_cli.js --competitors="Copilot,Cursor" --focus=pricing,features
  node competitive_analysis_cli.js --format=comparison --detailed --save

Focus Areas:
  - features: Feature comparison and analysis
  - pricing: Pricing models and strategies
  - positioning: Market positioning and messaging
  - market_share: Market presence and user base
  - user_sentiment: User satisfaction and reviews

Output Formats:
  - summary: High-level competitive overview
  - detailed: Comprehensive analysis with insights
  - comparison: Side-by-side competitor comparison
    `);
  }

  /**
   * Conduct competitive analysis
   */
  async conductAnalysis() {
    try {
      console.log('🎯 Starting Competitive Analysis...\n');
      
      // Prepare competitor data
      const competitorData = this.options.competitors.map(name => ({ name }));

      // Conduct the analysis
      const result = await this.agent.competitiveIntelligence.analyzeCompetitors(
        competitorData,
        this.options.focus_areas
      );

      // Display results based on format
      await this.displayResults(result);

      // Save report if requested
      if (this.options.save) {
        await this.saveAnalysisReport(result);
      }

      console.log('\n✅ Competitive analysis completed successfully!');
      
    } catch (error) {
      console.error('❌ Competitive analysis failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Display analysis results
   */
  async displayResults(result) {
    console.log('🎯 Competitive Analysis Results');
    console.log('===============================\n');

    // Basic information
    console.log(`📊 Analysis ID: ${result.analysis_id}`);
    console.log(`🏢 Competitors Analyzed: ${result.competitors_analyzed}`);
    console.log(`🎯 Focus Areas: ${this.options.focus_areas.join(', ')}`);
    console.log(`📈 Competitive Gaps Identified: ${result.competitive_gaps.length}`);
    console.log(`🚀 Market Opportunities: ${result.market_opportunities.length}\n`);

    // Key insights
    if (result.key_insights && result.key_insights.length > 0) {
      console.log('💡 Key Competitive Insights');
      console.log('---------------------------');
      result.key_insights.forEach((insight, index) => {
        const opportunityIcon = this.getOpportunityIcon(insight.opportunity);
        const impactIcon = this.getImpactIcon(insight.impact);
        console.log(`${index + 1}. ${insight.insight}`);
        console.log(`   ${opportunityIcon} Opportunity: ${insight.opportunity}`);
        console.log(`   ${impactIcon} Impact: ${insight.impact}`);
        console.log(`   📊 Confidence: ${Math.round(insight.confidence * 100)}%\n`);
      });
    }

    // Top recommendations
    if (result.top_recommendations && result.top_recommendations.length > 0) {
      console.log('🎯 Strategic Recommendations');
      console.log('----------------------------');
      result.top_recommendations.forEach((rec, index) => {
        const priorityIcon = this.getPriorityIcon(rec.priority);
        console.log(`${index + 1}. ${rec.recommendation}`);
        console.log(`   ${priorityIcon} Priority: ${rec.priority}`);
        console.log(`   📅 Timeline: ${rec.timeline}`);
        console.log(`   🎯 Category: ${rec.category}`);
        console.log(`   📈 Expected Impact: ${rec.expected_impact}\n`);
      });
    }

    // Competitive gaps
    if (result.competitive_gaps && result.competitive_gaps.length > 0) {
      console.log('🔍 Competitive Gaps & Opportunities');
      console.log('-----------------------------------');
      result.competitive_gaps.forEach((gap, index) => {
        const opportunityIcon = this.getOpportunityIcon(gap.opportunity_level);
        console.log(`${index + 1}. ${gap.description}`);
        console.log(`   📊 Type: ${gap.type}`);
        console.log(`   ${opportunityIcon} Opportunity Level: ${gap.opportunity_level}\n`);
      });
    }

    // Market opportunities
    if (result.market_opportunities && result.market_opportunities.length > 0) {
      console.log('🚀 Market Opportunities');
      console.log('-----------------------');
      result.market_opportunities.forEach((opp, index) => {
        const confidenceIcon = this.getConfidenceIcon(opp.confidence);
        const impactIcon = this.getImpactIcon(opp.impact);
        console.log(`${index + 1}. ${opp.opportunity}`);
        console.log(`   📝 Description: ${opp.description}`);
        console.log(`   ${confidenceIcon} Confidence: ${Math.round(opp.confidence * 100)}%`);
        console.log(`   ${impactIcon} Impact: ${opp.impact}\n`);
      });
    }

    // Detailed analysis if requested
    if (this.options.detailed || this.options.format === 'detailed') {
      await this.showDetailedAnalysis(result);
    }

    // Comparison format
    if (this.options.format === 'comparison') {
      await this.showComparisonMatrix(result);
    }
  }

  /**
   * Show detailed competitive analysis
   */
  async showDetailedAnalysis(result) {
    console.log('📈 Detailed Competitive Intelligence');
    console.log('====================================\n');

    // Get full analysis data from agent
    const analysisData = this.agent.competitiveIntelligence.competitiveAnalyses.get(result.analysis_id);
    
    if (analysisData && analysisData.findings) {
      console.log('🏢 Individual Competitor Profiles');
      console.log('---------------------------------');
      
      analysisData.findings.forEach((competitor, index) => {
        console.log(`${index + 1}. ${competitor.name}`);
        console.log(`   📅 Analysis Date: ${new Date(competitor.analysis_date).toLocaleDateString()}\n`);

        // Features analysis
        if (competitor.features && this.options.focus_areas.includes('features')) {
          console.log('   🔧 Features Analysis:');
          console.log(`      Core Features: ${competitor.features.core_features.length}`);
          console.log(`      Advanced Features: ${competitor.features.advanced_features.length}`);
          console.log(`      Unique Features: ${competitor.features.unique_features.join(', ')}`);
          console.log(`      Missing Features: ${competitor.features.missing_features.join(', ')}`);
          console.log(`      Quality Rating: ${competitor.features.feature_quality}\n`);
        }

        // Pricing analysis
        if (competitor.pricing && this.options.focus_areas.includes('pricing')) {
          console.log('   💰 Pricing Analysis:');
          console.log(`      Model: ${competitor.pricing.model}`);
          console.log(`      Strategy: ${competitor.pricing.pricing_strategy}`);
          if (competitor.pricing.tiers && competitor.pricing.tiers.length > 0) {
            console.log('      Pricing Tiers:');
            competitor.pricing.tiers.forEach(tier => {
              console.log(`        - ${tier.name}: $${tier.price}/month (${tier.features})`);
            });
          }
          console.log();
        }

        // Positioning analysis
        if (competitor.positioning && this.options.focus_areas.includes('positioning')) {
          console.log('   🎯 Market Positioning:');
          console.log(`      Target Market: ${competitor.positioning.target_market}`);
          console.log(`      Value Proposition: ${competitor.positioning.value_proposition}`);
          console.log(`      Key Differentiators: ${competitor.positioning.differentiation.join(', ')}`);
          console.log(`      Brand Perception: ${competitor.positioning.brand_perception}\n`);
        }

        // Strengths and weaknesses
        if (competitor.strengths && competitor.strengths.length > 0) {
          console.log('   💪 Strengths:');
          competitor.strengths.forEach(strength => {
            console.log(`      • ${strength}`);
          });
          console.log();
        }

        if (competitor.weaknesses && competitor.weaknesses.length > 0) {
          console.log('   ⚠️  Weaknesses:');
          competitor.weaknesses.forEach(weakness => {
            console.log(`      • ${weakness}`);
          });
          console.log();
        }

        console.log('   ' + '─'.repeat(50) + '\n');
      });
    }
  }

  /**
   * Show comparison matrix
   */
  async showComparisonMatrix(result) {
    console.log('📊 Competitive Comparison Matrix');
    console.log('================================\n');

    const analysisData = this.agent.competitiveIntelligence.competitiveAnalyses.get(result.analysis_id);
    
    if (analysisData && analysisData.findings) {
      // Create comparison table
      const competitors = analysisData.findings;
      
      // Features comparison
      if (this.options.focus_areas.includes('features')) {
        console.log('🔧 Features Comparison');
        console.log('----------------------');
        console.log('Competitor'.padEnd(20) + 'Core'.padEnd(8) + 'Advanced'.padEnd(12) + 'Unique'.padEnd(10) + 'Quality');
        console.log('─'.repeat(60));
        
        competitors.forEach(comp => {
          const name = comp.name.substring(0, 18).padEnd(20);
          const core = (comp.features.core_features?.length || 0).toString().padEnd(8);
          const advanced = (comp.features.advanced_features?.length || 0).toString().padEnd(12);
          const unique = (comp.features.unique_features?.length || 0).toString().padEnd(10);
          const quality = comp.features.feature_quality || 'N/A';
          console.log(name + core + advanced + unique + quality);
        });
        console.log();
      }

      // Pricing comparison
      if (this.options.focus_areas.includes('pricing')) {
        console.log('💰 Pricing Comparison');
        console.log('---------------------');
        console.log('Competitor'.padEnd(20) + 'Model'.padEnd(15) + 'Free Tier'.padEnd(12) + 'Pro Price');
        console.log('─'.repeat(55));
        
        competitors.forEach(comp => {
          const name = comp.name.substring(0, 18).padEnd(20);
          const model = (comp.pricing.model || 'N/A').padEnd(15);
          const hasFree = comp.pricing.tiers?.some(t => t.price === 0) ? 'Yes' : 'No';
          const freeCol = hasFree.padEnd(12);
          const proTier = comp.pricing.tiers?.find(t => t.price > 0);
          const proPrice = proTier ? `$${proTier.price}` : 'N/A';
          console.log(name + model + freeCol + proPrice);
        });
        console.log();
      }

      // Positioning comparison
      if (this.options.focus_areas.includes('positioning')) {
        console.log('🎯 Positioning Comparison');
        console.log('-------------------------');
        competitors.forEach((comp, index) => {
          console.log(`${index + 1}. ${comp.name}`);
          console.log(`   Value Prop: ${comp.positioning.value_proposition}`);
          console.log(`   Brand: ${comp.positioning.brand_perception}`);
          console.log();
        });
      }
    }
  }

  /**
   * Save analysis report
   */
  async saveAnalysisReport(result) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const competitorNames = this.options.competitors.join('_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `competitive_analysis_${competitorNames}_${timestamp}.md`;
      const reportPath = path.join(process.cwd(), '.wee', 'agents', 'analyst', 'reports', filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });

      // Generate markdown report
      const report = await this.generateMarkdownReport(result);
      
      // Save report
      await fs.writeFile(reportPath, report);
      
      console.log(`\n💾 Analysis report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save analysis report:', error.message);
    }
  }

  /**
   * Generate markdown report
   */
  async generateMarkdownReport(result) {
    const timestamp = new Date().toLocaleString();
    
    let report = `# Competitive Analysis Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Analysis ID:** ${result.analysis_id}\n`;
    report += `**Competitors:** ${this.options.competitors.join(', ')}\n`;
    report += `**Focus Areas:** ${this.options.focus_areas.join(', ')}\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This competitive analysis examined ${result.competitors_analyzed} competitors, identifying ${result.competitive_gaps.length} competitive gaps and ${result.market_opportunities.length} market opportunities.\n\n`;

    // Key insights
    if (result.key_insights && result.key_insights.length > 0) {
      report += `## Key Competitive Insights\n\n`;
      result.key_insights.forEach((insight, index) => {
        report += `### ${index + 1}. ${insight.insight}\n\n`;
        report += `- **Opportunity:** ${insight.opportunity}\n`;
        report += `- **Impact:** ${insight.impact}\n`;
        report += `- **Confidence:** ${Math.round(insight.confidence * 100)}%\n\n`;
      });
    }

    // Recommendations
    if (result.top_recommendations && result.top_recommendations.length > 0) {
      report += `## Strategic Recommendations\n\n`;
      result.top_recommendations.forEach((rec, index) => {
        report += `### ${index + 1}. ${rec.recommendation}\n\n`;
        report += `- **Priority:** ${rec.priority}\n`;
        report += `- **Timeline:** ${rec.timeline}\n`;
        report += `- **Category:** ${rec.category}\n`;
        report += `- **Expected Impact:** ${rec.expected_impact}\n\n`;
      });
    }

    // Competitive gaps
    if (result.competitive_gaps && result.competitive_gaps.length > 0) {
      report += `## Competitive Gaps\n\n`;
      result.competitive_gaps.forEach((gap, index) => {
        report += `${index + 1}. **${gap.description}**\n`;
        report += `   - Type: ${gap.type}\n`;
        report += `   - Opportunity Level: ${gap.opportunity_level}\n\n`;
      });
    }

    report += `---\n*Report generated by Marie (Analyst) Competitive Analysis CLI*\n`;

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

  getOpportunityIcon(opportunity) {
    switch (opportunity) {
      case 'high': return '🚀';
      case 'medium': return '📈';
      case 'low': return '📊';
      default: return '⚪';
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const cli = new CompetitiveAnalysisCLI();
  
  try {
    cli.parseArguments();
    await cli.initialize();
    await cli.conductAnalysis();
  } catch (error) {
    console.error('❌ Competitive Analysis CLI failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CompetitiveAnalysisCLI;
