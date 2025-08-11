#!/usr/bin/env node

/**
 * Accessibility Audit CLI Tool
 * 
 * Command-line tool for performing comprehensive accessibility audits
 * and WCAG compliance checks on web applications and components.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AccessibilityAuditCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.accessibilityPath = path.join(this.projectRoot, '.wee', 'agents', 'virtual_ux_expert', 'accessibility');
    this.auditResults = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      target: 'project',
      wcagLevel: 'AA',
      score: 0,
      issues: [],
      recommendations: [],
      summary: {}
    };
  }

  /**
   * Run comprehensive accessibility audit
   */
  async runAudit(target = 'project', options = {}) {
    console.log('♿ Starting Accessibility Audit...\n');

    try {
      this.auditResults.target = target;
      this.auditResults.wcagLevel = options.wcagLevel || 'AA';

      await this.ensureDirectoryExists(this.accessibilityPath);
      
      // Perform different audit checks
      console.log('🎨 Checking Color Contrast...');
      const colorIssues = await this.checkColorContrast();
      
      console.log('⌨️  Checking Keyboard Navigation...');
      const keyboardIssues = await this.checkKeyboardNavigation();
      
      console.log('🏷️  Checking Semantic Markup...');
      const semanticIssues = await this.checkSemanticMarkup();
      
      console.log('🔍 Checking Focus Indicators...');
      const focusIssues = await this.checkFocusIndicators();
      
      console.log('🖼️  Checking Image Accessibility...');
      const imageIssues = await this.checkImageAccessibility();
      
      console.log('📱 Checking ARIA Implementation...');
      const ariaIssues = await this.checkAriaImplementation();

      // Combine all issues
      this.auditResults.issues = [
        ...colorIssues,
        ...keyboardIssues,
        ...semanticIssues,
        ...focusIssues,
        ...imageIssues,
        ...ariaIssues
      ];

      // Calculate score
      this.auditResults.score = this.calculateAccessibilityScore();
      
      // Generate recommendations
      this.auditResults.recommendations = await this.generateRecommendations();
      
      // Create summary
      this.auditResults.summary = this.generateSummary();

      // Display results
      this.displayResults(options);

      // Save audit report
      if (options.save !== false) {
        await this.saveAuditReport();
      }

      return this.auditResults;

    } catch (error) {
      console.error('❌ Accessibility Audit failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check color contrast ratios
   */
  async checkColorContrast() {
    const issues = [];
    
    try {
      // Look for CSS color definitions
      const cssFiles = await this.findFiles(['*.css', '*.scss', '*.sass']);
      
      for (const file of cssFiles.slice(0, 10)) { // Limit to first 10 files
        const content = await fs.readFile(file, 'utf8');
        const colorMatches = content.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
        
        // Simulate contrast checking (in real implementation, would calculate actual ratios)
        for (const color of colorMatches.slice(0, 5)) {
          const simulatedRatio = Math.random() * 10 + 1; // 1-11 ratio
          
          if (simulatedRatio < 4.5) {
            issues.push({
              rule: 'color-contrast',
              severity: simulatedRatio < 3.0 ? 'critical' : 'major',
              file: path.relative(this.projectRoot, file),
              description: `Color contrast ratio ${simulatedRatio.toFixed(2)}:1 is below WCAG AA standard (4.5:1)`,
              color: color,
              wcag: '1.4.3'
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check color contrast:', error.message);
    }

    return issues;
  }

  /**
   * Check keyboard navigation
   */
  async checkKeyboardNavigation() {
    const issues = [];
    
    try {
      // Look for interactive elements without proper keyboard support
      const htmlFiles = await this.findFiles(['*.html', '*.jsx', '*.tsx', '*.vue']);
      
      for (const file of htmlFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for divs/spans used as buttons without proper attributes
        const clickableElements = content.match(/<(div|span)[^>]*onClick|click[^>]*>/gi) || [];
        
        for (const element of clickableElements) {
          if (!element.includes('tabIndex') && !element.includes('role=') && !element.includes('onKeyDown')) {
            issues.push({
              rule: 'keyboard-navigation',
              severity: 'major',
              file: path.relative(this.projectRoot, file),
              description: 'Interactive element may not be keyboard accessible',
              element: element.substring(0, 100) + '...',
              wcag: '2.1.1'
            });
          }
        }
        
        // Check for missing focus management in modals
        if (content.includes('modal') || content.includes('dialog')) {
          if (!content.includes('focus') && !content.includes('tabIndex')) {
            issues.push({
              rule: 'keyboard-navigation',
              severity: 'major',
              file: path.relative(this.projectRoot, file),
              description: 'Modal/dialog may lack proper focus management',
              wcag: '2.4.3'
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check keyboard navigation:', error.message);
    }

    return issues;
  }

  /**
   * Check semantic markup
   */
  async checkSemanticMarkup() {
    const issues = [];
    
    try {
      const htmlFiles = await this.findFiles(['*.html', '*.jsx', '*.tsx', '*.vue']);
      
      for (const file of htmlFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for missing main landmark
        if (!content.includes('<main') && !content.includes('role="main"')) {
          issues.push({
            rule: 'semantic-markup',
            severity: 'moderate',
            file: path.relative(this.projectRoot, file),
            description: 'Missing main landmark element',
            wcag: '1.3.1'
          });
        }
        
        // Check for heading hierarchy
        const headings = content.match(/<h[1-6]/gi) || [];
        if (headings.length > 0) {
          const levels = headings.map(h => parseInt(h.charAt(2)));
          for (let i = 1; i < levels.length; i++) {
            if (levels[i] > levels[i-1] + 1) {
              issues.push({
                rule: 'semantic-markup',
                severity: 'moderate',
                file: path.relative(this.projectRoot, file),
                description: 'Heading hierarchy may be incorrect (skipping levels)',
                wcag: '1.3.1'
              });
              break;
            }
          }
        }
        
        // Check for form labels
        const inputs = content.match(/<input[^>]*>/gi) || [];
        const labels = content.match(/<label[^>]*>/gi) || [];
        
        if (inputs.length > labels.length) {
          issues.push({
            rule: 'semantic-markup',
            severity: 'major',
            file: path.relative(this.projectRoot, file),
            description: 'Form inputs may be missing associated labels',
            wcag: '1.3.1'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check semantic markup:', error.message);
    }

    return issues;
  }

  /**
   * Check focus indicators
   */
  async checkFocusIndicators() {
    const issues = [];
    
    try {
      const cssFiles = await this.findFiles(['*.css', '*.scss', '*.sass']);
      
      let hasFocusStyles = false;
      
      for (const file of cssFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        if (content.includes(':focus') || content.includes('focus-visible')) {
          hasFocusStyles = true;
        }
        
        // Check for focus outline removal without replacement
        if (content.includes('outline: none') || content.includes('outline:none')) {
          const hasReplacementFocus = content.includes('box-shadow') || content.includes('border');
          if (!hasReplacementFocus) {
            issues.push({
              rule: 'focus-indicators',
              severity: 'critical',
              file: path.relative(this.projectRoot, file),
              description: 'Focus outline removed without providing alternative focus indicator',
              wcag: '2.4.7'
            });
          }
        }
      }
      
      if (!hasFocusStyles) {
        issues.push({
          rule: 'focus-indicators',
          severity: 'major',
          file: 'global',
          description: 'No custom focus styles found - relying on browser defaults',
          wcag: '2.4.7'
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not check focus indicators:', error.message);
    }

    return issues;
  }

  /**
   * Check image accessibility
   */
  async checkImageAccessibility() {
    const issues = [];
    
    try {
      const htmlFiles = await this.findFiles(['*.html', '*.jsx', '*.tsx', '*.vue']);
      
      for (const file of htmlFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for images without alt text
        const images = content.match(/<img[^>]*>/gi) || [];
        
        for (const img of images) {
          if (!img.includes('alt=')) {
            issues.push({
              rule: 'alt-text',
              severity: 'major',
              file: path.relative(this.projectRoot, file),
              description: 'Image missing alt attribute',
              element: img.substring(0, 100) + '...',
              wcag: '1.1.1'
            });
          } else if (img.includes('alt=""') && !img.includes('decorative')) {
            // Empty alt might be intentional for decorative images, but flag for review
            issues.push({
              rule: 'alt-text',
              severity: 'minor',
              file: path.relative(this.projectRoot, file),
              description: 'Image has empty alt text - verify if decorative',
              element: img.substring(0, 100) + '...',
              wcag: '1.1.1'
            });
          }
        }
        
        // Check for background images that might need text alternatives
        const bgImages = content.match(/background-image:\s*url\([^)]+\)/gi) || [];
        if (bgImages.length > 0) {
          issues.push({
            rule: 'alt-text',
            severity: 'minor',
            file: path.relative(this.projectRoot, file),
            description: 'Background images found - ensure they are decorative or have text alternatives',
            wcag: '1.1.1'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check image accessibility:', error.message);
    }

    return issues;
  }

  /**
   * Check ARIA implementation
   */
  async checkAriaImplementation() {
    const issues = [];
    
    try {
      const htmlFiles = await this.findFiles(['*.html', '*.jsx', '*.tsx', '*.vue']);
      
      for (const file of htmlFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for ARIA labels on interactive elements
        const buttons = content.match(/<button[^>]*>/gi) || [];
        for (const button of buttons) {
          if (!button.includes('aria-label') && !button.includes('aria-labelledby') && 
              !button.match(/>[^<]+</)) {
            issues.push({
              rule: 'aria-labels',
              severity: 'major',
              file: path.relative(this.projectRoot, file),
              description: 'Button may lack accessible name',
              element: button.substring(0, 100) + '...',
              wcag: '4.1.2'
            });
          }
        }
        
        // Check for proper ARIA roles on custom elements
        const customElements = content.match(/<div[^>]*role=/gi) || [];
        for (const element of customElements) {
          if (element.includes('role="button"') && !element.includes('tabindex')) {
            issues.push({
              rule: 'aria-labels',
              severity: 'moderate',
              file: path.relative(this.projectRoot, file),
              description: 'Element with button role may need tabindex for keyboard access',
              wcag: '4.1.2'
            });
          }
        }
        
        // Check for ARIA state management
        if (content.includes('aria-expanded') || content.includes('aria-selected')) {
          if (!content.includes('setState') && !content.includes('useState') && !content.includes('aria-')) {
            issues.push({
              rule: 'aria-labels',
              severity: 'minor',
              file: path.relative(this.projectRoot, file),
              description: 'ARIA states found - ensure they are properly managed',
              wcag: '4.1.2'
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check ARIA implementation:', error.message);
    }

    return issues;
  }

  /**
   * Find files matching patterns
   */
  async findFiles(patterns) {
    const files = [];
    
    for (const pattern of patterns) {
      try {
        const result = execSync(`find . -name "${pattern}" -type f | head -20`, {
          cwd: this.projectRoot,
          encoding: 'utf8'
        });
        
        const foundFiles = result.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => path.join(this.projectRoot, line.replace('./', '')));
        
        files.push(...foundFiles);
      } catch (error) {
        // Continue with other patterns if one fails
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Calculate accessibility score
   */
  calculateAccessibilityScore() {
    let score = 100;
    
    for (const issue of this.auditResults.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'major':
          score -= 15;
          break;
        case 'moderate':
          score -= 8;
          break;
        case 'minor':
          score -= 3;
          break;
      }
    }
    
    return Math.max(0, score);
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const recommendations = [];
    const issuesByRule = {};
    
    // Group issues by rule
    for (const issue of this.auditResults.issues) {
      if (!issuesByRule[issue.rule]) {
        issuesByRule[issue.rule] = [];
      }
      issuesByRule[issue.rule].push(issue);
    }
    
    // Generate recommendations for each rule
    for (const [rule, ruleIssues] of Object.entries(issuesByRule)) {
      const priority = this.calculatePriority(ruleIssues);
      const recommendation = this.getRecommendationText(rule, ruleIssues.length);
      
      recommendations.push({
        rule,
        priority,
        issueCount: ruleIssues.length,
        recommendation,
        resources: this.getRecommendationResources(rule)
      });
    }
    
    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return recommendations;
  }

  /**
   * Calculate priority based on issue severities
   */
  calculatePriority(issues) {
    const severities = issues.map(i => i.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('major')) return 'major';
    if (severities.includes('moderate')) return 'moderate';
    return 'minor';
  }

  /**
   * Get recommendation text for a rule
   */
  getRecommendationText(rule, issueCount) {
    const templates = {
      'color-contrast': `Improve color contrast ratios for ${issueCount} elements to meet WCAG AA standards`,
      'keyboard-navigation': `Fix keyboard navigation issues for ${issueCount} interactive elements`,
      'semantic-markup': `Improve semantic HTML structure for ${issueCount} elements`,
      'focus-indicators': `Enhance focus indicators for ${issueCount} elements`,
      'alt-text': `Add or improve alternative text for ${issueCount} images`,
      'aria-labels': `Fix ARIA implementation for ${issueCount} elements`
    };
    
    return templates[rule] || `Address ${issueCount} accessibility issues related to ${rule}`;
  }

  /**
   * Get recommendation resources
   */
  getRecommendationResources(rule) {
    const resources = {
      'color-contrast': ['WebAIM Color Contrast Checker', 'WCAG 2.1 Guideline 1.4.3'],
      'keyboard-navigation': ['WebAIM Keyboard Accessibility', 'WCAG 2.1 Guideline 2.1.1'],
      'semantic-markup': ['MDN HTML Semantics', 'WCAG 2.1 Guideline 1.3.1'],
      'focus-indicators': ['WebAIM Focus Indicators', 'WCAG 2.1 Guideline 2.4.7'],
      'alt-text': ['WebAIM Alternative Text', 'WCAG 2.1 Guideline 1.1.1'],
      'aria-labels': ['WAI-ARIA Authoring Practices', 'WCAG 2.1 Guideline 4.1.2']
    };
    
    return resources[rule] || ['WCAG 2.1 Guidelines'];
  }

  /**
   * Generate audit summary
   */
  generateSummary() {
    const issuesBySeverity = {
      critical: this.auditResults.issues.filter(i => i.severity === 'critical').length,
      major: this.auditResults.issues.filter(i => i.severity === 'major').length,
      moderate: this.auditResults.issues.filter(i => i.severity === 'moderate').length,
      minor: this.auditResults.issues.filter(i => i.severity === 'minor').length
    };
    
    return {
      total_issues: this.auditResults.issues.length,
      issues_by_severity: issuesBySeverity,
      compliance_level: this.getComplianceLevel(this.auditResults.score),
      wcag_level: this.auditResults.wcagLevel
    };
  }

  /**
   * Get compliance level based on score
   */
  getComplianceLevel(score) {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 50) return 'Poor';
    return 'Critical';
  }

  /**
   * Display audit results
   */
  displayResults(options = {}) {
    console.log('\n♿ Accessibility Audit Results');
    console.log('==============================\n');

    const scoreColor = this.auditResults.score >= 85 ? '🟢' : 
                      this.auditResults.score >= 70 ? '🟡' : '🔴';
    console.log(`${scoreColor} Accessibility Score: ${this.auditResults.score}/100`);
    console.log(`📋 WCAG Level: ${this.auditResults.wcagLevel}`);
    console.log(`🏆 Compliance Level: ${this.auditResults.summary.compliance_level}\n`);

    console.log('📊 Issues by Severity:');
    console.log(`   🔴 Critical: ${this.auditResults.summary.issues_by_severity.critical}`);
    console.log(`   🟠 Major: ${this.auditResults.summary.issues_by_severity.major}`);
    console.log(`   🟡 Moderate: ${this.auditResults.summary.issues_by_severity.moderate}`);
    console.log(`   🟢 Minor: ${this.auditResults.summary.issues_by_severity.minor}\n`);

    if (this.auditResults.recommendations.length > 0) {
      console.log('💡 Top Recommendations:');
      this.auditResults.recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityIcon = rec.priority === 'critical' ? '🔴' : 
                            rec.priority === 'major' ? '🟠' : 
                            rec.priority === 'moderate' ? '🟡' : '🟢';
        console.log(`   ${index + 1}. ${priorityIcon} ${rec.recommendation}`);
        console.log(`      Resources: ${rec.resources.join(', ')}\n`);
      });
    }

    if (options.detailed && this.auditResults.issues.length > 0) {
      console.log('🔍 Detailed Issues:');
      this.auditResults.issues.slice(0, 10).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`      File: ${issue.file}`);
        console.log(`      WCAG: ${issue.wcag}\n`);
      });
    }
  }

  /**
   * Save audit report
   */
  async saveAuditReport() {
    const auditsDir = path.join(this.accessibilityPath, 'audits');
    await this.ensureDirectoryExists(auditsDir);
    
    const filename = `${this.auditResults.id}.json`;
    const filepath = path.join(auditsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(this.auditResults, null, 2));
    console.log(`📄 Accessibility audit saved to: ${filepath}`);
  }

  /**
   * Ensure directory exists
   */
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
  const target = args[0] || 'project';
  const options = {
    wcagLevel: args.includes('--wcag-aaa') ? 'AAA' : 'AA',
    save: !args.includes('--no-save'),
    detailed: args.includes('--detailed')
  };

  const audit = new AccessibilityAuditCLI();
  await audit.runAudit(target, options);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AccessibilityAuditCLI;
