const SETTINGS_KEY = 'chronotask_settings';

export function getSettings() {
  const defaults = {
    work: 25,
    break: 5,
    longBreak: 15,
    sound: true,
  };

  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

export function saveSettings(newSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
}
