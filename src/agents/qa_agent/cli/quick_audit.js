#!/usr/bin/env node
/**
 * Quick QA Agent Audit Tool - Lightweight version
 * 
 * Provides fast, basic quality metrics without hanging
 */

const fs = require('fs');
const path = require('path');

async function quickAudit() {
  console.log('🧪 QA Agent - Quick Audit Tool');
  console.log('==============================');
  
  try {
    const projectRoot = process.cwd();
    console.log(`📁 Project root: ${projectRoot}`);
    
    // Quick file count analysis
    console.log('\n🔍 Quick file analysis...');
    const stats = await getQuickStats(projectRoot);
    
    console.log('\n📊 QUICK METRICS');
    console.log('================');
    console.log(`JavaScript files: ${stats.jsFiles}`);
    console.log(`Test files: ${stats.testFiles}`);
    console.log(`Total lines of code: ~${stats.totalLines}`);
    console.log(`Test coverage estimate: ${stats.testCoverageEstimate}%`);
    console.log(`Code quality score: ${stats.qualityScore}/10`);
    
    console.log('\n💡 QUICK RECOMMENDATIONS');
    console.log('========================');
    
    if (stats.testCoverageEstimate < 50) {
      console.log('❌ Low test coverage - Consider adding more tests');
    } else {
      console.log('✅ Test coverage looks reasonable');
    }
    
    if (stats.jsFiles > 100) {
      console.log('⚠️  Large codebase - Consider code organization review');
    }
    
    if (stats.qualityScore < 7) {
      console.log('❌ Code quality could be improved');
    } else {
      console.log('✅ Code quality looks good');
    }
    
    console.log('\n✅ Quick audit complete!');
    console.log('💡 For detailed analysis, use: node src/agents/qa_agent/cli/audit.js');
    
  } catch (error) {
    console.error('❌ Quick audit failed:', error.message);
    process.exit(1);
  }
}

async function getQuickStats(projectRoot) {
  const stats = {
    jsFiles: 0,
    testFiles: 0,
    totalLines: 0,
    testCoverageEstimate: 0,
    qualityScore: 7
  };
  
  // Quick scan with strict limits
  const maxFiles = 50; // Very limited scan
  const maxDepth = 3;   // Shallow scan
  
  function quickScan(dir, depth = 0) {
    if (depth > maxDepth || stats.jsFiles >= maxFiles) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (stats.jsFiles >= maxFiles) break;
        
        // Skip common directories that cause issues
        if (item === 'node_modules' || 
            item === '.git' || 
            item.startsWith('.') ||
            item.includes('backup') ||
            item === 'dist' ||
            item === 'build') {
          continue;
        }
        
        const fullPath = path.join(dir, item);
        let stat;
        
        try {
          stat = fs.statSync(fullPath);
        } catch (error) {
          continue;
        }
        
        if (stat.isDirectory()) {
          quickScan(fullPath, depth + 1);
        } else if (stat.isFile() && /\.(js|ts)$/.test(item)) {
          stats.jsFiles++;
          
          if (/\.(test|spec)\.(js|ts)$/.test(item)) {
            stats.testFiles++;
          }
          
          // Quick line count estimate
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            stats.totalLines += content.split('\n').length;
          } catch (error) {
            // Skip files we can't read
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  quickScan(projectRoot);
  
  // Calculate estimates
  if (stats.jsFiles > 0) {
    stats.testCoverageEstimate = Math.round((stats.testFiles / stats.jsFiles) * 100);
  }
  
  // Simple quality score based on test ratio and file organization
  if (stats.testCoverageEstimate > 80) stats.qualityScore = 9;
  else if (stats.testCoverageEstimate > 60) stats.qualityScore = 8;
  else if (stats.testCoverageEstimate > 40) stats.qualityScore = 7;
  else if (stats.testCoverageEstimate > 20) stats.qualityScore = 6;
  else stats.qualityScore = 5;
  
  return stats;
}

// Run the quick audit
quickAudit();
