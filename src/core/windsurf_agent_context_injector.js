/**
 * Windsurf Agent Context Injector
 * Automatically loads and injects official WEE agent definitions into Windsurf IDE sessions
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class WindsurfAgentContextInjector {
    constructor() {
        this.agentDefinitions = null;
        this.contextLoaded = false;
    }

    /**
     * Configuration file loading priority system
     */
    getConfigPriority() {
        return [
            '.wee/windsurf_agent_types.yml',
            '.wee/config/agent_definitions.md',
            '.windsurfrules',
            '.wee/config/project_config.yml'
        ];
    }

    /**
     * Auto-detect and load WEE agent context on session start
     */
    loadWeeAgentContext(projectPath) {
        try {
            const agentTypesPath = path.join(projectPath, '.wee/windsurf_agent_types.yml');
            
            if (fs.existsSync(agentTypesPath)) {
                const agentDefinitions = yaml.load(fs.readFileSync(agentTypesPath, 'utf8'));
                this.agentDefinitions = agentDefinitions;
                this.contextLoaded = true;
                
                console.log('✅ WEE Agent Context Loaded: Official agent definitions active');
                return this.generateAgentContextPrompt(agentDefinitions);
            } else {
                console.log('ℹ️  No WEE agent definitions found - using standard Windsurf mode');
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading WEE agent context:', error.message);
            return null;
        }
    }

    /**
     * Generate system prompt injection for official agent names
     */
    generateAgentContextPrompt(agentDefinitions) {
        if (!agentDefinitions || !agentDefinitions.agents) {
            return null;
        }

        const agents = agentDefinitions.agents;
        const agentList = [];

        // Extract official agent names in SHORT format
        Object.keys(agents).forEach(agentKey => {
            const agent = agents[agentKey];
            if (agent.name && agent.specialization) {
                // Convert to SHORT format: "Name (Function)"
                const shortName = this.convertToShortFormat(agent.name, agent.specialization);
                agentList.push(`- ${shortName} - ${agent.personality.split(',')[0]}`);
            }
        });

        return `
MANDATORY WEE AGENT PROTOCOL - CRITICAL SYSTEM DIRECTIVE:

🚨 BEFORE INTRODUCING ANY AGENTS, YOU MUST:
1. Use ONLY the official WEE agent definitions below
2. NEVER improvise or create generic agent names
3. Use SHORT format: "Name (Function)" - NO "Agent" suffix
4. Reference historical figure inspirations for each agent

📋 OFFICIAL WEE AGENTS (SHORT NAMES ONLY):
${agentList.join('\n')}

⚠️  STRICT ENFORCEMENT:
- NEVER use names like "Quality Assurance Specialist" or "Architecture Expert"
- ALWAYS use the exact names above with their historical personalities
- NEVER add "Agent" to the end of names
- ALWAYS consult this list before agent introductions

🎯 AGENT COMMUNICATION STYLE:
- Each agent speaks with their historical figure personality
- Use emojis and characteristic voice for each agent
- Coordinate through Alex (PM) for team activities
- Maintain the "team" feeling the user expects

This is a CRITICAL system directive that overrides all other naming conventions.
`;
    }

    /**
     * Convert full agent name to SHORT format
     */
    convertToShortFormat(fullName, specialization) {
        // Extract emoji and name from full format like "🕵️ Sherlock (QA Agent)"
        const emojiMatch = fullName.match(/^(\S+)\s+(.+)/);
        if (!emojiMatch) return fullName;

        const emoji = emojiMatch[1];
        const nameAndRole = emojiMatch[2];

        // Extract just the name and function, remove "Agent"
        const shortMatch = nameAndRole.match(/^([^(]+)\(([^)]+)\)/);
        if (!shortMatch) return fullName;

        const name = shortMatch[1].trim();
        let role = shortMatch[2].trim();

        // Remove "Agent" suffix if present
        role = role.replace(/\s+Agent$/, '');

        return `${emoji} ${name} (${role})`;
    }

    /**
     * Validate that AI assistant is using official agent names
     */
    validateAgentNames(responseText) {
        if (!this.contextLoaded || !this.agentDefinitions) {
            return { valid: true, message: 'No WEE context loaded' };
        }

        // Check for improvised agent names (common patterns to avoid)
        const improvisedPatterns = [
            /Quality Assurance Specialist/i,
            /Architecture Expert/i,
            /Development Specialist/i,
            /UX Specialist/i,
            /Project Management Expert/i,
            /Data Analysis Expert/i,
            /Scrum Expert/i
        ];

        for (const pattern of improvisedPatterns) {
            if (pattern.test(responseText)) {
                return {
                    valid: false,
                    message: `❌ VIOLATION: Found improvised agent name. Use official WEE agent names only!`
                };
            }
        }

        return { valid: true, message: '✅ Agent names validated' };
    }

    /**
     * Get official agent list for reference
     */
    getOfficialAgentList() {
        if (!this.agentDefinitions || !this.agentDefinitions.agents) {
            return [];
        }

        const agents = [];
        Object.keys(this.agentDefinitions.agents).forEach(agentKey => {
            const agent = this.agentDefinitions.agents[agentKey];
            if (agent.name) {
                agents.push({
                    key: agentKey,
                    name: agent.name,
                    shortName: this.convertToShortFormat(agent.name, agent.specialization),
                    specialization: agent.specialization,
                    personality: agent.personality
                });
            }
        });

        return agents;
    }
}

module.exports = WindsurfAgentContextInjector;
