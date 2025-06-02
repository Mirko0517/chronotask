import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import toast from 'react-hot-toast';

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }) {
  React.useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
    }
    
    // Show toast notification
    toast.error('Algo salió mal. Intenta recargar la página.');
  }, [error]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¡Ups! Algo salió mal
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página o contactar al soporte si el problema persiste.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detalles del error (solo en desarrollo)
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Intentar de nuevo
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Recargar página
            </button>
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

// Error Logger Function
const logError = (error, errorInfo) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Boundary Caught an Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }
  
  // In production, you could send to an error tracking service
  // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  
  // For now, we'll just log basic info
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('token') ? 'logged-in' : 'anonymous'
  };
  
  // Store error in localStorage for debugging (limit to last 10 errors)
  try {
    const storedErrors = JSON.parse(localStorage.getItem('chronotask_errors') || '[]');
    const updatedErrors = [errorData, ...storedErrors.slice(0, 9)];
    localStorage.setItem('chronotask_errors', JSON.stringify(updatedErrors));
  } catch (storageError) {
    console.warn('Could not store error in localStorage:', storageError);
  }
};

// Main Error Boundary Component
export default function ErrorBoundary({ children, fallback, onError }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={onError || logError}
      onReset={() => {
        // Clear any error states in stores
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Specific Error Boundaries for different parts of the app
export function TaskErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={({ resetErrorBoundary }) => (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
            Error en la gestión de tareas
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            No se pueden cargar las tareas en este momento.
          </p>
          <button
            onClick={resetErrorBoundary}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}
      onError={logError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export function TimerErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={({ resetErrorBoundary }) => (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
            Error en el temporizador
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            El temporizador no funciona correctamente.
          </p>
          <button
            onClick={resetErrorBoundary}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
          >
            Reiniciar temporizador
          </button>
        </div>
      )}
      onError={logError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Hook for manually reporting errors
export function useErrorHandler() {
  const reportError = React.useCallback((error, context = {}) => {
    logError(error, context);
    toast.error('Ha ocurrido un error. Por favor, intenta de nuevo.');
  }, []);
  
  return { reportError };
}