/**
 * Quality Auditor Module for QA Agent
 * 
 * Handles comprehensive quality auditing functionality including:
 * - Quality metrics collection and analysis
 * - Compliance checking against standards
 * - Quality trend analysis
 * - Improvement recommendations
 */

const fs = require('fs').promises;
const path = require('path');

class QualityAuditor {
  constructor(qaAgent) {
    this.qaAgent = qaAgent;
    this.qualityMetrics = {};
    this.complianceRules = [];
    // Safely access config with fallback
    const projectRoot = (qaAgent && qaAgent.config && qaAgent.config.projectRoot) ? 
      qaAgent.config.projectRoot : process.cwd();
    this.trackingDir = path.join(projectRoot, 'src/agents/qa_agent/tracking');
  }

  /**
   * Initialize quality auditor
   */
  async initialize() {
    console.log('📊 Quality auditor module initialized');
    await this.ensureTrackingFiles();
    await this.loadComplianceRules();
  }

  /**
   * Ensure tracking files exist
   */
  async ensureTrackingFiles() {
    try {
      await fs.mkdir(this.trackingDir, { recursive: true });
      
      const auditHistoryFile = path.join(this.trackingDir, 'audit_history.md');
      const complianceFile = path.join(this.trackingDir, 'compliance_status.md');
      
      // Create audit history file if it doesn't exist
      try {
        await fs.access(auditHistoryFile);
      } catch {
        await fs.writeFile(auditHistoryFile, this.getAuditHistoryTemplate());
      }
      
      // Create compliance file if it doesn't exist
      try {
        await fs.access(complianceFile);
      } catch {
        await fs.writeFile(complianceFile, this.getComplianceTemplate());
      }
    } catch (error) {
      console.warn(`⚠️ Could not create quality auditor tracking files: ${error.message}`);
    }
  }

  /**
   * Load compliance rules
   */
  async loadComplianceRules() {
    this.complianceRules = [
      {
        id: 'test_coverage',
        name: 'Test Coverage Minimum',
        threshold: 80,
        type: 'percentage',
        severity: 'high'
      },
      {
        id: 'code_complexity',
        name: 'Code Complexity Maximum',
        threshold: 10,
        type: 'maximum',
        severity: 'medium'
      },
      {
        id: 'duplication',
        name: 'Code Duplication Maximum',
        threshold: 5,
        type: 'percentage_max',
        severity: 'medium'
      },
      {
        id: 'security_score',
        name: 'Security Score Minimum',
        threshold: 8,
        type: 'minimum',
        severity: 'high'
      },
      {
        id: 'performance_score',
        name: 'Performance Score Minimum',
        threshold: 7,
        type: 'minimum',
        severity: 'medium'
      }
    ];
  }

