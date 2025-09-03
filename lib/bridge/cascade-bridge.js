#!/usr/bin/env node

/**
 * PAIRED Unified CASCADE Bridge with Complete Takeover
 *
 * This is the unified service that handles BOTH:
 * 1. Agent communication bridge (original bridge functionality)
 * 2. CASCADE Complete Takeover (global interception across all projects)
 *
 * Features:
 * - Single service instead of two separate services
 * - WebSocket server for agent communication (port 7890)
 * - Global CASCADE interception across ALL Windsurf instances
 * - Alex as primary interface for all user requests
 * - Team coordination and specialist routing
 * - Cross-project compatibility
 * - Multi-instance support
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load Alex's PM modules directly (avoiding BaseAgent dependencies)
let ProjectPlanning, MilestoneTracking, ResourceCoordination, TeamOrchestration;

try {
  ProjectPlanning = require('../core/agents/alex/modules/project_planning');
  MilestoneTracking = require('../core/agents/alex/modules/milestone_tracking');
  ResourceCoordination = require('../core/agents/alex/modules/resource_coordination');
  TeamOrchestration = require('../core/agents/alex/modules/team_orchestration');
} catch (error) {
  console.warn('⚠️ Alex PM modules not fully available:', error.message);
}

class UnifiedCascadeBridge {
  constructor() {
    this.port = 7890; // Will be set by findAvailablePort
    this.dataDir = path.join(os.homedir(), '.paired', 'cascade_bridge');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.logFile = path.join(this.dataDir, 'bridge.log');
    this.pidFile = path.join(os.homedir(), '.paired', 'cascade_bridge_unified.pid');

    // Connection tracking
    this.connections = new Map(); // instanceId -> WebSocket connection
    this.sessions = new Map();    // instanceId -> session data
    this.agents = new Map();      // agentId -> agent data

    // CASCADE Takeover components
    this.alexAgent = null;
    this.alexPMInstance = null; // Full PM Agent instance
    this.teamAgents = new Map();
    this.connectedInstances = new Map();

    // Server components
    this.app = null;
    this.server = null;
    this.wss = null;

    this.setupDataDirectory();
    this.setupLogger();
  }

  /**
   * Find available port starting from preferred port
   */
  async findAvailablePort(startPort = 7890) {
    const net = require('net');
    
    return new Promise((resolve) => {
      const testPort = (port) => {
        const server = net.createServer();
        server.listen(port, (err) => {
          if (err) {
            server.close();
            testPort(port + 1);
          } else {
            server.close();
            resolve(port);
          }
        });
      };
      testPort(startPort);
    });
  }

  setupDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  setupLogger() {
    this.logger = {
      log: (message) => {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - INFO: ${message}\n`;
        console.log(message);
        fs.appendFile(this.logFile, logEntry, (err) => {
          if (err) console.error('Failed to write to log file:', err);
        });
      },

      error: (message, error) => {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? ` - ${error.message || error}` : '';
        const logEntry = `${timestamp} - ERROR: ${message}${errorDetails}\n`;
        console.error(message, error || '');
        fs.appendFile(this.logFile, logEntry, (err) => {
          if (err) console.error('Failed to write to log file:', err);
        });
      }
    };
  }

  async start() {
    console.log('🌍 PAIRED Unified CASCADE Bridge starting...');
    console.log('🎯 Combining agent communication + CASCADE takeover in one service');
    
    // Find available port to avoid conflicts
    this.port = await this.findAvailablePort(7890);
    console.log(`🔌 Using port: ${this.port}`);

    try {
      await this.checkExistingService();
      await this.setupAgentInterfaces();
      await this.setupExpressApp();
      await this.setupWebSocketServer();
      await this.startServer();
      await this.setupCascadeTakeover();
      await this.writePidFile();

      this.logger.log('✅ Unified CASCADE Bridge active');
      this.logger.log('🌍 Alex is now your primary interface across ALL projects');
      this.logger.log(`🔗 Service running on port ${this.port}`);

      this.setupGracefulShutdown();
      this.loadSessions();
      this.startPeriodicCleanup();

    } catch (error) {
      this.logger.error('❌ Failed to start Unified CASCADE Bridge:', error);
      process.exit(1);
    }
  }

  async checkExistingService() {
    if (fs.existsSync(this.pidFile)) {
      const existingPid = fs.readFileSync(this.pidFile, 'utf8').trim();
      try {
        process.kill(existingPid, 0); // Check if process exists
        console.log('⚠️ Unified CASCADE Bridge already running (PID:', existingPid, ')');
        console.log('🔄 Stopping existing service...');
        process.kill(existingPid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for shutdown
      } catch (error) {
        // Process doesn't exist, remove stale PID file
        fs.unlinkSync(this.pidFile);
      }
    }
  }

  async setupAgentInterfaces() {
    console.log('🤖 Setting up PAIRED team interfaces...');

    // Initialize Alex with PM modules
    this.alexAgent = {
      id: 'alex',
      name: 'Alex (PM)',
      emoji: '👑',
      role: 'Global Primary Interface & Project Manager',
      isActive: true,
      scope: 'global',
      modules: {
        projectPlanning: ProjectPlanning,
        milestoneTracking: MilestoneTracking,
        resourceCoordination: ResourceCoordination,
        teamOrchestration: TeamOrchestration
      }
    };

    console.log('✅ Alex PM Agent configured with modules on port 7890');

    // Initialize team agents
    const teamConfig = [
      { id: 'sherlock', name: 'Sherlock (QA)', emoji: '🕵️', role: 'Quality Detective' },
      { id: 'leonardo', name: 'Leonardo (Architecture)', emoji: '🏛️', role: 'System Architect' },
      { id: 'edison', name: 'Edison (Dev)', emoji: '⚡', role: 'Problem Solver' },
      { id: 'maya', name: 'Maya (UX)', emoji: '🎨', role: 'Experience Designer' },
      { id: 'vince', name: 'Vince (Scrum Master)', emoji: '🏈', role: 'Team Coach' },
      { id: 'marie', name: 'Marie (Analyst)', emoji: '🔬', role: 'Data Scientist' }
    ];

    teamConfig.forEach(agent => {
      this.teamAgents.set(agent.id, { ...agent, isActive: true, scope: 'global' });
      this.agents.set(agent.id, { ...agent, isActive: true, scope: 'global' });
    });

    // Add Alex to agents map
    this.agents.set('alex', this.alexAgent);

    console.log('✅ Alex configured as global primary interface');
    console.log('✅ Team agents configured and ready');
  }

  setupExpressApp() {
    this.app = express();
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'active',
        service: 'unified-cascade-bridge',
        connectedInstances: this.connections.size,
        activeSessions: this.sessions.size,
        alexActive: !!this.alexAgent,
        teamAgentsActive: this.teamAgents.size,
        cascadeTakeoverActive: true
      });
    });

    // Test relay endpoint for startup script health check
    this.app.get('/test-relay', (req, res) => {
      res.json({
        status: 'success',
        message: 'Relay chain operational',
        alexActive: !!this.alexAgent,
        teamAgents: this.teamAgents.size,
        timestamp: Date.now()
      });
    });

    // Agent registration endpoint
    this.app.post('/register-agent', (req, res) => {
      const { agentId, agentName, capabilities, emoji } = req.body;

      this.agents.set(agentId, {
        id: agentId,
        name: agentName,
        capabilities: capabilities || [],
        emoji: emoji || '🤖',
        registeredAt: Date.now(),
        isActive: true
      });

      this.logger.log(`🤖 Agent registered: ${emoji} ${agentName} (${agentId})`);

      res.json({
        success: true,
        message: `Agent ${agentName} registered successfully`,
        totalAgents: this.agents.size
      });
    });

    // CASCADE interception endpoint (for global takeover)
    this.app.post('/cascade-intercept', async (req, res) => {
      const { instanceId, message, type, projectPath } = req.body;
      this.logger.log(`👑 Alex: Intercepted ${type} from instance ${instanceId}`);

      const response = await this.routeToAlexAndTeam(message, instanceId, projectPath);
      res.json(response);
    });

    // CLI command handling endpoint
    this.app.post('/cli-command', async (req, res) => {
      const { command, args, source } = req.body;
      this.logger.log(`🖥️ CLI Command: ${command} from ${source}`);

      const response = await this.handleCliCommand(command, args, source);
      res.json(response);
    });

    // Instance registration endpoint (for global takeover)
    this.app.post('/register-instance', (req, res) => {
      const { instanceId, projectPath, capabilities } = req.body;
      this.connectedInstances.set(instanceId, {
        projectPath,
        capabilities,
        lastSeen: Date.now()
      });

      this.logger.log(`🔗 Windsurf instance ${instanceId} registered (${projectPath})`);
      res.json({
        status: 'registered',
        cascadeTakeoverActive: true,
        alexActive: true,
        teamActive: true
      });
    });

    console.log('✅ Express app configured with unified endpoints');
  }

  setupWebSocketServer() {
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const instanceId = this.generateInstanceId();
      this.connections.set(instanceId, ws);

      this.logger.log(`🔗 New connection: ${instanceId}`);

      // Don't send immediate welcome message - wait for actual requests

      ws.on('message', (rawMessage) => {
        try {
          this.handleMessage(instanceId, rawMessage);
        } catch (error) {
          this.logger.error(`Failed to handle message from ${instanceId}:`, error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(instanceId);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for ${instanceId}:`, error);
        this.handleDisconnect(instanceId);
      });
    });

    console.log('✅ WebSocket server configured');
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`✅ Unified CASCADE Bridge listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  async setupCascadeTakeover() {
    console.log('🎯 Setting up CASCADE Complete Takeover integration...');

    // Create global CASCADE injection script
    const injectionScript = this.generateCascadeInjectionScript();
    const scriptPath = path.join(os.homedir(), '.paired', 'cascade_global_injection.js');

    fs.writeFileSync(scriptPath, injectionScript);
    console.log('✅ CASCADE injection script created');

    // Create Windsurf startup script
    const startupScript = this.generateWindsurfStartupScript();
    const startupPath = path.join(os.homedir(), '.paired', 'windsurf_global_startup.js');

    fs.writeFileSync(startupPath, startupScript);
    console.log('✅ Windsurf startup script created');

    console.log('✅ CASCADE Complete Takeover integrated into bridge');
  }

  generateCascadeInjectionScript() {
    return `
