const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const yaml = require('js-yaml');
const glob = require('glob');

/**
 * Standalone PAIRED Environment Agent
 *
 * Independent environment state tracking system that doesn't depend on BaseAgent.
 * Based on production-validated prototype from VectorSEM project.
 *
 * 🔬 **Marie** (Analyst): "Scientific precision in environment management!"
 * 🏛️ **Leonardo** (Architecture): "Elegant standalone system design!"
 * ⚡ **Edison** (Dev): "Revolutionary independent environment tracking!"
 */
class StandaloneEnvironmentAgent {
  constructor() {
    this.id = 'standalone-environment-agent';
    this.name = 'Environment Agent';
    this.role = 'Environment Manager';
    this.persona = '🌍 Environment Guardian - Protecting and managing your development ecosystem';

    // Environment state directories
    this.pairedRoot = process.cwd();
    this.environmentStatesDir = path.join(this.pairedRoot, '.paired', 'environment_states');
    this.configPath = path.join(this.environmentStatesDir, 'tracker_config.yml');
    this.indexPath = path.join(this.environmentStatesDir, 'snapshot_index.json');
    this.environmentRegistryPath = path.join(this.environmentStatesDir, 'environment_registry.json');
    this.currentEnvironmentPath = path.join(this.environmentStatesDir, 'current_environment.json');

    // Default configuration
    this.defaultConfig = {
      tracked_patterns: [
        '.paired/**/*.yml',
        '.paired/**/*.yaml',
        '.paired/**/*.json',
        '.paired/**/*.md',
        '.paired/**/*.py',
        '.paired/**/*.js',
        '.windsurf/**/*.yml',
        '.windsurf/**/*.yaml',
        '.windsurf/**/*.json',
        '.windsurf/**/*.md',
        '.windsurf/brain/**/*.md',
        '*.env',
        '*.env.local',
        '.vscode/settings.json',
        '.vscode/launch.json',
        'pyproject.toml',
        'requirements*.txt',
        'Pipfile*',
        'uv.lock',
        'poetry.lock',
        'package.json',
        'package-lock.json'
      ],
      excluded_patterns: [
        '.paired/environment_states/**',
        'node_modules/**',
        '.git/**',
        '**/__pycache__/**',
        '**/*.pyc',
        '**/venv/**',
        '**/.env/**'
      ],
      max_file_size_mb: 1,
      max_snapshots: 50,
      auto_cleanup: true
    };

    console.log('🌍 Standalone Environment Agent initialized - Ready to protect your development ecosystem!');
  }

  /**
     * Initialize environment tracking system
     */
  async initializeEnvironmentTracking() {
    try {
      // Ensure environment states directory exists
      await fs.mkdir(this.environmentStatesDir, { recursive: true });

      // Initialize configuration if it doesn't exist
      if (!await this.fileExists(this.configPath)) {
        await this.saveConfig(this.defaultConfig);
        console.log('🔧 Environment tracking configuration initialized');
      }

      // Initialize snapshot index if it doesn't exist
      if (!await this.fileExists(this.indexPath)) {
        await this.saveSnapshotIndex({ snapshots: [] });
        console.log('📋 Snapshot index initialized');
      }

      // Initialize environment registry if it doesn't exist
      if (!await this.fileExists(this.environmentRegistryPath)) {
        await this.saveEnvironmentRegistry({ environments: {}, metadata: { created: new Date().toISOString() } });
        console.log('🌍 Environment registry initialized');
      }

      // Initialize current environment tracker if it doesn't exist
      if (!await this.fileExists(this.currentEnvironmentPath)) {
        await this.saveCurrentEnvironment({ environment_name: null, switched_at: null });
        console.log('📍 Current environment tracker initialized');
      }

      console.log('✅ Environment tracking system ready');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize environment tracking:', error.message);
      return false;
    }
  }

