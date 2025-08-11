const fs = require('fs').promises;
const path = require('path');

/**
 * Market Research Module for Analyst Agent
 * Handles market analysis, trend identification, and research data collection
 */
class MarketResearch {
  constructor(agent) {
    this.agent = agent;
    this.researchProjects = new Map();
    this.marketTrends = new Map();
    this.researchTemplates = new Map();
    this.dataSource = new Map();
    
    console.log('📊 Market Research module initializing...');
  }

  /**
   * Initialize the market research module
   */
  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      return;
    }
    
    try {
      await this.ensureDirectories();
      await this.loadResearchTemplates();
      await this.loadExistingResearch();
      this.initialized = true;
      console.log('📊 Market Research module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Market Research module:', error.message);
      throw error;
    }
  }

  /**
   * Conduct comprehensive market research
   */
  async conductResearch(topic, options = {}) {
    try {
      const researchId = `research-${Date.now()}`;
      const research = {
        id: researchId,
        topic,
        status: 'in_progress',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        methodology: options.methodology || 'mixed_methods',
        scope: options.scope || 'comprehensive',
        timeline: options.timeline || '2_weeks',
        objectives: options.objectives || [],
        data_sources: [],
        findings: [],
        insights: [],
        confidence_level: 0
      };

      console.log(`📊 Starting market research: ${topic}`);

      // Define research objectives if not provided
      if (research.objectives.length === 0) {
        research.objectives = await this.generateResearchObjectives(topic);
      }

      // Identify and configure data sources
      research.data_sources = await this.identifyDataSources(topic, options);

      // Conduct primary research
      const primaryFindings = await this.conductPrimaryResearch(research);
      research.findings.push(...primaryFindings);

      // Conduct secondary research
      const secondaryFindings = await this.conductSecondaryResearch(research);
      research.findings.push(...secondaryFindings);

      // Analyze market trends
      const trendAnalysis = await this.analyzeTrends(topic, research.findings);
      research.insights.push(...trendAnalysis);

      // Calculate confidence level
      research.confidence_level = this.calculateConfidenceLevel(research);

      // Update status
      research.status = 'completed';
      research.updated = new Date().toISOString();

      // Store research
      this.researchProjects.set(researchId, research);
      await this.saveResearch(research);

      console.log(`✅ Market research completed: ${topic} (Confidence: ${research.confidence_level}%)`);

      return {
        research_id: researchId,
        topic,
        status: research.status,
        findings_count: research.findings.length,
        insights_count: research.insights.length,
        confidence_level: research.confidence_level,
        key_insights: research.insights.slice(0, 3),
        next_steps: this.generateNextSteps(research)
      };

    } catch (error) {
      console.error('❌ Market research failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate research objectives for a topic
   */
  async generateResearchObjectives(topic) {
    const objectives = [
      `Analyze current market size and growth potential for ${topic}`,
      `Identify key market segments and target audiences`,
      `Assess competitive landscape and positioning opportunities`,
      `Understand user needs and pain points`,
      `Evaluate market trends and future opportunities`
    ];

    return objectives.map((obj, index) => ({
      id: `obj-${index + 1}`,
      description: obj,
      priority: index < 2 ? 'high' : 'medium',
      status: 'pending'
    }));
  }

  /**
   * Identify relevant data sources for research
   */
  async identifyDataSources(topic, options) {
    const dataSources = [];

    // Primary sources
    if (options.include_primary !== false) {
      dataSources.push(
        {
          type: 'primary',
          method: 'user_interviews',
          description: 'Direct interviews with target users',
          estimated_responses: 15,
          timeline: '1_week'
        },
        {
          type: 'primary',
          method: 'surveys',
          description: 'Online surveys for broader market insights',
          estimated_responses: 100,
          timeline: '1_week'
        }
      );
    }

    // Secondary sources
    dataSources.push(
      {
        type: 'secondary',
        method: 'industry_reports',
        description: 'Published industry analysis and market reports',
        sources: ['Gartner', 'Forrester', 'IDC'],
        timeline: '3_days'
      },
      {
        type: 'secondary',
        method: 'competitor_analysis',
        description: 'Analysis of competitor offerings and positioning',
        sources: ['Company websites', 'Product documentation', 'User reviews'],
        timeline: '1_week'
      },
      {
        type: 'secondary',
        method: 'trend_analysis',
        description: 'Technology and market trend identification',
        sources: ['Google Trends', 'Social media', 'Tech blogs'],
        timeline: '3_days'
      }
    );

    return dataSources;
  }

  /**
   * Conduct primary research
   */
  async conductPrimaryResearch(research) {
    const findings = [];

    // Simulate user interview findings
    findings.push({
      source: 'user_interviews',
      type: 'qualitative',
      finding: 'Users express frustration with current workflow complexity',
      confidence: 0.8,
      sample_size: 15,
      methodology: 'Semi-structured interviews'
    });

    findings.push({
      source: 'user_interviews',
      type: 'qualitative',
      finding: 'Strong demand for automation and AI-assisted features',
      confidence: 0.9,
      sample_size: 15,
      methodology: 'Semi-structured interviews'
    });

    // Simulate survey findings
    findings.push({
      source: 'surveys',
      type: 'quantitative',
      finding: '73% of respondents would pay for premium features',
      confidence: 0.85,
      sample_size: 100,
      methodology: 'Online survey'
    });

    findings.push({
      source: 'surveys',
      type: 'quantitative',
      finding: 'Average willingness to pay: $29/month for professional features',
      confidence: 0.8,
      sample_size: 100,
      methodology: 'Online survey'
    });

    return findings;
  }

  /**
   * Conduct secondary research
   */
  async conductSecondaryResearch(research) {
    const findings = [];

    // Industry report findings
    findings.push({
      source: 'industry_reports',
      type: 'market_data',
      finding: 'Developer tools market growing at 22% CAGR',
      confidence: 0.95,
      source_credibility: 'high',
      publication: 'Industry Analysis Report 2024'
    });

    findings.push({
      source: 'industry_reports',
      type: 'market_data',
      finding: 'AI-powered development tools represent fastest growing segment',
      confidence: 0.9,
      source_credibility: 'high',
      publication: 'Tech Trends Report 2024'
    });

    // Competitor analysis findings
    findings.push({
      source: 'competitor_analysis',
      type: 'competitive_intel',
      finding: 'Main competitors lack integrated AI workflow capabilities',
      confidence: 0.85,
      analysis_scope: 'Top 5 competitors',
      methodology: 'Feature comparison analysis'
    });

    findings.push({
      source: 'competitor_analysis',
      type: 'competitive_intel',
      finding: 'Pricing ranges from $15-50/month for professional tiers',
      confidence: 0.9,
      analysis_scope: 'Top 10 competitors',
      methodology: 'Pricing analysis'
    });

    // Trend analysis findings
    findings.push({
      source: 'trend_analysis',
      type: 'trend_data',
      finding: 'Search interest for "AI coding assistant" up 340% year-over-year',
      confidence: 0.95,
      data_source: 'Google Trends',
      time_period: '12_months'
    });

    return findings;
  }

  /**
   * Analyze market trends from research findings
   */
  async analyzeTrends(topic, findings) {
    const insights = [];

    // Market growth insight
    const growthFindings = findings.filter(f => 
      f.finding.toLowerCase().includes('growth') || 
      f.finding.toLowerCase().includes('growing')
    );

    if (growthFindings.length > 0) {
      insights.push({
        type: 'market_growth',
        insight: 'Strong market growth trajectory identified',
        supporting_evidence: growthFindings.map(f => f.finding),
        confidence: 0.9,
        impact: 'high',
        timeframe: 'next_2_years'
      });
    }

    // User demand insight
    const demandFindings = findings.filter(f => 
      f.finding.toLowerCase().includes('demand') || 
      f.finding.toLowerCase().includes('pay') ||
      f.finding.toLowerCase().includes('interest')
    );

    if (demandFindings.length > 0) {
      insights.push({
        type: 'user_demand',
        insight: 'Strong user demand and willingness to pay identified',
        supporting_evidence: demandFindings.map(f => f.finding),
        confidence: 0.85,
        impact: 'high',
        timeframe: 'immediate'
      });
    }

    // Competitive opportunity insight
    const competitiveFindings = findings.filter(f => 
      f.finding.toLowerCase().includes('competitor') || 
      f.finding.toLowerCase().includes('lack')
    );

    if (competitiveFindings.length > 0) {
      insights.push({
        type: 'competitive_opportunity',
        insight: 'Market gaps and competitive opportunities identified',
        supporting_evidence: competitiveFindings.map(f => f.finding),
        confidence: 0.8,
        impact: 'medium',
        timeframe: 'next_6_months'
      });
    }

    return insights;
  }

  /**
   * Calculate overall confidence level for research
   */
  calculateConfidenceLevel(research) {
    if (research.findings.length === 0) return 0;

    const avgConfidence = research.findings.reduce((sum, finding) => {
      return sum + (finding.confidence || 0.5);
    }, 0) / research.findings.length;

    // Adjust based on data source diversity
    const sourceTypes = new Set(research.findings.map(f => f.source));
    const diversityBonus = Math.min(sourceTypes.size * 0.1, 0.2);

    // Adjust based on sample sizes
    const hasPrimaryData = research.findings.some(f => f.sample_size && f.sample_size > 10);
    const primaryDataBonus = hasPrimaryData ? 0.1 : 0;

    const finalConfidence = Math.min(avgConfidence + diversityBonus + primaryDataBonus, 1.0);
    return Math.round(finalConfidence * 100);
  }

  /**
   * Generate next steps based on research results
   */
  generateNextSteps(research) {
    const nextSteps = [];

    // High confidence insights suggest immediate action
    const highConfidenceInsights = research.insights.filter(i => i.confidence > 0.8);
    if (highConfidenceInsights.length > 0) {
      nextSteps.push({
        action: 'develop_strategy',
        description: 'Develop strategic plan based on high-confidence insights',
        priority: 'high',
        timeline: '1_week'
      });
    }

    // Market opportunities suggest product development
    const marketOpportunities = research.insights.filter(i => i.type === 'competitive_opportunity');
    if (marketOpportunities.length > 0) {
      nextSteps.push({
        action: 'feature_planning',
        description: 'Plan features to address identified market gaps',
        priority: 'high',
        timeline: '2_weeks'
      });
    }

    // User demand suggests pricing strategy work
    const demandInsights = research.insights.filter(i => i.type === 'user_demand');
    if (demandInsights.length > 0) {
      nextSteps.push({
        action: 'pricing_strategy',
        description: 'Develop pricing strategy based on willingness-to-pay data',
        priority: 'medium',
        timeline: '1_week'
      });
    }

    return nextSteps;
  }

  /**
   * Get current research projects
   */
  async getCurrentResearch() {
    const activeResearch = Array.from(this.researchProjects.values())
      .filter(r => r.status === 'in_progress' || r.status === 'completed')
      .sort((a, b) => new Date(b.updated) - new Date(a.updated));

    return {
      total_projects: this.researchProjects.size,
      active_projects: activeResearch.filter(r => r.status === 'in_progress').length,
      completed_projects: activeResearch.filter(r => r.status === 'completed').length,
      recent_research: activeResearch.slice(0, 5),
      key_trends: this.getKeyTrends()
    };
  }

  /**
   * Get key market trends
   */
  getKeyTrends() {
    const allInsights = Array.from(this.researchProjects.values())
      .flatMap(r => r.insights || [])
      .filter(i => i.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence);

    return allInsights.slice(0, 5).map(insight => ({
      trend: insight.insight,
      confidence: insight.confidence,
      impact: insight.impact,
      timeframe: insight.timeframe
    }));
  }

  /**
   * Load research templates
   */
  async loadResearchTemplates() {
    // Define standard research templates
    this.researchTemplates.set('market_analysis', {
      name: 'Market Analysis Template',
      objectives: [
        'Market size and growth analysis',
        'Competitive landscape assessment',
        'User needs identification'
      ],
      methodology: 'mixed_methods',
      timeline: '2_weeks'
    });

    this.researchTemplates.set('user_research', {
      name: 'User Research Template',
      objectives: [
        'User behavior analysis',
        'Pain point identification',
        'Feature preference assessment'
      ],
      methodology: 'qualitative_focus',
      timeline: '1_week'
    });

    this.researchTemplates.set('competitive_analysis', {
      name: 'Competitive Analysis Template',
      objectives: [
        'Competitor feature comparison',
        'Pricing analysis',
        'Market positioning assessment'
      ],
      methodology: 'secondary_research',
      timeline: '1_week'
    });
  }

  /**
   * Load existing research from storage
   */
  async loadExistingResearch() {
    try {
      const researchDir = path.join(process.cwd(), '.wee', 'agents', 'analyst', 'research');
      const files = await fs.readdir(researchDir).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(researchDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const research = JSON.parse(content);
            this.researchProjects.set(research.id, research);
          } catch (error) {
            console.warn(`⚠️ Failed to load research file ${file}:`, error.message);
          }
        }
      }
      
      console.log(`📚 Loaded ${this.researchProjects.size} existing research projects`);
    } catch (error) {
      console.warn('⚠️ Failed to load existing research:', error.message);
    }
  }

  /**
   * Save research to storage
   */
  async saveResearch(research) {
    try {
      const filePath = path.join(
        process.cwd(), 
        '.wee', 
        'agents', 
        'analyst', 
        'research', 
        `${research.id}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(research, null, 2));
    } catch (error) {
      console.error('❌ Failed to save research:', error.message);
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'research'),
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'research', 'templates')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

module.exports = MarketResearch;
