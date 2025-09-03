/**
 * Shared Memory System for PAIRED Agents
 * Provides centralized memory management and cross-agent communication
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SharedMemorySystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      storage_path: config.storage_path || path.join(process.env.HOME, '.paired', 'data', 'shared_memory'),
      max_memory_size: config.max_memory_size || 100 * 1024 * 1024, // 100MB
      cleanup_interval: config.cleanup_interval || 3600000, // 1 hour
      auto_sync: config.auto_sync !== false,
      ...config
    };
    
    this.memory = new Map();
    this.metadata = new Map();
    this.subscribers = new Map();
    this.initialized = false;
    
    console.log('🧠 SharedMemorySystem initializing...');
  }

  /**
   * Initialize the shared memory system
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.ensureStorageDirectory();
      await this.loadPersistedMemory();
      this.startCleanupTimer();
      this.initialized = true;
      console.log('🧠 SharedMemorySystem initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SharedMemorySystem:', error.message);
      throw error;
    }
  }

  /**
   * Store data in shared memory
   */
  async set(key, value, options = {}) {
    const metadata = {
      timestamp: Date.now(),
      ttl: options.ttl || null,
      agent: options.agent || 'system',
      type: options.type || 'data',
      persistent: options.persistent !== false,
      ...options
    };

    this.memory.set(key, value);
    this.metadata.set(key, metadata);

    // Persist if configured
    if (metadata.persistent && this.config.auto_sync) {
      await this.persistKey(key);
    }

    // Notify subscribers
    this.notifySubscribers(key, value, 'set');

    this.emit('memory:set', { key, value, metadata });
    return true;
  }

  /**
   * Retrieve data from shared memory
   */
  async get(key, defaultValue = null) {
    if (!this.memory.has(key)) {
      return defaultValue;
    }

    const metadata = this.metadata.get(key);
    
    // Check TTL expiration
    if (metadata.ttl && Date.now() > metadata.timestamp + metadata.ttl) {
      await this.delete(key);
      return defaultValue;
    }

    const value = this.memory.get(key);
    this.emit('memory:get', { key, value, metadata });
    return value;
  }

  /**
   * Delete data from shared memory
   */
  async delete(key) {
    if (!this.memory.has(key)) return false;

    const value = this.memory.get(key);
    const metadata = this.metadata.get(key);

    this.memory.delete(key);
    this.metadata.delete(key);

    // Remove from persistent storage
    if (metadata.persistent) {
      await this.removePersistentKey(key);
    }

    // Notify subscribers
    this.notifySubscribers(key, value, 'delete');

    this.emit('memory:delete', { key, value, metadata });
    return true;
  }

  /**
   * Subscribe to memory changes
   */
  subscribe(pattern, callback, agent = 'system') {
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, new Map());
    }
    
    const patternSubscribers = this.subscribers.get(pattern);
    if (!patternSubscribers.has(agent)) {
      patternSubscribers.set(agent, []);
    }
    
    patternSubscribers.get(agent).push(callback);
    
    return () => {
      // Unsubscribe function
      const callbacks = patternSubscribers.get(agent);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get all keys matching a pattern
   */
  keys(pattern = '*') {
    const keys = Array.from(this.memory.keys());
    
    if (pattern === '*') {
      return keys;
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const totalKeys = this.memory.size;
    const totalSize = this.calculateMemorySize();
    const agentStats = new Map();
    
    for (const [key, metadata] of this.metadata.entries()) {
      const agent = metadata.agent;
      if (!agentStats.has(agent)) {
        agentStats.set(agent, { keys: 0, size: 0 });
      }
      
      const stats = agentStats.get(agent);
      stats.keys++;
      stats.size += this.calculateValueSize(this.memory.get(key));
    }
    
    return {
      total_keys: totalKeys,
      total_size: totalSize,
      max_size: this.config.max_memory_size,
      usage_percent: (totalSize / this.config.max_memory_size) * 100,
      agents: Object.fromEntries(agentStats),
      initialized: this.initialized
    };
  }

  /**
   * Clear all memory (with optional pattern)
   */
  async clear(pattern = '*') {
    const keysToDelete = this.keys(pattern);
    
    for (const key of keysToDelete) {
      await this.delete(key);
    }
    
    this.emit('memory:clear', { pattern, deleted_keys: keysToDelete.length });
    return keysToDelete.length;
  }

  /**
   * Ensure storage directory exists
   */
  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.config.storage_path, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create storage directory:', error.message);
      throw error;
    }
  }

  /**
   * Load persisted memory from disk
   */
  async loadPersistedMemory() {
    try {
      const memoryFile = path.join(this.config.storage_path, 'memory.json');
      const metadataFile = path.join(this.config.storage_path, 'metadata.json');
      
      // Load memory data
      try {
        const memoryData = await fs.readFile(memoryFile, 'utf8');
        const parsedMemory = JSON.parse(memoryData);
        this.memory = new Map(Object.entries(parsedMemory));
      } catch (error) {
        // File doesn't exist or is corrupted, start fresh
        console.log('🧠 Starting with fresh memory (no persistent data found)');
      }
      
      // Load metadata
      try {
        const metadataData = await fs.readFile(metadataFile, 'utf8');
        const parsedMetadata = JSON.parse(metadataData);
        this.metadata = new Map(Object.entries(parsedMetadata));
      } catch (error) {
        // File doesn't exist or is corrupted, start fresh
        console.log('🧠 Starting with fresh metadata (no persistent data found)');
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to load persisted memory:', error.message);
    }
  }

  /**
   * Persist a specific key to disk
   */
  async persistKey(key) {
    // For now, persist entire memory (could be optimized for individual keys)
    await this.persistMemory();
  }

  /**
   * Persist all memory to disk
   */
  async persistMemory() {
    try {
      const memoryFile = path.join(this.config.storage_path, 'memory.json');
      const metadataFile = path.join(this.config.storage_path, 'metadata.json');
      
      // Convert Maps to Objects for JSON serialization
      const memoryObj = Object.fromEntries(this.memory.entries());
      const metadataObj = Object.fromEntries(this.metadata.entries());
      
      await fs.writeFile(memoryFile, JSON.stringify(memoryObj, null, 2));
      await fs.writeFile(metadataFile, JSON.stringify(metadataObj, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to persist memory:', error.message);
    }
  }

  /**
   * Remove a key from persistent storage
   */
  async removePersistentKey(key) {
    // For now, re-persist entire memory without the key
    await this.persistMemory();
  }

  /**
   * Notify subscribers of memory changes
   */
  notifySubscribers(key, value, operation) {
    for (const [pattern, agentSubscribers] of this.subscribers.entries()) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      if (regex.test(key)) {
        for (const [agent, callbacks] of agentSubscribers.entries()) {
          for (const callback of callbacks) {
            try {
              callback({ key, value, operation, agent });
            } catch (error) {
              console.error(`❌ Subscriber callback error for ${agent}:`, error.message);
            }
          }
        }
      }
    }
  }

  /**
   * Calculate total memory size
   */
  calculateMemorySize() {
    let totalSize = 0;
    for (const value of this.memory.values()) {
      totalSize += this.calculateValueSize(value);
    }
    return totalSize;
  }

  /**
   * Calculate size of a single value
   */
  calculateValueSize(value) {
    return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
  }

  /**
   * Start cleanup timer for expired entries
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanup_interval);
  }

  /**
   * Clean up expired entries
   */
  async cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, metadata] of this.metadata.entries()) {
      if (metadata.ttl && now > metadata.timestamp + metadata.ttl) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      await this.delete(key);
    }
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired memory entries`);
    }
  }

  /**
   * Get agent-specific memory namespace
   */
  getAgentMemory(agentId) {
    return {
      set: async (key, value, options = {}) => {
        const namespacedKey = `agent:${agentId}:${key}`;
        return await this.set(namespacedKey, value, { ...options, agent: agentId });
      },
      
      get: async (key, defaultValue = null) => {
        const namespacedKey = `agent:${agentId}:${key}`;
        return await this.get(namespacedKey, defaultValue);
      },
      
      delete: async (key) => {
        const namespacedKey = `agent:${agentId}:${key}`;
        return await this.delete(namespacedKey);
      },
      
      keys: (pattern = '*') => {
        const namespacedPattern = `agent:${agentId}:${pattern}`;
        return this.keys(namespacedPattern).map(key => key.replace(`agent:${agentId}:`, ''));
      },
      
      clear: async (pattern = '*') => {
        const namespacedPattern = `agent:${agentId}:${pattern}`;
        return await this.clear(namespacedPattern);
      },
      
      subscribe: (pattern, callback) => {
        const namespacedPattern = `agent:${agentId}:${pattern}`;
        return this.subscribe(namespacedPattern, callback, agentId);
      }
    };
  }

  /**
   * Shutdown the shared memory system
   */
  async shutdown() {
    if (this.config.auto_sync) {
      await this.persistMemory();
    }
    
    // Clear cleanup timer to prevent hanging
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.memory.clear();
    this.metadata.clear();
    this.subscribers.clear();
    this.initialized = false;
    
    console.log('🧠 SharedMemorySystem shutdown complete');
  }
}

module.exports = SharedMemorySystem;
