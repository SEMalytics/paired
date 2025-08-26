/**
 * Windsurf Auto-Start Hook for PAIRED
 *
 * Automatically starts PAIRED bridge and agents when opening Windsurf in a PAIRED directory
 * This can be integrated into Windsurf startup sequence or called manually
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class PAIREDAutoStart {
  constructor() {
    this.projectRoot = this.findPAIREDRoot();
    this.startupScript = path.join(this.projectRoot, 'scripts', 'auto-start-agents.sh');
  }

  findPAIREDRoot() {
    let currentDir = process.cwd();

    while (currentDir !== path.dirname(currentDir)) {
      // Check for PAIRED indicators
      const indicators = [
        '.windsurfrules',
        'scripts/auto-start-agents.sh',
        'src/cascade_agent_relay.js'
      ];

      if (indicators.some(indicator => fs.existsSync(path.join(currentDir, indicator)))) {
        return currentDir;
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  async checkIfPAIREDProject() {
    return this.projectRoot !== null;
  }

  async checkIfServicesRunning() {
    try {
      const http = require('http');

      return new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 7890,
          path: '/health',
          method: 'GET',
          timeout: 2000
        }, (res) => {
          resolve(true);
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.on('error', () => resolve(false));
        req.end();
      });
    } catch (error) {
      return false;
    }
  }

  async autoStart() {
    if (!await this.checkIfPAIREDProject()) {
      console.log('Not a PAIRED project directory');
      return false;
    }

    if (await this.checkIfServicesRunning()) {
      console.log('✅ PAIRED services already running');
      return true;
    }

    console.log('🚀 Auto-starting PAIRED services...');

    try {
      const startProcess = spawn('bash', [this.startupScript], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      return new Promise((resolve) => {
        startProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ PAIRED services started successfully');
            resolve(true);
          } else {
            console.log('❌ PAIRED services failed to start');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error starting PAIRED services:', error.message);
      return false;
    }
  }
}

// Auto-start if run directly
if (require.main === module) {
  const autoStart = new PAIREDAutoStart();
  autoStart.autoStart().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = PAIREDAutoStart;
