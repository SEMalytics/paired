/**
 * Pattern Catalog Module
 * 
 * Manages architectural patterns, detects pattern usage, and identifies violations
 */

const fs = require('fs').promises;
const path = require('path');

class PatternCatalog {
  constructor(agent) {
    this.agent = agent;
    this.patterns = [];
    this.violations = [];
    this.opportunities = [];
    this.trackingFile = path.join(this.agent.config?.projectRoot || process.cwd(), 'src/agents/architecture_agent/tracking/pattern_analysis.md');
  }

  async initialize() {
    console.log('🏗️ Initializing Pattern Catalog...');
    
    // Load architectural patterns
    await this.loadPatterns();
    
    // Ensure tracking directory exists
    const trackingDir = path.dirname(this.trackingFile);
    await fs.mkdir(trackingDir, { recursive: true });
    
    console.log('✅ Pattern Catalog initialized');
  }

  async loadPatterns() {
    // Define standard architectural patterns
    this.patterns = [
      {
        name: 'Model-View-Controller (MVC)',
        category: 'Structural',
        description: 'Separates application logic into three interconnected components',
        indicators: ['models/', 'views/', 'controllers/', 'mvc'],
        benefits: ['Separation of concerns', 'Maintainability', 'Testability'],
        drawbacks: ['Complexity for simple applications', 'Potential tight coupling']
      },
      {
        name: 'Repository Pattern',
        category: 'Data Access',
        description: 'Encapsulates data access logic and provides a uniform interface',
        indicators: ['repository', 'repo', 'data access', 'persistence'],
        benefits: ['Testability', 'Centralized data access', 'Abstraction'],
        drawbacks: ['Additional abstraction layer', 'Potential over-engineering']
      },
      {
        name: 'Observer Pattern',
        category: 'Behavioral',
        description: 'Defines a subscription mechanism to notify multiple objects',
        indicators: ['observer', 'listener', 'event', 'subscribe', 'notify'],
        benefits: ['Loose coupling', 'Dynamic relationships', 'Broadcast communication'],
        drawbacks: ['Memory leaks if not unsubscribed', 'Complex debugging']
      },
      {
        name: 'Factory Pattern',
        category: 'Creational',
        description: 'Creates objects without specifying exact classes',
        indicators: ['factory', 'create', 'builder', 'constructor'],
        benefits: ['Flexibility', 'Encapsulation', 'Code reuse'],
        drawbacks: ['Additional complexity', 'Potential over-abstraction']
      },
      {
        name: 'Singleton Pattern',
        category: 'Creational',
        description: 'Ensures a class has only one instance',
        indicators: ['singleton', 'getInstance', 'static instance'],
        benefits: ['Controlled access', 'Reduced memory footprint'],
        drawbacks: ['Global state', 'Testing difficulties', 'Tight coupling']
      },
      {
        name: 'Microservices Architecture',
        category: 'Architectural',
        description: 'Structures application as collection of loosely coupled services',
        indicators: ['microservice', 'service', 'api', 'distributed'],
        benefits: ['Scalability', 'Technology diversity', 'Team autonomy'],
        drawbacks: ['Complexity', 'Network overhead', 'Data consistency']
      },
      {
        name: 'Layered Architecture',
        category: 'Architectural',
        description: 'Organizes code into horizontal layers',
        indicators: ['layer', 'tier', 'presentation', 'business', 'data'],
        benefits: ['Separation of concerns', 'Maintainability', 'Testability'],
        drawbacks: ['Performance overhead', 'Rigid structure']
      },
      {
        name: 'Event-Driven Architecture',
        category: 'Architectural',
        description: 'Uses events to trigger and communicate between services',
        indicators: ['event', 'message', 'queue', 'pub/sub', 'async'],
        benefits: ['Loose coupling', 'Scalability', 'Responsiveness'],
        drawbacks: ['Complexity', 'Debugging challenges', 'Eventual consistency']
      }
    ];
  }

  async detectPatterns(context) {
    console.log('🔍 Detecting architectural patterns...');
    
    const detectedPatterns = [];
    const files = context.files || [];
    const codeContent = context.codeContent || '';
    
    for (const pattern of this.patterns) {
      const detection = await this.analyzePatternUsage(pattern, files, codeContent);
      if (detection.detected) {
        detectedPatterns.push({
          pattern: pattern.name,
          category: pattern.category,
          confidence: detection.confidence,
          evidence: detection.evidence,
          implementation_quality: detection.quality
        });
      }
    }
    
    return detectedPatterns;
  }

