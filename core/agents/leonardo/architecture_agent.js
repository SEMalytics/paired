/**
 * Architecture Agent (Leonardo - da Vinci) - Master System Architect
 *
 * Named after Leonardo da Vinci, the Renaissance genius who designed everything
 * from flying machines to architectural marvels. Like Leonardo's visionary blueprints
 * that were centuries ahead of their time, Leonardo the agent creates system
 * architectures that are both beautiful and functionally superior.
 *
 * Philosophy: "Structure Through Visionary Design"
 * - Analyzes and improves system architecture with artistic precision
 * - Identifies and recommends design patterns like Leonardo's engineering sketches
 * - Ensures scalability and maintainability through timeless design principles
 * - Provides architectural guidance with Renaissance-level innovation
 *
 * Reasoning for Name: Leonardo da Vinci was the ultimate architect and engineer,
 * combining artistic vision with technical mastery. He designed complex systems
 * (machines, buildings, cities) that were both functional and elegant - exactly
 * what we need in a system architecture agent. His ability to see the big picture
 * while perfecting every detail mirrors ideal architectural thinking.
 */

const BaseAgent = require('../base_agent');
const ADRManager = require('./modules/adr_manager');
const PatternCatalog = require('./modules/pattern_catalog');
const TechDebtTracker = require('./modules/tech_debt_tracker');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class ArchitectureAgent extends BaseAgent {
  constructor(orchestrator, config) {
    super(orchestrator, config);

    // Agent-specific properties
    this.agentType = 'architecture';
    this.capabilities = [
      'system_architecture',
      'architectural_patterns',
      'technical_decisions',
      'quality_attributes',
      'architectural_governance',
      'technical_debt_management',
      'system_design',
      'architectural_compliance'
    ];

    // Core modules (initialized in initializeAgentSystems)
    this.adrManager = null;
    this.patternCatalog = null;
    this.techDebtTracker = null;

    // Agent state
    this.activeADRs = new Map();
    this.detectedPatterns = new Map();
    this.debtItems = new Map();

    console.log(`🏢 Architecture Agent Leonardo (${this.name}) initializing...`);
  }

  /**
   * Initialize Architecture-specific systems
   */
  async initializeAgentSystems() {
    try {
      console.log(`🏢 Architecture config loaded for ${this.name}`);

      // Load Architecture configuration
      await this.loadArchitectureConfiguration();

      // Load unified coding standards for architectural decisions
      await this.loadCodingStandards();

      // Initialize core modules
      this.adrManager = new ADRManager(this);
      await this.adrManager.initialize();

      this.patternCatalog = new PatternCatalog(this);
      await this.patternCatalog.initialize();

      this.techDebtTracker = new TechDebtTracker(this);
      await this.techDebtTracker.initialize();

      // Ensure Architecture directories exist
      await this.ensureArchitectureDirectories();

      console.log(`🏢 Architecture systems initialized for ${this.name}`);

    } catch (error) {
      console.error(`❌ Failed to initialize Architecture agent systems: ${error.message}`);
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Ensure Architecture agent directories exist
   */
  async ensureArchitectureDirectories() {
    const dirs = [
      path.join(process.cwd(), 'data', 'architecture_agent'),
      path.join(process.cwd(), 'data', 'architecture_agent', 'adrs'),
      path.join(process.cwd(), 'data', 'architecture_agent', 'patterns'),
      path.join(process.cwd(), 'data', 'architecture_agent', 'debt')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load Architecture-specific configuration
   */
  async loadArchitectureConfiguration() {
    try {
      const projectRoot = this.config?.projectRoot || process.cwd();
      const configPath = path.join(projectRoot, 'config/agents/architecture_agent_config.yml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.architectureConfig = yaml.load(configContent);

      // Set up architecture-specific parameters
      this.architecturalPrinciples = this.architectureConfig.architectural_principles || {};
      this.designPatterns = this.architectureConfig.design_patterns || {};
      this.qualityAttributes = this.architectureConfig.quality_attributes || {};

    } catch (error) {
      console.warn(`⚠️ Could not load Architecture configuration: ${error.message}`);
      // Use default configuration
      this.architectureConfig = this.getDefaultArchitectureConfig();
    }
  }

  /**
   * Load unified coding standards for architectural decisions
   */
  async loadCodingStandards() {
    try {
      const standardsPath = path.join(process.cwd(), '.paired', 'config', 'agent_coding_standards.json');
      const standardsData = await fs.readFile(standardsPath, 'utf8');
      this.codingStandards = JSON.parse(standardsData);
      console.log(`🏛️ Leonardo loaded unified coding standards for ${this.codingStandards.project_type || 'project'}`);
    } catch (error) {
      console.log(`🏛️ Leonardo: No unified coding standards found, using architectural defaults`);
      this.codingStandards = null;
    }
  }

  /**
   * Get coding standards for architectural decisions
   */
  getCodingStandards() {
    return this.codingStandards || {
      universal: {
        naming_conventions: 'PascalCase for classes, camelCase for methods',
        architecture_patterns: 'SOLID principles, clean architecture',
        documentation: 'Comprehensive ADRs and design documentation'
      }
    };
  }

  /**
   * Get default Architecture configuration
   */
  getDefaultArchitectureConfig() {
    return {
      architectural_principles: {
        separation_of_concerns: true,
        single_responsibility: true,
        dependency_inversion: true,
        open_closed: true
      },
      design_patterns: {
        mvc: true,
        repository: true,
        factory: true,
        observer: true
      },
      quality_attributes: {
        scalability: 8,
        maintainability: 9,
        performance: 7,
        security: 9
      }
    };
  }

  /**
   * Execute Architecture task via Windsurf
   */
  async executeTask(task, context = {}) {
    try {
      console.log('🏗️ Architecture Agent executing architectural task via Windsurf');

      // Analyze task for architectural requirements
      const analysis = await this.expertise.analyze(task, context);

      // Execute Architecture-specific logic
      const result = await this.performArchitectureTask(task, analysis, context);

      // Post-process and update tracking
      const finalResult = await this.expertise.postProcess(result, analysis, context);

      // Update architectural tracking
      await this.updateArchitectureTracking(finalResult, analysis, context);

      return finalResult;

    } catch (error) {
      console.error('❌ Architecture Agent task execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Perform Architecture-specific task logic
   */
  async performArchitectureTask(task, analysis, context) {
    const taskType = analysis.taskType || 'general_architecture';

    switch (taskType) {
    case 'adr_creation':
      return await this.createADR(task, analysis, context);

    case 'architecture_review':
      return await this.performArchitectureReview(task, analysis, context);

    case 'pattern_analysis':
      return await this.analyzePatterns(task, analysis, context);

    case 'tech_debt_assessment':
      return await this.assessTechDebt(task, analysis, context);

    case 'system_design':
      return await this.designSystem(task, analysis, context);

    case 'compliance_check':
      return await this.checkCompliance(task, analysis, context);

    case 'refactoring_plan':
      return await this.createRefactoringPlan(task, analysis, context);

    default:
      return await this.performGeneralArchitecture(task, analysis, context);
    }
  }

  /**
   * Create Architecture Decision Record
   */
  async createADR(task, analysis, context) {
    console.log('📋 Creating Architecture Decision Record...');

    const adrResult = {
      type: 'adr_creation',
      timestamp: new Date().toISOString(),
      adr_id: null,
      title: '',
      status: 'Proposed',
      stakeholders: []
    };

    // Use modular ADR manager
    const adrData = {
      title: context.title || analysis.decision_title || 'New Architecture Decision',
      context: context.context || analysis.context || 'Architecture decision context',
      decision: context.decision || analysis.decision || 'Architecture decision details',
      consequences: context.consequences || analysis.consequences || 'Decision consequences',
      alternatives: context.alternatives || [],
      stakeholders: context.stakeholders || ['Development Team', 'Architecture Team']
    };

    const adr = await this.adrManager.createADR(adrData);
    adrResult.adr_id = adr.id;
    adrResult.title = adr.title;
    adrResult.stakeholders = adr.stakeholders;

    return adrResult;
  }

  /**
   * Perform architecture review
   */
  async performArchitectureReview(task, analysis, context) {
    console.log('🔍 Performing architecture review...');

    const reviewResult = {
      type: 'architecture_review',
      timestamp: new Date().toISOString(),
      scope: analysis.reviewScope || 'system',
      findings: [],
      recommendations: [],
      compliance_score: 0,
      quality_attributes: {}
    };

    // Analyze architectural compliance
    const complianceAnalysis = await this.architectureState.analyzeCompliance(context);
    reviewResult.compliance_score = complianceAnalysis.score;
    reviewResult.findings = complianceAnalysis.findings;

    // Evaluate quality attributes
    reviewResult.quality_attributes = await this.architectureState.evaluateQualityAttributes(context);

    // Generate recommendations
    reviewResult.recommendations = await this.architectureState.generateRecommendations(
      reviewResult.findings,
      reviewResult.quality_attributes
    );

    return reviewResult;
  }

  /**
   * Analyze architectural patterns
   */
  async analyzePatterns(task, analysis, context) {
    console.log('🔍 Analyzing architectural patterns...');

    const patternResult = {
      type: 'pattern_analysis',
      timestamp: new Date().toISOString(),
      patterns_detected: [],
      violations: [],
      opportunities: [],
      health_score: 0
    };

    // Use modular pattern catalog
    patternResult.patterns_detected = await this.patternCatalog.detectPatterns(context);
    patternResult.violations = await this.patternCatalog.findViolations(context);
    patternResult.opportunities = await this.patternCatalog.identifyOpportunities(context);

    const healthScore = await this.patternCatalog.calculateHealthScore();
    patternResult.health_score = healthScore.overall_score;

    return patternResult;
  }

  /**
   * Assess technical debt
   */
  async assessTechnicalDebt(task, analysis, context) {
    console.log('📊 Assessing technical debt...');

    const debtResult = {
      type: 'debt_assessment',
      timestamp: new Date().toISOString(),
      debt_items: [],
      total_debt: {},
      remediation_plan: {}
    };

    // Use modular tech debt tracker
    debtResult.debt_items = await this.techDebtTracker.identifyDebtItems(context);
    debtResult.total_debt = await this.techDebtTracker.calculateTotalDebt();
    debtResult.remediation_plan = await this.techDebtTracker.createRemediationPlan();

    return debtResult;
  }

  /**
   * Design system architecture
   */
  async designSystem(task, analysis, context) {
    console.log('🏛️ Designing system architecture...');

    const designResult = {
      type: 'system_design',
      timestamp: new Date().toISOString(),
      architecture_type: analysis.architectureType || 'layered',
      components: [],
      relationships: [],
      quality_attributes: {},
      design_decisions: []
    };

    // Identify system components
    designResult.components = await this.architectureState.identifyComponents(context);

    // Define component relationships
    designResult.relationships = await this.architectureState.defineRelationships(designResult.components);

    // Set quality attribute targets
    designResult.quality_attributes = this.qualityAttributes;

    // Document design decisions
    designResult.design_decisions = await this.architectureState.documentDesignDecisions(
      designResult.components,
      designResult.relationships,
      analysis
    );

    return designResult;
  }

  /**
   * Check architectural compliance
   */
  async checkCompliance(task, analysis, context) {
    console.log('✅ Checking architectural compliance...');

    const complianceResult = {
      type: 'compliance_check',
      timestamp: new Date().toISOString(),
      compliance_score: 0,
      violations: [],
      recommendations: []
    };

    // Use modular components for compliance checking
    const patternViolations = await this.patternCatalog.findViolations(context);
    const debtItems = await this.techDebtTracker.identifyDebtItems(context);

    // Calculate compliance score based on violations and debt
    const totalViolations = patternViolations.length;
    const criticalDebt = debtItems.filter(item => item.severity === 'critical' || item.severity === 'high').length;

    complianceResult.compliance_score = Math.max(0, 100 - (totalViolations * 10) - (criticalDebt * 15));
    complianceResult.violations = [...patternViolations, ...debtItems.filter(item => item.severity === 'high' || item.severity === 'critical')];
    complianceResult.recommendations = this.generateComplianceRecommendations(complianceResult.violations);

    return complianceResult;
  }

  /**
   * Generate compliance recommendations based on violations
   */
  generateComplianceRecommendations(violations) {
    const recommendations = [];

    violations.forEach(violation => {
      switch (violation.type) {
      case 'MVC Violation':
        recommendations.push('Refactor to separate business logic from view layer');
        break;
      case 'Singleton Overuse':
        recommendations.push('Consider dependency injection instead of multiple singletons');
        break;
      case 'Repository Pattern Violation':
        recommendations.push('Implement repository pattern for data access');
        break;
      case 'God Object':
        recommendations.push('Break down large classes into smaller, focused components');
        break;
      case 'Spaghetti Code':
        recommendations.push('Refactor complex control flow to improve readability');
        break;
      default:
        if (violation.recommendation) {
          recommendations.push(violation.recommendation);
        }
      }
    });

    // Add general recommendations if many violations
    if (violations.length > 5) {
      recommendations.push('Consider comprehensive architectural review');
      recommendations.push('Implement automated compliance checking in CI/CD');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Create refactoring plan
   */
  async createRefactoringPlan(task, analysis, context) {
    console.log('🔧 Creating refactoring plan...');

    const refactoringResult = {
      type: 'refactoring_plan',
      timestamp: new Date().toISOString(),
      refactoring_targets: [],
      refactoring_steps: [],
      impact_assessment: {},
      timeline: {}
    };

    // Identify refactoring targets
    refactoringResult.refactoring_targets = await this.architectureState.identifyRefactoringTargets(context);

    // Create refactoring steps
    refactoringResult.refactoring_steps = await this.architectureState.createRefactoringSteps(
      refactoringResult.refactoring_targets
    );

    // Assess impact
    refactoringResult.impact_assessment = await this.architectureState.assessRefactoringImpact(
      refactoringResult.refactoring_steps
    );

    // Create timeline
    refactoringResult.timeline = await this.architectureState.createRefactoringTimeline(
      refactoringResult.refactoring_steps
    );

    return refactoringResult;
  }

  /**
   * Perform general architecture task
   */
  async performGeneralArchitecture(task, analysis, context) {
    console.log('🔧 Performing general architecture task...');

    return {
      type: 'general_architecture',
      timestamp: new Date().toISOString(),
      task: task,
      analysis: analysis,
      status: 'completed',
      recommendations: ['Consider more specific architecture task type for better results']
    };
  }

  /**
   * Update architecture tracking
   */
  async updateArchitectureTracking(result, analysis, context) {
    try {
      // Update modular component tracking
      if (result.type === 'adr_creation') {
        await this.adrManager.updateTracking(result);
      }

      if (result.type === 'pattern_analysis') {
        await this.patternCatalog.updateTracking(result);
      }

      if (result.type === 'debt_assessment') {
        await this.techDebtTracker.updateTracking(result);
      }

    } catch (error) {
      console.warn(`⚠️ Failed to update architecture tracking: ${error.message}`);
    }
  }

  /**
   * Get Architecture status
   */
  async getStatus() {
    return {
      agent: 'Architecture Agent',
      name: this.name,
      status: 'active',
      expertise: this.expertise.getStatus(),
      adr_status: await this.adrManager.getStatus(),
      pattern_status: await this.patternCatalog.getStatus(),
      debt_status: await this.techDebtTracker.getStatus()
    };
  }
}

/**
 * Architecture-specific expertise system
 */
class ArchitectureExpertise {
  constructor(agent) {
    this.agent = agent;
    this.expertiseAreas = [
      'system_architecture',
      'architectural_patterns',
      'technical_decisions',
      'quality_attributes',
      'architectural_governance',
      'technical_debt_management',
      'system_design',
      'architectural_compliance'
    ];
  }

  /**
   * Get Architecture context for task analysis
   */
  async getContext(context) {
    return {
      ...context,
      architectural_principles: this.agent.architecturalPrinciples,
      design_patterns: this.agent.designPatterns,
      quality_attributes: this.agent.qualityAttributes,
      current_architecture: await this.agent.architectureState.getCurrentArchitecture()
    };
  }

  /**
   * Analyze task for architectural requirements
   */
  async analyze(request, context) {
    const archContext = await this.getContext(context);

    const analysis = {
      taskType: this.determineArchitectureTaskType(request, archContext),
      complexity: this.assessArchitecturalComplexity(request, archContext),
      impact: this.assessArchitecturalImpact(request, archContext),
      qualityAttributes: this.assessQualityAttributeImpact(request, archContext),
      stakeholders: this.identifyStakeholders(request, archContext),
      recommendations: []
    };

    // Add specific recommendations based on analysis
    analysis.recommendations = this.generateArchitecturalRecommendations(analysis, archContext);

    return analysis;
  }

  /**
   * Post-process Architecture results
   */
  async postProcess(result, analysis, context) {
    // Add architectural impact assessment
    result.architectural_impact = analysis.impact;
    result.complexity_score = analysis.complexity;

    // Add quality attribute implications
    result.quality_implications = analysis.qualityAttributes;

    // Add stakeholder considerations
    result.stakeholder_impact = analysis.stakeholders;

    // Add follow-up architectural actions
    result.follow_up_actions = this.generateFollowUpActions(result, analysis);

    return result;
  }

  /**
   * Get expertise status
   */
  getStatus() {
    return {
      areas: this.expertiseAreas,
      active_adrs: this.getActiveADRs(),
      architecture_health: this.getArchitectureHealth(),
      pattern_compliance: this.getPatternCompliance()
    };
  }

  // Helper methods
  determineArchitectureTaskType(request, context) {
    const requestLower = request.toLowerCase();

    if (requestLower.includes('adr') || requestLower.includes('decision record')) {
      return 'adr_creation';
    } else if (requestLower.includes('review') && requestLower.includes('architecture')) {
      return 'architecture_review';
    } else if (requestLower.includes('pattern')) {
      return 'pattern_analysis';
    } else if (requestLower.includes('debt') || requestLower.includes('technical debt')) {
      return 'tech_debt_assessment';
    } else if (requestLower.includes('design') || requestLower.includes('system design')) {
      return 'system_design';
    } else if (requestLower.includes('compliance') || requestLower.includes('standards')) {
      return 'compliance_check';
    } else if (requestLower.includes('refactor')) {
      return 'refactoring_plan';
    }

    return 'general_architecture';
  }

  assessArchitecturalComplexity(request, context) {
    let complexity = 1;

    if (request.includes('system-wide') || request.includes('enterprise')) complexity += 3;
    if (request.includes('microservices') || request.includes('distributed')) complexity += 2;
    if (request.includes('migration') || request.includes('refactoring')) complexity += 2;
    if (context.components && context.components.length > 10) complexity += 1;

    return Math.min(complexity, 5);
  }

  assessArchitecturalImpact(request, context) {
    const impacts = [];

    if (request.includes('performance') || request.includes('scalability')) {
      impacts.push('performance');
    }
    if (request.includes('security') || request.includes('compliance')) {
      impacts.push('security');
    }
    if (request.includes('maintainability') || request.includes('refactor')) {
      impacts.push('maintainability');
    }
    if (request.includes('integration') || request.includes('api')) {
      impacts.push('integration');
    }

    return impacts;
  }

  assessQualityAttributeImpact(request, context) {
    return {
      scalability: request.includes('scalability') || request.includes('scale'),
      maintainability: request.includes('maintainability') || request.includes('maintain'),
      performance: request.includes('performance') || request.includes('speed'),
      security: request.includes('security') || request.includes('secure'),
      reliability: request.includes('reliability') || request.includes('reliable'),
      usability: request.includes('usability') || request.includes('user experience')
    };
  }

  identifyStakeholders(request, context) {
    const stakeholders = [];

    if (request.includes('developer') || request.includes('team')) {
      stakeholders.push('development_team');
    }
    if (request.includes('user') || request.includes('customer')) {
      stakeholders.push('end_users');
    }
    if (request.includes('business') || request.includes('product')) {
      stakeholders.push('business_stakeholders');
    }
    if (request.includes('operations') || request.includes('deployment')) {
      stakeholders.push('operations_team');
    }

    return stakeholders;
  }

  generateArchitecturalRecommendations(analysis, context) {
    const recommendations = [];

    if (analysis.complexity > 3) {
      recommendations.push('Consider breaking down this architectural change into smaller phases');
    }

    if (analysis.impact.includes('performance') && !analysis.qualityAttributes.performance) {
      recommendations.push('Include performance testing in the architectural validation');
    }

    if (analysis.impact.includes('security') && !analysis.qualityAttributes.security) {
      recommendations.push('Conduct security review as part of architectural assessment');
    }

    return recommendations;
  }

  generateFollowUpActions(result, analysis) {
    const actions = [];

    if (result.type === 'adr_creation') {
      actions.push('Review and approve ADR with stakeholders');
      actions.push('Implement architectural decision');
    }

    if (result.type === 'architecture_review' && result.findings && result.findings.length > 0) {
      actions.push('Address architectural findings');
      actions.push('Schedule follow-up review');
    }

    if (result.type === 'tech_debt_assessment' && result.total_debt_score > 7) {
      actions.push('Prioritize technical debt remediation');
      actions.push('Allocate resources for debt reduction');
    }

    return actions;
  }

  // Real methods for status reporting
  async getActiveADRs() {
    try {
      // Count active ADRs from tracking files and docs directory
      const fs = require('fs');
      const path = require('path');

      const adrDirs = [
        path.join(this.config.projectRoot, 'docs/adr'),
        path.join(this.config.projectRoot, 'docs/architecture'),
        path.join(this.config.projectRoot, 'architecture/decisions'),
        path.join(this.config.projectRoot, 'core/agents/leonardo/tracking')
      ];

      let activeCount = 0;

      for (const dir of adrDirs) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            const adrFiles = files.filter(file =>
              file.endsWith('.md') &&
              (file.includes('adr') || file.includes('decision') || file.includes('architecture'))
            );

            // Count recent ADRs (within last 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            for (const file of adrFiles) {
              try {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime.getTime() > thirtyDaysAgo) {
                  activeCount++;
                }
              } catch (error) {
                // Skip files we can't read
              }
            }
          } catch (error) {
            // Skip directories we can't read
          }
        }
      }

      return activeCount;

    } catch (error) {
      this.error(`Failed to get active ADRs: ${error.message}`);
      return 0;
    }
  }

  async getArchitectureHealth() {
    try {
      // Analyze architecture health based on pattern compliance and technical debt
      const patternAnalysis = await this.patternCatalog.detectPatterns();
      const healthScore = patternAnalysis.health_score || 0;

      // Determine health status based on score
      if (healthScore >= 8.5) return 'excellent';
      else if (healthScore >= 7.0) return 'good';
      else if (healthScore >= 5.5) return 'fair';
      else if (healthScore >= 4.0) return 'poor';
      else return 'critical';

    } catch (error) {
      this.error(`Failed to assess architecture health: ${error.message}`);
      return 'unknown';
    }
  }

  async getPatternCompliance() {
    try {
      const patternAnalysis = await this.patternCatalog.detectPatterns();

      if (patternAnalysis.patterns && patternAnalysis.patterns.length > 0) {
        // Calculate average compliance across all detected patterns
        const totalCompliance = patternAnalysis.patterns.reduce((sum, pattern) => {
          return sum + (pattern.compliance || 0);
        }, 0);

        const averageCompliance = totalCompliance / patternAnalysis.patterns.length;
        return `${Math.round(averageCompliance)}%`;
      } else {
        return '0%';
      }

    } catch (error) {
      this.error(`Failed to get pattern compliance: ${error.message}`);
      return '0%';
    }
  }
}

/**
 * Architecture-specific toolset
 */
class ArchitectureToolset {
  constructor(agent) {
    this.agent = agent;
    this.tools = [
      'adr_generator',
      'architecture_analyzer',
      'pattern_detector',
      'debt_assessor',
      'compliance_checker',
      'design_validator',
      'refactoring_planner',
      'quality_evaluator'
    ];
  }

  // Placeholder for tool implementations
  async useTool(toolName, params) {
    console.log(`🔧 Using Architecture tool: ${toolName}`);
    return { tool: toolName, result: 'placeholder' };
  }
}


module.exports = ArchitectureAgent;