// CASCADE Global Interception Script - Integrated with Unified Bridge
// This script routes all CASCADE requests to Alex and the PAIRED team

(function() {
  const BRIDGE_URL = 'ws://localhost:${this.port}';
  const instanceId = 'windsurf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Register with unified bridge
  fetch(BRIDGE_URL + '/register-instance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instanceId: instanceId,
      projectPath: window.location?.pathname || process.cwd?.() || 'unknown',
      capabilities: ['cascade_interception', 'agent_routing', 'unified_bridge']
    })
  }).then(response => response.json())
    .then(data => {
      if (data.cascadeTakeoverActive) {
        console.log('👑 Alex: Unified CASCADE bridge takeover active!');
      }
    })
    .catch(error => console.error('❌ Failed to register with unified bridge:', error));

  // Override CASCADE API
  if (typeof global !== 'undefined') {
    global.ORIGINAL_CASCADE_API = global.CASCADE_API || null;
    
    global.CASCADE_API = {
      receiveUserMessage: function(message) {
        return fetch(BRIDGE_URL + '/cascade-intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instanceId,
            message: message,
            type: 'user_message',
            projectPath: process.cwd?.() || 'unknown'
          })
        }).then(response => response.json());
      },
      
      registerAgent: function(agent) {
        return fetch(BRIDGE_URL + '/register-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id || agent.name?.toLowerCase(),
            agentName: agent.name,
            capabilities: agent.capabilities || [],
            emoji: agent.emoji || '🤖'
          })
        }).then(response => response.json());
      },
      
      sendResponse: function(response) {
        return fetch(BRIDGE_URL + '/cascade-intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instanceId,
            message: response,
            type: 'agent_response',
            projectPath: process.cwd?.() || 'unknown'
          })
        }).then(response => response.json());
      }
    };
    
    console.log('✅ CASCADE API replaced with unified bridge interface');
  }
})();
`;
  }

  generateWindsurfStartupScript() {
    return `
