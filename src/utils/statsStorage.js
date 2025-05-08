const STATS_KEY = 'chronotask_stats';

export function registerPomodoroCompletion() {
  const today = new Date().toISOString().split('T')[0]; // ej. "2025-05-07"
  const data = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(data));
}

export function getWeeklyStats() {
  const data = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  const now = new Date();
  const stats = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('es-CL', { weekday: 'short' });
    stats.push({ day: label.charAt(0).toUpperCase() + label.slice(1), count: data[key] || 0 });
  }

  return stats;
}
