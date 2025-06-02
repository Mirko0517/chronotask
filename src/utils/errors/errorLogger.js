import { ERROR_SEVERITY, ERROR_CATEGORIES, getErrorType } from './errorTypes.js';

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

// Storage keys
const STORAGE_KEYS = {
  ERROR_LOGS: 'chronotask_error_logs',
  LOG_SETTINGS: 'chronotask_log_settings',
  SESSION_ID: 'chronotask_session_id'
};

// Default configuration
const DEFAULT_CONFIG = {
  maxLogs: 100,
  enableConsoleOutput: true,
  enableLocalStorage: true,
  enableRemoteLogging: false,
  logLevel: LOG_LEVELS.WARN,
  remoteEndpoint: null,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  sensitiveFields: ['password', 'token', 'email', 'phone'],
  excludeCategories: []
};

class ErrorLogger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.buffer = [];
    this.lastFlush = Date.now();
    
    // Bind methods
    this.log = this.log.bind(this);
    this.error = this.error.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
    
    // Initialize
    this.init();
  }

  init() {
    try {
      // Load existing logs from storage
      this.loadLogsFromStorage();
      
      // Set up periodic flush
      this.setupPeriodicFlush();
      
      // Set up unload handler
      this.setupUnloadHandler();
      
      // Set up error listeners
      this.setupGlobalErrorHandlers();
      
    } catch (error) {
      console.error('Failed to initialize ErrorLogger:', error);
    }
  }

  generateSessionId() {
    const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (Date.now() - session.timestamp < this.config.sessionTimeout) {
          return session.id;
        }
      } catch (e) {
        // Invalid session data, generate new
      }
    }
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, JSON.stringify({
      id: newId,
      timestamp: Date.now()
    }));
    
    return newId;
  }

  // Main logging method
  log(level, errorType, context = {}, originalError = null) {
    try {
      // Check if logging is enabled for this level
      if (!this.shouldLog(level)) {
        return;
      }

      // Check if category is excluded
      if (this.config.excludeCategories.includes(errorType.category)) {
        return;
      }

      // Create structured log entry
      const logEntry = this.createLogEntry(level, errorType, context, originalError);

      // Add to buffer
      this.buffer.push(logEntry);

      // Console output
      if (this.config.enableConsoleOutput) {
        this.logToConsole(logEntry);
      }

      // Check if buffer should be flushed
      if (this.shouldFlush()) {
        this.flush();
      }

    } catch (error) {
      // Fallback logging to prevent infinite loops
      console.error('ErrorLogger.log failed:', error);
    }
  }

  createLogEntry(level, errorType, context, originalError) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      sessionId: this.sessionId,
      level,
      errorType: {
        code: errorType.code,
        category: errorType.category,
        severity: errorType.severity,
        recovery: errorType.recovery,
        message: errorType.message,
        userMessage: errorType.userMessage
      },
      context: this.sanitizeContext(context),
      environment: this.getEnvironmentInfo(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: originalError?.stack || new Error().stack,
      fingerprint: this.generateFingerprint(errorType, context, originalError)
    };

    // Add performance metrics if available
    if (performance && performance.now) {
      logEntry.performance = {
        timestamp: performance.now(),
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      };
    }

    return logEntry;
  }

  sanitizeContext(context) {
    const sanitized = { ...context };
    
    // Remove sensitive fields
    this.config.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key]);
      }
    });

    return sanitized;
  }

  getEnvironmentInfo() {
    return {
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: this.checkStorageAvailability('localStorage'),
      sessionStorage: this.checkStorageAvailability('sessionStorage')
    };
  }

  checkStorageAvailability(type) {
    try {
      const storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  generateFingerprint(errorType, context, originalError) {
    const components = [
      errorType.code,
      errorType.category,
      originalError?.message || '',
      context.component || '',
      context.action || ''
    ];
    
    const combined = components.join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  shouldLog(level) {
    const levels = Object.values(LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  shouldFlush() {
    const bufferFull = this.buffer.length >= 50;
    const timeElapsed = Date.now() - this.lastFlush > 60000; // 1 minute
    const hasCriticalError = this.buffer.some(log => 
      log.errorType.severity === ERROR_SEVERITY.CRITICAL
    );
    
    return bufferFull || timeElapsed || hasCriticalError;
  }

  flush() {
    if (this.buffer.length === 0) return;

    try {
      // Save to local storage
      if (this.config.enableLocalStorage) {
        this.saveToLocalStorage([...this.buffer]);
      }

      // Send to remote endpoint
      if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
        this.sendToRemote([...this.buffer]);
      }

      // Clear buffer
      this.buffer = [];
      this.lastFlush = Date.now();

    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  saveToLocalStorage(logs) {
    try {
      const existingLogs = this.getStoredLogs();
      const allLogs = [...existingLogs, ...logs];
      
      // Keep only the most recent logs
      const recentLogs = allLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, this.config.maxLogs);

      localStorage.setItem(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  async sendToRemote(logs) {
    if (!this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          metadata: {
            version: '1.0.0',
            source: 'chronotask-web',
            sessionId: this.sessionId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send logs to remote endpoint:', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logs);
    }
  }

  getStoredLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ERROR_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
      return [];
    }
  }

  loadLogsFromStorage() {
    try {
      const logs = this.getStoredLogs();
      // Remove old logs (older than 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => 
        new Date(log.timestamp).getTime() > weekAgo
      );
      
      if (recentLogs.length !== logs.length) {
        localStorage.setItem(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(recentLogs));
      }
    } catch (error) {
      console.warn('Failed to clean old logs:', error);
    }
  }

  setupPeriodicFlush() {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, 300000); // 5 minutes
  }

  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    });

    // Also handle visibility change (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.buffer.length > 0) {
        this.flush();
      }
    });
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error(getErrorType('UI_COMPONENT_CRASH'), {
        component: 'global',
        action: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, event.error);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(getErrorType('UNKNOWN_ERROR'), {
        component: 'global',
        action: 'unhandled_promise_rejection',
        reason: event.reason
      }, event.reason);
    });
  }

  logToConsole(logEntry) {
    const { level, errorType, context, timestamp } = logEntry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const message = `${prefix} ${errorType.code}: ${errorType.message}`;

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(message, { errorType, context });
        break;
      case LOG_LEVELS.INFO:
        console.info(message, { errorType, context });
        break;
      case LOG_LEVELS.WARN:
        console.warn(message, { errorType, context });
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL:
        console.error(message, { errorType, context });
        break;
      default:
        console.log(message, { errorType, context });
    }
  }

  // Convenience methods
  debug(errorType, context, originalError) {
    this.log(LOG_LEVELS.DEBUG, errorType, context, originalError);
  }

  info(errorType, context, originalError) {
    this.log(LOG_LEVELS.INFO, errorType, context, originalError);
  }

  warn(errorType, context, originalError) {
    this.log(LOG_LEVELS.WARN, errorType, context, originalError);
  }

  error(errorType, context, originalError) {
    this.log(LOG_LEVELS.ERROR, errorType, context, originalError);
  }

  fatal(errorType, context, originalError) {
    this.log(LOG_LEVELS.FATAL, errorType, context, originalError);
  }

  // Utility methods
  getLogs(filters = {}) {
    const logs = this.getStoredLogs();
    
    return logs.filter(log => {
      if (filters.level && log.level !== filters.level) return false;
      if (filters.category && log.errorType.category !== filters.category) return false;
      if (filters.severity && log.errorType.severity !== filters.severity) return false;
      if (filters.since && new Date(log.timestamp) < new Date(filters.since)) return false;
      if (filters.until && new Date(log.timestamp) > new Date(filters.until)) return false;
      return true;
    });
  }

  clearLogs() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ERROR_LOGS);
      this.buffer = [];
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return false;
    }
  }

  exportLogs(format = 'json') {
    const logs = this.getStoredLogs();
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.logsToCSV(logs);
      case 'json':
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  logsToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = [
      'timestamp', 'level', 'code', 'category', 'severity', 
      'message', 'userMessage', 'component', 'action', 'url'
    ];
    
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.errorType.code,
      log.errorType.category,
      log.errorType.severity,
      log.errorType.message,
      log.errorType.userMessage,
      log.context.component || '',
      log.context.action || '',
      log.url
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    try {
      localStorage.setItem(STORAGE_KEYS.LOG_SETTINGS, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save logger config:', error);
    }
  }

  getStats() {
    const logs = this.getStoredLogs();
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    
    return {
      total: logs.length,
      lastHour: logs.filter(log => now - new Date(log.timestamp) < hour).length,
      lastDay: logs.filter(log => now - new Date(log.timestamp) < day).length,
      byLevel: this.groupBy(logs, 'level'),
      byCategory: this.groupBy(logs, log => log.errorType.category),
      bySeverity: this.groupBy(logs, log => log.errorType.severity),
      topErrors: this.getTopErrors(logs, 5)
    };
  }

  groupBy(array, keyOrFunction) {
    return array.reduce((result, item) => {
      const key = typeof keyOrFunction === 'function' ? keyOrFunction(item) : item[keyOrFunction];
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  }

  getTopErrors(logs, limit = 5) {
    const errorCounts = this.groupBy(logs, log => log.errorType.code);
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([code, count]) => ({ code, count }));
  }
}

// Create singleton instance
export const logger = new ErrorLogger();

// Export for testing or advanced usage
export { ErrorLogger };