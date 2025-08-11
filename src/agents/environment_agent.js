const BaseAgent = require('../core/base_agent');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const yaml = require('js-yaml');

/**
 * WEE Environment Agent
 * 
 * Manages development environment state tracking, snapshots, and rollback capabilities.
 * Based on production-validated prototype from VectorSEM project.
 * 
 * 🔬 **Marie** (Analyst): "Comprehensive environment state management with scientific precision!"
 * 🏛️ **Leonardo** (Architecture): "Elegant system design for configuration versioning!"
 * ⚡ **Edison** (Dev): "Revolutionary environment tracking and rollback capabilities!"
 */
class EnvironmentAgent extends BaseAgent {
    constructor(orchestrator, config) {
        super(orchestrator, config);
        
        this.role = 'Environment Manager';
        this.persona = '🌍 Environment Guardian - Protecting and managing your development ecosystem';
        
        // Environment state directories
        this.weeRoot = process.cwd();
        this.environmentStatesDir = path.join(this.weeRoot, '.wee', 'environment_states');
        this.configPath = path.join(this.environmentStatesDir, 'tracker_config.yml');
        this.indexPath = path.join(this.environmentStatesDir, 'snapshot_index.json');
        
        // Default configuration
        this.defaultConfig = {
            tracked_patterns: [
                '.wee/**/*.yml',
                '.wee/**/*.yaml',
                '.wee/**/*.json',
                '.wee/**/*.md',
                '.wee/**/*.py',
                '.wee/**/*.js',
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
                '.wee/environment_states/**',
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
        
        console.log('🌍 Environment Agent initialized - Ready to protect your development ecosystem!');
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
            
            console.log(`🔍 Change detection complete:`);
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
     * Rollback to specific snapshot
     * @param {string} snapshotId - Snapshot ID to rollback to
     * @param {boolean} confirm - Confirmation flag for safety
     * @returns {Promise<Object>} Rollback results
     */
    async rollbackToSnapshot(snapshotId, confirm = false) {
        console.log(`🌍 Environment Agent: Preparing rollback to ${snapshotId}...`);
        
        if (!confirm) {
            console.log('⚠️ Rollback requires confirmation. Use confirm=true parameter.');
            return { 
                success: false, 
                error: 'Rollback requires explicit confirmation',
                warning: 'This operation will overwrite current environment files'
            };
        }
        
        try {
            const snapshot = await this.loadSnapshot(snapshotId);
            
            // Create backup snapshot before rollback
            console.log('💾 Creating backup snapshot before rollback...');
            const backup = await this.createSnapshot(`Pre-rollback backup (${snapshotId})`, ['rollback-backup']);
            
            let restoredCount = 0;
            let errorCount = 0;
            const errors = [];
            
            // Restore files from snapshot
            for (const [filePath, fileInfo] of Object.entries(snapshot.files)) {
                try {
                    const fullPath = path.join(this.weeRoot, filePath);
                    
                    // Ensure directory exists
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    
                    // Note: In the prototype, file contents were hashed but not stored
                    // For a complete implementation, we'd need to store file contents
                    // For now, we'll log what would be restored
                    console.log(`📄 Would restore: ${filePath}`);
                    restoredCount++;
                    
                } catch (error) {
                    console.error(`❌ Failed to restore ${filePath}:`, error.message);
                    errors.push({ file: filePath, error: error.message });
                    errorCount++;
                }
            }
            
            console.log(`✅ Rollback simulation complete:`);
            console.log(`  📄 Files to restore: ${restoredCount}`);
            console.log(`  ❌ Errors: ${errorCount}`);
            
            return {
                success: true,
                snapshot_id: snapshotId,
                backup_snapshot_id: backup.snapshot_id,
                files_restored: restoredCount,
                errors: errorCount,
                error_details: errors,
                note: 'This is a simulation - full file content restoration requires enhanced storage'
            };
            
        } catch (error) {
            console.error('❌ Failed to rollback:', error.message);
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
        const glob = require('glob');
        const fileData = {};
        let totalFiles = 0;
        let totalSize = 0;
        const fileTypes = {};
        
        // Process tracked patterns
        for (const pattern of config.tracked_patterns) {
            const files = glob.sync(pattern, { 
                cwd: this.weeRoot,
                ignore: config.excluded_patterns 
            });
            
            for (const file of files) {
                try {
                    const fullPath = path.join(this.weeRoot, file);
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
            const process = spawn(cmd, args, { cwd: this.weeRoot });
            
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

module.exports = EnvironmentAgent;
