const vscode = require('vscode');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * PAIRED Windsurf Plugin
 *
 * Integrates Windsurf IDE with PAIRED AI agents through the CASCADE bridge.
 * Provides seamless agent interaction, context optimization, and intelligent assistance.
 */

let cascadeClient = null;
let agentPanel = null;
let statusBarItem = null;

/**
 * Extension activation
 */
async function activate(context) {
  console.log('🚀 PAIRED Windsurf plugin is activating...');

  // CHECK DIRECTORY INTRODUCTION STATUS
  const needsIntroduction = await checkDirectoryIntroductionStatus();
  if (needsIntroduction) {
    // Start agents BEFORE introduction
    await startPAIREDAgents();
    await forceAgentIntroduction();
    await markDirectoryAsIntroduced();
  }

  // Initialize status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(loading~spin) PAIRED Connecting...';
  statusBarItem.show();

  // Initialize CASCADE client
  cascadeClient = new CascadeClient();

  // Register commands
  registerCommands(context);

  // Setup event listeners
  setupEventListeners(context);

  // Auto-connect if enabled
  const config = vscode.workspace.getConfiguration('paired');
  if (config.get('autoConnect', true)) {
    await cascadeClient.connect();
  }

  console.log('✅ PAIRED Windsurf plugin activated');
}

/**
 * Register all plugin commands
 */
function registerCommands(context) {
  const commands = [
    vscode.commands.registerCommand('paired.connectAgents', () => cascadeClient.connect()),
    vscode.commands.registerCommand('paired.optimizeContext', optimizeCurrentContext),
    vscode.commands.registerCommand('paired.showAgentPanel', showAgentPanel),

    // Agent-specific commands
    vscode.commands.registerCommand('paired.askSherlock', () => askAgent('sherlock')),
    vscode.commands.registerCommand('paired.askAlex', () => askAgent('alex')),
    vscode.commands.registerCommand('paired.askLeonardo', () => askAgent('leonardo')),
    vscode.commands.registerCommand('paired.askEdison', () => askAgent('edison')),
    vscode.commands.registerCommand('paired.askMaya', () => askAgent('maya')),
    vscode.commands.registerCommand('paired.askVince', () => askAgent('vince')),
    vscode.commands.registerCommand('paired.askMarie', () => askAgent('marie')),

    // Introduction management commands
    vscode.commands.registerCommand('paired.resetIntroduction', resetDirectoryIntroduction),
    vscode.commands.registerCommand('paired.forceIntroduction', () => forceAgentIntroduction())
  ];

  commands.forEach(command => context.subscriptions.push(command));
}

/**
 * Setup event listeners for IDE events
 */
function setupEventListeners(context) {
  // File change events
  const fileWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
    if (cascadeClient.isConnected()) {
      cascadeClient.sendContextUpdate({
        type: 'file_change',
        document: extractDocumentContext(event.document),
        changes: event.contentChanges
      });
    }
  });

  // Selection change events
  const selectionWatcher = vscode.window.onDidChangeTextEditorSelection((event) => {
    if (cascadeClient.isConnected()) {
      cascadeClient.sendContextUpdate({
        type: 'selection_change',
        editor: extractEditorContext(event.textEditor),
        selections: event.selections
      });
    }
  });

  context.subscriptions.push(fileWatcher, selectionWatcher);
}

/**
 * CASCADE WebSocket Client
 */
