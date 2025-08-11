const fs = require('fs').promises;
const path = require('path');

/**
 * Requirements Gathering Module for Analyst Agent
 * Handles business requirements elicitation, documentation, and traceability
 */
class RequirementsGathering {
  constructor(agent) {
    this.agent = agent;
    this.requirements = new Map();
    this.stakeholders = new Map();
    this.requirementsSessions = new Map();
    this.traceabilityMatrix = new Map();
    
    console.log('📋 Requirements Gathering module initializing...');
  }

  /**
   * Initialize the requirements gathering module
   */
  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      return;
    }
    
    try {
      await this.ensureDirectories();
      await this.loadExistingRequirements();
      await this.loadStakeholderProfiles();
      await this.initializeTemplates();
      this.initialized = true;
      console.log('📋 Requirements Gathering module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Requirements Gathering module:', error.message);
      throw error;
    }
  }

  /**
   * Gather requirements from stakeholders
   */
  async gatherRequirements(stakeholders, scope = 'general') {
    try {
      const sessionId = `session-${Date.now()}`;
      const session = {
        id: sessionId,
        scope,
        stakeholders: stakeholders.length > 0 ? stakeholders : await this.getDefaultStakeholders(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: 'in_progress',
        requirements_collected: [],
        validation_status: 'pending',
        traceability_links: []
      };

      console.log(`📋 Starting requirements gathering session: ${scope}`);

      // Conduct stakeholder interviews
      for (const stakeholder of session.stakeholders) {
        const stakeholderRequirements = await this.conductStakeholderInterview(stakeholder, scope);
        session.requirements_collected.push(...stakeholderRequirements);
      }

      // Analyze and categorize requirements
      const categorizedRequirements = await this.categorizeRequirements(session.requirements_collected);

      // Validate requirements using SMART criteria
      const validatedRequirements = await this.validateRequirements(categorizedRequirements);

      // Create traceability links
      session.traceability_links = await this.createTraceabilityLinks(validatedRequirements);

      // Update session status
      session.status = 'completed';
      session.validation_status = 'validated';
      session.updated = new Date().toISOString();

      // Store session
      this.requirementsSessions.set(sessionId, session);
      await this.saveRequirementsSession(session);

      // Update requirements matrix
      await this.updateRequirementsMatrix(validatedRequirements);

      console.log(`✅ Requirements gathering completed: ${validatedRequirements.length} requirements collected`);

      return {
        session_id: sessionId,
        scope,
        stakeholders_interviewed: session.stakeholders.length,
        requirements_collected: validatedRequirements.length,
        functional_requirements: validatedRequirements.filter(r => r.type === 'functional').length,
        non_functional_requirements: validatedRequirements.filter(r => r.type === 'non_functional').length,
        business_requirements: validatedRequirements.filter(r => r.type === 'business').length,
        validation_summary: this.generateValidationSummary(validatedRequirements),
        next_steps: this.generateRequirementsNextSteps(validatedRequirements)
      };

    } catch (error) {
      console.error('❌ Requirements gathering failed:', error.message);
      throw error;
    }
  }

  /**
   * Conduct stakeholder interview
   */
  async conductStakeholderInterview(stakeholder, scope) {
    const requirements = [];
    const stakeholderName = stakeholder.name || stakeholder;
    const stakeholderRole = stakeholder.role || 'stakeholder';

    console.log(`🎤 Interviewing ${stakeholderName} (${stakeholderRole})`);

    // Generate requirements based on stakeholder role and scope
    const roleBasedRequirements = await this.generateRoleBasedRequirements(stakeholderRole, scope);
    
    for (const req of roleBasedRequirements) {
      requirements.push({
        id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: req.title,
        description: req.description,
        type: req.type,
        priority: req.priority,
        source: stakeholderName,
        source_role: stakeholderRole,
        elicitation_method: 'interview',
        created: new Date().toISOString(),
        status: 'draft',
        acceptance_criteria: req.acceptance_criteria || [],
        business_value: req.business_value || 'medium',
        complexity: req.complexity || 'medium',
        dependencies: req.dependencies || []
      });
    }

    return requirements;
  }

  /**
   * Generate role-based requirements
   */
  async generateRoleBasedRequirements(role, scope) {
    const requirements = [];

    switch (role.toLowerCase()) {
      case 'product_owner':
      case 'product_manager':
        requirements.push(
          {
            title: 'User Story Management',
            description: 'System shall provide comprehensive user story management capabilities',
            type: 'functional',
            priority: 'high',
            business_value: 'high',
            acceptance_criteria: [
              'Create, edit, and delete user stories',
              'Assign story points and priorities',
              'Track story status through workflow'
            ]
          },
          {
            title: 'Product Roadmap Visualization',
            description: 'System shall provide visual product roadmap planning',
            type: 'functional',
            priority: 'medium',
            business_value: 'high',
            acceptance_criteria: [
              'Timeline-based roadmap view',
              'Feature dependency mapping',
              'Progress tracking'
            ]
          }
        );
        break;

      case 'developer':
      case 'engineer':
        requirements.push(
          {
            title: 'Code Quality Metrics',
            description: 'System shall provide automated code quality analysis',
            type: 'functional',
            priority: 'high',
            business_value: 'medium',
            complexity: 'high',
            acceptance_criteria: [
              'Automated code review',
              'Quality metrics dashboard',
              'Integration with CI/CD pipeline'
            ]
          },
          {
            title: 'Development Environment Integration',
            description: 'System shall integrate with popular development environments',
            type: 'functional',
            priority: 'medium',
            business_value: 'medium',
            acceptance_criteria: [
              'VS Code extension',
              'IntelliJ plugin',
              'Command line interface'
            ]
          }
        );
        break;

      case 'business_analyst':
      case 'analyst':
        requirements.push(
          {
            title: 'Requirements Traceability',
            description: 'System shall maintain full requirements traceability',
            type: 'functional',
            priority: 'high',
            business_value: 'high',
            acceptance_criteria: [
              'Link requirements to features',
              'Impact analysis capabilities',
              'Change tracking and history'
            ]
          },
          {
            title: 'Stakeholder Communication',
            description: 'System shall facilitate stakeholder communication',
            type: 'functional',
            priority: 'medium',
            business_value: 'medium',
            acceptance_criteria: [
              'Stakeholder notification system',
              'Comment and feedback system',
              'Status reporting'
            ]
          }
        );
        break;

      case 'end_user':
      case 'user':
        requirements.push(
          {
            title: 'Intuitive User Interface',
            description: 'System shall provide an intuitive and user-friendly interface',
            type: 'non_functional',
            priority: 'high',
            business_value: 'high',
            acceptance_criteria: [
              'Maximum 3 clicks to reach any feature',
              'Consistent UI patterns',
              'Responsive design'
            ]
          },
          {
            title: 'Performance Requirements',
            description: 'System shall meet performance expectations',
            type: 'non_functional',
            priority: 'high',
            business_value: 'medium',
            acceptance_criteria: [
              'Page load time < 2 seconds',
              'Support 1000+ concurrent users',
              '99.9% uptime availability'
            ]
          }
        );
        break;

      default:
        requirements.push(
          {
            title: 'General System Functionality',
            description: 'System shall provide core functionality for the specified scope',
            type: 'functional',
            priority: 'medium',
            business_value: 'medium',
            acceptance_criteria: [
              'Core features operational',
              'Basic user management',
              'Data persistence'
            ]
          }
        );
    }

    return requirements;
  }

  /**
   * Categorize requirements
   */
  async categorizeRequirements(requirements) {
    const categorized = {
      functional: [],
      non_functional: [],
      business: [],
      technical: [],
      user_interface: [],
      security: [],
      performance: []
    };

    for (const req of requirements) {
      // Primary categorization
      if (req.type) {
        if (categorized[req.type]) {
          categorized[req.type].push(req);
        }
      }

      // Secondary categorization based on content
      const description = req.description.toLowerCase();
      const title = req.title.toLowerCase();

      if (description.includes('performance') || title.includes('performance')) {
        categorized.performance.push(req);
      }
      if (description.includes('security') || title.includes('security')) {
        categorized.security.push(req);
      }
      if (description.includes('interface') || description.includes('ui') || title.includes('interface')) {
        categorized.user_interface.push(req);
      }
      if (description.includes('technical') || description.includes('system') || title.includes('technical')) {
        categorized.technical.push(req);
      }
    }

    return requirements; // Return original list with categorization metadata
  }

  /**
   * Validate requirements using SMART criteria
   */
  async validateRequirements(requirements) {
    const validatedRequirements = [];

    for (const req of requirements) {
      const validation = {
        specific: this.isSpecific(req),
        measurable: this.isMeasurable(req),
        achievable: this.isAchievable(req),
        relevant: this.isRelevant(req),
        time_bound: this.isTimeBound(req)
      };

      const validationScore = Object.values(validation).filter(v => v).length;
      
      req.validation = validation;
      req.validation_score = validationScore;
      req.validation_status = validationScore >= 3 ? 'valid' : 'needs_refinement';

      // Add validation recommendations
      req.validation_recommendations = this.generateValidationRecommendations(validation, req);

      validatedRequirements.push(req);
    }

    return validatedRequirements;
  }

  /**
   * SMART criteria validation methods
   */
  isSpecific(req) {
    return req.description && req.description.length > 20 && req.acceptance_criteria && req.acceptance_criteria.length > 0;
  }

  isMeasurable(req) {
    const measurableKeywords = ['shall', 'must', 'will', 'should', 'percentage', 'number', 'time', 'seconds', 'minutes'];
    const text = (req.description + ' ' + req.acceptance_criteria.join(' ')).toLowerCase();
    return measurableKeywords.some(keyword => text.includes(keyword));
  }

  isAchievable(req) {
    return req.complexity !== 'impossible' && req.priority !== 'impossible';
  }

  isRelevant(req) {
    return req.business_value && req.business_value !== 'none';
  }

  isTimeBound(req) {
    return req.timeline || req.acceptance_criteria.some(ac => 
      ac.toLowerCase().includes('time') || 
      ac.toLowerCase().includes('deadline') ||
      ac.toLowerCase().includes('by')
    );
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations(validation, req) {
    const recommendations = [];

    if (!validation.specific) {
      recommendations.push('Add more specific details and clear acceptance criteria');
    }
    if (!validation.measurable) {
      recommendations.push('Include measurable success criteria or metrics');
    }
    if (!validation.achievable) {
      recommendations.push('Review feasibility and complexity assessment');
    }
    if (!validation.relevant) {
      recommendations.push('Clarify business value and relevance');
    }
    if (!validation.time_bound) {
      recommendations.push('Add timeline or deadline information');
    }

    return recommendations;
  }

  /**
   * Create traceability links
   */
  async createTraceabilityLinks(requirements) {
    const links = [];

    for (const req of requirements) {
      // Link to business objectives
      const businessLinks = await this.linkToBusinessObjectives(req);
      links.push(...businessLinks);

      // Link to other requirements
      const requirementLinks = await this.linkToRelatedRequirements(req, requirements);
      links.push(...requirementLinks);

      // Link to features/epics
      const featureLinks = await this.linkToFeatures(req);
      links.push(...featureLinks);
    }

    return links;
  }

  /**
   * Link requirement to business objectives
   */
  async linkToBusinessObjectives(req) {
    const links = [];
    
    // Simulate business objective linking based on requirement characteristics
    if (req.business_value === 'high') {
      links.push({
        requirement_id: req.id,
        linked_to: 'business_objective',
        linked_id: 'BO-001',
        linked_name: 'Increase user satisfaction',
        relationship: 'supports'
      });
    }

    if (req.type === 'performance' || req.title.toLowerCase().includes('performance')) {
      links.push({
        requirement_id: req.id,
        linked_to: 'business_objective',
        linked_id: 'BO-002',
        linked_name: 'Improve system performance',
        relationship: 'implements'
      });
    }

    return links;
  }

  /**
   * Link to related requirements
   */
  async linkToRelatedRequirements(req, allRequirements) {
    const links = [];

    for (const otherReq of allRequirements) {
      if (otherReq.id === req.id) continue;

      // Check for dependencies
      if (req.dependencies && req.dependencies.includes(otherReq.id)) {
        links.push({
          requirement_id: req.id,
          linked_to: 'requirement',
          linked_id: otherReq.id,
          linked_name: otherReq.title,
          relationship: 'depends_on'
        });
      }

      // Check for similar functionality
      const similarity = this.calculateSimilarity(req, otherReq);
      if (similarity > 0.7) {
        links.push({
          requirement_id: req.id,
          linked_to: 'requirement',
          linked_id: otherReq.id,
          linked_name: otherReq.title,
          relationship: 'related_to'
        });
      }
    }

    return links;
  }

  /**
   * Link to features
   */
  async linkToFeatures(req) {
    const links = [];

    // Simulate feature linking based on requirement content
    const title = req.title.toLowerCase();
    
    if (title.includes('user') || title.includes('interface')) {
      links.push({
        requirement_id: req.id,
        linked_to: 'feature',
        linked_id: 'FEAT-UI-001',
        linked_name: 'User Interface Enhancement',
        relationship: 'implemented_by'
      });
    }

    if (title.includes('performance') || title.includes('quality')) {
      links.push({
        requirement_id: req.id,
        linked_to: 'feature',
        linked_id: 'FEAT-PERF-001',
        linked_name: 'Performance Optimization',
        relationship: 'implemented_by'
      });
    }

    return links;
  }

  /**
   * Calculate similarity between requirements
   */
  calculateSimilarity(req1, req2) {
    const text1 = (req1.title + ' ' + req1.description).toLowerCase();
    const text2 = (req2.title + ' ' + req2.description).toLowerCase();
    
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Update requirements matrix
   */
  async updateRequirementsMatrix(requirements) {
    for (const req of requirements) {
      this.requirements.set(req.id, req);
      
      // Update traceability matrix
      this.traceabilityMatrix.set(req.id, {
        requirement: req,
        business_objectives: [],
        features: [],
        test_cases: [],
        dependencies: req.dependencies || []
      });
    }

    await this.saveRequirementsMatrix();
  }

  /**
   * Get requirements matrix
   */
  async getRequirementsMatrix() {
    const requirements = Array.from(this.requirements.values());
    
    return {
      total_requirements: requirements.length,
      by_type: this.groupRequirementsByType(requirements),
      by_priority: this.groupRequirementsByPriority(requirements),
      by_status: this.groupRequirementsByStatus(requirements),
      validation_summary: this.getValidationSummary(requirements),
      traceability_coverage: this.getTraceabilityCoverage()
    };
  }

  /**
   * Group requirements by type
   */
  groupRequirementsByType(requirements) {
    const groups = {};
    for (const req of requirements) {
      const type = req.type || 'unspecified';
      groups[type] = (groups[type] || 0) + 1;
    }
    return groups;
  }

  /**
   * Group requirements by priority
   */
  groupRequirementsByPriority(requirements) {
    const groups = {};
    for (const req of requirements) {
      const priority = req.priority || 'unspecified';
      groups[priority] = (groups[priority] || 0) + 1;
    }
    return groups;
  }

  /**
   * Group requirements by status
   */
  groupRequirementsByStatus(requirements) {
    const groups = {};
    for (const req of requirements) {
      const status = req.status || 'unspecified';
      groups[status] = (groups[status] || 0) + 1;
    }
    return groups;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(requirements) {
    const total = requirements.length;
    const valid = requirements.filter(r => r.validation_status === 'valid').length;
    const needsRefinement = requirements.filter(r => r.validation_status === 'needs_refinement').length;
    
    return {
      total_requirements: total,
      valid_requirements: valid,
      needs_refinement: needsRefinement,
      validation_percentage: total > 0 ? Math.round((valid / total) * 100) : 0
    };
  }

  /**
   * Get traceability coverage
   */
  getTraceabilityCoverage() {
    const totalRequirements = this.traceabilityMatrix.size;
    let linkedRequirements = 0;
    
    for (const [_, traceability] of this.traceabilityMatrix) {
      if (traceability.business_objectives.length > 0 || 
          traceability.features.length > 0 || 
          traceability.dependencies.length > 0) {
        linkedRequirements++;
      }
    }
    
    return {
      total_requirements: totalRequirements,
      linked_requirements: linkedRequirements,
      coverage_percentage: totalRequirements > 0 ? Math.round((linkedRequirements / totalRequirements) * 100) : 0
    };
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(requirements) {
    const validationSummary = this.getValidationSummary(requirements);
    
    return {
      ...validationSummary,
      recommendations: validationSummary.validation_percentage < 80 ? 
        ['Review and refine requirements with low validation scores', 'Add missing acceptance criteria', 'Clarify business value'] :
        ['Requirements validation looks good', 'Consider periodic review for changes']
    };
  }

  /**
   * Generate next steps for requirements
   */
  generateRequirementsNextSteps(requirements) {
    const nextSteps = [];
    
    const highPriorityReqs = requirements.filter(r => r.priority === 'high');
    if (highPriorityReqs.length > 0) {
      nextSteps.push({
        action: 'prioritize_development',
        description: `Begin development planning for ${highPriorityReqs.length} high-priority requirements`,
        timeline: '1-2 weeks'
      });
    }
    
    const needsRefinement = requirements.filter(r => r.validation_status === 'needs_refinement');
    if (needsRefinement.length > 0) {
      nextSteps.push({
        action: 'refine_requirements',
        description: `Refine ${needsRefinement.length} requirements that need improvement`,
        timeline: '1 week'
      });
    }
    
    nextSteps.push({
      action: 'stakeholder_review',
      description: 'Schedule stakeholder review and approval session',
      timeline: '1 week'
    });
    
    return nextSteps;
  }

  /**
   * Get default stakeholders
   */
  async getDefaultStakeholders() {
    return [
      { name: 'Product Owner', role: 'product_owner' },
      { name: 'Lead Developer', role: 'developer' },
      { name: 'Business Analyst', role: 'business_analyst' },
      { name: 'End User Representative', role: 'end_user' }
    ];
  }

  /**
   * Save requirements session
   */
  async saveRequirementsSession(session) {
    try {
      const filePath = path.join(
        process.cwd(),
        '.wee',
        'agents',
        'analyst',
        'requirements',
        `${session.id}.json`
      );
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('❌ Failed to save requirements session:', error.message);
    }
  }

  /**
   * Save requirements matrix
   */
  async saveRequirementsMatrix() {
    try {
      const matrix = {
        requirements: Array.from(this.requirements.values()),
        traceability: Array.from(this.traceabilityMatrix.entries()).map(([id, data]) => ({
          requirement_id: id,
          ...data
        })),
        updated: new Date().toISOString()
      };
      
      const filePath = path.join(
        process.cwd(),
        '.wee',
        'agents',
        'analyst',
        'requirements',
        'requirements_matrix.json'
      );
      await fs.writeFile(filePath, JSON.stringify(matrix, null, 2));
    } catch (error) {
      console.error('❌ Failed to save requirements matrix:', error.message);
    }
  }

  /**
   * Load existing requirements
   */
  async loadExistingRequirements() {
    try {
      const matrixPath = path.join(
        process.cwd(),
        '.wee',
        'agents',
        'analyst',
        'requirements',
        'requirements_matrix.json'
      );
      
      const content = await fs.readFile(matrixPath, 'utf8').catch(() => null);
      if (content) {
        const matrix = JSON.parse(content);
        
        for (const req of matrix.requirements || []) {
          this.requirements.set(req.id, req);
        }
        
        for (const trace of matrix.traceability || []) {
          this.traceabilityMatrix.set(trace.requirement_id, trace);
        }
        
        console.log(`📚 Loaded ${this.requirements.size} existing requirements`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load existing requirements:', error.message);
    }
  }

  /**
   * Load stakeholder profiles
   */
  async loadStakeholderProfiles() {
    // Initialize default stakeholder profiles
    const defaultStakeholders = await this.getDefaultStakeholders();
    for (const stakeholder of defaultStakeholders) {
      this.stakeholders.set(stakeholder.name, {
        ...stakeholder,
        interview_history: [],
        requirements_contributed: 0,
        last_interaction: null
      });
    }
  }

  /**
   * Initialize templates
   */
  async initializeTemplates() {
    // Templates are loaded as needed
    console.log('📋 Requirements templates initialized');
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'requirements'),
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'requirements', 'sessions'),
      path.join(process.cwd(), '.wee', 'agents', 'analyst', 'requirements', 'templates')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

module.exports = RequirementsGathering;
