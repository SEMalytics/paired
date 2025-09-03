#!/usr/bin/env node
/**
 * Dev Agent Story Management CLI Tool
 * Provides command-line interface for story tracking and management
 */

const fs = require('fs');
const path = require('path');

// Get project paths
const projectRoot = path.resolve(__dirname, '../../../..');
const devAgentDir = path.resolve(__dirname, '..');
const trackingDir = path.join(devAgentDir, 'tracking');
const storyProgressFile = path.join(trackingDir, 'story_progress.md');
const implementationStatusFile = path.join(trackingDir, 'implementation_status.md');

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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

// Story management functions
function generateStoryId() {
  return `STORY-${Date.now().toString(36).toUpperCase()}`;
}

function getCurrentTimestamp() {
  return new Date().toISOString().split('T')[0];
}

function readStoryProgress() {
  if (!fs.existsSync(storyProgressFile)) {
    return {
      lastUpdated: getCurrentTimestamp(),
      stories: []
    };
  }

  try {
    const content = fs.readFileSync(storyProgressFile, 'utf8');
    const stories = [];

    // Parse existing stories from markdown
    const storyMatches = content.match(/## Story: (.+?)\n([\s\S]*?)(?=\n## Story:|$)/g);
    if (storyMatches) {
      storyMatches.forEach(match => {
        const lines = match.split('\n');
        const title = lines[0].replace('## Story: ', '');

        const story = {
          id: '',
          title: title,
          status: 'planning',
          priority: 'medium',
          created: getCurrentTimestamp(),
          updated: getCurrentTimestamp(),
          description: '',
          tasks: [],
          acceptance_criteria: [],
          technical_notes: '',
          blockers: []
        };

        // Parse story details
        lines.forEach(line => {
          if (line.startsWith('- **ID:**')) story.id = line.replace('- **ID:**', '').trim();
          if (line.startsWith('- **Status:**')) story.status = line.replace('- **Status:**', '').trim();
          if (line.startsWith('- **Priority:**')) story.priority = line.replace('- **Priority:**', '').trim();
          if (line.startsWith('- **Created:**')) story.created = line.replace('- **Created:**', '').trim();
          if (line.startsWith('- **Updated:**')) story.updated = line.replace('- **Updated:**', '').trim();
          if (line.startsWith('- **Description:**')) story.description = line.replace('- **Description:**', '').trim();
          if (line.startsWith('  - [ ]') || line.startsWith('  - [x]')) {
            story.tasks.push({
              text: line.replace(/^\s*- \[[x ]\]\s*/, ''),
              completed: line.includes('[x]')
            });
          }
        });

        stories.push(story);
      });
    }

    return {
      lastUpdated: getCurrentTimestamp(),
      stories: stories
    };
  } catch (error) {
    console.error(colorize(`Error reading story progress: ${error.message}`, 'red'));
    return {
      lastUpdated: getCurrentTimestamp(),
      stories: []
    };
  }
}

function writeStoryProgress(data) {
  try {
    let content = '# Development Story Progress\n\n';
    content += `**Last Updated:** ${data.lastUpdated}\n\n`;
    content += `**Total Stories:** ${data.stories.length}\n`;
    content += `**Active Stories:** ${data.stories.filter(s => s.status === 'in_progress').length}\n`;
    content += `**Completed Stories:** ${data.stories.filter(s => s.status === 'completed').length}\n\n`;

    if (data.stories.length === 0) {
      content += '*No stories tracked yet. Use \'dev-story-new\' to create your first story.*\n';
    } else {
      data.stories.forEach(story => {
        content += `## Story: ${story.title}\n\n`;
        content += `- **ID:** ${story.id}\n`;
        content += `- **Status:** ${story.status}\n`;
        content += `- **Priority:** ${story.priority}\n`;
        content += `- **Created:** ${story.created}\n`;
        content += `- **Updated:** ${story.updated}\n`;
        content += `- **Description:** ${story.description}\n\n`;

        if (story.tasks.length > 0) {
          content += '### Tasks:\n';
          story.tasks.forEach(task => {
            const checkbox = task.completed ? '[x]' : '[ ]';
            content += `  - ${checkbox} ${task.text}\n`;
          });
          content += '\n';
        }

        if (story.acceptance_criteria.length > 0) {
          content += '### Acceptance Criteria:\n';
          story.acceptance_criteria.forEach(criteria => {
            content += `  - ${criteria}\n`;
          });
          content += '\n';
        }

        if (story.technical_notes) {
          content += `### Technical Notes:\n${story.technical_notes}\n\n`;
        }

        if (story.blockers.length > 0) {
          content += '### Blockers:\n';
          story.blockers.forEach(blocker => {
            content += `  - ⚠️ ${blocker}\n`;
          });
          content += '\n';
        }

        content += '---\n\n';
      });
    }

    fs.writeFileSync(storyProgressFile, content);
    return true;
  } catch (error) {
    console.error(colorize(`Error writing story progress: ${error.message}`, 'red'));
    return false;
  }
}

function createStory(title, description = '', priority = 'medium') {
  const data = readStoryProgress();

  const newStory = {
    id: generateStoryId(),
    title: title,
    status: 'planning',
    priority: priority,
    created: getCurrentTimestamp(),
    updated: getCurrentTimestamp(),
    description: description,
    tasks: [],
    acceptance_criteria: [],
    technical_notes: '',
    blockers: []
  };

  data.stories.push(newStory);
  data.lastUpdated = getCurrentTimestamp();

  if (writeStoryProgress(data)) {
    console.log(colorize('✅ Story created successfully!', 'green'));
    console.log(colorize(`📋 ID: ${newStory.id}`, 'blue'));
    console.log(colorize(`📝 Title: ${newStory.title}`, 'blue'));
    console.log(colorize(`🎯 Priority: ${newStory.priority}`, 'blue'));
    return newStory;
  } else {
    console.error(colorize('❌ Failed to create story', 'red'));
    return null;
  }
}

function listStories(statusFilter = null) {
  const data = readStoryProgress();

  if (data.stories.length === 0) {
    console.log(colorize('📋 No stories found. Create your first story with \'dev-story-new <title>\'', 'yellow'));
    return;
  }

  let stories = data.stories;
  if (statusFilter) {
    stories = stories.filter(s => s.status === statusFilter);
  }

  console.log(colorize(`📋 Development Stories (${stories.length} total):`, 'blue'));
  console.log('');

  stories.forEach(story => {
    const statusIcon = {
      'planning': '📝',
      'in_progress': '🚀',
      'completed': '✅',
      'blocked': '🚫',
      'on_hold': '⏸️'
    }[story.status] || '❓';

    const priorityColor = {
      'high': 'red',
      'medium': 'yellow',
      'low': 'green'
    }[story.priority] || 'white';

    console.log(colorize(`${statusIcon} ${story.title}`, 'white'));
    console.log(colorize(`   ID: ${story.id}`, 'cyan'));
    console.log(colorize(`   Status: ${story.status}`, 'white'));
    console.log(colorize(`   Priority: ${story.priority}`, priorityColor));
    console.log(colorize(`   Created: ${story.created}`, 'white'));

    if (story.tasks.length > 0) {
      const completedTasks = story.tasks.filter(t => t.completed).length;
      console.log(colorize(`   Tasks: ${completedTasks}/${story.tasks.length} completed`, 'white'));
    }

    if (story.blockers.length > 0) {
      console.log(colorize(`   ⚠️ ${story.blockers.length} blocker(s)`, 'red'));
    }

    console.log('');
  });
}

function showStoryStatus() {
  const data = readStoryProgress();

  const statusCounts = {
    'planning': 0,
    'in_progress': 0,
    'completed': 0,
    'blocked': 0,
    'on_hold': 0
  };

  data.stories.forEach(story => {
    statusCounts[story.status] = (statusCounts[story.status] || 0) + 1;
  });

  console.log(colorize('📊 Story Status Summary:', 'blue'));
  console.log('');
  console.log(colorize(`📝 Planning: ${statusCounts.planning}`, 'white'));
  console.log(colorize(`🚀 In Progress: ${statusCounts.in_progress}`, 'yellow'));
  console.log(colorize(`✅ Completed: ${statusCounts.completed}`, 'green'));
  console.log(colorize(`🚫 Blocked: ${statusCounts.blocked}`, 'red'));
  console.log(colorize(`⏸️ On Hold: ${statusCounts.on_hold}`, 'magenta'));
  console.log('');
  console.log(colorize(`📋 Total Stories: ${data.stories.length}`, 'blue'));

  if (statusCounts.blocked > 0) {
    console.log('');
    console.log(colorize('⚠️ Blocked Stories:', 'red'));
    data.stories.filter(s => s.status === 'blocked').forEach(story => {
      console.log(colorize(`   - ${story.title} (${story.id})`, 'red'));
      story.blockers.forEach(blocker => {
        console.log(colorize(`     • ${blocker}`, 'red'));
      });
    });
  }
}

function updateStoryStatus(storyId, newStatus) {
  const data = readStoryProgress();
  const story = data.stories.find(s => s.id === storyId);

  if (!story) {
    console.error(colorize(`❌ Story not found: ${storyId}`, 'red'));
    return false;
  }

  const validStatuses = ['planning', 'in_progress', 'completed', 'blocked', 'on_hold'];
  if (!validStatuses.includes(newStatus)) {
    console.error(colorize(`❌ Invalid status: ${newStatus}`, 'red'));
    console.log(colorize(`Valid statuses: ${validStatuses.join(', ')}`, 'yellow'));
    return false;
  }

  story.status = newStatus;
  story.updated = getCurrentTimestamp();
  data.lastUpdated = getCurrentTimestamp();

  if (writeStoryProgress(data)) {
    const statusIcon = {
      'planning': '📝',
      'in_progress': '🚀',
      'completed': '✅',
      'blocked': '🚫',
      'on_hold': '⏸️'
    }[newStatus] || '❓';

    console.log(colorize('✅ Story status updated!', 'green'));
    console.log(colorize(`${statusIcon} ${story.title} → ${newStatus}`, 'blue'));
    return true;
  } else {
    console.error(colorize('❌ Failed to update story status', 'red'));
    return false;
  }
}

function showStoryProgress() {
  const data = readStoryProgress();

  console.log(colorize('📈 Story Progress Report:', 'blue'));
  console.log('');

  data.stories.forEach(story => {
    if (story.tasks.length > 0) {
      const completedTasks = story.tasks.filter(t => t.completed).length;
      const progress = Math.round((completedTasks / story.tasks.length) * 100);

      const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      const progressColor = progress >= 80 ? 'green' : progress >= 50 ? 'yellow' : 'red';

      console.log(colorize(`📋 ${story.title}`, 'white'));
      console.log(colorize(`   [${progressBar}] ${progress}% (${completedTasks}/${story.tasks.length})`, progressColor));
      console.log('');
    }
  });
}

// CLI command handling
function showHelp() {
  console.log(colorize('🚀 Dev Agent Story Management CLI', 'blue'));
  console.log('');
  console.log(colorize('Usage: node story.js <command> [options]', 'white'));
  console.log('');
  console.log(colorize('Commands:', 'yellow'));
  console.log(colorize('  create <title> [description] [priority]  - Create new story', 'white'));
  console.log(colorize('  list [status]                           - List stories (optionally filter by status)', 'white'));
  console.log(colorize('  status                                  - Show story status summary', 'white'));
  console.log(colorize('  progress                                - Show story progress report', 'white'));
  console.log(colorize('  start <story_id>                        - Start working on a story', 'white'));
  console.log(colorize('  complete <story_id>                     - Mark story as completed', 'white'));
  console.log(colorize('  block <story_id>                        - Mark story as blocked', 'white'));
  console.log(colorize('  update <story_id> <status>              - Update story status', 'white'));
  console.log(colorize('  help                                    - Show this help', 'white'));
  console.log('');
  console.log(colorize('Examples:', 'yellow'));
  console.log(colorize('  node story.js create "User Authentication" "Implement login system" high', 'cyan'));
  console.log(colorize('  node story.js list in_progress', 'cyan'));
  console.log(colorize('  node story.js start STORY-ABC123', 'cyan'));
  console.log(colorize('  node story.js complete STORY-ABC123', 'cyan'));
}

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
case 'create':
  const title = args[1];
  const description = args[2] || '';
  const priority = args[3] || 'medium';

  if (!title) {
    console.error(colorize('❌ Title is required', 'red'));
    console.log(colorize('Usage: node story.js create <title> [description] [priority]', 'yellow'));
    process.exit(1);
  }

  createStory(title, description, priority);
  break;

case 'list':
  const statusFilter = args[1];
  listStories(statusFilter);
  break;

case 'status':
  showStoryStatus();
  break;

case 'progress':
  showStoryProgress();
  break;

case 'start':
  const startStoryId = args[1];
  if (!startStoryId) {
    console.error(colorize('❌ Story ID is required', 'red'));
    console.log(colorize('Usage: node story.js start <story_id>', 'yellow'));
    process.exit(1);
  }
  updateStoryStatus(startStoryId, 'in_progress');
  break;

case 'complete':
  const completeStoryId = args[1];
  if (!completeStoryId) {
    console.error(colorize('❌ Story ID is required', 'red'));
    console.log(colorize('Usage: node story.js complete <story_id>', 'yellow'));
    process.exit(1);
  }
  updateStoryStatus(completeStoryId, 'completed');
  break;

case 'block':
  const blockStoryId = args[1];
  if (!blockStoryId) {
    console.error(colorize('❌ Story ID is required', 'red'));
    console.log(colorize('Usage: node story.js block <story_id>', 'yellow'));
    process.exit(1);
  }
  updateStoryStatus(blockStoryId, 'blocked');
  break;

case 'update':
  const updateStoryId = args[1];
  const newStatus = args[2];
  if (!updateStoryId || !newStatus) {
    console.error(colorize('❌ Story ID and status are required', 'red'));
    console.log(colorize('Usage: node story.js update <story_id> <status>', 'yellow'));
    process.exit(1);
  }
  updateStoryStatus(updateStoryId, newStatus);
  break;

case 'help':
case '--help':
case '-h':
  showHelp();
  break;

default:
  if (command) {
    console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
  }
  showHelp();
  process.exit(1);
}
