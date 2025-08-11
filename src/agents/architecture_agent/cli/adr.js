#!/usr/bin/env node
/**
 * Architecture Agent CLI ADR Tool
 * 
 * Provides command-line interface for managing Architecture Decision Records
 */

const path = require('path');
const ADRManager = require('../modules/adr_manager');

// Mock Architecture Agent for CLI usage
class MockArchAgent {
  constructor() {
    this.config = {
      projectRoot: path.resolve(__dirname, '../../../..')
    };
  }
}

async function runADRCommand(command, ...args) {
  console.log('🏗️ Leonardo (Architect) - ADR Management Tool');
  console.log('==========================================');
  
  try {
    const archAgent = new MockArchAgent();
    const adrManager = new ADRManager(archAgent);
    
    await adrManager.initialize();
    
    switch (command) {
      case 'create':
        await createADR(adrManager, args[0]);
        break;
      case 'list':
        await listADRs(adrManager);
        break;
      case 'status':
        await showADRStatus(adrManager);
        break;
      case 'accept':
        await updateADRStatus(adrManager, args[0], 'Accepted', args[1]);
        break;
      case 'reject':
        await updateADRStatus(adrManager, args[0], 'Rejected', args[1]);
        break;
      case 'search':
        await searchADRs(adrManager, args[0]);
        break;
      case 'show':
        await showADR(adrManager, args[0]);
        break;
      default:
        showHelp();
    }
    
  } catch (error) {
    console.error('❌ ADR command failed:', error.message);
    process.exit(1);
  }
}

async function createADR(adrManager, title) {
  if (!title) {
    console.error('❌ Title is required for creating an ADR');
    console.log('Usage: adr.js create "Decision Title"');
    return;
  }
  
  console.log(`📝 Creating new ADR: ${title}`);
  
  // Interactive ADR creation (simplified for CLI)
  const adrData = {
    title: title,
    context: `Context for ${title}\n\nThis ADR addresses the architectural decision regarding ${title}. The context includes the current situation, requirements, and constraints that led to this decision.`,
    decision: `Decision: ${title}\n\nAfter careful consideration of the alternatives and trade-offs, we have decided to proceed with this architectural approach.`,
    consequences: `Consequences of ${title}\n\nPositive consequences:\n- Improved system architecture\n- Better maintainability\n- Enhanced performance\n\nNegative consequences:\n- Implementation complexity\n- Learning curve\n- Migration effort`,
    alternatives: [
      {
        title: 'Alternative 1: Status Quo',
        description: 'Continue with current approach',
        pros: ['No change required', 'Familiar to team'],
        cons: ['Technical debt accumulation', 'Limited scalability']
      }
    ],
    stakeholders: ['Development Team', 'Architecture Team', 'Product Team']
  };
  
  const adr = await adrManager.createADR(adrData);
  
  console.log(`✅ ADR-${adr.id.toString().padStart(4, '0')} created successfully`);
  console.log(`📄 Document saved to: docs/architecture/adrs/`);
  console.log(`📋 Status: ${adr.status}`);
}

async function listADRs(adrManager) {
  console.log('📋 Architecture Decision Records:');
  console.log('================================');
  
  const status = await adrManager.getStatus();
  
  if (status.total_adrs === 0) {
    console.log('No ADRs found');
    return;
  }
  
  console.log(`Total ADRs: ${status.total_adrs}`);
  console.log('');
  
  // Show recent ADRs
  if (status.recent_adrs && status.recent_adrs.length > 0) {
    console.log('Recent ADRs:');
    status.recent_adrs.forEach(adr => {
      const statusIcon = getStatusIcon(adr.status);
      console.log(`${statusIcon} ADR-${adr.id.toString().padStart(4, '0')}: ${adr.title}`);
      console.log(`   Status: ${adr.status} | Date: ${new Date(adr.date).toLocaleDateString()}`);
    });
  }
}

async function showADRStatus(adrManager) {
  console.log('📊 ADR Status Summary:');
  console.log('=====================');
  
  const status = await adrManager.getStatus();
  
  console.log(`Total ADRs: ${status.total_adrs}`);
  console.log('');
  console.log('By Status:');
  console.log(`  📝 Proposed: ${status.by_status.proposed}`);
  console.log(`  ✅ Accepted: ${status.by_status.accepted}`);
  console.log(`  ❌ Rejected: ${status.by_status.rejected}`);
  console.log(`  🔄 Superseded: ${status.by_status.superseded}`);
  
  if (status.by_status.proposed > 0) {
    console.log('');
    console.log(`⚠️  ${status.by_status.proposed} ADR(s) pending approval`);
  }
}

