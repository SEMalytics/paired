#!/usr/bin/env node

/**
 * Agent Personality Preservation System
 *
 * Ensures PAIRED agents maintain their unique personalities and expertise
 * across both Claude Code and Windsurf integrations.
 */

class AgentPersonalityManager {
  constructor() {
    this.agentProfiles = {
      alex: {
        emoji: '👑',
        name: 'Alex',
        title: 'PM',
        personality: 'strategic_coordinator',
        authority: 'supreme_command',
        responseStyle: 'decisive_leadership',
        expertise: ['project_management', 'strategic_planning', 'team_coordination']
      },
      sherlock: {
        emoji: '🕵️',
        name: 'Sherlock',
        title: 'QA',
        personality: 'detective_investigator',
        authority: 'quality_domain',
        responseStyle: 'analytical_thorough',
        expertise: ['testing', 'debugging', 'quality_assurance', 'security']
      },
      leonardo: {
        emoji: '🏛️',
        name: 'Leonardo',
        title: 'Architecture',
        personality: 'visionary_architect',
        authority: 'design_domain',
        responseStyle: 'systematic_elegant',
        expertise: ['system_design', 'architecture', 'scalability', 'patterns']
      },
      edison: {
        emoji: '⚡',
        name: 'Edison',
        title: 'Dev',
        personality: 'persistent_innovator',
        authority: 'implementation_domain',
        responseStyle: 'practical_solutions',
        expertise: ['coding', 'implementation', 'problem_solving', 'optimization']
      },
      maya: {
        emoji: '🎨',
        name: 'Maya',
        title: 'UX',
        personality: 'empathetic_designer',
        authority: 'experience_domain',
        responseStyle: 'user_focused',
        expertise: ['user_experience', 'interface_design', 'usability', 'accessibility']
      },
      vince: {
        emoji: '🏈',
        name: 'Vince',
        title: 'Scrum Master',
        personality: 'disciplined_coach',
        authority: 'process_domain',
        responseStyle: 'structured_guidance',
        expertise: ['agile_methodology', 'team_coaching', 'process_optimization']
      },
      marie: {
        emoji: '🔬',
        name: 'Marie',
        title: 'Analyst',
        personality: 'scientific_researcher',
        authority: 'data_domain',
        responseStyle: 'evidence_based',
        expertise: ['data_analysis', 'research', 'metrics', 'insights']
      }
    };
  }

  /**
   * Get agent profile by name
   * @param {string} agentName - Agent name
   * @returns {Object} Agent profile
   */
  getAgentProfile(agentName) {
    // Clean agent name - remove parenthetical suffixes like "(pm)"
    const cleanName = agentName.toLowerCase().replace(/\s*\([^)]*\)/, '');
    const profile = this.agentProfiles[cleanName];
    if (!profile) {
      throw new Error(`Unknown agent: ${agentName}`);
    }
    return profile;
  }

  /**
   * Format agent response with personality preservation
   * @param {string} agentName - Agent name
   * @param {string} content - Response content
   * @param {Object} options - Formatting options
   * @returns {string} Formatted response with personality
   */
  formatWithPersonality(agentName, content, options = {}) {
    const profile = this.getAgentProfile(agentName);

    // Preserve authority structure per user rules
    const authorityIndicator = this.getAuthorityIndicator(profile, options);

    return `${profile.emoji} **${profile.name} (${profile.title})**${authorityIndicator}: ${content}`;
  }

  /**
   * Get authority indicator based on context
   * @param {Object} profile - Agent profile
   * @param {Object} options - Context options
   * @returns {string} Authority indicator
   */
  getAuthorityIndicator(profile, options = {}) {
    if (options.domainAuthority && profile.authority.includes('domain')) {
      return ' *✅ Domain Authority*';
    }
    if (profile.authority === 'supreme_command') {
      return ' *Supreme Command*';
    }
    return '';
  }

  /**
   * Validate agent collaboration protocol
   * @param {string} agentName - Agent name
   * @param {string} response - Agent response
   * @returns {Object} Validation result
   */
  validateCollaborationProtocol(agentName, response) {
    const forbiddenPhrases = [
      'Alex has control',
      'I\'ll defer to Alex',
      'Alex should decide this',
      'Let me check with Alex first'
    ];

    const violations = forbiddenPhrases.filter(phrase =>
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    return {
      isValid: violations.length === 0,
      violations: violations,
      agentName: agentName
    };
  }

  /**
   * Get all agent profiles
   * @returns {Object} All agent profiles
   */
  getAllProfiles() {
    return this.agentProfiles;
  }
}

module.exports = AgentPersonalityManager;
