/**
 * CLI Cleanup Utility - Singleton Pattern
 * Prevents hanging processes and ensures graceful shutdown
 * Used across all PAIRED CLI tools and bridge communication
 */

class CLICleanup {
  constructor() {
    if (CLICleanup.instance) {
      return CLICleanup.instance;
    }

    this.timeouts = new Set();
    this.intervals = new Set();
    this.cleanupHandlers = new Set();
    this.isExiting = false;

    // Setup process exit handlers
    this.setupExitHandlers();
    
    CLICleanup.instance = this;
    return this;
  }

  setupExitHandlers() {
    const exitHandler = (signal) => {
      if (this.isExiting) return;
      this.isExiting = true;
      
      console.log(`\n🧹 Cleaning up on ${signal}...`);
      this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => exitHandler('SIGINT'));
    process.on('SIGTERM', () => exitHandler('SIGTERM'));
    process.on('exit', () => this.cleanup());
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      this.cleanup();
      process.exit(1);
    });
  }

  addTimeout(timeoutId) {
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  addInterval(intervalId) {
    this.intervals.add(intervalId);
    return intervalId;
  }

  addCleanupHandler(handler) {
    this.cleanupHandlers.add(handler);
  }

  removeCleanupHandler(handler) {
    this.cleanupHandlers.delete(handler);
  }

  wrapPromiseWithTimeout(promise, timeoutMs = 3000, timeoutMessage = 'Operation timeout') {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      this.addTimeout(timeoutId);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
          this.timeouts.delete(timeoutId);
        });
    });
  }

  cleanup() {
    // Clear all timeouts
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Clear all intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();

    // Run cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch (err) {
        console.error('❌ Cleanup handler error:', err);
      }
    }
    this.cleanupHandlers.clear();
  }

  safeExit(code = 0) {
    if (this.isExiting) return;
    this.isExiting = true;
    
    this.cleanup();
    process.exit(code);
  }
}

// Create singleton instance
const cliCleanup = new CLICleanup();

// Export convenience functions
module.exports = {
  CLICleanup,
  addCleanupHandler: (handler) => cliCleanup.addCleanupHandler(handler),
  removeCleanupHandler: (handler) => cliCleanup.removeCleanupHandler(handler),
  wrapPromiseWithTimeout: (promise, timeout, message) => 
    cliCleanup.wrapPromiseWithTimeout(promise, timeout, message),
  safeExit: (code) => cliCleanup.safeExit(code),
  cleanup: () => cliCleanup.cleanup()
};
