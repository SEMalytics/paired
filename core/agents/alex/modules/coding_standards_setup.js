/**
 * Coding Standards Setup Module for Alex (PM Agent)
 * Combines universal and language-specific coding standards for projects
 */

const fs = require('fs').promises;
const path = require('path');

class CodingStandardsSetup {
  constructor(agent) {
    this.agent = agent;
    this.projectPath = agent.config?.projectRoot || process.cwd();
    this.globalPairedPath = path.join(process.env.HOME, '.paired');
    this.memoryStandardsPath = path.join(this.globalPairedPath, 'config', 'templates', 'memory-standards');
  }

  async initialize() {
    console.log('📋 Coding Standards Setup module initialized');
  }

  /**
   * Set up coding standards for a project
   * Combines universal standards with language-specific standards
   */
  async setupProjectCodingStandards(projectType = null) {
    console.log('👑 Alex (PM): Setting up comprehensive coding standards...');

    try {
      if (!projectType) {
        projectType = await this.detectProjectType();
      }

      console.log(`📋 Detected project type: ${projectType}`);

      const results = {
        language: projectType,
        standards_applied: [],
        configs_created: [],
        errors: []
      };

      // Load universal standards
      const universalStandards = await this.loadLanguageStandards('universal-coding-standards');
      if (universalStandards) {
        results.standards_applied.push('Universal coding standards');
      }

      // Load language-specific standards
      const languageStandards = await this.loadLanguageStandards(projectType);
      if (languageStandards) {
        results.standards_applied.push(`${projectType} specific standards`);
      }

      // Combine standards
      const combinedStandards = this.combineStandards(universalStandards, languageStandards);

      // Create agent-readable standards file
      await this.createAgentStandardsFile(combinedStandards, projectType);
      results.configs_created.push('.paired/config/agent_coding_standards.json');

      // Create documentation
      await this.createCodingStandardsDoc(results, combinedStandards);
      results.configs_created.push('.paired/docs/CODING_STANDARDS.md');

      return results;
    } catch (error) {
      console.error(`❌ Coding standards setup failed: ${error.message}`);
      return {
        language: 'unknown',
        standards_applied: [],
        configs_created: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Detect project type from files
   */
  async detectProjectType() {
    try {
      const files = await fs.readdir(this.projectPath);
      
      if (files.includes('package.json')) {
        const packageJson = JSON.parse(await fs.readFile(path.join(this.projectPath, 'package.json'), 'utf8'));
        if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
          return 'typescript';
        }
        return 'javascript';
      }
      if (files.includes('requirements.txt') || files.includes('setup.py')) return 'python';
      if (files.includes('Cargo.toml')) return 'rust';
      if (files.includes('go.mod')) return 'go';
      if (files.includes('pom.xml') || files.includes('build.gradle')) return 'java';
      if (files.some(f => f.endsWith('.php'))) return 'php';
      
      return 'universal';
    } catch {
      return 'universal';
    }
  }

  /**
   * Load language-specific standards from global templates
   */
  async loadLanguageStandards(language) {
    try {
      const standardsFile = path.join(this.memoryStandardsPath, `${language}-memory.json`);
      const content = await fs.readFile(standardsFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Combine universal and language-specific standards
   */
  combineStandards(universalStandards, languageStandards) {
    if (!universalStandards && !languageStandards) return null;
    if (!universalStandards) return languageStandards;
    if (!languageStandards) return universalStandards;

    // Deep merge with language-specific taking precedence
    const combined = JSON.parse(JSON.stringify(universalStandards));
    
    if (languageStandards.coding_standards) {
      combined.coding_standards = {
        ...combined.coding_standards,
        ...languageStandards.coding_standards,
        style_conventions: [
          ...(combined.coding_standards?.style_conventions || []),
          ...(languageStandards.coding_standards?.style_conventions || [])
        ],
        quality_rules: [
          ...(combined.coding_standards?.quality_rules || []),
          ...(languageStandards.coding_standards?.quality_rules || [])
        ]
      };
    }

    if (languageStandards.architecture_patterns) {
      combined.architecture_patterns = {
        ...combined.architecture_patterns,
        patterns: [
          ...(combined.architecture_patterns?.patterns || []),
          ...(languageStandards.architecture_patterns?.patterns || [])
        ],
        anti_patterns: [
          ...(combined.architecture_patterns?.anti_patterns || []),
          ...(languageStandards.architecture_patterns?.anti_patterns || [])
        ]
      };
    }

    return combined;
  }

  /**
   * Create agent-readable standards file for code generation
   */
  async createAgentStandardsFile(combinedStandards, projectType) {
    try {
      const agentStandardsDir = path.join(this.projectPath, '.paired', 'config');
      await fs.mkdir(agentStandardsDir, { recursive: true });

      const agentStandardsPath = path.join(agentStandardsDir, 'agent_coding_standards.json');
      
      const agentStandards = {
        project_type: projectType,
        last_updated: new Date().toISOString(),
        updated_by: "Alex (PM)",
        
        core_principles: combinedStandards?.coding_standards?.style_conventions || [],
        quality_rules: combinedStandards?.coding_standards?.quality_rules || [],
        architecture_patterns: combinedStandards?.architecture_patterns?.patterns || [],
        anti_patterns: combinedStandards?.architecture_patterns?.anti_patterns || [],
        
        language_preferences: combinedStandards?.stack_preferences || {},
        dependency_preferences: combinedStandards?.dependency_choices || {},
        
        agent_instructions: {
          edison: "Follow all coding standards when implementing features",
          leonardo: "Apply architecture patterns when designing systems", 
          sherlock: "Validate code against quality rules and security principles",
          maya: "Ensure UI code follows accessibility and UX standards"
        }
      };

      await fs.writeFile(agentStandardsPath, JSON.stringify(agentStandards, null, 2));
      console.log('✅ Agent coding standards file created');
    } catch (error) {
      console.error(`Failed to create agent standards file: ${error.message}`);
    }
  }

  /**
   * Create coding standards documentation
   */
  async createCodingStandardsDoc(results, standards) {
    try {
      const docsDir = path.join(this.projectPath, '.paired', 'docs');
      await fs.mkdir(docsDir, { recursive: true });

      const docPath = path.join(docsDir, 'CODING_STANDARDS.md');
      
      let content = `# Coding Standards\n\n`;
      content += `**Project Type**: ${results.language}\n`;
      content += `**Set up by**: 👑 Alex (PM) - ${new Date().toISOString()}\n\n`;

      if (standards?.coding_standards) {
        content += `## Style Conventions\n`;
        standards.coding_standards.style_conventions?.forEach(rule => {
          content += `- ${rule}\n`;
        });

        content += `\n## Quality Rules\n`;
        standards.coding_standards.quality_rules?.forEach(rule => {
          content += `- ${rule}\n`;
        });
      }

      if (standards?.architecture_patterns) {
        content += `\n## Architecture Patterns\n`;
        standards.architecture_patterns.patterns?.forEach(pattern => {
          content += `- ✅ ${pattern}\n`;
        });

        content += `\n## Anti-Patterns to Avoid\n`;
        standards.architecture_patterns.anti_patterns?.forEach(pattern => {
          content += `- ❌ ${pattern}\n`;
        });
      }

      content += `\n## Agent Integration\n`;
      content += `All PAIRED agents will follow these standards when generating code:\n`;
      content += `- ⚡ Edison: Implements features following coding standards\n`;
      content += `- 🏛️ Leonardo: Applies architecture patterns in system design\n`;
      content += `- 🕵️ Sherlock: Validates code quality and security\n`;
      content += `- 🎨 Maya: Ensures UI follows UX and accessibility standards\n`;

      await fs.writeFile(docPath, content);
      console.log('✅ Coding standards documentation created');
    } catch (error) {
      console.error(`Failed to create documentation: ${error.message}`);
    }
  }

  /**
   * Generate setup report
   */
  generateSetupReport(results) {
    let report = `\n👑 **Alex (PM): Coding Standards Setup Complete**\n\n`;
    
    report += `**Project Language**: ${results.language}\n`;
    report += `**Standards Applied**: ${results.standards_applied.join(', ')}\n\n`;

    if (results.configs_created.length > 0) {
      report += `**Files Created**:\n`;
      results.configs_created.forEach(config => {
        report += `- ✅ ${config}\n`;
      });
      report += `\n`;
    }

    report += `**Agent Integration**: All PAIRED agents will now follow these standards when generating code\n\n`;

    if (results.errors.length > 0) {
      report += `**Issues**: ${results.errors.join(', ')}\n`;
    }

    return report;
  }
}

module.exports = CodingStandardsSetup;
