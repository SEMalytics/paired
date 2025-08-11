#!/usr/bin/env node
/**
 * Safe QA Agent Audit Tool - No file scanning, just basic checks
 * 
 * This version avoids all problematic file scanning methods
 */

const fs = require('fs');
const path = require('path');

async function safeAudit() {
  console.log('🛡️  QA Agent - Safe Audit Tool');
  console.log('==============================');
  
  try {
    const projectRoot = process.cwd();
    console.log(`📁 Project root: ${projectRoot}`);
    
    // Safe, direct checks without recursive scanning
    console.log('\n🔍 Safe analysis (no recursive scanning)...');
    
    const results = {
      timestamp: new Date().toISOString(),
      project_root: projectRoot,
      package_json_exists: false,
      src_directory_exists: false,
      test_directory_exists: false,
      node_modules_exists: false,
      git_directory_exists: false
    };
    
    // Check for key files/directories directly
    console.log('📋 Checking project structure...');
    
    try {
      if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
        results.package_json_exists = true;
        console.log('✅ package.json found');
        
        // Read package.json safely
        const packageContent = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8');
        const packageData = JSON.parse(packageContent);
        results.project_name = packageData.name || 'unknown';
        results.has_scripts = !!packageData.scripts;
        results.has_dependencies = !!packageData.dependencies;
        results.has_dev_dependencies = !!packageData.devDependencies;
        
        console.log(`📦 Project: ${results.project_name}`);
        console.log(`🔧 Has scripts: ${results.has_scripts}`);
        console.log(`📚 Has dependencies: ${results.has_dependencies}`);
        console.log(`🛠️  Has dev dependencies: ${results.has_dev_dependencies}`);
      } else {
        console.log('❌ No package.json found');
      }
    } catch (error) {
      console.log('⚠️  Could not read package.json');
    }
    
    // Check directories directly (no recursion)
    const dirsToCheck = ['src', 'test', 'tests', '__tests__', 'spec', 'node_modules', '.git'];
    
    for (const dir of dirsToCheck) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        results[`${dir.replace(/[^a-zA-Z0-9]/g, '_')}_directory_exists`] = true;
        console.log(`✅ ${dir}/ directory found`);
      }
    }
    
    // Count files in current directory only (no recursion)
    console.log('\n📊 Current directory file count...');
    try {
      const items = fs.readdirSync(projectRoot);
      let jsFiles = 0;
      let configFiles = 0;
      let markdownFiles = 0;
      
      for (const item of items) {
        if (item.endsWith('.js') || item.endsWith('.ts')) jsFiles++;
        if (item.includes('config') || item.endsWith('.json') || item.endsWith('.yml') || item.endsWith('.yaml')) configFiles++;
        if (item.endsWith('.md')) markdownFiles++;
      }
      
      results.root_js_files = jsFiles;
      results.root_config_files = configFiles;
      results.root_markdown_files = markdownFiles;
      
      console.log(`📄 JS/TS files in root: ${jsFiles}`);
      console.log(`⚙️  Config files in root: ${configFiles}`);
      console.log(`📝 Markdown files in root: ${markdownFiles}`);
      
    } catch (error) {
      console.log('⚠️  Could not read current directory');
    }
    
    // Generate simple recommendations
    console.log('\n💡 SAFE RECOMMENDATIONS');
    console.log('=======================');
    
    if (!results.package_json_exists) {
      console.log('❌ No package.json - Consider initializing with npm init');
    }
    
    if (!results.src_directory_exists) {
      console.log('❌ No src/ directory - Consider organizing code in src/');
    }
    
    if (!results.test_directory_exists && !results.tests_directory_exists && !results.__tests___directory_exists) {
      console.log('❌ No test directory found - Consider adding tests');
    }
    
    if (results.package_json_exists && !results.has_scripts) {
      console.log('⚠️  No npm scripts defined - Consider adding build/test scripts');
    }
    
    if (results.root_js_files > 5) {
      console.log('⚠️  Many JS files in root - Consider organizing in subdirectories');
    }
    
    console.log('\n✅ Safe audit complete!');
    console.log('📊 Results:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ Safe audit failed:', error.message);
    process.exit(1);
  }
}

// Run the safe audit
safeAudit();
