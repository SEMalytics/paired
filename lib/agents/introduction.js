/**
 * PAIRED Agent Team Introduction for First-Time Windsurf Users
 *
 * Automatically introduces the full PAIRED agent team when Windsurf opens
 * for the first time after PAIRED installation
 */

const fs = require('fs');
const path = require('path');

class PAIREDAgentIntroduction {
  constructor() {
    this.agentTeam = [
      { emoji: '👑', name: 'Alex', role: 'PM', description: 'Strategic project coordination and team leadership' },
      { emoji: '🕵️', name: 'Sherlock', role: 'QA', description: 'Detective-like quality investigation and security validation' },
      { emoji: '⚡', name: 'Edison', role: 'Dev', description: 'Persistent problem-solving and implementation expertise' },
      { emoji: '🏛️', name: 'Leonardo', role: 'Architecture', description: 'Visionary system design and technical architecture' },
      { emoji: '🎨', name: 'Maya', role: 'UX', description: 'Empathetic human experience design and user interface' },
      { emoji: '🏈', name: 'Vince', role: 'Scrum Master', description: 'Disciplined team coaching and process management' },
      { emoji: '🔬', name: 'Marie', role: 'Analyst', description: 'Scientific data analysis and metrics interpretation' }
    ];
  }

  generateIntroductionMessage() {
    const intro = `# 🎉 Welcome to PAIRED - Your AI Development Team!

You now have access to a complete AI development team with specialized expertise:

## Your Agent Team:
${this.agentTeam.map(agent =>
    `- ${agent.emoji} **${agent.name} (${agent.role})**: ${agent.description}`
  ).join('\n')}

## How to Collaborate:
- **Direct requests**: "@Alex, what's our project status?" or "Sherlock, review this security implementation"
- **Domain expertise**: Each agent specializes in their field and collaborates with teammates
- **Team coordination**: Alex coordinates strategic decisions while domain experts execute autonomously

## Getting Started:
1. Try asking: "Alex, introduce the team and our capabilities"
2. Request specific expertise: "Leonardo, design the architecture for..." 
3. Get quality reviews: "Sherlock, validate this implementation"
4. UX guidance: "Maya, improve this user interface"

Your PAIRED agents are ready to collaborate! 🚀`;

    return intro;
  }

  async checkFirstTimeUser() {
    const flagFile = path.join(process.env.HOME, '.paired', 'windsurf_introduced');
    return !fs.existsSync(flagFile);
  }

  async markIntroductionComplete() {
    const flagFile = path.join(process.env.HOME, '.paired', 'windsurf_introduced');
    const flagDir = path.dirname(flagFile);

    if (!fs.existsSync(flagDir)) {
      fs.mkdirSync(flagDir, { recursive: true });
    }

    fs.writeFileSync(flagFile, new Date().toISOString());
  }

  async shouldShowIntroduction() {
    // Check if PAIRED is installed
    const pairedDir = path.join(process.env.HOME, '.paired');
    if (!fs.existsSync(pairedDir)) {
      return false;
    }

    // Always show introduction on Windsurf startup (not just first time)
    return true;
  }

  async displayIntroduction() {
    if (await this.shouldShowIntroduction()) {
      console.log(this.generateIntroductionMessage());
      await this.markIntroductionComplete();
      return true;
    }
    return false;
  }
}

// Export for integration
module.exports = PAIREDAgentIntroduction;

// Auto-run if called directly
if (require.main === module) {
  const introduction = new PAIREDAgentIntroduction();
  introduction.displayIntroduction();
}