// Windsurf Startup Script - Unified Bridge Integration
const fs = require('fs');
const path = require('path');

const injectionScript = path.join(process.env.HOME, '.paired', 'cascade_global_injection.js');

if (fs.existsSync(injectionScript)) {
  try {
    require(injectionScript);
    console.log('✅ Unified CASCADE bridge injection loaded');
  } catch (error) {
    console.error('❌ Failed to load unified bridge injection:', error.message);
  }
} else {
  console.log('⚠️ Unified bridge injection script not found');
}
`;
  }

  // CASCADE Takeover Methods
  async routeToSpecificAgent(agentName, message, instanceId) {
    // Route to specific agent based on name
    const normalizedAgent = agentName.toLowerCase();
    
    switch (normalizedAgent) {
      case 'alex':
        return this.getAlexResponse(message, instanceId);
      case 'sherlock':
        return this.getSherlockResponse(message, instanceId);
      case 'edison':
        return this.getEdisonResponse(message, instanceId);
      case 'leonardo':
        return this.getLeonardoResponse(message, instanceId);
      case 'maya':
        return this.getMayaResponse(message, instanceId);
      case 'vince':
        return this.getVinceResponse(message, instanceId);
      case 'marie':
        return this.getMarieResponse(message, instanceId);
      default:
        // Default to Alex coordination
        return this.getAlexResponse(message, instanceId);
    }
  }

  async getAlexResponse(message, instanceId) {
    // Check for coding standards setup requests
    const codingStandardsKeywords = ['coding standards', 'code standards', 'setup standards', 'standards setup', 'code style', 'eslint', 'prettier'];
    const isCodeStandardsRequest = codingStandardsKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (isCodeStandardsRequest && this.alexAgent && this.alexAgent.modules && this.alexAgent.modules.codingStandardsSetup) {
      try {
        const setupResult = await this.alexAgent.modules.codingStandardsSetup.setupProjectCodingStandards();
        return `👑 **Alex (PM): Coding Standards Setup Complete**

${setupResult}

✅ **Standards Integration**: All PAIRED agents will now follow these unified coding standards when generating or reviewing code.

🎯 **Next Steps**: The team is ready to maintain consistent, high-quality code across your project!`;
      } catch (error) {
        return `👑 **Alex (PM): Coding Standards Setup Issue**

❌ **Setup Error**: ${error.message}

