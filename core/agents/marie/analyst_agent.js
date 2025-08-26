const BaseAgent = require('../base_agent');
const path = require('path');
const fs = require('fs').promises;

// Core modules
const MarketResearch = require('./modules/market_research');
const CompetitiveIntelligence = require('./modules/competitive_intelligence');
const RequirementsGathering = require('./modules/requirements_gathering');
const DataAnalysis = require('./modules/data_analysis');

/**
 * Analyst Agent (Marie - Marie Curie) - Master Data Scientist
 *
 * Named after Marie Curie, the pioneering scientist who discovered radium and
 * polonium through meticulous research, data analysis, and systematic investigation.
 * Like Marie's groundbreaking research that required analyzing countless samples
 * to extract meaningful insights, Marie the agent transforms raw market data
 * into strategic intelligence through rigorous analysis and scientific method.
 *
 * Philosophy: "Discovery Through Systematic Analysis"
 * - Market research conducted with scientific rigor like Marie's lab work
 * - Competitive analysis through methodical data collection and hypothesis testing
 * - Requirements gathering with the precision of experimental design
 * - Data analysis that reveals hidden patterns like Marie's radioactive discoveries
 *
 * Reasoning for Name: Marie Curie embodied the analyst mindset - she was
 * methodical, data-driven, persistent in research, and able to extract
 * meaningful insights from complex information. Her systematic approach
 * to scientific discovery, attention to detail, and ability to see patterns
 * others missed perfectly mirrors the ideal business analyst capabilities.
 */
class AnalystAgent extends BaseAgent {
  constructor(orchestrator, config) {
    super(orchestrator, config);

    // Agent-specific properties
    this.agentType = 'analyst';
    this.capabilities = [
      'market_research',
      'competitive_analysis',
      'requirements_gathering',
      'data_analysis',
      'strategic_insights',
      'trend_analysis'
    ];

    // Core modules
    this.marketResearch = null;
    this.competitiveIntelligence = null;
    this.requirementsGathering = null;
    this.dataAnalysis = null;

    // Agent state
    this.activeResearch = new Map();
    this.competitorProfiles = new Map();
    this.requirementsMatrix = new Map();
    this.insights = new Map();

    console.log(`🏃 Analyst Agent (${this.name}) initializing...`);
  }

