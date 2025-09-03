#!/usr/bin/env node
/**
 * PAIRED Startup Controller
 * Unified startup management with WebSocket-based health checks
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

class PAIREDStartupController {
  constructor() {
    this.pairedRoot = path.join(process.env.HOME, '.paired');
    this.lockFile = path.join(this.pairedRoot, 'startup.lock');
    this.statusFile = path.join(this.pairedRoot, 'status.json');
    this.logFile = path.join(this.pairedRoot, 'logs', 'startup.log');
    
    this.state = {
      bridge: 'stopped',
      agents: new Map(),
      assessment: 'pending',
      introduction: 'pending',
      autoStartSource: null,
      startTime: null
    };
    
    this.config = {
      bridgePort: 7890,
      bridgeScript: path.join(this.pairedRoot, 'lib', 'bridge', 'cascade-bridge.js'),
      agentScript: path.join(this.pairedRoot, 'lib', 'agents', 'introduction.js'),
      assessmentScript: path.join(this.pairedRoot, 'lib', 'agents', 'project-assessment.js'),
      maxRetries: 3,
      healthCheckTimeout: 30000,
      componentStartTimeout: 10000
    };
    
    // Ensure required directories exist
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    const dirs = [
      path.join(this.pairedRoot, 'logs'),
      path.join(this.pairedRoot, 'pids')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(message);
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
  
  async updateStatus(phase, status, message = null) {
    this.state[phase] = status;
    
    const statusData = {
      timestamp: Date.now(),
      phase,
      status,
      message: message || this.getStatusMessage(phase, status),
      state: { ...this.state }
    };
    
    try {
      fs.writeFileSync(this.statusFile, JSON.stringify(statusData, null, 2));
    } catch (error) {
      this.log(`Failed to update status file: ${error.message}`, 'error');
    }
    
    this.log(`Status: ${phase} -> ${status}${message ? ` (${message})` : ''}`);
  }
  
  getStatusMessage(phase, status) {
    const messages = {
      'bridge:starting': '🚀 Initializing PAIRED bridge...',
      'bridge:running': '🌉 Bridge connected',
      'bridge:error': '❌ Bridge failed to start',
      'agents:starting': '🤖 Loading AI agents...',
      'agents:running': '✅ All agents online',
      'agents:error': '❌ Agent startup failed',
      'assessment:starting': '📊 Analyzing project...',
      'assessment:complete': '✅ Project assessment complete',
      'assessment:error': '❌ Project assessment failed',
      'introduction:starting': '👋 Preparing agent introduction...',
      'introduction:complete': '✅ PAIRED ready - say "Hi Alex" to begin',
      'introduction:error': '❌ Agent introduction failed'
    };
    return messages[`${phase}:${status}`] || `${phase}: ${status}`;
  }
  
  async isLocked() {
    try {
      if (!fs.existsSync(this.lockFile)) {
        return false;
      }
      
      const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
      const lockAge = Date.now() - lockData.timestamp;
      
      // Consider lock stale after 5 minutes
      if (lockAge > 300000) {
        this.log('Removing stale lock file', 'warn');
        fs.unlinkSync(this.lockFile);
        return false;
      }
      
      return true;
    } catch (error) {
      this.log(`Error checking lock file: ${error.message}`, 'error');
      return false;
    }
  }
  
  async acquireLock(source) {
    const lockData = {
      timestamp: Date.now(),
      source,
      pid: process.pid
    };
    
    try {
      fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
      this.log(`Lock acquired by ${source} (PID: ${process.pid})`);
    } catch (error) {
      throw new Error(`Failed to acquire lock: ${error.message}`);
    }
  }
  
  async releaseLock() {
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
        this.log('Lock released');
      }
    } catch (error) {
      this.log(`Error releasing lock: ${error.message}`, 'error');
    }
  }
  
  async checkWebSocketHealth(port = this.config.bridgePort, timeout = 5000) {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      const timeoutId = setTimeout(() => {
        ws.terminate();
        resolve(false);
      }, timeout);
      
      ws.on('open', () => {
        clearTimeout(timeoutId);
        
        // Send health check message
        ws.send(JSON.stringify({
          type: 'health_check',
          timestamp: Date.now()
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.type === 'health_response') {
            clearTimeout(timeoutId);
            ws.close();
            resolve(true);
          }
        } catch (error) {
          // Invalid response, consider unhealthy
        }
      });
      
      ws.on('error', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });
      
      ws.on('close', () => {
        clearTimeout(timeoutId);
        resolve(false);
      });
    });
  }
  
  async waitForComponent(componentName, healthCheck, maxWait = this.config.componentStartTimeout) {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    while (Date.now() - startTime < maxWait) {
      if (await healthCheck()) {
        this.log(`${componentName} is healthy`);
        return true;
      }
      
      await this.sleep(checkInterval);
    }
    
    throw new Error(`${componentName} failed to become healthy within ${maxWait}ms`);
  }
  
  async startBridge() {
    this.log('Starting PAIRED bridge...');
    await this.updateStatus('bridge', 'starting');
    
    try {
      // Check if bridge is already running
      if (await this.checkWebSocketHealth()) {
        this.log('Bridge already running');
        await this.updateStatus('bridge', 'running');
        return true;
      }
      
      // Start bridge process
      const bridgeProcess = spawn('node', [this.config.bridgeScript], {
        detached: true,
        stdio: 'ignore',
        cwd: this.pairedRoot
      });
      
      bridgeProcess.unref();
      
      // Wait for bridge to become healthy
      await this.waitForComponent(
        'Bridge',
        () => this.checkWebSocketHealth(),
        this.config.componentStartTimeout
      );
      
      await this.updateStatus('bridge', 'running');
      return true;
      
    } catch (error) {
      this.log(`Bridge startup failed: ${error.message}`, 'error');
      await this.updateStatus('bridge', 'error', error.message);
      throw error;
    }
  }
  
  async startAgents() {
    this.log('Starting AI agents...');
    await this.updateStatus('agents', 'starting');
    
    try {
      // For now, we'll consider agents started when bridge is healthy
      // In the future, this could start individual agent processes
      
      // Verify bridge can handle agent communication
      if (!await this.checkWebSocketHealth()) {
        throw new Error('Bridge not available for agent communication');
      }
      
      await this.updateStatus('agents', 'running');
      return true;
      
    } catch (error) {
      this.log(`Agent startup failed: ${error.message}`, 'error');
      await this.updateStatus('agents', 'error', error.message);
      throw error;
    }
  }
  
  async runAssessment() {
    this.log('Running project assessment...');
    await this.updateStatus('assessment', 'starting');
    
    try {
      // Run project assessment script
      const assessmentProcess = spawn('node', [this.config.assessmentScript], {
        stdio: 'pipe',
        cwd: process.cwd() // Use current working directory for project context
      });
      
      await new Promise((resolve, reject) => {
        assessmentProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Assessment process exited with code ${code}`));
          }
        });
        
        assessmentProcess.on('error', reject);
      });
      
      await this.updateStatus('assessment', 'complete');
      return true;
      
    } catch (error) {
      this.log(`Project assessment failed: ${error.message}`, 'error');
      await this.updateStatus('assessment', 'error', error.message);
      // Don't throw - assessment failure shouldn't stop startup
      return false;
    }
  }
  
  async showIntroduction() {
    this.log('Showing agent introduction...');
    await this.updateStatus('introduction', 'starting');
    
    try {
      // Run agent introduction script
      const introProcess = spawn('node', [this.config.agentScript], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      await new Promise((resolve, reject) => {
        introProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Introduction process exited with code ${code}`));
          }
        });
        
        introProcess.on('error', reject);
      });
      
      await this.updateStatus('introduction', 'complete');
      return true;
      
    } catch (error) {
      this.log(`Agent introduction failed: ${error.message}`, 'error');
      await this.updateStatus('introduction', 'error', error.message);
      // Don't throw - introduction failure shouldn't stop startup
      return false;
    }
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async waitForStartup(maxWait = 60000) {
    this.log('Waiting for existing startup to complete...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (!await this.isLocked()) {
        this.log('Startup completed');
        return true;
      }
      await this.sleep(2000);
    }
    
    throw new Error('Timeout waiting for startup to complete');
  }
  
  async handleFailure(error) {
    this.log(`Startup failed: ${error.message}`, 'error');
    await this.updateStatus('startup', 'error', error.message);
  }
  
  async start(source = 'unknown') {
    this.state.autoStartSource = source;
    this.state.startTime = Date.now();
    
    this.log(`Starting PAIRED system (source: ${source})`);
    
    // Check if startup is already in progress
    if (await this.isLocked()) {
      this.log('Startup already in progress, waiting...');
      return this.waitForStartup();
    }
    
    await this.acquireLock(source);
    
    try {
      // Sequential startup with health checks
      await this.startBridge();
      await this.startAgents();
      await this.runAssessment();
      await this.showIntroduction();
      
      const duration = Date.now() - this.state.startTime;
      this.log(`PAIRED system fully activated in ${duration}ms`);
      
      return true;
      
    } catch (error) {
      await this.handleFailure(error);
      throw error;
    } finally {
      await this.releaseLock();
    }
  }
  
  async ensureRunning(source = 'check') {
    // Quick health check
    if (await this.checkWebSocketHealth()) {
      this.log('PAIRED system already running');
      return true;
    }
    
    this.log('PAIRED system not running, starting...');
    return this.start(source);
  }
  
  async stop() {
    this.log('Stopping PAIRED system...');
    
    try {
      // Kill bridge process (agents will stop when bridge stops)
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        exec(`pkill -f "cascade-bridge.js"`, (error) => {
          if (error) {
            this.log(`Stop command completed with: ${error.message}`, 'warn');
          } else {
            this.log('PAIRED system stopped');
          }
          resolve();
        });
      });
      
    } catch (error) {
      this.log(`Error stopping system: ${error.message}`, 'error');
    }
  }
  
  async status() {
    try {
      const isHealthy = await this.checkWebSocketHealth();
      const statusData = fs.existsSync(this.statusFile) 
        ? JSON.parse(fs.readFileSync(this.statusFile, 'utf8'))
        : null;
      
      return {
        running: isHealthy,
        bridge: isHealthy ? 'running' : 'stopped',
        lastStatus: statusData,
        lockExists: await this.isLocked()
      };
    } catch (error) {
      return {
        running: false,
        error: error.message
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const controller = new PAIREDStartupController();
  const command = process.argv[2] || 'start';
  const source = process.argv[3] || 'cli';
  
  async function main() {
    try {
      switch (command) {
        case 'start':
          await controller.start(source);
          break;
        case 'ensure':
          await controller.ensureRunning(source);
          break;
        case 'stop':
          await controller.stop();
          break;
        case 'status':
          const status = await controller.status();
          console.log(JSON.stringify(status, null, 2));
          break;
        default:
          console.log('Usage: startup-controller.js [start|ensure|stop|status] [source]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Startup controller error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = PAIREDStartupController;
