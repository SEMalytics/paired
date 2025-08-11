/**
 * Competitive Intelligence Module for Analyst Agent
 * Handles competitor analysis, market positioning, and competitive strategy
 */

const fs = require('fs').promises;
const path = require('path');

class CompetitiveIntelligence {
  constructor(agent) {
    this.agent = agent;
    this.competitorProfiles = new Map();
    this.competitiveAnalyses = new Map();
    this.marketPositioning = new Map();
    this.benchmarkData = new Map();
    
    console.log('🎯 Competitive Intelligence module initializing...');
  }

  /**
   * Initialize the competitive intelligence module
   */
  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      return;
    }
    
    try {
      await this.ensureDirectories();
      await this.loadExistingProfiles();
      await this.initializeBenchmarks();
      this.initialized = true;
      console.log('🎯 Competitive Intelligence module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Competitive Intelligence module:', error.message);
      throw error;
    }
  }

  /**
   * Analyze competitors comprehensively
   */
  async analyzeCompetitors(competitors, focusAreas = ['features', 'pricing', 'positioning']) {
    try {
      const analysisId = `analysis-${Date.now()}`;
      const analysis = {
        id: analysisId,
        competitors: competitors.length > 0 ? competitors : await this.getDefaultCompetitors(),
        focus_areas: focusAreas,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: 'in_progress',
        findings: [],
        insights: [],
        recommendations: []
      };

      console.log(`🎯 Analyzing ${analysis.competitors.length} competitors`);

      // Analyze each competitor
      for (const competitor of analysis.competitors) {
        const competitorAnalysis = await this.analyzeIndividualCompetitor(competitor, focusAreas);
        analysis.findings.push(competitorAnalysis);
      }

      // Generate comparative insights
      analysis.insights = await this.generateCompetitiveInsights(analysis.findings);

      // Generate strategic recommendations
      analysis.recommendations = await this.generateCompetitiveRecommendations(analysis.insights);

      // Update status
      analysis.status = 'completed';
      analysis.updated = new Date().toISOString();

      // Store analysis
      this.competitiveAnalyses.set(analysisId, analysis);
      await this.saveCompetitiveAnalysis(analysis);

      console.log(`✅ Competitive analysis completed: ${analysis.competitors.length} competitors analyzed`);

      return {
        analysis_id: analysisId,
        competitors_analyzed: analysis.competitors.length,
        focus_areas: focusAreas,
        key_insights: analysis.insights.slice(0, 3),
        top_recommendations: analysis.recommendations.slice(0, 3),
        competitive_gaps: this.identifyCompetitiveGaps(analysis.findings),
        market_opportunities: this.identifyMarketOpportunities(analysis.insights)
      };

    } catch (error) {
      console.error('❌ Competitive analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze individual competitor
   */
  async analyzeIndividualCompetitor(competitor, focusAreas) {
    const profile = {
      name: competitor.name || competitor,
      analysis_date: new Date().toISOString(),
      features: {},
      pricing: {},
      positioning: {},
      strengths: [],
      weaknesses: [],
      market_share: {},
      user_sentiment: {}
    };

    // Feature analysis
    if (focusAreas.includes('features')) {
      profile.features = await this.analyzeCompetitorFeatures(competitor);
    }

    // Pricing analysis
    if (focusAreas.includes('pricing')) {
      profile.pricing = await this.analyzeCompetitorPricing(competitor);
    }

    // Positioning analysis
    if (focusAreas.includes('positioning')) {
      profile.positioning = await this.analyzeCompetitorPositioning(competitor);
    }

    // SWOT analysis
    profile.strengths = await this.identifyCompetitorStrengths(competitor, profile);
    profile.weaknesses = await this.identifyCompetitorWeaknesses(competitor, profile);

    // Market presence
    profile.market_share = await this.analyzeMarketShare(competitor);
    profile.user_sentiment = await this.analyzeUserSentiment(competitor);

    // Store competitor profile
    this.competitorProfiles.set(profile.name, profile);
    await this.saveCompetitorProfile(profile);

    return profile;
  }

  /**
   * Analyze competitor features
   */
  async analyzeCompetitorFeatures(competitor) {
    // Simulate feature analysis based on competitor name/type
    const competitorName = competitor.name || competitor;
    
    const features = {
      core_features: [],
      advanced_features: [],
      unique_features: [],
      missing_features: [],
      feature_quality: 'medium'
    };

    // Generate realistic feature analysis based on competitor
    if (competitorName.toLowerCase().includes('github') || competitorName.toLowerCase().includes('copilot')) {
      features.core_features = ['Code completion', 'Code suggestions', 'Documentation generation'];
      features.advanced_features = ['Multi-language support', 'Context awareness', 'Code explanation'];
      features.unique_features = ['GitHub integration', 'Pull request assistance'];
      features.missing_features = ['Advanced refactoring', 'Architecture guidance'];
      features.feature_quality = 'high';
    } else if (competitorName.toLowerCase().includes('cursor') || competitorName.toLowerCase().includes('ai')) {
      features.core_features = ['AI-powered editing', 'Code generation', 'Chat interface'];
      features.advanced_features = ['Codebase understanding', 'Multi-file editing', 'Terminal integration'];
      features.unique_features = ['Composer mode', 'Codebase indexing'];
      features.missing_features = ['Team collaboration', 'Enterprise features'];
      features.feature_quality = 'high';
    } else {
      // Generic competitor analysis
      features.core_features = ['Basic code editing', 'Syntax highlighting', 'File management'];
      features.advanced_features = ['Plugin system', 'Git integration', 'Debugging tools'];
      features.unique_features = ['Custom workflow', 'Specialized language support'];
      features.missing_features = ['AI assistance', 'Advanced automation'];
      features.feature_quality = 'medium';
    }

    return features;
  }

  /**
   * Analyze competitor pricing
   */
  async analyzeCompetitorPricing(competitor) {
    const competitorName = competitor.name || competitor;
    
    const pricing = {
      model: 'freemium',
      tiers: [],
      pricing_strategy: 'competitive',
      value_proposition: 'feature_based'
    };

    // Generate realistic pricing analysis
    if (competitorName.toLowerCase().includes('github')) {
      pricing.tiers = [
        { name: 'Free', price: 0, features: 'Basic AI features' },
        { name: 'Pro', price: 10, features: 'Advanced AI, priority support' },
        { name: 'Enterprise', price: 39, features: 'Team features, admin controls' }
      ];
      pricing.pricing_strategy = 'market_penetration';
    } else if (competitorName.toLowerCase().includes('cursor')) {
      pricing.tiers = [
        { name: 'Free', price: 0, features: 'Limited usage' },
        { name: 'Pro', price: 20, features: 'Unlimited usage, advanced features' }
      ];
      pricing.pricing_strategy = 'value_based';
    } else {
      pricing.tiers = [
        { name: 'Free', price: 0, features: 'Basic features' },
        { name: 'Professional', price: 15, features: 'Advanced features' },
        { name: 'Enterprise', price: 30, features: 'Team and enterprise features' }
      ];
    }

    return pricing;
  }

  /**
   * Analyze competitor positioning
   */
  async analyzeCompetitorPositioning(competitor) {
    const competitorName = competitor.name || competitor;
    
    const positioning = {
      target_market: 'developers',
      value_proposition: '',
      differentiation: [],
      messaging: '',
      brand_perception: 'neutral'
    };

    // Generate positioning analysis
    if (competitorName.toLowerCase().includes('github')) {
      positioning.value_proposition = 'Integrated AI coding assistant within familiar GitHub ecosystem';
      positioning.differentiation = ['GitHub integration', 'Microsoft backing', 'Large user base'];
      positioning.messaging = 'Your AI pair programmer';
      positioning.brand_perception = 'trusted';
    } else if (competitorName.toLowerCase().includes('cursor')) {
      positioning.value_proposition = 'AI-first code editor built for the future of programming';
      positioning.differentiation = ['AI-native design', 'Codebase understanding', 'Modern UX'];
      positioning.messaging = 'The AI Code Editor';
      positioning.brand_perception = 'innovative';
    } else {
      positioning.value_proposition = 'Reliable development tools for professional developers';
      positioning.differentiation = ['Stability', 'Performance', 'Customization'];
      positioning.messaging = 'Professional development environment';
    }

    return positioning;
  }

  /**
   * Identify competitor strengths
   */
  async identifyCompetitorStrengths(competitor, profile) {
    const strengths = [];

    // Analyze based on features
    if (profile.features && profile.features.feature_quality === 'high') {
      strengths.push('Strong feature set and quality');
    }
    if (profile.features && profile.features.unique_features && profile.features.unique_features.length > 0) {
      strengths.push('Unique differentiating features');
    }

    // Analyze based on pricing
    if (profile.pricing && profile.pricing.tiers && profile.pricing.tiers.some(tier => tier.price === 0)) {
      strengths.push('Attractive free tier offering');
    }
    if (profile.pricing && profile.pricing.pricing_strategy === 'competitive') {
      strengths.push('Competitive pricing strategy');
    }

    // Analyze based on positioning
    if (profile.positioning && profile.positioning.brand_perception === 'trusted') {
      strengths.push('Strong brand trust and recognition');
    }
    if (profile.positioning && profile.positioning.differentiation && profile.positioning.differentiation.length > 2) {
      strengths.push('Clear market differentiation');
    }

    return strengths;
  }

  /**
   * Identify competitor weaknesses
   */
  async identifyCompetitorWeaknesses(competitor, profile) {
    const weaknesses = [];

    // Analyze based on features
    if (profile.features && profile.features.missing_features && profile.features.missing_features.length > 2) {
      weaknesses.push('Significant feature gaps identified');
    }
    if (profile.features && profile.features.feature_quality === 'medium') {
      weaknesses.push('Room for feature quality improvement');
    }

    // Analyze based on pricing
    if (profile.pricing && profile.pricing.tiers && profile.pricing.tiers.length < 2) {
      weaknesses.push('Limited pricing options');
    }

    // Analyze based on positioning
    if (profile.positioning && profile.positioning.differentiation && profile.positioning.differentiation.length < 2) {
      weaknesses.push('Unclear market differentiation');
    }

    return weaknesses;
  }

  /**
   * Analyze market share
   */
  async analyzeMarketShare(competitor) {
    // Simulate market share analysis
    return {
      estimated_share: Math.random() * 20 + 5, // 5-25%
      growth_trend: ['growing', 'stable', 'declining'][Math.floor(Math.random() * 3)],
      user_base_size: 'medium',
      geographic_presence: 'global'
    };
  }

  /**
   * Analyze user sentiment
   */
  async analyzeUserSentiment(competitor) {
    return {
      overall_sentiment: ['positive', 'neutral', 'mixed'][Math.floor(Math.random() * 3)],
      satisfaction_score: Math.random() * 40 + 60, // 60-100%
      common_complaints: ['Performance issues', 'Learning curve', 'Limited features'],
      common_praise: ['Easy to use', 'Good support', 'Regular updates'],
      review_sources: ['App stores', 'Review sites', 'Social media']
    };
  }

  /**
   * Generate competitive insights
   */
  async generateCompetitiveInsights(findings) {
    const insights = [];

    // Market gap analysis
    const allMissingFeatures = findings.flatMap(f => f.features.missing_features || []);
    const commonGaps = this.findCommonElements(allMissingFeatures);
    
    if (commonGaps.length > 0) {
      insights.push({
        type: 'market_gap',
        insight: `Common feature gaps identified across competitors: ${commonGaps.slice(0, 3).join(', ')}`,
        opportunity: 'high',
        confidence: 0.8,
        impact: 'high'
      });
    }

    // Pricing opportunity analysis
    const pricingTiers = findings.flatMap(f => f.pricing.tiers || []);
    const avgPrice = pricingTiers.reduce((sum, tier) => sum + tier.price, 0) / pricingTiers.length;
    
    insights.push({
      type: 'pricing_opportunity',
      insight: `Average competitor pricing: $${avgPrice.toFixed(2)}/month`,
      opportunity: avgPrice > 25 ? 'undercut_pricing' : 'premium_positioning',
      confidence: 0.7,
      impact: 'medium'
    });

    // Positioning opportunity
    const positioningStrategies = findings.map(f => f.positioning.value_proposition);
    const uniquePositions = new Set(positioningStrategies);
    
    if (uniquePositions.size < findings.length) {
      insights.push({
        type: 'positioning_opportunity',
        insight: 'Similar positioning strategies among competitors create differentiation opportunity',
        opportunity: 'unique_positioning',
        confidence: 0.75,
        impact: 'high'
      });
    }

    return insights;
  }

  /**
   * Generate competitive recommendations
   */
  async generateCompetitiveRecommendations(insights) {
    const recommendations = [];

    for (const insight of insights) {
      switch (insight.type) {
        case 'market_gap':
          recommendations.push({
            category: 'product_development',
            recommendation: 'Develop features to fill identified market gaps',
            priority: 'high',
            timeline: '3-6 months',
            expected_impact: 'competitive_advantage',
            confidence: insight.confidence
          });
          break;

        case 'pricing_opportunity':
          recommendations.push({
            category: 'pricing_strategy',
            recommendation: insight.opportunity === 'undercut_pricing' 
              ? 'Consider competitive pricing strategy' 
              : 'Position as premium solution',
            priority: 'medium',
            timeline: '1-2 months',
            expected_impact: 'market_share_growth',
            confidence: insight.confidence
          });
          break;

        case 'positioning_opportunity':
          recommendations.push({
            category: 'marketing_strategy',
            recommendation: 'Develop unique market positioning to differentiate from competitors',
            priority: 'high',
            timeline: '2-3 months',
            expected_impact: 'brand_differentiation',
            confidence: insight.confidence
          });
          break;
      }
    }

    return recommendations;
  }

  /**
   * Identify competitive gaps
   */
  identifyCompetitiveGaps(findings) {
    const gaps = [];
    
    // Feature gaps
    const allMissingFeatures = findings.flatMap(f => f.features.missing_features || []);
    const commonMissingFeatures = this.findCommonElements(allMissingFeatures);
    
    gaps.push(...commonMissingFeatures.map(feature => ({
      type: 'feature_gap',
      description: feature,
      opportunity_level: 'high'
    })));

    // Service gaps
    const weaknesses = findings.flatMap(f => f.weaknesses || []);
    const commonWeaknesses = this.findCommonElements(weaknesses);
    
    gaps.push(...commonWeaknesses.map(weakness => ({
      type: 'service_gap',
      description: weakness,
      opportunity_level: 'medium'
    })));

    return gaps.slice(0, 5); // Top 5 gaps
  }

  /**
   * Identify market opportunities
   */
  identifyMarketOpportunities(insights) {
    return insights
      .filter(insight => insight.opportunity && insight.confidence > 0.7)
      .map(insight => ({
        opportunity: insight.opportunity,
        description: insight.insight,
        confidence: insight.confidence,
        impact: insight.impact
      }))
      .slice(0, 3); // Top 3 opportunities
  }

  /**
   * Get competitor profiles
   */
  async getCompetitorProfiles() {
    const profiles = Array.from(this.competitorProfiles.values());
    
    return {
      total_competitors: profiles.length,
      recent_analyses: profiles
        .sort((a, b) => new Date(b.analysis_date) - new Date(a.analysis_date))
        .slice(0, 5),
      competitive_landscape: this.summarizeCompetitiveLandscape(profiles)
    };
  }

  /**
   * Summarize competitive landscape
   */
  summarizeCompetitiveLandscape(profiles) {
    if (profiles.length === 0) return {};

    const avgPricing = profiles
      .flatMap(p => p.pricing.tiers || [])
      .reduce((sum, tier, _, arr) => sum + tier.price / arr.length, 0);

    const commonFeatures = this.findCommonElements(
      profiles.flatMap(p => p.features.core_features || [])
    );

    const marketLeaders = profiles
      .filter(p => p.market_share && p.market_share.estimated_share > 15)
      .map(p => p.name);

    return {
      market_maturity: profiles.length > 5 ? 'mature' : 'emerging',
      average_pricing: Math.round(avgPricing),
      common_features: commonFeatures.slice(0, 5),
      market_leaders: marketLeaders,
      differentiation_level: commonFeatures.length > 10 ? 'low' : 'high'
    };
  }

  /**
   * Get default competitors for analysis
   */
  async getDefaultCompetitors() {
    return [
      { name: 'GitHub Copilot', category: 'ai_assistant' },
      { name: 'Cursor', category: 'ai_editor' },
      { name: 'Tabnine', category: 'ai_assistant' },
      { name: 'Replit', category: 'cloud_ide' },
      { name: 'CodeWhisperer', category: 'ai_assistant' }
    ];
  }

  /**
   * Find common elements in arrays
   */
  findCommonElements(arrays) {
    if (arrays.length === 0) return [];
    
    const elementCounts = {};
    arrays.forEach(element => {
      elementCounts[element] = (elementCounts[element] || 0) + 1;
    });

    return Object.entries(elementCounts)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .map(([element, _]) => element);
  }

  /**
   * Save competitor profile
   */
  async saveCompetitorProfile(profile) {
    try {
      const filePath = path.join(
        process.cwd(),
        '.wee',
        'agents',
        'analyst',
        'competitive',
        `${profile.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error('❌ Failed to save competitor profile:', error.message);
    }
  }

  /**
   * Save competitive analysis
   */
  async saveCompetitiveAnalysis(analysis) {
    try {
      const filePath = path.join(
        process.cwd(),
        '.wee',
        'agents',
        'analyst',
        'competitive',
        `${analysis.id}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
    } catch (error) {
      console.error('❌ Failed to save competitive analysis:', error.message);
    }
  }

  /**
   * Load existing competitor profiles
   */
  async loadExistingProfiles() {
    try {
      const competitiveDir = path.join(process.cwd(), '.wee', 'agents', 'analyst', 'competitive');
      const files = await fs.readdir(competitiveDir).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('analysis-')) {
          try {
            const filePath = path.join(competitiveDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const profile = JSON.parse(content);
            this.competitorProfiles.set(profile.name, profile);
          } catch (error) {
            console.warn(`⚠️ Failed to load competitor profile ${file}:`, error.message);
          }
        }
      }
      
      console.log(`📚 Loaded ${this.competitorProfiles.size} competitor profiles`);
    } catch (error) {
      console.warn('⚠️ Failed to load existing profiles:', error.message);
    }
  }

  /**
   * Initialize benchmark data
   */
  async initializeBenchmarks() {
    // Set up industry benchmarks
    this.benchmarkData.set('pricing', {
      free_tier_adoption: 0.7,
      average_pro_price: 25,
      enterprise_premium: 2.5
    });

    this.benchmarkData.set('features', {
      core_features_expected: 10,
      advanced_features_threshold: 5,
      unique_features_advantage: 3
    });

    this.benchmarkData.set('market', {
      market_leader_threshold: 0.2,
      growth_rate_healthy: 0.15,
      satisfaction_benchmark: 0.75
    });
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'competitive'),
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'competitive', 'profiles'),
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'competitive', 'analyses')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

module.exports = CompetitiveIntelligence;
