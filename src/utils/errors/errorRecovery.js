import { RECOVERY_STRATEGIES, ERROR_SEVERITY, getErrorType } from './errorTypes.js';
import { logger } from './errorLogger.js';
import toast from 'react-hot-toast';

// Recovery attempt tracking
const recoveryAttempts = new Map();
const circuitBreakers = new Map();

// Recovery configuration
const RECOVERY_CONFIG = {
  maxRetries: 3,
  baseRetryDelay: 1000,
  maxRetryDelay: 10000,
  retryMultiplier: 2,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  fallbackTimeout: 5000
};

class ErrorRecovery {
  constructor(config = {}) {
    this.config = { ...RECOVERY_CONFIG, ...config };
    this.recoveryCallbacks = new Map();
    this.fallbackStrategies = new Map();
    this.setupDefaultFallbacks();
  }

  // Main recovery method
  async recover(errorType, context = {}, originalError = null) {
    const recoveryId = this.generateRecoveryId(errorType, context);
    
    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(errorType.code)) {
        return this.handleCircuitBreakerOpen(errorType, context);
      }

      // Log recovery attempt
      logger.info(getErrorType('UNKNOWN_ERROR'), {
        ...context,
        action: 'recovery_attempt',
        recovery: errorType.recovery,
        attempt: this.getAttemptCount(recoveryId)
      });

      // Execute recovery strategy
      const result = await this.executeRecoveryStrategy(errorType, context, originalError, recoveryId);

      // Reset attempts on success
      if (result.success) {
        this.resetAttempts(recoveryId);
        this.resetCircuitBreaker(errorType.code);
      }

