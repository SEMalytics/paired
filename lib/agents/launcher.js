#!/usr/bin/env node
/**
 * PAIRED Agent Launcher
 *
 * Launches individual PAIRED agents or all agents in a single process.
 * Used by start-agents.sh to manage agent lifecycle.
 */

const path = require('path');
const fs = require('fs');

// Proper daemon mode setup - Node.js v23 compatible
if (process.stdin.isTTY) {
  process.stdin.end();
}

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Agent launcher received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Agent launcher received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Import agent classes
const AgentFactory = require('../core/agents/agent_factory');

class AgentLauncher {
  constructor() {
    this.agents = new Map();
    this.factory = null;
  }

  async initialize() {
    console.log('🚀 PAIRED Agent Launcher starting...');

    // Create minimal orchestrator for standalone mode
    const SharedMemorySystem = require('../core/infrastructure/shared_memory');
    const minimalOrchestrator = {
      memoryManager: new SharedMemorySystem(),
      notificationSystem: null,
      claudeCodeIntegration: null
    };

    // Initialize consolidated agent factory with minimal orchestrator
    this.factory = new AgentFactory(minimalOrchestrator);
    await this.factory.loadAgentConfigurations();

    console.log('✅ Agent Launcher initialized');
  }

  async launchAgent(agentId) {
    try {
      console.log(`🔧 Launching agent: ${agentId}`);

      const agent = await this.factory.createAgent(agentId);
      this.agents.set(agentId, agent);

      // Create PID file for status monitoring
      this.createPidFile(agentId);

      console.log(`✅ Agent ${agentId} launched successfully`);
      return agent;
    } catch (error) {
      console.error(`❌ Failed to launch agent ${agentId}:`, error.message);
      throw error;
    }
  }

  createPidFile(agentId) {
    try {
      const pidDir = path.join(process.env.HOME, '.paired', 'pids');
      const pidFile = path.join(pidDir, `agent_${agentId}.pid`);
      
      // Ensure PID directory exists
      if (!fs.existsSync(pidDir)) {
        fs.mkdirSync(pidDir, { recursive: true });
      }
      
      // Write current process PID to file
      fs.writeFileSync(pidFile, process.pid.toString());
      console.log(`📝 Created PID file: ${pidFile} (PID: ${process.pid})`);
    } catch (error) {
      console.warn(`⚠️  Failed to create PID file for ${agentId}:`, error.message);
    }
  }

  removePidFile(agentId) {
    try {
      const pidFile = path.join(process.env.HOME, '.paired', 'pids', `agent_${agentId}.pid`);
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
        console.log(`🗑️  Removed PID file: ${pidFile}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to remove PID file for ${agentId}:`, error.message);
    }
  }

  async launchAllAgents() {
    console.log('🚀 Launching all PAIRED agents...');

    const agentIds = ['alex', 'sherlock', 'edison', 'leonardo', 'maya', 'vince', 'marie'];
    const results = [];

    for (const agentId of agentIds) {
      try {
        await this.launchAgent(agentId);
        results.push({ agentId, status: 'success' });
      } catch (error) {
        results.push({ agentId, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`🎯 Launched ${successCount}/${agentIds.length} agents successfully`);

    return results;
  }

  async shutdown() {
    console.log('🛑 Shutting down agents...');

    // Remove PID files for all agents
    for (const agentId of this.agents.keys()) {
      this.removePidFile(agentId);
    }

    if (this.factory) {
      await this.factory.shutdownAllAgents();
    }

    console.log('✅ All agents shut down');
  }
}

// CLI handling
async function main() {
  const launcher = new AgentLauncher();

  try {
    await launcher.initialize();

    const args = process.argv.slice(2);

    if (args.includes('--all')) {
      await launcher.launchAllAgents();
    } else if (args.includes('--agent')) {
      const agentIndex = args.indexOf('--agent');
      const agentId = args[agentIndex + 1];

      if (!agentId) {
        console.error('❌ Agent ID required with --agent flag');
        process.exit(1);
      }

      await launcher.launchAgent(agentId);
    } else {
      console.log('PAIRED Agent Launcher');
      console.log('Usage:');
      console.log('  node agent_launcher.js --all              # Launch all agents');
      console.log('  node agent_launcher.js --agent <id>       # Launch specific agent');
      process.exit(0);
    }

    // Keep process alive indefinitely
    console.log('🔄 Agents running in background. Press Ctrl+C to stop.');

    process.on('SIGTERM', async () => {
      console.log('📡 Received SIGTERM, shutting down...');
      await launcher.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📡 Received SIGINT, shutting down...');
      await launcher.shutdown();
      process.exit(0);
    });

    // Keep the process alive with multiple mechanisms
    setInterval(() => {
      // Heartbeat to keep process running
    }, 30000);
    
    // Additional keep-alive mechanism
    process.stdin.resume();
    
    // Prevent process from exiting
    process.on('beforeExit', (code) => {
      console.log('🔄 Process attempting to exit, keeping alive...');
    });

  } catch (error) {
    console.error('❌ Agent Launcher failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AgentLauncher;