  async analyzePatternUsage(pattern, files, codeContent) {
    let confidence = 0;
    const evidence = [];
    let quality = 'unknown';
    
    // Check file structure indicators
    for (const indicator of pattern.indicators) {
      const fileMatches = files.filter(file => 
        file.toLowerCase().includes(indicator.toLowerCase())
      ).length;
      
      if (fileMatches > 0) {
        confidence += 20;
        evidence.push(`File structure indicates ${indicator}: ${fileMatches} matches`);
      }
      
      // Check code content
      const contentMatches = (codeContent.toLowerCase().match(new RegExp(indicator.toLowerCase(), 'g')) || []).length;
      if (contentMatches > 0) {
        confidence += 10;
        evidence.push(`Code content mentions ${indicator}: ${contentMatches} times`);
      }
    }
    
    // Assess implementation quality
    if (confidence > 50) {
      quality = 'good';
    } else if (confidence > 30) {
      quality = 'partial';
    } else if (confidence > 10) {
      quality = 'poor';
    }
    
    return {
      detected: confidence > 10,
      confidence: Math.min(confidence, 100),
      evidence,
      quality
    };
  }

  async findViolations(context) {
    console.log('🚨 Analyzing pattern violations...');
    
    const violations = [];
    const detectedPatterns = await this.detectPatterns(context);
    
    for (const detection of detectedPatterns) {
      const pattern = this.patterns.find(p => p.name === detection.pattern);
      if (!pattern) continue;
      
      // Check for common violations
      const patternViolations = await this.checkPatternViolations(pattern, detection, context);
      violations.push(...patternViolations);
    }
    
    // Check for anti-patterns
    const antiPatterns = await this.detectAntiPatterns(context);
    violations.push(...antiPatterns);
    
    this.violations = violations;
    return violations;
  }

  async checkPatternViolations(pattern, detection, context) {
    const violations = [];
    
    // Pattern-specific violation checks
    switch (pattern.name) {
      case 'Model-View-Controller (MVC)':
        if (detection.confidence > 30) {
          // Check for tight coupling between layers
          violations.push(...await this.checkMVCViolations(context));
        }
        break;
        
      case 'Singleton Pattern':
        if (detection.confidence > 30) {
          // Check for multiple instances or global state issues
          violations.push(...await this.checkSingletonViolations(context));
        }
        break;
        
      case 'Repository Pattern':
        if (detection.confidence > 30) {
          // Check for data access leakage
          violations.push(...await this.checkRepositoryViolations(context));
        }
        break;
    }
    
    return violations;
  }

  async checkMVCViolations(context) {
    const violations = [];
    
    // Check for business logic in views
    if (context.codeContent && context.codeContent.includes('view') && 
        (context.codeContent.includes('database') || context.codeContent.includes('sql'))) {
      violations.push({
        type: 'MVC Violation',
        severity: 'high',
        description: 'Business logic or data access found in view layer',
        recommendation: 'Move business logic to controller or model layer'
      });
    }
    
    return violations;
  }

  async checkSingletonViolations(context) {
    const violations = [];
    
    // Check for multiple singleton instances
    const singletonMatches = (context.codeContent || '').match(/getInstance|singleton/gi);
    if (singletonMatches && singletonMatches.length > 3) {
      violations.push({
        type: 'Singleton Overuse',
        severity: 'medium',
        description: 'Multiple singleton patterns detected, may indicate design issues',
        recommendation: 'Consider dependency injection or other patterns'
      });
    }
    
    return violations;
  }

  async checkRepositoryViolations(context) {
    const violations = [];
    
    // Check for direct database access outside repositories
    if (context.codeContent && !context.codeContent.includes('repository') &&
        (context.codeContent.includes('SELECT') || context.codeContent.includes('INSERT'))) {
      violations.push({
        type: 'Repository Pattern Violation',
        severity: 'medium',
        description: 'Direct database access found outside repository pattern',
        recommendation: 'Encapsulate data access within repository classes'
      });
    }
    
    return violations;
  }

  async detectAntiPatterns(context) {
    const antiPatterns = [];
    
    // God Object/Class
    if (context.files) {
      const largeFiles = context.files.filter(file => {
        // Simulate file size check (would need actual file analysis)
        return file.includes('manager') || file.includes('handler') || file.includes('util');
      });
      
      if (largeFiles.length > 0) {
        antiPatterns.push({
          type: 'God Object',
          severity: 'high',
          description: 'Large, monolithic classes detected',
          files: largeFiles,
          recommendation: 'Break down large classes into smaller, focused components'
        });
      }
    }
    
    // Spaghetti Code
    if (context.codeContent) {
      const complexityIndicators = ['goto', 'break', 'continue', 'return'];
      const complexityScore = complexityIndicators.reduce((score, indicator) => {
        return score + (context.codeContent.match(new RegExp(indicator, 'gi')) || []).length;
      }, 0);
      
      if (complexityScore > 20) {
        antiPatterns.push({
          type: 'Spaghetti Code',
          severity: 'medium',
          description: 'High complexity and control flow detected',
          recommendation: 'Refactor to reduce complexity and improve readability'
        });
      }
    }
    
    return antiPatterns;
  }

