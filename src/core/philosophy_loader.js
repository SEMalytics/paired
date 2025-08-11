/**
 * WEE Philosophy Integration System
 * Loads and integrates philosophical reminders into agent behavior
 */

const fs = require('fs');
const path = require('path');

class PhilosophyLoader {
    constructor() {
        this.philosophyCache = new Map();
        this.agentPhilosophies = new Map();
        this.loadCorePhilosophy();
    }

    /**
     * Load core WEE philosophy from docs
     */
    loadCorePhilosophy() {
        try {
            const philosophyPath = path.join(__dirname, '../../docs/PHILOSOPHY.md');
            if (fs.existsSync(philosophyPath)) {
                const content = fs.readFileSync(philosophyPath, 'utf8');
                this.philosophyCache.set('core', this.parsePhilosophy(content));
            }
        } catch (error) {
            console.warn('Could not load core philosophy:', error.message);
        }
    }

    /**
     * Load agent-specific philosophy reminder
     */
    loadAgentPhilosophy(agentType) {
        if (this.agentPhilosophies.has(agentType)) {
            return this.agentPhilosophies.get(agentType);
        }

        try {
            const agentPath = path.join(__dirname, `../agents/${agentType}/philosophy_reminder.md`);
            if (fs.existsSync(agentPath)) {
                const content = fs.readFileSync(agentPath, 'utf8');
                const philosophy = this.parseAgentPhilosophy(content);
                this.agentPhilosophies.set(agentType, philosophy);
                return philosophy;
            }
        } catch (error) {
            console.warn(`Could not load philosophy for ${agentType}:`, error.message);
        }

        return null;
    }

    /**
     * Parse core philosophy document
     */
    parsePhilosophy(content) {
        const sections = {};
        
        // Extract five pillars
        const pillarRegex = /### Pillar (\d): (.+?)\n\*\*Philosophy\*\*: (.+?)(?=\n\n|\n###|\n\*\*|$)/gs;
        let match;
        sections.pillars = [];
        
        while ((match = pillarRegex.exec(content)) !== null) {
            sections.pillars.push({
                number: parseInt(match[1]),
                title: match[2].trim(),
                philosophy: match[3].trim()
            });
        }

        // Extract core quote
        const quoteMatch = content.match(/"([^"]+)"/);
        if (quoteMatch) {
            sections.coreQuote = quoteMatch[1];
        }

        return sections;
    }

    /**
     * Parse agent-specific philosophy
     */
    parseAgentPhilosophy(content) {
        const philosophy = {};
        
        // Extract core philosophy
        const coreMatch = content.match(/## 🌊 My Core Philosophy\n"([^"]+)"/);
        if (coreMatch) {
            philosophy.corePhilosophy = coreMatch[1];
        }

        // Extract mantras
        const mantrasSection = content.match(/## .+ My .+ Mantras\n([\s\S]*?)(?=\n## |$)/);
        if (mantrasSection) {
            philosophy.mantras = mantrasSection[1]
                .split('\n')
                .filter(line => line.match(/^\d+\./))
                .map(line => line.replace(/^\d+\.\s*"([^"]+)"/, '$1'));
        }

        // Extract value proposition
        const valueMatch = content.match(/## 🎯 My Value Proposition Reminder\n([\s\S]*?)(?=\n## |$)/);
        if (valueMatch) {
            philosophy.valueProposition = valueMatch[1].trim();
        }

        return philosophy;
    }

    /**
     * Get philosophical context for agent response
     */
    getPhilosophicalContext(agentType, situationType = 'general') {
        const agentPhilosophy = this.loadAgentPhilosophy(agentType);
        const corePhilosophy = this.philosophyCache.get('core');
        
        if (!agentPhilosophy) return null;

        // Select appropriate philosophical guidance based on situation
        const context = {
            coreQuote: corePhilosophy?.coreQuote,
            agentPhilosophy: agentPhilosophy.corePhilosophy,
            relevantMantra: this.selectRelevantMantra(agentPhilosophy.mantras, situationType),
            valueReminder: agentPhilosophy.valueProposition
        };

        return context;
    }

    /**
     * Select most relevant mantra for situation
     */
    selectRelevantMantra(mantras, situationType) {
        if (!mantras || mantras.length === 0) return null;
        
        // Simple selection logic - can be enhanced with ML
        const situationMap = {
            'problem_solving': 0,
            'quality_check': 1,
            'design_decision': 2,
            'collaboration': 3,
            'general': Math.floor(Math.random() * mantras.length)
        };

        const index = situationMap[situationType] || situationMap.general;
        return mantras[Math.min(index, mantras.length - 1)];
    }

    /**
     * Generate philosophical prompt enhancement
     */
    enhancePromptWithPhilosophy(agentType, basePrompt, situationType = 'general') {
        const context = this.getPhilosophicalContext(agentType, situationType);
        if (!context) return basePrompt;

        const philosophicalEnhancement = `
        
[PHILOSOPHICAL CONTEXT - Reference naturally, don't lecture]
Core Philosophy: "${context.agentPhilosophy}"
Guiding Principle: "${context.relevantMantra}"
Remember: ${context.valueReminder}
`;

        return basePrompt + philosophicalEnhancement;
    }
}

module.exports = PhilosophyLoader;
