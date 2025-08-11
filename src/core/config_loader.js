/**
 * WEE Configuration Loader
 * 
 * Loads and manages global and project-specific WEE configurations,
 * with special focus on team-based communication settings.
 * 
 * Philosophy: "Configuration-Driven Team Experience"
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');

class ConfigLoader {
  constructor() {
    this.globalConfigPath = path.join(os.homedir(), '.wee', 'config', 'wee_global_config.yml');
    this.projectConfigPath = path.join(process.cwd(), '.wee', 'config', 'wee_project_config.yml');
    this.config = null;
  }

  /**
   * Load configuration with fallbacks
   */
  async loadConfig() {
    try {
      // Load global config first
      const globalConfig = await this.loadGlobalConfig();
      
      // Try to load project config (optional)
      const projectConfig = await this.loadProjectConfig();
      
      // Merge configurations (project overrides global)
      this.config = this.mergeConfigs(globalConfig, projectConfig);
      
      return this.config;
    } catch (error) {
      console.warn('⚠️  Warning: Could not load WEE configuration, using defaults');
      return this.getDefaultConfig();
    }
  }

  /**
   * Load global WEE configuration
   */
  async loadGlobalConfig() {
    try {
      const configContent = await fs.readFile(this.globalConfigPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      console.warn('⚠️  Global config not found, using defaults');
      return this.getDefaultConfig();
    }
  }

  /**
   * Load project-specific configuration
   */
  async loadProjectConfig() {
    try {
      const configContent = await fs.readFile(this.projectConfigPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      // Project config is optional
      return {};
    }
  }

  /**
   * Merge global and project configurations
   */
  mergeConfigs(globalConfig, projectConfig) {
    return {
      ...globalConfig,
      ...projectConfig,
      communication: {
        ...globalConfig.communication,
        ...projectConfig.communication
      },
      agents: {
        ...globalConfig.communication?.agents,
        ...projectConfig.communication?.agents
      }
    };
  }

  /**
   * Get default configuration (fallback)
   */
  getDefaultConfig() {
    return {
      wee: {
        version: "2.0.0",
        installation_type: "global"
      },
      communication: {
        default_mode: "team_based",
        agent_personalities: {
          enabled: true,
          use_agent_names: true,
          show_agent_expertise: true,
          team_coordination: true
        },
        agents: {
          qa_agent: {
            name: "Sherlock",
            persona: "Detective who never misses a bug",
            emoji: "🕵️",
            voice: "Investigative, methodical, detail-oriented"
          },
          architecture_agent: {
            name: "Leonardo", 
            persona: "Renaissance genius designing systems",
            emoji: "🏛️",
            voice: "Visionary, systematic, elegant design focus"
          },
          dev_agent: {
            name: "Edison",
            persona: "Prolific inventor solving technical challenges", 
            emoji: "⚡",
            voice: "Innovative, practical, solution-focused"
          },
          pm_agent: {
            name: "Alex",
            full_name: "Alexander",
            persona: "Strategic coordinator like Alexander the Great",
            emoji: "👑", 
            voice: "Strategic, coordinating, leadership-focused"
          },
          ux_expert_agent: {
            name: "Maya",
            persona: "Understanding human experience like Maya Angelou",
            emoji: "🎨",
            voice: "Empathetic, user-focused, experience-driven"
          },
          scrum_master_agent: {
            name: "Vince",
            persona: "Team coach like Vince Lombardi", 
            emoji: "🏈",
            voice: "Motivational, process-focused, team-building"
          },
          analyst_agent: {
            name: "Marie",
            persona: "Research scientist like Marie Curie",
            emoji: "🔬",
            voice: "Analytical, research-driven, data-focused"
          }
        }
      },
      workflow: {
        pm_coordination: true,
        agent_collaboration: true,
        task_assignment: true,
        show_agent_reasoning: true,
        include_team_discussion: true,
        progress_updates: true
      },
      development: {
        default_voice: "team_based",
        auto_agent_assignment: true,
        show_expertise_areas: true,
        team_status_updates: true
      }
    };
  }

  /**
   * Check if team-based communication is enabled
   */
  isTeamBasedEnabled() {
    if (!this.config) return true; // Default to team-based
    return this.config.communication?.default_mode === 'team_based';
  }

  /**
   * Get agent configuration by type
   */
  getAgentConfig(agentType) {
    if (!this.config) return null;
    return this.config.communication?.agents?.[agentType];
  }

  /**
   * Get all agent configurations
   */
  getAllAgentConfigs() {
    if (!this.config) return {};
    return this.config.communication?.agents || {};
  }

  /**
   * Check if agent personalities are enabled
   */
  arePersonalitiesEnabled() {
    if (!this.config) return true; // Default to enabled
    return this.config.communication?.agent_personalities?.enabled !== false;
  }

  /**
   * Check if team coordination is enabled
   */
  isTeamCoordinationEnabled() {
    if (!this.config) return true; // Default to enabled
    return this.config.communication?.agent_personalities?.team_coordination !== false;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }
}

module.exports = ConfigLoader;
