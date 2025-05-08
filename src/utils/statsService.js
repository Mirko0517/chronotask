import { authFetch } from './authFetch';

const STATS_KEY = 'chronotask_stats';

const isLoggedIn = () => !!localStorage.getItem('token');

export const statsService = {
  async register() {
    if (isLoggedIn()) {
      await authFetch('/api/stats', { method: 'POST' });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
      stats[today] = (stats[today] || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  },

  async getWeeklyStats() {
    if (isLoggedIn()) {
      const res = await authFetch('/api/stats');
      const logs = await res.json();

      const map = {};
      logs.forEach(({ date, count }) => {
        const d = new Date(date);
        const key = d.toLocaleDateString('es-CL', { weekday: 'short' });
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        map[label] = (map[label] || 0) + count;
      });

      const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const label = d.toLocaleDateString('es-CL', { weekday: 'short' });
        const name = label.charAt(0).toUpperCase() + label.slice(1);
        return { day: name, count: map[name] || 0 };
      });

      return days;
    } else {
      const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
      const now = new Date();

      return [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('es-CL', { weekday: 'short' });
        const name = label.charAt(0).toUpperCase() + label.slice(1);
        return { day: name, count: stats[key] || 0 };
      });
    }
  }
};
