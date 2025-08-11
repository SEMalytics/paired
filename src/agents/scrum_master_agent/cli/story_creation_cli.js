#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Story Creation CLI Tool
 * 
 * Creates user stories from sharded PRD/architecture documents,
 * validates against INVEST criteria, and generates dev-ready stories.
 */
class StoryCreationCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.agentDir = path.join(this.projectRoot, '.wee', 'agents', 'scrum_master');
    this.storiesDir = path.join(this.agentDir, 'stories');
    this.templatesDir = path.join(this.agentDir, 'templates');
    this.trackingDir = path.join(this.agentDir, 'tracking');
    
    this.storyCounter = 0;
  }

  /**
   * Run story creation
   */
  async run(options = {}) {
    try {
      console.log('📝 Starting Story Creation from Shards...\n');
      
      // Initialize directories
      await this.initializeDirectories();
      
      // Load existing stories to get counter
      await this.loadExistingStories();
      
      // Get epic reference
      const epicReference = options.epic || await this.promptForEpic();
      if (!epicReference) {
        console.log('❌ Epic reference is required');
        return;
      }
      
      // Load relevant shards
      console.log(`🔍 Loading shards for epic: ${epicReference}`);
      const shards = await this.loadRelevantShards(epicReference);
      
      if (shards.length === 0) {
        console.log(`❌ No shards found for epic: ${epicReference}`);
        console.log('💡 Make sure PRD or architecture documents exist in docs/ directory');
        return;
      }
      
      console.log(`✅ Found ${shards.length} relevant shard(s)`);
      
      // Analyze shards and create story
      const story = await this.createStoryFromShards(shards, epicReference, options);
      
      // Display results
      await this.displayStoryResults(story, options);
      
    } catch (error) {
      console.error(`❌ Story creation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Initialize required directories
   */
  async initializeDirectories() {
    const dirs = [this.agentDir, this.storiesDir, this.templatesDir, this.trackingDir];
    
    for (const dir of dirs) {
      await this.ensureDirectoryExists(dir);
    }
    
    // Create default story template if it doesn't exist
    await this.ensureStoryTemplate();
  }

  /**
   * Ensure story template exists
   */
  async ensureStoryTemplate() {
    const templatePath = path.join(this.templatesDir, 'story_template.md');
    
    if (!await this.fileExists(templatePath)) {
      const defaultTemplate = `# User Story: {STORY_TITLE}

## Story ID
**ID:** {STORY_ID}
**Epic:** {EPIC_REFERENCE}
**Sprint:** {SPRINT_NUMBER}

## User Story
**As a** {USER_ROLE}
**I want** {USER_GOAL}
**So that** {USER_BENEFIT}

## Acceptance Criteria
{ACCEPTANCE_CRITERIA}

## Technical Details
### Implementation Notes
{IMPLEMENTATION_NOTES}

### Dependencies
{DEPENDENCIES}

### Definition of Done
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Accessibility requirements met
- [ ] Performance requirements met
- [ ] Security review completed (if applicable)

## Estimation
**Story Points:** {STORY_POINTS}
**Complexity:** {COMPLEXITY}
**Risk Level:** {RISK_LEVEL}

## Context from Shards
{SHARD_CONTEXT}

## Additional Notes
{ADDITIONAL_NOTES}

---
**Created:** {CREATED_DATE}
**Created By:** Vince (Scrum)
**Status:** {STATUS}
`;
      
      await fs.writeFile(templatePath, defaultTemplate, 'utf8');
    }
  }

  /**
   * Load existing stories to determine counter
   */
  async loadExistingStories() {
    try {
      const storyFiles = await fs.readdir(this.storiesDir);
      const storyNumbers = storyFiles
        .filter(f => f.match(/^story-\d+\.md$/))
        .map(f => parseInt(f.match(/\d+/)[0]))
        .filter(n => !isNaN(n));
      
      this.storyCounter = storyNumbers.length > 0 ? Math.max(...storyNumbers) : 0;
    } catch (error) {
      this.storyCounter = 0;
    }
  }

  /**
   * Prompt for epic reference if not provided
   */
  async promptForEpic() {
    // In a real CLI, this would use readline or similar for user input
    // For now, we'll look for available epics in the docs directory
    const availableEpics = await this.findAvailableEpics();
    
    if (availableEpics.length > 0) {
      console.log('📋 Available epics found:');
      availableEpics.forEach((epic, index) => {
        console.log(`   ${index + 1}. ${epic}`);
      });
      
      // For demo purposes, return the first epic
      return availableEpics[0];
    }
    
    return null;
  }

  /**
   * Find available epics in docs directory
   */
  async findAvailableEpics() {
    const epics = [];
    
    try {
      // Check PRD directory
      const prdDir = path.join(this.projectRoot, 'docs', 'prd');
      if (await this.fileExists(prdDir)) {
        const prdFiles = await fs.readdir(prdDir);
        for (const file of prdFiles) {
          if (file.includes('epic') || file.includes('Epic')) {
            epics.push(file.replace(/\.(md|txt)$/, ''));
          }
        }
      }
      
      // Check for generic epic references
      if (epics.length === 0) {
        epics.push('user-authentication', 'dashboard-implementation', 'api-integration');
      }
    } catch (error) {
      // Return default epics if no docs found
      epics.push('user-authentication', 'dashboard-implementation', 'api-integration');
    }
    
    return epics;
  }

  /**
   * Load relevant shards for epic
   */
  async loadRelevantShards(epicReference) {
    const shards = [];
    
    try {
      // Look for PRD shards
      const prdDir = path.join(this.projectRoot, 'docs', 'prd');
      if (await this.fileExists(prdDir)) {
        const prdFiles = await fs.readdir(prdDir);
        
        for (const file of prdFiles.filter(f => f.includes(epicReference) || f.includes('epic') || f.endsWith('.md'))) {
          const filePath = path.join(prdDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          shards.push({
            type: 'prd',
            file: file,
            path: filePath,
            content: content,
            relevance: this.calculateRelevance(content, epicReference)
          });
        }
      }
      
      // Look for architecture shards
      const archDir = path.join(this.projectRoot, 'docs', 'architecture');
      if (await this.fileExists(archDir)) {
        const archFiles = await fs.readdir(archDir);
        
        for (const file of archFiles.filter(f => f.includes(epicReference) || f.includes('design') || f.endsWith('.md'))) {
          const filePath = path.join(archDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          shards.push({
            type: 'architecture',
            file: file,
            path: filePath,
            content: content,
            relevance: this.calculateRelevance(content, epicReference)
          });
        }
      }
      
      // If no real shards found, create sample content
      if (shards.length === 0) {
        shards.push(this.createSampleShard(epicReference));
      }
      
      // Sort by relevance
      shards.sort((a, b) => b.relevance - a.relevance);
      
      return shards;
    } catch (error) {
      console.warn(`⚠️ Error loading shards: ${error.message}`);
      return [this.createSampleShard(epicReference)];
    }
  }

  /**
   * Create sample shard for demo purposes
   */
  createSampleShard(epicReference) {
    const sampleContent = `# ${epicReference.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Epic

## User Story
As a user
I want to ${epicReference.replace(/-/g, ' ')}
So that I can have a better experience with the application

## Acceptance Criteria
- User can access the ${epicReference.replace(/-/g, ' ')} functionality
- System responds within 2 seconds
- Error handling is implemented
- User feedback is provided for all actions

## Implementation Notes
- Use modern web technologies
- Follow accessibility guidelines
- Implement proper error handling
- Add comprehensive logging

## Dependencies
- Database schema updates may be required
- API endpoints need to be created
- Frontend components need development
`;
    
    return {
      type: 'sample',
      file: `${epicReference}-sample.md`,
      content: sampleContent,
      relevance: 1.0
    };
  }

  /**
   * Calculate relevance score for content
   */
  calculateRelevance(content, epicReference) {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerEpic = epicReference.toLowerCase();
    
    // Direct epic reference
    if (lowerContent.includes(lowerEpic)) score += 0.5;
    
    // Keywords related to user stories
    const storyKeywords = ['user story', 'acceptance criteria', 'as a user', 'i want', 'so that'];
    for (const keyword of storyKeywords) {
      if (lowerContent.includes(keyword)) score += 0.1;
    }
    
    // Technical implementation keywords
    const techKeywords = ['implementation', 'api', 'database', 'frontend', 'backend'];
    for (const keyword of techKeywords) {
      if (lowerContent.includes(keyword)) score += 0.05;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Create story from shards
   */
  async createStoryFromShards(shards, epicReference, options) {
    console.log('\n🔍 Analyzing shards...');
    
    // Analyze shards to extract story context
    const context = await this.analyzeShards(shards);
    
    // Generate story
    this.storyCounter++;
    const storyId = `STORY-${this.storyCounter.toString().padStart(3, '0')}`;
    
    const story = {
      id: storyId,
      title: this.generateStoryTitle(context),
      epic_reference: epicReference,
      priority: options.priority || 'medium',
      status: 'todo',
      created_date: new Date().toISOString(),
      ...context
    };
    
    // Validate against INVEST criteria
    console.log('✅ Validating against INVEST criteria...');
    const validation = this.validateINVEST(story);
    
    // Fill template and create story content
    const storyContent = await this.generateStoryContent(story, validation);
    
    // Save story
    const storyPath = await this.saveStory(story, storyContent);
    
    // Update tracking
    await this.updateStoryTracking(story);
    
    return {
      ...story,
      story_path: storyPath,
      validation: validation,
      shards_analyzed: shards.length
    };
  }

  /**
   * Analyze shards to determine story context
   */
  async analyzeShards(shards) {
    const context = {
      user_role: 'user',
      user_goal: '',
      user_benefit: '',
      acceptance_criteria: [],
      implementation_notes: [],
      dependencies: [],
      complexity: 'medium',
      story_points: 3,
      risk_level: 'low'
    };
    
    for (const shard of shards) {
      console.log(`   📄 Analyzing ${shard.file} (${shard.type})`);
      
      // Extract user stories
      const userStories = this.extractUserStories(shard.content);
      if (userStories.length > 0) {
        const story = userStories[0];
        context.user_role = story.role || context.user_role;
        context.user_goal = story.goal || context.user_goal;
        context.user_benefit = story.benefit || context.user_benefit;
      }
      
      // Extract acceptance criteria
      const criteria = this.extractAcceptanceCriteria(shard.content);
      context.acceptance_criteria.push(...criteria);
      
      // Extract implementation notes
      const implNotes = this.extractImplementationNotes(shard.content);
      context.implementation_notes.push(...implNotes);
      
      // Extract dependencies
      const deps = this.extractDependencies(shard.content);
      context.dependencies.push(...deps);
    }
    
    // Determine complexity and points based on analysis
    context.complexity = this.determineComplexity(context);
    context.story_points = this.estimateStoryPoints(context);
    context.risk_level = this.assessRiskLevel(context);
    
    return context;
  }

  /**
   * Extract user stories from content
   */
  extractUserStories(content) {
    const stories = [];
    const lines = content.split('\n');
    
    let currentStory = null;
    
    for (const line of lines) {
      // Look for "As a" pattern
      const asMatch = line.match(/(?:^|\s)(?:As a|As an)\s+(.+?)(?:,|\s+I\s+want)/i);
      if (asMatch) {
        if (currentStory) stories.push(currentStory);
        currentStory = { role: asMatch[1].trim() };
      }
      
      // Look for "I want" pattern
      const wantMatch = line.match(/I\s+want\s+(.+?)(?:,|\s+so\s+that)/i);
      if (wantMatch && currentStory) {
        currentStory.goal = wantMatch[1].trim();
      }
      
      // Look for "So that" pattern
      const soMatch = line.match(/(?:so\s+that|in\s+order\s+to)\s+(.+)/i);
      if (soMatch && currentStory) {
        currentStory.benefit = soMatch[1].trim();
      }
    }
    
    if (currentStory) stories.push(currentStory);
    
    return stories.filter(s => s.role && s.goal);
  }

  /**
   * Extract acceptance criteria from content
   */
  extractAcceptanceCriteria(content) {
    const criteria = [];
    const lines = content.split('\n');
    
    let inCriteriaSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('acceptance criteria')) {
        inCriteriaSection = true;
        continue;
      }
      
      if (inCriteriaSection) {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          criteria.push(line.trim().substring(1).trim());
        } else if (line.trim() === '' || line.startsWith('#')) {
          inCriteriaSection = false;
        }
      }
    }
    
    return criteria;
  }

  /**
   * Extract implementation notes from content
   */
  extractImplementationNotes(content) {
    const notes = [];
    const lines = content.split('\n');
    
    let inImplementationSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('implementation') || line.toLowerCase().includes('technical')) {
        inImplementationSection = true;
        continue;
      }
      
      if (inImplementationSection) {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          notes.push(line.trim().substring(1).trim());
        } else if (line.trim() === '' || line.startsWith('#')) {
          inImplementationSection = false;
        }
      }
    }
    
    return notes;
  }

  /**
   * Extract dependencies from content
   */
  extractDependencies(content) {
    const dependencies = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('depends on') || line.toLowerCase().includes('requires')) {
        dependencies.push(line.trim());
      }
    }
    
    return dependencies;
  }

  /**
   * Determine story complexity
   */
  determineComplexity(context) {
    let complexityScore = 0;
    
    complexityScore += Math.min(context.acceptance_criteria.length, 5);
    complexityScore += Math.min(context.implementation_notes.length, 3);
    complexityScore += context.dependencies.length * 2;
    
    if (complexityScore <= 3) return 'low';
    if (complexityScore <= 7) return 'medium';
    return 'high';
  }

  /**
   * Estimate story points
   */
  estimateStoryPoints(context) {
    const complexity = context.complexity;
    const criteriaCount = context.acceptance_criteria.length;
    const dependencyCount = context.dependencies.length;
    
    let points = 1;
    
    if (complexity === 'low') points = Math.min(3, 1 + criteriaCount);
    else if (complexity === 'medium') points = Math.min(8, 3 + criteriaCount + dependencyCount);
    else points = Math.min(13, 5 + criteriaCount + dependencyCount * 2);
    
    return points;
  }

  /**
   * Assess risk level
   */
  assessRiskLevel(context) {
    let riskScore = 0;
    
    if (context.dependencies.length > 2) riskScore += 2;
    if (context.complexity === 'high') riskScore += 2;
    if (context.acceptance_criteria.length > 5) riskScore += 1;
    
    if (riskScore <= 1) return 'low';
    if (riskScore <= 3) return 'medium';
    return 'high';
  }

  /**
   * Generate story title from context
   */
  generateStoryTitle(context) {
    if (context.user_goal) {
      let title = context.user_goal;
      title = title.replace(/^(to |be able to |have |see |view |create |update |delete )/i, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      
      return title;
    }
    
    return `User Story ${this.storyCounter}`;
  }

  /**
   * Validate story against INVEST criteria
   */
  validateINVEST(story) {
    const validation = {
      isValid: true,
      warnings: [],
      scores: {}
    };
    
    // Independent
    if (story.dependencies.length > 3) {
      validation.warnings.push('Story has many dependencies - consider breaking down');
      validation.scores.independent = 2;
    } else {
      validation.scores.independent = 5;
    }
    
    // Negotiable
    if (story.acceptance_criteria.length === 0) {
      validation.warnings.push('No acceptance criteria - story may not be negotiable');
      validation.scores.negotiable = 2;
    } else {
      validation.scores.negotiable = 5;
    }
    
    // Valuable
    if (!story.user_benefit) {
      validation.warnings.push('No clear user benefit defined');
      validation.scores.valuable = 2;
    } else {
      validation.scores.valuable = 5;
    }
    
    // Estimable
    if (story.complexity === 'high' && story.story_points > 8) {
      validation.warnings.push('Story may be too large to estimate accurately');
      validation.scores.estimable = 3;
    } else {
      validation.scores.estimable = 5;
    }
    
    // Small
    if (story.story_points > 8) {
      validation.warnings.push('Story is large - consider breaking into smaller stories');
      validation.scores.small = 2;
    } else {
      validation.scores.small = 5;
    }
    
    // Testable
    if (story.acceptance_criteria.length < 2) {
      validation.warnings.push('Limited acceptance criteria - may be difficult to test');
      validation.scores.testable = 3;
    } else {
      validation.scores.testable = 5;
    }
    
    validation.isValid = validation.warnings.length === 0;
    validation.overall_score = Object.values(validation.scores).reduce((sum, score) => sum + score, 0) / 6;
    
    return validation;
  }

  /**
   * Generate story content from template
   */
  async generateStoryContent(story, validation) {
    const templatePath = path.join(this.templatesDir, 'story_template.md');
    const template = await fs.readFile(templatePath, 'utf8');
    
    let content = template
      .replace('{STORY_ID}', story.id)
      .replace('{STORY_TITLE}', story.title)
      .replace('{EPIC_REFERENCE}', story.epic_reference)
      .replace('{SPRINT_NUMBER}', 'TBD')
      .replace('{USER_ROLE}', story.user_role)
      .replace('{USER_GOAL}', story.user_goal)
      .replace('{USER_BENEFIT}', story.user_benefit)
      .replace('{ACCEPTANCE_CRITERIA}', story.acceptance_criteria.map(c => `- ${c}`).join('\n'))
      .replace('{IMPLEMENTATION_NOTES}', story.implementation_notes.map(n => `- ${n}`).join('\n'))
      .replace('{DEPENDENCIES}', story.dependencies.map(d => `- ${d}`).join('\n'))
      .replace('{STORY_POINTS}', story.story_points.toString())
      .replace('{COMPLEXITY}', story.complexity)
      .replace('{RISK_LEVEL}', story.risk_level)
      .replace('{SHARD_CONTEXT}', 'Generated from PRD and architecture shards')
      .replace('{ADDITIONAL_NOTES}', validation.warnings.length > 0 ? `Validation warnings: ${validation.warnings.join(', ')}` : '')
      .replace('{CREATED_DATE}', story.created_date)
      .replace('{STATUS}', story.status);
    
    return content;
  }

  /**
   * Save story to file
   */
  async saveStory(story, content) {
    const filename = `story-${this.storyCounter.toString().padStart(3, '0')}.md`;
    const storyPath = path.join(this.storiesDir, filename);
    
    await fs.writeFile(storyPath, content, 'utf8');
    
    return storyPath;
  }

  /**
   * Update story tracking
   */
  async updateStoryTracking(story) {
    const trackingPath = path.join(this.trackingDir, 'story_creation_log.md');
    
    const logEntry = `
## ${story.created_date}
- **Story ID:** ${story.id}
- **Title:** ${story.title}
- **Epic:** ${story.epic_reference}
- **Points:** ${story.story_points}
- **Complexity:** ${story.complexity}
- **Risk:** ${story.risk_level}
- **Status:** Created
`;
    
    try {
      await fs.appendFile(trackingPath, logEntry, 'utf8');
    } catch (error) {
      const header = '# Story Creation Log\n\nTrack of all stories created by the Scrum Master Agent.\n';
      await fs.writeFile(trackingPath, header + logEntry, 'utf8');
    }
  }

  /**
   * Display story results
   */
  async displayStoryResults(story, options) {
    console.log('\n📝 Story Creation Results');
    console.log('=========================\n');
    
    console.log(`✅ Story Created: ${story.id}`);
    console.log(`   Title: ${story.title}`);
    console.log(`   Epic: ${story.epic_reference}`);
    console.log(`   Story Points: ${story.story_points}`);
    console.log(`   Complexity: ${story.complexity}`);
    console.log(`   Risk Level: ${story.risk_level}`);
    console.log(`   File: ${path.basename(story.story_path)}`);
    
    console.log('\n📊 INVEST Validation');
    console.log(`   Overall Score: ${Math.round(story.validation.overall_score)}/5`);
    console.log(`   Valid: ${story.validation.isValid ? '✅ Yes' : '⚠️ With warnings'}`);
    
    if (story.validation.warnings.length > 0) {
      console.log('\n⚠️ Validation Warnings:');
      story.validation.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    console.log('\n📋 Story Details');
    console.log(`   User Role: ${story.user_role}`);
    console.log(`   User Goal: ${story.user_goal}`);
    console.log(`   User Benefit: ${story.user_benefit}`);
    console.log(`   Acceptance Criteria: ${story.acceptance_criteria.length} items`);
    console.log(`   Implementation Notes: ${story.implementation_notes.length} items`);
    console.log(`   Dependencies: ${story.dependencies.length} items`);
    
    console.log('\n📈 Analysis Summary');
    console.log(`   Shards Analyzed: ${story.shards_analyzed}`);
    console.log(`   Created: ${new Date(story.created_date).toLocaleString()}`);
    
    if (options.detailed) {
      console.log('\n📄 Story Content Preview:');
      console.log('─'.repeat(50));
      const content = await fs.readFile(story.story_path, 'utf8');
      const lines = content.split('\n');
      console.log(lines.slice(0, 20).join('\n'));
      if (lines.length > 20) {
        console.log('...(truncated)');
      }
      console.log('─'.repeat(50));
    }
    
    console.log(`\n💾 Story saved to: ${story.story_path}`);
    console.log('\n🚀 Next Steps:');
    console.log('   • Review and refine the story');
    console.log('   • Add to sprint backlog when ready');
    console.log('   • Estimate with the development team');
    console.log('   • Break down if story points > 8');
  }

  /**
   * Helper methods
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    epic: args.find(arg => arg.startsWith('--epic='))?.split('=')[1],
    priority: args.find(arg => arg.startsWith('--priority='))?.split('=')[1] || 'medium',
    detailed: args.includes('--detailed')
  };
  
  const cli = new StoryCreationCLI();
  cli.run(options).catch(error => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = StoryCreationCLI;
