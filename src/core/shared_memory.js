/**
 * WEE (Windsurf Evolutionary Ecosystem) Shared Memory System
 * 
 * Manages shared and agent-specific memory with intelligent retrieval
 * and context-aware organization. Supports the AI team coordination
 * by providing relevant information to each agent.
 * 
 * Philosophy: "Context as Shared Understanding"
 * - Global memory accessible to all agents
 * - Agent-specific memory with controlled sharing
 * - Context-aware retrieval and relevance scoring
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SharedMemorySystem {
  constructor(config = {}) {
    this.config = {
      storageDir: config.storage_path || config.storageDir || './data/memory',
      maxSizeMB: config.max_size_mb || config.maxSizeMB || 1000,
      cleanupInterval: config.cleanup_interval || config.cleanupInterval || 3600000, // 1 hour
      indexingEnabled: config.indexing_enabled !== false,
      compressionEnabled: config.compression_enabled !== false,
      maxMemorySize: config.maxMemorySize || 100 * 1024 * 1024, // 100MB
      maxEntries: config.maxEntries || 10000,
      pruneInterval: config.pruneInterval || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    this.globalMemory = new Map();
    this.agentMemories = new Map();
    this.memoryIndex = new MemoryIndex();
    this.accessPatterns = new Map();
    
    this.initializeMemorySystem();
  }
  
  /**
   * Initialize memory system and load existing data
   */
  async initializeMemorySystem() {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      await this.loadExistingMemory();
      
      // Start periodic pruning (skip in test mode to prevent hanging)
      if (process.env.NODE_ENV !== 'test') {
        this.pruneInterval = setInterval(() => this.pruneMemory(), this.config.pruneInterval);
      }
      
      if (process.env.NODE_ENV !== 'test') {
        console.log('🧠 Shared memory system initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize memory system:', error.message);
    }
  }
  
  /**
   * Initialize the memory system
   */
  async initialize() {
    try {
      // Create storage directory if it doesn't exist
      const fs = require('fs').promises;
      const storageDir = this.config.storageDir || './data/memory';
      await fs.mkdir(storageDir, { recursive: true });
      
      // Load existing memories from storage
      await this.loadMemoriesFromStorage();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      console.log('✅ SharedMemorySystem initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SharedMemorySystem:', error.message);
      throw error;
    }
  }
  
  /**
   * Load existing memories from storage
   */
  async loadMemoriesFromStorage() {
    try {
      // For now, just log that we're loading memories
      // In a full implementation, this would load from persistent storage
      console.log('📚 Loading memories from storage...');
    } catch (error) {
      console.warn('⚠️ Could not load memories from storage:', error.message);
    }
  }
  
  /**
   * Start cleanup timer for memory maintenance
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
    
    console.log('🧹 Cleanup timer started');
  }
  
  /**
   * Perform memory cleanup and maintenance
   */
  performCleanup() {
    console.log('🧹 Performing memory cleanup...');
    // In a full implementation, this would:
    // - Remove expired memories
    // - Compress old memories
    // - Update indexes
    // - Free up memory if over limits
  }
  
  /**
   * Get system status for monitoring
   */
  getSystemStatus() {
    const totalMemories = this.globalMemory.size + 
                         Array.from(this.agentMemories.values()).reduce((sum, map) => sum + map.size, 0);
    
    return {
      totalMemories,
      globalMemories: this.globalMemory.size,
      agentMemories: this.agentMemories.size,
      usage: totalMemories / this.config.maxEntries,
      storageDir: this.config.storageDir,
      lastCleanup: Date.now(),
      status: 'healthy'
    };
  }
  
  /**
   * Shutdown the memory system and clean up resources
   */
  async shutdown() {
    try {
      // Clear cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
        console.log('🧹 Cleanup timer stopped');
      }
      
      // Clear memory stores
      this.globalMemory.clear();
      this.agentMemories.clear();
      if (this.memoryIndex && typeof this.memoryIndex.clear === 'function') {
        this.memoryIndex.clear();
      }
      this.memoryCache.clear();
      
      console.log('🧠 SharedMemorySystem shut down successfully');
    } catch (error) {
      console.error('❌ Error shutting down SharedMemorySystem:', error.message);
    }
  }
  
  /**
   * Store memory with appropriate scope and metadata
   */
  async storeMemory(agentId, key, value, metadata = {}) {
    const memoryEntry = {
      id: this.generateMemoryId(),
      agentId,
      key,
      value,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(value)
      },
      scope: metadata.scope || 'agent', // 'global', 'team', 'agent'
      tags: metadata.tags || [],
      searchable: metadata.searchable !== false,
      ttl: metadata.ttl || null // Time to live in milliseconds
    };
    
    // Store in appropriate location based on scope
    switch (memoryEntry.scope) {
      case 'global':
        await this.storeGlobalMemory(memoryEntry);
        break;
      case 'team':
        await this.storeTeamMemory(memoryEntry);
        break;
      case 'agent':
        await this.storeAgentMemory(agentId, memoryEntry);
        break;
      default:
        throw new Error(`Invalid memory scope: ${memoryEntry.scope}`);
    }
    
    // Update search index
    if (memoryEntry.searchable) {
      await this.memoryIndex.index(memoryEntry);
    }
    
    // Persist to disk
    await this.persistMemoryEntry(memoryEntry);
    
    console.log(`💾 Stored memory: ${key} (${memoryEntry.scope}, ${agentId})`);
    
    return memoryEntry.id;
  }
  
  /**
   * Retrieve relevant memory for agent and context
   */
  async getRelevantMemory(agentId, context = {}, query = '', maxResults = 20) {
    const startTime = Date.now();
    
    try {
      // Get memory from different scopes
      const memoryResults = await Promise.all([
        this.getGlobalMemory(context, query),
        this.getTeamMemory(agentId, context, query),
        this.getAgentMemory(agentId, context, query),
        this.getContextualMemory(context, query)
      ]);
      
      // Merge and deduplicate results
      const allMemory = this.mergeMemoryResults(memoryResults);
      
      // Score by relevance to current context
      const scoredMemory = await this.scoreMemoryByRelevance(
        allMemory, agentId, context, query
      );
      
      // Update access patterns
      this.updateAccessPatterns(agentId, scoredMemory.slice(0, maxResults));
      
      const duration = Date.now() - startTime;
      console.log(`🔍 Retrieved ${scoredMemory.length} memory entries in ${duration}ms`);
      
      return scoredMemory.slice(0, maxResults);
    } catch (error) {
      console.error('❌ Memory retrieval failed:', error.message);
      return [];
    }
  }
  
  /**
   * Store global memory accessible to all agents
   */
  async storeGlobalMemory(memoryEntry) {
    this.globalMemory.set(memoryEntry.id, memoryEntry);
  }
  
  /**
   * Store team memory accessible to related agents
   */
  async storeTeamMemory(memoryEntry) {
    const teamKey = this.getTeamKey(memoryEntry.agentId);
    
    if (!this.agentMemories.has(teamKey)) {
      this.agentMemories.set(teamKey, new Map());
    }
    
    this.agentMemories.get(teamKey).set(memoryEntry.id, memoryEntry);
  }
  
  /**
   * Store agent-specific memory
   */
  async storeAgentMemory(agentId, memoryEntry) {
    if (!this.agentMemories.has(agentId)) {
      this.agentMemories.set(agentId, new Map());
    }
    
    this.agentMemories.get(agentId).set(memoryEntry.id, memoryEntry);
  }
  
  /**
   * Get global memory relevant to context
   */
  async getGlobalMemory(context, query) {
    const results = [];
    
    for (const [id, memory] of this.globalMemory.entries()) {
      if (this.isMemoryRelevant(memory, context, query)) {
        results.push(memory);
      }
    }
    
    return results;
  }
  
  /**
   * Get team memory for agent
   */
  async getTeamMemory(agentId, context, query) {
    const teamKey = this.getTeamKey(agentId);
    const teamMemory = this.agentMemories.get(teamKey);
    
    if (!teamMemory) return [];
    
    const results = [];
    
    for (const [id, memory] of teamMemory.entries()) {
      if (memory.scope === 'team' && this.isMemoryRelevant(memory, context, query)) {
        results.push(memory);
      }
    }
    
    return results;
  }
  
  /**
   * Get agent-specific memory
   */
  async getAgentMemory(agentId, context, query) {
    const agentMemory = this.agentMemories.get(agentId);
    
    if (!agentMemory) return [];
    
    const results = [];
    
    for (const [id, memory] of agentMemory.entries()) {
      if (this.isMemoryRelevant(memory, context, query)) {
        results.push(memory);
      }
    }
    
    return results;
  }
  
  /**
   * Get contextual memory based on current context
   */
  async getContextualMemory(context, query) {
    // Use memory index for contextual search
    return await this.memoryIndex.search(query, context);
  }
  
  /**
   * Check if memory entry is relevant to context and query
   */
  isMemoryRelevant(memory, context, query) {
    // Check TTL
    if (memory.ttl && Date.now() > memory.metadata.timestamp + memory.ttl) {
      return false;
    }
    
    // Simple relevance check (can be enhanced with ML)
    if (query) {
      const searchText = `${memory.key} ${JSON.stringify(memory.value)} ${memory.tags.join(' ')}`.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (!searchText.includes(queryLower)) {
        return false;
      }
    }
    
    // Context-based relevance
    if (context.currentTask && memory.tags.includes(context.currentTask)) {
      return true;
    }
    
    if (context.files && memory.metadata.relatedFiles) {
      const hasRelatedFile = context.files.some(file => 
        memory.metadata.relatedFiles.includes(file)
      );
      if (hasRelatedFile) return true;
    }
    
    return true; // Default to relevant
  }
  
  /**
   * Score memory entries by relevance
   */
  async scoreMemoryByRelevance(memoryEntries, agentId, context, query) {
    const scoredEntries = memoryEntries.map(memory => {
      let score = 0;
      
      // Base score
      score += 1;
      
      // Recency score (newer is better)
      const age = Date.now() - memory.metadata.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      score += Math.max(0, (maxAge - age) / maxAge) * 2;
      
      // Access frequency score
      score += Math.min(memory.metadata.accessCount / 10, 2);
      
      // Agent relevance score
      if (memory.agentId === agentId) score += 3;
      if (memory.scope === 'global') score += 1;
      if (memory.scope === 'team') score += 2;
      
      // Query relevance score
      if (query) {
        const searchText = `${memory.key} ${JSON.stringify(memory.value)}`.toLowerCase();
        const queryLower = query.toLowerCase();
        const matches = (searchText.match(new RegExp(queryLower, 'g')) || []).length;
        score += matches * 2;
      }
      
      // Context relevance score
      if (context.currentTask && memory.tags.includes(context.currentTask)) {
        score += 3;
      }
      
      // Tag relevance score
      if (context.tags) {
        const commonTags = memory.tags.filter(tag => context.tags.includes(tag));
        score += commonTags.length;
      }
      
      return {
        ...memory,
        relevanceScore: score
      };
    });
    
    return scoredEntries.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Merge memory results from different sources
   */
  mergeMemoryResults(memoryResults) {
    const merged = new Map();
    
    memoryResults.forEach(results => {
      results.forEach(memory => {
        if (!merged.has(memory.id)) {
          merged.set(memory.id, memory);
        }
      });
    });
    
    return Array.from(merged.values());
  }
  
  /**
   * Update access patterns for learning
   */
  updateAccessPatterns(agentId, accessedMemory) {
    if (!this.accessPatterns.has(agentId)) {
      this.accessPatterns.set(agentId, {
        totalAccesses: 0,
        memoryTypes: new Map(),
        queryPatterns: new Map(),
        lastAccess: Date.now()
      });
    }
    
    const patterns = this.accessPatterns.get(agentId);
    patterns.totalAccesses += accessedMemory.length;
    patterns.lastAccess = Date.now();
    
    accessedMemory.forEach(memory => {
      // Update memory access count
      memory.metadata.accessCount++;
      memory.metadata.lastAccessed = Date.now();
      
      // Track memory type patterns
      const type = memory.scope;
      patterns.memoryTypes.set(type, (patterns.memoryTypes.get(type) || 0) + 1);
    });
  }
  
  /**
   * Prune old and unused memory entries
   */
  async pruneMemory() {
    console.log('🧹 Starting memory pruning...');
    
    let prunedCount = 0;
    const now = Date.now();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const maxUnusedAge = 30 * 24 * 60 * 60 * 1000; // 30 days unused
    
    // Prune global memory
    for (const [id, memory] of this.globalMemory.entries()) {
      if (this.shouldPruneMemory(memory, now, maxAge, maxUnusedAge)) {
        this.globalMemory.delete(id);
        await this.deletePersistedMemory(id);
        prunedCount++;
      }
    }
    
    // Prune agent memories
    for (const [agentId, agentMemory] of this.agentMemories.entries()) {
      for (const [id, memory] of agentMemory.entries()) {
        if (this.shouldPruneMemory(memory, now, maxAge, maxUnusedAge)) {
          agentMemory.delete(id);
          await this.deletePersistedMemory(id);
          prunedCount++;
        }
      }
    }
    
    console.log(`🧹 Pruned ${prunedCount} memory entries`);
    
    return prunedCount;
  }
  
  /**
   * Determine if memory should be pruned
   */
  shouldPruneMemory(memory, now, maxAge, maxUnusedAge) {
    // Check TTL
    if (memory.ttl && now > memory.metadata.timestamp + memory.ttl) {
      return true;
    }
    
    // Check max age
    if (now - memory.metadata.timestamp > maxAge) {
      return true;
    }
    
    // Check unused age
    if (memory.metadata.accessCount === 0 && 
        now - memory.metadata.timestamp > maxUnusedAge) {
      return true;
    }
    
    // Preserve high-value memory
    if (memory.metadata.preserve || memory.metadata.accessCount > 10) {
      return false;
    }
    
    return false;
  }
  
  /**
   * Get team key for agent (for team memory sharing)
   */
  getTeamKey(agentId) {
    // Define team relationships
    const teams = {
      'pm': 'management',
      'po': 'management',
      'analyst': 'management',
      'dev': 'engineering',
      'qa': 'engineering',
      'arch': 'engineering',
      'ux': 'design'
    };
    
    return teams[agentId] || 'general';
  }
  
  /**
   * Persist memory entry to disk
   */
  async persistMemoryEntry(memoryEntry) {
    try {
      const filePath = path.join(
        this.config.memoryDir,
        `${memoryEntry.scope}_${memoryEntry.agentId}_${memoryEntry.id}.json`
      );
      
      await fs.writeFile(filePath, JSON.stringify(memoryEntry, null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to persist memory entry:', error.message);
    }
  }
  
  /**
   * Load existing memory from disk
   */
  async loadExistingMemory() {
    try {
      const files = await fs.readdir(this.config.storageDir);
      const memoryFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of memoryFiles) {
        try {
          const filePath = path.join(this.config.storageDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const memoryEntry = JSON.parse(content);
          
          // Restore to appropriate memory store
          switch (memoryEntry.scope) {
            case 'global':
              this.globalMemory.set(memoryEntry.id, memoryEntry);
              break;
            case 'team':
              const teamKey = this.getTeamKey(memoryEntry.agentId);
              if (!this.agentMemories.has(teamKey)) {
                this.agentMemories.set(teamKey, new Map());
              }
              this.agentMemories.get(teamKey).set(memoryEntry.id, memoryEntry);
              break;
            case 'agent':
              if (!this.agentMemories.has(memoryEntry.agentId)) {
                this.agentMemories.set(memoryEntry.agentId, new Map());
              }
              this.agentMemories.get(memoryEntry.agentId).set(memoryEntry.id, memoryEntry);
              break;
          }
          
          // Re-index searchable entries
          if (memoryEntry.searchable) {
            await this.memoryIndex.index(memoryEntry);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load memory file ${file}:`, error.message);
        }
      }
      
      if (process.env.NODE_ENV !== 'test') {
        console.log(`📚 Loaded ${memoryFiles.length} memory entries from disk`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load existing memory:', error.message);
    }
  }
  
  /**
   * Delete persisted memory file
   */
  async deletePersistedMemory(memoryId) {
    try {
      const files = await fs.readdir(this.config.memoryDir);
      const targetFile = files.find(file => file.includes(memoryId));
      
      if (targetFile) {
        await fs.unlink(path.join(this.config.memoryDir, targetFile));
      }
    } catch (error) {
      console.warn('⚠️ Failed to delete persisted memory:', error.message);
    }
  }
  
  /**
   * Calculate memory entry size
   */
  calculateSize(value) {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }
  
  /**
   * Generate unique memory ID
   */
  generateMemoryId() {
    return `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * Get memory system statistics
   */
  getStats() {
    const stats = {
      globalMemory: this.globalMemory.size,
      agentMemories: {},
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
      accessPatterns: {}
    };
    
    // Calculate agent memory stats
    for (const [agentId, memory] of this.agentMemories.entries()) {
      stats.agentMemories[agentId] = memory.size;
    }
    
    // Calculate total size and age stats
    const allMemory = [
      ...this.globalMemory.values(),
      ...Array.from(this.agentMemories.values()).flatMap(m => Array.from(m.values()))
    ];
    
    allMemory.forEach(memory => {
      stats.totalSize += memory.metadata.size;
      
      if (!stats.oldestEntry || memory.metadata.timestamp < stats.oldestEntry.timestamp) {
        stats.oldestEntry = memory;
      }
      
      if (!stats.newestEntry || memory.metadata.timestamp > stats.newestEntry.timestamp) {
        stats.newestEntry = memory;
      }
    });
    
    // Access pattern stats
    for (const [agentId, patterns] of this.accessPatterns.entries()) {
      stats.accessPatterns[agentId] = {
        totalAccesses: patterns.totalAccesses,
        lastAccess: patterns.lastAccess,
        memoryTypes: Object.fromEntries(patterns.memoryTypes)
      };
    }
    
    return stats;
  }
}

/**
 * Memory indexing for fast search
 */
class MemoryIndex {
  constructor() {
    this.index = new Map();
    this.reverseIndex = new Map();
  }
  
  /**
   * Index memory entry for search
   */
  async index(memoryEntry) {
    const searchTerms = this.extractSearchTerms(memoryEntry);
    
    searchTerms.forEach(term => {
      if (!this.index.has(term)) {
        this.index.set(term, new Set());
      }
      this.index.get(term).add(memoryEntry.id);
    });
    
    this.reverseIndex.set(memoryEntry.id, searchTerms);
  }
  
  /**
   * Search memory index
   */
  async search(query, context = {}) {
    if (!query) return [];
    
    const queryTerms = this.extractSearchTerms({ key: query, value: query });
    const matchingIds = new Set();
    
    queryTerms.forEach(term => {
      if (this.index.has(term)) {
        this.index.get(term).forEach(id => matchingIds.add(id));
      }
    });
    
    // Convert IDs back to memory entries (simplified)
    return Array.from(matchingIds).map(id => ({ id, score: 1 }));
  }
  
  /**
   * Extract search terms from memory entry
   */
  extractSearchTerms(memoryEntry) {
    const terms = new Set();
    
    // Extract from key
    if (memoryEntry.key) {
      this.tokenize(memoryEntry.key).forEach(term => terms.add(term));
    }
    
    // Extract from value (if string)
    if (typeof memoryEntry.value === 'string') {
      this.tokenize(memoryEntry.value).forEach(term => terms.add(term));
    }
    
    // Extract from tags
    if (memoryEntry.tags) {
      memoryEntry.tags.forEach(tag => terms.add(tag.toLowerCase()));
    }
    
    return Array.from(terms);
  }
  
  /**
   * Tokenize text for indexing
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }
}

module.exports = SharedMemorySystem;
