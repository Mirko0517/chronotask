import { ERROR_TYPES, getErrorType, ERROR_CATEGORIES, ERROR_SEVERITY } from './errors/errorTypes.js';
import { logger } from './errors/errorLogger.js';
import { errorRecovery } from './errors/errorRecovery.js';
import toast from 'react-hot-toast';

// Error handler configuration
const ERROR_HANDLER_CONFIG = {
  enableAutoRecovery: true,
  enableNotifications: true,
  enableLogging: true,
  notificationDuration: 4000,
  suppressDuplicates: true,
  duplicateTimeWindow: 5000
};

// Duplicate error tracking
const recentErrors = new Map();

class ErrorHandler {
  constructor(config = {}) {
    this.config = { ...ERROR_HANDLER_CONFIG, ...config };
    this.setupErrorInterceptors();
  }

  // Main error handling method
  async handle(errorTypeOrCode, context = {}, originalError = null, options = {}) {
    try {
      // Normalize error type
      const errorType = typeof errorTypeOrCode === 'string' 
        ? getErrorType(errorTypeOrCode) 
        : errorTypeOrCode;

      // Check for duplicate errors
      if (this.config.suppressDuplicates && this.isDuplicateError(errorType, context)) {
        return { success: false, suppressed: true };
      }

      // Log the error
      if (this.config.enableLogging) {
        this.logError(errorType, context, originalError);
      }

      // Show notification
      if (this.config.enableNotifications && !options.silent) {
        this.showNotification(errorType, context, options);
      }

      // Attempt recovery
      let recoveryResult = null;
      if (this.config.enableAutoRecovery && !options.skipRecovery) {
        recoveryResult = await this.attemptRecovery(errorType, context, originalError);
      }

      return {
        success: recoveryResult?.success || false,
        errorType,
        context,
        recovery: recoveryResult,
        handled: true
      };

    } catch (handlerError) {
      // Error handler itself failed - fallback to basic error handling
      console.error('ErrorHandler.handle failed:', handlerError);
      this.handleFallback(handlerError, context);
      
      return {
        success: false,
        error: handlerError,
        handled: false
      };
    }
  }

