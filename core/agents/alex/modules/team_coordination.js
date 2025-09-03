/**
 * Team Coordination Module for PM Agent (Alex)
 *
 * Integrates agent trigger patterns directly into Alex's communication processing
 * to enable intelligent delegation and coordinated responses with learning capabilities.
 */

class TeamCoordination {
  constructor(pmAgent) {
    this.pmAgent = pmAgent;
    this.agentTriggers = new Map();
    this.learningPatterns = new Map(); // For adaptive learning
    this.delegationHistory = []; // Track delegation success
    this.triggerThresholds = new Map(); // Adaptive thresholds per specialist
    this.delegationFeedback = new Map(); // Track delegation success rates
    this.setupAgentTriggers();
    this.initializeAdaptiveThresholds();
  }

  /**
   * Setup agent trigger patterns for intelligent delegation
   */
  setupAgentTriggers() {
    this.agentTriggers.set('qa_specialist', {
      keywords: ['test', 'testing', 'quality', 'bug', 'debug', 'coverage', 'spec', 'qa', 'quality assurance'],
      patterns: [/test/i, /quality/i, /bug/i, /debug/i, /coverage/i, /spec/i],
      agent: 'Sherlock',
      agentId: 'qa_agent',
      emoji: '🕵️',
      specialization: 'Quality Analysis and Testing',
      confidence: 0.8
    });

    this.agentTriggers.set('architecture_specialist', {
      keywords: ['architecture', 'design', 'pattern', 'structure', 'system', 'config', 'setup', 'framework'],
      patterns: [/architecture/i, /design/i, /pattern/i, /structure/i, /system/i, /config/i],
      agent: 'Leonardo',
      agentId: 'architecture_agent',
      emoji: '🏛️',
      specialization: 'System Architecture and Design',
      confidence: 0.8
    });

    this.agentTriggers.set('dev_specialist', {
      keywords: ['implement', 'code', 'coding', 'function', 'class', 'method', 'algorithm', 'programming', 'development'],
      patterns: [/implement/i, /code/i, /coding/i, /function/i, /class/i, /method/i, /algorithm/i],
      agent: 'Edison',
      agentId: 'dev_agent',
      emoji: '⚡',
      specialization: 'Development and Implementation',
      confidence: 0.8
    });

    this.agentTriggers.set('ux_specialist', {
      keywords: ['ui', 'ux', 'user experience', 'interface', 'design', 'usability', 'accessibility', 'user'],
      patterns: [/ui/i, /ux/i, /user.*experience/i, /interface/i, /usability/i, /accessibility/i],
      agent: 'Maya',
      agentId: 'ux_expert_agent',
      emoji: '🎨',
      specialization: 'User Experience and Interface Design',
      confidence: 0.8
    });

    this.agentTriggers.set('scrum_specialist', {
      keywords: ['sprint', 'scrum', 'ceremony', 'standup', 'retrospective', 'impediment', 'velocity', 'backlog'],
      patterns: [/sprint/i, /scrum/i, /ceremony/i, /standup/i, /retrospective/i, /impediment/i],
      agent: 'Vince',
      agentId: 'scrum_master_agent',
      emoji: '🏈',
      specialization: 'Scrum Process and Team Coaching',
      confidence: 0.8
    });

    this.agentTriggers.set('analyst_specialist', {
      keywords: ['data', 'analysis', 'metrics', 'report', 'statistics', 'performance', 'analytics', 'insights'],
      patterns: [/data/i, /analysis/i, /metrics/i, /report/i, /statistics/i, /performance/i],
      agent: 'Marie',
      agentId: 'analyst_agent',
      emoji: '🔬',
      specialization: 'Data Analysis and Strategic Insights',
      confidence: 0.8
    });
  }

