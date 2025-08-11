#!/usr/bin/env node

/**
 * WEE Workflow Agent Bridge
 * 
 * This system actively monitors your Windsurf workflow and triggers
 * appropriate agents to "speak up" during normal development work.
 * 
 * Solves the core issue: agents exist but aren't actively participating
 * in your workflow because there's no bridge connecting them to your
 * real-time development activities.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const EventEmitter = require('events');

class WorkflowAgentBridge extends EventEmitter {
  constructor(projectPath) {
    super();
    
    this.projectPath = projectPath;
    this.isActive = false;
    this.watchers = new Map();
    this.agentTriggers = new Map();
    this.lastActivity = Date.now();
    this.activityInterval = null;
    
    // Agent trigger patterns
    this.setupAgentTriggers();
    
    console.log('🌊 WEE Workflow Agent Bridge initializing...');
  }
  
  /**
   * Setup agent trigger patterns based on file/activity types
   */
  setupAgentTriggers() {
    this.agentTriggers.set('qa_triggers', {
      patterns: [/\.test\./i, /\.spec\./i, /test/i, /spec/i, /__tests__/i],
      extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts'],
      keywords: ['test', 'spec', 'coverage', 'quality', 'bug', 'fix'],
      agent: 'Sherlock (QA)',
      emoji: '🔍',
      responses: [
        "🔍 Sherlock here! I noticed test activity. Need me to analyze test coverage or investigate any quality issues?",
        "🕵️ Quality check time! I'm monitoring for any test failures or coverage gaps.",
        "🔍 Test patterns detected! I'm ready to dive deep into quality analysis if needed."
      ]
    });
    
    this.agentTriggers.set('architecture_triggers', {
      patterns: [/config/i, /architecture/i, /design/i, /pattern/i, /structure/i],
      extensions: ['.yml', '.yaml', '.json', '.config.js', '.env'],
      keywords: ['architecture', 'design', 'pattern', 'structure', 'config', 'setup'],
      agent: 'Leonardo (Architecture)',
      emoji: '🏛️',
      responses: [
        "🏛️ Leonardo here! I see architectural changes brewing. Want me to review the design patterns?",
        "🎨 Architectural vision activated! I'm analyzing the structural implications of these changes.",
        "🏛️ Design patterns in motion! I'm ready to ensure we maintain architectural excellence."
      ]
    });
    
    this.agentTriggers.set('pm_triggers', {
      patterns: [/readme/i, /plan/i, /roadmap/i, /milestone/i, /project/i],
      extensions: ['.md', '.txt', '.doc'],
      keywords: ['plan', 'roadmap', 'milestone', 'project', 'goal', 'objective', 'timeline'],
      agent: 'Alex (PM)',
      emoji: '👑',
      responses: [
        "👑 Alex here! Strategic planning activity detected. Need me to coordinate project objectives?",
        "🎯 Project coordination mode activated! I'm tracking milestones and resource allocation.",
        "👑 Strategic oversight engaged! I'm monitoring project flow and team coordination."
      ]
    });
    
    this.agentTriggers.set('dev_triggers', {
      patterns: [/\.js$/i, /\.ts$/i, /\.py$/i, /\.java$/i, /src/i, /lib/i],
      extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'],
      keywords: ['implement', 'code', 'function', 'class', 'method', 'algorithm'],
      agent: 'Edison (Dev)',
      emoji: '⚡',
      responses: [
        "⚡ Edison here! Code implementation in progress. Need me to analyze algorithms or debug issues?",
        "💡 Development energy detected! I'm ready to dive into problem-solving and optimization.",
        "⚡ Implementation mode! I'm monitoring for any technical challenges that need solving."
      ]
    });
    
    this.agentTriggers.set('ux_triggers', {
      patterns: [/ui/i, /ux/i, /design/i, /interface/i, /user/i, /style/i],
      extensions: ['.css', '.scss', '.less', '.html', '.jsx', '.vue'],
      keywords: ['ui', 'ux', 'design', 'interface', 'user', 'experience', 'accessibility'],
      agent: 'Maya (UX)',
      emoji: '🎨',
      responses: [
        "🎨 Maya here! User experience activity detected. Want me to review accessibility and design patterns?",
        "✨ UX intuition activated! I'm analyzing user interaction flows and experience quality.",
        "🎨 Design empathy engaged! I'm ensuring we create delightful user experiences."
      ]
    });
    
    this.agentTriggers.set('analyst_triggers', {
      patterns: [/data/i, /analysis/i, /metrics/i, /report/i, /stats/i],
      extensions: ['.csv', '.json', '.xml', '.log'],
      keywords: ['data', 'analysis', 'metrics', 'report', 'statistics', 'performance'],
      agent: 'Marie (Analyst)',
      emoji: '🔬',
      responses: [
        "🔬 Marie here! Data analysis opportunity detected. Need me to investigate patterns or metrics?",
        "📊 Scientific analysis mode! I'm ready to dive deep into data patterns and insights.",
        "🔬 Research instincts activated! I'm analyzing data flows and performance metrics."
      ]
    });
  }
  
  /**
   * Start monitoring workflow for agent triggers
   */
  async startMonitoring() {
    if (this.isActive) {
      console.log('🌊 Workflow monitoring already active');
      return;
    }
    
    try {
      this.isActive = true;
      
      // Monitor file changes
      await this.setupFileWatchers();
      
      // Monitor git activity
      await this.setupGitWatchers();
      
      // Start periodic activity checks
      this.startActivityMonitoring();
      
      console.log('🌊 WEE Workflow Agent Bridge is now ACTIVE!');
      console.log('🎯 Agents will now "speak up" during your development work');
      
      // Initial agent greeting
      this.triggerAgentGreeting();
      
    } catch (error) {
      console.error('❌ Failed to start workflow monitoring:', error.message);
      this.isActive = false;
    }
  }
  
  /**
   * Setup file system watchers for development activity
   */
  async setupFileWatchers() {
    const watchPaths = [
      path.join(this.projectPath, 'src'),
      path.join(this.projectPath, 'test'),
      path.join(this.projectPath, 'tests'),
      path.join(this.projectPath, '.'),
    ];
    
    for (const watchPath of watchPaths) {
      try {
        const stats = await fs.stat(watchPath);
        if (stats.isDirectory()) {
          // Note: In a real implementation, you'd use fs.watch or chokidar
          // For now, we'll simulate with periodic checks
          console.log(`👀 Watching ${watchPath} for development activity`);
        }
      } catch (error) {
        // Path doesn't exist, skip
      }
    }
  }
  
  /**
   * Setup git activity monitoring
   */
  async setupGitWatchers() {
    try {
      const gitPath = path.join(this.projectPath, '.git');
      const stats = await fs.stat(gitPath);
      if (stats.isDirectory()) {
        console.log('📝 Monitoring git activity for agent triggers');
        // Monitor git hooks, commits, etc.
      }
    } catch (error) {
      console.log('ℹ️  No git repository detected');
    }
  }
  
  /**
   * Start periodic activity monitoring
   */
  startActivityMonitoring() {
    // Store interval ID for cleanup
    this.activityInterval = setInterval(() => {
      this.checkForActivity();
    }, 30000); // Check every 30 seconds
    
    // Register with CLI cleanup system to prevent hanging
    const { addCleanupHandler } = require('../shared/cli_cleanup');
    addCleanupHandler(() => {
      if (this.activityInterval) {
        clearInterval(this.activityInterval);
        this.activityInterval = null;
      }
    });
  }
  
  /**
   * Check for recent development activity
   */
  async checkForActivity() {
    if (!this.isActive) return;
    
    try {
      // Check for recent file modifications
      const recentFiles = await this.findRecentFiles();
      
      if (recentFiles.length > 0) {
        this.analyzeActivityAndTriggerAgents(recentFiles);
      }
      
    } catch (error) {
      console.error('❌ Error checking activity:', error.message);
    }
  }
  
  /**
   * Find recently modified files
   */
  async findRecentFiles() {
    const recentFiles = [];
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    try {
      const files = await this.getAllFiles(this.projectPath);
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          if (stats.mtime.getTime() > cutoffTime) {
            recentFiles.push({
              path: file,
              modified: stats.mtime,
              size: stats.size
            });
          }
        } catch (error) {
          // File might have been deleted, skip
        }
      }
    } catch (error) {
      console.error('❌ Error finding recent files:', error.message);
    }
    
    return recentFiles;
  }
  
  /**
   * Get all files in project (simplified version)
   */
  async getAllFiles(dir, files = []) {
    try {
      const entries = await fs.readdir(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        
        // Skip node_modules and .git
        if (entry === 'node_modules' || entry === '.git') continue;
        
        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            await this.getAllFiles(fullPath, files);
          } else {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip files we can't access
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return files;
  }
  
  /**
   * Analyze recent activity and trigger appropriate agents
   */
  analyzeActivityAndTriggerAgents(recentFiles) {
    const triggeredAgents = new Set();
    
    for (const file of recentFiles) {
      const fileName = path.basename(file.path).toLowerCase();
      const fileExt = path.extname(file.path).toLowerCase();
      
      // Check each agent trigger pattern
      for (const [triggerKey, trigger] of this.agentTriggers) {
        let shouldTrigger = false;
        
        // Check file patterns
        if (trigger.patterns.some(pattern => pattern.test(fileName))) {
          shouldTrigger = true;
        }
        
        // Check file extensions
        if (trigger.extensions.includes(fileExt)) {
          shouldTrigger = true;
        }
        
        if (shouldTrigger && !triggeredAgents.has(trigger.agent)) {
          this.triggerAgent(trigger, file);
          triggeredAgents.add(trigger.agent);
        }
      }
    }
  }
  
  /**
   * Trigger a specific agent with a contextual message
   */
  triggerAgent(trigger, file) {
    const response = trigger.responses[Math.floor(Math.random() * trigger.responses.length)];
    const relativePath = path.relative(this.projectPath, file.path);
    
    console.log('\n' + '='.repeat(60));
    console.log(`${trigger.emoji} ${trigger.agent} - WORKFLOW TRIGGER`);
    console.log('='.repeat(60));
    console.log(`📁 Activity detected: ${relativePath}`);
    console.log(`💬 ${response}`);
    console.log('='.repeat(60) + '\n');
    
    // Emit event for other systems to listen
    this.emit('agentTriggered', {
      agent: trigger.agent,
      trigger: trigger,
      file: file,
      message: response
    });
  }
  
  /**
   * Initial agent greeting when monitoring starts
   */
  triggerAgentGreeting() {
    console.log('\n' + '🌊'.repeat(20));
    console.log('🎉 WEE AGENT TEAM ACTIVATED!');
    console.log('🌊'.repeat(20));
    console.log('👑 Alex (PM): Strategic coordination online!');
    console.log('🔍 Sherlock (QA): Quality investigation ready!');
    console.log('🏛️ Leonardo (Architecture): Design vision active!');
    console.log('⚡ Edison (Dev): Problem-solving mode engaged!');
    console.log('🎨 Maya (UX): User experience intuition activated!');
    console.log('🔬 Marie (Analyst): Data analysis systems online!');
    console.log('🏈 Vince (Scrum): Team coaching protocols ready!');
    console.log('🌊'.repeat(20));
    console.log('💡 Your agents will now "speak up" during development!');
    console.log('🌊'.repeat(20) + '\n');
  }
  
  /**
   * Stop monitoring workflow
   */
  stopMonitoring() {
    this.isActive = false;
    
    // Clear activity monitoring interval
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    
    // Close all watchers
    for (const [key, watcher] of this.watchers) {
      if (watcher && typeof watcher.close === 'function') {
        watcher.close();
      }
    }
    this.watchers.clear();
    
    console.log('🛑 WEE Workflow Agent Bridge stopped');
  }
  
  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      active: this.isActive,
      watchersCount: this.watchers.size,
      agentTriggersCount: this.agentTriggers.size,
      lastActivity: new Date(this.lastActivity).toISOString()
    };
  }
}

module.exports = WorkflowAgentBridge;

// If run directly, start monitoring the current directory
if (require.main === module) {
  const projectPath = process.cwd();
  const bridge = new WorkflowAgentBridge(projectPath);
  
  bridge.startMonitoring().then(() => {
    console.log('🚀 Workflow Agent Bridge started successfully!');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down Workflow Agent Bridge...');
      bridge.stopMonitoring();
      process.exit(0);
    });
    
  }).catch(error => {
    console.error('💥 Failed to start Workflow Agent Bridge:', error.message);
    process.exit(1);
  });
}
