#!/usr/bin/env node

/**
 * Windsurf Startup Hook for PAIRED Auto-Initialization
 *
 * This script ensures PAIRED auto-initialization happens reliably
 * when Windsurf starts, regardless of global .windsurfrules execution.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class WindsurfStartupHook {
  constructor() {
    this.currentDir = process.cwd();
    this.isWeeProject = false;
    this.isDevelopmentProject = false;
  }

  async initialize() {
    console.log('🚀 Windsurf Startup Hook: Checking for PAIRED auto-initialization...');

    // Check if already a PAIRED project
    this.isWeeProject = await this.checkWeeProject();

    if (this.isWeeProject) {
      console.log('✅ PAIRED project detected - ensuring agent connection...');
      await this.ensureAgentConnection();
      return;
    }

    // Check if this is a development project that should be auto-initialized
    this.isDevelopmentProject = await this.checkDevelopmentProject();

    if (this.isDevelopmentProject) {
      console.log('🎯 Development project detected - auto-initializing PAIRED...');
      await this.autoInitializeWee();
    } else {
      console.log('📂 Not a development project - skipping PAIRED initialization');
    }
  }

  async checkWeeProject() {
    try {
      const weerules = path.join(this.currentDir, '.pairedrules');
      const weeDir = path.join(this.currentDir, '.paired');

      return fs.existsSync(weerules) || fs.existsSync(weeDir);
    } catch (error) {
      return false;
    }
  }

  async checkDevelopmentProject() {
    const indicators = [
      '.git',
      'package.json',
      'requirements.txt',
      'Cargo.toml',
      'pom.xml',
      'go.mod',
      'Makefile',
      'README.md'
    ];

    for (const indicator of indicators) {
      const indicatorPath = path.join(this.currentDir, indicator);
      try {
        if (fs.existsSync(indicatorPath)) {
          return true;
        }
      } catch (error) {
        // Continue checking other indicators
      }
    }

    return false;
  }

  async ensureAgentConnection() {
    try {
      console.log('🌉 Ensuring PAIRED agent bridge connection...');

      const connectScript = path.join(process.env.HOME, '.paired', 'scripts', 'activate_cascade_complete.sh');

      if (fs.existsSync(connectScript)) {
        await this.runScript(connectScript);
        console.log('✅ PAIRED agent connection established');
      } else {
        console.log('⚠️ PAIRED connection script not found - may need to reinstall PAIRED');
      }
    } catch (error) {
      console.error('❌ Failed to ensure agent connection:', error.message);
    }
  }

  async autoInitializeWee() {
    try {
      console.log('🚀 Auto-initializing PAIRED for development project...');

      const autoInitScript = path.join(process.env.HOME, '.paired', 'scripts', 'auto-init-project.sh');

      if (fs.existsSync(autoInitScript)) {
        await this.runScript(autoInitScript);
        console.log('✅ PAIRED auto-initialization completed');
      } else {
        console.log('❌ PAIRED auto-init script not found - please install PAIRED globally');
      }
    } catch (error) {
      console.error('❌ PAIRED auto-initialization failed:', error.message);
    }
  }

  async runScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const process = spawn('bash', [scriptPath], {
        cwd: this.currentDir,
        stdio: 'inherit'
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Run the startup hook
if (require.main === module) {
  const hook = new WindsurfStartupHook();

  hook.initialize().catch(error => {
    console.error('❌ Windsurf Startup Hook failed:', error.message);
  });
}

module.exports = WindsurfStartupHook;