  /**
     * Create environment snapshot
     * @param {string} description - Snapshot description
     * @param {Array} tags - Optional tags for categorization
     * @returns {Promise<Object>} Snapshot information
     */
  async createSnapshot(description = 'Manual snapshot', tags = []) {
    console.log('🌍 Environment Agent: Creating environment snapshot...');

    try {
      await this.initializeEnvironmentTracking();

      const config = await this.loadConfig();
      const snapshotId = `env_snapshot_${this.generateTimestamp()}`;

      // Scan environment files
      console.log('🔍 Scanning environment files...');
      const files = await this.scanEnvironmentFiles(config);

      // Get git information
      const gitInfo = await this.getGitInfo();

      // Create snapshot data
      const snapshot = {
        snapshot_id: snapshotId,
        timestamp: new Date().toISOString(),
        description: description,
        tags: tags,
        git_commit: gitInfo.commit,
        git_branch: gitInfo.branch,
        files: files.fileData,
        summary: {
          total_files: files.totalFiles,
          total_size_bytes: files.totalSize,
          file_types: files.fileTypes
        }
      };

      // Save snapshot
      const snapshotPath = path.join(this.environmentStatesDir, `${snapshotId}.json`);
      await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

      // Update snapshot index
      await this.addToSnapshotIndex(snapshot);

      // Cleanup old snapshots if needed
      if (config.auto_cleanup) {
        await this.cleanupOldSnapshots(config.max_snapshots);
      }

      console.log(`✅ Environment snapshot created: ${snapshotId}`);
      console.log(`📊 Tracked ${files.totalFiles} files (${this.formatBytes(files.totalSize)})`);

      return {
        success: true,
        snapshot_id: snapshotId,
        files_tracked: files.totalFiles,
        total_size: files.totalSize,
        description: description
      };

    } catch (error) {
      console.error('❌ Failed to create snapshot:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Detect changes since last snapshot or specific baseline
     * @param {string} baselineId - Optional baseline snapshot ID
     * @returns {Promise<Object>} Change detection results
     */
  async detectChanges(baselineId = null) {
    console.log('🌍 Environment Agent: Detecting environment changes...');

    try {
      await this.initializeEnvironmentTracking();

      const config = await this.loadConfig();
      const index = await this.loadSnapshotIndex();

      // Get baseline snapshot
      let baseline;
      if (baselineId) {
        baseline = await this.loadSnapshot(baselineId);
      } else if (index.snapshots.length > 0) {
        // Use most recent snapshot as baseline
        const latestId = index.snapshots[index.snapshots.length - 1].snapshot_id;
        baseline = await this.loadSnapshot(latestId);
      } else {
        return { success: false, error: 'No baseline snapshot found' };
      }

      // Scan current environment
      const current = await this.scanEnvironmentFiles(config);

      // Compare with baseline
      const changes = this.compareFileStates(baseline.files, current.fileData);

      console.log('🔍 Change detection complete:');
      console.log(`  📝 Modified: ${changes.modified.length} files`);
      console.log(`  ➕ Added: ${changes.added.length} files`);
      console.log(`  ➖ Deleted: ${changes.deleted.length} files`);

      return {
        success: true,
        baseline_id: baseline.snapshot_id,
        baseline_timestamp: baseline.timestamp,
        changes: changes,
        summary: {
          total_changes: changes.modified.length + changes.added.length + changes.deleted.length,
          modified_count: changes.modified.length,
          added_count: changes.added.length,
          deleted_count: changes.deleted.length
        }
      };

    } catch (error) {
      console.error('❌ Failed to detect changes:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Compare two snapshots
     * @param {string} snapshot1Id - First snapshot ID
     * @param {string} snapshot2Id - Second snapshot ID
     * @returns {Promise<Object>} Comparison results
     */
  async compareSnapshots(snapshot1Id, snapshot2Id) {
    console.log(`🌍 Environment Agent: Comparing snapshots ${snapshot1Id} vs ${snapshot2Id}...`);

    try {
      const snapshot1 = await this.loadSnapshot(snapshot1Id);
      const snapshot2 = await this.loadSnapshot(snapshot2Id);

      const changes = this.compareFileStates(snapshot1.files, snapshot2.files);

      return {
        success: true,
        snapshot1: {
          id: snapshot1.snapshot_id,
          timestamp: snapshot1.timestamp,
          description: snapshot1.description
        },
        snapshot2: {
          id: snapshot2.snapshot_id,
          timestamp: snapshot2.timestamp,
          description: snapshot2.description
        },
        changes: changes,
        summary: {
          total_changes: changes.modified.length + changes.added.length + changes.deleted.length,
          modified_count: changes.modified.length,
          added_count: changes.added.length,
          deleted_count: changes.deleted.length
        }
      };

    } catch (error) {
      console.error('❌ Failed to compare snapshots:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * List available snapshots
     * @param {number} limit - Maximum number of snapshots to return
     * @returns {Promise<Object>} List of snapshots
     */
  async listSnapshots(limit = 20) {
    console.log('🌍 Environment Agent: Listing environment snapshots...');

    try {
      const index = await this.loadSnapshotIndex();

      // Sort by timestamp (newest first) and limit
      const snapshots = index.snapshots
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map(snapshot => ({
          snapshot_id: snapshot.snapshot_id,
          timestamp: snapshot.timestamp,
          description: snapshot.description,
          tags: snapshot.tags || [],
          files_count: snapshot.summary?.total_files || 0,
          total_size: snapshot.summary?.total_size_bytes || 0,
          git_branch: snapshot.git_branch,
          git_commit: snapshot.git_commit?.substring(0, 8) || 'unknown'
        }));

      console.log(`📋 Found ${snapshots.length} snapshots`);

      return {
        success: true,
        snapshots: snapshots,
        total_count: index.snapshots.length
      };

    } catch (error) {
      console.error('❌ Failed to list snapshots:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Get environment health status
     * @returns {Promise<Object>} Health status information
     */
  async getEnvironmentHealth() {
    console.log('🌍 Environment Agent: Checking environment health...');

    try {
      await this.initializeEnvironmentTracking();

      const config = await this.loadConfig();
      const index = await this.loadSnapshotIndex();
      const gitInfo = await this.getGitInfo();

      // Scan current environment
      const current = await this.scanEnvironmentFiles(config);

      // Calculate health metrics
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
          tracked_files: current.totalFiles,
          total_size: current.totalSize,
          file_types: current.fileTypes
        },
        snapshots: {
          total_count: index.snapshots.length,
          latest_snapshot: index.snapshots.length > 0 ?
            index.snapshots[index.snapshots.length - 1] : null
        },
        git: gitInfo,
        configuration: {
          tracking_patterns: config.tracked_patterns.length,
          excluded_patterns: config.excluded_patterns.length,
          max_file_size_mb: config.max_file_size_mb,
          max_snapshots: config.max_snapshots
        }
      };

      console.log('✅ Environment health check complete');
      console.log(`📊 Tracking ${current.totalFiles} files (${this.formatBytes(current.totalSize)})`);
      console.log(`📋 ${index.snapshots.length} snapshots available`);

      return { success: true, health: health };

    } catch (error) {
      console.error('❌ Environment health check failed:', error.message);
      return {
        success: false,
        error: error.message,
        health: { status: 'unhealthy', error: error.message }
      };
    }
  }

  /**
     * Cleanup old snapshots
     * @param {number} keepCount - Number of snapshots to keep
     * @returns {Promise<number>} Number of snapshots cleaned up
     */
  async cleanupOldSnapshots(keepCount = 50) {
    try {
      const index = await this.loadSnapshotIndex();

      if (index.snapshots.length <= keepCount) {
        return 0;
      }

      // Sort by timestamp and keep only the most recent
      const sortedSnapshots = index.snapshots
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const toKeep = sortedSnapshots.slice(0, keepCount);
      const toDelete = sortedSnapshots.slice(keepCount);

      // Delete old snapshot files
      for (const snapshot of toDelete) {
        const snapshotPath = path.join(this.environmentStatesDir, `${snapshot.snapshot_id}.json`);
        try {
          await fs.unlink(snapshotPath);
        } catch (error) {
          console.warn(`⚠️ Could not delete snapshot file: ${snapshotPath}`);
        }
      }

      // Update index
      await this.saveSnapshotIndex({ snapshots: toKeep });

      console.log(`🗑️ Cleaned up ${toDelete.length} old snapshots`);
      return toDelete.length;

    } catch (error) {
      console.error('❌ Failed to cleanup snapshots:', error.message);
      return 0;
    }
  }

  // Helper Methods

  /**
     * Scan environment files based on configuration
     */
  async scanEnvironmentFiles(config) {
    const fileData = {};
    let totalFiles = 0;
    let totalSize = 0;
    const fileTypes = {};

    // Process tracked patterns
    for (const pattern of config.tracked_patterns) {
      const files = glob.sync(pattern, {
        cwd: this.pairedRoot,
        ignore: config.excluded_patterns
      });

      for (const file of files) {
        try {
          const fullPath = path.join(this.pairedRoot, file);
          const stats = await fs.stat(fullPath);

          // Skip files larger than max size
          if (stats.size > config.max_file_size_mb * 1024 * 1024) {
            continue;
          }

          // Calculate file hash
          const content = await fs.readFile(fullPath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');

          fileData[file] = {
            hash: hash,
            size: stats.size,
            modified: stats.mtime.getTime() / 1000,
            permissions: (stats.mode & parseInt('777', 8)).toString(8)
          };

          totalFiles++;
          totalSize += stats.size;

          // Track file types
          const ext = path.extname(file);
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;

        } catch (error) {
          console.warn(`⚠️ Could not process file: ${file}`);
        }
      }
    }

    return { fileData, totalFiles, totalSize, fileTypes };
  }

  /**
     * Compare two file states
     */
  compareFileStates(baseline, current) {
    const changes = {
      modified: [],
      added: [],
      deleted: []
    };

    // Find modified and deleted files
    for (const [filePath, baselineInfo] of Object.entries(baseline)) {
      if (current[filePath]) {
        if (current[filePath].hash !== baselineInfo.hash) {
          changes.modified.push({
            file: filePath,
            baseline_hash: baselineInfo.hash,
            current_hash: current[filePath].hash,
            size_change: current[filePath].size - baselineInfo.size
          });
        }
      } else {
        changes.deleted.push({
          file: filePath,
          hash: baselineInfo.hash,
          size: baselineInfo.size
        });
      }
    }

    // Find added files
    for (const [filePath, currentInfo] of Object.entries(current)) {
      if (!baseline[filePath]) {
        changes.added.push({
          file: filePath,
          hash: currentInfo.hash,
          size: currentInfo.size
        });
      }
    }

    return changes;
  }

  /**
     * Get git information
     */
  async getGitInfo() {
    try {
      const commit = await this.execCommand('git rev-parse HEAD');
      const branch = await this.execCommand('git rev-parse --abbrev-ref HEAD');

      return {
        commit: commit.trim(),
        branch: branch.trim()
      };
    } catch (error) {
      return {
        commit: 'unknown',
        branch: 'unknown'
      };
    }
  }

  /**
     * Execute shell command
     */
  execCommand(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { cwd: this.pairedRoot });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr));
        }
      });
    });
  }

  /**
     * Load configuration
     */
  async loadConfig() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      return this.defaultConfig;
    }
  }

  /**
     * Save configuration
     */
  async saveConfig(config) {
    const content = yaml.dump(config, { indent: 2 });
    await fs.writeFile(this.configPath, content);
  }

  /**
     * Load snapshot index
     */
  async loadSnapshotIndex() {
    try {
      const content = await fs.readFile(this.indexPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return { snapshots: [] };
    }
  }

  /**
     * Save snapshot index
     */
  async saveSnapshotIndex(index) {
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  /**
     * Add snapshot to index
     */
  async addToSnapshotIndex(snapshot) {
    const index = await this.loadSnapshotIndex();
    index.snapshots.push({
      snapshot_id: snapshot.snapshot_id,
      timestamp: snapshot.timestamp,
      description: snapshot.description,
      tags: snapshot.tags,
      git_commit: snapshot.git_commit,
      git_branch: snapshot.git_branch,
      summary: snapshot.summary
    });
    await this.saveSnapshotIndex(index);
  }

  /**
     * Load specific snapshot
     */
  async loadSnapshot(snapshotId) {
    const snapshotPath = path.join(this.environmentStatesDir, `${snapshotId}.json`);
    const content = await fs.readFile(snapshotPath, 'utf8');
    return JSON.parse(content);
  }

  /**
     * Check if file exists
     */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
     * Generate timestamp for snapshot ID
     */
  generateTimestamp() {
    const now = new Date();
    return now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, '')
      .replace('T', '_');
  }

  /**
     * Create or promote environment
     * @param {string} environmentName - Name of the environment
     * @param {string} snapshotId - Snapshot ID to promote (optional, uses current if not provided)
     * @param {string} description - Environment description
     * @param {string} type - Environment type (dev, testing, prod, feature, etc.)
     * @returns {Promise<Object>} Environment creation result
     */
  async createEnvironment(environmentName, snapshotId = null, description = '', type = 'custom') {
    console.log(`🌍 Environment Agent: Creating environment '${environmentName}'...`);

    try {
      await this.initializeEnvironmentTracking();

      // If no snapshot ID provided, create a snapshot of current state
      if (!snapshotId) {
        const snapshotResult = await this.createSnapshot(`Environment baseline for ${environmentName}`);
        if (!snapshotResult.success) {
          return { success: false, error: 'Failed to create baseline snapshot' };
        }
        snapshotId = snapshotResult.snapshot_id;
      }

      // Load environment registry
      const registry = await this.loadEnvironmentRegistry();

      // Create environment entry
      const environment = {
        name: environmentName,
        type: type,
        snapshot_id: snapshotId,
        description: description,
        created_at: new Date().toISOString(),
        created_by: 'user',
        last_accessed: new Date().toISOString(),
        health_score: 100,
        tags: [type]
      };

      // Add to registry
      registry.environments[environmentName] = environment;
      await this.saveEnvironmentRegistry(registry);

      console.log(`✅ Environment '${environmentName}' created successfully`);

      return {
        success: true,
        environment_name: environmentName,
        snapshot_id: snapshotId,
        type: type,
        description: description
      };

    } catch (error) {
      console.error('❌ Failed to create environment:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * List all environments
     * @returns {Promise<Object>} List of environments
     */
  async listEnvironments() {
    console.log('🌍 Environment Agent: Listing environments...');

    try {
      const registry = await this.loadEnvironmentRegistry();
      const currentEnv = await this.loadCurrentEnvironment();

      const environments = Object.entries(registry.environments).map(([name, env]) => ({
        name: name,
        type: env.type,
        description: env.description,
        created_at: env.created_at,
        last_accessed: env.last_accessed,
        health_score: env.health_score,
        tags: env.tags || [],
        is_current: currentEnv.environment_name === name,
        snapshot_id: env.snapshot_id
      }));

      // Sort by last accessed (most recent first)
      environments.sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed));

      console.log(`📋 Found ${environments.length} environments`);

      return {
        success: true,
        environments: environments,
        current_environment: currentEnv.environment_name,
        total_count: environments.length
      };

    } catch (error) {
      console.error('❌ Failed to list environments:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Switch to environment
     * @param {string} environmentName - Name of environment to switch to
     * @returns {Promise<Object>} Switch result
     */
  async switchToEnvironment(environmentName) {
    console.log(`🌍 Environment Agent: Switching to environment '${environmentName}'...`);

    try {
      const registry = await this.loadEnvironmentRegistry();

      if (!registry.environments[environmentName]) {
        return { success: false, error: `Environment '${environmentName}' not found` };
      }

      const environment = registry.environments[environmentName];

      // Update current environment
      await this.saveCurrentEnvironment({
        environment_name: environmentName,
        switched_at: new Date().toISOString()
      });

      // Update last accessed time
      environment.last_accessed = new Date().toISOString();
      registry.environments[environmentName] = environment;
      await this.saveEnvironmentRegistry(registry);

      console.log(`✅ Switched to environment '${environmentName}'`);

      return {
        success: true,
        environment_name: environmentName,
        type: environment.type,
        description: environment.description,
        snapshot_id: environment.snapshot_id
      };

    } catch (error) {
      console.error('❌ Failed to switch environment:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Get current environment
     * @returns {Promise<Object>} Current environment info
     */
  async getCurrentEnvironment() {
    try {
      const currentEnv = await this.loadCurrentEnvironment();

      if (!currentEnv.environment_name) {
        return {
          success: true,
          environment_name: null,
          message: 'No environment currently selected'
        };
      }

      const registry = await this.loadEnvironmentRegistry();
      const environment = registry.environments[currentEnv.environment_name];

      if (!environment) {
        return {
          success: false,
          error: `Current environment '${currentEnv.environment_name}' not found in registry`
        };
      }

      return {
        success: true,
        environment_name: currentEnv.environment_name,
        type: environment.type,
        description: environment.description,
        snapshot_id: environment.snapshot_id,
        switched_at: currentEnv.switched_at,
        created_at: environment.created_at
      };

    } catch (error) {
      console.error('❌ Failed to get current environment:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Compare two environments
     * @param {string} env1Name - First environment name
     * @param {string} env2Name - Second environment name
     * @returns {Promise<Object>} Comparison results
     */
  async compareEnvironments(env1Name, env2Name) {
    console.log(`🌍 Environment Agent: Comparing environments '${env1Name}' vs '${env2Name}'...`);

    try {
      const registry = await this.loadEnvironmentRegistry();

      const env1 = registry.environments[env1Name];
      const env2 = registry.environments[env2Name];

      if (!env1) return { success: false, error: `Environment '${env1Name}' not found` };
      if (!env2) return { success: false, error: `Environment '${env2Name}' not found` };

      // Compare snapshots
      const comparison = await this.compareSnapshots(env1.snapshot_id, env2.snapshot_id);

      if (comparison.success) {
        return {
          success: true,
          environment1: {
            name: env1Name,
            type: env1.type,
            description: env1.description,
            snapshot_id: env1.snapshot_id
          },
          environment2: {
            name: env2Name,
            type: env2.type,
            description: env2.description,
            snapshot_id: env2.snapshot_id
          },
          changes: comparison.changes,
          summary: comparison.summary
        };
      } else {
        return comparison;
      }

    } catch (error) {
      console.error('❌ Failed to compare environments:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
     * Delete environment
     * @param {string} environmentName - Name of environment to delete
     * @param {boolean} confirm - Confirmation flag
     * @returns {Promise<Object>} Deletion result
     */
  async deleteEnvironment(environmentName, confirm = false) {
    if (!confirm) {
      return {
        success: false,
        error: 'Environment deletion requires confirmation',
        warning: 'This operation cannot be undone'
      };
    }

    try {
      const registry = await this.loadEnvironmentRegistry();
      const currentEnv = await this.loadCurrentEnvironment();

      if (!registry.environments[environmentName]) {
        return { success: false, error: `Environment '${environmentName}' not found` };
      }

      // Prevent deletion of current environment
      if (currentEnv.environment_name === environmentName) {
        return {
          success: false,
          error: 'Cannot delete currently active environment',
          suggestion: 'Switch to another environment first'
        };
      }

      // Remove from registry
      delete registry.environments[environmentName];
      await this.saveEnvironmentRegistry(registry);

      console.log(`🗑️ Environment '${environmentName}' deleted`);

      return {
        success: true,
        environment_name: environmentName,
        message: 'Environment deleted successfully'
      };

    } catch (error) {
      console.error('❌ Failed to delete environment:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Environment Registry Helper Methods

  /**
     * Load environment registry
     */
  async loadEnvironmentRegistry() {
    try {
      const content = await fs.readFile(this.environmentRegistryPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return { environments: {}, metadata: { created: new Date().toISOString() } };
    }
  }

  /**
     * Save environment registry
     */
  async saveEnvironmentRegistry(registry) {
    await fs.writeFile(this.environmentRegistryPath, JSON.stringify(registry, null, 2));
  }

  /**
     * Load current environment
     */
  async loadCurrentEnvironment() {
    try {
      const content = await fs.readFile(this.currentEnvironmentPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return { environment_name: null, switched_at: null };
    }
  }

  /**
     * Save current environment
     */
  async saveCurrentEnvironment(currentEnv) {
    await fs.writeFile(this.currentEnvironmentPath, JSON.stringify(currentEnv, null, 2));
  }

  /**
     * Format bytes for display
     */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = StandaloneEnvironmentAgent;
