const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Story Creation Module
 * 
 * Handles creating user stories from sharded PRD/architecture documents,
 * applying INVEST criteria, and generating dev-ready stories with complete context.
 */
class StoryCreation {
  constructor(agentDir, sharedMemory) {
    this.agentDir = agentDir;
    this.sharedMemory = sharedMemory;
    this.storiesDir = path.join(agentDir, 'stories');
    this.templatesDir = path.join(agentDir, 'templates');
    
    // Story creation state
    this.storyCounter = 0;
    this.storyTemplates = new Map();
    this.shardCache = new Map();
  }

  /**
   * Initialize Story Creation module
   */
  async initialize() {
    console.log('📝 Story Creation module initializing...');
    
    // Ensure directories exist
    await this.ensureDirectoryExists(this.storiesDir);
    await this.ensureDirectoryExists(this.templatesDir);
    
    // Load story templates
    await this.loadStoryTemplates();
    
    // Load existing stories to get counter
    await this.loadExistingStories();
    
    console.log('📝 Story Creation module initialized');
  }

  /**
   * Load story templates
   */
  async loadStoryTemplates() {
    try {
      // Create default story template if it doesn't exist
      const templatePath = path.join(this.templatesDir, 'story_template.md');
      if (!await this.fileExists(templatePath)) {
        await this.createDefaultStoryTemplate();
      }
      
      const content = await fs.readFile(templatePath, 'utf8');
      this.storyTemplates.set('default', content);
      
      // Load additional templates if they exist
      const templateFiles = await fs.readdir(this.templatesDir);
      for (const file of templateFiles.filter(f => f.endsWith('_template.md'))) {
        const templateName = file.replace('_template.md', '');
        const templateContent = await fs.readFile(path.join(this.templatesDir, file), 'utf8');
        this.storyTemplates.set(templateName, templateContent);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load story templates: ${error.message}`);
      await this.createDefaultStoryTemplate();
    }
  }

  /**
   * Create default story template
   */
  async createDefaultStoryTemplate() {
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

    const templatePath = path.join(this.templatesDir, 'story_template.md');
    await fs.writeFile(templatePath, defaultTemplate, 'utf8');
    this.storyTemplates.set('default', defaultTemplate);
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
      console.warn(`⚠️ Could not load existing stories: ${error.message}`);
      this.storyCounter = 0;
    }
  }

  /**
   * Create story from sharded documents
   */
  async createFromShards(parameters) {
    const { epic_reference, story_type = 'feature', priority = 'medium' } = parameters;
    
    console.log(`📝 Creating story from shards for epic: ${epic_reference}`);
    
    // Load relevant shards
    const shards = await this.loadRelevantShards(epic_reference);
    if (shards.length === 0) {
      console.log(`⚠️ No real shards found for epic: ${epic_reference}, creating sample shard`);
      shards.push(this.createSampleShard(epic_reference));
    }
    
    // Analyze shards to determine next story
    const storyContext = await this.analyzeShards(shards, story_type);
    
    // Generate story content
    const story = await this.generateStory(storyContext, epic_reference, priority);
    
    // Validate against INVEST criteria
    const validation = this.validateINVEST(story);
    if (!validation.isValid) {
      console.warn(`⚠️ Story validation warnings: ${validation.warnings.join(', ')}`);
      story.validation_warnings = validation.warnings;
    }
    
    // Save story
    const storyPath = await this.saveStory(story);
    
    // Update story tracking
    await this.updateStoryTracking(story);
    
    return {
      story_id: story.id,
      story_path: storyPath,
      title: story.title,
      epic_reference: epic_reference,
      validation: validation,
      shards_analyzed: shards.length
    };
  }

  /**
   * Load relevant shards for epic
   */
  async loadRelevantShards(epicReference) {
    const shards = [];
    
    try {
      // Check cache first
      if (this.shardCache.has(epicReference)) {
        return this.shardCache.get(epicReference);
      }
      
      // Look for PRD shards
      const prdDir = path.join(process.cwd(), 'docs', 'prd');
      if (await this.fileExists(prdDir)) {
        const prdFiles = await fs.readdir(prdDir);
        
        for (const file of prdFiles.filter(f => f.includes(epicReference) || f.includes('epic'))) {
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
      const archDir = path.join(process.cwd(), 'docs', 'architecture');
      if (await this.fileExists(archDir)) {
        const archFiles = await fs.readdir(archDir);
        
        for (const file of archFiles.filter(f => f.includes(epicReference) || f.includes('design'))) {
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
      
      // Look for existing stories to avoid duplication
      const existingStories = await this.getExistingStories(epicReference);
      shards.push(...existingStories.map(story => ({
        type: 'existing_story',
        file: story.file,
        content: story.content,
        relevance: 1.0
      })));
      
      // Sort by relevance
      shards.sort((a, b) => b.relevance - a.relevance);
      
      // Cache results
      this.shardCache.set(epicReference, shards);
      
      return shards;
    } catch (error) {
      console.error(`❌ Error loading shards: ${error.message}`);
      return [];
    }
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
   * Get existing stories for epic
   */
  async getExistingStories(epicReference) {
    const stories = [];
    
    try {
      const storyFiles = await fs.readdir(this.storiesDir);
      
      for (const file of storyFiles.filter(f => f.endsWith('.md'))) {
        const filePath = path.join(this.storiesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes(epicReference)) {
          stories.push({
            file: file,
            path: filePath,
            content: content
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load existing stories: ${error.message}`);
    }
    
    return stories;
  }

