import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { settingsService } from '../utils/settingsService';
import { getSettings } from '../utils/settingsStorage';
import { handleSettingsError, handleStorageError, handleApiError } from '../utils/errorHandler';
import { ERROR_TYPES } from '../utils/errors/errorTypes';
import toast from 'react-hot-toast';

const defaultSettings = {
  work: 25,
  break: 5,
  longBreak: 15,
  sound: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  dailyGoal: 8,
  theme: 'system', // 'light', 'dark', 'system'
  notifications: true
};

const useSettingsStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // State
        settings: defaultSettings,
        isLoading: false,
        error: null,
        isDirty: false, // Track if settings have been modified
        
        // Actions
        setSettings: (settings) => set({ settings, isDirty: false }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setDirty: (isDirty) => set({ isDirty }),
        
        // Load settings from API or localStorage
        loadSettings: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Try to load from API first (if user is logged in)
            const token = localStorage.getItem('token');
            let loadedSettings;
            
            if (token) {
              try {
                loadedSettings = await settingsService.load();
              } catch (apiError) {
                // If API fails, fallback to localStorage
                await handleApiError(apiError, {
                  component: 'settings-store',
                  action: 'load_from_api',
                  fallback: true
                }, { silent: true });
                loadedSettings = getSettings();
              }
            } else {
              // No token, use localStorage
              try {
                loadedSettings = getSettings();
              } catch (storageError) {
                await handleStorageError(storageError, 'get', {
                  component: 'settings-store',
                  key: 'chronotask_settings'
                });
                loadedSettings = defaultSettings;
              }
            }
            
            set({ 
              settings: { ...defaultSettings, ...loadedSettings },
              isDirty: false
            });
            
          } catch (error) {
            const handled = await handleSettingsError(error, 'load', {}, {
              component: 'settings-store',
              action: 'load_settings'
            });
            set({ error: handled.errorType?.userMessage || error.message });
            // Use default settings on error
            set({ settings: defaultSettings });
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Update a single setting
        updateSetting: async (key, value) => {
          try {
            const currentSettings = get().settings;
            const newSettings = { ...currentSettings, [key]: value };
            
            set({ 
              settings: newSettings, 
              isDirty: true,
              error: null 
            });
            
            // Auto-save after a delay (debounced)
            await get().saveSettings();
            
          } catch (error) {
            const handled = await handleSettingsError(error, 'update', { [key]: value }, {
              component: 'settings-store',
              action: 'update_setting',
              settingKey: key
            });
            set({ error: handled.errorType?.userMessage || error.message });
          }
        },
        
        // Update multiple settings
        updateSettings: async (updates) => {
          try {
            const currentSettings = get().settings;
            const newSettings = { ...currentSettings, ...updates };
            
            set({ 
              settings: newSettings, 
              isDirty: true,
              error: null 
            });
            
            await get().saveSettings();
            
          } catch (error) {
            const handled = await handleSettingsError(error, 'update', updates, {
              component: 'settings-store',
              action: 'update_multiple_settings',
              updateCount: Object.keys(updates).length
            });
            set({ error: handled.errorType?.userMessage || error.message });
          }
        },
        
        // Save settings to API and localStorage
        saveSettings: async () => {
          try {
            const { settings, isDirty } = get();
            
            if (!isDirty) return; // No changes to save
            
            set({ isLoading: true, error: null });
            
            // Try to save to API first (if user is logged in)
            const token = localStorage.getItem('token');
            
            if (token) {
              try {
                await settingsService.save(settings);
              } catch (apiError) {
                await handleApiError(apiError, {
                  component: 'settings-store',
                  action: 'save_to_api',
                  fallback: true
                }, { silent: true });
              }
            }
            
            // Always save to localStorage as backup
            try {
              localStorage.setItem('chronotask_settings', JSON.stringify(settings));
            } catch (storageError) {
              await handleStorageError(storageError, 'set', {
                component: 'settings-store',
                key: 'chronotask_settings',
                value: settings
              });
              throw storageError;
            }
            
            set({ isDirty: false });
            toast.success('Configuración guardada');
            
          } catch (error) {
            const handled = await handleSettingsError(error, 'save', get().settings, {
              component: 'settings-store',
              action: 'save_settings'
            });
            set({ error: handled.errorType?.userMessage || error.message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Reset to default settings
        resetToDefaults: async () => {
          try {
            set({ 
              settings: defaultSettings, 
              isDirty: true,
              error: null 
            });
            
            await get().saveSettings();
            toast.success('Configuración restablecida');
            
          } catch (error) {
            const handled = await handleSettingsError(error, 'reset', defaultSettings, {
              component: 'settings-store',
              action: 'reset_to_defaults'
            });
            set({ error: handled.errorType?.userMessage || error.message });
          }
        },
        
        // Toggle theme
        toggleTheme: async () => {
          const currentTheme = get().settings.theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          await get().updateSetting('theme', newTheme);
        },
        
        // Get work duration in seconds
        getWorkDurationSeconds: () => {
          return get().settings.work * 60;
        },
        
        // Get break duration in seconds
        getBreakDurationSeconds: () => {
          return get().settings.break * 60;
        },
        
        // Get long break duration in seconds
        getLongBreakDurationSeconds: () => {
          return get().settings.longBreak * 60;
        },
        
        // Check if sound is enabled
        isSoundEnabled: () => {
          return get().settings.sound;
        },
        
        // Check if notifications are enabled
        areNotificationsEnabled: () => {
          return get().settings.notifications;
        },
        
        // Get daily goal
        getDailyGoal: () => {
          return get().settings.dailyGoal;
        },
        
        // Clear settings (for logout)
        clearSettings: async () => {
          set({ 
            settings: defaultSettings,
            isDirty: false,
            error: null 
          });
          try {
            localStorage.removeItem('chronotask_settings');
          } catch (error) {
            await handleStorageError(error, 'remove', {
              component: 'settings-store',
              key: 'chronotask_settings'
            });
          }
        },
        
        // Reset error state
        clearError: () => set({ error: null }),
        
        // Validate settings
        validateSettings: (settings) => {
          const errors = [];
          
          if (settings.work < 1 || settings.work > 90) {
            errors.push('El tiempo de trabajo debe estar entre 1 y 90 minutos');
          }
          
          if (settings.break < 1 || settings.break > 30) {
            errors.push('El descanso debe estar entre 1 y 30 minutos');
          }
          
          if (settings.longBreak < 5 || settings.longBreak > 60) {
            errors.push('El descanso largo debe estar entre 5 y 60 minutos');
          }
          
          if (settings.dailyGoal < 1 || settings.dailyGoal > 20) {
            errors.push('La meta diaria debe estar entre 1 y 20 pomodoros');
          }
          
          return errors;
        }
      }),
      {
        name: 'chronotask-settings',
        partialize: (state) => ({
          settings: state.settings
        })
      }
    ),
    {
      name: 'SettingsStore'
    }
  )
);

export default useSettingsStore;