/**
 * Base Agent Memory - Enhanced Learning Integration for PAIRED Agents
 *
 * This module provides the base memory and learning capabilities that all
 * PAIRED agents inherit, enabling them to learn from interactions, recognize
 * patterns, and improve their performance over time.
 *
 * Philosophy: "Intelligence Through Adaptation"
 * - Each agent develops specialized expertise through experience
 * - Patterns are recognized and applied to similar contexts
 * - Learning is shared across projects while maintaining agent identity
 * - Continuous improvement through feedback and outcome tracking
 */

// Optional dependencies - gracefully handle missing modules
let LearningTracker, PatternMatcher, MemorySync;
try {
  LearningTracker = require('../core/learning_tracker.py');
} catch (e) { LearningTracker = null; }
try {
  PatternMatcher = require('../core/pattern_matcher');
} catch (e) { PatternMatcher = null; }
try {
  MemorySync = require('../core/memory_sync');
} catch (e) { MemorySync = null; }

const { spawn } = require('child_process');
const path = require('path');

class BaseAgentMemory {
  constructor(agentName, config = {}) {
    this.agentName = agentName;
    this.config = {
      memoryPath: config.memoryPath || './.paired/memory',
      globalPath: config.globalPath || path.join(require('os').homedir(), '.paired'),
      learningEnabled: config.learningEnabled !== false,
      patternMatchingEnabled: config.patternMatchingEnabled !== false,
      syncEnabled: config.syncEnabled !== false,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      maxMemorySize: config.maxMemorySize || 50 * 1024 * 1024, // 50MB
      ...config
    };

    // Initialize learning systems (with fallbacks for missing modules)
    this.patternMatcher = PatternMatcher ? new PatternMatcher({
      patternsPath: path.join(this.config.memoryPath, 'patterns'),
      confidenceThreshold: this.config.confidenceThreshold
    }) : null;

    this.memorySync = MemorySync ? new MemorySync({
      projectPath: process.cwd(),
      globalPath: this.config.globalPath,
      autoSync: this.config.syncEnabled
    }) : null;

    // Agent-specific memory stores
    this.shortTermMemory = new Map(); // Current session memory
    this.workingMemory = new Map();   // Active task memory
    this.episodicMemory = [];         // Interaction history
    this.semanticMemory = new Map();  // Learned knowledge

    // Learning statistics
    this.learningStats = {
      totalInteractions: 0,
      successfulOutcomes: 0,
      patternsLearned: 0,
      recommendationsGiven: 0,
      lastLearningEvent: null
    };

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadAgentMemory();
      await this.loadLearningStats();

      if (this.config.learningEnabled) {
        console.log(`🧠 ${this.agentName} memory system initialized`);
      }
    } catch (error) {
      console.warn(`${this.agentName} memory initialization warning:`, error.message);
    }
  }

  /**
   * Record a learning event from agent interaction
   */
  async recordLearning(context, action, outcome, confidence = 0.8) {
    if (!this.config.learningEnabled) return null;

    try {
      // Determine pattern type based on agent specialization and context
      const patternType = this.determinePatternType(context, action);

      // Record in pattern matcher
      const patternId = this.patternMatcher ? await this.patternMatcher.registerPattern(
        this.agentName,
        patternType,
        context,
        outcome,
        confidence
      ) : null;

      // Record in Python learning tracker
      const learningId = await this.recordInLearningTracker(
        patternType,
        context,
        outcome,
        confidence
      );

      // Update episodic memory
      this.episodicMemory.push({
        timestamp: new Date().toISOString(),
        context,
        action,
        outcome,
        confidence,
        patternId,
        learningId
      });

      // Limit episodic memory size
      if (this.episodicMemory.length > 1000) {
        this.episodicMemory = this.episodicMemory.slice(-800);
      }

      // Update learning statistics
      this.learningStats.totalInteractions += 1;
      if (confidence > this.config.confidenceThreshold) {
        this.learningStats.successfulOutcomes += 1;
      }
      this.learningStats.lastLearningEvent = new Date().toISOString();

      await this.saveLearningStats();

      return { patternId, learningId };

    } catch (error) {
      console.warn(`${this.agentName} learning recording failed:`, error.message);
      return null;
    }
  }

  /**
   * Get recommendations based on current context
   */
  async getRecommendations(context, limit = 5) {
    const recommendations = [];

    try {
      // Get pattern-based recommendations
      if (this.config.patternMatchingEnabled && this.patternMatcher) {
        const patternRecs = await this.patternMatcher.getPatternRecommendations(
          this.agentName,
          context,
          limit
        );
        recommendations.push(...patternRecs);
      }

      // Get global knowledge recommendations
      if (this.config.syncEnabled && this.memorySync) {
        const globalRecs = await this.memorySync.getGlobalRecommendations(
          context,
          this.agentName,
          limit
        );
        recommendations.push(...globalRecs);
      }

      // Get episodic memory recommendations
      const episodicRecs = this.getEpisodicRecommendations(context, limit);
      recommendations.push(...episodicRecs);

      // Sort by confidence and remove duplicates
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      uniqueRecs.sort((a, b) => b.confidence - a.confidence);

      this.learningStats.recommendationsGiven += uniqueRecs.length;

      return uniqueRecs.slice(0, limit);

    } catch (error) {
      console.warn(`${this.agentName} recommendation generation failed:`, error.message);
      return [];
    }
  }

  /**
   * Store information in working memory for current task
   */
  setWorkingMemory(key, value, ttl = 3600000) { // 1 hour default TTL
    this.workingMemory.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Clean expired entries
    this.cleanExpiredMemory();
  }

  /**
   * Retrieve information from working memory
   */
  getWorkingMemory(key) {
    const entry = this.workingMemory.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.workingMemory.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Store information in short-term memory for current session
   */
  setShortTermMemory(key, value) {
    this.shortTermMemory.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Retrieve information from short-term memory
   */
  getShortTermMemory(key) {
    const entry = this.shortTermMemory.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Store learned knowledge in semantic memory
   */
  async addSemanticKnowledge(concept, knowledge, confidence = 0.8) {
    this.semanticMemory.set(concept, {
      knowledge,
      confidence,
      timestamp: new Date().toISOString(),
      usage_count: 0
    });

    await this.saveAgentMemory();
  }

  /**
   * Retrieve learned knowledge from semantic memory
   */
  getSemanticKnowledge(concept) {
    const entry = this.semanticMemory.get(concept);

    if (entry) {
      entry.usage_count += 1;
      return entry.knowledge;
    }

    return null;
  }

  /**
   * Analyze agent's learning progress and effectiveness
   */
  async analyzeLearningProgress() {
    const analysis = {
      agent: this.agentName,
      timestamp: new Date().toISOString(),
      statistics: { ...this.learningStats },
      memory_usage: {
        short_term: this.shortTermMemory.size,
        working: this.workingMemory.size,
        episodic: this.episodicMemory.length,
        semantic: this.semanticMemory.size
      },
      effectiveness: {},
      recommendations: []
    };

    // Calculate effectiveness metrics
    if (this.learningStats.totalInteractions > 0) {
      analysis.effectiveness.success_rate =
        this.learningStats.successfulOutcomes / this.learningStats.totalInteractions;

      analysis.effectiveness.learning_rate =
        this.learningStats.patternsLearned / this.learningStats.totalInteractions;

      analysis.effectiveness.recommendation_ratio =
        this.learningStats.recommendationsGiven / this.learningStats.totalInteractions;
    }

    // Get pattern analysis
    if (this.config.patternMatchingEnabled && this.patternMatcher) {
      analysis.pattern_analysis = await this.patternMatcher.analyzePatternEffectiveness(
        this.agentName,
        30
      );
    }

    // Generate improvement recommendations
    analysis.recommendations = this.generateImprovementRecommendations(analysis);

    return analysis;
  }

  /**
   * Sync agent memory with global knowledge base
   */
  async syncMemory() {
    if (!this.config.syncEnabled || !this.memorySync) return null;

    try {
      const syncResults = await this.memorySync.performFullSync();

      // Update learning statistics
      this.learningStats.lastSync = new Date().toISOString();
      await this.saveLearningStats();

      return syncResults;

    } catch (error) {
      console.warn(`${this.agentName} memory sync failed:`, error.message);
      return null;
    }
  }

  /**
   * Export agent memory for analysis or sharing
   */
  async exportMemory(includePrivate = false) {
    const exportData = {
      agent: this.agentName,
      timestamp: new Date().toISOString(),
      statistics: this.learningStats,
      semantic_memory: includePrivate ?
        Object.fromEntries(this.semanticMemory) :
        this.anonymizeSemanticMemory(),
      recent_episodes: this.episodicMemory.slice(-50), // Last 50 episodes
      pattern_summary: await this.getPatternSummary()
    };

    return exportData;
  }

  // Private helper methods

  determinePatternType(context, action) {
    // Agent-specific pattern type determination
    const agentPatternTypes = {
      'sherlock': ['bug_analysis', 'quality_check', 'test_strategy', 'code_review'],
      'leonardo': ['architecture_design', 'system_structure', 'component_design', 'pattern_application'],
      'edison': ['implementation_strategy', 'optimization', 'problem_solving', 'debugging'],
      'alex': ['project_coordination', 'workflow_optimization', 'team_management', 'planning'],
      'maya': ['user_experience', 'interface_design', 'usability_analysis', 'interaction_design'],
      'vince': ['process_improvement', 'team_coordination', 'ceremony_facilitation', 'impediment_resolution'],
      'marie': ['data_analysis', 'research_methodology', 'insight_generation', 'pattern_discovery']
    };

    const agentTypes = agentPatternTypes[this.agentName] || ['general_analysis'];

    // Simple heuristic to determine pattern type based on context
    const contextStr = JSON.stringify(context).toLowerCase();

    for (const patternType of agentTypes) {
      const keywords = patternType.split('_');
      if (keywords.some(keyword => contextStr.includes(keyword))) {
        return patternType;
      }
    }

    return agentTypes[0]; // Default to first type
  }

  async recordInLearningTracker(patternType, context, outcome, confidence) {
    try {
      // Call Python learning tracker
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
          path.join(__dirname, '../core/learning_tracker.py'),
          'record',
          this.agentName,
          patternType,
          JSON.stringify(context),
          outcome,
          confidence.toString()
        ]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim());
          } else {
            reject(new Error(`Learning tracker failed with code ${code}`));
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Learning tracker timeout'));
        }, 5000);
      });
    } catch (error) {
      console.warn('Python learning tracker not available:', error.message);
      return null;
    }
  }

  getEpisodicRecommendations(context, limit) {
    const recommendations = [];
    const contextStr = JSON.stringify(context).toLowerCase();

    // Find similar past episodes
    for (const episode of this.episodicMemory.slice(-100)) { // Check last 100 episodes
      const episodeContextStr = JSON.stringify(episode.context).toLowerCase();

      // Simple similarity check
      const similarity = this.calculateStringSimilarity(contextStr, episodeContextStr);

      if (similarity > 0.6 && episode.confidence > this.config.confidenceThreshold) {
        recommendations.push({
          recommendation: `Based on similar past experience: ${episode.outcome}`,
          confidence: similarity * episode.confidence,
          source: 'episodic_memory',
          timestamp: episode.timestamp
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  calculateStringSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);

    const commonWords = words1.filter(word =>
      word.length > 3 && words2.includes(word)
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    const unique = [];

    for (const rec of recommendations) {
      const key = rec.recommendation.toLowerCase().substring(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }

  cleanExpiredMemory() {
    const now = Date.now();

    for (const [key, entry] of this.workingMemory) {
      if (now - entry.timestamp > entry.ttl) {
        this.workingMemory.delete(key);
      }
    }
  }

  generateImprovementRecommendations(analysis) {
    const recommendations = [];

    if (analysis.effectiveness.success_rate < 0.7) {
      recommendations.push('Consider adjusting confidence thresholds or improving pattern recognition');
    }

    if (analysis.effectiveness.learning_rate < 0.1) {
      recommendations.push('Increase learning frequency by recording more interactions');
    }

    if (analysis.memory_usage.semantic < 10) {
      recommendations.push('Build semantic knowledge base by recording more learned concepts');
    }

    return recommendations;
  }

  anonymizeSemanticMemory() {
    const anonymized = {};

    for (const [concept, data] of this.semanticMemory) {
      anonymized[concept] = {
        confidence: data.confidence,
        usage_count: data.usage_count,
        timestamp: data.timestamp
        // Knowledge content omitted for privacy
      };
    }

    return anonymized;
  }

  async getPatternSummary() {
    if (!this.config.patternMatchingEnabled || !this.patternMatcher) return null;

    try {
      const analysis = await this.patternMatcher.analyzePatternEffectiveness(this.agentName, 30);
      return {
        total_patterns: analysis.total_patterns,
        effective_patterns: analysis.effective_patterns,
        top_pattern_types: analysis.top_patterns.slice(0, 5).map(p => p.type)
      };
    } catch {
      return null;
    }
  }

  async loadAgentMemory() {
    try {
      const memoryPath = path.join(this.config.memoryPath, `${this.agentName}_semantic_memory.json`);
      const fs = require('fs').promises;

      if (await this.fileExists(memoryPath)) {
        const data = await fs.readFile(memoryPath, 'utf8');
        const memoryData = JSON.parse(data);

        this.semanticMemory = new Map(Object.entries(memoryData));
      }
    } catch (error) {
      // Start with empty semantic memory
    }
  }

  async saveAgentMemory() {
    try {
      const memoryPath = path.join(this.config.memoryPath, `${this.agentName}_semantic_memory.json`);
      const fs = require('fs').promises;

      await fs.mkdir(path.dirname(memoryPath), { recursive: true });

      const memoryData = Object.fromEntries(this.semanticMemory);
      await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
    } catch (error) {
      console.warn(`Could not save ${this.agentName} semantic memory:`, error.message);
    }
  }

  async loadLearningStats() {
    try {
      const statsPath = path.join(this.config.memoryPath, `${this.agentName}_learning_stats.json`);
      const fs = require('fs').promises;

      if (await this.fileExists(statsPath)) {
        const data = await fs.readFile(statsPath, 'utf8');
        const stats = JSON.parse(data);

        this.learningStats = { ...this.learningStats, ...stats };
      }
    } catch (error) {
      // Start with default stats
    }
  }

  async saveLearningStats() {
    try {
      const statsPath = path.join(this.config.memoryPath, `${this.agentName}_learning_stats.json`);
      const fs = require('fs').promises;

      await fs.mkdir(path.dirname(statsPath), { recursive: true });
      await fs.writeFile(statsPath, JSON.stringify(this.learningStats, null, 2));
    } catch (error) {
      console.warn(`Could not save ${this.agentName} learning stats:`, error.message);
    }
  }

  async fileExists(filePath) {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = BaseAgentMemory;
