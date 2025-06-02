import { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/errors/errorLogger';
import { errorHandler } from '../utils/errorHandler';
import { errorRecovery } from '../utils/errors/errorRecovery';
import { ERROR_CATEGORIES, ERROR_SEVERITY } from '../utils/errors/errorTypes';
import useErrorHandler from '../hooks/useErrorHandler';

export default function ErrorDashboard({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    severity: '',
    since: '',
    component: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { handleError } = useErrorHandler('error-dashboard');

  // Load logs
  useEffect(() => {
    const loadLogs = () => {
      try {
        const allLogs = logger.getLogs(filters);
        setLogs(allLogs);
      } catch (error) {
        handleError('STORAGE_ACCESS_DENIED', { action: 'load_logs' }, error);
      }
    };

    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh, handleError]);

  // Get statistics
  const stats = useMemo(() => {
    if (!logs.length) return null;

    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    return {
      total: logs.length,
      lastHour: logs.filter(log => now - new Date(log.timestamp).getTime() < hour).length,
      lastDay: logs.filter(log => now - new Date(log.timestamp).getTime() < day).length,
      byLevel: logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {}),
      byCategory: logs.reduce((acc, log) => {
        acc[log.errorType.category] = (acc[log.errorType.category] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: logs.reduce((acc, log) => {
        acc[log.errorType.severity] = (acc[log.errorType.severity] || 0) + 1;
        return acc;
      }, {}),
      byComponent: logs.reduce((acc, log) => {
        const component = log.context.component || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {})
    };
  }, [logs]);

  const clearAllLogs = async () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
      try {
        logger.clearLogs();
        setLogs([]);
      } catch (error) {
        handleError('STORAGE_ACCESS_DENIED', { action: 'clear_logs' }, error);
      }
    }
  };

  const exportLogs = () => {
    try {
      const data = logger.exportLogs('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronotask-error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError('UNKNOWN_ERROR', { action: 'export_logs' }, error);
    }
  };

  const getErrorIcon = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return '🔴';
      case ERROR_SEVERITY.HIGH:
        return '🟠';
      case ERROR_SEVERITY.MEDIUM:
        return '🟡';
      case ERROR_SEVERITY.LOW:
        return '🟢';
      default:
        return '⚪';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecoveryStats = () => {
    try {
      return errorRecovery.getRecoveryStats();
    } catch (error) {
      return { error: 'Unable to load recovery stats' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-red-500">🐛</span>
            Panel de Errores
          </h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-actualizar
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'logs', label: 'Logs', icon: '📝' },
              { id: 'recovery', label: 'Recuperación', icon: '🔧' },
              { id: 'config', label: 'Configuración', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">Total Errores</h3>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.total}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Última Hora</h3>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.lastHour}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Último Día</h3>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.lastDay}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-400">Componentes</h3>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {Object.keys(stats.byComponent).length}
                    </p>
                  </div>
                </div>
              )}

              {/* Error breakdown by category */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Por Categoría</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.byCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between">
                          <span className="text-sm">{category}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Por Severidad</h3>
                    <div className="space-y-2">
                      {Object.entries(stats.bySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            {getErrorIcon(severity)} {severity}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                >
                  <option value="">Todos los niveles</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                >
                  <option value="">Todas las categorías</option>
                  {Object.values(ERROR_CATEGORIES).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                >
                  <option value="">Todas las severidades</option>
                  {Object.values(ERROR_SEVERITY).map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Componente..."
                  value={filters.component}
                  onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={clearAllLogs}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={exportLogs}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Exportar
                  </button>
                </div>
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay logs que mostrar
                  </div>
                ) : (
                  logs.slice(0, 100).map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{getErrorIcon(log.errorType.severity)}</span>
                            <span className="font-medium">{log.errorType.code}</span>
                            <span className="text-sm text-gray-500">
                              {log.context.component}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {log.errorType.message}
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Categoría: {log.errorType.category}</div>
                            <div>Severidad: {log.errorType.severity}</div>
                            <div>Acción: {log.context.action || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.level === 'error' || log.level === 'fatal'
                              ? 'bg-red-100 text-red-800'
                              : log.level === 'warn'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Estadísticas de Recuperación</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(getRecoveryStats(), null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Configuración del Manejador de Errores</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(errorHandler.getConfig(), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}