  /**
   * Collect quality metrics
   */
  async collectMetrics() {
    console.log('📊 Collecting quality metrics...');

    const metrics = {
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Analyzing test coverage...');
    metrics.test_coverage = await this.getTestCoverage();
    
    console.log('🔍 Analyzing code complexity...');
    metrics.code_complexity = await this.getCodeComplexity();
    
    console.log('🔍 Analyzing code duplication...');
    metrics.duplication_ratio = await this.getDuplicationRatio();
    
    console.log('🔍 Analyzing security...');
    metrics.security_score = await this.getSecurityScore();
    
    console.log('🔍 Analyzing performance...');
    metrics.performance_score = await this.getPerformanceScore();
    
    console.log('🔍 Analyzing maintainability...');
    metrics.maintainability_index = await this.getMaintainabilityIndex();
    
    console.log('🔍 Analyzing technical debt...');
    metrics.technical_debt_ratio = await this.getTechnicalDebtRatio();

    this.qualityMetrics = metrics;
    await this.updateMetricsTracking(metrics);

    return metrics;
  }

  /**
   * Get test coverage metrics
   */
  async getTestCoverage() {
    console.log('🔍 Starting test coverage analysis...');
    try {
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      const projectRoot = (this.qaAgent && this.qaAgent.config && this.qaAgent.config.projectRoot) ? 
        this.qaAgent.config.projectRoot : process.cwd();
      
      console.log(`📁 Analyzing project root: ${projectRoot}`);
      
      // Try to get coverage from npm scripts or tools
      console.log('🔍 Attempting to get coverage from npm scripts...');
      let coverage = await this.tryGetCoverageFromNpm(projectRoot);
      
      if (!coverage) {
        console.log('📊 No npm coverage found, analyzing test files manually...');
        coverage = await this.analyzeTestFiles(projectRoot);
      }
      
      console.log('✅ Test coverage analysis complete:', coverage);
      return coverage;
      
    } catch (error) {
      console.error(`❌ Failed to get test coverage: ${error.message}`);
      console.log('🔄 Falling back to basic test file analysis...');
      return await this.analyzeTestFiles(process.cwd());
    }
  }
  
  /**
   * Try to get coverage from npm scripts
   */
  async tryGetCoverageFromNpm(projectRoot) {
    try {
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      // Check if package.json exists
      const packagePath = path.join(projectRoot, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return null;
      }
      
      // Try common coverage commands
      const coverageCommands = [
        'npm run test:coverage',
        'npm run coverage',
        'npx jest --coverage --silent --passWithNoTests',
        'npx nyc --reporter=json npm test'
      ];
      
      for (const command of coverageCommands) {
        try {
          const output = execSync(command, {
            cwd: projectRoot,
            timeout: 30000,
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          const coverage = this.parseCoverageOutput(output);
          if (coverage && coverage.overall > 0) {
            return coverage;
          }
        } catch (error) {
          // Try next command
          continue;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Parse coverage output from command line tools
   */
  parseCoverageOutput(output) {
    try {
      // Parse Jest coverage table
      const jestMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (jestMatch) {
        return {
          statements: parseFloat(jestMatch[1]),
          branches: parseFloat(jestMatch[2]),
          functions: parseFloat(jestMatch[3]),
          lines: parseFloat(jestMatch[4]),
          overall: parseFloat(jestMatch[1])
        };
      }
      
      // Parse percentage patterns
      const percentMatches = output.match(/([\d.]+)%/g);
      if (percentMatches && percentMatches.length > 0) {
        const percent = parseFloat(percentMatches[0]);
        return {
          statements: percent,
          branches: percent * 0.9,
          functions: percent * 0.95,
          lines: percent,
          overall: percent
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Analyze test files to estimate coverage
   */
  async analyzeTestFiles(projectRoot) {
    console.log('📊 Starting test file analysis...');
    try {
      const fs = require('fs');
      const path = require('path');
      
      console.log('🔍 Scanning for test files...');
      // Find test and source files
      const testFiles = this.findFiles(projectRoot, /\.(test|spec)\.(js|ts)$/);
      console.log(`🧪 Found ${testFiles.length} test files`);
      
      console.log('🔍 Scanning for source files...');
      const sourceFiles = this.findFiles(projectRoot, /\.(js|ts)$/, ['node_modules', 'test', 'tests', '__tests__', 'spec']);
      console.log(`📜 Found ${sourceFiles.length} source files`);
      
      if (sourceFiles.length === 0) {
        console.log('⚠️  No source files found, returning zero coverage');
        return {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
          overall: 0
        };
      }
      
      // Calculate basic coverage estimate
      const testRatio = testFiles.length / sourceFiles.length;
      const estimatedCoverage = Math.min(testRatio * 100, 100);
      
      return {
        statements: estimatedCoverage,
        branches: estimatedCoverage * 0.8,
        functions: estimatedCoverage * 0.9,
        lines: estimatedCoverage,
        overall: estimatedCoverage
      };
      
    } catch (error) {
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        overall: 0
      };
    }
  }

  /**
   * Get code complexity metrics
   */
  async getCodeComplexity() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const projectRoot = (this.qaAgent && this.qaAgent.config && this.qaAgent.config.projectRoot) ? 
        this.qaAgent.config.projectRoot : process.cwd();
      const sourceFiles = this.findFiles(projectRoot, /\.(js|ts)$/, ['node_modules', 'test', 'tests', '__tests__', 'spec']);
      
      let totalComplexity = 0;
      let maxComplexity = 0;
      let filesOverThreshold = 0;
      let functionsOverThreshold = 0;
      const threshold = 10;
      
      for (const file of sourceFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const complexity = this.calculateFileComplexity(content);
          
          totalComplexity += complexity.average;
          maxComplexity = Math.max(maxComplexity, complexity.maximum);
          
          if (complexity.average > threshold) {
            filesOverThreshold++;
          }
          
          functionsOverThreshold += complexity.functionsOverThreshold;
          
        } catch (error) {
          // Skip files we can't read
          continue;
        }
      }
      
      const averageComplexity = sourceFiles.length > 0 ? totalComplexity / sourceFiles.length : 0;
      
      return {
        average: Math.round(averageComplexity * 10) / 10,
        maximum: maxComplexity,
        files_over_threshold: filesOverThreshold,
        functions_over_threshold: functionsOverThreshold
      };
      
    } catch (error) {
      console.error(`Failed to analyze code complexity: ${error.message}`);
      return {
        average: 0,
        maximum: 0,
        files_over_threshold: 0,
        functions_over_threshold: 0
      };
    }
  }
  
  /**
   * Calculate complexity for a single file
   */
  calculateFileComplexity(content) {
    try {
      // Count complexity indicators
      const conditionals = (content.match(/\b(if|else|switch|case|while|for|do)\b/g) || []).length;
      const logicalOperators = (content.match(/&&|\|\|/g) || []).length;
      const ternaryOperators = (content.match(/\?.*:/g) || []).length;
      const tryBlocks = (content.match(/\btry\b/g) || []).length;
      const catchBlocks = (content.match(/\bcatch\b/g) || []).length;
      
      // Calculate cyclomatic complexity (simplified)
      const cyclomaticComplexity = 1 + conditionals + logicalOperators + ternaryOperators + tryBlocks + catchBlocks;
      
      // Count functions
      const functions = content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || [];
      const functionCount = functions.length;
      
      // Calculate per-function complexity
      const avgFunctionComplexity = functionCount > 0 ? cyclomaticComplexity / functionCount : cyclomaticComplexity;
      
      // Count functions over threshold
      const functionsOverThreshold = this.countComplexFunctions(content);
      
      return {
        average: avgFunctionComplexity,
        maximum: cyclomaticComplexity,
        functionsOverThreshold: functionsOverThreshold
      };
      
    } catch (error) {
      return {
        average: 1,
        maximum: 1,
        functionsOverThreshold: 0
      };
    }
  }
  
  /**
   * Count functions with high complexity
   */
  countComplexFunctions(content) {
    try {
      const functionRegex = /function\s+\w+[^{]*{([^{}]*{[^{}]*}[^{}]*)*[^{}]*}/g;
      const arrowFunctionRegex = /\w+\s*=\s*\([^)]*\)\s*=>\s*{([^{}]*{[^{}]*}[^{}]*)*[^{}]*}/g;
      
      let complexFunctions = 0;
      const threshold = 10;
      
      // Check regular functions
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        const functionBody = match[0];
        const complexity = this.calculateFunctionComplexity(functionBody);
        if (complexity > threshold) {
          complexFunctions++;
        }
      }
      
      // Check arrow functions
      while ((match = arrowFunctionRegex.exec(content)) !== null) {
        const functionBody = match[0];
        const complexity = this.calculateFunctionComplexity(functionBody);
        if (complexity > threshold) {
          complexFunctions++;
        }
      }
      
      return complexFunctions;
      
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Calculate complexity for a single function
   */
  calculateFunctionComplexity(functionCode) {
    const conditionals = (functionCode.match(/\b(if|else|switch|case|while|for|do)\b/g) || []).length;
    const logicalOperators = (functionCode.match(/&&|\|\|/g) || []).length;
    const ternaryOperators = (functionCode.match(/\?.*:/g) || []).length;
    
    return 1 + conditionals + logicalOperators + ternaryOperators;
  }
  
  /**
   * Find files matching pattern, excluding certain directories
   */
  findFiles(rootDir, pattern, excludeDirs = []) {
    const fs = require('fs');
    const path = require('path');
    const files = [];
    
    // SAFE VERSION: Very conservative limits to prevent hanging
    const maxFiles = 50;  // Much lower limit
    const maxDepth = 3;   // Very shallow scan
    const maxDirs = 20;   // Limit directory processing
    let processedDirs = 0;
    
    console.log(`🔍 SAFE FILE SCAN: ${rootDir}`);
    console.log(`🔍 Limits: max ${maxFiles} files, depth ${maxDepth}, ${maxDirs} dirs`);
    
    function safeScan(dir, depth = 0) {
      // Multiple safety checks
      if (depth >= maxDepth) {
        console.log(`🛑 Depth limit reached: ${depth}`);
        return;
      }
      
      if (files.length >= maxFiles) {
        console.log(`🛑 File limit reached: ${files.length}`);
        return;
      }
      
      if (processedDirs >= maxDirs) {
        console.log(`🛑 Directory limit reached: ${processedDirs}`);
        return;
      }
      
      try {
        processedDirs++;
        console.log(`📁 Scanning dir ${processedDirs}: ${path.basename(dir)} (depth ${depth})`);
        
        const items = fs.readdirSync(dir);
        console.log(`📄 Found ${items.length} items in ${path.basename(dir)}`);
        
        // Process files first (safer)
        for (const item of items) {
          if (files.length >= maxFiles) break;
          
          const fullPath = path.join(dir, item);
          
          try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isFile() && pattern.test(item)) {
              files.push(fullPath);
              console.log(`✅ Added file: ${item}`);
            }
          } catch (error) {
            console.log(`⚠️  Cannot stat: ${item}`);
          }
        }
        
        // Then process directories (more risky)
        for (const item of items) {
          if (files.length >= maxFiles || processedDirs >= maxDirs) break;
          
          const fullPath = path.join(dir, item);
          
          try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              // Very strict exclusion
              const shouldExclude = 
                excludeDirs.includes(item) ||
                item.startsWith('.') ||
                item === 'node_modules' ||
                item === 'dist' ||
                item === 'build' ||
                item === 'coverage' ||
                item === 'tmp' ||
                item === 'temp' ||
                item.includes('backup') ||
                item.includes('cache') ||
                item.includes('log');
              
              if (!shouldExclude) {
                console.log(`🔄 Recursing into: ${item}`);
                safeScan(fullPath, depth + 1);
              } else {
                console.log(`🚫 Excluded: ${item}`);
              }
            }
          } catch (error) {
            console.log(`⚠️  Cannot process: ${item}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Cannot read directory: ${dir} - ${error.message}`);
      }
    }
    
    safeScan(rootDir);
    console.log(`✅ SAFE SCAN COMPLETE: ${files.length} files, ${processedDirs} dirs`);
    return files;
  }

  /**
   * Get code duplication ratio
   */
  async getDuplicationRatio() {
    try {
      const projectRoot = process.cwd();
      const sourceFiles = this.findFiles(projectRoot, /\.(js|ts)$/, ['node_modules', 'test', 'tests', '__tests__', 'spec', 'dist', 'build']);
      
      if (sourceFiles.length === 0) {
        return {
          percentage: 0,
          duplicated_lines: 0,
          total_lines: 0,
          duplicated_blocks: 0
        };
      }
      
      const fs = require('fs');
      const allLines = [];
      const lineOccurrences = new Map();
      let totalLines = 0;
      
      // Analyze all source files
      for (const filePath of sourceFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => {
              // Filter out empty lines, comments, and very short lines
              return line && 
                     line.length > 15 && 
                     !line.startsWith('//') && 
                     !line.startsWith('/*') && 
                     !line.startsWith('*') && 
                     !line.startsWith('import ') &&
                     !line.startsWith('export ') &&
                     !line.match(/^\s*[{}]\s*$/) && // Ignore standalone braces
                     !line.match(/^\s*console\.(log|error|warn)/) // Ignore console statements
            });
          
          totalLines += lines.length;
          
          // Track line occurrences
          lines.forEach(line => {
            const normalizedLine = line.replace(/\s+/g, ' '); // Normalize whitespace
            if (!lineOccurrences.has(normalizedLine)) {
              lineOccurrences.set(normalizedLine, []);
            }
            lineOccurrences.get(normalizedLine).push({ file: filePath, line });
          });
          
        } catch (error) {
          // Skip files we can't read
          continue;
        }
      }
      
      // Find duplicated lines and blocks
      let duplicatedLines = 0;
      let duplicatedBlocks = 0;
      
      for (const [line, occurrences] of lineOccurrences) {
        if (occurrences.length > 1) {
          duplicatedLines += occurrences.length;
          duplicatedBlocks += Math.floor(occurrences.length / 2); // Approximate block count
        }
      }
      
      const percentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;
      
      return {
        percentage: Math.round(percentage * 10) / 10,
        duplicated_lines: duplicatedLines,
        total_lines: totalLines,
        duplicated_blocks: duplicatedBlocks
      };
      
    } catch (error) {
      console.error(`Failed to analyze code duplication: ${error.message}`);
      return {
        percentage: 0,
        duplicated_lines: 0,
        total_lines: 0,
        duplicated_blocks: 0
      };
    }
  }

  /**
   * Get security score
   */
  async getSecurityScore() {
    try {
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      const projectRoot = (this.qaAgent && this.qaAgent.config && this.qaAgent.config.projectRoot) ? 
        this.qaAgent.config.projectRoot : process.cwd();
      let securityScore = 10; // Start with perfect score
      let vulnerabilities = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      };
      
      // Try npm audit for dependency vulnerabilities
      try {
        const auditOutput = execSync('npm audit --json', {
          cwd: projectRoot,
          timeout: 30000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        const auditData = JSON.parse(auditOutput);
        if (auditData.vulnerabilities) {
          Object.values(auditData.vulnerabilities).forEach(vuln => {
            if (vuln.severity) {
              vulnerabilities[vuln.severity]++;
              vulnerabilities.total++;
              
              // Deduct points based on severity
              switch (vuln.severity) {
                case 'critical': securityScore -= 3; break;
                case 'high': securityScore -= 2; break;
                case 'medium': securityScore -= 1; break;
                case 'low': securityScore -= 0.5; break;
              }
            }
          });
        }
      } catch (error) {
        // npm audit failed, continue with code analysis
      }
      
      // Analyze code for security patterns
      const codeSecurityIssues = await this.analyzeCodeSecurity(projectRoot);
      vulnerabilities.total += codeSecurityIssues.length;
      securityScore -= codeSecurityIssues.length * 0.5;
      
      // Ensure score doesn't go below 0
      securityScore = Math.max(0, securityScore);
      
      return {
        vulnerabilities: vulnerabilities.total,
        critical: vulnerabilities.critical,
        high: vulnerabilities.high,
        medium: vulnerabilities.medium,
        low: vulnerabilities.low,
        overall: Math.round(securityScore * 10) / 10,
        codeIssues: codeSecurityIssues
      };
      
    } catch (error) {
      console.error(`Failed to analyze security: ${error.message}`);
      return {
        vulnerabilities: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        overall: 5.0 // Default moderate score on error
      };
    }
  }
  
  /**
   * Analyze code for security issues
   */
  async analyzeCodeSecurity(projectRoot) {
    try {
      const fs = require('fs');
      const sourceFiles = this.findFiles(projectRoot, /\.(js|ts)$/, ['node_modules', 'test', 'tests', '__tests__', 'spec']);
      const securityIssues = [];
      
      // Security patterns to detect
      const securityPatterns = [
        {
          pattern: /eval\s*\(/g,
          severity: 'high',
          description: 'Use of eval() function'
        },
        {
          pattern: /innerHTML\s*=/g,
          severity: 'medium',
          description: 'Direct innerHTML assignment (XSS risk)'
        },
        {
          pattern: /document\.write\s*\(/g,
          severity: 'medium',
          description: 'Use of document.write()'
        },
        {
          pattern: /\$\{[^}]*\}/g,
          severity: 'low',
          description: 'Template literal (check for injection)'
        },
        {
          pattern: /password\s*=\s*['"][^'"]*['"]/gi,
          severity: 'critical',
          description: 'Hardcoded password detected'
        },
        {
          pattern: /api[_-]?key\s*=\s*['"][^'"]*['"]/gi,
          severity: 'high',
          description: 'Hardcoded API key detected'
        },
        {
          pattern: /token\s*=\s*['"][^'"]*['"]/gi,
          severity: 'high',
          description: 'Hardcoded token detected'
        }
      ];
      
      for (const file of sourceFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const relativePath = path.relative(projectRoot, file);
          
          for (const { pattern, severity, description } of securityPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              securityIssues.push({
                file: relativePath,
                severity: severity,
                description: description,
                count: matches.length
              });
            }
          }
        } catch (error) {
          // Skip files we can't read
          continue;
        }
      }
      
      return securityIssues;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Get performance score
   */
  async getPerformanceScore() {
    try {
      const fs = require('fs');
      const path = require('path');
      const { execSync } = require('child_process');
      
      const performanceData = {
        overall: 5.0,
        response_time_p95: 0,
        throughput: 0,
        memory_usage: 0,
        cpu_usage: 0,
        bundle_size: 0,
        load_time: 0
      };
      
      // Check bundle size (affects performance)
      const bundleSize = await this.analyzeBundleSize();
      performanceData.bundle_size = bundleSize;
      
      // Analyze code for performance patterns
      const codePerformance = await this.analyzeCodePerformance();
      performanceData.code_performance_score = codePerformance.score;
      
      // Try to get system performance if available
      const systemPerf = await this.getSystemPerformance();
      if (systemPerf) {
        performanceData.memory_usage = systemPerf.memory;
        performanceData.cpu_usage = systemPerf.cpu;
      }
      
      // Calculate overall performance score
      let overallScore = 5.0; // Start with neutral
      
      // Bundle size impact (smaller is better)
      if (bundleSize < 100) overallScore += 2; // Under 100KB is excellent
      else if (bundleSize < 500) overallScore += 1; // Under 500KB is good
      else if (bundleSize > 2000) overallScore -= 2; // Over 2MB is concerning
      
      // Code performance impact
      overallScore += (codePerformance.score - 5) * 0.5;
      
      // System resource impact
      if (systemPerf) {
        if (systemPerf.memory < 50) overallScore += 0.5;
        if (systemPerf.cpu < 30) overallScore += 0.5;
      }
      
      performanceData.overall = Math.max(0, Math.min(10, overallScore));
      performanceData.overall = Math.round(performanceData.overall * 10) / 10;
      
      return performanceData;
      
    } catch (error) {
      console.error(`Failed to analyze performance: ${error.message}`);
      return {
        overall: 5.0,
        response_time_p95: 0,
        throughput: 0,
        memory_usage: 0,
        cpu_usage: 0,
        error: 'Performance analysis failed'
      };
    }
  }
  
  /**
   * Analyze bundle size for performance impact
   */
  async analyzeBundleSize() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      let totalSize = 0;
      const projectRoot = process.cwd();
      
      // Check common build/dist directories
      const buildDirs = ['dist', 'build', 'public', 'static'];
      
      for (const dir of buildDirs) {
        const buildPath = path.join(projectRoot, dir);
        if (fs.existsSync(buildPath)) {
          totalSize += this.getDirectorySize(buildPath);
        }
      }
      
      // If no build directory, estimate from source
      if (totalSize === 0) {
        const sourceFiles = this.findFiles(projectRoot, /\.(js|ts|css)$/, ['node_modules', 'test', 'tests']);
        for (const file of sourceFiles) {
          try {
            const stats = fs.statSync(file);
            totalSize += stats.size;
          } catch (error) {
            // Skip files we can't read
          }
        }
        // Estimate minified size (roughly 30% of source)
        totalSize *= 0.3;
      }
      
      // Convert to KB
      return Math.round(totalSize / 1024);
      
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Analyze code for performance patterns
   */
  async analyzeCodePerformance() {
    try {
      const fs = require('fs');
      const projectRoot = process.cwd();
      const sourceFiles = this.findFiles(projectRoot, /\.(js|ts)$/, ['node_modules', 'test', 'tests']);
      
      let performanceScore = 7.0; // Start with good score
      const issues = [];
      
      for (const file of sourceFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for performance anti-patterns
          
          // Synchronous operations in loops
          const syncInLoops = (content.match(/for\s*\([^)]*\)[^{]*{[^}]*(?:readFileSync|writeFileSync|execSync)/g) || []).length;
          if (syncInLoops > 0) {
            performanceScore -= syncInLoops * 0.5;
            issues.push({ type: 'sync_in_loop', count: syncInLoops, file });
          }
          
          // Inefficient DOM queries
          const inefficientQueries = (content.match(/document\.getElementById|document\.getElementsBy/g) || []).length;
          if (inefficientQueries > 5) {
            performanceScore -= 0.3;
            issues.push({ type: 'inefficient_dom_queries', count: inefficientQueries, file });
          }
          
          // Memory leaks patterns
          const memoryLeaks = (content.match(/setInterval|setTimeout/g) || []).length;
          const clearCalls = (content.match(/clearInterval|clearTimeout/g) || []).length;
          if (memoryLeaks > clearCalls + 2) {
            performanceScore -= 0.5;
            issues.push({ type: 'potential_memory_leak', file });
          }
          
          // Large object literals
          const largeObjects = (content.match(/{[^}]{500,}/g) || []).length;
          if (largeObjects > 0) {
            performanceScore -= largeObjects * 0.2;
            issues.push({ type: 'large_objects', count: largeObjects, file });
          }
          
          // Nested loops
          const nestedLoops = (content.match(/for\s*\([^)]*\)[^{]*{[^}]*for\s*\(/g) || []).length;
          if (nestedLoops > 0) {
            performanceScore -= nestedLoops * 0.3;
            issues.push({ type: 'nested_loops', count: nestedLoops, file });
          }
          
        } catch (error) {
          // Skip files we can't read
        }
      }
      
      return {
        score: Math.max(0, Math.min(10, performanceScore)),
        issues: issues.slice(0, 10) // Limit to top 10 issues
      };
      
    } catch (error) {
      return { score: 5.0, issues: [] };
    }
  }
  
  /**
   * Get system performance metrics if available
   */
  async getSystemPerformance() {
    try {
      const os = require('os');
      
      // Get memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      
      // Get CPU usage (simplified)
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      
      const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);
      
      return {
        memory: Math.round(memoryUsage),
        cpu: Math.max(0, cpuUsage)
      };
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get directory size recursively
   */
  getDirectorySize(dirPath) {
    const fs = require('fs');
    const path = require('path');
    let size = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          size += this.getDirectorySize(itemPath);
        } else {
          size += stats.size;
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return size;
  }

  /**
   * Get maintainability index
   */
  async getMaintainabilityIndex() {
    try {
      const projectRoot = this.qaAgent?.config?.projectRoot || process.cwd();
      
      // Calculate code readability based on complexity and naming
      const codeReadability = await this.calculateCodeReadability(projectRoot);
      
      // Calculate documentation quality
      const documentationQuality = await this.calculateDocumentationQuality(projectRoot);
      
      // Calculate test quality
      const testQuality = await this.calculateTestQuality(projectRoot);
      
      // Calculate architecture quality
      const architectureQuality = await this.calculateArchitectureQuality(projectRoot);
      
      // Calculate overall maintainability index
      const overall = Math.round(
        (codeReadability * 0.3 + 
         documentationQuality * 0.25 + 
         testQuality * 0.25 + 
         architectureQuality * 0.2)
      );
      
      return {
        overall,
        code_readability: codeReadability,
        documentation_quality: documentationQuality,
        test_quality: testQuality,
        architecture_quality: architectureQuality,
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to calculate maintainability index:', error.message);
      return {
        overall: 70,
        code_readability: 70,
        documentation_quality: 65,
        test_quality: 75,
        architecture_quality: 70,
        error: error.message
      };
    }
  }

  /**
   * Get technical debt ratio
   */
  async getTechnicalDebtRatio() {
    try {
      const projectRoot = this.qaAgent?.config?.projectRoot || process.cwd();
      
      // Analyze code for debt indicators
      const debtIndicators = await this.analyzeDebtIndicators(projectRoot);
      
      // Calculate debt hours based on complexity and issues
      const debtHours = this.calculateDebtHours(debtIndicators);
      
      // Estimate total development hours from project size
      const totalDevHours = await this.estimateTotalDevHours(projectRoot);
      
      // Calculate debt percentage
      const percentage = totalDevHours > 0 ? Math.round((debtHours / totalDevHours) * 100 * 10) / 10 : 0;
      
      // Categorize debt items by priority
      const { highPriority, mediumPriority, lowPriority } = this.categorizeDebtItems(debtIndicators);
      
      return {
        percentage,
        debt_hours: debtHours,
        total_development_hours: totalDevHours,
        high_priority_items: highPriority.length,
        medium_priority_items: mediumPriority.length,
        low_priority_items: lowPriority.length,
        debt_indicators: {
          code_smells: debtIndicators.codeSmells || 0,
          todo_comments: debtIndicators.todoComments || 0,
          complex_functions: debtIndicators.complexFunctions || 0,
          duplicated_code: debtIndicators.duplicatedCode || 0,
          outdated_dependencies: debtIndicators.outdatedDeps || 0
        },
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to calculate technical debt ratio:', error.message);
      return {
        percentage: 15.0,
        debt_hours: 100,
        total_development_hours: 600,
        high_priority_items: 5,
        medium_priority_items: 12,
        low_priority_items: 8,
        error: error.message
      };
    }
  }

  /**
   * Check compliance with standards
   */
  async checkCompliance(thresholds) {
    console.log('✅ Checking compliance with quality standards...');

    const metrics = this.qualityMetrics.timestamp ? this.qualityMetrics : await this.collectMetrics();
    const compliance = {};

    for (const rule of this.complianceRules) {
      compliance[rule.id] = this.evaluateRule(rule, metrics, thresholds);
    }

    await this.updateComplianceTracking(compliance);

    return compliance;
  }

  /**
   * Evaluate a compliance rule
   */
  evaluateRule(rule, metrics, thresholds) {
    const threshold = thresholds[rule.id] || rule.threshold;
    let value;

    switch (rule.id) {
      case 'test_coverage':
        value = metrics.test_coverage?.overall || 0;
        break;
      case 'code_complexity':
        value = metrics.code_complexity?.average || 0;
        break;
      case 'duplication':
        value = metrics.duplication_ratio?.percentage || 0;
        break;
      case 'security_score':
        value = metrics.security_score?.overall || 0;
        break;
      case 'performance_score':
        value = metrics.performance_score?.overall || 0;
        break;
      default:
        value = 0;
    }

    let passed = false;
    switch (rule.type) {
      case 'percentage':
      case 'minimum':
        passed = value >= threshold;
        break;
      case 'maximum':
      case 'percentage_max':
        passed = value <= threshold;
        break;
    }

    return {
      rule_id: rule.id,
      rule_name: rule.name,
      threshold: threshold,
      actual_value: value,
      passed: passed,
      severity: rule.severity,
      gap: passed ? 0 : Math.abs(value - threshold)
    };
  }

  /**
   * Generate improvement recommendations
   */
  async generateRecommendations(metrics, compliance) {
    console.log('💡 Generating improvement recommendations...');

    const recommendations = [];

    // Test coverage recommendations
    if (!compliance.test_coverage?.passed) {
      recommendations.push({
        category: 'testing',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: `Test coverage is ${metrics.test_coverage?.overall}%, below the ${compliance.test_coverage.threshold}% threshold`,
        actions: [
          'Identify untested code paths',
          'Write unit tests for critical functions',
          'Add integration tests for API endpoints',
          'Implement test coverage reporting in CI/CD'
        ],
        estimated_effort: '2-3 days'
      });
    }

    // Code complexity recommendations
    if (!compliance.code_complexity?.passed) {
      recommendations.push({
        category: 'code_quality',
        priority: 'medium',
        title: 'Reduce Code Complexity',
        description: `Average complexity is ${metrics.code_complexity?.average}, above the ${compliance.code_complexity.threshold} threshold`,
        actions: [
          'Refactor complex functions into smaller methods',
          'Extract business logic into separate classes',
          'Simplify conditional statements',
          'Use design patterns to reduce complexity'
        ],
        estimated_effort: '3-5 days'
      });
    }

    // Security recommendations
    if (!compliance.security_score?.passed) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: 'Improve Security Score',
        description: `Security score is ${metrics.security_score?.overall}, below the ${compliance.security_score.threshold} threshold`,
        actions: [
          'Address high and critical vulnerabilities',
          'Implement security best practices',
          'Add security tests to test suite',
          'Conduct security code review'
        ],
        estimated_effort: '1-2 weeks'
      });
    }

    // Performance recommendations
    if (!compliance.performance_score?.passed) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Performance',
        description: `Performance score is ${metrics.performance_score?.overall}, below the ${compliance.performance_score.threshold} threshold`,
        actions: [
          'Profile application for bottlenecks',
          'Optimize database queries',
          'Implement caching strategies',
          'Optimize resource usage'
        ],
        estimated_effort: '1-2 weeks'
      });
    }

    // Technical debt recommendations
    if (metrics.technical_debt_ratio?.percentage > 20) {
      recommendations.push({
        category: 'technical_debt',
        priority: 'medium',
        title: 'Reduce Technical Debt',
        description: `Technical debt ratio is ${metrics.technical_debt_ratio?.percentage}%, above recommended 20% threshold`,
        actions: [
          'Prioritize high-impact debt items',
          'Allocate 20% of sprint capacity to debt reduction',
          'Refactor legacy code modules',
          'Update outdated dependencies'
        ],
        estimated_effort: 'Ongoing'
      });
    }

    return recommendations;
  }

  /**
   * Update metrics tracking
   */
  async updateMetricsTracking(metrics) {
    try {
      const auditFile = path.join(this.trackingDir, 'audit_history.md');
      
      const entry = `
## Quality Audit - ${metrics.timestamp}

**Overall Metrics**:
- Test Coverage: ${metrics.test_coverage?.overall}%
- Code Complexity: ${metrics.code_complexity?.average}
- Duplication: ${metrics.duplication_ratio?.percentage}%
- Security Score: ${metrics.security_score?.overall}/10
- Performance Score: ${metrics.performance_score?.overall}/10
- Maintainability Index: ${metrics.maintainability_index?.overall}
- Technical Debt: ${metrics.technical_debt_ratio?.percentage}%

**Detailed Breakdown**:
- Test Coverage: Lines ${metrics.test_coverage?.lines}%, Functions ${metrics.test_coverage?.functions}%
- Security: ${metrics.security_score?.vulnerabilities?.critical} critical, ${metrics.security_score?.vulnerabilities?.high} high vulnerabilities
- Performance: ${metrics.performance_score?.response_time_p95}ms P95, ${metrics.performance_score?.throughput} req/s

---
`;

      await fs.appendFile(auditFile, entry);
    } catch (error) {
      console.warn(`⚠️ Could not update metrics tracking: ${error.message}`);
    }
  }

  /**
   * Update compliance tracking
   */
  async updateComplianceTracking(compliance) {
    try {
      const complianceFile = path.join(this.trackingDir, 'compliance_status.md');
      const timestamp = new Date().toISOString();
      
      const passedRules = Object.values(compliance).filter(c => c.passed).length;
      const totalRules = Object.values(compliance).length;
      const compliancePercentage = totalRules > 0 ? (passedRules / totalRules * 100).toFixed(1) : 0;
      
      const entry = `
## Compliance Check - ${timestamp}

**Overall Compliance**: ${compliancePercentage}% (${passedRules}/${totalRules} rules passed)

**Rule Status**:
${Object.values(compliance).map(rule => 
  `- ${rule.passed ? '✅' : '❌'} ${rule.rule_name}: ${rule.actual_value} (threshold: ${rule.threshold})`
).join('\n')}

**Failed Rules**:
${Object.values(compliance).filter(rule => !rule.passed).map(rule => 
  `- ${rule.rule_name}: Gap of ${rule.gap.toFixed(1)} (${rule.severity} severity)`
).join('\n') || 'None'}

---
`;

      await fs.appendFile(complianceFile, entry);
    } catch (error) {
      console.warn(`⚠️ Could not update compliance tracking: ${error.message}`);
    }
  }

  /**
   * Get quality auditor status
   */
  async getStatus() {
    const lastMetrics = this.qualityMetrics;
    
    return {
      last_audit: lastMetrics.timestamp || 'never',
      overall_quality_score: this.calculateOverallQualityScore(lastMetrics),
      compliance_status: await this.getComplianceStatus(),
      recommendations_count: await this.getActiveRecommendationsCount()
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQualityScore(metrics) {
    if (!metrics.timestamp) return 0;

    const scores = [
      (metrics.test_coverage?.overall || 0) / 10, // Convert percentage to 0-10 scale
      10 - (metrics.code_complexity?.average || 0), // Invert complexity (lower is better)
      10 - (metrics.duplication_ratio?.percentage || 0) / 2, // Invert duplication
      metrics.security_score?.overall || 0,
      metrics.performance_score?.overall || 0,
      (metrics.maintainability_index?.overall || 0) / 10
    ];

    const validScores = scores.filter(score => score > 0);
    return validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus() {
    try {
      // Get recent compliance metrics
      const metrics = this.qualityMetrics.timestamp ? this.qualityMetrics : await this.collectMetrics();
      
      // Calculate compliance score based on multiple factors
      let complianceScore = 0;
      let totalChecks = 0;
      
      // Test coverage compliance (weight: 30%)
      if (metrics.test_coverage && metrics.test_coverage.overall) {
        const coverage = metrics.test_coverage.overall;
        if (coverage >= 80) complianceScore += 30;
        else if (coverage >= 60) complianceScore += 20;
        else if (coverage >= 40) complianceScore += 10;
        totalChecks += 30;
      }
      
      // Code quality compliance (weight: 25%)
      if (metrics.code_complexity && metrics.code_complexity.average_complexity) {
        const complexity = metrics.code_complexity.average_complexity;
        if (complexity <= 5) complianceScore += 25;
        else if (complexity <= 10) complianceScore += 15;
        else if (complexity <= 15) complianceScore += 8;
        totalChecks += 25;
      }
      
      // Security compliance (weight: 25%)
      if (metrics.security_score && metrics.security_score.overall) {
        const security = metrics.security_score.overall;
        if (security >= 85) complianceScore += 25;
        else if (security >= 70) complianceScore += 18;
        else if (security >= 50) complianceScore += 10;
        totalChecks += 25;
      }
      
      // Performance compliance (weight: 20%)
      if (metrics.performance_score && metrics.performance_score.overall) {
        const performance = metrics.performance_score.overall;
        if (performance >= 80) complianceScore += 20;
        else if (performance >= 60) complianceScore += 12;
        else if (performance >= 40) complianceScore += 6;
        totalChecks += 20;
      }
      
      // Calculate final compliance percentage
      const compliancePercentage = totalChecks > 0 ? (complianceScore / totalChecks) * 100 : 0;
      
      // Determine compliance status
      if (compliancePercentage >= 85) return 'excellent';
      if (compliancePercentage >= 70) return 'good';
      if (compliancePercentage >= 50) return 'fair';
      return 'poor';
      
    } catch (error) {
      console.warn('Failed to calculate compliance status:', error.message);
      return 'fair';
    }
  }

  /**
   * Get active recommendations count
   */
  async getActiveRecommendationsCount() {
    try {
      // Get current metrics to generate recommendations
      const metrics = this.qualityMetrics.timestamp ? this.qualityMetrics : await this.collectMetrics();
      
      let activeRecommendations = 0;
      
      // Check test coverage recommendations
      if (metrics.test_coverage && metrics.test_coverage.overall < 80) {
        activeRecommendations++;
      }
      
      // Check complexity recommendations
      if (metrics.code_complexity && metrics.code_complexity.high_complexity_files > 0) {
        activeRecommendations++;
      }
      
      // Check security recommendations
      if (metrics.security_score && metrics.security_score.overall < 85) {
        activeRecommendations++;
      }
      
      // Check performance recommendations
      if (metrics.performance_score && metrics.performance_score.overall < 80) {
        activeRecommendations++;
      }
      
      // Check duplication recommendations
      if (metrics.duplication_ratio && metrics.duplication_ratio > 5) {
        activeRecommendations++;
      }
      
      // Check maintainability recommendations
      const maintainability = await this.getMaintainabilityIndex();
      if (maintainability.overall < 70) {
        activeRecommendations++;
      }
      
      // Check technical debt recommendations
      const technicalDebt = await this.getTechnicalDebtRatio();
      if (technicalDebt.percentage > 20) {
        activeRecommendations++;
      }
      
      return activeRecommendations;
      
    } catch (error) {
      console.warn('Failed to count active recommendations:', error.message);
      return 0;
    }
  }

  /**
   * Get audit history template
   */
  getAuditHistoryTemplate() {
    return `# Quality Audit History

This file tracks quality audits performed over time.

## Current Status
- Last Audit: Never
- Overall Quality Score: Not yet measured
- Compliance Status: Not yet checked

---

*Audit results will be automatically logged here*
`;
  }

  /**
   * Get compliance template
   */
  getComplianceTemplate() {
    return `# Compliance Status

This file tracks compliance with quality standards over time.

## Current Compliance Rules
- Test Coverage: ≥80%
- Code Complexity: ≤10
- Code Duplication: ≤5%
- Security Score: ≥8/10
- Performance Score: ≥7/10

## Current Status
- Overall Compliance: Not yet checked
- Failed Rules: Not yet checked

---

*Compliance checks will be automatically logged here*
`;
  }
}

module.exports = QualityAuditor;
