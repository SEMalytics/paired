/**
 * Code Reviewer Module for QA Agent
 * 
 * Handles comprehensive code review functionality including:
 * - Code quality analysis
 * - Security vulnerability detection
 * - Refactoring suggestions
 * - Educational feedback generation
 */

const fs = require('fs').promises;
const path = require('path');

class CodeReviewer {
  constructor(qaAgent) {
    this.qaAgent = qaAgent;
    this.reviewHistory = [];
    const projectRoot = (qaAgent && qaAgent.config && qaAgent.config.projectRoot) ? 
      qaAgent.config.projectRoot : process.cwd();
    this.trackingDir = path.join(projectRoot, 'src/agents/qa_agent/tracking');
  }

  /**
   * Initialize code reviewer
   */
  async initialize() {
    console.log('🔍 Code reviewer module initialized');
    await this.ensureTrackingFiles();
  }

  /**
   * Ensure tracking files exist
   */
  async ensureTrackingFiles() {
    try {
      await fs.mkdir(this.trackingDir, { recursive: true });
      
      const reviewHistoryFile = path.join(this.trackingDir, 'review_history.md');
      const qualityMetricsFile = path.join(this.trackingDir, 'quality_metrics.md');
      
      // Create review history file if it doesn't exist
      try {
        await fs.access(reviewHistoryFile);
      } catch {
        await fs.writeFile(reviewHistoryFile, this.getReviewHistoryTemplate());
      }
      
      // Create quality metrics file if it doesn't exist
      try {
        await fs.access(qualityMetricsFile);
      } catch {
        await fs.writeFile(qualityMetricsFile, this.getQualityMetricsTemplate());
      }
    } catch (error) {
      console.warn(`⚠️ Could not create tracking files: ${error.message}`);
    }
  }

  /**
   * Analyze code quality for given files
   */
  async analyzeQuality(files) {
    console.log(`🔍 Analyzing code quality for ${files.length} files...`);
    
    const analysis = {
      overallScore: 0,
      issues: [],
      metrics: {
        complexity: 0,
        duplication: 0,
        maintainability: 0,
        testability: 0
      },
      fileAnalyses: []
    };

    let totalScore = 0;
    
    for (const file of files) {
      const fileAnalysis = await this.analyzeFile(file);
      analysis.fileAnalyses.push(fileAnalysis);
      analysis.issues.push(...fileAnalysis.issues);
      totalScore += fileAnalysis.score;
    }

    analysis.overallScore = files.length > 0 ? totalScore / files.length : 0;
    analysis.metrics = this.calculateAggregateMetrics(analysis.fileAnalyses);

    // Update tracking
    await this.updateQualityTracking(analysis);

    return analysis;
  }

