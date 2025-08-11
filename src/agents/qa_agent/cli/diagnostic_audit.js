#!/usr/bin/env node
/**
 * Diagnostic QA Agent Audit Tool
 * 
 * Tests each analysis method individually to find what's causing hangs
 */

const path = require('path');

async function diagnosticAudit() {
  console.log('🔬 QA Agent - Diagnostic Audit Tool');
  console.log('===================================');
  
  try {
    // Import the QA Agent modules
    const QualityAuditor = require('../modules/quality_auditor');
    
    console.log('✅ Successfully imported QualityAuditor');
    
    // Create a mock QA Agent for testing
    const mockQAAgent = {
      config: {
        projectRoot: process.cwd()
      }
    };
    
    console.log('✅ Created mock QA Agent');
    
    // Initialize the Quality Auditor
    const auditor = new QualityAuditor(mockQAAgent);
    console.log('✅ Initialized Quality Auditor');
    
    // Test each method individually with timeouts
    const methods = [
      'getTestCoverage',
      'getCodeComplexity', 
      'getDuplicationRatio',
      'getSecurityScore',
      'getPerformanceScore',
      'getMaintainabilityIndex',
      'getTechnicalDebtRatio'
    ];
    
    for (const methodName of methods) {
      console.log(`\n🧪 Testing ${methodName}...`);
      
      try {
        // Set a timeout for each method
        const result = await Promise.race([
          auditor[methodName](),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Method timeout')), 10000)
          )
        ]);
        
        console.log(`✅ ${methodName} completed:`, JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.log(`❌ ${methodName} failed:`, error.message);
        
        if (error.message === 'Method timeout') {
          console.log(`⚠️  ${methodName} is hanging - this is the problem method!`);
          break; // Stop testing if we find the hanging method
        }
      }
    }
    
    console.log('\n🔬 Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the diagnostic
diagnosticAudit();
