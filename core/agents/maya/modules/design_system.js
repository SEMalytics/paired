/**
 * Design System Module for UX Expert Agent
 *
 * Manages design tokens, component library, and design system consistency.
 * Provides tools for creating, updating, and maintaining design systems.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class DesignSystemModule {
  constructor(agent) {
    this.agent = agent;
    this.designSystemPath = path.join(process.cwd(), '.paired', 'agents', 'maya', 'design_system');
    this.components = new Map();
    this.tokens = new Map();
    this.version = '1.0.0';
    this.lastUpdated = null;
  }

  /**
   * Initialize design system module
   */
  async initialize() {
    try {
      await this.ensureDirectoryStructure();
      await this.loadDesignSystem();
      await this.validateDesignSystem();
      console.log('🎨 Design System module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Design System module:', error);
      throw error;
    }
  }

  /**
   * Ensure design system directory structure exists
   */
  async ensureDirectoryStructure() {
    const dirs = [
      this.designSystemPath,
      path.join(this.designSystemPath, 'tokens'),
      path.join(this.designSystemPath, 'components'),
      path.join(this.designSystemPath, 'themes'),
      path.join(this.designSystemPath, 'documentation')
    ];

    for (const dir of dirs) {
      await this.ensureDirectoryExists(dir);
    }
  }

  /**
   * Load existing design system
   */
  async loadDesignSystem() {
    try {
      // Load design tokens
      await this.loadDesignTokens();

      // Load components
      await this.loadComponents();

      // Load configuration
      await this.loadConfiguration();

      this.lastUpdated = new Date().toISOString();
    } catch (error) {
      console.warn('⚠️ Creating new design system (no existing system found)');
      await this.createDefaultDesignSystem();
    }
  }

  /**
   * Load design tokens from files
   */
  async loadDesignTokens() {
    const tokensPath = path.join(this.designSystemPath, 'tokens');

    try {
      const tokenFiles = await fs.readdir(tokensPath);

      for (const file of tokenFiles) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const filePath = path.join(tokensPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const tokens = yaml.load(content);

          const category = path.basename(file, path.extname(file));
          this.tokens.set(category, tokens);
        }
      }
    } catch (error) {
      console.warn('⚠️ No existing design tokens found');
    }
  }

  /**
   * Load components from files
   */
  async loadComponents() {
    const componentsPath = path.join(this.designSystemPath, 'components');

    try {
      const componentFiles = await fs.readdir(componentsPath);

      for (const file of componentFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(componentsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const component = JSON.parse(content);

          this.components.set(component.name, component);
        }
      }
    } catch (error) {
      console.warn('⚠️ No existing components found');
    }
  }

  /**
   * Load design system configuration
   */
  async loadConfiguration() {
    const configPath = path.join(this.designSystemPath, 'config.yml');

    try {
      const content = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(content);
      this.version = config.version || '1.0.0';
    } catch (error) {
      console.warn('⚠️ No existing configuration found');
    }
  }

  /**
   * Create default design system
   */
  async createDefaultDesignSystem() {
    // Create default tokens
    await this.createDefaultTokens();

    // Create default components
    await this.createDefaultComponents();

    // Create configuration
    await this.createConfiguration();

    console.log('✅ Default design system created');
  }

  /**
   * Create default design tokens
   */
  async createDefaultTokens() {
    const defaultTokens = {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827'
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6'
        }
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace']
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        },
        lineHeight: {
          tight: '1.25',
          normal: '1.5',
          relaxed: '1.75'
        }
      },
      spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }
    };

    for (const [category, tokens] of Object.entries(defaultTokens)) {
      const filePath = path.join(this.designSystemPath, 'tokens', `${category}.yml`);
      await fs.writeFile(filePath, yaml.dump(tokens));
      this.tokens.set(category, tokens);
    }
  }

  /**
   * Create default components
   */
  async createDefaultComponents() {
    const defaultComponents = [
      {
        name: 'Button',
        category: 'form',
        description: 'Interactive button component with multiple variants',
        variants: ['primary', 'secondary', 'outline', 'ghost'],
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'hover', 'focus', 'disabled'],
        accessibility: {
          role: 'button',
          keyboard: true,
          screenReader: true,
          focusManagement: true
        },
        tokens: {
          backgroundColor: 'colors.primary.500',
          textColor: 'colors.neutral.50',
          padding: 'spacing.3 spacing.6',
          borderRadius: 'borderRadius.md',
          fontSize: 'typography.fontSize.base'
        },
        documentation: 'Primary action button for forms and CTAs'
      },
      {
        name: 'Input',
        category: 'form',
        description: 'Text input field with validation states',
        variants: ['default', 'error', 'success'],
        sizes: ['sm', 'md', 'lg'],
        states: ['default', 'focus', 'disabled', 'readonly'],
        accessibility: {
          role: 'textbox',
          keyboard: true,
          screenReader: true,
          labelAssociation: true
        },
        tokens: {
          backgroundColor: 'colors.neutral.50',
          borderColor: 'colors.neutral.300',
          textColor: 'colors.neutral.900',
          padding: 'spacing.3',
          borderRadius: 'borderRadius.md',
          fontSize: 'typography.fontSize.base'
        },
        documentation: 'Standard text input for forms'
      },
      {
        name: 'Card',
        category: 'layout',
        description: 'Container component for grouping related content',
        variants: ['default', 'elevated', 'outlined'],
        sizes: ['sm', 'md', 'lg', 'full'],
        states: ['default', 'hover', 'selected'],
        accessibility: {
          role: 'region',
          keyboard: false,
          screenReader: true,
          landmark: false
        },
        tokens: {
          backgroundColor: 'colors.neutral.50',
          borderColor: 'colors.neutral.200',
          padding: 'spacing.6',
          borderRadius: 'borderRadius.lg',
          shadow: 'shadows.sm'
        },
        documentation: 'Flexible container for content grouping'
      }
    ];

    for (const component of defaultComponents) {
      const filePath = path.join(this.designSystemPath, 'components', `${component.name.toLowerCase()}.json`);
      await fs.writeFile(filePath, JSON.stringify(component, null, 2));
      this.components.set(component.name, component);
    }
  }

  /**
   * Create design system configuration
   */
  async createConfiguration() {
    const config = {
      name: 'PAIRED Design System',
      version: this.version,
      description: 'Design system for Platform for AI-Enabled Remote Development',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      accessibility: {
        wcagLevel: 'AA',
        contrastRatio: 4.5,
        keyboardNavigation: true,
        screenReaderSupport: true
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      },
      grid: {
        columns: 12,
        gutter: '1.5rem',
        margin: '1rem'
      }
    };

    const configPath = path.join(this.designSystemPath, 'config.yml');
    await fs.writeFile(configPath, yaml.dump(config));
  }

  /**
   * Validate design system consistency
   */
  async validateDesignSystem() {
    const issues = [];

    // Check token consistency
    const tokenIssues = await this.validateTokens();
    issues.push(...tokenIssues);

    // Check component consistency
    const componentIssues = await this.validateComponents();
    issues.push(...componentIssues);

    if (issues.length > 0) {
      console.warn(`⚠️ Design system validation found ${issues.length} issues:`, issues);
    } else {
      console.log('✅ Design system validation passed');
    }

    return issues;
  }

  /**
   * Validate design tokens
   */
  async validateTokens() {
    const issues = [];

    // Check for missing required token categories
    const requiredCategories = ['colors', 'typography', 'spacing'];
    for (const category of requiredCategories) {
      if (!this.tokens.has(category)) {
        issues.push({
          type: 'missing_tokens',
          category,
          severity: 'error',
          message: `Missing required token category: ${category}`
        });
      }
    }

    // Validate color contrast ratios
    if (this.tokens.has('colors')) {
      const colorIssues = await this.validateColorContrast();
      issues.push(...colorIssues);
    }

    return issues;
  }

  /**
   * Validate color contrast ratios
   */
  async validateColorContrast() {
    const issues = [];
    const colors = this.tokens.get('colors');

    // This is a simplified validation - in practice, you'd use a proper color contrast library
    if (colors && colors.primary && colors.neutral) {
      // Check if we have sufficient contrast information
      if (!colors.primary[900] || !colors.neutral[50]) {
        issues.push({
          type: 'color_contrast',
          severity: 'warning',
          message: 'Missing dark/light color variants for contrast validation'
        });
      }
    }

    return issues;
  }

  /**
   * Validate components
   */
  async validateComponents() {
    const issues = [];

    for (const [name, component] of this.components) {
      // Check required fields
      const requiredFields = ['name', 'category', 'accessibility'];
      for (const field of requiredFields) {
        if (!component[field]) {
          issues.push({
            type: 'missing_component_field',
            component: name,
            field,
            severity: 'error',
            message: `Component ${name} missing required field: ${field}`
          });
        }
      }

      // Validate accessibility requirements
      if (component.accessibility) {
        const accessibilityIssues = await this.validateComponentAccessibility(name, component);
        issues.push(...accessibilityIssues);
      }
    }

    return issues;
  }

  /**
   * Validate component accessibility
   */
  async validateComponentAccessibility(name, component) {
    const issues = [];
    const accessibility = component.accessibility;

    // Check required accessibility fields
    const requiredFields = ['role', 'keyboard', 'screenReader'];
    for (const field of requiredFields) {
      if (accessibility[field] === undefined) {
        issues.push({
          type: 'missing_accessibility_field',
          component: name,
          field,
          severity: 'warning',
          message: `Component ${name} missing accessibility field: ${field}`
        });
      }
    }

    return issues;
  }

  /**
   * Add new component to design system
   */
  async addComponent(componentSpec) {
    // Validate component specification
    const validationIssues = await this.validateComponentSpec(componentSpec);
    if (validationIssues.length > 0) {
      throw new Error(`Component validation failed: ${validationIssues.map(i => i.message).join(', ')}`);
    }

    // Add to memory
    this.components.set(componentSpec.name, componentSpec);

    // Save to file
    const filePath = path.join(this.designSystemPath, 'components', `${componentSpec.name.toLowerCase()}.json`);
    await fs.writeFile(filePath, JSON.stringify(componentSpec, null, 2));

    // Update documentation
    await this.updateComponentDocumentation(componentSpec);

    console.log(`✅ Added component: ${componentSpec.name}`);
    return componentSpec;
  }

  /**
   * Update existing component
   */
  async updateComponent(name, updates) {
    if (!this.components.has(name)) {
      throw new Error(`Component ${name} not found`);
    }

    const component = { ...this.components.get(name), ...updates };

    // Validate updated component
    const validationIssues = await this.validateComponentSpec(component);
    if (validationIssues.length > 0) {
      throw new Error(`Component validation failed: ${validationIssues.map(i => i.message).join(', ')}`);
    }

    // Update in memory
    this.components.set(name, component);

    // Save to file
    const filePath = path.join(this.designSystemPath, 'components', `${name.toLowerCase()}.json`);
    await fs.writeFile(filePath, JSON.stringify(component, null, 2));

    console.log(`✅ Updated component: ${name}`);
    return component;
  }

  /**
   * Validate component specification
   */
  async validateComponentSpec(spec) {
    const issues = [];

    // Required fields
    const requiredFields = ['name', 'category', 'description'];
    for (const field of requiredFields) {
      if (!spec[field]) {
        issues.push({
          type: 'missing_field',
          field,
          severity: 'error',
          message: `Missing required field: ${field}`
        });
      }
    }

    // Validate accessibility if present
    if (spec.accessibility) {
      const accessibilityIssues = await this.validateComponentAccessibility(spec.name, spec);
      issues.push(...accessibilityIssues);
    }

    return issues;
  }

  /**
   * Update component documentation
   */
  async updateComponentDocumentation(component) {
    const docPath = path.join(this.designSystemPath, 'documentation', `${component.name.toLowerCase()}.md`);

    const documentation = `# ${component.name}

${component.description}

## Category
${component.category}

## Variants
${component.variants ? component.variants.join(', ') : 'None'}

## Sizes
${component.sizes ? component.sizes.join(', ') : 'None'}

## States
${component.states ? component.states.join(', ') : 'None'}

## Accessibility
- **Role**: ${component.accessibility?.role || 'Not specified'}
- **Keyboard Navigation**: ${component.accessibility?.keyboard ? 'Yes' : 'No'}
- **Screen Reader Support**: ${component.accessibility?.screenReader ? 'Yes' : 'No'}

## Design Tokens
${component.tokens ? Object.entries(component.tokens).map(([key, value]) => `- **${key}**: ${value}`).join('\n') : 'None specified'}

## Usage Notes
${component.documentation || 'No additional usage notes'}

---
*Last updated: ${new Date().toISOString()}*
`;

    await fs.writeFile(docPath, documentation);
  }

  /**
   * Generate design system report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: this.version,
      summary: {
        total_tokens: this.tokens.size,
        total_components: this.components.size,
        last_updated: this.lastUpdated
      },
      tokens: {},
      components: [],
      validation: await this.validateDesignSystem()
    };

    // Token summary
    for (const [category, tokens] of this.tokens) {
      report.tokens[category] = Object.keys(tokens).length;
    }

    // Component summary
    for (const [name, component] of this.components) {
      report.components.push({
        name,
        category: component.category,
        variants: component.variants?.length || 0,
        accessibility_compliant: this.isAccessibilityCompliant(component)
      });
    }

    return report;
  }

  /**
   * Check if component is accessibility compliant
   */
  isAccessibilityCompliant(component) {
    if (!component.accessibility) return false;

    const required = ['role', 'keyboard', 'screenReader'];
    return required.every(field => component.accessibility[field] !== undefined);
  }

  /**
   * Get component by name
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Get all components by category
   */
  getComponentsByCategory(category) {
    return Array.from(this.components.values()).filter(c => c.category === category);
  }

  /**
   * Get design tokens by category
   */
  getTokens(category) {
    return this.tokens.get(category);
  }

  /**
   * Get all token categories
   */
  getTokenCategories() {
    return Array.from(this.tokens.keys());
  }

  /**
   * Utility method to ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

module.exports = DesignSystemModule;
