// Error Categories
export const ERROR_CATEGORIES = {
  API: 'api',
  STORAGE: 'storage',
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  TASK: 'task',
  TIMER: 'timer',
  PROJECT: 'project',
  SETTINGS: 'settings',
  UI: 'ui',
  UNKNOWN: 'unknown'
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',           // Minor issues, app continues normally
  MEDIUM: 'medium',     // Noticeable issues, some features affected
  HIGH: 'high',         // Major issues, core functionality affected
  CRITICAL: 'critical'  // App-breaking issues, immediate attention required
};

// Error Recovery Strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',                    // Automatic retry
  REFRESH: 'refresh',                // Refresh page/component
  FALLBACK: 'fallback',              // Use fallback mechanism
  REDIRECT: 'redirect',              // Redirect to safe page
  MANUAL: 'manual',                  // Manual user intervention required
  IGNORE: 'ignore',                  // Log but continue
  REPORT: 'report'                   // Report to error tracking service
};

// Specific Error Types
export const ERROR_TYPES = {
  // API Errors
  API_NETWORK_ERROR: {
    code: 'API_NETWORK_ERROR',
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Error de conexión con el servidor',
    userMessage: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
  },
  
  API_TIMEOUT: {
    code: 'API_TIMEOUT',
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Timeout en petición API',
    userMessage: 'La operación está tardando más de lo esperado. Intenta de nuevo.'
  },
  
  API_SERVER_ERROR: {
    code: 'API_SERVER_ERROR',
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.REPORT,
    message: 'Error interno del servidor',
    userMessage: 'Error interno del servidor. Por favor intenta más tarde.'
  },
  
  API_NOT_FOUND: {
    code: 'API_NOT_FOUND',
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Recurso no encontrado',
    userMessage: 'El recurso solicitado no fue encontrado.'
  },
  
  API_UNAUTHORIZED: {
    code: 'API_UNAUTHORIZED',
    category: ERROR_CATEGORIES.AUTHENTICATION,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.REDIRECT,
    message: 'No autorizado',
    userMessage: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
  },
  
  API_FORBIDDEN: {
    code: 'API_FORBIDDEN',
    category: ERROR_CATEGORIES.PERMISSION,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Acceso denegado',
    userMessage: 'No tienes permisos para realizar esta acción.'
  },
  
  API_RATE_LIMIT: {
    code: 'API_RATE_LIMIT',
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Límite de peticiones excedido',
    userMessage: 'Has realizado demasiadas peticiones. Espera un momento e intenta de nuevo.'
  },
  
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED: {
    code: 'STORAGE_QUOTA_EXCEEDED',
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Cuota de almacenamiento excedida',
    userMessage: 'El almacenamiento local está lleno. Libera espacio o contacta soporte.'
  },
  
  STORAGE_ACCESS_DENIED: {
    code: 'STORAGE_ACCESS_DENIED',
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Acceso a almacenamiento denegado',
    userMessage: 'No se puede acceder al almacenamiento. Verifica los permisos del navegador.'
  },
  
  STORAGE_CORRUPTION: {
    code: 'STORAGE_CORRUPTION',
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.CRITICAL,
    recovery: RECOVERY_STRATEGIES.REFRESH,
    message: 'Datos corrompidos en almacenamiento',
    userMessage: 'Los datos locales están corrompidos. Se reiniciarán las configuraciones.'
  },
  
  STORAGE_PARSE_ERROR: {
    code: 'STORAGE_PARSE_ERROR',
    category: ERROR_CATEGORIES.STORAGE,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Error al parsear datos de almacenamiento',
    userMessage: 'Error al leer los datos guardados. Se usarán valores por defecto.'
  },
  
  // Validation Errors
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    category: ERROR_CATEGORIES.VALIDATION,
    severity: ERROR_SEVERITY.LOW,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Campo requerido faltante',
    userMessage: 'Por favor completa todos los campos requeridos.'
  },
  
  VALIDATION_INVALID_FORMAT: {
    code: 'VALIDATION_INVALID_FORMAT',
    category: ERROR_CATEGORIES.VALIDATION,
    severity: ERROR_SEVERITY.LOW,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Formato inválido',
    userMessage: 'El formato del dato ingresado no es válido.'
  },
  
  VALIDATION_OUT_OF_RANGE: {
    code: 'VALIDATION_OUT_OF_RANGE',
    category: ERROR_CATEGORIES.VALIDATION,
    severity: ERROR_SEVERITY.LOW,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Valor fuera de rango',
    userMessage: 'El valor ingresado está fuera del rango permitido.'
  },
  
  // Task Management Errors
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    category: ERROR_CATEGORIES.TASK,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.REFRESH,
    message: 'Tarea no encontrada',
    userMessage: 'La tarea que buscas no existe o fue eliminada.'
  },
  
  TASK_CREATION_FAILED: {
    code: 'TASK_CREATION_FAILED',
    category: ERROR_CATEGORIES.TASK,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Error al crear tarea',
    userMessage: 'No se pudo crear la tarea. Intenta de nuevo.'
  },
  
  TASK_UPDATE_FAILED: {
    code: 'TASK_UPDATE_FAILED',
    category: ERROR_CATEGORIES.TASK,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Error al actualizar tarea',
    userMessage: 'No se pudo actualizar la tarea. Intenta de nuevo.'
  },
  
  TASK_DELETE_FAILED: {
    code: 'TASK_DELETE_FAILED',
    category: ERROR_CATEGORIES.TASK,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Error al eliminar tarea',
    userMessage: 'No se pudo eliminar la tarea. Intenta de nuevo.'
  },
  
  // Timer Errors
  TIMER_INIT_FAILED: {
    code: 'TIMER_INIT_FAILED',
    category: ERROR_CATEGORIES.TIMER,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.REFRESH,
    message: 'Error al inicializar temporizador',
    userMessage: 'No se pudo iniciar el temporizador. Recarga la página.'
  },
  
  TIMER_SYNC_FAILED: {
    code: 'TIMER_SYNC_FAILED',
    category: ERROR_CATEGORIES.TIMER,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Error de sincronización del temporizador',
    userMessage: 'El temporizador perdió sincronización. Reinicia la sesión.'
  },
  
  // Project Errors
  PROJECT_NOT_FOUND: {
    code: 'PROJECT_NOT_FOUND',
    category: ERROR_CATEGORIES.PROJECT,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Proyecto no encontrado',
    userMessage: 'El proyecto seleccionado no existe o fue eliminado.'
  },
  
  PROJECT_ACCESS_DENIED: {
    code: 'PROJECT_ACCESS_DENIED',
    category: ERROR_CATEGORIES.PROJECT,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.MANUAL,
    message: 'Acceso al proyecto denegado',
    userMessage: 'No tienes permisos para acceder a este proyecto.'
  },
  
  // Settings Errors
  SETTINGS_LOAD_FAILED: {
    code: 'SETTINGS_LOAD_FAILED',
    category: ERROR_CATEGORIES.SETTINGS,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Error al cargar configuraciones',
    userMessage: 'No se pudieron cargar las configuraciones. Se usarán valores por defecto.'
  },
  
  SETTINGS_SAVE_FAILED: {
    code: 'SETTINGS_SAVE_FAILED',
    category: ERROR_CATEGORIES.SETTINGS,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.RETRY,
    message: 'Error al guardar configuraciones',
    userMessage: 'No se pudieron guardar las configuraciones. Intenta de nuevo.'
  },
  
  // Network Errors
  NETWORK_OFFLINE: {
    code: 'NETWORK_OFFLINE',
    category: ERROR_CATEGORIES.NETWORK,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Sin conexión a internet',
    userMessage: 'Sin conexión a internet. Trabajando en modo offline.'
  },
  
  NETWORK_SLOW: {
    code: 'NETWORK_SLOW',
    category: ERROR_CATEGORIES.NETWORK,
    severity: ERROR_SEVERITY.LOW,
    recovery: RECOVERY_STRATEGIES.IGNORE,
    message: 'Conexión lenta detectada',
    userMessage: 'Conexión lenta detectada. Algunas funciones pueden tardar más.'
  },
  
  // UI Errors
  UI_COMPONENT_CRASH: {
    code: 'UI_COMPONENT_CRASH',
    category: ERROR_CATEGORIES.UI,
    severity: ERROR_SEVERITY.HIGH,
    recovery: RECOVERY_STRATEGIES.REFRESH,
    message: 'Componente UI falló',
    userMessage: 'Un componente de la interfaz falló. Recarga la página.'
  },
  
  UI_RENDER_ERROR: {
    code: 'UI_RENDER_ERROR',
    category: ERROR_CATEGORIES.UI,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.FALLBACK,
    message: 'Error de renderizado',
    userMessage: 'Error al mostrar el contenido. Intenta refrescar.'
  },
  
  // Unknown Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    category: ERROR_CATEGORIES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    recovery: RECOVERY_STRATEGIES.REPORT,
    message: 'Error desconocido',
    userMessage: 'Ocurrió un error inesperado. Por favor contacta soporte.'
  }
};

// Helper function to get error type by code
export const getErrorType = (code) => {
  return ERROR_TYPES[code] || ERROR_TYPES.UNKNOWN_ERROR;
};

// Helper function to check if error should be retried
export const shouldRetry = (errorType) => {
  return errorType.recovery === RECOVERY_STRATEGIES.RETRY;
};

// Helper function to check error severity
export const isCriticalError = (errorType) => {
  return errorType.severity === ERROR_SEVERITY.CRITICAL;
};

// Helper function to get errors by category
export const getErrorsByCategory = (category) => {
  return Object.values(ERROR_TYPES).filter(error => error.category === category);
};