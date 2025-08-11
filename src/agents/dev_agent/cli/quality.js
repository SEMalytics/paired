#!/usr/bin/env node
/**
 * Dev Agent Code Quality Management CLI Tool
 * Provides command-line interface for code quality assessment and improvement
 */

const fs = require('fs');
const path = require('path');

// Get project paths
const projectRoot = path.resolve(__dirname, '../../../..');
const devAgentDir = path.resolve(__dirname, '..');
const trackingDir = path.join(devAgentDir, 'tracking');
const codeQualityFile = path.join(trackingDir, 'code_quality.md');

// Ensure tracking directory exists
if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir, { recursive: true });
}

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorize(text, color) {
    return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

function getCurrentTimestamp() {
    return new Date().toISOString().split('T')[0];
}

// Code quality assessment functions
function scanCodeQuality() {
    console.log(colorize(`🔍 Scanning code quality...`, 'blue'));
    
    const qualityData = {
        timestamp: new Date().toISOString(),
        overallScore: 0,
        metrics: {
            complexity: { score: 0, issues: [] },
            maintainability: { score: 0, issues: [] },
            testCoverage: { score: 0, issues: [] }
        },
        refactoringTargets: [],
        improvements: []
    };
    
    try {
        // Analyze complexity
        console.log(colorize(`  📊 Analyzing complexity...`, 'cyan'));
        qualityData.metrics.complexity = analyzeComplexity();
        
        // Analyze maintainability
        console.log(colorize(`  🔧 Analyzing maintainability...`, 'cyan'));
        qualityData.metrics.maintainability = analyzeMaintainability();
        
        // Check test coverage
        console.log(colorize(`  🧪 Checking test coverage...`, 'cyan'));
        qualityData.metrics.testCoverage = analyzeTestCoverage();
        
        // Calculate overall score
        const scores = Object.values(qualityData.metrics).map(m => m.score);
        qualityData.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        // Save results
        saveQualityData(qualityData);
        
        // Display results
        displayQualityResults(qualityData);
        
        return qualityData;
        
    } catch (error) {
        console.error(colorize(`❌ Error during quality scan: ${error.message}`, 'red'));
        return null;
    }
}

function analyzeComplexity() {
    const issues = [];
    let score = 85;
    
    try {
        const jsFiles = findJavaScriptFiles();
        
        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            
            const functionCount = (content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
            const conditionals = (content.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;
            
            if (lines.length > 500) {
                issues.push(`${path.relative(projectRoot, file)}: Large file (${lines.length} lines)`);
                score -= 5;
            }
            
            if (functionCount > 20) {
                issues.push(`${path.relative(projectRoot, file)}: Too many functions (${functionCount})`);
                score -= 3;
            }
        });
        
    } catch (error) {
        issues.push(`Error analyzing complexity: ${error.message}`);
        score = 50;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzeMaintainability() {
    const issues = [];
    let score = 80;
    
    try {
        const jsFiles = findJavaScriptFiles();
        
        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            const commentLines = (content.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
            const codeLines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
            const commentRatio = commentLines / Math.max(codeLines, 1);
            
            if (commentRatio < 0.1) {
                issues.push(`${path.relative(projectRoot, file)}: Low comment ratio (${Math.round(commentRatio * 100)}%)`);
                score -= 5;
            }
        });
        
    } catch (error) {
        issues.push(`Error analyzing maintainability: ${error.message}`);
        score = 50;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzeTestCoverage() {
    const issues = [];
    let score = 70;
    
    try {
        const testFiles = findTestFiles();
        const sourceFiles = findJavaScriptFiles().filter(f => !f.includes('test') && !f.includes('spec'));
        
        if (testFiles.length === 0) {
            issues.push('No test files found');
            score = 0;
        } else {
            const testRatio = testFiles.length / Math.max(sourceFiles.length, 1);
            
            if (testRatio < 0.3) {
                issues.push(`Low test file ratio (${Math.round(testRatio * 100)}%)`);
                score -= 20;
            }
        }
        
    } catch (error) {
        issues.push(`Error analyzing test coverage: ${error.message}`);
        score = 30;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
}

function findJavaScriptFiles() {
    const files = [];
    
    function walkDir(dir) {
        try {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    walkDir(fullPath);
                } else if (stat.isFile() && item.endsWith('.js')) {
                    files.push(fullPath);
                }
            });
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    walkDir(projectRoot);
    return files;
}

function findTestFiles() {
    return findJavaScriptFiles().filter(file => 
        file.includes('test') || 
        file.includes('spec') || 
        file.includes('__tests__')
    );
}

function saveQualityData(data) {
    try {
        let content = `# Code Quality Tracking\n\n`;
        content += `**Last Updated:** ${getCurrentTimestamp()}\n`;
        content += `**Overall Quality Score:** ${data.overallScore}/100\n\n`;
        
        content += `## Quality Metrics\n\n`;
        Object.entries(data.metrics).forEach(([metric, details]) => {
            content += `### ${metric.charAt(0).toUpperCase() + metric.slice(1)}\n`;
            content += `- **Score:** ${details.score}/100\n`;
            if (details.issues.length > 0) {
                content += `- **Issues:**\n`;
                details.issues.forEach(issue => {
                    content += `  - ${issue}\n`;
                });
            }
            content += `\n`;
        });
        
        fs.writeFileSync(codeQualityFile, content);
        return true;
    } catch (error) {
        console.error(colorize(`Error saving quality data: ${error.message}`, 'red'));
        return false;
    }
}

function displayQualityResults(data) {
    console.log('');
    console.log(colorize(`📊 Code Quality Results:`, 'blue'));
    console.log('');
    
    const scoreColor = data.overallScore >= 80 ? 'green' : data.overallScore >= 60 ? 'yellow' : 'red';
    console.log(colorize(`🎯 Overall Quality Score: ${data.overallScore}/100`, scoreColor));
    console.log('');
    
    Object.entries(data.metrics).forEach(([metric, details]) => {
        const metricColor = details.score >= 80 ? 'green' : details.score >= 60 ? 'yellow' : 'red';
        console.log(colorize(`${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${details.score}/100`, metricColor));
        
        if (details.issues.length > 0) {
            details.issues.slice(0, 3).forEach(issue => {
                console.log(colorize(`  ⚠️ ${issue}`, 'yellow'));
            });
        }
        console.log('');
    });
}

function showHelp() {
    console.log(colorize(`🔧 Dev Agent Code Quality CLI`, 'blue'));
    console.log('');
    console.log(colorize(`Usage: node quality.js <command>`, 'white'));
    console.log('');
    console.log(colorize(`Commands:`, 'yellow'));
    console.log(colorize(`  scan       - Perform comprehensive code quality scan`, 'white'));
    console.log(colorize(`  metrics    - Show current quality metrics`, 'white'));
    console.log(colorize(`  refactor   - Identify refactoring targets`, 'white'));
    console.log(colorize(`  improve    - Plan quality improvements`, 'white'));
    console.log(colorize(`  help       - Show this help`, 'white'));
}

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'scan':
        scanCodeQuality();
        break;
        
    case 'metrics':
        if (!fs.existsSync(codeQualityFile)) {
            console.log(colorize(`📊 No quality metrics available. Run 'quality scan' first.`, 'yellow'));
        } else {
            const content = fs.readFileSync(codeQualityFile, 'utf8');
            console.log(content);
        }
        break;
        
    case 'refactor':
        console.log(colorize(`🔧 Identifying refactoring targets...`, 'blue'));
        // Implementation for refactoring analysis
        break;
        
    case 'improve':
        console.log(colorize(`📈 Planning quality improvements...`, 'blue'));
        // Implementation for improvement planning
        break;
        
    case 'help':
        showHelp();
        break;
        
    default:
        if (command) {
            console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
        }
        showHelp();
        process.exit(1);
}