class CascadeClient {
  constructor() {
    this.ws = null;
    this.instanceId = uuidv4();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    const config = vscode.workspace.getConfiguration('paired');
    const bridgeUrl = config.get('bridgeUrl', 'ws://localhost:7890');

    try {
      statusBarItem.text = '$(loading~spin) PAIRED Connecting...';

      this.ws = new WebSocket(bridgeUrl);

      this.ws.on('open', () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        statusBarItem.text = '$(check) PAIRED Connected';
        statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');

        vscode.window.showInformationMessage('Connected to PAIRED agents');

        // Send initial context
        this.sendInitialContext();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('close', () => {
        this.connected = false;
        statusBarItem.text = '$(error) PAIRED Disconnected';
        statusBarItem.color = new vscode.ThemeColor('errorForeground');

        // Attempt reconnection
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('CASCADE connection error:', error);
        vscode.window.showErrorMessage(`PAIRED connection error: ${error.message}`);
      });

    } catch (error) {
      console.error('Failed to connect to CASCADE bridge:', error);
      vscode.window.showErrorMessage(`Failed to connect to PAIRED: ${error.message}`);
      statusBarItem.text = '$(error) PAIRED Error';
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      statusBarItem.text = `$(loading~spin) PAIRED Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;

      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    } else {
      statusBarItem.text = '$(error) PAIRED Failed';
      vscode.window.showWarningMessage('PAIRED connection failed. Click to retry.', 'Retry')
        .then(selection => {
          if (selection === 'Retry') {
            this.reconnectAttempts = 0;
            this.connect();
          }
        });
    }
  }

  sendInitialContext() {
    const context = this.extractCurrentContext();
    this.sendMessage({
      type: 'WINDSURF_CONTEXT',
      context: context,
      instanceId: this.instanceId
    });
  }

  sendContextUpdate(update) {
    if (this.connected) {
      this.sendMessage({
        type: 'CONTEXT_UPDATE',
        update: update,
        instanceId: this.instanceId
      });
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    switch (message.type) {
    case 'WINDSURF_BRIDGE_CONNECTED':
      console.log('Enhanced bridge connection confirmed');
      break;

    case 'AGENT_RESPONSE':
      this.handleAgentResponse(message);
      break;

    case 'CONTEXT_OPTIMIZED':
      this.handleOptimizedContext(message);
      break;

    case 'PERFORMANCE_ALERT':
      this.handlePerformanceAlert(message);
      break;

    default:
      console.log('Unknown message type:', message.type);
    }
  }

  handleAgentResponse(message) {
    const agent = message.agent;
    const content = message.content;

    // Show agent response in output channel
    const outputChannel = vscode.window.createOutputChannel(`PAIRED - ${agent.name}`);
    outputChannel.appendLine(`${agent.emoji} ${agent.name}: ${content}`);
    outputChannel.show(true);

    // Show notification
    vscode.window.showInformationMessage(
      `${agent.emoji} ${agent.name} responded`,
      'View Response'
    ).then(selection => {
      if (selection === 'View Response') {
        outputChannel.show();
      }
    });
  }

  handleOptimizedContext(message) {
    const metrics = message.optimizationMetrics;
    if (metrics && metrics.reductionPercentage > 0) {
      vscode.window.showInformationMessage(
        `Context optimized: ${metrics.reductionPercentage}% token reduction`
      );
    }
  }

  handlePerformanceAlert(message) {
    vscode.window.showWarningMessage(
      `Performance alert: ${message.metric} exceeded threshold`
    );
  }

  extractCurrentContext() {
    const activeEditor = vscode.window.activeTextEditor;
    const workspaceFolders = vscode.workspace.workspaceFolders;

    return {
      activeFile: activeEditor ? {
        fileName: activeEditor.document.fileName,
        languageId: activeEditor.document.languageId,
        content: activeEditor.document.getText(),
        selection: activeEditor.selection,
        cursor: activeEditor.selection.active
      } : null,

      workspace: workspaceFolders ? {
        name: workspaceFolders[0].name,
        path: workspaceFolders[0].uri.fsPath
      } : null,

      timestamp: Date.now()
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    statusBarItem.text = '$(circle-slash) PAIRED Disconnected';
  }

  isConnected() {
    return this.connected;
  }
}

/**
 * Extract document context
 */
function extractDocumentContext(document) {
  return {
    fileName: document.fileName,
    languageId: document.languageId,
    lineCount: document.lineCount,
    isDirty: document.isDirty
  };
}

/**
 * Extract editor context
 */
function extractEditorContext(editor) {
  return {
    document: extractDocumentContext(editor.document),
    selection: editor.selection,
    visibleRanges: editor.visibleRanges
  };
}

/**
 * Optimize current context
 */
async function optimizeCurrentContext() {
  if (!cascadeClient.isConnected()) {
    vscode.window.showWarningMessage('Not connected to PAIRED agents');
    return;
  }

  const context = cascadeClient.extractCurrentContext();

  cascadeClient.sendMessage({
    type: 'OPTIMIZE_CONTEXT',
    context: context,
    instanceId: cascadeClient.instanceId
  });

  vscode.window.showInformationMessage('Context optimization requested...');
}

/**
 * Ask specific agent
 */
async function askAgent(agentName) {
  if (!cascadeClient.isConnected()) {
    vscode.window.showWarningMessage('Not connected to PAIRED agents');
    return;
  }

  const question = await vscode.window.showInputBox({
    prompt: `Ask ${agentName} a question`,
    placeHolder: 'Enter your question...'
  });

  if (question) {
    const context = cascadeClient.extractCurrentContext();

    cascadeClient.sendMessage({
      type: 'AGENT_MESSAGE',
      targetAgent: agentName,
      message: question,
      context: context,
      instanceId: cascadeClient.instanceId
    });

    vscode.window.showInformationMessage(`Question sent to ${agentName}...`);
  }
}

/**
 * Show agent panel
 */
function showAgentPanel() {
  if (agentPanel) {
    agentPanel.reveal();
  } else {
    agentPanel = vscode.window.createWebviewPanel(
      'pairedAgents',
      'PAIRED Agents',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    agentPanel.webview.html = getAgentPanelHtml();

    agentPanel.onDidDispose(() => {
      agentPanel = null;
    });
  }
}

/**
 * Generate HTML for agent panel
 */
function getAgentPanelHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PAIRED Agents</title>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .agent { 
                border: 1px solid var(--vscode-panel-border);
                margin: 10px 0;
                padding: 15px;
                border-radius: 5px;
                cursor: pointer;
            }
            .agent:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            .agent-name { font-weight: bold; margin-bottom: 5px; }
            .agent-role { color: var(--vscode-descriptionForeground); }
            .status { 
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 10px;
            }
            .online { background-color: #4CAF50; }
            .offline { background-color: #f44336; }
        </style>
    </head>
    <body>
        <h1>PAIRED AI Agents</h1>
        
        <div class="agent" onclick="askAgent('sherlock')">
            <div class="agent-name">
                <span class="status online"></span>
                🕵️ Sherlock (QA Specialist)
            </div>
            <div class="agent-role">Quality assurance, testing, and code review</div>
        </div>
        
        <div class="agent" onclick="askAgent('alex')">
            <div class="agent-name">
                <span class="status online"></span>
                👑 Alex (Project Manager)
            </div>
            <div class="agent-role">Strategic coordination and project management</div>
        </div>
        
        <div class="agent" onclick="askAgent('leonardo')">
            <div class="agent-name">
                <span class="status online"></span>
                🏛️ Leonardo (Architect)
            </div>
            <div class="agent-role">System design and architecture</div>
        </div>
        
        <div class="agent" onclick="askAgent('edison')">
            <div class="agent-name">
                <span class="status online"></span>
                ⚡ Edison (Developer)
            </div>
            <div class="agent-role">Implementation and problem solving</div>
        </div>
        
        <div class="agent" onclick="askAgent('maya')">
            <div class="agent-name">
                <span class="status online"></span>
                🎨 Maya (UX Designer)
            </div>
            <div class="agent-role">User experience and interface design</div>
        </div>
        
        <div class="agent" onclick="askAgent('vince')">
            <div class="agent-name">
                <span class="status online"></span>
                🏈 Vince (Scrum Master)
            </div>
            <div class="agent-role">Process management and team coordination</div>
        </div>
        
        <div class="agent" onclick="askAgent('marie')">
            <div class="agent-name">
                <span class="status online"></span>
                🔬 Marie (Data Analyst)
            </div>
            <div class="agent-role">Data analysis and insights</div>
        </div>
        
        <script>
            function askAgent(agentName) {
                // This would communicate back to the extension
                console.log('Asking agent:', agentName);
            }
        </script>
    </body>
    </html>
  `;
}

/**
 * Extension deactivation
 */
function deactivate() {
  if (cascadeClient && cascadeClient.ws) {
    cascadeClient.ws.close();
  }

  if (statusBarItem) {
    statusBarItem.dispose();
  }

  console.log('PAIRED Windsurf plugin deactivated');
}

/**
 * Check if current directory has been introduced to PAIRED agents
 */
async function checkDirectoryIntroductionStatus() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return false; // No workspace, skip introduction
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const introFlagPath = path.join(workspacePath, '.paired', 'HAS_BEEN_INTRODUCED');

  try {
    const fs = require('fs').promises;
    await fs.access(introFlagPath);
    return false; // Flag exists, already introduced
  } catch {
    return true; // Flag doesn't exist, needs introduction
  }
}

/**
 * Mark directory as introduced by creating flag file
 */
async function markDirectoryAsIntroduced() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const pairedDir = path.join(workspacePath, '.paired');
  const introFlagPath = path.join(pairedDir, 'HAS_BEEN_INTRODUCED');

  try {
    const fs = require('fs').promises;

    // Ensure .paired directory exists
    await fs.mkdir(pairedDir, { recursive: true });

    // Create introduction flag with timestamp
    const flagContent = {
      introduced: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
      agents_introduced: [
        'alex', 'sherlock', 'leonardo', 'edison', 'maya', 'vince', 'marie'
      ]
    };

    await fs.writeFile(introFlagPath, JSON.stringify(flagContent, null, 2));
    console.log('✅ Directory marked as introduced to PAIRED agents');
  } catch (error) {
    console.error('Failed to mark directory as introduced:', error);
  }
}

/**
 * Force Agent Introduction - Immediate display on Windsurf startup
 */
async function forceAgentIntroduction() {
  // Show welcome message with agent team
  const welcomeMessage = `🚀 **PAIRED AI Agent Team Activated**

👑 **Alex (PM)** - Supreme Strategic Commander
🕵️ **Sherlock (QA)** - Master Quality Detective  
🏛️ **Leonardo (Architecture)** - Master System Architect
⚡ **Edison (Dev)** - Master Problem Solver
🎨 **Maya (UX)** - Master of Human Experience
🏈 **Vince (Scrum Master)** - Master Team Coach
🔬 **Marie (Analyst)** - Master Data Scientist

**Ready for collaborative development!**`;

  // Create and show agent introduction panel immediately
  const introPanel = vscode.window.createWebviewPanel(
    'pairedIntro',
    'PAIRED Agent Team',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: false
    }
  );

