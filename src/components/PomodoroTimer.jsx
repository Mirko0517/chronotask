import { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveTask, getTasks } from '../utils/taskStorage';
import { getSettings } from '../utils/settingsStorage';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocus } from '../context/FocusContext';
import { statsService } from '../utils/statsService';




const settings = getSettings();
const WORK_DURATION = settings.work * 60;     // Convertir minutos a segundos
const BREAK_DURATION = settings.break * 60;   // Convertir minutos a segundos

export default function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkTime] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const { isFocused, setIsFocused } = useFocus();

  const intervalRef = useRef(null);

  // Efecto para actualizar los tiempos cuando cambien las configuraciones
  useEffect(() => {
    const settings = getSettings();
    if (!isRunning) {
      setSecondsLeft(isWorkTime ? settings.work * 60 : settings.break * 60);
    }
  }, [isWorkTime, isRunning]);

  const handleTimerEnd = useCallback(async () => {
    const activeId = getActiveTask();
    const allTasks = getTasks(); // localStorage
    const activeTask = allTasks.find(t => t.id === activeId);

    if (isWorkTime && activeTask) {
      await statsService.register();
    }
  }, [isWorkTime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev === 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleTimerEnd]);

  useEffect(() => {
    const activeId = getActiveTask();
    const tasks = getTasks();
    const task = tasks.find(t => t.id === activeId);
    setActiveTask(task || null);
  }, [secondsLeft]); // se actualizará también cuando pase el tiempo
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const settings = getSettings();
    setSecondsLeft(isWorkTime ? settings.work * 60 : settings.break * 60);
  };

  const formatTime = (totalSeconds) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="text-center mt-10">
      <h1 className="text-4xl font-bold mb-4">{isWorkTime ? 'Tiempo de trabajo' : 'Descanso'}</h1>
      <p className="text-6xl font-mono mb-4">{formatTime(secondsLeft)}</p>

      {activeTask ? (
        <p className="text-lg text-yellow-300 mt-2 mb-6">
          Enfocado en: <span className="italic">{activeTask.title}</span>
        </p>
      ) : (
        <p className="text-sm text-gray-400 mt-2 mb-6">
          (Ninguna tarea seleccionada)
        </p>
      )}

      <div className="flex justify-center gap-4">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={toggleTimer}
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={resetTimer}
        >
          Reiniciar
        </button>
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900/50 p-8 rounded-lg backdrop-blur-md">
              <h1 className="text-4xl mb-4 text-white font-bold">
                {isWorkTime ? 'Tiempo de trabajo' : 'Descanso'}
              </h1>
              <p className="text-8xl font-mono text-white mb-6">{formatTime(secondsLeft)}</p>
              {activeTask && (
                <p className="text-xl text-yellow-300 mb-8">
                  Enfocado en: <span className="italic">{activeTask.title}</span>
                </p>
              )}
              <div className="flex justify-center gap-4">
                <button
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={toggleTimer}
                >
                  {isRunning ? 'Pausar' : 'Iniciar'}
                </button>
                <button
                  onClick={() => setIsFocused(false)}
                  className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