      return result;

    } catch (recoveryError) {
      // Recovery itself failed
      logger.error(getErrorType('UNKNOWN_ERROR'), {
        ...context,
        action: 'recovery_failed',
        recoveryError: recoveryError.message
      }, recoveryError);

      return this.handleRecoveryFailure(errorType, context, recoveryError);
    }
  }

  async executeRecoveryStrategy(errorType, context, originalError, recoveryId) {
    switch (errorType.recovery) {
      case RECOVERY_STRATEGIES.RETRY:
        return this.handleRetry(errorType, context, originalError, recoveryId);

      case RECOVERY_STRATEGIES.REFRESH:
        return this.handleRefresh(errorType, context);

      case RECOVERY_STRATEGIES.FALLBACK:
        return this.handleFallback(errorType, context, originalError);

      case RECOVERY_STRATEGIES.REDIRECT:
        return this.handleRedirect(errorType, context);

      case RECOVERY_STRATEGIES.MANUAL:
        return this.handleManual(errorType, context);

      case RECOVERY_STRATEGIES.IGNORE:
        return this.handleIgnore(errorType, context);

      case RECOVERY_STRATEGIES.REPORT:
        return this.handleReport(errorType, context, originalError);

      default:
        return this.handleUnknownStrategy(errorType, context);
    }
  }

  // Retry strategy with exponential backoff
  async handleRetry(errorType, context, originalError, recoveryId) {
    const attemptCount = this.getAttemptCount(recoveryId);
    
    if (attemptCount >= this.config.maxRetries) {
      this.incrementCircuitBreaker(errorType.code);
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.RETRY,
        reason: 'max_retries_exceeded',
        message: 'Se agotaron los intentos de reintento',
        fallbackRequired: true
      };
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(this.config.retryMultiplier, attemptCount),
      this.config.maxRetryDelay
    );

    // Add jitter to prevent thundering herd
    const jitteredDelay = delay + (Math.random() * 1000);

    await this.delay(jitteredDelay);

    this.incrementAttempts(recoveryId);

    // Execute retry callback if available
    const retryCallback = this.recoveryCallbacks.get(`${errorType.code}_retry`);
    if (retryCallback) {
      try {
        const result = await retryCallback(context, attemptCount);
        
        if (result.success) {
          toast.success('Operación completada correctamente');
          return {
            success: true,
            strategy: RECOVERY_STRATEGIES.RETRY,
            attempts: attemptCount + 1,
            message: 'Operación reintentada exitosamente'
          };
        }
      } catch (error) {
        // Retry callback failed, continue with normal retry logic
      }
    }

    return {
      success: false,
      strategy: RECOVERY_STRATEGIES.RETRY,
      attempts: attemptCount + 1,
      willRetry: attemptCount + 1 < this.config.maxRetries,
      nextRetryIn: attemptCount + 1 < this.config.maxRetries ? jitteredDelay : null,
      message: `Reintentando... (${attemptCount + 1}/${this.config.maxRetries})`
    };
  }

  // Refresh strategy
  async handleRefresh(errorType, context) {
    const refreshCallback = this.recoveryCallbacks.get(`${errorType.code}_refresh`);
    
    if (refreshCallback) {
      try {
        await refreshCallback(context);
        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.REFRESH,
          message: 'Contenido actualizado correctamente'
        };
      } catch (error) {
        // Fallback to page refresh
      }
    }

    // Show user notification before refresh
    toast.loading('Actualizando página...', { duration: 2000 });

    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return {
      success: true,
      strategy: RECOVERY_STRATEGIES.REFRESH,
      message: 'Recargando página...'
    };
  }

  // Fallback strategy
  async handleFallback(errorType, context, originalError) {
    const fallbackStrategy = this.fallbackStrategies.get(errorType.code);
    
    if (!fallbackStrategy) {
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        reason: 'no_fallback_available',
        message: 'No hay estrategia de respaldo disponible'
      };
    }

    try {
      const result = await Promise.race([
        fallbackStrategy(context, originalError),
        this.createTimeoutPromise(this.config.fallbackTimeout)
      ]);

      return {
        success: true,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        result,
        message: 'Usando estrategia de respaldo'
      };

    } catch (error) {
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        reason: 'fallback_failed',
        error: error.message,
        message: 'La estrategia de respaldo falló'
      };
    }
  }

  // Redirect strategy
  async handleRedirect(errorType, context) {
    const redirectUrl = this.getRedirectUrl(errorType, context);
    
    if (!redirectUrl) {
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.REDIRECT,
        reason: 'no_redirect_url',
        message: 'No se pudo determinar la URL de redirección'
      };
    }

    toast.info(`Redirigiendo a ${redirectUrl}...`);

    setTimeout(() => {
      if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        // Assuming client-side routing
        window.history.pushState(null, '', redirectUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 1000);

    return {
      success: true,
      strategy: RECOVERY_STRATEGIES.REDIRECT,
      url: redirectUrl,
      message: 'Redirigiendo...'
    };
  }

  // Manual intervention required
  async handleManual(errorType, context) {
    const manualInstructions = this.getManualInstructions(errorType, context);
    
    // Show detailed error message to user
    toast.error(errorType.userMessage, {
      duration: 8000,
      style: {
        maxWidth: '500px'
      }
    });

    // Log for manual intervention tracking
    logger.warn(errorType, {
      ...context,
      action: 'manual_intervention_required',
      instructions: manualInstructions
    });

    return {
      success: false,
      strategy: RECOVERY_STRATEGIES.MANUAL,
      requiresUserAction: true,
      instructions: manualInstructions,
      message: errorType.userMessage
    };
  }

  // Ignore strategy
  async handleIgnore(errorType, context) {
    logger.debug(errorType, {
      ...context,
      action: 'error_ignored'
    });

    return {
      success: true,
      strategy: RECOVERY_STRATEGIES.IGNORE,
      message: 'Error ignorado según configuración'
    };
  }

  // Report strategy
  async handleReport(errorType, context, originalError) {
    // Log the error for reporting
    logger.error(errorType, {
      ...context,
      action: 'error_reported',
      reportId: this.generateReportId()
    }, originalError);

    // Send to external error tracking service
    await this.sendErrorReport(errorType, context, originalError);

    // Show user-friendly message
    toast.error('Se ha reportado un error. Nuestro equipo lo revisará.', {
      duration: 5000
    });

    return {
      success: true,
      strategy: RECOVERY_STRATEGIES.REPORT,
      reported: true,
      message: 'Error reportado para revisión'
    };
  }

  // Unknown strategy handler
  async handleUnknownStrategy(errorType, context) {
    logger.warn(getErrorType('UNKNOWN_ERROR'), {
      ...context,
      action: 'unknown_recovery_strategy',
      strategy: errorType.recovery
    });

    // Default to manual handling
    return this.handleManual(errorType, context);
  }

  // Recovery failure handler
  async handleRecoveryFailure(errorType, context, recoveryError) {
    // Try fallback if original strategy wasn't fallback
    if (errorType.recovery !== RECOVERY_STRATEGIES.FALLBACK) {
      const fallbackErrorType = { ...errorType, recovery: RECOVERY_STRATEGIES.FALLBACK };
      return this.handleFallback(fallbackErrorType, context, recoveryError);
    }

    // If fallback also failed, require manual intervention
    const manualErrorType = { ...errorType, recovery: RECOVERY_STRATEGIES.MANUAL };
    return this.handleManual(manualErrorType, context);
  }

  // Circuit breaker methods
  isCircuitBreakerOpen(errorCode) {
    const breaker = circuitBreakers.get(errorCode);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      if (Date.now() - breaker.lastFailure > this.config.circuitBreakerTimeout) {
        breaker.state = 'half-open';
        breaker.failures = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  incrementCircuitBreaker(errorCode) {
    const breaker = circuitBreakers.get(errorCode) || {
      failures: 0,
      state: 'closed',
      lastFailure: null
    };

    breaker.failures += 1;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.state = 'open';
      logger.warn(getErrorType('UNKNOWN_ERROR'), {
        action: 'circuit_breaker_opened',
        errorCode,
        failures: breaker.failures
      });
    }

    circuitBreakers.set(errorCode, breaker);
  }

  resetCircuitBreaker(errorCode) {
    const breaker = circuitBreakers.get(errorCode);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      breaker.lastFailure = null;
    }
  }

  handleCircuitBreakerOpen(_errorType, _context) {
    toast.error('Servicio temporalmente no disponible. Intenta más tarde.', {
      duration: 5000
    });

    return {
      success: false,
      strategy: 'circuit_breaker',
      reason: 'circuit_breaker_open',
      message: 'Circuito abierto - demasiados fallos recientes'
    };
  }

  // Attempt tracking
  generateRecoveryId(errorType, context) {
    return `${errorType.code}_${context.component || 'unknown'}_${context.action || 'unknown'}`;
  }

  getAttemptCount(recoveryId) {
    return recoveryAttempts.get(recoveryId) || 0;
  }

  incrementAttempts(recoveryId) {
    const current = this.getAttemptCount(recoveryId);
    recoveryAttempts.set(recoveryId, current + 1);
  }

  resetAttempts(recoveryId) {
    recoveryAttempts.delete(recoveryId);
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );
  }

  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  getRedirectUrl(errorType, _context) {
    const redirectMap = {
      'API_UNAUTHORIZED': '/login',
      'API_FORBIDDEN': '/',
      'PROJECT_NOT_FOUND': '/projects',
      'TASK_NOT_FOUND': '/tasks'
    };

    return redirectMap[errorType.code] || '/';
  }

  getManualInstructions(errorType, _context) {
    const instructionMap = {
      'STORAGE_QUOTA_EXCEEDED': [
        'Libera espacio en tu navegador',
        'Cierra pestañas innecesarias',
        'Borra datos de navegación antiguos',
        'Contacta soporte si persiste'
      ],
      'NETWORK_OFFLINE': [
        'Verifica tu conexión a internet',
        'Intenta recargar la página',
        'Revisa la configuración de red'
      ],
      'VALIDATION_REQUIRED_FIELD': [
        'Completa todos los campos marcados como requeridos',
        'Verifica que los datos sean válidos'
      ]
    };

    return instructionMap[errorType.code] || [
      'Intenta recargar la página',
      'Verifica tu conexión a internet',
      'Contacta soporte si el problema persiste'
    ];
  }

  async sendErrorReport(errorType, _context, originalError) {
    // In a real implementation, this would send to an error tracking service
    // like Sentry, Bugsnag, or a custom endpoint
    try {
      const report = {
        errorCode: errorType.code,
        category: errorType.category,
        severity: errorType.severity,
        message: errorType.message,
        context: _context,
        stack: originalError?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Simulate API call
      console.log('Error report sent:', report);
      
      // In production, replace with actual API call:
      // await fetch('/api/error-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // });

    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  // Setup default fallback strategies
  setupDefaultFallbacks() {
    // Storage fallbacks
    this.fallbackStrategies.set('STORAGE_ACCESS_DENIED', async () => {
      // Use memory storage as fallback
      return { strategy: 'memory_storage', temporary: true };
    });

    this.fallbackStrategies.set('STORAGE_QUOTA_EXCEEDED', async () => {
      // Clear old data and retry
      try {
        const oldData = Object.keys(localStorage)
          .filter(key => key.startsWith('chronotask_'))
          .slice(0, -10); // Keep last 10 items
        
        oldData.forEach(key => localStorage.removeItem(key));
        return { strategy: 'storage_cleanup', cleared: oldData.length };
      } catch (error) {
        throw new Error('Storage cleanup failed');
      }
    });

    // API fallbacks
    this.fallbackStrategies.set('API_NETWORK_ERROR', async (context) => {
      // Use cached data if available
      const cacheKey = `cache_${context.endpoint || 'unknown'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        return { 
          strategy: 'cached_data', 
          data: JSON.parse(cached),
          stale: true 
        };
      }
      
      throw new Error('No cached data available');
    });

    this.fallbackStrategies.set('API_SERVER_ERROR', async () => {
      // Provide default/mock data
      return {
        strategy: 'default_data',
        data: this.getDefaultData(),
        mock: true
      };
    });
  }

  getDefaultData() {
    return {
      tasks: [],
      projects: [],
      settings: {
        work: 25,
        break: 5,
        longBreak: 15,
        sound: true,
        theme: 'system'
      }
    };
  }

  // Public API for registering custom strategies
  registerRecoveryCallback(errorCode, strategy, callback) {
    const key = `${errorCode}_${strategy}`;
    this.recoveryCallbacks.set(key, callback);
  }

  registerFallbackStrategy(errorCode, strategy) {
    this.fallbackStrategies.set(errorCode, strategy);
  }

  unregisterRecoveryCallback(errorCode, strategy) {
    const key = `${errorCode}_${strategy}`;
    this.recoveryCallbacks.delete(key);
  }

  // Statistics and monitoring
  getRecoveryStats() {
    return {
      attemptCounts: Object.fromEntries(recoveryAttempts),
      circuitBreakers: Object.fromEntries(circuitBreakers),
      registeredCallbacks: this.recoveryCallbacks.size,
      registeredFallbacks: this.fallbackStrategies.size
    };
  }

  // Reset all recovery state
  reset() {
    recoveryAttempts.clear();
    circuitBreakers.clear();
    this.recoveryCallbacks.clear();
    this.fallbackStrategies.clear();
    this.setupDefaultFallbacks();
  }
}

// Create singleton instance
export const errorRecovery = new ErrorRecovery();

// Export class for testing
export { ErrorRecovery };