  async identifyOpportunities(context) {
    console.log('💡 Identifying pattern opportunities...');
    
    const opportunities = [];
    
    // Analyze code for pattern opportunities
    if (context.codeContent) {
      // Factory pattern opportunity
      if (context.codeContent.includes('new ') && context.codeContent.includes('switch')) {
        opportunities.push({
          pattern: 'Factory Pattern',
          confidence: 70,
          description: 'Multiple object creation with conditional logic detected',
          recommendation: 'Consider implementing Factory pattern to centralize object creation'
        });
      }
      
      // Observer pattern opportunity
      if (context.codeContent.includes('callback') || context.codeContent.includes('event')) {
        opportunities.push({
          pattern: 'Observer Pattern',
          confidence: 60,
          description: 'Event handling or callback patterns detected',
          recommendation: 'Consider implementing Observer pattern for better decoupling'
        });
      }
      
      // Strategy pattern opportunity
      if (context.codeContent.includes('if') && context.codeContent.includes('algorithm')) {
        opportunities.push({
          pattern: 'Strategy Pattern',
          confidence: 50,
          description: 'Conditional algorithm selection detected',
          recommendation: 'Consider Strategy pattern to encapsulate algorithms'
        });
      }
    }
    
    this.opportunities = opportunities;
    return opportunities;
  }

  async calculateHealthScore() {
    const detectedPatterns = this.patterns.length > 0 ? 1 : 0;
    const violationPenalty = this.violations.length * 10;
    const opportunityBonus = this.opportunities.length * 5;
    
    const baseScore = 50;
    const patternBonus = detectedPatterns * 30;
    
    const healthScore = Math.max(0, Math.min(100, 
      baseScore + patternBonus + opportunityBonus - violationPenalty
    ));
    
    return {
      overall_score: healthScore,
      detected_patterns: detectedPatterns,
      violations: this.violations.length,
      opportunities: this.opportunities.length,
      recommendations: this.generateHealthRecommendations(healthScore)
    };
  }

  generateHealthRecommendations(score) {
    const recommendations = [];
    
    if (score < 30) {
      recommendations.push('Critical: Address pattern violations immediately');
      recommendations.push('Consider architectural refactoring');
    } else if (score < 60) {
      recommendations.push('Implement identified pattern opportunities');
      recommendations.push('Address high-severity violations');
    } else if (score < 80) {
      recommendations.push('Fine-tune existing patterns');
      recommendations.push('Consider advanced architectural patterns');
    } else {
      recommendations.push('Maintain current architectural quality');
      recommendations.push('Document patterns for team knowledge sharing');
    }
    
    return recommendations;
  }

  async updateTracking(result) {
    try {
      let content = '';
      if (await this.fileExists(this.trackingFile)) {
        content = await fs.readFile(this.trackingFile, 'utf8');
      } else {
        content = `# Pattern Analysis Tracking

## Pattern Detection History
*Pattern analysis results will be logged here automatically*

## Violation Tracking
*Pattern violations will be tracked here*

## Opportunity Tracking
*Pattern implementation opportunities will be logged here*

`;
      }

      const timestamp = new Date().toISOString();
      const logEntry = `
## ${timestamp}
**Analysis Type**: ${result.type}
**Patterns Detected**: ${result.patterns_detected || 0}
**Violations Found**: ${result.violations_found || 0}
**Opportunities Identified**: ${result.opportunities_identified || 0}
**Health Score**: ${result.health_score || 'N/A'}

### Details
${JSON.stringify(result, null, 2)}

---
`;

      // Insert at the beginning of the history section
      const insertPoint = content.indexOf('*Pattern analysis results will be logged here automatically*');
      if (insertPoint !== -1) {
        const beforeInsert = content.substring(0, insertPoint + '*Pattern analysis results will be logged here automatically*'.length);
        const afterInsert = content.substring(insertPoint + '*Pattern analysis results will be logged here automatically*'.length);
        content = beforeInsert + logEntry + afterInsert;
      } else {
        content += logEntry;
      }

      await fs.writeFile(this.trackingFile, content);
    } catch (error) {
      console.warn(`⚠️ Failed to update pattern tracking: ${error.message}`);
    }
  }

  async getStatus() {
    const healthScore = await this.calculateHealthScore();
    
    return {
      patterns_detected: this.patterns.length,
      violations_count: this.violations.length,
      opportunities_count: this.opportunities.length,
      health_score: healthScore.overall_score,
      recent_violations: this.violations.slice(0, 3),
      top_opportunities: this.opportunities
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
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

module.exports = PatternCatalog;