  /**
   * Analyze user message and determine if specialists should be consulted
   */
  analyzeMessageForDelegation(userMessage) {
    const message = userMessage.toLowerCase();
    const triggeredSpecialists = [];

    for (const [specialistKey, trigger] of this.agentTriggers) {
      let confidence = 0;
      const matchReasons = [];

      // Check keywords (more generous scoring)
      const keywordMatches = trigger.keywords.filter(keyword =>
        message.includes(keyword.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        confidence += 0.5 + (keywordMatches.length * 0.1); // Base 0.5 + bonus per match
        matchReasons.push(`keywords: ${keywordMatches.join(', ')}`);
      }

      // Check patterns (more generous scoring)
      const patternMatches = trigger.patterns.filter(pattern => pattern.test(message));
      if (patternMatches.length > 0) {
        confidence += 0.4 + (patternMatches.length * 0.1); // Base 0.4 + bonus per match
        matchReasons.push(`patterns: ${patternMatches.length} matches`);
      }

      // Apply learning adjustments
      const learningBonus = this.getLearningBonus(specialistKey, message);
      confidence += learningBonus;

      // Use adaptive thresholds
      const triggerThreshold = this.getAdaptiveThreshold(specialistKey, 'trigger');
      const delegationThreshold = this.getAdaptiveThreshold(specialistKey, 'delegation');

      // Only trigger if confidence is above adaptive threshold
      if (confidence > triggerThreshold) {
        triggeredSpecialists.push({
          ...trigger,
          confidence: Math.min(confidence, 1.0),
          matchReasons,
          shouldDelegate: confidence > delegationThreshold,
          thresholds: { trigger: triggerThreshold, delegation: delegationThreshold }
        });
      }
    }

    // Sort by confidence
    return triggeredSpecialists.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get learning bonus based on historical patterns
   */
  getLearningBonus(specialistKey, message) {
    const patterns = this.learningPatterns.get(specialistKey) || [];
    let bonus = 0;

    for (const pattern of patterns) {
      if (message.includes(pattern.phrase)) {
        bonus += pattern.weight * 0.1; // Small learning bonus
      }
    }

    return Math.min(bonus, 0.2); // Cap learning bonus
  }

  /**
   * Generate Alex's coordinated response with specialist consultation
   */
  async generateCoordinatedResponse(userMessage, projectContext = {}) {
    const triggeredSpecialists = this.analyzeMessageForDelegation(userMessage);

    // Alex handles the response directly first
    let response = this.generateAlexDirectResponse(userMessage, triggeredSpecialists);

    // If high-confidence specialists are identified, coordinate with them
    const highConfidenceSpecialists = triggeredSpecialists.filter(s => s.shouldDelegate);

    if (highConfidenceSpecialists.length > 0) {
      response += '\n\n' + this.generateDelegationCoordination(highConfidenceSpecialists, userMessage);
    }

    // Learn from this interaction
    this.learnFromInteraction(userMessage, triggeredSpecialists);

    return response;
  }

  /**
   * Generate Alex's direct response (his primary PM capabilities)
   */
  generateAlexDirectResponse(userMessage, triggeredSpecialists) {
    const message = userMessage.toLowerCase();

    // Alex's core PM responses
    if (message.includes('plan') || message.includes('project')) {
      return '👑 Alex here! I\'m analyzing your project needs. Let me coordinate the right approach and resources for this.';
    }

    if (message.includes('timeline') || message.includes('schedule')) {
      return '👑 Alex: I\'ll help you establish a realistic timeline with proper milestones and dependencies.';
    }

    if (message.includes('team') || message.includes('resource')) {
      return '👑 Alex: Resource coordination is my specialty. I\'ll ensure we have the right team members engaged at the right time.';
    }

    if (message.includes('status') || message.includes('progress')) {
      return '👑 Alex: Let me provide a comprehensive status update and identify any blockers or opportunities.';
    }

    // Default Alex response
    return '👑 Alex: I\'m coordinating the team response to ensure we address all aspects of your request effectively.';
  }

  /**
   * Generate delegation coordination message
   */
  generateDelegationCoordination(specialists, userMessage) {
    if (specialists.length === 1) {
      const specialist = specialists[0];
      return `I'm bringing in ${specialist.emoji} ${specialist.agent} for ${specialist.specialization.toLowerCase()} on this. They'll provide specialized insights while I coordinate the overall approach.`;
    } else {
      const specialistList = specialists.map(s => `${s.emoji} ${s.agent}`).join(', ');
      return `This requires coordination across multiple specialties. I'm engaging ${specialistList} to ensure we cover all aspects comprehensively.`;
    }
  }

  /**
   * Learn from interaction patterns
   */
  learnFromInteraction(userMessage, triggeredSpecialists) {
    // Extract potential new patterns for learning
    const words = userMessage.toLowerCase().split(/\s+/);

    for (const specialist of triggeredSpecialists) {
      if (specialist.confidence > 0.6) {
        // Learn new phrases that trigger this specialist
        const existingPatterns = this.learningPatterns.get(specialist.agentId) || [];

        // Look for 2-3 word phrases that might be new triggers
        for (let i = 0; i < words.length - 1; i++) {
          const phrase = words.slice(i, i + 2).join(' ');
          if (phrase.length > 3 && !specialist.keywords.includes(phrase)) {
            const existing = existingPatterns.find(p => p.phrase === phrase);
            if (existing) {
              existing.weight = Math.min(existing.weight + 0.1, 1.0);
            } else {
              existingPatterns.push({ phrase, weight: 0.1 });
            }
          }
        }

        // Keep only top patterns
        existingPatterns.sort((a, b) => b.weight - a.weight);
        this.learningPatterns.set(specialist.agentId, existingPatterns.slice(0, 10));
      }
    }

    // Record delegation history for future analysis
    this.delegationHistory.push({
      timestamp: Date.now(),
      message: userMessage,
      specialists: triggeredSpecialists.map(s => ({
        agent: s.agent,
        confidence: s.confidence,
        delegated: s.shouldDelegate
      }))
    });

    // Keep history manageable
    if (this.delegationHistory.length > 100) {
      this.delegationHistory = this.delegationHistory.slice(-50);
    }
  }

  /**
   * Get delegation statistics for Alex's learning
   */
  getDelegationStats() {
    const stats = {
      totalInteractions: this.delegationHistory.length,
      specialistUsage: {},
      learningPatterns: {}
    };

    for (const interaction of this.delegationHistory) {
      for (const specialist of interaction.specialists) {
        if (!stats.specialistUsage[specialist.agent]) {
          stats.specialistUsage[specialist.agent] = { triggered: 0, delegated: 0 };
        }
        stats.specialistUsage[specialist.agent].triggered++;
        if (specialist.delegated) {
          stats.specialistUsage[specialist.agent].delegated++;
        }
      }
    }

    // Convert learning patterns to readable format
    for (const [agentId, patterns] of this.learningPatterns) {
      stats.learningPatterns[agentId] = patterns.map(p => ({
        phrase: p.phrase,
        strength: Math.round(p.weight * 100)
      }));
    }

    return stats;
  }

  /**
   * Initialize adaptive thresholds for each specialist
   */
  initializeAdaptiveThresholds() {
    const defaultThresholds = {
      triggerThreshold: 0.2,
      delegationThreshold: 0.4,
      adjustmentRate: 0.05, // How much to adjust per feedback
      minThreshold: 0.1,
      maxThreshold: 0.8
    };

    for (const [specialistKey] of this.agentTriggers) {
      this.triggerThresholds.set(specialistKey, { ...defaultThresholds });
      this.delegationFeedback.set(specialistKey, {
        successful: 0,
        unsuccessful: 0,
        totalDelegations: 0,
        recentFeedback: [] // Last 10 feedback items
      });
    }
  }

  /**
   * Get adaptive threshold for a specialist
   */
  getAdaptiveThreshold(specialistKey, type = 'trigger') {
    const thresholds = this.triggerThresholds.get(specialistKey);
    if (!thresholds) return type === 'trigger' ? 0.2 : 0.4;

    return type === 'trigger' ? thresholds.triggerThreshold : thresholds.delegationThreshold;
  }

  /**
   * Provide feedback on delegation success to adjust thresholds
   */
  provideDelegationFeedback(specialistKey, wasSuccessful, userSatisfaction = 0.5) {
    const feedback = this.delegationFeedback.get(specialistKey);
    const thresholds = this.triggerThresholds.get(specialistKey);

    if (!feedback || !thresholds) return;

    // Record feedback
    feedback.totalDelegations++;
    if (wasSuccessful) {
      feedback.successful++;
    } else {
      feedback.unsuccessful++;
    }

    // Add to recent feedback (keep last 10)
    feedback.recentFeedback.push({
      successful: wasSuccessful,
      satisfaction: userSatisfaction,
      timestamp: Date.now()
    });
    if (feedback.recentFeedback.length > 10) {
      feedback.recentFeedback.shift();
    }

    // Adjust thresholds based on success rate
    const successRate = feedback.successful / feedback.totalDelegations;
    const recentSuccessRate = feedback.recentFeedback.filter(f => f.successful).length / feedback.recentFeedback.length;

    // If success rate is low, raise thresholds (be more selective)
    // If success rate is high, lower thresholds (be more inclusive)
    if (recentSuccessRate < 0.3) {
      // Poor recent performance - raise thresholds
      thresholds.triggerThreshold = Math.min(
        thresholds.triggerThreshold + thresholds.adjustmentRate,
        thresholds.maxThreshold
      );
      thresholds.delegationThreshold = Math.min(
        thresholds.delegationThreshold + thresholds.adjustmentRate,
        thresholds.maxThreshold
      );
    } else if (recentSuccessRate > 0.7) {
      // Good recent performance - lower thresholds
      thresholds.triggerThreshold = Math.max(
        thresholds.triggerThreshold - thresholds.adjustmentRate,
        thresholds.minThreshold
      );
      thresholds.delegationThreshold = Math.max(
        thresholds.delegationThreshold - thresholds.adjustmentRate,
        thresholds.minThreshold
      );
    }

    // Adjust based on user satisfaction
    if (userSatisfaction < 0.3) {
      // User was not satisfied - raise thresholds
      thresholds.delegationThreshold = Math.min(
        thresholds.delegationThreshold + (thresholds.adjustmentRate * 2),
        thresholds.maxThreshold
      );
    } else if (userSatisfaction > 0.8) {
      // User was very satisfied - slightly lower thresholds
      thresholds.triggerThreshold = Math.max(
        thresholds.triggerThreshold - (thresholds.adjustmentRate * 0.5),
        thresholds.minThreshold
      );
    }
  }

  /**
   * Auto-adjust thresholds based on historical performance
   */
  autoAdjustThresholds() {
    for (const [specialistKey, feedback] of this.delegationFeedback) {
      if (feedback.totalDelegations < 5) continue; // Need minimum data

      const thresholds = this.triggerThresholds.get(specialistKey);
      if (!thresholds) continue;

      const successRate = feedback.successful / feedback.totalDelegations;
      const avgSatisfaction = feedback.recentFeedback.reduce((sum, f) => sum + f.satisfaction, 0) / feedback.recentFeedback.length;

      // Gradual adjustment based on overall performance
      if (successRate < 0.4 || avgSatisfaction < 0.4) {
        // Generally poor performance - be more conservative
        thresholds.triggerThreshold = Math.min(
          thresholds.triggerThreshold + 0.02,
          thresholds.maxThreshold
        );
      } else if (successRate > 0.8 && avgSatisfaction > 0.7) {
        // Generally good performance - be more inclusive
        thresholds.triggerThreshold = Math.max(
          thresholds.triggerThreshold - 0.01,
          thresholds.minThreshold
        );
      }
    }
  }

  /**
   * Get adaptive performance statistics
   */
  getAdaptiveStats() {
    const stats = {
      thresholds: {},
      performance: {},
      adaptations: 0
    };

    for (const [specialistKey, thresholds] of this.triggerThresholds) {
      const feedback = this.delegationFeedback.get(specialistKey);
      const trigger = this.agentTriggers.get(specialistKey);

      stats.thresholds[trigger.agent] = {
        trigger: thresholds.triggerThreshold.toFixed(3),
        delegation: thresholds.delegationThreshold.toFixed(3),
        adjustmentRate: thresholds.adjustmentRate
      };

      if (feedback.totalDelegations > 0) {
        stats.performance[trigger.agent] = {
          successRate: (feedback.successful / feedback.totalDelegations * 100).toFixed(1) + '%',
          totalDelegations: feedback.totalDelegations,
          recentPerformance: feedback.recentFeedback.length > 0 ?
            (feedback.recentFeedback.filter(f => f.successful).length / feedback.recentFeedback.length * 100).toFixed(1) + '%' : 'N/A'
        };
      }

      // Count adaptations (how far from default)
      if (Math.abs(thresholds.triggerThreshold - 0.2) > 0.05) {
        stats.adaptations++;
      }
    }

    return stats;
  }

  /**
   * Reset learning patterns (for testing or refinement)
   */
  resetLearning() {
    this.learningPatterns.clear();
    this.delegationHistory = [];
    this.initializeAdaptiveThresholds(); // Reset adaptive thresholds too
  }
}

module.exports = TeamCoordination;
