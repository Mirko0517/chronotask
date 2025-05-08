import { useState } from 'react';
import PomodoroTimer from './components/PomodoroTimer'
import TaskManager from './components/TaskManager'
import ThemeToggle from './components/ThemeToggle';
import { useFocus } from './context/FocusContext';
import WeeklyReport from './components/WeeklyReport';
import AuthForm from './components/AuthForm';
import AccountNotice from './components/AccountNotice';
import ProjectManager from './components/ProjectManager';

const getFormattedDate = () => {
  const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
  return new Date().toLocaleDateString('es-CL', opciones);
};

function App() {
  const { isFocused, setIsFocused } = useFocus();
  const [loggedIn, setLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      {/* Barra superior */}
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-xl font-bold">Chronotask 🧠</h1>
        <p className="text-8xl font-caveat text-pink-500 dark:text-pink-300 text-center flex-1">
          {getFormattedDate()}
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsFocused(prev => !prev)}
            className="text-sm px-3 py-1 border border-gray-500 rounded hover:bg-gray-700"
          >
            {isFocused ? 'Salir modo enfoque' : '🧘 Modo sin distracción'}
          </button>
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
            >
              🔓 Cerrar sesión
            </button>
          )}
        </div>
      </div>

      {/* Contenedor principal con separadores */}
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-12">
          <PomodoroTimer />
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 pb-12">
          <TaskManager />
        </div>

        <ProjectManager onSelect={(project) => console.log('Proyecto seleccionado:', project)} />

        <AccountNotice onLogin={() => setLoggedIn(true)} />

        <div className="pb-12">
          <WeeklyReport />
        </div>
      </div>
    </div>
  );
}

export default App;