  /**
   * Analyze shards to determine story context
   */
  async analyzeShards(shards, storyType) {
    const context = {
      epic_reference: '',
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
      // Extract user stories
      const userStories = this.extractUserStories(shard.content);
      if (userStories.length > 0) {
        const story = userStories[0]; // Take first unimplemented story
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
    
    // Based on acceptance criteria count
    complexityScore += Math.min(context.acceptance_criteria.length, 5);
    
    // Based on implementation notes
    complexityScore += Math.min(context.implementation_notes.length, 3);
    
    // Based on dependencies
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
    
    // High dependency count increases risk
    if (context.dependencies.length > 2) riskScore += 2;
    
    // High complexity increases risk
    if (context.complexity === 'high') riskScore += 2;
    
    // Many acceptance criteria might indicate complexity
    if (context.acceptance_criteria.length > 5) riskScore += 1;
    
    if (riskScore <= 1) return 'low';
    if (riskScore <= 3) return 'medium';
    return 'high';
  }

  /**
   * Generate story from context
   */
  async generateStory(context, epicReference, priority) {
    this.storyCounter++;
    
    const storyId = `STORY-${this.storyCounter.toString().padStart(3, '0')}`;
    const template = this.storyTemplates.get('default');
    
    const story = {
      id: storyId,
      title: this.generateStoryTitle(context),
      epic_reference: epicReference,
      priority: priority,
      status: 'todo',
      created_date: new Date().toISOString(),
      ...context
    };
    
    // Fill template
    let content = template
      .replace('{STORY_ID}', storyId)
      .replace('{STORY_TITLE}', story.title)
      .replace('{EPIC_REFERENCE}', epicReference)
      .replace('{SPRINT_NUMBER}', 'TBD')
      .replace('{USER_ROLE}', context.user_role)
      .replace('{USER_GOAL}', context.user_goal)
      .replace('{USER_BENEFIT}', context.user_benefit)
      .replace('{ACCEPTANCE_CRITERIA}', context.acceptance_criteria.map(c => `- ${c}`).join('\n'))
      .replace('{IMPLEMENTATION_NOTES}', context.implementation_notes.map(n => `- ${n}`).join('\n'))
      .replace('{DEPENDENCIES}', context.dependencies.map(d => `- ${d}`).join('\n'))
      .replace('{STORY_POINTS}', context.story_points.toString())
      .replace('{COMPLEXITY}', context.complexity)
      .replace('{RISK_LEVEL}', context.risk_level)
      .replace('{SHARD_CONTEXT}', 'Generated from PRD and architecture shards')
      .replace('{ADDITIONAL_NOTES}', '')
      .replace('{CREATED_DATE}', story.created_date)
      .replace('{STATUS}', story.status);
    
    story.content = content;
    
    return story;
  }

  /**
   * Generate story title from context
   */
  generateStoryTitle(context) {
    if (context.user_goal) {
      // Clean up the goal to make a good title
      let title = context.user_goal;
      
      // Remove common prefixes
      title = title.replace(/^(to |be able to |have |see |view |create |update |delete )/i, '');
      
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      // Limit length
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
   * Save story to file
   */
  async saveStory(story) {
    const filename = `story-${this.storyCounter.toString().padStart(3, '0')}.md`;
    const storyPath = path.join(this.storiesDir, filename);
    
    await fs.writeFile(storyPath, story.content, 'utf8');
    
    return storyPath;
  }

  /**
   * Update story tracking
   */
  async updateStoryTracking(story) {
    const trackingPath = path.join(this.agentDir, 'tracking', 'story_creation_log.md');
    
    const logEntry = `
## ${story.created_date}
- **Story ID:** ${story.id}
- **Title:** ${story.title}
- **Epic:** ${story.epic_reference}
- **Points:** ${story.story_points}
- **Status:** Created
`;
    
    try {
      await fs.appendFile(trackingPath, logEntry, 'utf8');
    } catch (error) {
      // Create file if it doesn't exist
      const header = '# Story Creation Log\n\nTrack of all stories created by the Scrum Master Agent.\n';
      await fs.writeFile(trackingPath, header + logEntry, 'utf8');
    }
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

module.exports = StoryCreation;
