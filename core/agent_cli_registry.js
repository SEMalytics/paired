/**
 * Agent CLI Registry
 * Manages CLI command registration and execution for PAIRED agents
 */

class AgentCLIRegistry {
    constructor() {
        this.commands = new Map();
        this.agents = new Map();
        this.permissions = new Map();
    }

    /**
     * Register an agent with the CLI system
     */
    registerAgent(agentId, agentInstance) {
        this.agents.set(agentId, agentInstance);
        console.log(`📋 Registered agent: ${agentId}`);
    }

    /**
     * Register a CLI command for an agent
     */
    registerCommand(agentId, commandName, commandHandler, options = {}) {
        const commandKey = `${agentId}:${commandName}`;
        
        this.commands.set(commandKey, {
            agentId,
            commandName,
            handler: commandHandler,
            description: options.description || '',
            permissions: options.permissions || 'user',
            category: options.category || 'general'
        });

        console.log(`📝 Registered command: ${commandKey}`);
    }

    /**
     * Execute a command for a specific agent
     */
    async executeCommand(agentId, commandName, args = [], options = {}) {
        const commandKey = `${agentId}:${commandName}`;
        const command = this.commands.get(commandKey);
        
        if (!command) {
            throw new Error(`Command not found: ${commandKey}`);
        }

        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }

        // Check permissions
        if (!this.checkPermissions(agentId, commandName, options.user)) {
            throw new Error(`Permission denied for command: ${commandKey}`);
        }

        try {
            return await command.handler.call(agent, args, options);
        } catch (error) {
            console.error(`❌ Command execution failed: ${commandKey}`, error.message);
            throw error;
        }
    }

    /**
     * Get available commands for an agent
     */
    getAgentCommands(agentId) {
        const commands = [];
        for (const [key, command] of this.commands.entries()) {
            if (command.agentId === agentId) {
                commands.push({
                    name: command.commandName,
                    description: command.description,
                    category: command.category
                });
            }
        }
        return commands;
    }

    /**
     * Get all available commands
     */
    getAllCommands() {
        const commandsByAgent = {};
        for (const [key, command] of this.commands.entries()) {
            if (!commandsByAgent[command.agentId]) {
                commandsByAgent[command.agentId] = [];
            }
            commandsByAgent[command.agentId].push({
                name: command.commandName,
                description: command.description,
                category: command.category
            });
        }
        return commandsByAgent;
    }

    /**
     * Check if user has permission to execute command
     */
    checkPermissions(agentId, commandName, user = 'default') {
        const commandKey = `${agentId}:${commandName}`;
        const command = this.commands.get(commandKey);
        
        if (!command) return false;
        
        // For now, allow all commands (can be enhanced with role-based permissions)
        return true;
    }

    /**
     * List all registered agents
     */
    getRegisteredAgents() {
        return Array.from(this.agents.keys());
    }

    /**
     * Get command history for an agent
     */
    getCommandHistory(agentId, limit = 10) {
        // This would integrate with agent memory system
        // For now, return empty array
        return [];
    }

    /**
     * Search commands by keyword
     */
    searchCommands(keyword) {
        const results = [];
        for (const [key, command] of this.commands.entries()) {
            if (command.commandName.includes(keyword) || 
                command.description.toLowerCase().includes(keyword.toLowerCase())) {
                results.push({
                    agentId: command.agentId,
                    commandName: command.commandName,
                    description: command.description,
                    key
                });
            }
        }
        return results;
    }
}

module.exports = AgentCLIRegistry;
