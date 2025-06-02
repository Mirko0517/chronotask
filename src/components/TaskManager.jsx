import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { projectService } from '../utils/projectService';
import { exportTasksToCSV } from '../utils/csvExporter';
import useTaskStore from '../store/useTaskStore';
import { validateTask, validateField, createTaskSchema } from '../schemas';
import useErrorHandler from '../hooks/useErrorHandler';
import toast from 'react-hot-toast';


export default function TaskManager() {
  // Local form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [estimation, setEstimation] = useState(1);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterProjectId, setFilterProjectId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationState, setValidationState] = useState({
    title: null, // null, 'valid', 'invalid'
    estimated: null
  });

  // Error handling
  const { handleProject, handleValidation, handleTask, clearLastError } = useErrorHandler('task-manager');

  // Store state
  const {
    tasks,
    activeTaskId,
    isLoading,
    error,
    addTask,
    deleteTask,
    toggleTask,
    setActiveTask,
    clearError
  } = useTaskStore();

  useEffect(() => {
    // Load projects if user is logged in
    if (localStorage.getItem('token')) {
      projectService.getAll()
        .then(setProjects)
        .catch(async (error) => {
          await handleProject(error, 'load', {}, {
            action: 'load_projects_on_mount'
          });
        });
    }
  }, [handleProject]);

  // Clear errors when component unmounts or when error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
        clearLastError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError, clearLastError]);

  // Validate form field in real-time
  const validateFormField = (field, value) => {
    const validation = validateField(createTaskSchema, field, value);
    
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

  // Get character count and status for title
  const getTitleValidationInfo = () => {
    const length = newTaskTitle.length;
    const maxLength = 200;
    const remaining = maxLength - length;
    
    return {
      length,
      remaining,
      isNearLimit: remaining <= 20,
      isAtLimit: remaining <= 0,
      percentage: (length / maxLength) * 100
    };
  };

  const handleAdd = async () => {
    if (isSubmitting) return;

    const taskData = {
      title: newTaskTitle.trim(),
      estimated: estimation,
      ...(selectedProject && { projectId: selectedProject.id }),
    };

    // Validate the task data
    const validation = validateTask(taskData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      await handleValidation(validation.errors, {
        action: 'validate_new_task',
        formData: taskData
      });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await addTask({
        id: uuidv4(),
        ...validation.data,
        completed: false,
        used: 0,
      });

      // Reset form
      setNewTaskTitle('');
      setEstimation(1);
      setSelectedProject(null);
    } catch (error) {
      await handleTask(error, 'create', taskData, {
        action: 'add_task_form_submit'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        await handleTask(error, 'delete', { id }, {
          action: 'delete_task_user_action'
        });
      }
    }
  };

  const handleToggle = async (task) => {
    try {
      await toggleTask(task);
    } catch (error) {
      await handleTask(error, 'update', task, {
        action: 'toggle_task_completion'
      });
    }
  };

  const handleSetActive = (id) => {
    setActiveTask(id);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-8">Tareas de hoy</h2>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <div className="relative">
            <input
              className={`w-full p-3 pr-10 rounded-lg bg-gray-800 text-white border transition-all duration-200 ${
                formErrors.title 
                  ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                  : validationState.title === 'valid'
                  ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                  : 'border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
              type="text"
              placeholder="Escribe una tarea... (máx. 200 caracteres)"
              value={newTaskTitle}
              onChange={(e) => {
                const value = e.target.value;
                setNewTaskTitle(value);
                if (value.length > 0) {
                  validateFormField('title', value.trim());
                } else {
                  setValidationState(prev => ({ ...prev, title: null }));
                  setFormErrors(prev => ({ ...prev, title: null }));
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  validateFormField('title', e.target.value.trim());
                }
              }}
              disabled={isLoading || isSubmitting}
              maxLength={200}
            />
            
            {/* Validation icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validationState.title === 'valid' && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {validationState.title === 'invalid' && (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          {/* Character count and progress bar */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {newTaskTitle.length > 0 && (
                <>
                  <div className="w-32 bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        getTitleValidationInfo().isAtLimit 
                          ? 'bg-red-500' 
                          : getTitleValidationInfo().isNearLimit 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(getTitleValidationInfo().percentage, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs transition-colors ${
                    getTitleValidationInfo().isAtLimit 
                      ? 'text-red-400' 
                      : getTitleValidationInfo().isNearLimit 
                      ? 'text-yellow-400' 
                      : 'text-gray-400'
                  }`}>
                    {getTitleValidationInfo().remaining} restantes
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {formErrors.title && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-md">
              <p className="text-xs text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.title}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium text-gray-300 mb-2">
              Pomodoros estimados:
            </label>
            <div className="relative">
              <input
                className={`w-24 p-3 rounded-lg bg-gray-800 text-white border transition-all duration-200 ${
                  formErrors.estimated 
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                    : validationState.estimated === 'valid'
                    ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                    : 'border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                type="number"
                min="1"
                max="20"
                value={estimation}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setEstimation(value);
                    validateFormField('estimated', value);
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setEstimation(value);
                  validateFormField('estimated', value);
                }}
                placeholder="1-20"
                disabled={isLoading || isSubmitting}
              />
              
              {/* Validation icon for pomodoros */}
              {validationState.estimated === 'valid' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Pomodoro range indicator */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(Math.min(estimation, 5))].map((_, i) => (
                  <span key={i} className="text-red-400 text-sm">🍅</span>
                ))}
                {estimation > 5 && (
                  <span className="text-xs text-gray-400 ml-1">+{estimation - 5}</span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                ≈ {Math.round(estimation * 25)} min
              </span>
            </div>
            
            {formErrors.estimated && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-md">
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.estimated}
                </p>
              </div>
            )}
          </div>
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
          disabled={
            isLoading || 
            isSubmitting || 
            !newTaskTitle.trim() || 
            formErrors.title || 
            formErrors.estimated ||
            getTitleValidationInfo().isAtLimit
          }
          className="w-full bg-blue-500 dark:bg-blue-600 px-6 py-3 rounded-lg text-white font-medium hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Agregando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Tarea
            </>
          )}
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
              className={`flex justify-between items-center p-4 rounded gap-2 transition-all ${
                task.completed
                  ? 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-100 line-through'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${
                task.id === activeTaskId ? 'ring-2 ring-yellow-400 dark:ring-yellow-300' : ''
              }`}
            >
              <div
                className={`flex items-center gap-2 flex-1 cursor-pointer ${
                  task.id === activeTaskId ? 'text-yellow-600 dark:text-yellow-300 font-bold' : ''
                }`}
                onClick={() => handleToggle(task)}
                onDoubleClick={() => handleSetActive(task.id)}
                title="Click para completar, doble click para activar"
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
                disabled={isLoading}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Eliminar tarea"
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
