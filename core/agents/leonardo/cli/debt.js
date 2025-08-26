#!/usr/bin/env node
/**
 * Architecture Agent CLI Technical Debt Tool
 *
 * Provides command-line interface for technical debt analysis and management
 */

const path = require('path');
const TechDebtTracker = require('../modules/tech_debt_tracker');

// Mock Architecture Agent for CLI usage
class MockArchAgent {
  constructor() {
    this.config = {
      projectRoot: path.resolve(__dirname, '../../../..')
    };
  }
}

async function runDebtCommand(command, ...args) {
  console.log('🏗️ Architecture Agent - Technical Debt Tool');
  console.log('==========================================');

  try {
    const archAgent = new MockArchAgent();
    const debtTracker = new TechDebtTracker(archAgent);

    await debtTracker.initialize();

    switch (command) {
    case 'scan':
      await scanDebt(debtTracker);
      break;
    case 'summary':
      await showSummary(debtTracker);
      break;
    case 'plan':
      await createPlan(debtTracker);
      break;
    case 'priority':
      await showPriority(debtTracker);
      break;
    case 'category':
      await showByCategory(debtTracker, args[0]);
      break;
    default:
      showHelp();
    }

  } catch (error) {
    console.error('❌ Technical debt analysis failed:', error.message);
    process.exit(1);
  }
}

async function scanDebt(debtTracker) {
  console.log('🔍 Scanning for technical debt...');

  // Mock context for CLI usage
  const context = {
    files: [
      'archive/legacy/old-user-manager.js',
      'core/models/user.js',
      'platform/controllers/auth.js',
      'shared/utils/helper.js',
      'test/user.test.js',
      'docs/README.md'
    ],
    codeContent: `
      // Long method example
      function processUserData(userData) {
        // 60+ lines of complex logic
        if (userData.type === 'admin') {
          // Complex admin logic
          for (let i = 0; i < userData.permissions.length; i++) {
            if (userData.permissions[i].level > 5) {
              // More nested logic
              switch (userData.permissions[i].type) {
                case 'read':
                  // Handle read permission
                  break;
                case 'write':
                  // Handle write permission
                  break;
                case 'delete':
                  // Handle delete permission
                  break;
              }
            }
          }
        }
        // ... many more lines
        return processedData;
      }
      
      // Duplicate code example
      function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }
      
      function checkEmailFormat(emailAddress) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailAddress);
      }
      
      // Magic numbers
      const maxRetries = 3;
      const timeout = 5000;
      const bufferSize = 1024;
      if (attempts > 10) {
        throw new Error('Too many attempts');
      }
    `
  };

  const debtItems = await debtTracker.identifyDebtItems(context);

  console.log('\n💳 TECHNICAL DEBT SCAN RESULTS');
  console.log('==============================');

  if (debtItems.length === 0) {
    console.log('✅ No technical debt items detected');
    return;
  }

  console.log(`Found ${debtItems.length} technical debt item(s):`);
  console.log('');

  debtItems.forEach((item, index) => {
    const severityIcon = getSeverityIcon(item.severity);
    const effortIcon = getEffortIcon(item.effort);
    const priorityIcon = getPriorityIcon(item.priority);

    console.log(`${severityIcon} ${item.title}`);
    console.log(`   Category: ${item.category} | Severity: ${item.severity} ${effortIcon} Effort: ${item.effort}`);
    console.log(`   ${priorityIcon} Priority Score: ${item.priority}`);
    console.log(`   Description: ${item.description}`);
    if (item.location) {
      console.log(`   Location: ${item.location}`);
    }
    console.log(`   Remediation: ${item.remediation}`);
    console.log('');
  });

  // Update tracking
  await debtTracker.updateTracking({
    type: 'debt_scan',
    items_found: debtItems.length,
    timestamp: new Date().toISOString(),
    debt_items: debtItems
  });
}

async function showSummary(debtTracker) {
  console.log('📊 Technical Debt Summary:');
  console.log('==========================');

  const totalDebt = await debtTracker.calculateTotalDebt();
  const status = await debtTracker.getStatus();

  console.log(`📊 Total Debt Items: ${totalDebt.total_items}`);
  console.log(`🚨 High Severity Items: ${totalDebt.high_severity_items}`);
  console.log(`⏱️  Estimated Effort: ${totalDebt.estimated_hours} hours (${totalDebt.estimated_days} days)`);
  console.log(`📈 Debt Ratio: ${totalDebt.debt_ratio.toFixed(1)}%`);
  console.log('');

  if (status.by_category && status.by_category.length > 0) {
    console.log('📂 By Category:');
    status.by_category.forEach(cat => {
      const categoryIcon = getCategoryIcon(cat.category);
      console.log(`   ${categoryIcon} ${cat.category}: ${cat.count} items`);
    });
    console.log('');
  }

  if (status.top_priority_items && status.top_priority_items.length > 0) {
    console.log('⚡ Top Priority Items:');
    status.top_priority_items.forEach((item, index) => {
      const severityIcon = getSeverityIcon(item.severity);
      console.log(`   ${index + 1}. ${severityIcon} ${item.title} (Priority: ${item.priority})`);
    });
  }
}

