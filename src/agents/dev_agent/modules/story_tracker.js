/**
 * Story Tracker Module
 * 
 * Manages story implementation, breakdown, and progress tracking
 */

const fs = require('fs').promises;
const path = require('path');

class StoryTracker {
  constructor(agent) {
    this.agent = agent;
    this.stories = [];
    this.activeStory = null;
    const projectRoot = (this.agent && this.agent.config && this.agent.config.projectRoot) ? 
      this.agent.config.projectRoot : process.cwd();
    this.trackingFile = path.join(projectRoot, 'src/agents/dev_agent/tracking/story_progress.md');
  }

  async initialize() {
    console.log('🚀 Initializing Story Tracker...');
    
    // Load existing stories
    await this.loadStories();
    
    // Ensure tracking directory exists
    const trackingDir = path.dirname(this.trackingFile);
    await fs.mkdir(trackingDir, { recursive: true });
    
    console.log('✅ Story Tracker initialized');
  }

  async loadStories() {
    try {
      if (await this.fileExists(this.trackingFile)) {
        const content = await fs.readFile(this.trackingFile, 'utf8');
        this.parseStories(content);
      }
    } catch (error) {
      console.warn(`⚠️ Could not load stories: ${error.message}`);
    }
  }

  parseStories(content) {
    // Extract story entries from markdown
    const storyMatches = content.match(/## Story:(.*?)(?=## Story:|\n---|\n$)/gs);
    if (storyMatches) {
      this.stories = storyMatches.map((match, index) => {
        const titleMatch = match.match(/## Story:\s*(.*)/);
        const statusMatch = match.match(/\*\*Status\*\*:\s*(.*)/);
        const progressMatch = match.match(/\*\*Progress\*\*:\s*(.*)/);
        const dateMatch = match.match(/\*\*Started\*\*:\s*(.*)/);
        
        return {
          id: index + 1,
          title: titleMatch ? titleMatch[1].trim() : 'Unknown Story',
          status: statusMatch ? statusMatch[1].trim() : 'not_started',
          progress: progressMatch ? progressMatch[1].trim() : '0%',
          started_date: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
          content: match
        };
      });
    }
  }

  async breakDownStory(task, analysis) {
    console.log('📋 Breaking down story into implementation tasks...');
    
    const story = {
      id: this.generateStoryId(),
      title: task.title || analysis.story_title || 'New Development Story',
      description: task.description || analysis.description || '',
      acceptance_criteria: task.acceptance_criteria || analysis.acceptance_criteria || [],
      status: 'in_progress',
      progress: '0%',
      started_date: new Date().toISOString(),
      tasks: [],
      tests: [],
      files_affected: []
    };

    // Break down into implementation tasks
    story.tasks = await this.generateImplementationTasks(story, analysis);
    
    // Identify test requirements
    story.tests = await this.generateTestRequirements(story, analysis);
    
    // Estimate affected files
    story.files_affected = await this.estimateAffectedFiles(story, analysis);
    
    // Add to stories and set as active
    this.stories.push(story);
    this.activeStory = story;
    
    // Update tracking
    await this.updateTracking({
      type: 'story_breakdown',
      story: story,
      timestamp: new Date().toISOString()
    });

    return story;
  }

  generateStoryId() {
    return `STORY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  async generateImplementationTasks(story, analysis) {
    const tasks = [];
    
    // Core implementation tasks
    tasks.push({
      id: 'setup',
      title: 'Setup and Planning',
      description: 'Initialize development environment and create implementation plan',
      status: 'pending',
      estimated_hours: 1,
      dependencies: []
    });

    tasks.push({
      id: 'core_implementation',
      title: 'Core Feature Implementation',
      description: `Implement the main functionality for ${story.title}`,
      status: 'pending',
      estimated_hours: 4,
      dependencies: ['setup']
    });

    tasks.push({
      id: 'testing',
      title: 'Test Implementation',
      description: 'Create and run comprehensive tests',
      status: 'pending',
      estimated_hours: 2,
      dependencies: ['core_implementation']
    });

    tasks.push({
      id: 'integration',
      title: 'Integration and Validation',
      description: 'Integrate with existing system and validate functionality',
      status: 'pending',
      estimated_hours: 1,
      dependencies: ['testing']
    });

    tasks.push({
      id: 'documentation',
      title: 'Documentation and Cleanup',
      description: 'Document changes and clean up code',
      status: 'pending',
      estimated_hours: 1,
      dependencies: ['integration']
    });

    // Add specific tasks based on analysis
    if (analysis.requires_database) {
      tasks.push({
        id: 'database_changes',
        title: 'Database Schema Changes',
        description: 'Implement required database changes',
        status: 'pending',
        estimated_hours: 2,
        dependencies: ['setup']
      });
    }

    if (analysis.requires_api) {
      tasks.push({
        id: 'api_implementation',
        title: 'API Endpoint Implementation',
        description: 'Create and test API endpoints',
        status: 'pending',
        estimated_hours: 3,
        dependencies: ['core_implementation']
      });
    }

    if (analysis.requires_ui) {
      tasks.push({
        id: 'ui_implementation',
        title: 'User Interface Implementation',
        description: 'Create user interface components',
        status: 'pending',
        estimated_hours: 3,
        dependencies: ['api_implementation']
      });
    }

    return tasks;
  }

  async generateTestRequirements(story, analysis) {
    const tests = [];
    
    // Unit tests
    tests.push({
      type: 'unit',
      description: 'Unit tests for core functionality',
      files: [`${story.title.toLowerCase().replace(/\s+/g, '_')}.test.js`],
      coverage_target: 90
    });

    // Integration tests
    tests.push({
      type: 'integration',
      description: 'Integration tests for system interaction',
      files: [`${story.title.toLowerCase().replace(/\s+/g, '_')}.integration.test.js`],
      coverage_target: 80
    });

    // E2E tests if UI involved
    if (analysis.requires_ui) {
      tests.push({
        type: 'e2e',
        description: 'End-to-end tests for user workflows',
        files: [`${story.title.toLowerCase().replace(/\s+/g, '_')}.e2e.test.js`],
        coverage_target: 70
      });
    }

    // Performance tests if needed
    if (analysis.performance_critical) {
      tests.push({
        type: 'performance',
        description: 'Performance tests for critical paths',
        files: [`${story.title.toLowerCase().replace(/\s+/g, '_')}.perf.test.js`],
        coverage_target: 60
      });
    }

    return tests;
  }

  async estimateAffectedFiles(story, analysis) {
    const files = [];
    
    // Core implementation files
    const baseFileName = story.title.toLowerCase().replace(/\s+/g, '_');
    files.push(`src/components/${baseFileName}.js`);
    files.push(`src/services/${baseFileName}_service.js`);
    
    // Test files
    files.push(`test/unit/${baseFileName}.test.js`);
    files.push(`test/integration/${baseFileName}.integration.test.js`);
    
    // Configuration files
    if (analysis.requires_config) {
      files.push('config/app.yml');
      files.push('config/database.yml');
    }
    
    // Documentation files
    files.push('docs/features/' + baseFileName + '.md');
    files.push('README.md');
    
    return files;
  }

  async updateStoryProgress(storyId, taskId, status, notes) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) {
      throw new Error(`Story ${storyId} not found`);
    }

    const task = story.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in story ${storyId}`);
    }

    const oldStatus = task.status;
    task.status = status;
    task.updated_date = new Date().toISOString();
    if (notes) {
      task.notes = notes;
    }

    // Calculate overall progress
    const completedTasks = story.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = story.tasks.length;
    story.progress = `${Math.round((completedTasks / totalTasks) * 100)}%`;

    // Update story status
    if (completedTasks === totalTasks) {
      story.status = 'completed';
      story.completed_date = new Date().toISOString();
    } else if (completedTasks > 0) {
      story.status = 'in_progress';
    }

    await this.updateTracking({
      type: 'task_progress_update',
      story_id: storyId,
      task_id: taskId,
      old_status: oldStatus,
      new_status: status,
      progress: story.progress,
      timestamp: new Date().toISOString()
    });

    return story;
  }

