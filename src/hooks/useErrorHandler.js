import { useCallback, useState, useEffect, useRef } from 'react';
import { errorHandler, handleApiError, handleStorageError, handleValidationError, 
         handleNetworkError, handleTaskError, handleTimerError, handleProjectError, 
         handleSettingsError, handleAuthError, handleUIError } from '../utils/errorHandler';
import { ERROR_TYPES, getErrorType } from '../utils/errors/errorTypes';

export function useErrorHandler(componentName = 'unknown') {
  const [lastError, setLastError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const componentRef = useRef(componentName);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Base error handler that includes component context
  const handleError = useCallback(async (errorTypeOrCode, context = {}, originalError = null, options = {}) => {
    if (!mountedRef.current) return;

    const enrichedContext = {
      component: componentRef.current,
      timestamp: new Date().toISOString(),
      ...context
    };

    try {
      setIsRecovering(true);
      const result = await errorHandler.handle(errorTypeOrCode, enrichedContext, originalError, options);
      
      if (mountedRef.current) {
        setLastError({
          errorType: result.errorType,
          context: enrichedContext,
          result,
          timestamp: Date.now()
        });

        setErrorHistory(prev => [
          { errorType: result.errorType, context: enrichedContext, timestamp: Date.now() },
          ...prev.slice(0, 9) // Keep last 10 errors
        ]);
      }

      return result;
    } finally {
      if (mountedRef.current) {
        setIsRecovering(false);
      }
    }
  }, []);

  // API errors
  const handleApi = useCallback(async (error, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleApiError(error, enrichedContext, options);
  }, []);

  // Storage errors
  const handleStorage = useCallback(async (error, operation = 'unknown', context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleStorageError(error, operation, enrichedContext, options);
  }, []);

  // Validation errors
  const handleValidation = useCallback(async (errors, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleValidationError(errors, enrichedContext, options);
  }, []);

  // Network errors
  const handleNetwork = useCallback(async (error, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleNetworkError(error, enrichedContext, options);
  }, []);

  // Task management errors
  const handleTask = useCallback(async (error, operation, taskData = {}, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleTaskError(error, operation, taskData, enrichedContext, options);
  }, []);

  // Timer errors
  const handleTimer = useCallback(async (error, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleTimerError(error, enrichedContext, options);
  }, []);

  // Project errors
  const handleProject = useCallback(async (error, operation, projectData = {}, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleProjectError(error, operation, projectData, enrichedContext, options);
  }, []);

  // Settings errors
  const handleSettings = useCallback(async (error, operation, settingsData = {}, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleSettingsError(error, operation, settingsData, enrichedContext, options);
  }, []);

  // Authentication errors
  const handleAuth = useCallback(async (error, operation = 'unknown', context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleAuthError(error, operation, enrichedContext, options);
  }, []);

  // UI component errors
  const handleUI = useCallback(async (error, context = {}, options = {}) => {
    const enrichedContext = { component: componentRef.current, ...context };
    return handleUIError(error, componentRef.current, enrichedContext, options);
  }, []);

  // Async operation wrapper with error handling
  const withErrorHandling = useCallback((operation, errorType = 'UNKNOWN_ERROR', context = {}) => {
    return async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        await handleError(errorType, { operation: operation.name, ...context }, error);
        throw error;
      }
    };
  }, [handleError]);

  // Form submission wrapper
  const handleFormSubmit = useCallback((submitFn, validationFn = null) => {
    return async (data) => {
      try {
        // Validate if validation function provided
        if (validationFn) {
          const validation = validationFn(data);
          if (!validation.success) {
            await handleValidation(validation.errors, { action: 'form_submit' });
            return { success: false, errors: validation.errors };
          }
        }

        // Submit form
        const result = await submitFn(data);
        return { success: true, result };

      } catch (error) {
        await handleError('VALIDATION_INVALID_FORMAT', { action: 'form_submit' }, error);
        return { success: false, error };
      }
    };
  }, [handleError, handleValidation]);

  // API request wrapper
  const apiRequest = useCallback((requestFn, endpoint = 'unknown') => {
    return async (...args) => {
      try {
        const result = await requestFn(...args);
        return { success: true, data: result };
      } catch (error) {
        const handled = await handleApi(error, { endpoint, action: 'api_request' });
        return { 
          success: false, 
          error, 
          handled: handled.success,
          recovery: handled.recovery 
        };
      }
    };
  }, [handleApi]);

  // Storage operation wrapper
  const storageOperation = useCallback((operation, key, storageType = 'localStorage') => {
    return async (...args) => {
      try {
        const result = await operation(...args);
        return { success: true, data: result };
      } catch (error) {
        const handled = await handleStorage(error, operation.name, { 
          key, 
          storageType,
          action: 'storage_operation' 
        });
        return { 
          success: false, 
          error, 
          handled: handled.success,
          recovery: handled.recovery 
        };
      }
    };
  }, [handleStorage]);

  // Clear error state
  const clearErrors = useCallback(() => {
    setLastError(null);
    setErrorHistory([]);
  }, []);

  // Clear last error
  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return {
      lastError,
      errorCount: errorHistory.length,
      errorHistory,
      isRecovering,
      component: componentRef.current
    };
  }, [lastError, errorHistory, isRecovering]);

  // Check if component has errors
  const hasErrors = lastError !== null;
  const hasRecentErrors = errorHistory.length > 0;
  const recentErrorCount = errorHistory.filter(
    error => Date.now() - error.timestamp < 300000 // Last 5 minutes
  ).length;

  return {
    // Error handlers
    handleError,
    handleApi,
    handleStorage,
    handleValidation,
    handleNetwork,
    handleTask,
    handleTimer,
    handleProject,
    handleSettings,
    handleAuth,
    handleUI,

    // Wrapper functions
    withErrorHandling,
    handleFormSubmit,
    apiRequest,
    storageOperation,

    // Error state
    lastError,
    errorHistory,
    isRecovering,
    hasErrors,
    hasRecentErrors,
    recentErrorCount,

    // Error management
    clearErrors,
    clearLastError,
    getErrorStats,

    // Constants for convenience
    ERROR_TYPES
  };
}

// Specialized hooks for common use cases
export function useApiErrorHandler(componentName) {
  const { handleApi, apiRequest, ...rest } = useErrorHandler(componentName);
  
  return {
    handleError: handleApi,
    request: apiRequest,
    ...rest
  };
}

export function useFormErrorHandler(componentName) {
  const { handleValidation, handleFormSubmit, ...rest } = useErrorHandler(componentName);
  
  return {
    handleError: handleValidation,
    submitForm: handleFormSubmit,
    ...rest
  };
}

export function useStorageErrorHandler(componentName) {
  const { handleStorage, storageOperation, ...rest } = useErrorHandler(componentName);
  
  return {
    handleError: handleStorage,
    operation: storageOperation,
    ...rest
  };
}

// Error boundary hook for components
export function useErrorBoundary(componentName) {
  const { handleUI, clearErrors } = useErrorHandler(componentName);
  const [hasError, setHasError] = useState(false);

  const resetError = useCallback(() => {
    setHasError(false);
    clearErrors();
  }, [clearErrors]);

  const captureError = useCallback(async (error, errorInfo) => {
    setHasError(true);
    await handleUI(error, { 
      action: 'component_error',
      errorInfo,
      componentStack: errorInfo?.componentStack 
    });
  }, [handleUI]);

  return {
    hasError,
    resetError,
    captureError
  };
}

export default useErrorHandler;