/**
 * WEE Message Router
 * 
 * Implementation by ⚡ Edison (Dev Agent)
 * Architecture by 🏛️ Leonardo (Architecture Agent)
 * 
 * Routes agent messages to appropriate Windsurf IDE instances with queuing,
 * priority handling, and broadcast capabilities for multi-session support.
 */

const { EventEmitter } = require('events');

class MessageRouter extends EventEmitter {
  constructor(sessionManager, options = {}) {
    super();
    
    this.sessionManager = sessionManager;
    this.config = {
      maxQueueSize: options.maxQueueSize || 1000,
      messageTimeout: options.messageTimeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      priorityLevels: ['low', 'normal', 'high', 'urgent'],
      ...options
    };
    
    // Message queues by session
    this.messageQueues = new Map(); // sessionId -> PriorityQueue
    this.pendingMessages = new Map(); // messageId -> MessageInfo
    this.deliveryStats = {
      sent: 0,
      delivered: 0,
      queued: 0,
      failed: 0,
      retried: 0
    };
    
    this.setupSessionListeners();
  }
  
  /**
   * Route a message to appropriate sessions
   */
  async routeMessage(message, routing = {}) {
    try {
      const messageId = this.generateMessageId();
      const timestamp = new Date();
      
      // Normalize message format
      const normalizedMessage = this.normalizeMessage(message, messageId, timestamp);
      
      // Determine target sessions
      const targetSessions = this.resolveTargetSessions(routing);
      
      if (targetSessions.length === 0) {
        throw new Error('No target sessions found for message routing');
      }
      
      // Track pending message
      this.pendingMessages.set(messageId, {
        message: normalizedMessage,
        routing,
        targetSessions: targetSessions.map(s => s.id),
        createdAt: timestamp,
        attempts: 0,
        status: 'pending'
      });
      
      // Route to each target session
      const results = await Promise.allSettled(
        targetSessions.map(session => this.sendToSession(session.id, normalizedMessage))
      );
      
      // Process results
      const deliveryResults = this.processDeliveryResults(messageId, results, targetSessions);
      
      this.emit('messageRouted', {
        messageId,
        message: normalizedMessage,
        results: deliveryResults
      });
      
      return {
        messageId,
        delivered: deliveryResults.delivered,
        queued: deliveryResults.queued,
        failed: deliveryResults.failed,
        results: deliveryResults.details
      };
      
    } catch (error) {
      console.error('❌ Error routing message:', error);
      this.deliveryStats.failed++;
      throw error;
    }
  }
  
  /**
   * Send message to specific session
   */
  async sendToSession(sessionId, message) {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Check if session has active connections
    if (session.connections.size === 0) {
      // Queue message for later delivery
      await this.queueMessage(sessionId, message);
      this.deliveryStats.queued++;
      return { status: 'queued', sessionId };
    }
    
    // Attempt immediate delivery to all connections
    const connectionResults = [];
    let delivered = false;
    
    for (const connectionId of session.connections) {
      try {
        const result = await this.sendToConnection(connectionId, message);
        connectionResults.push(result);
        if (result.status === 'delivered') {
          delivered = true;
        }
      } catch (error) {
        connectionResults.push({
          status: 'failed',
          connectionId,
          error: error.message
        });
      }
    }
    
    if (delivered) {
      this.deliveryStats.delivered++;
      this.sessionManager.updateActivity(sessionId);
      return { status: 'delivered', sessionId, connections: connectionResults };
    } else {
      // All connections failed, queue message
      await this.queueMessage(sessionId, message);
      this.deliveryStats.queued++;
      return { status: 'queued', sessionId, connections: connectionResults };
    }
  }
  
