#!/usr/bin/env node

/**
 * PAIRED Logic Diagram CLI
 *
 * Command-line tool for generating XMind diagrams from code logic
 *
 * Usage:
 *   paired-logic-diagram [options] [path]
 *   paired-logic-diagram --help
 */

const { LogicDiagramGenerator } = require('./logic_diagram_generator');
const path = require('path');
const fs = require('fs');

class LogicDiagramCLI {
  constructor() {
    this.generator = new LogicDiagramGenerator();
  }

  async run() {
    const args = process.argv.slice(2);
    const options = this.parseArgs(args);

    if (options.help) {
      this.showHelp();
      return;
    }

    if (options.version) {
      console.log('PAIRED Logic Diagram Generator v1.0.0');
      return;
    }

    try {
      await this.generateDiagrams(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  parseArgs(args) {
    const options = {
      path: process.cwd(),
      output: './diagrams',
      format: 'xmind',
      focus: 'all',
      maxComplexity: 10,
      help: false,
      version: false,
      verbose: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
      case '--focus':
        options.focus = args[++i];
        break;
      case '--max-complexity':
      case '-c':
        options.maxComplexity = parseInt(args[++i]);
        break;
      case '--verbose':
        options.verbose = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.path = arg;
        }
        break;
      }
    }

    return options;
  }

  async generateDiagrams(options) {
    console.log('🎯 PAIRED Logic Diagram Generator');
    console.log('================================');
    console.log(`📁 Analyzing: ${options.path}`);
    console.log(`📊 Output: ${options.output}`);
    console.log(`🎨 Format: ${options.format}`);
    console.log(`🔍 Focus: ${options.focus}`);
    console.log(`⚡ Max Complexity: ${options.maxComplexity}`);
    console.log('');

    // Validate path
    if (!fs.existsSync(options.path)) {
      throw new Error(`Path does not exist: ${options.path}`);
    }

    const startTime = Date.now();

    // Generate diagrams
    const result = await this.generator.generateCodebaseLogicDiagram(options.path, {
      outputDir: options.output,
      format: options.format,
      focusOn: options.focus,
      maxComplexity: options.maxComplexity,
      title: `Logic Analysis: ${path.basename(options.path)}`
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Display results
    console.log('✅ Analysis Complete!');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Files analyzed: ${result.analysis.summary.totalFiles}`);
    console.log(`   Logic patterns: ${result.analysis.summary.totalPatterns}`);
    console.log(`   Average complexity: ${(result.analysis.summary.complexity / result.analysis.summary.totalFiles).toFixed(1)}`);
    console.log('');

    // Display insights
    if (result.summary.insights.length > 0) {
      console.log('💡 Key Insights:');
      result.summary.insights.forEach(insight => {
        const icon = insight.level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${insight.message}`);
      });
      console.log('');
    }

    // Display recommendations
    if (result.summary.recommendations.length > 0) {
      console.log('🎯 Recommendations:');
      result.summary.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priority} ${rec.title}`);
        if (options.verbose) {
          console.log(`      ${rec.description}`);
        }
      });
      console.log('');
    }

    // Display generated files
    console.log('📁 Generated Diagrams:');
    result.diagrams.forEach(diagram => {
      console.log(`   📋 ${diagram.title}`);
      diagram.files.forEach(file => {
        console.log(`      ${file.type.toUpperCase()}: ${file.path}`);
      });
    });
    console.log('');
    console.log(`📄 Full Report: ${result.summary.reportPath}`);
    console.log('');
    console.log('🎉 Ready to import into XMind for interactive editing!');
  }

  showHelp() {
    console.log(`
🎯 PAIRED Logic Diagram Generator

Generate XMind-compatible diagrams from your codebase logic patterns.

USAGE:
    paired-logic-diagram [OPTIONS] [PATH]

ARGUMENTS:
    [PATH]                  Path to analyze (default: current directory)

OPTIONS:
    -o, --output <DIR>      Output directory (default: ./diagrams)
    -f, --format <FORMAT>   Output format: xmind, json, both (default: both)
    --focus <TYPE>          Focus on: all, decisions, flows, processes, errors (default: all)
    -c, --max-complexity <N> Maximum complexity to include (default: 10)
    --verbose               Show detailed output
    -h, --help              Show this help message
    -v, --version           Show version

EXAMPLES:
    # Analyze current directory
    paired-logic-diagram

    # Analyze specific project with custom output
    paired-logic-diagram ./src --output ./my-diagrams

    # Focus only on decision trees
    paired-logic-diagram --focus decisions

    # Generate only XMind format for complex logic
    paired-logic-diagram --format xmind --max-complexity 15

    # Verbose analysis of specific file
    paired-logic-diagram ./core/complex-module.js --verbose

FOCUS TYPES:
    all         - All logic patterns (default)
    decisions   - If/else statements, switch cases, ternary operators
    flows       - Function call chains, async operations
    processes   - Loops, complex algorithms, state machines
    errors      - Try/catch blocks, error handling patterns

OUTPUT FORMATS:
    xmind       - XMind-compatible XML files (best for interactive editing)
    markdown    - Markdown format for documentation
    opml        - OPML format for outline processors
    textbundle  - TextBundle format with rich text
    json        - JSON structure for programmatic use
    all         - Generate all supported formats

The generated XMind files can be imported directly into XMind for:
- Interactive editing and rearrangement
- Custom styling and themes
- Collaborative review and annotation
- Export to various presentation formats

🌊 Part of the Platform for AI-Enabled Remote Development (PAIRED)
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new LogicDiagramCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { LogicDiagramCLI };
