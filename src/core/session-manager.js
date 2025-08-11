/**
 * WEE Session Manager
 * 
 * Implementation by ⚡ Edison (Dev Agent)
 * Architecture by 🏛️ Leonardo (Architecture Agent)
 * 
 * Manages multiple project sessions with isolation, cleanup, and recovery.
 * Replaces the global PID/log file approach with proper session tracking.
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');

class SessionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
      maxSessions: options.maxSessions || 50,
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
      persistencePath: options.persistencePath || '.wee/sessions',
      ...options
    };
    
    this.sessions = new Map();
    this.projectSessions = new Map(); // projectPath -> Set of sessionIds
    this.cleanupTimer = null;
    
    this.startCleanupTimer();
  }
  
  /**
   * Create a new session for a project
   */
  async createSession(projectPath, windsurfInstanceId, metadata = {}) {
    try {
      // Resolve and validate project path
      const resolvedPath = path.resolve(projectPath);
      await this.validateProjectPath(resolvedPath);
      
      // Check session limits
      if (this.sessions.size >= this.config.maxSessions) {
        throw new Error(`Maximum sessions limit reached (${this.config.maxSessions})`);
      }
      
      // Generate unique session ID
      const sessionId = this.generateSessionId(resolvedPath);
      
      // Create session object
      const session = {
        id: sessionId,
        projectPath: resolvedPath,
        projectName: path.basename(resolvedPath),
        windsurfInstanceId,
        createdAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
        connections: new Set(),
        messageQueue: [],
        metadata: {
          ...metadata,
          version: this.getProjectVersion(resolvedPath),
          gitBranch: await this.getGitBranch(resolvedPath)
        }
      };
      
      // Store session
      this.sessions.set(sessionId, session);
      
      // Track by project path
      if (!this.projectSessions.has(resolvedPath)) {
        this.projectSessions.set(resolvedPath, new Set());
      }
      this.projectSessions.get(resolvedPath).add(sessionId);
      
      // Persist session
      await this.persistSession(session);
      
      console.log(`📁 Session created: ${sessionId} for ${session.projectName}`);
      this.emit('sessionCreated', session);
      
      return session;
      
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get all sessions for a project path
   */
  getProjectSessions(projectPath) {
    const resolvedPath = path.resolve(projectPath);
    const sessionIds = this.projectSessions.get(resolvedPath) || new Set();
    
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(session => session && session.status === 'active');
  }
  
  /**
   * Get all active sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values())
      .filter(session => session.status === 'active');
  }
  
  /**
   * Update session activity
   */
  updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.emit('sessionActivity', session);
    }
  }
  
  /**
   * Add connection to session
   */
  addConnection(sessionId, connectionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.connections.add(connectionId);
      this.updateActivity(sessionId);
      this.emit('connectionAdded', { sessionId, connectionId });
    }
  }
  
  /**
   * Remove connection from session
   */
  removeConnection(sessionId, connectionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.connections.delete(connectionId);
      this.emit('connectionRemoved', { sessionId, connectionId });
      
      // Check if session should be cleaned up
      if (session.connections.size === 0) {
        this.scheduleSessionCleanup(sessionId);
      }
    }
  }
  
  /**
   * Destroy a session
   */
  async destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    try {
      // Mark as destroyed
      session.status = 'destroyed';
      session.destroyedAt = new Date();
      
      // Remove from project tracking
      const projectSessions = this.projectSessions.get(session.projectPath);
      if (projectSessions) {
        projectSessions.delete(sessionId);
        if (projectSessions.size === 0) {
          this.projectSessions.delete(session.projectPath);
        }
      }
      
      // Close all connections
      for (const connectionId of session.connections) {
        this.emit('connectionClosed', { sessionId, connectionId });
      }
      
      // Remove from active sessions
      this.sessions.delete(sessionId);
      
      // Clean up persistence
      await this.removePersistentSession(sessionId);
      
      console.log(`🗑️ Session destroyed: ${sessionId}`);
      this.emit('sessionDestroyed', session);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error destroying session ${sessionId}:`, error);
      return false;
    }
  }
  
  /**
   * Schedule session cleanup after delay
   */
  scheduleSessionCleanup(sessionId, delay = 300000) { // 5 minutes
    setTimeout(async () => {
      const session = this.sessions.get(sessionId);
      if (session && session.connections.size === 0) {
        console.log(`🧹 Auto-cleaning up inactive session: ${sessionId}`);
        await this.destroySession(sessionId);
      }
    }, delay);
  }
  
  /**
   * Validate project path exists and is a valid WEE project
   */
  async validateProjectPath(projectPath) {
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error('Project path must be a directory');
      }
      
      // Check for WEE project markers
      const weeDir = path.join(projectPath, '.wee');
      const weeStats = await fs.stat(weeDir).catch(() => null);
      
      if (!weeStats || !weeStats.isDirectory()) {
        console.warn(`⚠️ Warning: ${projectPath} is not a WEE project (no .wee directory)`);
      }
      
      return true;
      
    } catch (error) {
      throw new Error(`Invalid project path: ${error.message}`);
    }
  }
  
  /**
   * Get project version from package.json or other sources
   */
  getProjectVersion(projectPath) {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageData = require(packagePath);
      return packageData.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }
  
  /**
   * Get current git branch
   */
  async getGitBranch(projectPath) {
    try {
      const gitHeadPath = path.join(projectPath, '.git', 'HEAD');
      const headContent = await fs.readFile(gitHeadPath, 'utf8');
      
      if (headContent.startsWith('ref: refs/heads/')) {
        return headContent.replace('ref: refs/heads/', '').trim();
      }
      
      return 'detached';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId(projectPath) {
    const projectName = path.basename(projectPath);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    
    return `${projectName}_${timestamp}_${random}`;
  }
  
  /**
   * Persist session to disk
   */
  async persistSession(session) {
    try {
      const persistenceDir = path.join(session.projectPath, this.config.persistencePath);
      await fs.mkdir(persistenceDir, { recursive: true });
      
      const sessionFile = path.join(persistenceDir, `${session.id}.json`);
      const sessionData = {
        ...session,
        connections: Array.from(session.connections), // Convert Set to Array for JSON
        persistedAt: new Date().toISOString()
      };
      
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
      
    } catch (error) {
      console.error(`❌ Error persisting session ${session.id}:`, error);
    }
  }
  
  /**
   * Remove persistent session file
   */
  async removePersistentSession(sessionId) {
    try {
      // Find and remove session file from any project
      for (const [projectPath] of this.projectSessions) {
        const sessionFile = path.join(projectPath, this.config.persistencePath, `${sessionId}.json`);
        try {
          await fs.unlink(sessionFile);
          break;
        } catch {
          // File doesn't exist in this project, continue
        }
      }
    } catch (error) {
      console.error(`❌ Error removing persistent session ${sessionId}:`, error);
    }
  }
  
  /**
   * Load persisted sessions on startup
   */
  async loadPersistedSessions() {
    // This would be called on service startup to restore sessions
    // Implementation depends on how we want to handle persistence across restarts
    console.log('🔄 Loading persisted sessions...');
  }
  
  /**
   * Start cleanup timer for inactive sessions
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.config.cleanupInterval);
  }
  
  /**
   * Clean up inactive sessions
   */
  cleanupInactiveSessions() {
    const now = new Date();
    const timeoutThreshold = this.config.sessionTimeout;
    
    for (const [sessionId, session] of this.sessions) {
      const inactiveTime = now - session.lastActivity;
      
      if (inactiveTime > timeoutThreshold && session.connections.size === 0) {
        console.log(`🧹 Cleaning up inactive session: ${sessionId} (inactive for ${Math.round(inactiveTime / 60000)}m)`);
        this.destroySession(sessionId);
      }
    }
  }
  
  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * Get session statistics
   */
  getStats() {
    const stats = {
      totalSessions: this.sessions.size,
      activeProjects: this.projectSessions.size,
      totalConnections: 0,
      sessionsByProject: {}
    };
    
    for (const session of this.sessions.values()) {
      stats.totalConnections += session.connections.size;
      
      if (!stats.sessionsByProject[session.projectName]) {
        stats.sessionsByProject[session.projectName] = 0;
      }
      stats.sessionsByProject[session.projectName]++;
    }
    
    return stats;
  }
  
  /**
   * Shutdown session manager
   */
  async shutdown() {
    console.log('🛑 Shutting down Session Manager...');
    
    this.stopCleanupTimer();
    
    // Destroy all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }
    
    console.log('✅ Session Manager shutdown complete');
  }
}

module.exports = SessionManager;