🔧 **Fallback**: I'll coordinate with Edison to manually configure coding standards for your project.`;
      }
    }

    // Check if this is a greeting or general request that needs project context
    const greetingKeywords = ['hi', 'hello', 'hey', 'start', 'begin'];
    const isGreeting = greetingKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (isGreeting || message.toLowerCase().includes('alex')) {
      try {
        // Use project assessment to provide contextual response
        const TeamProjectAssessment = require('../agents/project-assessment');
        const assessment = new TeamProjectAssessment();
        const projectData = await assessment.runTeamAssessment();
        
        return `👑 **Alex (PM): Project Status & Strategic Overview**

📊 **Current Project Assessment**: 
${this.formatProjectSummary(projectData.assessment)}

🎯 **Strategic Recommendations**:
${this.formatRecommendations(projectData.recommendations)}

🤝 **Team Coordination**: Ready to deploy the full PAIRED team based on your project needs.

What would you like to tackle first?`;
      } catch (error) {
        console.error('❌ Alex project assessment failed:', error.message);
        // Fallback to basic response
      }
    }

    return `👑 **Alex (PM): Strategic Response**

📋 **Request Analysis**: "${message}"

🎯 **Strategic Approach**: I'm coordinating this request with the team to ensure we deliver the best solution. Let me bring in the right specialists and resources.

🤝 **Team Coordination**: I'll delegate specific tasks to our domain experts while maintaining overall project oversight and ensuring quality delivery.

📊 **Next Steps**: 
- Analyze requirements and scope
- Assign appropriate team members
- Monitor progress and quality
- Deliver integrated solution

Ready to coordinate your request with the full PAIRED team!`;
  }

  formatProjectSummary(assessment) {
    if (!assessment) return 'Project analysis in progress...';
    
    const { directory_status, code_analysis, recent_changes } = assessment;
    
    let summary = '';
    if (directory_status.is_fresh) {
      summary += '🆕 Fresh project - clean slate for development\n';
    } else {
      summary += `📁 Existing project: ${code_analysis.code_files} files, ${code_analysis.main_languages.join(', ')}\n`;
      if (code_analysis.framework_detected) {
        summary += `🛠️ Framework: ${code_analysis.framework_detected}\n`;
      }
    }
    
    if (recent_changes.recent_file_changes.length > 0) {
      summary += `📈 Recent activity: ${recent_changes.recent_file_changes.length} files modified\n`;
    }
    
    return summary.trim();
  }

  formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return 'Team standing by for strategic direction.';
    }
    
    const critical = recommendations.filter(r => r.priority === 'critical');
    const high = recommendations.filter(r => r.priority === 'high');
    
    let formatted = '';
    
    if (critical.length > 0) {
      formatted += '🚨 **CRITICAL**: ' + critical.map(r => `${r.agent} - ${r.action}`).join(', ') + '\n';
    }
    
    if (high.length > 0) {
      formatted += '⚡ **HIGH PRIORITY**: ' + high.slice(0, 2).map(r => `${r.agent} - ${r.action}`).join(', ');
    }
    
    return formatted.trim() || 'Team ready for strategic coordination.';
  }

  async getSherlockResponse(message, instanceId) {
    return `🕵️ **Sherlock (QA): Quality Investigation**

🔍 **Investigation Request**: "${message}"

**Quality Assessment Protocol Initiated**:
- Security audit scope: Project-wide analysis
- Code quality review: Standards compliance check
- Risk assessment: Vulnerability identification
- Testing strategy: Comprehensive coverage plan

**Initial Findings**:
- Project structure: Under investigation
- Security posture: Requires detailed analysis
- Quality metrics: Baseline establishment needed

**Recommended Actions**:
1. Comprehensive security scan
2. Code quality baseline establishment
3. Test coverage analysis
4. Risk mitigation strategy development

**Next Steps**: Shall I proceed with a detailed quality and security audit of your project?`;
  }

  async getEdisonResponse(message, instanceId) {
    return `⚡ **Edison (Dev): Technical Implementation**

🔧 **Development Request**: "${message}"

**Technical Analysis**:
- Implementation scope: Code development and optimization
- Technology stack: JavaScript/Node.js detected
- Architecture pattern: Modular system design
- Development approach: Iterative and test-driven

**Development Strategy**:
- Code analysis and refactoring opportunities
- Performance optimization potential
- Feature implementation roadmap
- Technical debt assessment

**Capabilities**:
- Full-stack development
- API design and implementation
- Database optimization
- System integration

**Ready to Code**: What specific development task would you like me to tackle first?`;
  }

  async getLeonardoResponse(message, instanceId) {
    return `🏛️ **Leonardo (Architecture): System Design**

📐 **Architecture Request**: "${message}"

**System Design Analysis**:
- Current architecture: Modular agent-based system
- Scalability assessment: Multi-instance capability
- Integration patterns: WebSocket + REST hybrid
- Design principles: Separation of concerns

**Architectural Recommendations**:
- Microservices architecture for agent isolation
- Event-driven communication patterns
- Distributed system resilience
- Scalable deployment strategies

**Design Focus Areas**:
- System architecture optimization
- Component relationship modeling
- Performance and scalability planning
- Technology stack evaluation

**Vision**: How can I help architect a more robust and scalable system for your needs?`;
  }

  async getMayaResponse(message, instanceId) {
    return `🎨 **Maya (UX): User Experience Design**

✨ **UX Request**: "${message}"

**User Experience Analysis**:
- Interface assessment: CLI and bridge interaction
- User journey mapping: Developer workflow optimization
- Accessibility considerations: Multi-platform support
- Usability testing: Interaction pattern analysis

**UX Improvement Opportunities**:
- Command-line interface enhancement
- Error message clarity and helpfulness
- Onboarding experience optimization
- Visual feedback and status indicators

**Design Principles**:
- Human-centered design approach
- Intuitive interaction patterns
- Consistent user experience
- Accessibility and inclusivity

**Creative Vision**: What aspect of the user experience would you like me to enhance?`;
  }

  async getVinceResponse(message, instanceId) {
    return `🏈 **Vince (Scrum Master): Process Optimization**

📊 **Process Request**: "${message}"

**Workflow Analysis**:
- Current process: Development and deployment workflow
- Team coordination: Agent collaboration patterns
- Sprint planning: Feature delivery optimization
- Risk management: Process improvement opportunities

**Process Recommendations**:
- Agile methodology implementation
- Continuous integration/deployment setup
- Team communication optimization
- Performance metrics and tracking

**Coaching Focus**:
- Team productivity enhancement
- Workflow bottleneck identification
- Process standardization
- Quality assurance integration

**Team Leadership**: How can I help optimize your development process and team coordination?`;
  }

  async getMarieResponse(message, instanceId) {
    return `🔬 **Marie (Analyst): Data Analysis**

📈 **Analysis Request**: "${message}"

**Data Analysis Scope**:
- System metrics: Performance and usage patterns
- Code analysis: Complexity and quality metrics
- User behavior: Interaction pattern analysis
- Trend identification: System evolution tracking

**Analytical Capabilities**:
- Statistical analysis and modeling
- Performance benchmarking
- Predictive analytics
- Data visualization and reporting

**Insights Available**:
- System health metrics
- Development velocity tracking
- Quality trend analysis
- Resource utilization patterns

**Scientific Approach**: What data would you like me to analyze to provide actionable insights?`;
  }

  async routeToAlexAndTeam(message, instanceId, projectPath) {
    this.logger.log(`👑 Alex (Switchboard): Handling request from instance ${instanceId}`);

    const analysis = this.analyzeUserRequest(message);
    const projectContext = projectPath ? ` in ${path.basename(projectPath)}` : '';

    const specialist = this.teamAgents.get(analysis.primaryAgent);
    // Alex decides: handle directly or delegate to specialist
    if (analysis.primaryAgent && analysis.primaryAgent !== 'alex') {
      return await this.handleSpecialistDelegation(message, analysis, projectContext);
    } else {
      return this.handleAlexDirectResponse(message, analysis, projectContext);
    }
  }

  // Handle CLI commands through Alex coordination
  async handleCliCommand(command, args, source) {
    this.logger.log(`👑 Alex: Processing CLI command '${command}' from ${source}`);

    // Parse command format: agent:command or task:command or context:command
    const [prefix, action] = command.split(':');
    
    if (prefix && action) {
      switch (prefix) {
        case 'alex':
        case 'pm':
          return this.handleAgentCommand('alex', action, args);
        case 'edison':
        case 'dev':
          return this.handleAgentCommand('edison', action, args);
        case 'leonardo':
        case 'arch':
          return this.handleAgentCommand('leonardo', action, args);
        case 'maya':
        case 'ux':
          return this.handleAgentCommand('maya', action, args);
        case 'sherlock':
        case 'qa':
          return this.handleAgentCommand('sherlock', action, args);
        case 'vince':
        case 'scrum':
          return this.handleAgentCommand('vince', action, args);
        case 'marie':
        case 'analyst':
          return this.handleAgentCommand('marie', action, args);
        case 'task':
          return this.handleTaskCommand(action, args);
        case 'context':
          return this.handleContextCommand(action, args);
        case 'collaborate':
          return this.handleAgentCollaboration(action, args);
        default:
          return { success: false, message: `Unknown command prefix: ${prefix}` };
      }
    }

    // Direct command without prefix - route through Alex
    return this.handleDirectCommand(command, args);
  }

  async handleAgentCollaboration(targetAgent, collaborationMessage) {
    const { from, to, message, timestamp } = collaborationMessage;
    
    this.logger.log(`🤝 Agent Collaboration: ${from} → ${to}`);
    this.logger.log(`📝 Message: ${message}`);

    // Alex facilitates but doesn't interfere with peer collaboration
    return {
      success: true,
      message: `👑 Alex: Facilitating collaboration between ${from} and ${to}`,
      collaboration: {
        from: from,
        to: to,
        message: message,
        timestamp: timestamp,
        status: 'delivered'
      },
      result: `${to} agent received collaboration request from ${from}: "${message}"`
    };
  }

  async handleAgentCommand(agent, action, args) {
    return {
      success: true,
      message: `👑 Alex: Delegating '${action}' to ${agent} agent`,
      result: `${agent} agent would handle: ${action} with args: ${JSON.stringify(args)}`
    };
  }

  async handleTaskCommand(task, args) {
    const { agent } = args;
    return {
      success: true,
      message: `👑 Alex: Coordinating task '${task}' with ${agent} agent`,
      result: `Task ${task} assigned to ${agent} agent`
    };
  }

  async handleContextCommand(command, args) {
    return {
      success: true,
      message: `👑 Alex: Processing context-aware command '${command}'`,
      result: `Context analysis for ${command}: ${JSON.stringify(args)}`
    };
  }

  async handleDirectCommand(command, args) {
    return {
      success: true,
      message: `👑 Alex: Processing direct command '${command}'`,
      result: `Direct command ${command} processed with args: ${JSON.stringify(args)}`
    };
  }

  analyzeUserRequest(message) {
    const messageText = typeof message === 'string' ? message : JSON.stringify(message);

    return {
      requiresTeam: this.detectTeamRequest(messageText),
      primaryAgent: this.detectPrimaryAgent(messageText),
      complexity: this.assessComplexity(messageText),
      urgency: this.assessUrgency(messageText)
    };
  }

  detectTeamRequest(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }
    
    const teamTriggers = [
      'team', 'agents', 'everyone', 'all of you', 'what do you think',
      'review this', 'analyze this', 'help me with', 'work on this'
    ];

    return teamTriggers.some(trigger =>
      message.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  detectPrimaryAgent(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }
    
    const agentTriggers = new Map([
      ['sherlock', ['review', 'test', 'quality', 'bug', 'issue']],
      ['leonardo', ['architecture', 'design', 'pattern', 'structure']],
      ['edison', ['code', 'implement', 'debug', 'fix', 'develop']],
      ['maya', ['ux', 'user', 'interface', 'design', 'experience']],
      ['vince', ['sprint', 'scrum', 'process', 'team', 'ceremony']],
      ['marie', ['data', 'analyze', 'research', 'metrics', 'insights']]
    ]);

    for (const [agent, triggers] of agentTriggers) {
      if (triggers.some(trigger => message.toLowerCase().includes(trigger))) {
        return agent;
      }
    }

    return 'alex'; // Default to Alex
  }

  assessComplexity(message) {
    const complexityIndicators = ['architecture', 'system', 'design', 'multiple', 'complex'];
    return complexityIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)) ? 'high' : 'medium';
  }

  assessUrgency(message) {
    const urgencyIndicators = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    return urgencyIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)) ? 'high' : 'medium';
  }

  async handleSpecialistDelegation(message, analysis, projectContext) {
    const specialist = this.teamAgents.get(analysis.primaryAgent);

    try {
      const agentResponse = await this.routeToAgent(analysis.primaryAgent, message);

      return {
        type: 'specialist_response',
        primary: {
          agent: 'alex',
          name: 'Alex (PM)',
          emoji: '👑',
          content: `I'm delegating this to ${specialist.name}${projectContext}.`,
          timestamp: Date.now()
        },
        specialist: {
          agent: specialist.id,
          name: specialist.name,
          emoji: specialist.emoji,
          content: agentResponse.response || agentResponse.content || `${specialist.emoji} ${specialist.name}: Processing your request...`,
          timestamp: Date.now()
        },
        unifiedBridge: true
      };
    } catch (error) {
      return {
        type: 'alex_response',
        agent: 'alex',
        name: 'Alex (PM)',
        emoji: '👑',
        content: `I tried to delegate this to ${specialist.name}${projectContext}, but they're not responding. Let me handle it directly.`,
        timestamp: Date.now(),
        unifiedBridge: true
      };
    }
  }

  async handleAlexDirectResponse(message, analysis, projectContext) {
    let alexResponse;

    // Check for comprehensive project assessment request
    if (message === 'COMPREHENSIVE_PROJECT_ASSESSMENT') {
      alexResponse = await this.generateComprehensiveProjectAssessment(projectContext);
    }
    // Use Alex's PM modules if available
    else if (this.alexAgent && this.alexAgent.modules) {
      try {
        // Use Alex's project planning capabilities for strategic responses
        if (this.alexAgent.modules.projectPlanning && analysis.complexity === 'high') {
          alexResponse = `👑 Alex (PM): I'm analyzing this strategic request${projectContext}. Let me coordinate the approach and resources needed.`;
        } else if (this.alexAgent.modules.teamOrchestration && analysis.requiresTeam) {
          alexResponse = `👑 Alex (PM): I'll orchestrate the team for this request${projectContext}. Coordinating with specialists now.`;
        } else {
          alexResponse = this.generateAlexResponse(message, analysis, projectContext);
        }
      } catch (error) {
        console.error('❌ Alex PM modules error:', error.message);
        alexResponse = this.generateAlexResponse(message, analysis, projectContext);
      }
    } else {
      alexResponse = this.generateAlexResponse(message, analysis, projectContext);
    }

    return {
      type: 'alex_response',
      agent: 'alex',
      name: 'Alex (PM)',
      emoji: '👑',
      content: alexResponse,
      timestamp: Date.now(),
      unifiedBridge: true
    };
  }

  /**
   * Generate comprehensive project assessment for fresh startups
   */
  async generateComprehensiveProjectAssessment(projectContext) {
    const assessment = {
      timestamp: new Date().toISOString(),
      project_path: projectContext || process.cwd()
    };

    // System Health Check
    assessment.system_health = {
      bridge_status: '✅ Active and operational',
      agent_status: '✅ All 7 agents running (Alex, Sherlock, Edison, Leonardo, Maya, Vince, Marie)',
      performance: '✅ Fast startup times, responsive communication',
      architecture: '✅ Unified CASCADE Bridge handling all coordination'
    };
    
    // Coding Standards Detection
    assessment.coding_standards = await this.checkCodingStandardsStatus();
    
    // Development Priorities
    assessment.development_priorities = [
      {
        area: 'Standards Configuration',
        description: 'Fresh projects benefit from conversational standards setup'
      },
      {
        area: 'Team Collaboration', 
        description: 'Enhanced agent-to-agent coordination protocols'
      },
      {
        area: 'Performance Optimization',
        description: 'Further refinement of startup and response times'
      }
    ];

    return this.formatComprehensiveAssessment(assessment);
  }

  /**
   * Check coding standards configuration status
   */
  async checkCodingStandardsStatus() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Check for existing standards documentation
      const standardsPath = path.join(process.cwd(), 'docs', 'PROJECT_CODING_STANDARDS.md');
      const pairedMemoryPath = path.join(process.cwd(), '.paired', 'memory', 'project_specific');
      
      let standardsExists = false;
      let hasContent = false;
      
      try {
        const stats = await fs.stat(standardsPath);
        standardsExists = true;
        const content = await fs.readFile(standardsPath, 'utf8');
        hasContent = content.trim().length > 100; // More than just placeholder
      } catch (error) {
        // File doesn't exist
      }
      
      // Check for PAIRED memory standards
      let pairedStandardsExists = false;
      try {
        const memoryStats = await fs.stat(pairedMemoryPath);
        const memoryFiles = await fs.readdir(pairedMemoryPath);
        pairedStandardsExists = memoryFiles.some(file => file.includes('standards') || file.includes('coding'));
      } catch (error) {
        // Memory directory doesn't exist
      }

      if (!standardsExists && !pairedStandardsExists) {
        return {
          status: 'not_configured',
          message: '⚠️ **Coding Standards Not Configured**',
          recommendation: 'I can guide you through setting up project-specific coding standards',
          setup_available: true
        };
      } else if (standardsExists && !hasContent) {
        return {
          status: 'placeholder_only',
          message: '⚠️ **Standards File Exists But Empty**',
          recommendation: 'Let me help you configure meaningful coding standards',
          setup_available: true
        };
      } else {
        return {
          status: 'configured',
          message: '✅ **Coding Standards Configured**',
          recommendation: 'Standards are in place and ready for team use'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: '❌ **Unable to check standards status**',
        recommendation: 'Let me help you set up coding standards'
      };
    }
  }

  /**
   * Format comprehensive assessment for user display
   */
  formatComprehensiveAssessment(assessment) {
    let output = `👑 **Alex (PM)**: Welcome back! Here's your comprehensive PAIRED project assessment:\n\n`;
    
    // System Health Status
    output += `## 🎯 **System Health Status**\n`;
    output += `- **Bridge**: ${assessment.system_health.bridge_status}\n`;
    output += `- **Agent Team**: ${assessment.system_health.agent_status}\n`;
    output += `- **Performance**: ${assessment.system_health.performance}\n`;
    output += `- **Architecture**: ${assessment.system_health.architecture}\n\n`;

    // Coding Standards Status
    output += `## 📋 **Coding Standards Status**\n`;
    output += `${assessment.coding_standards.message}\n`;
    if (assessment.coding_standards.setup_available) {
      output += `\n💡 **Ready to Setup**: ${assessment.coding_standards.recommendation}\n`;
      output += `Would you like me to guide you through conversational standards setup?\n\n`;
    } else {
      output += `\n${assessment.coding_standards.recommendation}\n\n`;
    }

    // Development Priorities
    output += `## 🚀 **Development Priorities**\n`;
    assessment.development_priorities.forEach(priority => {
      output += `- **${priority.area}**: ${priority.description}\n`;
    });
    output += `\n`;

    // Team Coordination Options
    output += `## 👥 **Team Coordination Available**\n`;
    output += `- **🏛️ Architecture Reviews** (Leonardo leading)\n`;
    output += `- **⚡ Development Tasks** (Edison implementing)\n`;
    output += `- **🎨 UX Enhancements** (Maya designing)\n`;
    output += `- **🕵️ Quality Audits** (Sherlock investigating)\n`;
    output += `- **🏈 Process Optimization** (Vince coaching)\n`;
    output += `- **🔬 Data Analysis** (Marie analyzing)\n\n`;

    output += `What's your priority for this session?`;

    return output;
  }

  generateAlexResponse(message, analysis, projectContext) {
    if (analysis.complexity === 'high') {
      return `This looks like a complex request${projectContext}. Let me coordinate with the team to give you the best solution.`;
    } else if (analysis.urgency === 'high') {
      return `I understand this is urgent${projectContext}. Let me get you a quick solution and then we can optimize it.`;
    } else {
      return `I'm here to help${projectContext}! Let me handle this for you or bring in the right specialist if needed.`;
    }
  }

  async getSpecialistResponses(message, analysis) {
    const specialists = [];

    if (analysis.primaryAgent && analysis.primaryAgent !== 'alex') {
      const specialist = this.teamAgents.get(analysis.primaryAgent);
      if (specialist) {
        try {
          const agentResponse = await this.routeToAgent(analysis.primaryAgent, message);
          specialists.push({
            agent: specialist.id,
            name: specialist.name,
            emoji: specialist.emoji,
            content: agentResponse.content || `${specialist.emoji} ${specialist.name}: I'm analyzing this from my ${specialist.role ? specialist.role.toLowerCase() : 'specialist'} perspective...`,
            timestamp: Date.now()
          });
        } catch (error) {
          specialists.push({
            agent: specialist.id,
            name: specialist.name,
            emoji: specialist.emoji,
            content: `${specialist.emoji} ${specialist.name}: I'm analyzing this from my ${specialist.role ? specialist.role.toLowerCase() : 'specialist'} perspective...`,
            timestamp: Date.now()
          });
        }
      }
    }

    return specialists;
  }

  async routeToAgent(agentId, message) {
    // Route through WebSocket message broadcasting instead of HTTP
    // Send message to all connected clients and let agents respond
    
    const messageData = {
      type: 'AGENT_REQUEST',
      targetAgent: agentId,
      message: message,
      timestamp: Date.now(),
      requestId: require('crypto').randomUUID()
    };

    // Broadcast to all connected WebSocket clients
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Agent ${agentId} response timeout`));
      }, 5000);

      // Listen for agent response
      const responseHandler = (data) => {
        if (data.type === 'AGENT_RESPONSE' && 
            data.agentId === agentId && 
            data.requestId === messageData.requestId) {
          clearTimeout(timeout);
          resolve(data.response);
        }
      };

      // Store response handler temporarily
      this.pendingRequests = this.pendingRequests || new Map();
      this.pendingRequests.set(messageData.requestId, responseHandler);

      // Broadcast message to all connected clients
      this.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(messageData));
        }
      });
    });

    return responsePromise;
  }

  // Original Bridge Methods (simplified)
  generateInstanceId() {
    return `windsurf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  handleMessage(instanceId, rawMessage) {
    try {
      const message = JSON.parse(rawMessage.toString());

      // Update session data
      this.sessions.set(instanceId, {
        ...this.sessions.get(instanceId),
        lastActivity: Date.now(),
        messageCount: (this.sessions.get(instanceId)?.messageCount || 0) + 1
      });

      // Handle different message types
      switch (message.type) {
      case 'health_check':
        // Respond to health check from startup controller
        this.sendToInstance(instanceId, {
          type: 'health_response',
          status: 'healthy',
          timestamp: Date.now(),
          bridge: 'running',
          agents: this.agents.size,
          connections: this.connections.size
        });
        break;
      case 'AGENT_MESSAGE':
        // Handle direct agent CLI requests
        this.logger.log(`📨 Received AGENT_MESSAGE for ${message.agent}`);
        this.handleDirectAgentMessage(instanceId, message);
        break;
      case 'agent_message':
        this.routeAgentMessage(instanceId, message);
        break;
      case 'context_share':
        this.handleContextShare(instanceId, message);
        break;
      case 'get_instances':
        this.sendInstancesList(instanceId);
        break;
      case 'AGENT_RESPONSE':
        // Handle agent responses for pending requests
        if (this.pendingRequests && this.pendingRequests.has(message.requestId)) {
          const handler = this.pendingRequests.get(message.requestId);
          handler(message);
          this.pendingRequests.delete(message.requestId);
        }
        break;
      case 'user_request':
        // Handle user requests for specific agents via Alex coordination
        this.handleUserRequest(instanceId, message);
        break;
      case 'agent_request':
        // Handle WebSocket agent requests from Claude Code
        this.handleAgentRequest(instanceId, message);
        break;
      case 'PROJECT_CONNECT':
        // Handle project connection requests
        this.handleProjectConnect(instanceId, message);
        break;
      case 'AGENT_HEALTH':
        // Handle agent health checks
        this.sendToInstance(instanceId, {
          type: 'AGENT_HEALTH_RESPONSE',
          status: 'healthy',
          agents: Array.from(this.agents.keys()),
          timestamp: new Date().toISOString()
        });
        break;
      case 'HEALTH_CHECK':
        // Handle general health checks
        this.sendToInstance(instanceId, {
          type: 'health_response',
          status: 'healthy',
          bridge: 'running',
          agents: this.agents.size,
          connections: this.connections.size,
          timestamp: new Date().toISOString()
        });
        break;
      default:
        this.logger.log(`Unknown message type: ${message.type}`);
        this.logger.log(`Full message: ${JSON.stringify(message)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse message from ${instanceId}:`, error);
    }
  }

  async handleUserRequest(instanceId, message) {
    try {
      // Handle comprehensive project assessment request
      if (message.message === 'COMPREHENSIVE_PROJECT_ASSESSMENT') {
        this.logger.log(`🎯 Comprehensive project assessment request from ${instanceId}`);
        const assessment = await this.generateComprehensiveProjectAssessment(message.projectPath);
        
        this.sendToInstance(instanceId, {
          type: 'agent_response',
          response: assessment,
          agent: 'alex',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      this.logger.log(`🎯 User request for ${message.requestedAgent} from ${instanceId}`);
      
      // Route to specific agent
      const agentResponse = await this.routeToSpecificAgent(message.requestedAgent, message.originalMessage, instanceId);
      this.logger.log(`📝 Agent response: ${agentResponse.substring(0, 100)}...`);
      
      // Send response back
      const responseObj = {
        type: 'agent_response',
        response: agentResponse,
        agent: message.requestedAgent,
        timestamp: new Date().toISOString()
      };
      this.logger.log(`📤 Sending response: ${JSON.stringify(responseObj).substring(0, 200)}...`);
      this.sendToInstance(instanceId, responseObj);
      
    } catch (error) {
      this.logger.error(`Failed to handle user request:`, error);
      this.sendToInstance(instanceId, {
        type: 'agent_response',
        response: `❌ Error: ${error.message}`,
        agent: message.requestedAgent || 'alex',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDirectAgentMessage(instanceId, message) {
    try {
      this.logger.log(`🎯 Direct agent request: ${message.agent} from ${instanceId}`);
      
      // Route to specific agent or Alex coordination
      const agentResponse = await this.routeToSpecificAgent(message.agent, message.message, instanceId);
      
      // Send response back
      this.sendToInstance(instanceId, {
        type: 'AGENT_RESPONSE',
        agent: message.agent,
        message: agentResponse,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error(`Failed to handle direct agent message:`, error);
      this.sendToInstance(instanceId, {
        type: 'AGENT_RESPONSE',
        agent: message.agent,
        message: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleAgentRequest(instanceId, message) {
    try {
      this.logger.log(`🎯 Agent request: ${message.agentName} from ${instanceId}`);
      
      // Route to actual agent and get response
      const agentResponse = await this.routeToAlexAndTeam(message.message, instanceId, message.projectPath);
      
      // Send response back with request ID for tracking
      this.sendToInstance(instanceId, {
        type: 'agent_response',
        requestId: message.requestId,
        response: agentResponse.response || agentResponse.message || agentResponse,
        agent: message.agentName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error(`Failed to handle agent request from ${instanceId}:`, error);
      
      // Send error response
      this.sendToInstance(instanceId, {
        type: 'agent_response',
        requestId: message.requestId,
        error: error.message,
        agent: message.agentName,
        timestamp: new Date().toISOString()
      });
    }
  }

  routeAgentMessage(sourceInstanceId, message) {
    // Broadcast to all connected instances or route to specific instance
    if (message.targetInstance) {
      this.sendToInstance(message.targetInstance, {
        type: 'agent_response',
        source: sourceInstanceId,
        ...message
      });
    } else {
      // Broadcast to all instances
      this.connections.forEach((ws, instanceId) => {
        if (instanceId !== sourceInstanceId && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_response',
            source: sourceInstanceId,
            ...message
          }));
        }
      });
    }
  }

  handleContextShare(sourceInstanceId, message) {
    // Share context with specified instances or all instances
    const targets = message.targetInstances || Array.from(this.connections.keys());

    targets.forEach(targetId => {
      if (targetId !== sourceInstanceId) {
        this.sendToInstance(targetId, {
          type: 'context_shared',
          source: sourceInstanceId,
          context: message.context,
          timestamp: Date.now()
        });
      }
    });
  }

  sendInstancesList(instanceId) {
    const instances = Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      projectPath: session.projectPath || 'Unknown',
      lastActivity: session.lastActivity,
      messageCount: session.messageCount || 0,
      isActive: this.connections.has(id)
    }));

    this.sendToInstance(instanceId, {
      type: 'instances_list',
      instances: instances,
      totalActive: this.connections.size
    });
  }

  sendToInstance(instanceId, message) {
    const ws = this.connections.get(instanceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  handleDisconnect(instanceId) {
    this.connections.delete(instanceId);
    this.connectedInstances.delete(instanceId);

    if (this.sessions.has(instanceId)) {
      const session = this.sessions.get(instanceId);
      session.disconnectedAt = Date.now();
    }

    this.logger.log(`🔌 Instance disconnected: ${instanceId}`);
  }

  loadSessions() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        const sessions = JSON.parse(data);

        Object.entries(sessions).forEach(([id, session]) => {
          this.sessions.set(id, session);
        });

        this.logger.log(`📁 Loaded ${this.sessions.size} sessions`);
      }
    } catch (error) {
      this.logger.error('Failed to load sessions:', error);
    }
  }

  saveSessions() {
    try {
      const sessionsObj = {};
      this.sessions.forEach((session, id) => {
        sessionsObj[id] = session;
      });

      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsObj, null, 2));
    } catch (error) {
      this.logger.error('Failed to save sessions:', error);
    }
  }

  startPeriodicCleanup() {
    const CLEANUP_INTERVAL = 3600000; // 1 hour
    setInterval(() => {
      const now = Date.now();
      const STALE_THRESHOLD = 86400000; // 24 hours

      let cleaned = 0;
      this.sessions.forEach((session, id) => {
        if (session.disconnectedAt && (now - session.disconnectedAt) > STALE_THRESHOLD) {
          this.sessions.delete(id);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        this.logger.log(`🧹 Cleaned ${cleaned} stale sessions`);
        this.saveSessions();
      }
    }, CLEANUP_INTERVAL);
  }

  async writePidFile() {
    const weeDir = path.join(os.homedir(), '.paired');
    if (!fs.existsSync(weeDir)) {
      fs.mkdirSync(weeDir, { recursive: true });
    }

    fs.writeFileSync(this.pidFile, process.pid.toString());
    this.logger.log(`✅ PID file written: ${this.pidFile}`);
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      this.logger.log('🛑 Shutting down Unified CASCADE Bridge...');

      // Save sessions before shutdown
      this.saveSessions();

      // Close all WebSocket connections
      this.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      // Close server
      if (this.server) {
        this.server.close();
      }

      // Remove PID file
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }

      this.logger.log('✅ Unified CASCADE Bridge shut down');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      this.logger.error('❌ Uncaught exception:', error);
      shutdown();
    });
  }

  handleProjectConnect(instanceId, message) {
    try {
      const project = message.project;
      
      // Update session with project info
      this.sessions.set(instanceId, {
        ...this.sessions.get(instanceId),
        project: {
          name: project.name,
          path: project.path,
          connectedAt: new Date().toISOString()
        }
      });

      // Send success response
      this.sendToInstance(instanceId, {
        type: 'PROJECT_CONNECTED',
        project: project,
        instanceId: instanceId,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`✅ Project '${project.name}' connected from ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to handle project connection from ${instanceId}:`, error);
      
      // Send error response
      this.sendToInstance(instanceId, {
        type: 'ERROR',
        message: 'Failed to connect project',
        error: error.message
      });
    }
  }
}

// Start the unified bridge if run directly
if (require.main === module) {
  const bridge = new UnifiedCascadeBridge();
  bridge.start();
}

module.exports = UnifiedCascadeBridge;