async function updateADRStatus(adrManager, adrId, newStatus, reason) {
  if (!adrId) {
    console.error('❌ ADR ID is required');
    console.log('Usage: adr.js accept|reject <adr_id> [reason]');
    return;
  }
  
  const id = parseInt(adrId);
  if (isNaN(id)) {
    console.error('❌ Invalid ADR ID');
    return;
  }
  
  console.log(`🔄 Updating ADR-${id.toString().padStart(4, '0')} status to: ${newStatus}`);
  
  const adr = await adrManager.updateADRStatus(id, newStatus, reason || `Status updated via CLI`);
  
  const statusIcon = getStatusIcon(newStatus);
  console.log(`${statusIcon} ADR-${adr.id.toString().padStart(4, '0')}: ${adr.title}`);
  console.log(`   Status: ${adr.status}`);
  if (reason) {
    console.log(`   Reason: ${reason}`);
  }
}

async function searchADRs(adrManager, query) {
  if (!query) {
    console.error('❌ Search query is required');
    console.log('Usage: adr.js search "search term"');
    return;
  }
  
  console.log(`🔍 Searching ADRs for: "${query}"`);
  console.log('==============================');
  
  const results = await adrManager.searchADRs(query);
  
  if (results.length === 0) {
    console.log('No ADRs found matching the search criteria');
    return;
  }
  
  console.log(`Found ${results.length} matching ADR(s):`);
  console.log('');
  
  results.forEach(adr => {
    const statusIcon = getStatusIcon(adr.status);
    console.log(`${statusIcon} ADR-${adr.id.toString().padStart(4, '0')}: ${adr.title}`);
    console.log(`   Status: ${adr.status} | Date: ${new Date(adr.date).toLocaleDateString()}`);
    if (adr.context) {
      const preview = adr.context.substring(0, 100) + (adr.context.length > 100 ? '...' : '');
      console.log(`   Preview: ${preview}`);
    }
    console.log('');
  });
}

async function showADR(adrManager, adrId) {
  if (!adrId) {
    console.error('❌ ADR ID is required');
    console.log('Usage: adr.js show <adr_id>');
    return;
  }
  
  const id = parseInt(adrId);
  if (isNaN(id)) {
    console.error('❌ Invalid ADR ID');
    return;
  }
  
  const adr = await adrManager.getADRById(id);
  
  if (!adr) {
    console.error(`❌ ADR-${id.toString().padStart(4, '0')} not found`);
    return;
  }
  
  console.log(`📄 ADR-${adr.id.toString().padStart(4, '0')}: ${adr.title}`);
  console.log('='.repeat(50));
  console.log(`Status: ${adr.status}`);
  console.log(`Date: ${new Date(adr.date).toLocaleDateString()}`);
  console.log(`Stakeholders: ${adr.stakeholders ? adr.stakeholders.join(', ') : 'Not specified'}`);
  console.log('');
  
  if (adr.context) {
    console.log('Context:');
    console.log(adr.context);
    console.log('');
  }
  
  if (adr.decision) {
    console.log('Decision:');
    console.log(adr.decision);
    console.log('');
  }
  
  if (adr.consequences) {
    console.log('Consequences:');
    console.log(adr.consequences);
    console.log('');
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Proposed': return '📝';
    case 'Accepted': return '✅';
    case 'Rejected': return '❌';
    case 'Superseded': return '🔄';
    default: return '❓';
  }
}

function showHelp() {
  console.log(`
🏗️ Leonardo (Architect) ADR CLI Tool

Usage: node adr.js <command> [options]

Commands:
  create <title>           Create a new ADR
  list                     List all ADRs
  status                   Show ADR status summary
  accept <id> [reason]     Accept an ADR
  reject <id> [reason]     Reject an ADR
  search <query>           Search ADRs by title/content
  show <id>                Show detailed ADR information

Examples:
  node adr.js create "Microservices Architecture"
  node adr.js list
  node adr.js accept 1 "Approved by architecture team"
  node adr.js reject 2 "Security concerns identified"
  node adr.js search "database"
  node adr.js show 1
`);
}

// Run if called directly
if (require.main === module) {
  const [,, command, ...args] = process.argv;
  
  if (!command) {
    showHelp();
    process.exit(1);
  }
  
  runADRCommand(command, ...args);
}

module.exports = { runADRCommand };
