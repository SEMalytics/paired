/**
 * Persistent Project Knowledge
 * Manages project-specific knowledge storage and retrieval for PAIRED agents
 */

const fs = require('fs').promises;
const path = require('path');

class PersistentProjectKnowledge {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.knowledgePath = path.join(projectPath, '.paired', 'knowledge');
        this.initialized = false;
    }

    /**
     * Initialize the knowledge system
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.ensureKnowledgeDirectory();
            this.initialized = true;
            console.log('📚 PersistentProjectKnowledge initialized');
        } catch (error) {
            console.error('❌ Failed to initialize PersistentProjectKnowledge:', error.message);
            throw error;
        }
    }

    /**
     * Ensure knowledge directory exists
     */
    async ensureKnowledgeDirectory() {
        try {
            await fs.mkdir(this.knowledgePath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Store knowledge for a specific topic
     */
    async storeKnowledge(topic, knowledge, metadata = {}) {
        await this.initialize();
        
        const knowledgeData = {
            topic,
            knowledge,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                projectPath: this.projectPath
            }
        };

        const filePath = path.join(this.knowledgePath, `${topic}.json`);
        await fs.writeFile(filePath, JSON.stringify(knowledgeData, null, 2));
        
        console.log(`📝 Stored knowledge: ${topic}`);
        return true;
    }

    /**
     * Retrieve knowledge for a specific topic
     */
    async getKnowledge(topic) {
        await this.initialize();
        
        const filePath = path.join(this.knowledgePath, `${topic}.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    /**
     * List all available knowledge topics
     */
    async listTopics() {
        await this.initialize();
        
        try {
            const files = await fs.readdir(this.knowledgePath);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => path.basename(file, '.json'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Search knowledge by keyword
     */
    async searchKnowledge(keyword) {
        await this.initialize();
        
        const topics = await this.listTopics();
        const results = [];
        
        for (const topic of topics) {
            const knowledge = await this.getKnowledge(topic);
            if (knowledge && (
                knowledge.topic.toLowerCase().includes(keyword.toLowerCase()) ||
                JSON.stringify(knowledge.knowledge).toLowerCase().includes(keyword.toLowerCase())
            )) {
                results.push(knowledge);
            }
        }
        
        return results;
    }

    /**
     * Update existing knowledge
     */
    async updateKnowledge(topic, updates, metadata = {}) {
        const existing = await this.getKnowledge(topic);
        
        if (!existing) {
            throw new Error(`Knowledge topic not found: ${topic}`);
        }

        const updatedKnowledge = {
            ...existing,
            knowledge: { ...existing.knowledge, ...updates },
            metadata: {
                ...existing.metadata,
                ...metadata,
                lastUpdated: new Date().toISOString()
            }
        };

        return await this.storeKnowledge(topic, updatedKnowledge.knowledge, updatedKnowledge.metadata);
    }

    /**
     * Delete knowledge for a topic
     */
    async deleteKnowledge(topic) {
        await this.initialize();
        
        const filePath = path.join(this.knowledgePath, `${topic}.json`);
        
        try {
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted knowledge: ${topic}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get project knowledge summary
     */
    async getProjectSummary() {
        await this.initialize();
        
        const topics = await this.listTopics();
        const summary = {
            projectPath: this.projectPath,
            totalTopics: topics.length,
            topics: topics,
            lastActivity: null
        };

        // Find most recent activity
        for (const topic of topics) {
            const knowledge = await this.getKnowledge(topic);
            if (knowledge && knowledge.metadata.timestamp) {
                const timestamp = new Date(knowledge.metadata.timestamp);
                if (!summary.lastActivity || timestamp > new Date(summary.lastActivity)) {
                    summary.lastActivity = knowledge.metadata.timestamp;
                }
            }
        }

        return summary;
    }

    /**
     * Export all knowledge to a single file
     */
    async exportKnowledge(outputPath) {
        await this.initialize();
        
        const topics = await this.listTopics();
        const exportData = {
            exportTimestamp: new Date().toISOString(),
            projectPath: this.projectPath,
            knowledge: {}
        };

        for (const topic of topics) {
            const knowledge = await this.getKnowledge(topic);
            if (knowledge) {
                exportData.knowledge[topic] = knowledge;
            }
        }

        await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`📦 Exported knowledge to: ${outputPath}`);
        return true;
    }

    /**
     * Import knowledge from exported file
     */
    async importKnowledge(importPath) {
        await this.initialize();
        
        const data = await fs.readFile(importPath, 'utf8');
        const importData = JSON.parse(data);
        
        if (!importData.knowledge) {
            throw new Error('Invalid knowledge export format');
        }

        let importedCount = 0;
        for (const [topic, knowledge] of Object.entries(importData.knowledge)) {
            await this.storeKnowledge(topic, knowledge.knowledge, {
                ...knowledge.metadata,
                importedAt: new Date().toISOString(),
                originalProject: importData.projectPath
            });
            importedCount++;
        }

        console.log(`📥 Imported ${importedCount} knowledge topics`);
        return importedCount;
    }
}

module.exports = PersistentProjectKnowledge;