  /**
   * Analyze individual file
   */
  async analyzeFile(filePath) {
    const analysis = {
      file: filePath,
      score: 7.5, // Default score
      issues: [],
      metrics: {
        complexity: 5,
        lines: 0,
        functions: 0,
        classes: 0
      }
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      analysis.metrics.lines = content.split('\n').length;
      
      // Simple complexity analysis
      const functionMatches = content.match(/function\s+\w+|=>\s*{|class\s+\w+/g) || [];
      analysis.metrics.functions = functionMatches.length;
      
      const classMatches = content.match(/class\s+\w+/g) || [];
      analysis.metrics.classes = classMatches.length;

      // Detect common issues
      analysis.issues = this.detectCodeIssues(content, filePath);
      
      // Calculate score based on issues
      analysis.score = this.calculateFileScore(analysis.issues, analysis.metrics);

    } catch (error) {
      analysis.issues.push({
        type: 'file_access',
        severity: 'high',
        description: `Could not analyze file: ${error.message}`,
        line: 0
      });
      analysis.score = 0;
    }

    return analysis;
  }

  /**
   * Detect common code issues
   */
  detectCodeIssues(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Long line detection
      if (line.length > 120) {
        issues.push({
          type: 'line_length',
          severity: 'medium',
          description: `Line exceeds 120 characters (${line.length})`,
          line: lineNumber
        });
      }

      // TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'todo',
          severity: 'low',
          description: 'TODO/FIXME comment found',
          line: lineNumber
        });
      }

      // Console.log in production code
      if (line.includes('console.log') && !filePath.includes('test')) {
        issues.push({
          type: 'debug_code',
          severity: 'medium',
          description: 'Console.log statement found in production code',
          line: lineNumber
        });
      }

      // Missing error handling
      if (line.includes('JSON.parse') && !lines[index + 1]?.includes('catch')) {
        issues.push({
          type: 'error_handling',
          severity: 'high',
          description: 'JSON.parse without error handling',
          line: lineNumber
        });
      }
    });

    return issues;
  }

  /**
   * Calculate file score based on issues and metrics
   */
  calculateFileScore(issues, metrics) {
    let score = 10;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 2;
          break;
        case 'medium':
          score -= 1;
          break;
        case 'low':
          score -= 0.5;
          break;
      }
    });

    // Deduct points for complexity
    if (metrics.complexity > 10) {
      score -= (metrics.complexity - 10) * 0.5;
    }

    // Ensure score is between 0 and 10
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Generate refactoring suggestions
   */
  async generateRefactoringSuggestions(qualityAnalysis) {
    const suggestions = [];

    qualityAnalysis.issues.forEach(issue => {
      switch (issue.type) {
        case 'complexity':
          suggestions.push({
            type: 'extract_method',
            priority: 'high',
            description: 'Extract complex logic into separate methods',
            file: issue.file,
            line: issue.line
          });
          break;
        
        case 'duplication':
          suggestions.push({
            type: 'extract_common',
            priority: 'medium',
            description: 'Extract duplicated code into shared utilities',
            file: issue.file,
            line: issue.line
          });
          break;
        
        case 'line_length':
          suggestions.push({
            type: 'format_code',
            priority: 'low',
            description: 'Break long lines for better readability',
            file: issue.file,
            line: issue.line
          });
          break;
      }
    });

    return suggestions;
  }

  /**
   * Generate educational feedback
   */
  async generateEducationalFeedback(qualityAnalysis) {
    const feedback = [];

    const issueTypes = [...new Set(qualityAnalysis.issues.map(i => i.type))];

    issueTypes.forEach(type => {
      switch (type) {
        case 'complexity':
          feedback.push({
            topic: 'code_complexity',
            explanation: 'High complexity makes code harder to understand, test, and maintain. Consider breaking complex functions into smaller, focused functions.',
            resources: ['Clean Code by Robert Martin', 'Refactoring by Martin Fowler']
          });
          break;
        
        case 'error_handling':
          feedback.push({
            topic: 'error_handling',
            explanation: 'Proper error handling prevents unexpected crashes and provides better user experience. Always wrap risky operations in try-catch blocks.',
            resources: ['Error Handling Best Practices', 'Defensive Programming']
          });
          break;
        
        case 'debug_code':
          feedback.push({
            topic: 'production_code',
            explanation: 'Debug statements like console.log should be removed from production code. Use proper logging frameworks instead.',
            resources: ['Logging Best Practices', 'Winston.js Documentation']
          });
          break;
      }
    });

    return feedback;
  }

  /**
   * Analyze security vulnerabilities
   */
  async analyzeSecurityVulnerabilities(context) {
    const vulnerabilities = [];
    
    if (context.files) {
      for (const file of context.files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const fileVulns = this.detectSecurityIssues(content, file);
          vulnerabilities.push(...fileVulns);
        } catch (error) {
          // File access error, skip
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Detect security issues in code
   */
  detectSecurityIssues(content, filePath) {
    const vulnerabilities = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // SQL injection risks
      if (line.includes('query') && line.includes('+') && line.includes('req.')) {
        vulnerabilities.push({
          type: 'sql_injection',
          severity: 'high',
          description: 'Potential SQL injection vulnerability - use parameterized queries',
          file: filePath,
          line: lineNumber
        });
      }

      // XSS risks
      if (line.includes('innerHTML') && line.includes('req.')) {
        vulnerabilities.push({
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS vulnerability - sanitize user input',
          file: filePath,
          line: lineNumber
        });
      }

      // Hardcoded secrets
      if (line.match(/(password|secret|key|token)\s*=\s*['"][^'"]+['"]/i)) {
        vulnerabilities.push({
          type: 'hardcoded_secret',
          severity: 'critical',
          description: 'Hardcoded secret detected - use environment variables',
          file: filePath,
          line: lineNumber
        });
      }
    });

    return vulnerabilities;
  }

  /**
   * Calculate security score
   */
  async calculateSecurityScore(vulnerabilities) {
    let score = 10;

    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 3;
          break;
        case 'high':
          score -= 2;
          break;
        case 'medium':
          score -= 1;
          break;
        case 'low':
          score -= 0.5;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Generate security recommendations
   */
  async generateSecurityRecommendations(vulnerabilities) {
    return vulnerabilities.map(vuln => ({
      type: 'security',
      priority: vuln.severity,
      description: `Address ${vuln.type}: ${vuln.description}`,
      file: vuln.file,
      line: vuln.line,
      remediation: this.getSecurityRemediation(vuln.type)
    }));
  }

  /**
   * Get security remediation advice
   */
  getSecurityRemediation(vulnType) {
    const remediations = {
      sql_injection: 'Use parameterized queries or ORM with proper escaping',
      xss: 'Sanitize user input and use Content Security Policy',
      hardcoded_secret: 'Move secrets to environment variables or secure vault',
      weak_crypto: 'Use strong encryption algorithms and proper key management'
    };

    return remediations[vulnType] || 'Review security best practices for this vulnerability type';
  }

  /**
   * Update quality tracking
   */
  async updateQualityTracking(analysis) {
    try {
      const metricsFile = path.join(this.trackingDir, 'quality_metrics.md');
      const timestamp = new Date().toISOString();
      
      const entry = `
## Quality Analysis - ${timestamp}

**Overall Score**: ${analysis.overallScore.toFixed(1)}/10

**Issues Found**: ${analysis.issues.length}
- High: ${analysis.issues.filter(i => i.severity === 'high').length}
- Medium: ${analysis.issues.filter(i => i.severity === 'medium').length}
- Low: ${analysis.issues.filter(i => i.severity === 'low').length}

**Metrics**:
- Complexity: ${analysis.metrics.complexity}
- Duplication: ${analysis.metrics.duplication}%
- Maintainability: ${analysis.metrics.maintainability}

---
`;

      await fs.appendFile(metricsFile, entry);
    } catch (error) {
      console.warn(`⚠️ Could not update quality tracking: ${error.message}`);
    }
  }

  /**
   * Update review tracking
   */
  async updateTracking(result) {
    this.reviewHistory.push(result);
    
    try {
      const historyFile = path.join(this.trackingDir, 'review_history.md');
      const timestamp = new Date().toISOString();
      
      const entry = `
## Code Review - ${timestamp}

**Type**: ${result.type}
**Files Reviewed**: ${result.files_reviewed?.length || 0}
**Issues Found**: ${result.issues_found?.length || 0}
**Quality Score**: ${result.quality_score || 'N/A'}

**Status**: ${result.completion_status || 'completed'}

---
`;

      await fs.appendFile(historyFile, entry);
    } catch (error) {
      console.warn(`⚠️ Could not update review tracking: ${error.message}`);
    }
  }

  /**
   * Get reviewer status
   */
  async getStatus() {
    return {
      reviews_completed: this.reviewHistory.length,
      average_quality_score: this.calculateAverageQualityScore(),
      last_review: this.reviewHistory.length > 0 ? this.reviewHistory[this.reviewHistory.length - 1].timestamp : 'never'
    };
  }

  /**
   * Calculate average quality score
   */
  calculateAverageQualityScore() {
    if (this.reviewHistory.length === 0) return 0;
    
    const scores = this.reviewHistory
      .filter(r => r.quality_score)
      .map(r => r.quality_score);
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  /**
   * Calculate aggregate metrics
   */
  async calculateAggregateMetrics(fileAnalyses) {
    if (fileAnalyses.length === 0) {
      return { complexity: 0, duplication: 0, maintainability: 0, testability: 0 };
    }

    const totals = fileAnalyses.reduce((acc, analysis) => {
      acc.complexity += analysis.metrics.complexity || 0;
      acc.lines += analysis.metrics.lines || 0;
      acc.functions += analysis.metrics.functions || 0;
      return acc;
    }, { complexity: 0, lines: 0, functions: 0 });

    // Calculate real duplication percentage
    const duplication = await this.calculateDuplication(fileAnalyses);
    
    // Calculate real maintainability index
    const maintainability = await this.calculateMaintainability(fileAnalyses);
    
    // Calculate real testability score
    const testability = await this.calculateTestability(fileAnalyses);
    
    return {
      complexity: totals.complexity / fileAnalyses.length,
      duplication: duplication,
      maintainability: maintainability,
      testability: testability
    };
  }

  /**
   * Get review history template
   */
  getReviewHistoryTemplate() {
    return `# Code Review History

This file tracks all code reviews performed by the QA Agent.

---

*Reviews will be automatically logged here*
`;
  }

  /**
   * Get quality metrics template
   */
  getQualityMetricsTemplate() {
    return `# Quality Metrics

This file tracks quality metrics over time.

## Current Status
- Overall Quality Score: Not yet measured
- Test Coverage: Not yet measured
- Technical Debt: Not yet measured

---

*Metrics will be automatically updated here*
`;
  }
}

module.exports = CodeReviewer;
