#!/usr/bin/env node
/**
 * Architecture Agent CLI Patterns Tool
 *
 * Provides command-line interface for pattern analysis and management
 */

const path = require('path');
const PatternCatalog = require('../modules/pattern_catalog');

// Mock Architecture Agent for CLI usage
class MockArchAgent {
  constructor() {
    this.config = {
      projectRoot: path.resolve(__dirname, '../../../..')
    };
  }
}

async function runPatternsCommand(command, ...args) {
  console.log('🏗️ Architecture Agent - Pattern Analysis Tool');
  console.log('=============================================');

  try {
    const archAgent = new MockArchAgent();
    const patternCatalog = new PatternCatalog(archAgent);

    await patternCatalog.initialize();

    switch (command) {
    case 'analyze':
      await analyzePatterns(patternCatalog);
      break;
    case 'violations':
      await checkViolations(patternCatalog);
      break;
    case 'opportunities':
      await findOpportunities(patternCatalog);
      break;
    case 'health':
      await calculateHealth(patternCatalog);
      break;
    case 'list':
      await listPatterns(patternCatalog);
      break;
    default:
      showHelp();
    }

  } catch (error) {
    console.error('❌ Pattern analysis failed:', error.message);
    process.exit(1);
  }
}

async function analyzePatterns(patternCatalog) {
  console.log('🔍 Analyzing architectural patterns...');

  // Mock context for CLI usage
  const context = {
    files: [
      'core/models/user.js',
      'shared/views/dashboard.js',
      'platform/controllers/auth.js',
      'core/repositories/user-repo.js',
      'shared/services/notification.js',
      'core/factories/service-factory.js'
    ],
    codeContent: `
      class UserController {
        constructor(userRepository, notificationService) {
          this.userRepository = userRepository;
          this.notificationService = notificationService;
        }
        
        async createUser(userData) {
          const user = await this.userRepository.create(userData);
          await this.notificationService.notify(user);
          return user;
        }
      }
      
      class ServiceFactory {
        static createUserService() {
          return new UserService();
        }
      }
      
      const observer = {
        notify: function(data) {
          this.listeners.forEach(listener => listener(data));
        }
      };
    `
  };

  const detectedPatterns = await patternCatalog.detectPatterns(context);

  console.log('\n📊 PATTERN ANALYSIS RESULTS');
  console.log('===========================');

  if (detectedPatterns.length === 0) {
    console.log('No architectural patterns detected');
    return;
  }

  detectedPatterns.forEach(pattern => {
    const confidenceIcon = getConfidenceIcon(pattern.confidence);
    const qualityIcon = getQualityIcon(pattern.implementation_quality);

    console.log(`${confidenceIcon} ${pattern.pattern} (${pattern.category})`);
    console.log(`   Confidence: ${pattern.confidence}% ${qualityIcon} Quality: ${pattern.implementation_quality}`);
    console.log('   Evidence:');
    pattern.evidence.forEach(evidence => {
      console.log(`     - ${evidence}`);
    });
    console.log('');
  });

  // Update tracking
  await patternCatalog.updateTracking({
    type: 'pattern_analysis',
    patterns_detected: detectedPatterns.length,
    timestamp: new Date().toISOString(),
    patterns: detectedPatterns
  });
}

async function checkViolations(patternCatalog) {
  console.log('🚨 Checking for pattern violations...');

  // Mock context for CLI usage
  const context = {
    files: [
      'core/models/user.js',
      'shared/views/dashboard.js',
      'platform/controllers/auth.js'
    ],
    codeContent: `
      // Example of MVC violation - business logic in view
      class DashboardView {
        render() {
          const users = database.query('SELECT * FROM users');
          return '<div>' + users.map(u => u.name).join('</div><div>') + '</div>';
        }
      }
      
      // Example of singleton overuse
      class DatabaseSingleton {
        static getInstance() { return this.instance; }
      }
      class CacheSingleton {
        static getInstance() { return this.instance; }
      }
      class LoggerSingleton {
        static getInstance() { return this.instance; }
      }
    `
  };

  const violations = await patternCatalog.findViolations(context);

  console.log('\n🚨 PATTERN VIOLATIONS');
  console.log('====================');

  if (violations.length === 0) {
    console.log('✅ No pattern violations detected');
    return;
  }

  violations.forEach(violation => {
    const severityIcon = getSeverityIcon(violation.severity);
    console.log(`${severityIcon} ${violation.type} (${violation.severity} severity)`);
    console.log(`   Description: ${violation.description}`);
    console.log(`   Recommendation: ${violation.recommendation}`);
    if (violation.files) {
      console.log(`   Affected files: ${violation.files.join(', ')}`);
    }
    console.log('');
  });

  // Update tracking
  await patternCatalog.updateTracking({
    type: 'violation_check',
    violations_found: violations.length,
    timestamp: new Date().toISOString(),
    violations: violations
  });
}