  introPanel.webview.html = getAgentIntroductionHtml();

  // Show notification with action buttons
  const selection = await vscode.window.showInformationMessage(
    '🚀 PAIRED AI Agent Team is ready for collaboration!',
    'Meet the Team',
    'Start Collaborating',
    'Learn More'
  );

  if (selection === 'Meet the Team') {
    introPanel.reveal();
  } else if (selection === 'Start Collaborating') {
    showAgentPanel();
  } else if (selection === 'Learn More') {
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/internexio/paired'));
  }

  // Auto-close intro panel after 30 seconds
  setTimeout(() => {
    if (introPanel) {
      introPanel.dispose();
    }
  }, 30000);
}

/**
 * Generate HTML for agent introduction panel
 */
function getAgentIntroductionHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PAIRED Agent Team</title>
        <style>
            body { 
                font-family: var(--vscode-font-family); 
                padding: 20px; 
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                margin: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .title {
                font-size: 2.5em;
                font-weight: bold;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            .subtitle {
                font-size: 1.2em;
                opacity: 0.9;
            }
            .agents-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .agent-card {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 20px;
                backdrop-filter: blur(10px);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .agent-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            .agent-emoji {
                font-size: 2.5em;
                display: block;
                text-align: center;
                margin-bottom: 10px;
            }
            .agent-name {
                font-size: 1.3em;
                font-weight: bold;
                text-align: center;
                margin-bottom: 8px;
            }
            .agent-role {
                text-align: center;
                opacity: 0.8;
                margin-bottom: 15px;
            }
            .agent-description {
                font-size: 0.9em;
                line-height: 1.4;
                opacity: 0.9;
            }
            .collaboration-note {
                background: rgba(255,255,255,0.1);
                border-left: 4px solid #4CAF50;
                padding: 15px;
                margin-top: 30px;
                border-radius: 5px;
            }
            .pulse {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title pulse">🚀 PAIRED AI Agent Team</div>
            <div class="subtitle">Your collaborative development partners are ready!</div>
        </div>
        
        <div class="agents-grid">
            <div class="agent-card">
                <div class="agent-emoji">👑</div>
                <div class="agent-name">Alex (PM)</div>
                <div class="agent-role">Supreme Strategic Commander</div>
                <div class="agent-description">
                    Coordinates all strategic decisions, delegates domain authority, 
                    and ensures project success through masterful orchestration.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">🕵️</div>
                <div class="agent-name">Sherlock (QA)</div>
                <div class="agent-role">Master Quality Detective</div>
                <div class="agent-description">
                    Investigates code quality, uncovers hidden bugs, and ensures 
                    security through methodical analysis and testing.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">🏛️</div>
                <div class="agent-name">Leonardo (Architecture)</div>
                <div class="agent-role">Master System Architect</div>
                <div class="agent-description">
                    Designs elegant system architectures, plans technical foundations, 
                    and envisions scalable solutions.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">⚡</div>
                <div class="agent-name">Edison (Dev)</div>
                <div class="agent-role">Master Problem Solver</div>
                <div class="agent-description">
                    Implements solutions with persistent innovation, solves complex 
                    technical challenges, and brings ideas to life.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">🎨</div>
                <div class="agent-name">Maya (UX)</div>
                <div class="agent-role">Master of Human Experience</div>
                <div class="agent-description">
                    Crafts intuitive user experiences, designs beautiful interfaces, 
                    and ensures human-centered development.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">🏈</div>
                <div class="agent-name">Vince (Scrum Master)</div>
                <div class="agent-role">Master Team Coach</div>
                <div class="agent-description">
                    Manages development processes, coordinates team workflows, 
                    and ensures efficient project execution.
                </div>
            </div>
            
            <div class="agent-card">
                <div class="agent-emoji">🔬</div>
                <div class="agent-name">Marie (Analyst)</div>
                <div class="agent-role">Master Data Scientist</div>
                <div class="agent-description">
                    Analyzes data patterns, provides insights through scientific 
                    methods, and guides decisions with evidence.
                </div>
            </div>
        </div>
        
        <div class="collaboration-note">
            <strong>🤝 Collaborative Development Ready</strong><br>
            Your PAIRED agents work together seamlessly. Alex coordinates strategic decisions, 
            while each agent brings specialized expertise to your development process. 
            They collaborate directly with each other and maintain their unique personalities 
            throughout your project.
        </div>
    </body>
    </html>
  `;
}

/**
 * Start PAIRED agents using start-agents.sh
 */
async function startPAIREDAgents() {
  try {
    console.log('🚀 Starting PAIRED agents...');

    // Check if ~/.paired exists
    const pairedDir = path.join(require('os').homedir(), '.paired');
    const autoStartScript = path.join(pairedDir, 'scripts', 'start-agents.sh');

    if (require('fs').existsSync(autoStartScript)) {
      // Run start-agents.sh with auto flag
      const { stdout, stderr } = await execAsync(`bash "${autoStartScript}" --auto`, {
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ PAIRED agents started successfully');
      if (stdout) console.log('Agent startup output:', stdout);

      // Wait a moment for agents to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

    } else {
      console.warn('⚠️ Auto-start script not found at:', autoStartScript);
      vscode.window.showWarningMessage('PAIRED agents auto-start script not found. Please run paired-start manually.');
    }
  } catch (error) {
    console.error('❌ Failed to start PAIRED agents:', error.message);
    vscode.window.showErrorMessage(`Failed to start PAIRED agents: ${error.message}`);
  }
}

/**
 * Reset directory introduction flag for testing
 */
async function resetDirectoryIntroduction() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage('No workspace folder open');
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  const introFlagPath = path.join(workspacePath, '.paired', 'HAS_BEEN_INTRODUCED');

  try {
    const fs = require('fs').promises;
    await fs.unlink(introFlagPath);
    vscode.window.showInformationMessage('✅ Introduction flag reset. Restart Windsurf to see introduction again.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      vscode.window.showInformationMessage('Introduction flag already cleared.');
    } else {
      vscode.window.showErrorMessage(`Failed to reset introduction: ${error.message}`);
    }
  }
}

module.exports = {
  activate,
  deactivate
};
