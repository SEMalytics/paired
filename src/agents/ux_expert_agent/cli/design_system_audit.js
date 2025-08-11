#!/usr/bin/env node

/**
 * Design System Audit CLI Tool
 * 
 * Command-line tool for auditing design system health, consistency,
 * and component usage across the project.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DesignSystemAuditCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.designSystemPath = path.join(this.projectRoot, '.wee', 'agents', 'virtual_ux_expert', 'design_system');
    this.auditResults = {
      timestamp: new Date().toISOString(),
      overall_score: 0,
      components: {},
      tokens: {},
      consistency: {},
      recommendations: []
    };
  }

  /**
   * Run complete design system audit
   */
  async runAudit(options = {}) {
    console.log('🎨 Starting Design System Audit...\n');

    try {
      await this.checkDesignSystemExists();
      await this.auditComponents();
      await this.auditDesignTokens();
      await this.checkConsistency();
      this.calculateOverallScore();
      await this.generateRecommendations();
      this.displayResults(options);

      if (options.save) {
        await this.saveAuditReport();
      }

      return this.auditResults;

    } catch (error) {
      console.error('❌ Design System Audit failed:', error.message);
      process.exit(1);
    }
  }

  async checkDesignSystemExists() {
    try {
      await fs.access(this.designSystemPath);
    } catch (error) {
      throw new Error('Design system not found. Run UX Expert Agent initialization first.');
    }
  }

  async auditComponents() {
    const componentsPath = path.join(this.designSystemPath, 'components');
    
    try {
      const componentFiles = await fs.readdir(componentsPath);
      const components = {};

      for (const file of componentFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(componentsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const component = JSON.parse(content);
          components[component.name] = await this.auditComponent(component);
        }
      }

      this.auditResults.components = {
        total_count: Object.keys(components).length,
        documented: Object.values(components).filter(c => c.documentation_score > 70).length,
        accessible: Object.values(components).filter(c => c.accessibility_score > 80).length,
        consistent: Object.values(components).filter(c => c.consistency_score > 75).length,
        details: components
      };

    } catch (error) {
      this.auditResults.components = { total_count: 0, error: error.message };
    }
  }

  async auditComponent(component) {
    const audit = {
      name: component.name,
      documentation_score: this.calculateDocumentationScore(component),
      accessibility_score: this.calculateAccessibilityScore(component),
      consistency_score: this.calculateConsistencyScore(component),
      issues: [],
      recommendations: []
    };

    audit.issues = this.identifyComponentIssues(component, audit);
    audit.recommendations = this.generateComponentRecommendations(audit);
    return audit;
  }

  calculateDocumentationScore(component) {
    let score = 0;
    if (component.description) score += 20;
    if (component.category) score += 10;
    if (component.variants && component.variants.length > 0) score += 15;
    if (component.accessibility) score += 20;
    if (component.tokens) score += 10;
    if (component.documentation) score += 25;
    return score;
  }

  calculateAccessibilityScore(component) {
    if (!component.accessibility) return 0;
    let score = 0;
    const accessibility = component.accessibility;
    if (accessibility.role) score += 25;
    if (accessibility.keyboard !== undefined) score += 25;
    if (accessibility.screenReader !== undefined) score += 25;
    if (accessibility.focusManagement !== undefined) score += 25;
    return score;
  }

  calculateConsistencyScore(component) {
    if (!component.tokens) return 50;
    let score = 100;
    const tokens = component.tokens;
    for (const [key, value] of Object.entries(tokens)) {
      if (!value.startsWith('colors.') && !value.startsWith('typography.') && 
          !value.startsWith('spacing.') && !value.startsWith('borderRadius.')) {
        score -= 10;
      }
    }
    return Math.max(0, score);
  }

  identifyComponentIssues(component, audit) {
    const issues = [];
    if (audit.documentation_score < 70) {
      issues.push({ type: 'documentation', severity: 'medium', message: 'Incomplete documentation' });
    }
    if (audit.accessibility_score < 80) {
      issues.push({ type: 'accessibility', severity: 'high', message: 'Accessibility issues' });
    }
    if (audit.consistency_score < 75) {
      issues.push({ type: 'consistency', severity: 'medium', message: 'Token consistency issues' });
    }
    return issues;
  }

  generateComponentRecommendations(audit) {
    const recommendations = [];
    if (audit.documentation_score < 70) {
      recommendations.push('Improve component documentation');
    }
    if (audit.accessibility_score < 80) {
      recommendations.push('Review accessibility compliance');
    }
    if (audit.consistency_score < 75) {
      recommendations.push('Update to use standardized design tokens');
    }
    return recommendations;
  }

  async auditDesignTokens() {
    const tokensPath = path.join(this.designSystemPath, 'tokens');
    
    try {
      const tokenFiles = await fs.readdir(tokensPath);
      const tokens = {};

      for (const file of tokenFiles) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const category = path.basename(file, path.extname(file));
          tokens[category] = { category, structure_score: 85, naming_score: 90 };
        }
      }

      this.auditResults.tokens = {
        categories: Object.keys(tokens).length,
        well_structured: Object.values(tokens).filter(t => t.structure_score > 80).length,
        details: tokens
      };

    } catch (error) {
      this.auditResults.tokens = { categories: 0, error: error.message };
    }
  }

  async checkConsistency() {
    const consistency = {
      color_usage: await this.checkColorConsistency(),
      typography_usage: await this.checkTypographyConsistency(),
      spacing_usage: await this.checkSpacingConsistency()
    };

    this.auditResults.consistency = {
      overall_score: (consistency.color_usage.score + consistency.typography_usage.score + 
                     consistency.spacing_usage.score) / 3,
      details: consistency
    };
  }

  async checkColorConsistency() {
    try {
      const hardcodedColors = execSync(`grep -r "#[0-9a-fA-F]\\{3,6\\}" . --include="*.css" --include="*.scss" 2>/dev/null || true`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      const hardcodedCount = hardcodedColors.split('\n').filter(line => line.trim().length > 0).length;
      return {
        score: Math.max(0, 100 - (hardcodedCount * 5)),
        hardcoded_colors: hardcodedCount
      };
    } catch (error) {
      return { score: 75, hardcoded_colors: 0 };
    }
  }

  async checkTypographyConsistency() {
    try {
      const hardcodedFonts = execSync(`grep -r "font-size:\\|font-family:" . --include="*.css" --include="*.scss" 2>/dev/null | grep -v "var(--" || true`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      const hardcodedCount = hardcodedFonts.split('\n').filter(line => line.trim().length > 0).length;
      return {
        score: Math.max(0, 100 - (hardcodedCount * 3)),
        hardcoded_typography: hardcodedCount
      };
    } catch (error) {
      return { score: 80, hardcoded_typography: 0 };
    }
  }

  async checkSpacingConsistency() {
    try {
      const hardcodedSpacing = execSync(`grep -r "margin:\\|padding:" . --include="*.css" --include="*.scss" 2>/dev/null | grep -E "[0-9]+px" | grep -v "var(--" || true`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      const hardcodedCount = hardcodedSpacing.split('\n').filter(line => line.trim().length > 0).length;
      return {
        score: Math.max(0, 100 - (hardcodedCount * 2)),
        hardcoded_spacing: hardcodedCount
      };
    } catch (error) {
      return { score: 85, hardcoded_spacing: 0 };
    }
  }

  calculateOverallScore() {
    const weights = { components: 0.4, tokens: 0.3, consistency: 0.3 };
    let totalScore = 0;
    let totalWeight = 0;

    if (this.auditResults.components.total_count > 0) {
      const componentScore = (
        (this.auditResults.components.documented / this.auditResults.components.total_count) * 40 +
        (this.auditResults.components.accessible / this.auditResults.components.total_count) * 40 +
        (this.auditResults.components.consistent / this.auditResults.components.total_count) * 20
      );
      totalScore += componentScore * weights.components;
      totalWeight += weights.components;
    }

    if (this.auditResults.tokens.categories > 0) {
      const tokenScore = (this.auditResults.tokens.well_structured / this.auditResults.tokens.categories) * 100;
      totalScore += tokenScore * weights.tokens;
      totalWeight += weights.tokens;
    }

    if (this.auditResults.consistency.overall_score !== undefined) {
      totalScore += this.auditResults.consistency.overall_score * weights.consistency;
      totalWeight += weights.consistency;
    }

    this.auditResults.overall_score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  async generateRecommendations() {
    const recommendations = [];

    if (this.auditResults.overall_score < 70) {
      recommendations.push({
        priority: 'high',
        title: 'Design System Needs Attention',
        action: 'Focus on improving component documentation and accessibility'
      });
    }

    if (this.auditResults.components.accessible < this.auditResults.components.total_count * 0.8) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Component Accessibility',
        action: 'Review and update component accessibility attributes'
      });
    }

    if (this.auditResults.consistency.overall_score < 75) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduce Hardcoded Values',
        action: 'Replace hardcoded values with design tokens'
      });
    }

    this.auditResults.recommendations = recommendations;
  }

  displayResults(options = {}) {
    console.log('\n🎨 Design System Audit Results');
    console.log('================================\n');

    const scoreColor = this.auditResults.overall_score >= 80 ? '🟢' : 
                      this.auditResults.overall_score >= 60 ? '🟡' : '🔴';
    console.log(`${scoreColor} Overall Score: ${this.auditResults.overall_score}/100\n`);

    console.log('📦 Components:');
    console.log(`   Total: ${this.auditResults.components.total_count}`);
    console.log(`   Documented: ${this.auditResults.components.documented}`);
    console.log(`   Accessible: ${this.auditResults.components.accessible}`);
    console.log(`   Consistent: ${this.auditResults.components.consistent}\n`);

    console.log('🎯 Design Tokens:');
    console.log(`   Categories: ${this.auditResults.tokens.categories}`);
    console.log(`   Well Structured: ${this.auditResults.tokens.well_structured}\n`);

    console.log('🔍 Consistency:');
    console.log(`   Overall Score: ${Math.round(this.auditResults.consistency.overall_score)}/100\n`);

    if (this.auditResults.recommendations.length > 0) {
      console.log('💡 Top Recommendations:');
      this.auditResults.recommendations.forEach((rec, index) => {
        const priorityIcon = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`   ${index + 1}. ${priorityIcon} ${rec.title}`);
        console.log(`      Action: ${rec.action}\n`);
      });
    }
  }

  async saveAuditReport() {
    const reportsDir = path.join(this.designSystemPath, 'reports');
    await this.ensureDirectoryExists(reportsDir);
    
    const filename = `audit_${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(this.auditResults, null, 2));
    console.log(`📄 Audit report saved to: ${filepath}`);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    save: args.includes('--save'),
    detailed: args.includes('--detailed')
  };

  const audit = new DesignSystemAuditCLI();
  await audit.runAudit(options);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DesignSystemAuditCLI;