  // API Error handling
  async api(error, context = {}, options = {}) {
    const errorType = this.classifyApiError(error);
    const enrichedContext = {
      ...context,
      component: context.component || 'api',
      action: context.action || 'request',
      endpoint: context.endpoint || error.config?.url,
      method: context.method || error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Storage Error handling
  async storage(error, operation = 'unknown', context = {}, options = {}) {
    const errorType = this.classifyStorageError(error, operation);
    const enrichedContext = {
      ...context,
      component: context.component || 'storage',
      action: operation,
      operation,
      storageType: context.storageType || 'localStorage',
      key: context.key,
      quota: this.getStorageQuota()
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Validation Error handling
  async validation(errors, context = {}, options = {}) {
    // Handle both single error and array of errors
    const errorArray = Array.isArray(errors) ? errors : [errors];
    const results = [];

    for (const error of errorArray) {
      const errorType = this.classifyValidationError(error);
      const enrichedContext = {
        ...context,
        component: context.component || 'validation',
        action: context.action || 'validate',
        field: error.field || error.path,
        value: error.value,
        rule: error.rule || error.code
      };

      const result = await this.handle(errorType, enrichedContext, error, {
        ...options,
        silent: options.silent || errorArray.length > 1 // Don't show toast for each validation error
      });

      results.push(result);
    }

    // Show summary notification for multiple validation errors
    if (errorArray.length > 1 && this.config.enableNotifications && !options.silent) {
      toast.error(`${errorArray.length} errores de validación encontrados`, {
        duration: this.config.notificationDuration
      });
    }

    return {
      success: results.every(r => r.success),
      results,
      errorCount: errorArray.length
    };
  }

  // Network Error handling
  async network(error, context = {}, options = {}) {
    const errorType = this.classifyNetworkError(error);
    const enrichedContext = {
      ...context,
      component: context.component || 'network',
      action: context.action || 'request',
      online: navigator.onLine,
      connectionType: this.getConnectionType(),
      timing: error.timing || {}
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Task Management Error handling
  async task(error, operation, taskData = {}, context = {}, options = {}) {
    const errorType = this.classifyTaskError(error, operation);
    const enrichedContext = {
      ...context,
      component: context.component || 'task-manager',
      action: operation,
      taskId: taskData.id,
      taskTitle: taskData.title,
      operation
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Timer Error handling
  async timer(error, context = {}, options = {}) {
    const errorType = this.classifyTimerError(error);
    const enrichedContext = {
      ...context,
      component: context.component || 'timer',
      action: context.action || 'tick',
      timerState: context.timerState,
      duration: context.duration,
      remaining: context.remaining
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Project Error handling
  async project(error, operation, projectData = {}, context = {}, options = {}) {
    const errorType = this.classifyProjectError(error, operation);
    const enrichedContext = {
      ...context,
      component: context.component || 'project-manager',
      action: operation,
      projectId: projectData.id,
      projectName: projectData.name,
      operation
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Settings Error handling
  async settings(error, operation, settingsData = {}, context = {}, options = {}) {
    const errorType = this.classifySettingsError(error, operation);
    const enrichedContext = {
      ...context,
      component: context.component || 'settings',
      action: operation,
      operation,
      settings: this.sanitizeSettings(settingsData)
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Authentication Error handling
  async auth(error, operation = 'unknown', context = {}, options = {}) {
    const errorType = this.classifyAuthError(error, operation);
    const enrichedContext = {
      ...context,
      component: context.component || 'auth',
      action: operation,
      operation,
      hasToken: !!localStorage.getItem('token')
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // UI Component Error handling
  async ui(error, componentName, context = {}, options = {}) {
    const errorType = this.classifyUIError(error);
    const enrichedContext = {
      ...context,
      component: componentName,
      action: context.action || 'render',
      props: context.props ? this.sanitizeProps(context.props) : {},
      state: context.state ? this.sanitizeState(context.state) : {}
    };

    return this.handle(errorType, enrichedContext, error, options);
  }

  // Error Classification Methods
  classifyApiError(error) {
    if (!error.response) {
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        return ERROR_TYPES.API_NETWORK_ERROR;
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return ERROR_TYPES.API_TIMEOUT;
      }
      return ERROR_TYPES.API_NETWORK_ERROR;
    }

    const status = error.response.status;
    
    switch (status) {
      case 401:
        return ERROR_TYPES.API_UNAUTHORIZED;
      case 403:
        return ERROR_TYPES.API_FORBIDDEN;
      case 404:
        return ERROR_TYPES.API_NOT_FOUND;
      case 429:
        return ERROR_TYPES.API_RATE_LIMIT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_TYPES.API_SERVER_ERROR;
      default:
        return ERROR_TYPES.API_SERVER_ERROR;
    }
  }

  classifyStorageError(error, _operation) {
    const message = error.message || error.toString();
    
    if (message.includes('QuotaExceededError') || message.includes('quota')) {
      return ERROR_TYPES.STORAGE_QUOTA_EXCEEDED;
    }
    
    if (message.includes('SecurityError') || message.includes('access')) {
      return ERROR_TYPES.STORAGE_ACCESS_DENIED;
    }
    
    if (_operation === 'parse' || message.includes('JSON') || message.includes('parse')) {
      return ERROR_TYPES.STORAGE_PARSE_ERROR;
    }
    
    return ERROR_TYPES.STORAGE_ACCESS_DENIED;
  }

  classifyValidationError(_error) {
    if (_error.code === 'required' || _error.message?.includes('required')) {
      return ERROR_TYPES.VALIDATION_REQUIRED_FIELD;
    }
    
    if (_error.code === 'invalid_type' || _error.message?.includes('format')) {
      return ERROR_TYPES.VALIDATION_INVALID_FORMAT;
    }
    
    if (_error.code === 'too_small' || _error.code === 'too_big' || _error.message?.includes('range')) {
      return ERROR_TYPES.VALIDATION_OUT_OF_RANGE;
    }
    
    return ERROR_TYPES.VALIDATION_INVALID_FORMAT;
  }

  classifyNetworkError(_error) {
    if (!navigator.onLine) {
      return ERROR_TYPES.NETWORK_OFFLINE;
    }
    
    const connection = this.getConnectionType();
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return ERROR_TYPES.NETWORK_SLOW;
    }
    
    return ERROR_TYPES.API_NETWORK_ERROR;
  }

  classifyTaskError(_error, operation) {
    switch (operation) {
      case 'create':
        return ERROR_TYPES.TASK_CREATION_FAILED;
      case 'update':
        return ERROR_TYPES.TASK_UPDATE_FAILED;
      case 'delete':
        return ERROR_TYPES.TASK_DELETE_FAILED;
      case 'load':
      case 'get':
        return ERROR_TYPES.TASK_NOT_FOUND;
      default:
        return ERROR_TYPES.TASK_UPDATE_FAILED;
    }
  }

  classifyTimerError(error) {
    if (error.message?.includes('sync') || error.message?.includes('drift')) {
      return ERROR_TYPES.TIMER_SYNC_FAILED;
    }
    
    return ERROR_TYPES.TIMER_INIT_FAILED;
  }

  classifyProjectError(error, _operation) {
    if (_operation === 'load' || _operation === 'get') {
      return ERROR_TYPES.PROJECT_NOT_FOUND;
    }
    
    if (error.response?.status === 403) {
      return ERROR_TYPES.PROJECT_ACCESS_DENIED;
    }
    
    return ERROR_TYPES.PROJECT_NOT_FOUND;
  }

  classifySettingsError(error, _operation) {
    if (_operation === 'load' || _operation === 'get') {
      return ERROR_TYPES.SETTINGS_LOAD_FAILED;
    }
    
    return ERROR_TYPES.SETTINGS_SAVE_FAILED;
  }

  classifyAuthError(error, _operation) {
    if (error.response?.status === 401) {
      return ERROR_TYPES.API_UNAUTHORIZED;
    }
    
    if (error.response?.status === 403) {
      return ERROR_TYPES.API_FORBIDDEN;
    }
    
    return ERROR_TYPES.API_UNAUTHORIZED;
  }

  classifyUIError(error) {
    if (error.message?.includes('render') || error.name === 'ChunkLoadError') {
      return ERROR_TYPES.UI_RENDER_ERROR;
    }
    
    return ERROR_TYPES.UI_COMPONENT_CRASH;
  }

  // Helper Methods
  isDuplicateError(errorType, context) {
    const key = `${errorType.code}_${context.component || 'unknown'}`;
    const now = Date.now();
    const lastOccurrence = recentErrors.get(key);
    
    if (lastOccurrence && (now - lastOccurrence) < this.config.duplicateTimeWindow) {
      return true;
    }
    
    recentErrors.set(key, now);
    
    // Clean old entries
    setTimeout(() => {
      for (const [k, timestamp] of recentErrors.entries()) {
        if (now - timestamp > this.config.duplicateTimeWindow) {
          recentErrors.delete(k);
        }
      }
    }, this.config.duplicateTimeWindow);
    
    return false;
  }

  logError(errorType, context, originalError) {
    switch (errorType.severity) {
      case ERROR_SEVERITY.LOW:
        logger.info(errorType, context, originalError);
        break;
      case ERROR_SEVERITY.MEDIUM:
        logger.warn(errorType, context, originalError);
        break;
      case ERROR_SEVERITY.HIGH:
        logger.error(errorType, context, originalError);
        break;
      case ERROR_SEVERITY.CRITICAL:
        logger.fatal(errorType, context, originalError);
        break;
      default:
        logger.error(errorType, context, originalError);
    }
  }

  showNotification(errorType, context, options = {}) {
    const duration = options.duration || this.config.notificationDuration;
    const message = options.message || errorType.userMessage;
    
    switch (errorType.severity) {
      case ERROR_SEVERITY.LOW:
        toast(message, { duration, icon: '⚠️' });
        break;
      case ERROR_SEVERITY.MEDIUM:
        toast.error(message, { duration });
        break;
      case ERROR_SEVERITY.HIGH:
        toast.error(message, { duration: duration * 1.5 });
        break;
      case ERROR_SEVERITY.CRITICAL:
        toast.error(message, { 
          duration: duration * 2,
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold'
          }
        });
        break;
      default:
        toast.error(message, { duration });
    }
  }

  async attemptRecovery(errorType, context, originalError) {
    try {
      return await errorRecovery.recover(errorType, context, originalError);
    } catch (recoveryError) {
      logger.error(ERROR_TYPES.UNKNOWN_ERROR, {
        ...context,
        action: 'recovery_failed',
        originalError: errorType.code,
        recoveryError: recoveryError.message
      }, recoveryError);
      
      return {
        success: false,
        error: recoveryError,
        strategy: 'none'
      };
    }
  }

  handleFallback(error, _context) {
    console.error('Critical error handler failure:', error);
    
    // Last resort notification
    if (typeof toast !== 'undefined') {
      toast.error('Ha ocurrido un error crítico. Por favor recarga la página.', {
        duration: 10000
      });
    } else {
      console.error('Ha ocurrido un error crítico. Por favor recarga la página.');
    }
  }

  // Utility Methods
  getStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          return {
            quota: estimate.quota,
            usage: estimate.usage,
            available: estimate.quota - estimate.usage
          };
        });
      }
    } catch (error) {
      return null;
    }
  }

  getConnectionType() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  }

  sanitizeSettings(settings) {
    const sanitized = { ...settings };
    delete sanitized.apiKey;
    delete sanitized.token;
    delete sanitized.password;
    return sanitized;
  }

  sanitizeProps(props) {
    const sanitized = { ...props };
    delete sanitized.onLogin;
    delete sanitized.onSubmit;
    delete sanitized.children;
    return sanitized;
  }

  sanitizeState(state) {
    const sanitized = { ...state };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }

  setupErrorInterceptors() {
    // Intercept fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        throw error;
      }
      return response;
    };
  }

  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return { ...this.config };
  }

  // Statistics
  getStats() {
    return {
      recentErrors: recentErrors.size,
      config: this.config,
      loggerStats: logger.getStats(),
      recoveryStats: errorRecovery.getRecoveryStats()
    };
  }

  // Reset state
  reset() {
    recentErrors.clear();
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export both instance and class
export { errorHandler, ErrorHandler };

// Export convenience methods
export const handleError = errorHandler.handle.bind(errorHandler);
export const handleApiError = errorHandler.api.bind(errorHandler);
export const handleStorageError = errorHandler.storage.bind(errorHandler);
export const handleValidationError = errorHandler.validation.bind(errorHandler);
export const handleNetworkError = errorHandler.network.bind(errorHandler);
export const handleTaskError = errorHandler.task.bind(errorHandler);
export const handleTimerError = errorHandler.timer.bind(errorHandler);
export const handleProjectError = errorHandler.project.bind(errorHandler);
export const handleSettingsError = errorHandler.settings.bind(errorHandler);
export const handleAuthError = errorHandler.auth.bind(errorHandler);
export const handleUIError = errorHandler.ui.bind(errorHandler);

// Default export
export default errorHandler;