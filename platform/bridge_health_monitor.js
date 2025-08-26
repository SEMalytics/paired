#!/usr/bin/env node

/**
 * PAIRED Bridge Health Monitor
 * Ensures bridge reliability with automatic recovery
 */

const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class BridgeHealthMonitor {
  constructor() {
    this.port = 7890;
    this.checkInterval = 5000; // 5 seconds
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.bridgeProcess = null;
    this.isMonitoring = false;
    this.logFile = path.join(os.homedir(), '.paired', 'bridge_health.log');
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} [${level}] ${message}\n`;
    console.log(`[${level}] ${message}`);

    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async checkBridgeHealth() {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${this.port}`);

      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.send(JSON.stringify({ type: 'health_check' }));

        ws.on('message', (data) => {
          try {
            const response = JSON.parse(data);
            ws.close();
            resolve(response.status === 'healthy');
          } catch {
            ws.close();
            resolve(false);
          }
        });
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async startBridge() {
    this.log('Starting PAIRED bridge...');

    const bridgeScript = path.join(__dirname, 'cascade_bridge_service.js');

    this.bridgeProcess = spawn('node', [bridgeScript, '--port', this.port.toString()], {
      detached: false,
      stdio: 'pipe'
    });

    this.bridgeProcess.stdout.on('data', (data) => {
      this.log(`Bridge: ${data.toString().trim()}`);
    });

    this.bridgeProcess.stderr.on('data', (data) => {
      this.log(`Bridge Error: ${data.toString().trim()}`, 'ERROR');
    });

    this.bridgeProcess.on('exit', (code) => {
      this.log(`Bridge process exited with code ${code}`, code === 0 ? 'INFO' : 'ERROR');
      this.bridgeProcess = null;
    });

    // Wait for bridge to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isHealthy = await this.checkBridgeHealth();
    if (isHealthy) {
      this.log('Bridge started successfully');
    } else {
      this.log('Bridge failed to start properly', 'ERROR');
    }

    return isHealthy;
  }

  async stopBridge() {
    if (this.bridgeProcess) {
      this.log('Stopping bridge...');
      this.bridgeProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.bridgeProcess) {
        this.bridgeProcess.kill('SIGKILL');
      }

      this.bridgeProcess = null;
    }
  }

  async restartBridge() {
    this.log('Restarting bridge...');
    await this.stopBridge();
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    return await this.startBridge();
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      this.log('Monitor already running');
      return;
    }

    this.isMonitoring = true;
    this.log('Starting bridge health monitoring...');

    // Initial bridge start
    const started = await this.startBridge();
    if (!started) {
      this.log('Failed to start bridge initially', 'ERROR');
    }

    // Continuous monitoring
    setInterval(async () => {
      if (!this.isMonitoring) return;

      const isHealthy = await this.checkBridgeHealth();

      if (!isHealthy) {
        this.log('Bridge health check failed', 'WARN');

        let recovered = false;
        for (let i = 0; i < this.maxRetries; i++) {
          this.log(`Attempting recovery (${i + 1}/${this.maxRetries})...`);

          if (await this.restartBridge()) {
            this.log('Bridge recovered successfully');
            recovered = true;
            break;
          }

          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }

        if (!recovered) {
          this.log('Failed to recover bridge after maximum retries', 'ERROR');
        }
      }
    }, this.checkInterval);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.stopBridge();
    this.log('Monitoring stopped');
  }
}

// Handle process signals
const monitor = new BridgeHealthMonitor();

process.on('SIGINT', async () => {
  console.log('\nShutting down health monitor...');
  monitor.stopMonitoring();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  monitor.stopMonitoring();
  process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
  monitor.startMonitoring().catch(console.error);
}

module.exports = BridgeHealthMonitor;
