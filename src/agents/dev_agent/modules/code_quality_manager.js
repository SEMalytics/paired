/**
 * Code Quality Manager Module
 * 
 * Manages code quality assessment, refactoring, and improvement recommendations
 */

const fs = require('fs').promises;
const path = require('path');

class CodeQualityManager {
  constructor(agent) {
    this.agent = agent;
    this.qualityMetrics = {};
    this.refactoringTargets = [];
    const projectRoot = (this.agent && this.agent.config && this.agent.config.projectRoot) ? 
      this.agent.config.projectRoot : process.cwd();
    this.trackingFile = path.join(projectRoot, 'src/agents/dev_agent/tracking/code_quality.md');
  }

  async initialize() {
    console.log('🚀 Initializing Code Quality Manager...');
    
    // Load existing quality metrics
    await this.loadQualityMetrics();
    
    // Ensure tracking directory exists
    const trackingDir = path.dirname(this.trackingFile);
    await fs.mkdir(trackingDir, { recursive: true });
    
    console.log('✅ Code Quality Manager initialized');
  }

  async loadQualityMetrics() {
    try {
      if (await this.fileExists(this.trackingFile)) {
        const content = await fs.readFile(this.trackingFile, 'utf8');
        this.parseQualityMetrics(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load quality metrics: ${error.message}`);
    }
  }

  parseQualityMetrics(content) {
    // Extract quality metrics from markdown
    const metricsMatch = content.match(/\*\*Overall Quality Score\*\*:\s*(\d+)/);
    if (metricsMatch) {
      this.qualityMetrics.overall_score = parseInt(metricsMatch[1]);
    }
    
    // Extract refactoring targets
    const targetMatches = content.match(/### (.*?)\n(.*?)(?=### |\n---|\n$)/gs);
    if (targetMatches) {
      this.refactoringTargets = targetMatches.map((match, index) => {
        const titleMatch = match.match(/### (.*)/);
        const priorityMatch = match.match(/\*\*Priority\*\*:\s*(.*)/);
        const effortMatch = match.match(/\*\*Effort\*\*:\s*(.*)/);
        
        return {
          id: index + 1,
          title: titleMatch ? titleMatch[1].trim() : 'Unknown Target',
          priority: priorityMatch ? priorityMatch[1].trim() : 'medium',
          effort: effortMatch ? effortMatch[1].trim() : 'medium',
          description: match
        };
      });
    }
  }

  async identifyRefactoringTargets(context) {
    console.log('🔍 Identifying refactoring targets...');
    
    const targets = [];
    
    // Analyze code quality issues
    const qualityIssues = await this.analyzeCodeQuality(context);
    targets.push(...qualityIssues);
    
    // Identify code smells
    const codeSmells = await this.detectCodeSmells(context);
    targets.push(...codeSmells);
    
    // Find duplication opportunities
    const duplicationTargets = await this.findDuplicationTargets(context);
    targets.push(...duplicationTargets);
    
    // Identify performance improvements
    const performanceTargets = await this.identifyPerformanceImprovements(context);
    targets.push(...performanceTargets);
    
    // Calculate priorities
    targets.forEach(target => {
      target.priority_score = this.calculatePriorityScore(target);
    });
    
    // Sort by priority
    targets.sort((a, b) => b.priority_score - a.priority_score);
    
    this.refactoringTargets = targets;
    return targets;
  }

  async analyzeCodeQuality(context) {
    const issues = [];
    
    if (context.codeContent) {
      // Check for long functions
      const functions = this.extractFunctions(context.codeContent);
      functions.forEach(func => {
        if (func.lineCount > 50) {
          issues.push({
            type: 'long_function',
            title: `Long Function: ${func.name}`,
            description: `Function ${func.name} has ${func.lineCount} lines, exceeding recommended limit`,
            priority: 'high',
            effort: 'medium',
            file: func.file,
            line: func.line,
            impact: 'maintainability'
          });
        }
      });
      
      // Check for high complexity
      const complexityIssues = this.analyzeComplexity(context.codeContent);
      issues.push(...complexityIssues);
      
      // Check for naming issues
      const namingIssues = this.analyzeNaming(context.codeContent);
      issues.push(...namingIssues);
    }
    
    return issues;
  }

  extractFunctions(codeContent) {
    const functions = [];
    const lines = codeContent.split('\n');
    
    // Simple function detection (would need more sophisticated parsing)
    const functionRegex = /function\s+(\w+)\s*\(|(\w+)\s*:\s*function\s*\(|(\w+)\s*=>\s*{|async\s+function\s+(\w+)/g;
    
    lines.forEach((line, index) => {
      const match = functionRegex.exec(line);
      if (match) {
        const functionName = match[1] || match[2] || match[3] || match[4] || 'anonymous';
        
        // Estimate function length (simplified)
        let lineCount = 1;
        let braceCount = 0;
        for (let i = index; i < lines.length; i++) {
          const currentLine = lines[i];
          braceCount += (currentLine.match(/{/g) || []).length;
          braceCount -= (currentLine.match(/}/g) || []).length;
          lineCount++;
          if (braceCount === 0 && i > index) break;
        }
        
        functions.push({
          name: functionName,
          line: index + 1,
          lineCount: lineCount,
          file: 'current_file' // Would need actual file context
        });
      }
    });
    
    return functions;
  }

  analyzeComplexity(codeContent) {
    const issues = [];
    
    // Cyclomatic complexity indicators
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    let totalComplexity = 0;
    
    complexityKeywords.forEach(keyword => {
      const matches = codeContent.match(new RegExp(`\\b${keyword}\\b`, 'g')) || [];
      totalComplexity += matches.length;
    });
    
    if (totalComplexity > 15) {
      issues.push({
        type: 'high_complexity',
        title: 'High Cyclomatic Complexity',
        description: `Code complexity score: ${totalComplexity} (recommended: <15)`,
        priority: 'high',
        effort: 'high',
        impact: 'maintainability'
      });
    }
    
    return issues;
  }

  analyzeNaming(codeContent) {
    const issues = [];
    
    // Check for single letter variables (except common ones like i, j, k)
    const singleLetterVars = codeContent.match(/\b[a-h,l-z]\b/g) || [];
    if (singleLetterVars.length > 5) {
      issues.push({
        type: 'poor_naming',
        title: 'Poor Variable Naming',
        description: `${singleLetterVars.length} single-letter variables found`,
        priority: 'medium',
        effort: 'low',
        impact: 'readability'
      });
    }
    
    // Check for inconsistent naming conventions
    const camelCaseVars = codeContent.match(/\b[a-z][a-zA-Z0-9]*\b/g) || [];
    const snake_caseVars = codeContent.match(/\b[a-z][a-z0-9_]*\b/g) || [];
    
    if (camelCaseVars.length > 0 && snake_caseVars.length > 0) {
      issues.push({
        type: 'inconsistent_naming',
        title: 'Inconsistent Naming Convention',
        description: 'Mixed camelCase and snake_case naming detected',
        priority: 'low',
        effort: 'medium',
        impact: 'consistency'
      });
    }
    
    return issues;
  }

  async detectCodeSmells(context) {
    const smells = [];
    
    if (context.codeContent) {
      // Duplicate code detection
      const duplicates = this.findDuplicateCode(context.codeContent);
      smells.push(...duplicates);
      
      // Large class detection
      const largeClasses = this.findLargeClasses(context.codeContent);
      smells.push(...largeClasses);
      
      // Feature envy detection
      const featureEnvy = this.detectFeatureEnvy(context.codeContent);
      smells.push(...featureEnvy);
    }
    
    return smells;
  }

  findDuplicateCode(codeContent) {
    const smells = [];
    const lines = codeContent.split('\n');
    const lineGroups = {};
    
    // Group similar lines
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        if (!lineGroups[trimmed]) {
          lineGroups[trimmed] = [];
        }
        lineGroups[trimmed].push(index + 1);
      }
    });
    
    // Find duplicates
    Object.entries(lineGroups).forEach(([line, locations]) => {
      if (locations.length > 2) {
        smells.push({
          type: 'duplicate_code',
          title: 'Duplicate Code',
          description: `Line "${line.substring(0, 50)}..." appears ${locations.length} times`,
          priority: 'medium',
          effort: 'low',
          impact: 'maintainability',
          locations: locations
        });
      }
    });
    
    return smells.slice(0, 5); // Limit to top 5
  }

  findLargeClasses(codeContent) {
    const smells = [];
    
    // Simple class detection
    const classMatches = codeContent.match(/class\s+(\w+)/g) || [];
    if (classMatches.length > 0) {
      const lines = codeContent.split('\n');
      if (lines.length > 200) {
        smells.push({
          type: 'large_class',
          title: 'Large Class',
          description: `Class appears to be very large (${lines.length} lines)`,
          priority: 'medium',
          effort: 'high',
          impact: 'maintainability'
        });
      }
    }
    
    return smells;
  }

  detectFeatureEnvy(codeContent) {
    const smells = [];
    
    // Look for excessive method chaining or external calls
    const chainMatches = codeContent.match(/\w+\.\w+\.\w+\.\w+/g) || [];
    if (chainMatches.length > 5) {
      smells.push({
        type: 'feature_envy',
        title: 'Feature Envy',
        description: `${chainMatches.length} instances of excessive method chaining detected`,
        priority: 'low',
        effort: 'medium',
        impact: 'coupling'
      });
    }
    
    return smells;
  }

  async findDuplicationTargets(context) {
    const targets = [];
    
    if (context.files && context.files.length > 1) {
      // Identify potential code duplication across files
      targets.push({
        type: 'cross_file_duplication',
        title: 'Cross-File Code Duplication',
        description: 'Potential code duplication across multiple files',
        priority: 'medium',
        effort: 'medium',
        impact: 'maintainability'
      });
    }
    
    return targets;
  }

  async identifyPerformanceImprovements(context) {
    const improvements = [];
    
    if (context.codeContent) {
      // Look for performance anti-patterns
      const nestedLoops = (context.codeContent.match(/for.*for/g) || []).length;
      if (nestedLoops > 0) {
        improvements.push({
          type: 'nested_loops',
          title: 'Nested Loop Optimization',
          description: `${nestedLoops} nested loop(s) detected - consider optimization`,
          priority: 'medium',
          effort: 'medium',
          impact: 'performance'
        });
      }
      
      // Check for inefficient string concatenation
      const stringConcat = (context.codeContent.match(/\+.*\+.*\+/g) || []).length;
      if (stringConcat > 3) {
        improvements.push({
          type: 'string_concatenation',
          title: 'String Concatenation Optimization',
          description: 'Multiple string concatenations - consider using template literals',
          priority: 'low',
          effort: 'low',
          impact: 'performance'
        });
      }
    }
    
    return improvements;
  }

  calculatePriorityScore(target) {
    const priorityWeights = { low: 1, medium: 3, high: 5, critical: 7 };
    const effortWeights = { low: 3, medium: 2, high: 1 };
    const impactWeights = { 
      readability: 2, 
      maintainability: 4, 
      performance: 5, 
      consistency: 1, 
      coupling: 3 
    };
    
    const priorityScore = priorityWeights[target.priority] || 3;
    const effortScore = effortWeights[target.effort] || 2;
    const impactScore = impactWeights[target.impact] || 2;
    
    return priorityScore * effortScore * impactScore;
  }

  async planRefactoringActions(targets) {
    console.log('📋 Planning refactoring actions...');
    
    const plan = {
      immediate_actions: targets.filter(t => t.priority === 'high' || t.priority === 'critical').slice(0, 3),
      short_term_actions: targets.filter(t => t.priority === 'medium').slice(0, 5),
      long_term_actions: targets.filter(t => t.priority === 'low'),
      estimated_timeline: this.calculateRefactoringTimeline(targets)
    };
    
    return plan;
  }

  calculateRefactoringTimeline(targets) {
    let currentWeek = 1;
    const timeline = [];
    
    targets.slice(0, 10).forEach(target => {
      const effortWeeks = { low: 0.5, medium: 1, high: 2 };
      const weeks = effortWeeks[target.effort] || 1;
      
      timeline.push({
        target: target.title,
        start_week: currentWeek,
        duration_weeks: weeks,
        end_week: currentWeek + weeks,
        priority: target.priority
      });
      
      currentWeek += weeks;
    });
    
    return timeline;
  }

  async measureQualityImprovement(beforeMetrics, afterMetrics) {
    const improvement = {
      overall_score_change: (afterMetrics.overall_score || 0) - (beforeMetrics.overall_score || 0),
      complexity_reduction: (beforeMetrics.complexity || 0) - (afterMetrics.complexity || 0),
      duplication_reduction: (beforeMetrics.duplication || 0) - (afterMetrics.duplication || 0),
      maintainability_improvement: this.calculateMaintainabilityImprovement(beforeMetrics, afterMetrics)
    };
    
    return improvement;
  }

  calculateMaintainabilityImprovement(before, after) {
    // Simplified maintainability calculation
    const beforeScore = (before.overall_score || 50) - (before.complexity || 0) - (before.duplication || 0);
    const afterScore = (after.overall_score || 50) - (after.complexity || 0) - (after.duplication || 0);
    
    return afterScore - beforeScore;
  }

  async updateTracking(result) {
    try {
      let content = '';
      if (await this.fileExists(this.trackingFile)) {
        content = await fs.readFile(this.trackingFile, 'utf8');
      } else {
        content = `# Dev Agent - Code Quality Tracking

## Current Quality Metrics
**Overall Quality Score**: 0/100

## Refactoring Targets
*Refactoring targets will be tracked here automatically*

## Quality History
*Quality improvements will be logged here automatically*

`;
      }

      const timestamp = new Date().toISOString();
      const logEntry = `
## ${timestamp}
**Type**: ${result.type}
**Quality Score**: ${result.quality_score || 'N/A'}
**Targets Identified**: ${result.targets_count || 0}
**Details**: ${JSON.stringify(result, null, 2)}

---
`;

      // Insert at the beginning of the history section
      const insertPoint = content.indexOf('*Quality improvements will be logged here automatically*');
      if (insertPoint !== -1) {
        const beforeInsert = content.substring(0, insertPoint + '*Quality improvements will be logged here automatically*'.length);
        const afterInsert = content.substring(insertPoint + '*Quality improvements will be logged here automatically*'.length);
        content = beforeInsert + logEntry + afterInsert;
      } else {
        content += logEntry;
      }

      await fs.writeFile(this.trackingFile, content);
    } catch (error) {
      console.warn(`⚠️ Failed to update code quality tracking: ${error.message}`);
    }
  }

  async getStatus() {
    const highPriorityTargets = this.refactoringTargets.filter(t => t.priority === 'high' || t.priority === 'critical');
    const mediumPriorityTargets = this.refactoringTargets.filter(t => t.priority === 'medium');
    
    return {
      overall_quality_score: this.qualityMetrics.overall_score || 0,
      total_refactoring_targets: this.refactoringTargets.length,
      high_priority_targets: highPriorityTargets.length,
      medium_priority_targets: mediumPriorityTargets.length,
      top_targets: this.refactoringTargets.slice(0, 5).map(target => ({
        title: target.title,
        priority: target.priority,
        effort: target.effort,
        impact: target.impact
      }))
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

module.exports = CodeQualityManager;