async function createPlan(debtTracker) {
  console.log('📋 Creating Technical Debt Remediation Plan...');

  const plan = await debtTracker.createRemediationPlan();

  console.log('\n📋 REMEDIATION PLAN');
  console.log('==================');

  if (plan.immediate_actions && plan.immediate_actions.length > 0) {
    console.log('🚨 Immediate Actions (High Priority):');
    plan.immediate_actions.forEach((item, index) => {
      const severityIcon = getSeverityIcon(item.severity);
      console.log(`   ${index + 1}. ${severityIcon} ${item.title}`);
      console.log(`      Effort: ${item.effort} | Priority: ${item.priority}`);
      console.log(`      ${item.remediation}`);
      console.log('');
    });
  }

  if (plan.short_term && plan.short_term.length > 0) {
    console.log('📅 Short Term (Next Sprint):');
    plan.short_term.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.effort} effort)`);
    });
    console.log('');
  }

  if (plan.long_term && plan.long_term.length > 0) {
    console.log('🗓️  Long Term (Future Sprints):');
    plan.long_term.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.effort} effort)`);
    });
    console.log('');
  }

  if (plan.estimated_timeline && plan.estimated_timeline.length > 0) {
    console.log('⏱️  Estimated Timeline:');
    plan.estimated_timeline.slice(0, 5).forEach(timeline => {
      console.log(`   Week ${timeline.start_week}-${timeline.end_week}: ${timeline.item}`);
    });
  }
}

async function showPriority(debtTracker) {
  console.log('⚡ High Priority Technical Debt Items:');
  console.log('====================================');

  const status = await debtTracker.getStatus();

  if (!status.top_priority_items || status.top_priority_items.length === 0) {
    console.log('✅ No high priority debt items found');
    return;
  }

  status.top_priority_items.forEach((item, index) => {
    const severityIcon = getSeverityIcon(item.severity);
    const priorityIcon = getPriorityIcon(item.priority);

    console.log(`${index + 1}. ${severityIcon} ${item.title}`);
    console.log(`   ${priorityIcon} Priority Score: ${item.priority}`);
    console.log(`   Severity: ${item.severity}`);
    console.log('');
  });

  console.log('💡 Recommendation: Address these items first to maximize impact');
}

async function showByCategory(debtTracker, category) {
  if (!category) {
    console.log('📂 Technical Debt by Category:');
    console.log('=============================');

    const categorized = debtTracker.categorizeDebt();

    Object.keys(categorized).forEach(cat => {
      const categoryIcon = getCategoryIcon(cat);
      const items = categorized[cat];
      console.log(`${categoryIcon} ${cat}: ${items.length} items`);

      if (items.length > 0) {
        items.slice(0, 3).forEach(item => {
          const severityIcon = getSeverityIcon(item.severity);
          console.log(`   ${severityIcon} ${item.title}`);
        });
        if (items.length > 3) {
          console.log(`   ... and ${items.length - 3} more`);
        }
      }
      console.log('');
    });

    console.log('Use: debt.js category <category_name> to see details for a specific category');
    return;
  }

  console.log(`📂 ${category} Technical Debt:${category}`);
  console.log('='.repeat(30 + category.length));

  const categorized = debtTracker.categorizeDebt();
  const items = categorized[category] || [];

  if (items.length === 0) {
    console.log(`No debt items found in category: ${category}`);
    return;
  }

  items.forEach((item, index) => {
    const severityIcon = getSeverityIcon(item.severity);
    const effortIcon = getEffortIcon(item.effort);

    console.log(`${index + 1}. ${severityIcon} ${item.title}`);
    console.log(`   Severity: ${item.severity} ${effortIcon} Effort: ${item.effort}`);
    console.log(`   ${item.description}`);
    console.log(`   Remediation: ${item.remediation}`);
    console.log('');
  });
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

function getEffortIcon(effort) {
  switch (effort) {
  case 'high': return '🏋️';
  case 'medium': return '💪';
  case 'low': return '👌';
  default: return '❓';
  }
}

function getPriorityIcon(priority) {
  if (priority >= 15) return '🔥';
  if (priority >= 10) return '⚡';
  if (priority >= 5) return '📌';
  return '📋';
}

function getCategoryIcon(category) {
  switch (category) {
  case 'code_quality': return '🔧';
  case 'architecture': return '🏗️';
  case 'documentation': return '📚';
  case 'testing': return '🧪';
  case 'performance': return '⚡';
  case 'security': return '🔒';
  case 'dependencies': return '📦';
  case 'design': return '🎨';
  default: return '📂';
  }
}

function showHelp() {
  console.log(`
🏗️ Architecture Agent Technical Debt CLI Tool

Usage: node debt.js <command> [options]

Commands:
  scan                    Scan for technical debt items
  summary                 Show technical debt summary
  plan                    Create remediation plan
  priority                Show high priority debt items
  category [category]     Show debt items by category

Categories:
  code_quality, architecture, documentation, testing,
  performance, security, dependencies, design

Examples:
  node debt.js scan
  node debt.js summary
  node debt.js plan
  node debt.js priority
  node debt.js category code_quality
`);
}

// Run if called directly
if (require.main === module) {
  const [,, command, ...args] = process.argv;

  if (!command) {
    showHelp();
    process.exit(1);
  }

  runDebtCommand(command, ...args);
}

module.exports = { runDebtCommand };
