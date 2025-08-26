const fs = require('fs').promises;
const path = require('path');

/**
 * Data Analysis Module for Analyst Agent
 * Handles metrics analysis, trend identification, and data-driven insights
 */
class DataAnalysis {
  constructor(agent) {
    this.agent = agent;
    this.dataSources = new Map();
    this.analyses = new Map();
    this.metrics = new Map();
    this.trends = new Map();

    console.log('📈 Data Analysis module initializing...');
  }

  /**
   * Initialize the data analysis module
   */
  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      return;
    }

    try {
      await this.ensureDirectories();
      await this.loadExistingAnalyses();
      await this.initializeDataSources();
      this.initialized = true;
      console.log('📈 Data Analysis module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Data Analysis module:', error.message);
      throw error;
    }
  }

  /**
   * Analyze metrics and generate insights
   */
  async analyzeMetrics(dataSources = [], analysisType = 'trend_analysis') {
    try {
      const analysisId = `analysis-${Date.now()}`;
      const analysis = {
        id: analysisId,
        type: analysisType,
        data_sources: dataSources.length > 0 ? dataSources : await this.getDefaultDataSources(),
        created: new Date().toISOString(),
        status: 'in_progress',
        metrics_analyzed: [],
        insights: [],
        recommendations: []
      };

      console.log(`📈 Starting ${analysisType} analysis`);

      // Process data sources
      const processedData = await this.processDataSources(analysis.data_sources);
      analysis.metrics_analyzed = processedData.metrics;

      // Generate insights based on analysis type
      analysis.insights = await this.generateInsights(processedData, analysisType);
      analysis.recommendations = await this.generateRecommendations(analysis.insights);

      analysis.status = 'completed';
      this.analyses.set(analysisId, analysis);
      await this.saveAnalysis(analysis);

      console.log(`✅ Data analysis completed: ${analysis.insights.length} insights generated`);

      return {
        analysis_id: analysisId,
        analysis_type: analysisType,
        metrics_analyzed: analysis.metrics_analyzed.length,
        insights_generated: analysis.insights.length,
        key_insights: analysis.insights.slice(0, 3),
        top_recommendations: analysis.recommendations.slice(0, 3),
        confidence_score: this.calculateConfidence(analysis)
      };

    } catch (error) {
      console.error('❌ Data analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Process data from sources
   */
  async processDataSources(dataSources) {
    const metrics = [];

    for (const source of dataSources) {
      const sourceMetrics = await this.extractMetrics(source);
      metrics.push(...sourceMetrics);
    }

    return { metrics };
  }

  /**
   * Extract metrics from source
   */
  async extractMetrics(source) {
    const sourceType = source.type || 'generic';

    // Generate sample metrics based on source type
    switch (sourceType) {
    case 'user_analytics':
      return [
        { name: 'daily_active_users', value: 850, trend: 'increasing', confidence: 0.9 },
        { name: 'session_duration', value: 12.5, trend: 'stable', confidence: 0.8 }
      ];
    case 'performance_metrics':
      return [
        { name: 'response_time', value: 245, trend: 'decreasing', confidence: 0.85 },
        { name: 'cpu_usage', value: 65, trend: 'stable', confidence: 0.9 }
      ];
    case 'business_metrics':
      return [
        { name: 'monthly_revenue', value: 45000, trend: 'increasing', confidence: 0.95 },
        { name: 'customer_acquisition', value: 75, trend: 'increasing', confidence: 0.8 }
      ];
    default:
      return [
        { name: 'generic_metric', value: 100, trend: 'stable', confidence: 0.7 }
      ];
    }
  }

  /**
   * Generate insights from processed data
   */
  async generateInsights(processedData, analysisType) {
    const insights = [];

    for (const metric of processedData.metrics) {
      if (metric.trend === 'increasing' && metric.confidence > 0.8) {
        insights.push({
          type: 'positive_trend',
          metric: metric.name,
          description: `${metric.name} showing strong positive trend`,
          confidence: metric.confidence,
          impact: 'high'
        });
      } else if (metric.trend === 'decreasing' && metric.name.includes('response_time')) {
        insights.push({
          type: 'performance_improvement',
          metric: metric.name,
          description: `Performance improvement detected in ${metric.name}`,
          confidence: metric.confidence,
          impact: 'medium'
        });
      } else if (metric.value > 1000 && metric.name.includes('response_time')) {
        insights.push({
          type: 'performance_issue',
          metric: metric.name,
          description: `High response time detected: ${metric.value}ms`,
          confidence: 0.9,
          impact: 'high'
        });
      }
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(insights) {
    const recommendations = [];

    for (const insight of insights) {
      switch (insight.type) {
      case 'positive_trend':
        recommendations.push({
          category: 'optimization',
          priority: 'medium',
          recommendation: `Continue monitoring and maintain factors driving ${insight.metric} growth`,
          timeline: '2-4 weeks'
        });
        break;
      case 'performance_issue':
        recommendations.push({
          category: 'performance',
          priority: 'high',
          recommendation: `Address performance bottleneck in ${insight.metric}`,
          timeline: 'immediate'
        });
        break;
      case 'performance_improvement':
        recommendations.push({
          category: 'validation',
          priority: 'low',
          recommendation: `Document and replicate performance improvements in ${insight.metric}`,
          timeline: '1-2 weeks'
        });
        break;
      }
    }

    return recommendations;
  }

  /**
   * Calculate analysis confidence
   */
  calculateConfidence(analysis) {
    if (analysis.insights.length === 0) return 50;

    const avgConfidence = analysis.insights.reduce((sum, insight) =>
      sum + (insight.confidence || 0.5), 0) / analysis.insights.length;

    return Math.round(avgConfidence * 100);
  }

  /**
   * Get latest analysis
   */
  async getLatestAnalysis() {
    const analyses = Array.from(this.analyses.values())
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    return {
      total_analyses: this.analyses.size,
      recent_analyses: analyses.slice(0, 5),
      key_metrics: this.getKeyMetrics()
    };
  }

  /**
   * Get key metrics
   */
  getKeyMetrics() {
    return [
      { name: 'user_engagement', value: 85, trend: 'increasing' },
      { name: 'system_performance', value: 92, trend: 'stable' },
      { name: 'business_growth', value: 78, trend: 'increasing' }
    ];
  }

  /**
   * Get default data sources
   */
  async getDefaultDataSources() {
    return [
      { name: 'User Analytics', type: 'user_analytics' },
      { name: 'Performance Metrics', type: 'performance_metrics' },
      { name: 'Business Metrics', type: 'business_metrics' }
    ];
  }

  /**
   * Save analysis
   */
  async saveAnalysis(analysis) {
    try {
      const filePath = path.join(
        process.cwd(),
        '.windsurf',
        'agents',
        'analyst',
        'data_analysis',
        `${analysis.id}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
    } catch (error) {
      console.error('❌ Failed to save analysis:', error.message);
    }
  }

  /**
   * Load existing analyses
   */
  async loadExistingAnalyses() {
    try {
      const analysisDir = path.join(process.cwd(), '.windsurf', 'agents', 'analyst', 'data_analysis');
      const files = await fs.readdir(analysisDir).catch(() => []);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(analysisDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const analysis = JSON.parse(content);
            this.analyses.set(analysis.id, analysis);
          } catch (error) {
            console.warn(`⚠️ Failed to load analysis file ${file}:`, error.message);
          }
        }
      }

      console.log(`📚 Loaded ${this.analyses.size} existing analyses`);
    } catch (error) {
      console.warn('⚠️ Failed to load existing analyses:', error.message);
    }
  }

  /**
   * Initialize data sources
   */
  async initializeDataSources() {
    const defaultSources = await this.getDefaultDataSources();
    for (const source of defaultSources) {
      this.dataSources.set(source.name, source);
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), '.windsurf', 'agents', 'analyst', 'data_analysis'),
      path.join(process.cwd(), '.windsurf', 'agents', 'analyst', 'data_analysis', 'reports')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

module.exports = DataAnalysis;
