import { useState, useEffect } from 'react';
import useSettingsStore from '../store/useSettingsStore';
import { validateSettings, validateField, settingsSchema } from '../schemas';
import toast from 'react-hot-toast';

export default function SettingsPanel() {
  const {
    settings,
    isLoading,
    error,
    isDirty,
    updateSetting,
    updateSettings,
    resetToDefaults,
    clearError
  } = useSettingsStore();

  const [formErrors, setFormErrors] = useState({});
  const [validationState, setValidationState] = useState({});
  const [localSettings, setLocalSettings] = useState(settings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync local settings with store
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Clear errors after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Validate field in real-time
  const validateFormField = (field, value) => {
    const validation = validateField(settingsSchema, field, value);
    
    setFormErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? null : validation.error
    }));
    
    setValidationState(prev => ({
      ...prev,
      [field]: validation.isValid ? 'valid' : 'invalid'
    }));
    
    return validation.isValid;
  };

  // Handle input changes with validation
  const handleSettingChange = async (field, value) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    
    if (validateFormField(field, value)) {
      try {
        await updateSetting(field, value);
      } catch (error) {
        console.error('Error updating setting:', error);
      }
    }
  };

  // Handle form submission
  const handleSave = async () => {
    const validation = validateSettings(localSettings);
    if (!validation.success) {
      setFormErrors(validation.errors);
      toast.error('Por favor corrige los errores en la configuración');
      return;
    }

    try {
      await updateSettings(localSettings);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer la configuración por defecto?')) {
      try {
        await resetToDefaults();
        setFormErrors({});
        setValidationState({});
        toast.success('Configuración restablecida');
      } catch (error) {
        console.error('Error resetting settings:', error);
      }
    }
  };

  // Get time display (minutes to hours:minutes)
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get validation icon
  const ValidationIcon = ({ state }) => {
    if (state === 'valid') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (state === 'invalid') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="mt-10 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración
        </h2>
        
        {isDirty && (
          <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Cambios sin guardar
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Pomodoro Timing Settings */}
        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-red-500">🍅</span>
            Temporizadores Pomodoro
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Work Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de trabajo
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={localSettings.work}
                  onChange={(e) => handleSettingChange('work', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1m</span>
                  <span>90m</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={localSettings.work}
                  onChange={(e) => handleSettingChange('work', parseInt(e.target.value) || 1)}
                  onBlur={(e) => validateFormField('work', parseInt(e.target.value) || 1)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    formErrors.work 
                      ? 'border-red-500' 
                      : validationState.work === 'valid'
                      ? 'border-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                  <ValidationIcon state={validationState.work} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(localSettings.work)}
                  </span>
                </div>
              </div>
              {formErrors.work && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.work}</p>
              )}
            </div>

            {/* Break Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descanso corto
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={localSettings.break}
                  onChange={(e) => handleSettingChange('break', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1m</span>
                  <span>30m</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.break}
                  onChange={(e) => handleSettingChange('break', parseInt(e.target.value) || 1)}
                  onBlur={(e) => validateFormField('break', parseInt(e.target.value) || 1)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    formErrors.break 
                      ? 'border-red-500' 
                      : validationState.break === 'valid'
                      ? 'border-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                  <ValidationIcon state={validationState.break} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(localSettings.break)}
                  </span>
                </div>
              </div>
              {formErrors.break && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.break}</p>
              )}
            </div>

            {/* Long Break Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descanso largo
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={localSettings.longBreak}
                  onChange={(e) => handleSettingChange('longBreak', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5m</span>
                  <span>60m</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={localSettings.longBreak}
                  onChange={(e) => handleSettingChange('longBreak', parseInt(e.target.value) || 5)}
                  onBlur={(e) => validateFormField('longBreak', parseInt(e.target.value) || 5)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    formErrors.longBreak 
                      ? 'border-red-500' 
                      : validationState.longBreak === 'valid'
                      ? 'border-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                  <ValidationIcon state={validationState.longBreak} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(localSettings.longBreak)}
                  </span>
                </div>
              </div>
              {formErrors.longBreak && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.longBreak}</p>
              )}
            </div>
          </div>
        </div>

        {/* Goals & Preferences */}
        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">🎯</span>
            Metas y Preferencias
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Daily Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta diaria (pomodoros)
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={localSettings.dailyGoal}
                  onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localSettings.dailyGoal}
                  onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value) || 1)}
                  onBlur={(e) => validateFormField('dailyGoal', parseInt(e.target.value) || 1)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    formErrors.dailyGoal 
                      ? 'border-red-500' 
                      : validationState.dailyGoal === 'valid'
                      ? 'border-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                  <ValidationIcon state={validationState.dailyGoal} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ≈ {Math.round(localSettings.dailyGoal * localSettings.work / 60 * 10) / 10}h
                  </span>
                </div>
              </div>
              {formErrors.dailyGoal && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.dailyGoal}</p>
              )}
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema
              </label>
              <select
                value={localSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="system">🖥️ Sistema</option>
                <option value="light">☀️ Claro</option>
                <option value="dark">🌙 Oscuro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio & Notifications */}
        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-green-500">🔔</span>
            Audio y Notificaciones
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.sound}
                onChange={(e) => handleSettingChange('sound', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Activar sonido al finalizar temporizador
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrar notificaciones del sistema
              </span>
            </label>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 dark:text-white"
          >
            <span className="flex items-center gap-2">
              <span className="text-purple-500">⚡</span>
              Configuración Avanzada
            </span>
            <svg 
              className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoStartBreaks}
                  onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Iniciar descansos automáticamente
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoStartPomodoros}
                  onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Iniciar pomodoros automáticamente después del descanso
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isLoading || !isDirty || Object.keys(formErrors).length > 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restablecer
          </button>
        </div>
      </div>
    </div>
  );
}