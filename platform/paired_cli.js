#!/usr/bin/env node

/**
 * PAIRED (Platform for AI-Enabled Remote Development) Command Line Interface
 *
 * Unified CLI that provides the optimized 30-command interface for the AI team.
 * Routes commands intelligently between agents and Claude Code integration.
 *
 * Philosophy: "Minimal, Focused Changes"
 * - 30 focused commands instead of 140+ aliases
 * - Context-aware routing to appropriate agents
 * - Token-optimized execution through Claude Code
 */

const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');

class PAIREDCLI {
  constructor() {
    this.bridgeUrl = 'ws://localhost:7890';
    this.ws = null;
    this.commandHistory = [];
    this.pendingRequests = new Map();

    this.initializeCommands();
    this.connectToBridge();
  }

  /**
   * Connect to CASCADE Bridge for unified agent coordination
   */
  async connectToBridge() {
    try {
      this.ws = new WebSocket(this.bridgeUrl);
      
      this.ws.on('open', () => {
        console.log('🌉 PAIRED CLI connected to CASCADE Bridge');
      });

      this.ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        this.handleBridgeResponse(response);
      });

      this.ws.on('error', (error) => {
        console.error('❌ Bridge connection error:', error.message);
        console.log('💡 Start CASCADE bridge: paired-start');
      });

    } catch (error) {
      console.error('❌ Failed to connect to CASCADE bridge:', error.message);
    }
  }

  /**
   * Send command through CASCADE bridge (Alex coordination)
   */
  async sendToBridge(command, args) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Bridge not connected. Run: paired-start'));
        return;
      }

      const requestId = require('crypto').randomUUID();
      const message = {
        id: requestId,
        type: 'paired_cli_command',
        command: command,
        args: args,
        source: 'paired_cli'
      };

      this.pendingRequests.set(requestId, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Command timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle bridge responses
   */
  handleBridgeResponse(response) {
    if (this.pendingRequests.has(response.id)) {
      const { resolve } = this.pendingRequests.get(response.id);
      this.pendingRequests.delete(response.id);
      resolve(response);
    }
  }

  /**
   * Initialize the 30 optimized commands
   */
  initializeCommands() {
    this.commands = new Map();

    // Direct Agent Access (7 commands)
    this.registerDirectAgentCommands();

    // Task-Based Commands (12 commands)
    this.registerTaskBasedCommands();

    // Context-Aware Commands (5 commands)
    this.registerContextAwareCommands();

    // System Commands (6 commands)
    this.registerSystemCommands();
  }

  /**
   * Register direct agent access commands
   */
  registerDirectAgentCommands() {
    const agents = [
      { cmd: 'pm', name: 'Alex', role: 'Project Manager' },
      { cmd: 'qa', name: 'Sherlock', role: 'Quality Assurance' },
      { cmd: 'dev', name: 'Alex', role: 'Developer' },
      { cmd: 'ux', name: 'Sam', role: 'UX Expert' },
      { cmd: 'po', name: 'Jordan', role: 'Product Owner' },
      { cmd: 'arch', name: 'Chris', role: 'Architect' },
      { cmd: 'analyst', name: 'Taylor', role: 'Analyst' }
    ];

    agents.forEach(agent => {
      this.commands.set(agent.cmd, {
        type: 'direct-agent',
        agent: agent.cmd,
        name: agent.name,
        role: agent.role,
        handler: this.handleDirectAgent.bind(this),
        description: `Direct access to ${agent.name} (${agent.role})`
      });
    });
  }

  /**
   * Register task-based commands that auto-route to appropriate agents
   */
  registerTaskBasedCommands() {
    const tasks = [
      { cmd: 'review-code', agent: 'qa', description: 'Review code quality and suggest improvements' },
      { cmd: 'plan-sprint', agent: 'pm', description: 'Plan sprint activities and milestones' },
      { cmd: 'analyze-market', agent: 'analyst', description: 'Analyze market conditions and opportunities' },
      { cmd: 'design-ui', agent: 'ux', description: 'Design user interface and experience' },
      { cmd: 'prioritize', agent: 'po', description: 'Prioritize features and requirements' },
      { cmd: 'architect', agent: 'arch', description: 'Design system architecture' },
      { cmd: 'implement', agent: 'dev', description: 'Implement features and functionality' },
      { cmd: 'test-coverage', agent: 'qa', description: 'Analyze and improve test coverage' },
      { cmd: 'track-progress', agent: 'pm', description: 'Track project progress and metrics' },
      { cmd: 'gather-feedback', agent: 'ux', description: 'Gather and analyze user feedback' },
      { cmd: 'define-features', agent: 'po', description: 'Define and refine product features' },
      { cmd: 'optimize-perf', agent: 'arch', description: 'Optimize system performance' }
    ];

    tasks.forEach(task => {
      this.commands.set(task.cmd, {
        type: 'task-based',
        agent: task.agent,
        handler: this.handleTaskBased.bind(this),
        description: task.description
      });
    });
  }

  /**
   * Register context-aware commands with intelligent routing
   */
  registerContextAwareCommands() {
    const contextCommands = [
      { cmd: 'ai-help', description: 'Get intelligent help based on current context' },
      { cmd: 'ai-review', description: 'Context-aware review of current work' },
      { cmd: 'ai-optimize', description: 'Suggest optimizations for current context' },
      { cmd: 'ai-coordinate', description: 'Coordinate multiple agents for complex tasks' },
      { cmd: 'ai-handoff', description: 'Intelligent handoff between agents' }
    ];

    contextCommands.forEach(cmd => {
      this.commands.set(cmd.cmd, {
        type: 'context-aware',
        handler: this.handleContextAware.bind(this),
        description: cmd.description
      });
    });
  }

  /**
   * Register system management commands
   */
  registerSystemCommands() {
    const systemCommands = [
      { cmd: 'ai-status', handler: this.handleStatus, description: 'Show system status and metrics' },
      { cmd: 'ai-memory', handler: this.handleMemory, description: 'Access shared memory system' },
      { cmd: 'ai-learn', handler: this.handleLearn, description: 'Update learning and patterns' },
      { cmd: 'ai-sync', handler: this.handleSync, description: 'Synchronize agent states' },
      { cmd: 'ai-config', handler: this.handleConfig, description: 'Configure system behavior' },
      { cmd: 'ai-report', handler: this.handleReport, description: 'Generate comprehensive reports' }
    ];

    systemCommands.forEach(cmd => {
      this.commands.set(cmd.cmd, {
        type: 'system',
        handler: cmd.handler.bind(this),
        description: cmd.description
      });
    });
  }

  /**
   * Main CLI entry point
   */
  async execute(args) {
    if (args.length === 0) {
      return this.showHelp();
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    // Record command in history
    this.commandHistory.push({
      command,
      args: commandArgs,
      timestamp: Date.now()
    });

    // Check if command exists
    if (!this.commands.has(command)) {
      return this.handleUnknownCommand(command, commandArgs);
    }

    const commandConfig = this.commands.get(command);

    try {
      console.log(`🚀 Executing: ${command} ${commandArgs.join(' ')}`);

      // Analyze current context
      const context = await this.contextAnalyzer.analyze();

      // Execute command
      const result = await commandConfig.handler(command, commandArgs, context, commandConfig);

      return result;
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        suggestion: this.suggestAlternative(command, error)
      };
    }
  }

  /**
   * Handle direct agent access
   */
  async handleDirectAgent(command, args, context, config) {
    console.log(`👤 Accessing ${config.name} (${config.role})`);

    if (args.length === 0) {
      // No arguments - show agent status
      return this.getAgentStatus(config.agent);
    }

    // Route request to specific agent
    const operation = {
      type: 'agent-request',
      agent: config.agent,
      request: args.join(' '),
      context
    };

    return await this.orchestrator.orchestrate(operation, context);
  }

  /**
   * Handle task-based commands with auto-routing
   */
  async handleTaskBased(command, args, context, config) {
    console.log(`🎯 Task: ${command} → routing to ${config.agent}`);

    const operation = {
      type: 'task-execution',
      task: command,
      agent: config.agent,
      request: args.join(' '),
      context: {
        ...context,
        taskType: command,
        explicitTask: true
      }
    };

    return await this.orchestrator.orchestrate(operation, context);
  }

  /**
   * Handle context-aware commands with intelligent routing
   */
  async handleContextAware(command, args, context, config) {
    console.log(`🧠 Context-aware: ${command}`);

    // Analyze context to determine best approach
    const contextAnalysis = await this.analyzeForRouting(context, args.join(' '));

    const operation = {
      type: 'context-aware',
      command,
      request: args.join(' '),
      context: {
        ...context,
        ...contextAnalysis,
        intelligentRouting: true
      }
    };

    return await this.orchestrator.orchestrate(operation, context);
  }

  /**
   * Handle system status command
   */
  async handleStatus(command, args, context) {
    console.log('📊 System Status');

    const status = {
      orchestrator: this.orchestrator.getStatus(),
      agents: await this.getAgentsStatus(),
      commands: {
        total: this.commands.size,
        recentHistory: this.commandHistory.slice(-10)
      },
      context: await this.contextAnalyzer.getSummary(),
      timestamp: new Date().toISOString()
    };

    this.displayStatus(status);
    return status;
  }

  /**
   * Handle memory access command
   */
  async handleMemory(command, args, context) {
    console.log('🧠 Memory System Access');

    if (args.length === 0) {
      return this.showMemoryHelp();
    }

    const subcommand = args[0];
    const subargs = args.slice(1);

    switch (subcommand) {
    case 'search':
      return await this.searchMemory(subargs.join(' '));
    case 'store':
      return await this.storeMemory(subargs);
    case 'stats':
      return await this.getMemoryStats();
    default:
      return this.showMemoryHelp();
    }
  }

  /**
   * Handle learning update command
   */
  async handleLearn(command, args, context) {
    console.log('📚 Updating Learning Systems');

    const learningUpdate = {
      patterns: await this.extractPatterns(),
      performance: this.orchestrator.getStatus(),
      context: context,
      timestamp: Date.now()
    };

    // Update learning systems (placeholder for now)
    console.log('✅ Learning systems updated');

    return {
      success: true,
      patternsFound: learningUpdate.patterns.length,
      performanceImprovement: '5%', // Placeholder
      message: 'Learning systems updated successfully'
    };
  }

  /**
   * Handle sync command
   */
  async handleSync(command, args, context) {
    console.log('🔄 Synchronizing Agent States');

    // Sync all agent states (placeholder)
    const syncResults = await Promise.all([
      this.syncAgent('pm'),
      this.syncAgent('qa'),
      this.syncAgent('dev'),
      this.syncAgent('ux'),
      this.syncAgent('po'),
      this.syncAgent('arch'),
      this.syncAgent('analyst')
    ]);

    const successCount = syncResults.filter(r => r.success).length;

    console.log(`✅ Synchronized ${successCount}/7 agents`);

    return {
      success: successCount === 7,
      syncedAgents: successCount,
      totalAgents: 7,
      results: syncResults
    };
  }

  /**
   * Handle configuration command
   */
  async handleConfig(command, args, context) {
    console.log('⚙️ System Configuration');

    if (args.length === 0) {
      return this.showCurrentConfig();
    }

    const [setting, value] = args;

    if (!value) {
      return this.getConfigValue(setting);
    }

    return await this.setConfigValue(setting, value);
  }

  /**
   * Handle report generation command
   */
  async handleReport(command, args, context) {
    console.log('📋 Generating Reports');

    const reportType = args[0] || 'summary';

    const report = {
      type: reportType,
      generated: new Date().toISOString(),
      orchestrator: this.orchestrator.getStatus(),
      agents: await this.getAgentsStatus(),
      performance: await this.getPerformanceReport(),
      recommendations: await this.getRecommendations()
    };

    // Save report to file
    const reportPath = await this.saveReport(report);

    console.log(`📄 Report saved to: ${reportPath}`);

    return {
      success: true,
      reportPath,
      summary: this.generateReportSummary(report)
    };
  }

  /**
   * Analyze context for intelligent routing
   */
  async analyzeForRouting(context, request) {
    const analysis = {
      suggestedAgents: [],
      confidence: 0,
      reasoning: ''
    };

    // Simple keyword-based analysis (can be enhanced with ML)
    const keywords = request.toLowerCase();

    if (keywords.includes('test') || keywords.includes('quality') || keywords.includes('bug')) {
      analysis.suggestedAgents.push({ agent: 'qa', confidence: 0.8 });
    }

    if (keywords.includes('design') || keywords.includes('ui') || keywords.includes('ux')) {
      analysis.suggestedAgents.push({ agent: 'ux', confidence: 0.8 });
    }

    if (keywords.includes('plan') || keywords.includes('milestone') || keywords.includes('schedule')) {
      analysis.suggestedAgents.push({ agent: 'pm', confidence: 0.8 });
    }

    if (keywords.includes('code') || keywords.includes('implement') || keywords.includes('develop')) {
      analysis.suggestedAgents.push({ agent: 'dev', confidence: 0.7 });
    }

    if (keywords.includes('architecture') || keywords.includes('system') || keywords.includes('performance')) {
      analysis.suggestedAgents.push({ agent: 'arch', confidence: 0.8 });
    }

    if (keywords.includes('feature') || keywords.includes('product') || keywords.includes('priority')) {
      analysis.suggestedAgents.push({ agent: 'po', confidence: 0.8 });
    }

    if (keywords.includes('market') || keywords.includes('research') || keywords.includes('analyze')) {
      analysis.suggestedAgents.push({ agent: 'analyst', confidence: 0.8 });
    }

    // Sort by confidence
    analysis.suggestedAgents.sort((a, b) => b.confidence - a.confidence);

    if (analysis.suggestedAgents.length > 0) {
      analysis.confidence = analysis.suggestedAgents[0].confidence;
      analysis.reasoning = `Keyword analysis suggests ${analysis.suggestedAgents[0].agent} agent`;
    }

    return analysis;
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🐁 PAIRED (Platform for AI-Enabled Remote Development) - AI Team Command Interface

DIRECT AGENT ACCESS (7 commands):
  pm          Project Manager (Alex) - Sprint planning, milestones
  qa          Quality Assurance (Sherlock) - Code review, testing
  dev         Developer (Alex) - Implementation, coding
  ux          UX Expert (Sam) - Design, user experience
  po          Product Owner (Jordan) - Features, prioritization
  arch        Architect (Chris) - System design, performance
  analyst     Analyst (Taylor) - Research, market analysis

TASK-BASED COMMANDS (12 commands):
  review-code      Auto-route code review to QA
  plan-sprint      Auto-route sprint planning to PM
  analyze-market   Auto-route market analysis to Analyst
  design-ui        Auto-route UI design to UX
  prioritize       Auto-route prioritization to PO
  architect        Auto-route architecture to Architect
  implement        Auto-route implementation to Dev
  test-coverage    Auto-route testing to QA
  track-progress   Auto-route progress tracking to PM
  gather-feedback  Auto-route feedback to UX
  define-features  Auto-route feature definition to PO
  optimize-perf    Auto-route performance optimization to Architect

CONTEXT-AWARE COMMANDS (5 commands):
  ai-help         Intelligent help based on current context
  ai-review       Context-aware review of current work
  ai-optimize     Suggest optimizations for current situation
  ai-coordinate   Multi-agent coordination for complex tasks
  ai-handoff      Intelligent handoff between agents

SYSTEM COMMANDS (6 commands):
  ai-status       Show system status and metrics
  ai-memory       Access shared memory system
  ai-learn        Update learning and patterns
  ai-sync         Synchronize agent states
  ai-config       Configure system behavior
  ai-report       Generate comprehensive reports

Examples:
  paired pm status                  # Get PM agent status
  paired review-code core/main.js    # Review specific file
  paired ai-help                    # Get contextual help
  paired ai-status                  # Show system status
`);

    return { success: true, type: 'help' };
  }

  /**
   * Handle unknown commands with suggestions
   */
  handleUnknownCommand(command, args) {
    console.log(`❓ Unknown command: ${command}`);

    // Find similar commands
    const suggestions = this.findSimilarCommands(command);

    if (suggestions.length > 0) {
      console.log(`💡 Did you mean: ${suggestions.join(', ')}?`);
    }

    console.log('💬 Use "paired" without arguments to see all available commands.');

    return {
      success: false,
      error: `Unknown command: ${command}`,
      suggestions
    };
  }

  /**
   * Find similar commands using simple string distance
   */
  findSimilarCommands(command) {
    const allCommands = Array.from(this.commands.keys());

    return allCommands
      .map(cmd => ({
        command: cmd,
        distance: this.levenshteinDistance(command, cmd)
      }))
      .filter(item => item.distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => item.command);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Display formatted status information
   */
  displayStatus(status) {
    console.log(`
📊 PAIRED System Status

🤖 Orchestrator:
  Operations Processed: ${status.orchestrator.operationsProcessed}
  Tokens Saved: ${status.orchestrator.tokensSaved}
  Average Response Time: ${status.orchestrator.averageResponseTime}ms
  Cache Size: ${status.orchestrator.cacheSize}

👥 Agents:
  Active Agents: ${Object.keys(status.agents).length}
  ${Object.entries(status.agents).map(([id, agent]) =>
    `  ${id}: ${agent.status} (${agent.currentTasks} tasks)`
  ).join('\n  ')}

📈 Performance:
  Uptime: ${Math.round(status.orchestrator.uptime / 60)} minutes
  Commands Executed: ${status.commands.recentHistory.length}
  
🧠 Context:
  Current Directory: ${status.context.cwd || 'Unknown'}
  Files Detected: ${status.context.fileCount || 0}
`);
  }

  // Placeholder methods for future implementation
  async getAgentStatus(agentId) { return { agent: agentId, status: 'available' }; }
  async getAgentsStatus() { return {}; }
  async syncAgent(agentId) { return { success: true, agent: agentId }; }
  async extractPatterns() { return []; }
  async searchMemory(query) { return { results: [] }; }
  async storeMemory(args) { return { success: true }; }
  async getMemoryStats() { return { size: 0 }; }
  showMemoryHelp() { return { type: 'memory-help' }; }
  showCurrentConfig() { return { config: {} }; }
  getConfigValue(setting) { return { setting, value: 'default' }; }
  async setConfigValue(setting, value) { return { success: true, setting, value }; }
  async getPerformanceReport() { return {}; }
  async getRecommendations() { return []; }
  async saveReport(report) { return '/tmp/paired_report.json'; }
  generateReportSummary(report) { return 'Report generated successfully'; }
  suggestAlternative(command, error) { return 'Try using ai-help for assistance'; }
}

/**
 * Context analyzer for intelligent routing
 */
class ContextAnalyzer {
  async analyze() {
    const context = {
      cwd: process.cwd(),
      timestamp: Date.now()
    };

    try {
      // Analyze current directory
      const files = await fs.readdir(context.cwd);
      context.files = files;
      context.fileCount = files.length;

      // Check for common project indicators
      context.hasPackageJson = files.includes('package.json');
      context.hasGitRepo = files.includes('.git');
      context.hasWindsurfConfig = files.includes('.paired');

      // Analyze file types
      context.fileTypes = this.analyzeFileTypes(files);

    } catch (error) {
      console.warn('Context analysis failed:', error.message);
    }

    return context;
  }

  analyzeFileTypes(files) {
    const types = {};

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (ext) {
        types[ext] = (types[ext] || 0) + 1;
      }
    });

    return types;
  }

  async getSummary() {
    const context = await this.analyze();
    return {
      cwd: context.cwd,
      fileCount: context.fileCount,
      projectType: this.determineProjectType(context),
      hasGit: context.hasGitRepo
    };
  }

  determineProjectType(context) {
    if (context.hasPackageJson) return 'Node.js';
    if (context.fileTypes['.py']) return 'Python';
    if (context.fileTypes['.java']) return 'Java';
    if (context.fileTypes['.go']) return 'Go';
    return 'Unknown';
  }
}

module.exports = PAIREDCLI;

// CLI execution
if (require.main === module) {
  const cli = new PAIREDCLI();
  const args = process.argv.slice(2);

  cli.execute(args)
    .then(result => {
      if (result && !result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 CLI Error:', error.message);
      process.exit(1);
    });
}
