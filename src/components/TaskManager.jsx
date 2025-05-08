import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { taskService } from '../utils/taskService';
import { projectService } from '../utils/projectService';
import { getActiveTask } from '../utils/taskStorage.js';
import { exportTasksToCSV } from '../utils/csvExporter';


export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [estimation, setEstimation] = useState(1);
  const [active, setActive] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterProjectId, setFilterProjectId] = useState(null);

  useEffect(() => {
    taskService.get().then(setTasks);
    setActive(getActiveTask());

    if (localStorage.getItem('token')) {
      projectService.getAll().then(setProjects);
    }
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await taskService.get();
    setTasks(loadedTasks);
  };

  const handleAdd = async () => {
    if (newTaskTitle.trim() === '') return;

    const task = {
      id: uuidv4(),
      title: newTaskTitle.trim(),
      completed: false,
      estimated: estimation,
      used: 0,
      ...(selectedProject && { projectId: selectedProject.id }),
    };

    await taskService.create(task);
    await loadTasks();
    setNewTaskTitle('');
    setEstimation(1);
  };

  const handleDelete = async (id) => {
    await taskService.remove(id);
    await loadTasks();
  };

  const handleToggle = async (task) => {
    await taskService.toggleComplete(task);
    await loadTasks();
  };

  const handleSetActive = (id) => {
    localStorage.setItem('activeTask', id);
    setActive(id);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-8">Tareas de hoy</h2>

      <div className="flex flex-col gap-4 mb-6">
        <input
          className="p-2 rounded bg-gray-800 text-white border border-gray-700"
          type="text"
          placeholder="Escribe una tarea..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <label className="text-sm">Pomodoros:</label>
          <input
            className="w-20 p-2 rounded bg-gray-800 text-white border border-gray-700"
            type="number"
            min="1"
            max="12"
            value={estimation}
            onChange={(e) => setEstimation(parseInt(e.target.value) || 1)}
            placeholder="Poms"
          />
        </div>

        {projects.length > 0 && (
          <select
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === parseInt(e.target.value));
              setSelectedProject(project || null);
            }}
          >
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleAdd}
          className="bg-blue-500 dark:bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-600 dark:hover:bg-blue-700"
        >
          Agregar
        </button>
      </div>

      {projects.length > 0 && (
        <div className="mb-6">
          <label className="text-sm mr-2">Filtrar por proyecto:</label>
          <select
            className="p-2 rounded bg-gray-800 text-white border border-gray-700"
            value={filterProjectId || ''}
            onChange={(e) =>
              setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)
            }
          >
            <option value="">Todas las tareas</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mb-4 text-right">
          <button
            onClick={() => exportTasksToCSV(tasks, projects)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            📤 Exportar tareas (CSV)
          </button>
        </div>
      )}
      

      <ul className="space-y-3">
        {tasks
          .filter(task => !filterProjectId || task.projectId === filterProjectId)
          .map(task => (
            <li
              key={task.id}
              className={`flex justify-between items-center p-4 rounded gap-2 ${
                task.completed
                  ? 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-100 line-through'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div
                className={`flex items-center gap-2 flex-1 cursor-pointer ${
                  task.id === active ? 'text-yellow-600 dark:text-yellow-300 font-bold' : ''
                }`}
                onClick={() => handleToggle(task)}
                onDoubleClick={() => handleSetActive(task.id)}
              >
                {task.completed ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
                <span>{task.title}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {task.used} / {task.estimated} 🍅
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