  /**
   * Initialize agent-specific systems
   */
  async initializeAgentSystems() {
    try {
      console.log(`🏃 Analyst config loaded for ${this.name}`);

      // Initialize core modules
      this.marketResearch = new MarketResearch(this);
      await this.marketResearch.initialize();

      this.competitiveIntelligence = new CompetitiveIntelligence(this);
      await this.competitiveIntelligence.initialize();

      this.requirementsGathering = new RequirementsGathering(this);
      await this.requirementsGathering.initialize();

      this.dataAnalysis = new DataAnalysis(this);
      await this.dataAnalysis.initialize();

      // Ensure analyst directories exist
      await this.ensureAnalystDirectories();

      console.log(`🏃 Analyst systems initialized for ${this.name}`);

    } catch (error) {
      console.error(`❌ Failed to initialize Analyst systems: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process analyst-specific requests
   */
  async processRequest(request) {
    const startTime = Date.now();
    request.startTime = startTime;

    console.log(`🏃 ${this.name} processing Analyst request: ${request.type}`);

    try {
      let result;

      switch (request.type) {
      case 'conduct_market_research':
        console.log('📊 Conducting market research...');
        result = await this.marketResearch.conductResearch(
          request.topic || 'general_market_analysis',
          request.options || {}
        );
        break;

      case 'analyze_competitors':
        console.log('🎯 Analyzing competitors...');
        result = await this.competitiveIntelligence.analyzeCompetitors(
          request.competitors || [],
          request.focus_areas || ['features', 'pricing', 'positioning']
        );
        break;

      case 'gather_requirements':
        console.log('📋 Gathering requirements...');
        result = await this.requirementsGathering.gatherRequirements(
          request.stakeholders || [],
          request.scope || 'general'
        );
        break;

      case 'analyze_data':
        console.log('📈 Analyzing data...');
        result = await this.dataAnalysis.analyzeMetrics(
          request.data_sources || [],
          request.analysis_type || 'trend_analysis'
        );
        break;

      case 'generate_insights':
        console.log('💡 Generating strategic insights...');
        result = await this.generateStrategicInsights(
          request.context || {},
          request.focus || 'market_opportunities'
        );
        break;

      case 'create_research_report':
        console.log('📄 Creating research report...');
        result = await this.createResearchReport(
          request.research_id,
          request.format || 'comprehensive'
        );
        break;

      default:
        throw new Error(`Unknown Analyst request type: ${request.type}`);
      }

      // Track performance metrics
      if (this.performance && typeof this.performance.recordMetric === 'function') {
        this.performance.recordMetric({
          type: request.type,
          duration: Date.now() - request.startTime,
          success: true,
          agent: this.name
        });
      }

      console.log(`✅ ${this.name} completed Analyst request: ${request.type}`);
      this.emit('request_completed', { agent: this.name, request: request.type, result });

      return result;

    } catch (error) {
      console.error(`❌ Analyst request failed: ${error.message}`);
      if (this.performance && typeof this.performance.recordMetric === 'function') {
        this.performance.recordMetric({
          type: request.type,
          duration: Date.now() - request.startTime,
          success: false,
          error: error.message,
          agent: this.name
        });
      }

      this.emit('request_failed', { agent: this.name, request: request.type, error: error.message });
      throw error;
    }
  }

  /**
   * Generate strategic insights from available data
   */
  async generateStrategicInsights(context, focus) {
    try {
      const insights = {
        id: `insight-${Date.now()}`,
        focus,
        context,
        timestamp: new Date().toISOString(),
        insights: [],
        recommendations: [],
        confidence_score: 0
      };

      // Gather data from all modules
      const marketData = await this.marketResearch.getCurrentResearch();
      const competitorData = await this.competitiveIntelligence.getCompetitorProfiles();
      const requirementsData = await this.requirementsGathering.getRequirementsMatrix();
      const analyticsData = await this.dataAnalysis.getLatestAnalysis();

      // Generate insights based on focus area
      switch (focus) {
      case 'market_opportunities':
        insights.insights = this.analyzeMarketOpportunities(marketData, competitorData);
        break;
      case 'competitive_positioning':
        insights.insights = this.analyzeCompetitivePositioning(competitorData, requirementsData);
        break;
      case 'user_needs':
        insights.insights = this.analyzeUserNeeds(requirementsData, analyticsData);
        break;
      case 'strategic_gaps':
        insights.insights = this.analyzeStrategicGaps(marketData, competitorData, requirementsData);
        break;
      default:
        insights.insights = this.generateGeneralInsights(marketData, competitorData, requirementsData);
      }

      // Generate actionable recommendations
      insights.recommendations = this.generateRecommendations(insights.insights, context);
      insights.confidence_score = this.calculateConfidenceScore(insights.insights);

      // Store insights
      this.insights.set(insights.id, insights);
      await this.saveInsights(insights);

      return insights;

    } catch (error) {
      console.error('❌ Failed to generate strategic insights:', error.message);
      throw error;
    }
  }

  /**
   * Create comprehensive research report
   */
  async createResearchReport(researchId, format) {
    try {
      const research = this.activeResearch.get(researchId);
      if (!research) {
        throw new Error(`Research not found: ${researchId}`);
      }

      const report = {
        id: `report-${Date.now()}`,
        research_id: researchId,
        format,
        timestamp: new Date().toISOString(),
        title: research.title || `Research Report: ${researchId}`,
        executive_summary: '',
        findings: [],
        recommendations: [],
        appendices: []
      };

      // Generate report content based on format
      if (format === 'comprehensive') {
        report.executive_summary = await this.generateExecutiveSummary(research);
        report.findings = await this.compileFindings(research);
        report.recommendations = await this.generateRecommendations(report.findings);
        report.appendices = await this.compileAppendices(research);
      } else if (format === 'executive') {
        report.executive_summary = await this.generateExecutiveSummary(research);
        report.findings = await this.compileKeyFindings(research);
        report.recommendations = await this.generateTopRecommendations(report.findings);
      }

      // Save report
      await this.saveResearchReport(report);

      return report;

    } catch (error) {
      console.error('❌ Failed to create research report:', error.message);
      throw error;
    }
  }

  /**
   * Get agent status with analyst-specific metrics
   */
  async getStatus() {
    const baseStatus = {
      status: this.status || 'available',
      agent_id: this.id,
      agent_name: this.name,
      agent_role: this.role,
      current_tasks: this.currentTasks ? this.currentTasks.size : 0,
      last_activity: new Date().toISOString()
    };

    return {
      ...baseStatus,
      analyst_metrics: {
        active_research: this.activeResearch.size,
        competitor_profiles: this.competitorProfiles.size,
        requirements_tracked: this.requirementsMatrix.size,
        insights_generated: this.insights.size,
        capabilities: this.capabilities,
        modules_status: {
          market_research: this.marketResearch ? 'active' : 'inactive',
          competitive_intelligence: this.competitiveIntelligence ? 'active' : 'inactive',
          requirements_gathering: this.requirementsGathering ? 'active' : 'inactive',
          data_analysis: this.dataAnalysis ? 'active' : 'inactive'
        }
      }
    };
  }

  // Helper methods for insight generation
  analyzeMarketOpportunities(marketData, competitorData) {
    return [
      {
        type: 'market_gap',
        description: 'Identified underserved market segment',
        confidence: 0.8,
        impact: 'high'
      },
      {
        type: 'trend_opportunity',
        description: 'Emerging technology trend alignment',
        confidence: 0.7,
        impact: 'medium'
      }
    ];
  }

  analyzeCompetitivePositioning(competitorData, requirementsData) {
    return [
      {
        type: 'differentiation',
        description: 'Unique value proposition identified',
        confidence: 0.9,
        impact: 'high'
      }
    ];
  }

  analyzeUserNeeds(requirementsData, analyticsData) {
    return [
      {
        type: 'user_pain_point',
        description: 'Critical user workflow inefficiency',
        confidence: 0.8,
        impact: 'high'
      }
    ];
  }

  analyzeStrategicGaps(marketData, competitorData, requirementsData) {
    return [
      {
        type: 'capability_gap',
        description: 'Missing core functionality',
        confidence: 0.7,
        impact: 'medium'
      }
    ];
  }

  generateGeneralInsights(marketData, competitorData, requirementsData) {
    return [
      {
        type: 'general_insight',
        description: 'Overall market position analysis',
        confidence: 0.6,
        impact: 'medium'
      }
    ];
  }

  generateRecommendations(insights, context) {
    return insights.map(insight => ({
      based_on: insight.type,
      recommendation: `Address ${insight.description}`,
      priority: insight.impact,
      confidence: insight.confidence,
      timeline: insight.impact === 'high' ? 'immediate' : 'medium_term'
    }));
  }

  calculateConfidenceScore(insights) {
    if (insights.length === 0) return 0;
    const avgConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
    return Math.round(avgConfidence * 100);
  }

  // File system helpers
  async ensureAnalystDirectories() {
    const baseDir = path.join(process.cwd(), '.windsurf', 'agents', 'analyst');
    const dirs = [
      'research',
      'competitive',
      'requirements',
      'insights',
      'reports'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(baseDir, dir), { recursive: true });
    }
  }

  async saveInsights(insights) {
    const filePath = path.join(process.cwd(), '.windsurf', 'agents', 'analyst', 'insights', `${insights.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(insights, null, 2));
  }

  async saveResearchReport(report) {
    const filePath = path.join(process.cwd(), '.windsurf', 'agents', 'analyst', 'reports', `${report.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
  }

  // Report generation helpers
  async generateExecutiveSummary(research) {
    return `Executive Summary for ${research.title}\n\nKey findings and strategic implications...`;
  }

  async compileFindings(research) {
    return [
      {
        category: 'market_analysis',
        finding: 'Market shows strong growth potential',
        evidence: 'Based on industry reports and trend analysis'
      }
    ];
  }

  async compileKeyFindings(research) {
    const findings = await this.compileFindings(research);
    return findings.slice(0, 3); // Top 3 findings for executive format
  }

  async generateTopRecommendations(findings) {
    return findings.slice(0, 5).map(finding => ({
      recommendation: `Act on ${finding.finding}`,
      priority: 'high',
      rationale: finding.evidence
    }));
  }

  async compileAppendices(research) {
    return [
      {
        title: 'Data Sources',
        content: 'List of all data sources used in analysis'
      },
      {
        title: 'Methodology',
        content: 'Research methodology and analytical approach'
      }
    ];
  }
}

module.exports = AnalystAgent;