async function findOpportunities(patternCatalog) {
  console.log('💡 Identifying pattern opportunities...');

  // Mock context for CLI usage
  const context = {
    codeContent: `
      function createUser(type) {
        switch(type) {
          case 'admin': return new AdminUser();
          case 'regular': return new RegularUser();
          case 'guest': return new GuestUser();
        }
      }
      
      function handleEvent(eventType, data) {
        if (eventType === 'user_created') {
          sendEmail(data);
          logActivity(data);
          updateStats(data);
        }
      }
      
      function processPayment(method, amount) {
        if (method === 'credit_card') {
          return processCreditCard(amount);
        } else if (method === 'paypal') {
          return processPaypal(amount);
        } else if (method === 'bank_transfer') {
          return processBankTransfer(amount);
        }
      }
    `
  };

  const opportunities = await patternCatalog.identifyOpportunities(context);

  console.log('\n💡 PATTERN OPPORTUNITIES');
  console.log('========================');

  if (opportunities.length === 0) {
    console.log('No pattern opportunities identified');
    return;
  }

  opportunities.forEach(opportunity => {
    const confidenceIcon = getConfidenceIcon(opportunity.confidence);
    console.log(`${confidenceIcon} ${opportunity.pattern} (${opportunity.confidence}% confidence)`);
    console.log(`   Description: ${opportunity.description}`);
    console.log(`   Recommendation: ${opportunity.recommendation}`);
    console.log('');
  });

  // Update tracking
  await patternCatalog.updateTracking({
    type: 'opportunity_analysis',
    opportunities_identified: opportunities.length,
    timestamp: new Date().toISOString(),
    opportunities: opportunities
  });
}

async function calculateHealth(patternCatalog) {
  console.log('📊 Calculating pattern health score...');

  const healthScore = await patternCatalog.calculateHealthScore();

  console.log('\n📊 PATTERN HEALTH REPORT');
  console.log('========================');

  const healthIcon = getHealthIcon(healthScore.overall_score);
  console.log(`${healthIcon} Overall Health Score: ${healthScore.overall_score}/100`);
  console.log('');

  console.log('📈 Metrics:');
  console.log(`  🎯 Detected Patterns: ${healthScore.detected_patterns}`);
  console.log(`  🚨 Violations: ${healthScore.violations}`);
  console.log(`  💡 Opportunities: ${healthScore.opportunities}`);
  console.log('');

  if (healthScore.recommendations && healthScore.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    healthScore.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }

  // Update tracking
  await patternCatalog.updateTracking({
    type: 'health_calculation',
    health_score: healthScore.overall_score,
    timestamp: new Date().toISOString(),
    health_data: healthScore
  });
}

async function listPatterns(patternCatalog) {
  console.log('📋 Available Architectural Patterns:');
  console.log('===================================');

  const patterns = patternCatalog.patterns;

  if (patterns.length === 0) {
    console.log('No patterns loaded');
    return;
  }

  // Group by category
  const categories = {};
  patterns.forEach(pattern => {
    if (!categories[pattern.category]) {
      categories[pattern.category] = [];
    }
    categories[pattern.category].push(pattern);
  });

  Object.keys(categories).forEach(category => {
    console.log(`\n📂 ${category} Patterns:`);
    categories[category].forEach(pattern => {
      console.log(`  🔹 ${pattern.name}`);
      console.log(`     ${pattern.description}`);
      console.log(`     Benefits: ${pattern.benefits.join(', ')}`);
      console.log(`     Drawbacks: ${pattern.drawbacks.join(', ')}`);
      console.log('');
    });
  });
}

function getConfidenceIcon(confidence) {
  if (confidence >= 80) return '🟢';
  if (confidence >= 60) return '🟡';
  if (confidence >= 40) return '🟠';
  return '🔴';
}

function getQualityIcon(quality) {
  switch (quality) {
  case 'good': return '✅';
  case 'partial': return '⚠️';
  case 'poor': return '❌';
  default: return '❓';
  }
}

function getSeverityIcon(severity) {
  switch (severity) {
  case 'critical': return '🚨';
  case 'high': return '🔴';
  case 'medium': return '🟡';
  case 'low': return '🟢';
  default: return '❓';
  }
}

function getHealthIcon(score) {
  if (score >= 80) return '💚';
  if (score >= 60) return '💛';
  if (score >= 40) return '🧡';
  return '❤️';
}

function showHelp() {
  console.log(`
🏗️ Architecture Agent Pattern Analysis CLI Tool

Usage: node patterns.js <command>

Commands:
  analyze        Analyze architectural patterns in the codebase
  violations     Check for pattern violations
  opportunities  Identify pattern implementation opportunities
  health         Calculate pattern health score
  list           List all available patterns

Examples:
  node patterns.js analyze
  node patterns.js violations
  node patterns.js opportunities
  node patterns.js health
`);
}

// Run if called directly
if (require.main === module) {
  const [,, command, ...args] = process.argv;

  if (!command) {
    showHelp();
    process.exit(1);
  }

  runPatternsCommand(command, ...args);
}

module.exports = { runPatternsCommand };
