/**
 * Shared Memory System for PAIRED Agents
 *
 * Provides a centralized memory interface that can coordinate with individual
 * agent memory systems while maintaining shared knowledge across agents.
 */

const path = require('path');
const fs = require('fs').promises;
const BaseAgentMemory = require('../agents/base_agent_memory');

class SharedMemorySystem {
  constructor(config = {}) {
    this.config = {
      globalPath: config.globalPath || path.join(require('os').homedir(), '.paired', 'memory'),
      syncEnabled: config.syncEnabled !== false,
      ...config
    };

    // Individual agent memory instances
    this.agentMemories = new Map();

    // Shared knowledge store
    this.sharedKnowledge = new Map();
    this.crossAgentPatterns = new Map();

    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(this.config.globalPath, { recursive: true });
      await this.loadSharedKnowledge();
    } catch (error) {
      console.warn('Shared memory initialization warning:', error.message);
    }
  }

  /**
   * Get or create memory instance for an agent
   */
  getAgentMemory(agentName) {
    if (!this.agentMemories.has(agentName)) {
      const agentMemory = new BaseAgentMemory(agentName, {
        memoryPath: path.join(this.config.globalPath, 'agents', agentName),
        globalPath: this.config.globalPath,
        syncEnabled: this.config.syncEnabled
      });

      this.agentMemories.set(agentName, agentMemory);
    }

    return this.agentMemories.get(agentName);
  }

  /**
   * Record shared knowledge that multiple agents can access
   */
  async recordSharedKnowledge(key, knowledge, sourceAgent, confidence = 0.8) {
    this.sharedKnowledge.set(key, {
      knowledge,
      sourceAgent,
      confidence,
      timestamp: new Date().toISOString(),
      accessCount: 0
    });

    await this.saveSharedKnowledge();
  }

  /**
   * Retrieve shared knowledge
   */
  getSharedKnowledge(key) {
    const entry = this.sharedKnowledge.get(key);

    if (entry) {
      entry.accessCount += 1;
      return entry.knowledge;
    }

    return null;
  }

  /**
   * Record cross-agent collaboration patterns
   */
  async recordCollaborationPattern(agents, context, outcome, confidence = 0.8) {
    const patternKey = agents.sort().join('-');

    if (!this.crossAgentPatterns.has(patternKey)) {
      this.crossAgentPatterns.set(patternKey, []);
    }

    this.crossAgentPatterns.get(patternKey).push({
      context,
      outcome,
      confidence,
      timestamp: new Date().toISOString()
    });

    await this.saveCrossAgentPatterns();
  }

  /**
   * Get collaboration recommendations for agent combinations
   */
  getCollaborationRecommendations(agents, context) {
    const patternKey = agents.sort().join('-');
    const patterns = this.crossAgentPatterns.get(patternKey) || [];

    // Simple context matching for recommendations
    const contextStr = JSON.stringify(context).toLowerCase();
    const recommendations = [];

    for (const pattern of patterns.slice(-10)) { // Last 10 patterns
      const patternContextStr = JSON.stringify(pattern.context).toLowerCase();

      if (this.calculateStringSimilarity(contextStr, patternContextStr) > 0.6) {
        recommendations.push({
          recommendation: pattern.outcome,
          confidence: pattern.confidence,
          source: 'collaboration_pattern',
          agents: agents,
          timestamp: pattern.timestamp
        });
      }
    }

    return recommendations;
  }

  /**
   * Sync all agent memories with shared knowledge
   */
  async syncAllAgentMemories() {
    const syncResults = {};

    for (const [agentName, agentMemory] of this.agentMemories) {
      try {
        syncResults[agentName] = await agentMemory.syncMemory();
      } catch (error) {
        syncResults[agentName] = { error: error.message };
      }
    }

    return syncResults;
  }

  /**
   * Get memory status for all agents
   */
  getMemoryStatus() {
    const status = {
      shared_knowledge_entries: this.sharedKnowledge.size,
      collaboration_patterns: this.crossAgentPatterns.size,
      active_agents: this.agentMemories.size,
      agents: {}
    };

    for (const [agentName, agentMemory] of this.agentMemories) {
      status.agents[agentName] = {
        semantic_memory: agentMemory.semanticMemory.size,
        working_memory: agentMemory.workingMemory.size,
        episodic_memory: agentMemory.episodicMemory.length,
        learning_stats: agentMemory.learningStats
      };
    }

    return status;
  }

  // Private helper methods

  calculateStringSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);

    const commonWords = words1.filter(word =>
      word.length > 3 && words2.includes(word)
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  async loadSharedKnowledge() {
    try {
      const knowledgePath = path.join(this.config.globalPath, 'shared_knowledge.json');

      if (await this.fileExists(knowledgePath)) {
        const data = await fs.readFile(knowledgePath, 'utf8');
        const knowledgeData = JSON.parse(data);

        this.sharedKnowledge = new Map(Object.entries(knowledgeData));
      }
    } catch (error) {
      // Start with empty shared knowledge
    }
  }

  async saveSharedKnowledge() {
    try {
      const knowledgePath = path.join(this.config.globalPath, 'shared_knowledge.json');
      const knowledgeData = Object.fromEntries(this.sharedKnowledge);

      await fs.writeFile(knowledgePath, JSON.stringify(knowledgeData, null, 2));
    } catch (error) {
      console.warn('Could not save shared knowledge:', error.message);
    }
  }

  async saveCrossAgentPatterns() {
    try {
      const patternsPath = path.join(this.config.globalPath, 'collaboration_patterns.json');
      const patternsData = Object.fromEntries(this.crossAgentPatterns);

      await fs.writeFile(patternsPath, JSON.stringify(patternsData, null, 2));
    } catch (error) {
      console.warn('Could not save collaboration patterns:', error.message);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = SharedMemorySystem;
