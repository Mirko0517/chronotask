import { useState, useEffect } from 'react';
import { logger } from '../utils/errors/errorLogger';
import { errorHandler } from '../utils/errorHandler';
import ErrorDashboard from './ErrorDashboard';
import useErrorHandler from '../hooks/useErrorHandler';

export default function ErrorStatus() {
  const [errorStats, setErrorStats] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [recentErrors, setRecentErrors] = useState([]);
  const { hasRecentErrors, recentErrorCount, clearErrors } = useErrorHandler('error-status');

  useEffect(() => {
    const updateStats = () => {
      try {
        const stats = logger.getStats();
        const handlerStats = errorHandler.getStats();
        setErrorStats({ ...stats, ...handlerStats });

        // Get recent errors (last 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const recent = logger.getLogs({
          since: new Date(fiveMinutesAgo).toISOString()
        });
        setRecentErrors(recent.slice(0, 3)); // Show only last 3
      } catch (error) {
        console.warn('Failed to load error stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (!errorStats && !hasRecentErrors) {
    return null; // Don't show anything if no errors
  }

  const hasErrors = recentErrorCount > 0 || recentErrors.length > 0;

  return (
    <>
      {hasErrors && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-red-500">🚨</span>
                <span className="text-sm font-medium text-red-800 dark:text-red-400">
                  {recentErrorCount || recentErrors.length} error(es) reciente(s)
                </span>
              </div>
              <button
                onClick={() => setShowDashboard(true)}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Ver detalles
              </button>
            </div>

            {recentErrors.length > 0 && (
              <div className="space-y-1 mb-3">
                {recentErrors.map((error, index) => (
                  <div key={error.id || index} className="text-xs text-red-700 dark:text-red-300 truncate">
                    <span className="font-medium">{error.errorType.code}:</span>
                    <span className="ml-1">{error.errorType.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={clearErrors}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowDashboard(true)}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dashboard Modal */}
      <ErrorDashboard 
        isOpen={showDashboard} 
        onClose={() => setShowDashboard(false)} 
      />
    </>
  );
}