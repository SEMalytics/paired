const path = require('path');
const os = require('os');

/**
 * PAIRED Path Resolver Utility
 * Provides consistent path resolution for PAIRED agent directories
 * Prevents agents from creating directories in project root
 */
class PathResolver {
  constructor() {
    this.globalPairedDir = path.join(os.homedir(), '.paired');
  }

  /**
   * Get the project's .paired directory
   * @param {string} projectRoot - Project root directory (optional, defaults to cwd)
   * @returns {string} Path to project's .paired directory
   */
  getProjectPairedDir(projectRoot = process.cwd()) {
    return path.join(projectRoot, '.paired');
  }

  /**
   * Get agent tracking directory within project's .paired structure
   * @param {string} agentName - Agent name (alex, edison, leonardo, etc.)
   * @param {string} projectRoot - Project root directory (optional)
   * @returns {string} Path to agent's tracking directory
   */
  getAgentTrackingDir(agentName, projectRoot = process.cwd()) {
    return path.join(this.getProjectPairedDir(projectRoot), 'agents', agentName, 'tracking');
  }

  /**
   * Get agent data directory within project's .paired structure
   * @param {string} agentName - Agent name (alex, edison, leonardo, etc.)
   * @param {string} projectRoot - Project root directory (optional)
   * @returns {string} Path to agent's data directory
   */
  getAgentDataDir(agentName, projectRoot = process.cwd()) {
    return path.join(this.getProjectPairedDir(projectRoot), 'agents', agentName, 'data');
  }

  /**
   * Get global PAIRED directory
   * @returns {string} Path to global ~/.paired directory
   */
  getGlobalPairedDir() {
    return this.globalPairedDir;
  }

  /**
   * Get agent tracking file path
   * @param {string} agentName - Agent name
   * @param {string} fileName - Tracking file name
   * @param {string} projectRoot - Project root directory (optional)
   * @returns {string} Full path to tracking file
   */
  getAgentTrackingFile(agentName, fileName, projectRoot = process.cwd()) {
    return path.join(this.getAgentTrackingDir(agentName, projectRoot), fileName);
  }

  /**
   * Legacy compatibility: Get old-style paths for migration
   * @param {string} projectRoot - Project root directory
   * @returns {object} Object with old paths that should be migrated
   */
  getLegacyPaths(projectRoot = process.cwd()) {
    return {
      coreAgents: path.join(projectRoot, 'core', 'agents'),
      dataDir: path.join(projectRoot, 'data'),
      windsurfAgents: path.join(projectRoot, '.windsurf', 'agents')
    };
  }
}

// Export singleton instance
module.exports = new PathResolver();
