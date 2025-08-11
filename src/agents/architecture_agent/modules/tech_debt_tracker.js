/**
 * Technical Debt Tracker Module
 * 
 * Identifies, categorizes, and tracks technical debt across the codebase
 */

const fs = require('fs').promises;
const path = require('path');

class TechDebtTracker {
  constructor(agent) {
    this.agent = agent;
    this.debtItems = [];
    this.debtCategories = [
      'code_quality',
      'architecture',
      'documentation',
      'testing',
      'performance',
      'security',
      'dependencies',
      'design'
    ];
    this.trackingFile = path.join(this.agent.config?.projectRoot || process.cwd(), 'src/agents/architecture_agent/tracking/tech_debt.md');
  }

  async initialize() {
    console.log('🏗️ Initializing Technical Debt Tracker...');
    
    // Load existing debt items
    await this.loadDebtItems();
    
    // Ensure tracking directory exists
    const trackingDir = path.dirname(this.trackingFile);
    await fs.mkdir(trackingDir, { recursive: true });
    
    console.log('✅ Technical Debt Tracker initialized');
  }

  async loadDebtItems() {
    try {
      if (await this.fileExists(this.trackingFile)) {
        const content = await fs.readFile(this.trackingFile, 'utf8');
        this.parseDebtItems(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load debt items: ${error.message}`);
    }
  }

  parseDebtItems(content) {
    // Extract debt items from markdown
    const debtMatches = content.match(/### (.*?)\n(.*?)(?=### |\n---|\n$)/gs);
    if (debtMatches) {
      this.debtItems = debtMatches.map((match, index) => {
        const titleMatch = match.match(/### (.*)/);
        const severityMatch = match.match(/\*\*Severity\*\*:\s*(.*)/);
        const categoryMatch = match.match(/\*\*Category\*\*:\s*(.*)/);
        const effortMatch = match.match(/\*\*Effort\*\*:\s*(.*)/);
        
        return {
          id: index + 1,
          title: titleMatch ? titleMatch[1].trim() : 'Unknown Debt Item',
          severity: severityMatch ? severityMatch[1].trim() : 'medium',
          category: categoryMatch ? categoryMatch[1].trim() : 'code_quality',
          effort: effortMatch ? effortMatch[1].trim() : 'medium',
          description: match,
          created_date: new Date().toISOString(),
          status: 'open'
        };
      });
    }
  }

  async identifyDebtItems(context) {
    console.log('🔍 Identifying technical debt items...');
    
    const debtItems = [];
    
    // Analyze code quality debt
    const codeQualityDebt = await this.analyzeCodeQualityDebt(context);
    debtItems.push(...codeQualityDebt);
    
    // Analyze architectural debt
    const architecturalDebt = await this.analyzeArchitecturalDebt(context);
    debtItems.push(...architecturalDebt);
    
    // Analyze documentation debt
    const documentationDebt = await this.analyzeDocumentationDebt(context);
    debtItems.push(...documentationDebt);
    
    // Analyze testing debt
    const testingDebt = await this.analyzeTestingDebt(context);
    debtItems.push(...testingDebt);
    
    // Analyze dependency debt
    const dependencyDebt = await this.analyzeDependencyDebt(context);
    debtItems.push(...dependencyDebt);
    
    // Calculate priorities
    debtItems.forEach(item => {
      item.priority = this.calculatePriority(item);
    });
    
    // Update internal state
    this.debtItems = [...this.debtItems, ...debtItems];
    
    return debtItems;
  }

  async analyzeCodeQualityDebt(context) {
    const debtItems = [];
    
    if (context.codeContent) {
      // Check for code smells
      const codeSmells = this.detectCodeSmells(context.codeContent);
      debtItems.push(...codeSmells.map(smell => ({
        title: `Code Smell: ${smell.type}`,
        description: smell.description,
        category: 'code_quality',
        severity: smell.severity,
        effort: smell.effort,
        location: smell.location,
        remediation: smell.remediation
      })));
      
      // Check for complexity issues
      const complexityIssues = this.analyzeComplexity(context.codeContent);
      debtItems.push(...complexityIssues);
    }
    
    return debtItems;
  }

  detectCodeSmells(codeContent) {
    const smells = [];
    
    // Long method detection
    const methods = codeContent.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    methods.forEach((method, index) => {
      const lineCount = method.split('\n').length;
      if (lineCount > 50) {
        smells.push({
          type: 'Long Method',
          description: `Method has ${lineCount} lines, exceeding recommended limit`,
          severity: 'medium',
          effort: 'medium',
          location: `Method ${index + 1}`,
          remediation: 'Break down into smaller, focused methods'
        });
      }
    });
    
    // Duplicate code detection
    const duplicatePatterns = this.findDuplicatePatterns(codeContent);
    duplicatePatterns.forEach(pattern => {
      smells.push({
        type: 'Duplicate Code',
        description: `Duplicate code pattern found: ${pattern.pattern}`,
        severity: 'medium',
        effort: 'low',
        location: pattern.locations.join(', '),
        remediation: 'Extract common code into reusable functions'
      });
    });
    
    // Magic numbers detection
    const magicNumbers = codeContent.match(/\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 5) {
      smells.push({
        type: 'Magic Numbers',
        description: `${magicNumbers.length} potential magic numbers found`,
        severity: 'low',
        effort: 'low',
        location: 'Throughout codebase',
        remediation: 'Replace magic numbers with named constants'
      });
    }
    
    return smells;
  }

  findDuplicatePatterns(codeContent) {
    const patterns = [];
    const lines = codeContent.split('\n');
    const lineGroups = {};
    
    // Group similar lines
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10) {
        if (!lineGroups[trimmed]) {
          lineGroups[trimmed] = [];
        }
        lineGroups[trimmed].push(index + 1);
      }
    });
    
    // Find duplicates
    Object.entries(lineGroups).forEach(([pattern, locations]) => {
      if (locations.length > 1) {
        patterns.push({
          pattern: pattern.substring(0, 50) + '...',
          locations: locations.map(loc => `Line ${loc}`)
        });
      }
    });
    
    return patterns.slice(0, 5); // Limit to top 5
  }

  analyzeComplexity(codeContent) {
    const complexityIssues = [];
    
    // Cyclomatic complexity estimation
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch'];
    let totalComplexity = 0;
    
    complexityKeywords.forEach(keyword => {
      const matches = codeContent.match(new RegExp(`\\b${keyword}\\b`, 'g')) || [];
      totalComplexity += matches.length;
    });
    
    if (totalComplexity > 20) {
      complexityIssues.push({
        title: 'High Cyclomatic Complexity',
        description: `Estimated complexity score: ${totalComplexity}`,
        category: 'code_quality',
        severity: 'high',
        effort: 'high',
        remediation: 'Refactor complex methods, extract conditions into separate functions'
      });
    }
    
    return complexityIssues;
  }

  async analyzeArchitecturalDebt(context) {
    const debtItems = [];
    
    // Check for architectural violations
    if (context.files) {
      // Circular dependencies
      const circularDeps = this.detectCircularDependencies(context.files);
      if (circularDeps.length > 0) {
        debtItems.push({
          title: 'Circular Dependencies',
          description: `${circularDeps.length} potential circular dependencies detected`,
          category: 'architecture',
          severity: 'high',
          effort: 'high',
          remediation: 'Refactor to eliminate circular dependencies'
        });
      }
      
      // Layer violations
      const layerViolations = this.detectLayerViolations(context.files);
      debtItems.push(...layerViolations);
    }
    
    return debtItems;
  }

  detectCircularDependencies(files) {
    // Simplified circular dependency detection
    const dependencies = {};
    const circularDeps = [];
    
    files.forEach(file => {
      if (file.includes('import') || file.includes('require')) {
        // This is a simplified check - would need actual dependency analysis
        const fileName = path.basename(file);
        if (!dependencies[fileName]) {
          dependencies[fileName] = [];
        }
      }
    });
    
    return circularDeps;
  }

  detectLayerViolations(files) {
    const violations = [];
    
    // Check for presentation layer accessing data layer directly
    const presentationFiles = files.filter(f => f.includes('view') || f.includes('ui'));
    const dataFiles = files.filter(f => f.includes('data') || f.includes('db'));
    
    if (presentationFiles.length > 0 && dataFiles.length > 0) {
      violations.push({
        title: 'Potential Layer Violation',
        description: 'Presentation layer may be accessing data layer directly',
        category: 'architecture',
        severity: 'medium',
        effort: 'medium',
        remediation: 'Ensure proper layering with business logic as intermediary'
      });
    }
    
    return violations;
  }

  async analyzeDocumentationDebt(context) {
    const debtItems = [];
    
    if (context.files) {
      const codeFiles = context.files.filter(f => f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.java'));
      const docFiles = context.files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      
      const docRatio = docFiles.length / Math.max(codeFiles.length, 1);
      
      if (docRatio < 0.1) {
        debtItems.push({
          title: 'Insufficient Documentation',
          description: `Documentation ratio: ${(docRatio * 100).toFixed(1)}% (recommended: >10%)`,
          category: 'documentation',
          severity: 'medium',
          effort: 'medium',
          remediation: 'Add comprehensive documentation for key components'
        });
      }
    }
    
    return debtItems;
  }

  async analyzeTestingDebt(context) {
    const debtItems = [];
    
    if (context.files) {
      const codeFiles = context.files.filter(f => 
        (f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.java')) && 
        !f.includes('test') && !f.includes('spec')
      );
      const testFiles = context.files.filter(f => f.includes('test') || f.includes('spec'));
      
      const testRatio = testFiles.length / Math.max(codeFiles.length, 1);
      
      if (testRatio < 0.3) {
        debtItems.push({
          title: 'Insufficient Test Coverage',
          description: `Test file ratio: ${(testRatio * 100).toFixed(1)}% (recommended: >30%)`,
          category: 'testing',
          severity: 'high',
          effort: 'high',
          remediation: 'Implement comprehensive test suite'
        });
      }
    }
    
    return debtItems;
  }

  async analyzeDependencyDebt(context) {
    const debtItems = [];
    
    // Check for outdated dependencies (simplified)
    if (context.codeContent && context.codeContent.includes('package.json')) {
      debtItems.push({
        title: 'Dependency Review Needed',
        description: 'Dependencies should be reviewed for security and updates',
        category: 'dependencies',
        severity: 'medium',
        effort: 'low',
        remediation: 'Run dependency audit and update outdated packages'
      });
    }
    
    return debtItems;
  }

  calculatePriority(item) {
    const severityWeights = { low: 1, medium: 3, high: 5, critical: 7 };
    const effortWeights = { low: 3, medium: 2, high: 1 };
    
    const severityScore = severityWeights[item.severity] || 3;
    const effortScore = effortWeights[item.effort] || 2;
    
    return severityScore * effortScore;
  }

  async calculateTotalDebt() {
    const totalItems = this.debtItems.length;
    const highSeverityItems = this.debtItems.filter(item => item.severity === 'high' || item.severity === 'critical').length;
    const estimatedHours = this.debtItems.reduce((total, item) => {
      const effortHours = { low: 2, medium: 8, high: 24 };
      return total + (effortHours[item.effort] || 8);
    }, 0);
    
    return {
      total_items: totalItems,
      high_severity_items: highSeverityItems,
      estimated_hours: estimatedHours,
      estimated_days: Math.ceil(estimatedHours / 8),
      debt_ratio: this.calculateDebtRatio()
    };
  }

  calculateDebtRatio() {
    // Simplified debt ratio calculation
    const totalComplexity = this.debtItems.length * 10; // Simplified
    const codebaseSize = 1000; // Would need actual codebase analysis
    return Math.min(100, (totalComplexity / codebaseSize) * 100);
  }

  categorizeDebt() {
    const categorized = {};
    
    this.debtCategories.forEach(category => {
      categorized[category] = this.debtItems.filter(item => item.category === category);
    });
    
    return categorized;
  }

  async createRemediationPlan() {
    const sortedDebt = [...this.debtItems].sort((a, b) => b.priority - a.priority);
    const plan = {
      immediate_actions: sortedDebt.slice(0, 3),
      short_term: sortedDebt.slice(3, 8),
      long_term: sortedDebt.slice(8),
      estimated_timeline: this.calculateTimeline(sortedDebt)
    };
    
    return plan;
  }

  calculateTimeline(sortedDebt) {
    let currentWeek = 1;
    const timeline = [];
    
    sortedDebt.forEach(item => {
      const effortWeeks = { low: 0.25, medium: 1, high: 3 };
      const weeks = effortWeeks[item.effort] || 1;
      
      timeline.push({
        item: item.title,
        start_week: currentWeek,
        duration_weeks: weeks,
        end_week: currentWeek + weeks
      });
      
      currentWeek += weeks;
    });
    
    return timeline;
  }

  async updateTracking(result) {
    try {
      let content = '';
      if (await this.fileExists(this.trackingFile)) {
        content = await fs.readFile(this.trackingFile, 'utf8');
      } else {
        content = `# Technical Debt Tracking

## Current Debt Summary
*Technical debt metrics will be tracked here automatically*

## Debt Items
*Individual debt items will be logged here*

## Remediation Progress
*Progress on debt remediation will be tracked here*

`;
      }

      const timestamp = new Date().toISOString();
      const debtSummary = await this.calculateTotalDebt();
      
      const logEntry = `
## ${timestamp}
**Total Debt Items**: ${debtSummary.total_items}
**High Severity**: ${debtSummary.high_severity_items}
**Estimated Effort**: ${debtSummary.estimated_hours} hours (${debtSummary.estimated_days} days)
**Debt Ratio**: ${debtSummary.debt_ratio.toFixed(1)}%

### Recent Analysis
${JSON.stringify(result, null, 2)}

---
`;

      // Insert at the beginning of the summary section
      const insertPoint = content.indexOf('*Technical debt metrics will be tracked here automatically*');
      if (insertPoint !== -1) {
        const beforeInsert = content.substring(0, insertPoint + '*Technical debt metrics will be tracked here automatically*'.length);
        const afterInsert = content.substring(insertPoint + '*Technical debt metrics will be tracked here automatically*'.length);
        content = beforeInsert + logEntry + afterInsert;
      } else {
        content += logEntry;
      }

      await fs.writeFile(this.trackingFile, content);
    } catch (error) {
      console.warn(`⚠️ Failed to update tech debt tracking: ${error.message}`);
    }
  }

  async getStatus() {
    const totalDebt = await this.calculateTotalDebt();
    const categorized = this.categorizeDebt();
    const remediationPlan = await this.createRemediationPlan();
    
    return {
      total_debt: totalDebt,
      by_category: Object.keys(categorized).map(cat => ({
        category: cat,
        count: categorized[cat].length
      })),
      top_priority_items: remediationPlan.immediate_actions.map(item => ({
        title: item.title,
        severity: item.severity,
        priority: item.priority
      })),
      remediation_timeline: remediationPlan.estimated_timeline.slice(0, 5)
    };
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = TechDebtTracker;