  async verifyImplementation(result) {
    console.log('✅ Verifying story implementation...');
    
    const verification = {
      story_id: this.activeStory?.id,
      verification_date: new Date().toISOString(),
      tests_passed: false,
      coverage_met: false,
      acceptance_criteria_met: false,
      issues_found: [],
      recommendations: []
    };

    if (!this.activeStory) {
      verification.issues_found.push('No active story to verify');
      return verification;
    }

    // Check test results
    if (result.test_results) {
      verification.tests_passed = result.test_results.success;
      if (!verification.tests_passed) {
        verification.issues_found.push(`${result.test_results.failed} test(s) failed`);
      }
    }

    // Check coverage
    if (result.coverage) {
      const targetCoverage = 80; // Default target
      verification.coverage_met = result.coverage.overall >= targetCoverage;
      if (!verification.coverage_met) {
        verification.issues_found.push(`Coverage ${result.coverage.overall}% below target ${targetCoverage}%`);
      }
    }

    // Check acceptance criteria
    if (this.activeStory.acceptance_criteria) {
      // Simplified check - would need more sophisticated validation
      verification.acceptance_criteria_met = verification.tests_passed && verification.coverage_met;
      if (!verification.acceptance_criteria_met) {
        verification.issues_found.push('Acceptance criteria not fully met');
      }
    }

    // Generate recommendations
    if (verification.issues_found.length > 0) {
      verification.recommendations.push('Address failing tests before completing story');
      verification.recommendations.push('Ensure code coverage meets target thresholds');
      verification.recommendations.push('Validate all acceptance criteria are satisfied');
    } else {
      verification.recommendations.push('Story implementation verified successfully');
      verification.recommendations.push('Ready for code review and deployment');
    }

    return verification;
  }

