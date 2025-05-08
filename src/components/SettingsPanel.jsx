import { useEffect, useState } from 'react';
import { getSettings } from '../utils/settingsStorage';
import { settingsService } from '../utils/settingsService';

export default function SettingsPanel() {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    settingsService.load().then(setSettings);
  }, []);

  useEffect(() => {
    settingsService.save(settings);
  }, [settings]); [settings])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mt-10 p-4 bg-gray-800 rounded max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">⚙️ Configuración</h2>
      <div className="grid gap-3 text-sm">
        <label>
          Tiempo de trabajo (min)
          <input type="number" min="5" value={settings.work}
            onChange={e => handleChange('work', parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white mt-1"
          />
        </label>

        <label>
          Descanso corto (min)
          <input type="number" min="1" value={settings.break}
            onChange={e => handleChange('break', parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white mt-1"
          />
        </label>

        <label>
          Descanso largo (min)
          <input type="number" min="5" value={settings.longBreak}
            onChange={e => handleChange('longBreak', parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white mt-1"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={e => handleChange('sound', e.target.checked)}
          />
          Activar sonido al finalizar
        </label>
      </div>
    </div>
  );
}
