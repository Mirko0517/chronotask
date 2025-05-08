import { authFetch } from './authFetch';

const SETTINGS_KEY = 'chronotask_settings';

const isLoggedIn = () => !!localStorage.getItem('token');

const defaultSettings = {
  work: 25,
  break: 5,
  longBreak: 15,
  sound: true,
};

export const settingsService = {
  async load() {
    if (isLoggedIn()) {
      const res = await authFetch('/api/settings');
      const data = await res.json();
      return { ...data, sound: true }; // sonido local por ahora
    } else {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : defaultSettings;
    }
  },

  async save(settings) {
    if (isLoggedIn()) {
      const { work, break: short, longBreak } = settings;
      await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ work, break: short, longBreak }),
      });
      // el sonido se guarda solo en local
      const localSettings = { ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(localSettings));
    } else {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }
};
