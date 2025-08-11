/**
 * WEE Philosophy Integration - Agent Behavior Enhancement
 * Integrates philosophical reminders into agent responses naturally
 */

const PhilosophyLoader = require('./philosophy_loader');

class PhilosophyIntegration {
    constructor() {
        this.philosophyLoader = new PhilosophyLoader();
        this.integrationPatterns = this.initializePatterns();
    }

    /**
     * Initialize natural integration patterns for different agent types
     */
    initializePatterns() {
        return {
            qa_agent: {
                triggers: ['bug', 'quality', 'test', 'audit', 'security'],
                integrationStyle: 'systematic_investigation',
                philosophyFrequency: 0.3 // 30% of responses include philosophy
            },
            pm_agent: {
                triggers: ['priority', 'strategy', 'decision', 'plan', 'coordinate'],
                integrationStyle: 'strategic_reasoning',
                philosophyFrequency: 0.4
            },
            architecture_agent: {
                triggers: ['design', 'architecture', 'pattern', 'structure', 'system'],
                integrationStyle: 'design_wisdom',
                philosophyFrequency: 0.5
            },
            dev_agent: {
                triggers: ['solve', 'implement', 'fix', 'optimize', 'debug'],
                integrationStyle: 'problem_solving',
                philosophyFrequency: 0.3
            },
            ux_agent: {
                triggers: ['user', 'interface', 'experience', 'design', 'usability'],
                integrationStyle: 'user_empathy',
                philosophyFrequency: 0.4
            },
            analyst_agent: {
                triggers: ['analyze', 'data', 'pattern', 'patterns', 'insight', 'research'],
                integrationStyle: 'analytical_rigor',
                philosophyFrequency: 0.3
            },
            scrum_master_agent: {
                triggers: ['process', 'team', 'sprint', 'coordinate', 'improve'],
                integrationStyle: 'team_optimization',
                philosophyFrequency: 0.4
            }
        };
    }

    /**
     * Enhance agent response with philosophical context
     */
    enhanceAgentResponse(agentType, response, context = {}) {
        const pattern = this.integrationPatterns[agentType];
        if (!pattern) return response;

        // Check if we should integrate philosophy based on frequency and triggers
        const shouldIntegrate = this.shouldIntegratePhilosophy(response, pattern, context);
        if (!shouldIntegrate) return response;

        // Get philosophical context
        const situationType = this.detectSituationType(response, pattern.triggers);
        const philosophicalContext = this.philosophyLoader.getPhilosophicalContext(agentType, situationType);
        
        if (!philosophicalContext) return response;

        // Integrate philosophy naturally
        return this.integratePhilosophyNaturally(response, philosophicalContext, pattern.integrationStyle);
    }

    /**
     * Determine if philosophy should be integrated
     */
    shouldIntegratePhilosophy(response, pattern, context) {
        // Check frequency threshold
        if (Math.random() > pattern.philosophyFrequency) return false;

        // Check for trigger words
        const hasTrigger = pattern.triggers.some(trigger => 
            response.toLowerCase().includes(trigger.toLowerCase())
        );

        // Check context flags
        const forcePhilosophy = context.forcePhilosophy || false;
        const suppressPhilosophy = context.suppressPhilosophy || false;

        return (hasTrigger || forcePhilosophy) && !suppressPhilosophy;
    }

    /**
     * Detect situation type from response content
     */
    detectSituationType(response, triggers) {
        const situationMap = {
            'problem_solving': ['solve', 'fix', 'debug', 'implement'],
            'quality_check': ['quality', 'test', 'audit', 'bug'],
            'design_decision': ['design', 'architecture', 'pattern', 'structure'],
            'collaboration': ['team', 'coordinate', 'process', 'sprint']
        };

        for (const [situation, keywords] of Object.entries(situationMap)) {
            if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
                return situation;
            }
        }

        return 'general';
    }

    /**
     * Integrate philosophy naturally into response
     */
    integratePhilosophyNaturally(response, philosophicalContext, integrationStyle) {
        const integrationMethods = {
            systematic_investigation: this.integrateSystematicApproach.bind(this),
            strategic_reasoning: this.integrateStrategicThinking.bind(this),
            design_wisdom: this.integrateDesignWisdom.bind(this),
            problem_solving: this.integrateProblemSolving.bind(this),
            user_empathy: this.integrateUserEmpathy.bind(this),
            analytical_rigor: this.integrateAnalyticalRigor.bind(this),
            team_optimization: this.integrateTeamOptimization.bind(this)
        };

        const integrationMethod = integrationMethods[integrationStyle];
        if (!integrationMethod) return response;

        return integrationMethod(response, philosophicalContext);
    }

    /**
     * Integration methods for different styles
     */
    integrateSystematicApproach(response, context) {
        const philosophyHint = `\n\n*Following our principle of systematic investigation, ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateStrategicThinking(response, context) {
        const philosophyHint = `\n\n*Applying our strategic coordination approach: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateDesignWisdom(response, context) {
        const philosophyHint = `\n\n*As our architectural philosophy teaches: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateProblemSolving(response, context) {
        const philosophyHint = `\n\n*Using our problem-solving methodology: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateUserEmpathy(response, context) {
        const philosophyHint = `\n\n*Guided by our user-centered philosophy: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateAnalyticalRigor(response, context) {
        const philosophyHint = `\n\n*Following our analytical principles: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    integrateTeamOptimization(response, context) {
        const philosophyHint = `\n\n*Applying our team excellence approach: ${context.relevantMantra}*`;
        return response + philosophyHint;
    }

    /**
     * Get philosophy summary for agent initialization
     */
    getAgentPhilosophySummary(agentType) {
        const philosophicalContext = this.philosophyLoader.getPhilosophicalContext(agentType);
        if (!philosophicalContext) return null;

        return {
            corePhilosophy: philosophicalContext.agentPhilosophy,
            keyPrinciple: philosophicalContext.relevantMantra,
            valueProposition: philosophicalContext.valueReminder
        };
    }
}

module.exports = PhilosophyIntegration;