  async updateTracking(result) {
    try {
      let content = '';
      if (await this.fileExists(this.trackingFile)) {
        content = await fs.readFile(this.trackingFile, 'utf8');
      } else {
        content = `# Dev Agent - Story Progress Tracking

## Active Stories
*Current story progress will be tracked here automatically*

## Completed Stories
*Completed stories will be logged here*

## Story History
*Story activities will be logged here automatically*

`;
      }

      const timestamp = new Date().toISOString();
      const logEntry = `
## ${timestamp}
**Type**: ${result.type}
**Details**: ${JSON.stringify(result, null, 2)}

---
`;

      // Insert at the beginning of the history section
      const insertPoint = content.indexOf('*Story activities will be logged here automatically*');
      if (insertPoint !== -1) {
        const beforeInsert = content.substring(0, insertPoint + '*Story activities will be logged here automatically*'.length);
        const afterInsert = content.substring(insertPoint + '*Story activities will be logged here automatically*'.length);
        content = beforeInsert + logEntry + afterInsert;
      } else {
        content += logEntry;
      }

      await fs.writeFile(this.trackingFile, content);
    } catch (error) {
      console.warn(`⚠️ Failed to update story tracking: ${error.message}`);
    }
  }

  async getStatus() {
    const activeStories = this.stories.filter(s => s.status === 'in_progress');
    const completedStories = this.stories.filter(s => s.status === 'completed');
    
    return {
      total_stories: this.stories.length,
      active_stories: activeStories.length,
      completed_stories: completedStories.length,
      current_story: this.activeStory ? {
        id: this.activeStory.id,
        title: this.activeStory.title,
        progress: this.activeStory.progress,
        status: this.activeStory.status
      } : null,
      recent_activities: this.stories
        .filter(s => s.started_date)
        .sort((a, b) => new Date(b.started_date) - new Date(a.started_date))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          progress: s.progress
        }))
    };
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = StoryTracker;