  /**
   * Send message to specific connection
   */
  async sendToConnection(connectionId, message) {
    return new Promise((resolve, reject) => {
      // This would interface with the actual WebSocket connection
      // For now, we'll emit an event that the bridge service can listen to
      this.emit('sendToConnection', {
        connectionId,
        message,
        callback: (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      });
    });
  }
  
  /**
   * Queue message for later delivery
   */
  async queueMessage(sessionId, message) {
    if (!this.messageQueues.has(sessionId)) {
      this.messageQueues.set(sessionId, new PriorityQueue());
    }
    
    const queue = this.messageQueues.get(sessionId);
    
    // Check queue size limits
    if (queue.size() >= this.config.maxQueueSize) {
      // Remove oldest low-priority message to make room
      const removed = queue.removeLowestPriority();
      if (removed) {
        console.warn(`⚠️ Queue full for session ${sessionId}, removed message: ${removed.id}`);
      } else {
        throw new Error(`Message queue full for session ${sessionId}`);
      }
    }
    
    // Add message to queue
    queue.enqueue(message, this.getPriorityValue(message.priority));
    
    console.log(`📬 Message queued for session ${sessionId}: ${message.id}`);
    this.emit('messageQueued', { sessionId, message });
  }
  
  /**
   * Process queued messages when connections become available
   */
  async processQueuedMessages(sessionId) {
    const queue = this.messageQueues.get(sessionId);
    if (!queue || queue.isEmpty()) {
      return;
    }
    
    const session = this.sessionManager.getSession(sessionId);
    if (!session || session.connections.size === 0) {
      return;
    }
    
    console.log(`📤 Processing ${queue.size()} queued messages for session ${sessionId}`);
    
    // Process messages in priority order
    const processedMessages = [];
    while (!queue.isEmpty() && session.connections.size > 0) {
      const message = queue.dequeue();
      
      try {
        const result = await this.sendToSession(sessionId, message);
        processedMessages.push({ message, result });
        
        // Small delay to prevent overwhelming connections
        await this.delay(100);
        
      } catch (error) {
        console.error(`❌ Error processing queued message ${message.id}:`, error);
        
        // Re-queue if retries available
        if (message.retryCount < this.config.retryAttempts) {
          message.retryCount = (message.retryCount || 0) + 1;
          queue.enqueue(message, this.getPriorityValue(message.priority));
          this.deliveryStats.retried++;
        } else {
          this.deliveryStats.failed++;
        }
      }
    }
    
    if (processedMessages.length > 0) {
      this.emit('queueProcessed', { sessionId, processed: processedMessages.length });
    }
  }
  
  /**
   * Broadcast message to all active sessions
   */
  async broadcastMessage(message, filter = {}) {
    const sessions = this.sessionManager.getAllSessions();
    const filteredSessions = this.filterSessions(sessions, filter);
    
    if (filteredSessions.length === 0) {
      console.warn('⚠️ No sessions match broadcast filter');
      return { delivered: 0, queued: 0, failed: 0 };
    }
    
    console.log(`📢 Broadcasting message to ${filteredSessions.length} sessions`);
    
    const results = await Promise.allSettled(
      filteredSessions.map(session => this.sendToSession(session.id, message))
    );
    
    return this.summarizeResults(results);
  }
  
  /**
   * Resolve target sessions based on routing configuration
   */
  resolveTargetSessions(routing) {
    const { sessionId, projectPath, windsurfInstanceId, broadcast, filter } = routing;
    
    // Specific session
    if (sessionId) {
      const session = this.sessionManager.getSession(sessionId);
      return session ? [session] : [];
    }
    
    // Sessions for specific project
    if (projectPath) {
      return this.sessionManager.getProjectSessions(projectPath);
    }
    
    // Sessions for specific Windsurf instance
    if (windsurfInstanceId) {
      return this.sessionManager.getAllSessions()
        .filter(session => session.windsurfInstanceId === windsurfInstanceId);
    }
    
    // Broadcast to all sessions
    if (broadcast) {
      const sessions = this.sessionManager.getAllSessions();
      return this.filterSessions(sessions, filter || {});
    }
    
    // Default: route to all active sessions
    return this.sessionManager.getAllSessions();
  }
  
  /**
   * Filter sessions based on criteria
   */
  filterSessions(sessions, filter) {
    return sessions.filter(session => {
      // Filter by project name pattern
      if (filter.projectPattern) {
        const regex = new RegExp(filter.projectPattern, 'i');
        if (!regex.test(session.projectName)) return false;
      }
      
      // Filter by minimum connection count
      if (filter.minConnections && session.connections.size < filter.minConnections) {
        return false;
      }
      
      // Filter by session age
      if (filter.maxAge) {
        const age = Date.now() - session.createdAt.getTime();
        if (age > filter.maxAge) return false;
      }
      
      // Filter by metadata
      if (filter.metadata) {
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (session.metadata[key] !== value) return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Normalize message format
   */
  normalizeMessage(message, messageId, timestamp) {
    // Handle different input formats
    if (typeof message === 'string') {
      message = { content: message };
    }
    
    return {
      id: messageId,
      type: message.type || 'agent',
      agent: message.agent || 'system',
      content: message.content || message.message || '',
      priority: message.priority || 'normal',
      timestamp: timestamp.toISOString(),
      metadata: message.metadata || {},
      retryCount: 0,
      ...message
    };
  }
  
  /**
   * Get numeric priority value
   */
  getPriorityValue(priority) {
    const index = this.config.priorityLevels.indexOf(priority);
    return index >= 0 ? index : 1; // Default to 'normal'
  }
  
  /**
   * Process delivery results
   */
  processDeliveryResults(messageId, results, targetSessions) {
    let delivered = 0;
    let queued = 0;
    let failed = 0;
    const details = [];
    
    results.forEach((result, index) => {
      const sessionId = targetSessions[index].id;
      
      if (result.status === 'fulfilled') {
        const value = result.value;
        details.push({ sessionId, ...value });
        
        switch (value.status) {
          case 'delivered':
            delivered++;
            break;
          case 'queued':
            queued++;
            break;
          default:
            failed++;
        }
      } else {
        details.push({
          sessionId,
          status: 'failed',
          error: result.reason.message
        });
        failed++;
      }
    });
    
    // Update pending message status
    const pendingMessage = this.pendingMessages.get(messageId);
    if (pendingMessage) {
      pendingMessage.status = delivered > 0 ? 'delivered' : (queued > 0 ? 'queued' : 'failed');
      pendingMessage.completedAt = new Date();
    }
    
    return { delivered, queued, failed, details };
  }
  
  /**
   * Summarize broadcast results
   */
  summarizeResults(results) {
    let delivered = 0;
    let queued = 0;
    let failed = 0;
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const value = result.value;
        switch (value.status) {
          case 'delivered': delivered++; break;
          case 'queued': queued++; break;
          default: failed++;
        }
      } else {
        failed++;
      }
    });
    
    return { delivered, queued, failed };
  }
  
  /**
   * Setup session event listeners
   */
  setupSessionListeners() {
    // Process queued messages when connections are added
    this.sessionManager.on('connectionAdded', ({ sessionId }) => {
      this.processQueuedMessages(sessionId);
    });
    
    // Clean up queues when sessions are destroyed
    this.sessionManager.on('sessionDestroyed', ({ id }) => {
      this.messageQueues.delete(id);
    });
  }
  
  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get routing statistics
   */
  getStats() {
    const queueStats = {};
    for (const [sessionId, queue] of this.messageQueues) {
      queueStats[sessionId] = queue.size();
    }
    
    return {
      delivery: { ...this.deliveryStats },
      queues: queueStats,
      pendingMessages: this.pendingMessages.size,
      totalQueuedMessages: Object.values(queueStats).reduce((sum, size) => sum + size, 0)
    };
  }
  
  /**
   * Clear old pending messages
   */
  cleanupPendingMessages() {
    const now = Date.now();
    const timeout = this.config.messageTimeout;
    
    for (const [messageId, messageInfo] of this.pendingMessages) {
      if (now - messageInfo.createdAt.getTime() > timeout) {
        this.pendingMessages.delete(messageId);
      }
    }
  }
}

/**
 * Priority Queue implementation for message queuing
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  
  enqueue(item, priority) {
    const queueElement = { item, priority };
    let added = false;
    
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(queueElement);
    }
  }
  
  dequeue() {
    return this.items.shift()?.item;
  }
  
  isEmpty() {
    return this.items.length === 0;
  }
  
  size() {
    return this.items.length;
  }
  
  removeLowestPriority() {
    if (this.items.length === 0) return null;
    
    // Find lowest priority item
    let lowestIndex = 0;
    let lowestPriority = this.items[0].priority;
    
    for (let i = 1; i < this.items.length; i++) {
      if (this.items[i].priority < lowestPriority) {
        lowestPriority = this.items[i].priority;
        lowestIndex = i;
      }
    }
    
    return this.items.splice(lowestIndex, 1)[0]?.item;
  }
}

module.exports = MessageRouter;
