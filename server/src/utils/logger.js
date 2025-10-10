/**
 * Centralized logging utility for the PMS Nexora system
 * Provides structured logging with different levels and optional debugging
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugEnabled = process.env.DEBUG_ANALYTICS === 'true' || this.isDevelopment;
  }

  /**
   * Log info messages
   * @param {string} message - The log message
   * @param {Object} data - Optional data to log
   */
  info(message, data = null) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  /**
   * Log debug messages (only in development or when debug is enabled)
   * @param {string} message - The log message
   * @param {Object} data - Optional data to log
   */
  debug(message, data = null) {
    if (this.isDebugEnabled) {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  /**
   * Log warning messages
   * @param {string} message - The log message
   * @param {Object} data - Optional data to log
   */
  warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  /**
   * Log error messages
   * @param {string} message - The log message
   * @param {Error|Object} error - Error object or data to log
   */
  error(message, error = null) {
    console.error(`[ERROR] ${message}`, error ? (error.stack || error) : '');
  }

  /**
   * Log analytics-specific debug messages
   * @param {string} message - The log message
   * @param {Object} data - Optional data to log
   */
  analytics(message, data = null) {
    if (this.isDebugEnabled) {
      console.log(`[ANALYTICS] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - The operation being measured
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance(operation, duration, metadata = {}) {
    if (this.isDebugEnabled) {
      console.log(`[PERF] ${operation}: ${duration}ms`, metadata);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
