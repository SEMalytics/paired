#!/usr/bin/env node

/**
 * PAIRED Windsurf Middleware
 *
 * Enhancement layer that works with the existing CASCADE bridge
 * without replacing or conflicting with it. Provides:
 * - Token optimization for agent messages
 * - Performance monitoring
 * - Context management
 * - Windsurf-specific features
 */

const TokenOptimizationEngine = require('./token_optimization_engine');
const http = require('http');

class WindsurfMiddleware {
  constructor(options = {}) {
    this.tokenOptimizer = new TokenOptimizationEngine({
      targetReduction: options.tokenReduction || 0.5,
      qualityThreshold: options.qualityThreshold || 0.9
    });

    this.contextManager = new WindsurfContextManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.bridgeUrl = options.bridgeUrl || 'http://localhost:7890';

    this.metrics = {
      messagesProcessed: 0,
      tokensSaved: 0,
      averageOptimization: 0,
      processingTime: 0
    };

    console.log('🚀 Windsurf Middleware initialized');
  }

  /**
   * Process message with Windsurf enhancements
   */
  async processMessage(message, options = {}) {
    const startTime = Date.now();

    try {
      const enhancedMessage = { ...message };

      // Apply token optimization if context present
      if (message.context) {
        const optimizationResult = await this.tokenOptimizer.optimize(
          message.context,
          message.targetAgent || 'general'
        );

        // Use only the optimized content, not the full result object
        enhancedMessage.context = optimizationResult.optimized;

        // Store metrics separately for monitoring
        if (optimizationResult.metrics) {
          this.metrics.tokensSaved += optimizationResult.metrics.tokensSaved;
          this.metrics.averageOptimization =
            (this.metrics.averageOptimization + parseFloat(optimizationResult.metrics.reductionPercentage)) / 2;
        }
      }

      // Process Windsurf-specific context
      if (message.type === 'WINDSURF_CONTEXT') {
        enhancedMessage.context = await this.contextManager.processContext(message.context);
      }

      // Track performance
      const processingTime = Date.now() - startTime;
      this.performanceMonitor.recordMetric('message_processing_time', processingTime);
      this.metrics.processingTime = processingTime;
      this.metrics.messagesProcessed++;

      return enhancedMessage;

    } catch (error) {
      console.error('Error in Windsurf middleware:', error);
      return message; // Return original on error
    }
  }

  /**
   * Send enhanced message to CASCADE bridge
   */
  async sendToBridge(message) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(message);

      const req = http.request({
        hostname: 'localhost',
        port: 7890,
        path: '/cascade-intercept',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 3000
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            resolve(body);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (err) => reject(err));
      req.write(data);
      req.end();
    });
  }

  /**
   * Process and send message with enhancements
   */
  async enhanceAndSend(message) {
    const enhanced = await this.processMessage(message);
    return await this.sendToBridge(enhanced);
  }

  /**
   * Get middleware metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      tokenOptimizer: this.tokenOptimizer.getMetrics(),
      contextManager: this.contextManager.getMetrics(),
      performanceMonitor: this.performanceMonitor.getMetrics()
    };
  }

  /**
   * Health check
   */
  getHealthStatus() {
    return {
      status: 'operational',
      components: {
        tokenOptimizer: 'ok',
        contextManager: 'ok',
        performanceMonitor: 'ok'
      },
      metrics: this.getMetrics()
    };
  }
}

/**
 * Windsurf Context Manager
 */
class WindsurfContextManager {
  constructor() {
    this.contextHistory = new Map();
    this.metrics = {
      contextsProcessed: 0,
      averageContextSize: 0
    };
  }

  async processContext(context) {
    this.metrics.contextsProcessed++;

    const processed = {
      activeFile: this.extractActiveFile(context),
      selection: this.extractSelection(context),
      recentActivity: this.extractActivity(context),
      projectContext: this.extractProject(context),
      timestamp: Date.now()
    };

    const contextId = this.generateContextId(processed);
    this.contextHistory.set(contextId, processed);

    return processed;
  }

  extractActiveFile(context) {
    return context.activeFile || context.currentFile || null;
  }

  extractSelection(context) {
    return context.selection || context.selectedText || null;
  }

  extractActivity(context) {
    return context.recentActivity || context.activity || [];
  }

  extractProject(context) {
    return context.projectContext || context.project || {};
  }

  generateContextId(context) {
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(context))
      .digest('hex')
      .substring(0, 8);
  }

  getMetrics() {
    return this.metrics;
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name);
    values.push({ value, timestamp: Date.now() });

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics() {
    const summary = {};
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        const average = values.reduce((sum, v) => sum + v.value, 0) / values.length;
        summary[name] = {
          latest: latest.value,
          average: Math.round(average),
          count: values.length
        };
      }
    });

    return {
      summary,
      alerts: this.alerts.slice(-10)
    };
  }
}

module.exports = WindsurfMiddleware;
