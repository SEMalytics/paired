/**
 * Project Directory Assessment Module
 * Provides comprehensive analysis of project directories for PAIRED system
 * Used by Alex (PM) for project status reporting and recommendations
 */

const fs = require('fs').promises;
const path = require('path');

class ProjectDirectoryAssessment {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.assessment = null;
  }

  /**
   * Run complete assessment of project directory
   */
  async runCompleteAssessment() {
    try {
      const assessment = {
        directory_status: await this.assessDirectoryStatus(),
        code_analysis: await this.analyzeCodebase(),
        recent_changes: await this.analyzeRecentChanges(),
        plans_handoffs: await this.analyzePlansAndHandoffs()
      };

      this.assessment = assessment;
      return assessment;
    } catch (error) {
      console.error(`❌ Assessment failed: ${error.message}`);
      return this.getEmptyAssessment();
    }
  }

  /**
   * Assess basic directory status
   */
  async assessDirectoryStatus() {
    try {
      const files = await fs.readdir(this.projectPath);
      const stats = await Promise.all(
        files.map(async file => {
          try {
            const filePath = path.join(this.projectPath, file);
            const stat = await fs.stat(filePath);
            return { name: file, isDirectory: stat.isDirectory(), size: stat.size };
          } catch {
            return null;
          }
        })
      );

      const validStats = stats.filter(Boolean);
      const directories = validStats.filter(s => s.isDirectory);
      const regularFiles = validStats.filter(s => !s.isDirectory);

      // Detect project type
      let projectType = 'unknown';
      let isFresh = true;

      if (files.includes('package.json')) {
        projectType = 'nodejs';
        isFresh = false;
      } else if (files.includes('requirements.txt') || files.includes('setup.py')) {
        projectType = 'python';
        isFresh = false;
      } else if (files.includes('Cargo.toml')) {
        projectType = 'rust';
        isFresh = false;
      } else if (files.includes('go.mod')) {
        projectType = 'go';
        isFresh = false;
      } else if (files.includes('pom.xml') || files.includes('build.gradle')) {
        projectType = 'java';
        isFresh = false;
      }

      // Check if truly fresh (minimal files)
      const significantFiles = regularFiles.filter(f => 
        !f.name.startsWith('.') && 
        f.name !== 'README.md' && 
        f.name !== 'LICENSE'
      );

      if (significantFiles.length === 0 && directories.length <= 1) {
        isFresh = true;
        projectType = 'fresh';
      }

      return {
        project_type: projectType,
        is_fresh: isFresh,
        file_count: regularFiles.length,
        directory_count: directories.length,
        total_size: regularFiles.reduce((sum, f) => sum + f.size, 0),
        has_git: files.includes('.git'),
        has_readme: files.includes('README.md'),
        has_license: files.includes('LICENSE'),
        main_files: regularFiles.slice(0, 10).map(f => f.name)
      };
    } catch (error) {
      return {
        project_type: 'unknown',
        is_fresh: true,
        file_count: 0,
        directory_count: 0,
        total_size: 0,
        has_git: false,
        has_readme: false,
        has_license: false,
        main_files: [],
        error: error.message
      };
    }
  }

  /**
   * Analyze codebase structure and content
   */
  async analyzeCodebase() {
    try {
      const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.rs', '.go', '.rb', '.php'];
      const files = await this.getAllFiles(this.projectPath);
      
      const codeFiles = files.filter(file => 
        codeExtensions.some(ext => file.endsWith(ext))
      );

      // Language detection
      const languageCount = {};
      codeFiles.forEach(file => {
        const ext = path.extname(file);
        languageCount[ext] = (languageCount[ext] || 0) + 1;
      });

      const mainLanguages = Object.entries(languageCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([ext]) => ext.substring(1));

      // Framework detection
      let frameworkDetected = null;
      try {
        const packageJsonPath = path.join(this.projectPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) frameworkDetected = 'React';
        else if (deps.vue) frameworkDetected = 'Vue';
        else if (deps.angular) frameworkDetected = 'Angular';
        else if (deps.express) frameworkDetected = 'Express';
        else if (deps.next) frameworkDetected = 'Next.js';
      } catch {
        // No package.json or parsing error
      }

      return {
        total_files: files.length,
        code_files: codeFiles.length,
        main_languages: mainLanguages,
        framework_detected: frameworkDetected,
        complexity_estimate: this.estimateComplexity(codeFiles.length),
        has_tests: files.some(f => f.includes('test') || f.includes('spec')),
        has_docs: files.some(f => f.includes('README') || f.includes('doc'))
      };
    } catch (error) {
      return {
        total_files: 0,
        code_files: 0,
        main_languages: [],
        framework_detected: null,
        complexity_estimate: 'unknown',
        has_tests: false,
        has_docs: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze recent changes and activity
   */
  async analyzeRecentChanges() {
    try {
      const gitDir = path.join(this.projectPath, '.git');
      let recentChanges = [];
      let hasGit = false;

      try {
        await fs.access(gitDir);
        hasGit = true;
        
        // Get recent file modifications (last 7 days)
        const files = await this.getAllFiles(this.projectPath);
        const recentFiles = [];
        
        for (const file of files.slice(0, 50)) { // Limit to avoid performance issues
          try {
            const filePath = path.join(this.projectPath, file);
            const stat = await fs.stat(filePath);
            const daysSinceModified = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceModified <= 7) {
              recentFiles.push({
                file: file,
                modified: stat.mtime.toISOString(),
                days_ago: Math.floor(daysSinceModified)
              });
            }
          } catch {
            // Skip files that can't be accessed
          }
        }

        recentChanges = recentFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      } catch {
        // No git or access issues
      }

      return {
        has_git: hasGit,
        recent_file_changes: recentChanges.slice(0, 10), // Top 10 most recent
        activity_level: this.assessActivityLevel(recentChanges.length),
        last_activity: recentChanges.length > 0 ? recentChanges[0].modified : null
      };
    } catch (error) {
      return {
        has_git: false,
        recent_file_changes: [],
        activity_level: 'unknown',
        last_activity: null,
        error: error.message
      };
    }
  }

  /**
   * Analyze plans and handoff documents
   */
  async analyzePlansAndHandoffs() {
    try {
      const pairedDir = path.join(this.projectPath, '.paired');
      let hasPaired = false;
      let plans = [];
      let handoffs = [];

      try {
        await fs.access(pairedDir);
        hasPaired = true;

        // Check for plans
        const plansDir = path.join(pairedDir, 'docs');
        try {
          const planFiles = await fs.readdir(plansDir);
          plans = planFiles.filter(f => f.endsWith('.md')).slice(0, 5);
        } catch {
          // No plans directory
        }

        // Check for handoffs
        const handoffDir = path.join(pairedDir, 'handoff');
        try {
          const handoffFiles = await fs.readdir(handoffDir);
          handoffs = handoffFiles.filter(f => f.endsWith('.md')).slice(0, 5);
        } catch {
          // No handoff directory
        }
      } catch {
        // No .paired directory
      }

      return {
        has_paired: hasPaired,
        plan_documents: plans,
        handoff_documents: handoffs,
        documentation_level: this.assessDocumentationLevel(plans.length + handoffs.length)
      };
    } catch (error) {
      return {
        has_paired: false,
        plan_documents: [],
        handoff_documents: [],
        documentation_level: 'none',
        error: error.message
      };
    }
  }

  /**
   * Generate assessment report
   */
  generateAssessmentReport() {
    if (!this.assessment) {
      return '❌ No assessment data available';
    }

    const { directory_status, code_analysis, recent_changes, plans_handoffs } = this.assessment;

    let report = '\n🕵️ **Sherlock (QA): Project Investigation Report**\n';
    
    // Directory status
    report += `\n**Directory Analysis:**\n`;
    report += `- Project Type: ${directory_status.project_type}\n`;
    report += `- Status: ${directory_status.is_fresh ? 'Fresh/New' : 'Established'}\n`;
    report += `- Files: ${directory_status.file_count} files, ${directory_status.directory_count} directories\n`;
    
    if (directory_status.has_git) {
      report += `- Version Control: Git repository detected ✅\n`;
    } else {
      report += `- Version Control: No Git repository ⚠️\n`;
    }

    // Code analysis
    if (code_analysis.code_files > 0) {
      report += `\n**Code Analysis:**\n`;
      report += `- Code Files: ${code_analysis.code_files} files\n`;
      report += `- Languages: ${code_analysis.main_languages.join(', ')}\n`;
      report += `- Complexity: ${code_analysis.complexity_estimate}\n`;
      if (code_analysis.framework_detected) {
        report += `- Framework: ${code_analysis.framework_detected}\n`;
      }
      report += `- Tests: ${code_analysis.has_tests ? 'Present ✅' : 'Missing ⚠️'}\n`;
    }

    // Recent activity
    if (recent_changes.recent_file_changes.length > 0) {
      report += `\n**Recent Activity:**\n`;
      report += `- Activity Level: ${recent_changes.activity_level}\n`;
      report += `- Recent Changes: ${recent_changes.recent_file_changes.length} files modified\n`;
      report += `- Last Activity: ${recent_changes.last_activity}\n`;
    }

    // PAIRED integration
    if (plans_handoffs.has_paired) {
      report += `\n**PAIRED Integration:**\n`;
      report += `- PAIRED Status: Configured ✅\n`;
      report += `- Documentation: ${plans_handoffs.documentation_level}\n`;
      if (plans_handoffs.plan_documents.length > 0) {
        report += `- Plans: ${plans_handoffs.plan_documents.length} documents\n`;
      }
    } else {
      report += `\n**PAIRED Integration:**\n`;
      report += `- PAIRED Status: Not configured\n`;
    }

    return report;
  }

  /**
   * Helper methods
   */
  async getAllFiles(dir, relativePath = '') {
    try {
      const files = [];
      const items = await fs.readdir(dir);

      for (const item of items) {
        if (item.startsWith('.')) continue; // Skip hidden files
        
        const fullPath = path.join(dir, item);
        const relativeName = path.join(relativePath, item);
        
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            const subFiles = await this.getAllFiles(fullPath, relativeName);
            files.push(...subFiles);
          } else {
            files.push(relativeName);
          }
        } catch {
          // Skip inaccessible files
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  estimateComplexity(fileCount) {
    if (fileCount === 0) return 'none';
    if (fileCount < 10) return 'low';
    if (fileCount < 50) return 'medium';
    if (fileCount < 200) return 'high';
    return 'very high';
  }

  assessActivityLevel(recentChanges) {
    if (recentChanges === 0) return 'inactive';
    if (recentChanges < 5) return 'low';
    if (recentChanges < 15) return 'moderate';
    if (recentChanges < 30) return 'high';
    return 'very high';
  }

  assessDocumentationLevel(docCount) {
    if (docCount === 0) return 'none';
    if (docCount < 3) return 'minimal';
    if (docCount < 8) return 'adequate';
    return 'comprehensive';
  }

  getEmptyAssessment() {
    return {
      directory_status: {
        project_type: 'unknown',
        is_fresh: true,
        file_count: 0,
        directory_count: 0,
        total_size: 0,
        has_git: false,
        has_readme: false,
        has_license: false,
        main_files: []
      },
      code_analysis: {
        total_files: 0,
        code_files: 0,
        main_languages: [],
        framework_detected: null,
        complexity_estimate: 'none',
        has_tests: false,
        has_docs: false
      },
      recent_changes: {
        has_git: false,
        recent_file_changes: [],
        activity_level: 'none',
        last_activity: null
      },
      plans_handoffs: {
        has_paired: false,
        plan_documents: [],
        handoff_documents: [],
        documentation_level: 'none'
      }
    };
  }
}

module.exports = ProjectDirectoryAssessment;
