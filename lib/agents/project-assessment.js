/**
 * PAIRED Team Project Assessment & Guided Recommendations
 *
 * Multi-agent collaborative system that provides guided suggestions (1,2,3 or a,b,c)
 * for fresh project directory installations
 */

const ProjectDirectoryAssessment = require('./project-directory-assessment');

class TeamProjectAssessment {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.assessment = null;
    this.recommendations = [];
  }

  async runTeamAssessment() {
    console.log('👑 Alex (PM): Coordinating comprehensive team project assessment...\n');

    // 🕵️ Sherlock's Investigation
    const investigator = new ProjectDirectoryAssessment(this.projectPath);
    this.assessment = await investigator.runCompleteAssessment();

    console.log(investigator.generateAssessmentReport());

    // Multi-agent analysis and recommendations
    await this.generateTeamRecommendations();

    return this.displayGuidedOptions();
  }

  async generateTeamRecommendations() {
    const { directory_status, code_analysis, recent_changes, plans_handoffs } = this.assessment;

    console.log('\n🤝 **Team Collaboration & Analysis**\n');

    // ⚡ Edison's Development Analysis
    console.log('⚡ **Edison (Dev): Technical Assessment**');
    if (directory_status.is_fresh) {
      console.log('- Fresh project detected - ready for new development');
      console.log('- No existing code conflicts to worry about');
      this.recommendations.push({
        agent: 'Edison',
        type: 'development',
        priority: 'high',
        action: 'Initialize development environment and project structure'
      });
    } else {
      console.log(`- Existing codebase: ${code_analysis.code_files} files, ${code_analysis.complexity_estimate} complexity`);
      console.log(`- Languages: ${code_analysis.main_languages.join(', ')}`);
      if (code_analysis.framework_detected) {
        console.log(`- Framework: ${code_analysis.framework_detected}`);
      }
      this.recommendations.push({
        agent: 'Edison',
        type: 'development',
        priority: 'medium',
        action: 'Analyze existing codebase and suggest improvements'
      });
    }

    // 🏛️ Leonardo's Architecture Analysis
    console.log('\n🏛️ **Leonardo (Architecture): System Design Assessment**');
    if (directory_status.project_type === 'unknown' && !directory_status.is_fresh) {
      console.log('- Architecture unclear - needs design review');
      this.recommendations.push({
        agent: 'Leonardo',
        type: 'architecture',
        priority: 'high',
        action: 'Define system architecture and design patterns'
      });
    } else if (directory_status.is_fresh) {
      console.log('- Clean slate for architectural design');
      this.recommendations.push({
        agent: 'Leonardo',
        type: 'architecture',
        priority: 'high',
        action: 'Design initial system architecture'
      });
    } else {
      console.log(`- Project type: ${directory_status.project_type}`);
      console.log('- Architecture review recommended for optimization');
      this.recommendations.push({
        agent: 'Leonardo',
        type: 'architecture',
        priority: 'medium',
        action: 'Review and optimize existing architecture'
      });
    }

    // 🕵️ Sherlock's Quality Analysis
    console.log('\n🕵️ **Sherlock (QA): Quality & Security Assessment**');
    if (code_analysis.tests === 0 && code_analysis.code_files > 0) {
      console.log('- ⚠️ No tests detected - quality risk identified');
      this.recommendations.push({
        agent: 'Sherlock',
        type: 'quality',
        priority: 'high',
        action: 'Implement comprehensive testing strategy'
      });
    }
    if (!directory_status.has_git) {
      console.log('- ⚠️ No version control - critical issue');
      this.recommendations.push({
        agent: 'Sherlock',
        type: 'quality',
        priority: 'critical',
        action: 'Initialize Git repository and version control'
      });
    }
    console.log('- Security audit recommended for all projects');

    // 🎨 Maya's UX Analysis
    console.log('\n🎨 **Maya (UX): User Experience Assessment**');
    if (!plans_handoffs.has_readme) {
      console.log('- ❌ No README - user onboarding missing');
      this.recommendations.push({
        agent: 'Maya',
        type: 'ux',
        priority: 'high',
        action: 'Create user-friendly README and documentation'
      });
    }
    console.log('- User experience review needed for all interfaces');

    // 🏈 Vince's Process Analysis
    console.log('\n🏈 **Vince (Scrum Master): Process & Workflow Assessment**');
    if (!plans_handoffs.has_planning_docs) {
      console.log('- No planning documentation found');
      this.recommendations.push({
        agent: 'Vince',
        type: 'process',
        priority: 'medium',
        action: 'Establish project planning and workflow processes'
      });
    }
    if (recent_changes.uncommitted_changes) {
      console.log('- ⚠️ Uncommitted changes detected - process issue');
    }

    // 🔬 Marie's Data Analysis
    console.log('\n🔬 **Marie (Analyst): Metrics & Analysis**');
    console.log(`- Project metrics: ${code_analysis.total_files} files, ${directory_status.file_count} in root`);
    if (recent_changes.recent_file_changes.length > 0) {
      console.log(`- Recent activity: ${recent_changes.recent_file_changes.length} files modified`);
    }
    this.recommendations.push({
      agent: 'Marie',
      type: 'analytics',
      priority: 'low',
      action: 'Set up project metrics and monitoring'
    });
  }

  displayGuidedOptions() {
    console.log('\n👑 **Alex (PM): Strategic Recommendations**\n');

    const criticalRecs = this.recommendations.filter(r => r.priority === 'critical');
    const highRecs = this.recommendations.filter(r => r.priority === 'high');
    const mediumRecs = this.recommendations.filter(r => r.priority === 'medium');

    if (criticalRecs.length > 0) {
      console.log('🚨 **CRITICAL ACTIONS REQUIRED:**');
      criticalRecs.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.agent}: ${rec.action}`);
      });
      console.log('');
    }

    console.log('🎯 **RECOMMENDED NEXT STEPS:**');

    if (this.assessment.directory_status.is_fresh) {
      // Fresh project options
      console.log('**Option A**: Complete Project Setup');
      console.log('   1. Leonardo: Design system architecture');
      console.log('   2. Edison: Initialize development environment');
      console.log('   3. Sherlock: Set up version control and quality gates');
      console.log('   4. Maya: Create user documentation and README');
      console.log('');

      console.log('**Option B**: Quick Start Development');
      console.log('   1. Edison: Create basic project structure');
      console.log('   2. Sherlock: Initialize Git repository');
      console.log('   3. Start coding with minimal setup');
      console.log('');

      console.log('**Option C**: Planning & Design First');
      console.log('   1. Vince: Establish project planning process');
      console.log('   2. Leonardo: Complete architectural design');
      console.log('   3. Maya: Define user experience requirements');
      console.log('');
    } else {
      // Existing project options
      console.log('**Option A**: Comprehensive Review & Improvement');
      highRecs.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.agent}: ${rec.action}`);
      });
      console.log('');

      console.log('**Option B**: Focus on Critical Issues');
      const criticalAndHigh = [...criticalRecs, ...highRecs.slice(0, 2)];
      criticalAndHigh.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.agent}: ${rec.action}`);
      });
      console.log('');

      console.log('**Option C**: Continue Development');
      console.log('   1. Edison: Analyze and extend existing code');
      console.log('   2. Sherlock: Quick quality and security check');
      console.log('   3. Proceed with current development');
      console.log('');
    }

    console.log('**What would you like to do?**');
    console.log('- Choose A, B, or C for guided workflow');
    console.log('- Ask specific agent: "Leonardo, design the architecture"');
    console.log('- Request custom approach: "I want to focus on [specific area]"');

    return {
      assessment: this.assessment,
      recommendations: this.recommendations,
      options: ['A', 'B', 'C']
    };
  }
}

module.exports = TeamProjectAssessment;

// Auto-run if called directly
if (require.main === module) {
  const teamAssessment = new TeamProjectAssessment();
  teamAssessment.runTeamAssessment();
}
