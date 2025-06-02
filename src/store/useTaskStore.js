import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { taskService } from '../utils/taskService';
import { handleTaskError, handleApiError, handleStorageError } from '../utils/errorHandler';
import { ERROR_TYPES } from '../utils/errors/errorTypes';
import toast from 'react-hot-toast';

const useTaskStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // State
        tasks: [],
        activeTaskId: null,
        isLoading: false,
        error: null,
        
        // Actions
        setTasks: (tasks) => set({ tasks }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setActiveTask: async (taskId) => {
          set({ activeTaskId: taskId });
          if (typeof window !== 'undefined') {
            try {
              if (taskId) {
                localStorage.setItem('activeTask', taskId);
              } else {
                localStorage.removeItem('activeTask');
              }
            } catch (error) {
              await handleStorageError(error, taskId ? 'set' : 'remove', {
                component: 'task-store',
                key: 'activeTask',
                value: taskId
              });
            }
          }
        },
        
        // Load tasks from API or localStorage
        loadTasks: async () => {
          try {
            set({ isLoading: true, error: null });
            const tasks = await taskService.get();
            set({ tasks });
            
            // Load active task from localStorage
            const activeTaskId = localStorage.getItem('activeTask');
            if (activeTaskId && tasks.find(t => t.id === activeTaskId)) {
              set({ activeTaskId });
            }
          } catch (error) {
            const handled = await handleTaskError(error, 'load', {}, {
              component: 'task-store',
              action: 'load_tasks'
            });
            set({ error: handled.errorType?.userMessage || error.message });
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Add new task
        addTask: async (taskData) => {
          try {
            set({ isLoading: true, error: null });
            const newTask = await taskService.create(taskData);
            const currentTasks = get().tasks;
            set({ tasks: [...currentTasks, newTask] });
            toast.success('Tarea agregada');
            return newTask;
          } catch (error) {
            const handled = await handleTaskError(error, 'create', taskData, {
              component: 'task-store',
              action: 'add_task'
            });
            set({ error: handled.errorType?.userMessage || error.message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Update task
        updateTask: async (taskId, updates) => {
          try {
            set({ isLoading: true, error: null });
            const updatedTask = await taskService.update(taskId, updates);
            const currentTasks = get().tasks;
            set({
              tasks: currentTasks.map(task => 
                task.id === taskId ? { ...task, ...updatedTask } : task
              )
            });
            return updatedTask;
          } catch (error) {
            const handled = await handleTaskError(error, 'update', { id: taskId, ...updates }, {
              component: 'task-store',
              action: 'update_task',
              taskId
            });
            set({ error: handled.errorType?.userMessage || error.message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Toggle task completion
        toggleTask: async (task) => {
          try {
            const updatedTask = await taskService.toggleComplete(task);
            const currentTasks = get().tasks;
            set({
              tasks: currentTasks.map(t => 
                t.id === task.id ? updatedTask : t
              )
            });
            toast.success(updatedTask.completed ? 'Tarea completada' : 'Tarea reactivada');
          } catch (error) {
            const handled = await handleTaskError(error, 'update', task, {
              component: 'task-store',
              action: 'toggle_task',
              taskId: task.id
            });
            set({ error: handled.errorType?.userMessage || error.message });
          }
        },
        
        // Delete task
        deleteTask: async (taskId) => {
          try {
            set({ isLoading: true, error: null });
            await taskService.remove(taskId);
            const currentTasks = get().tasks;
            const currentActiveTaskId = get().activeTaskId;
            
            // Check if the task being deleted is the active task
            const wasActive = currentActiveTaskId === taskId;
            
            set({ 
              tasks: currentTasks.filter(task => task.id !== taskId),
              activeTaskId: wasActive ? null : currentActiveTaskId
            });
            
            // Clear from localStorage if it was the active task
            if (wasActive) {
              try {
                localStorage.removeItem('activeTask');
              } catch (storageError) {
                await handleStorageError(storageError, 'remove', {
                  component: 'task-store',
                  key: 'activeTask'
                });
              }
            }
            
            toast.success('Tarea eliminada');
          } catch (error) {
            const handled = await handleTaskError(error, 'delete', { id: taskId }, {
              component: 'task-store',
              action: 'delete_task',
              taskId
            });
            set({ error: handled.errorType?.userMessage || error.message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Increment pomodoro count
        incrementPomodoro: async (taskId) => {
          try {
            const currentTasks = get().tasks;
            const task = currentTasks.find(t => t.id === taskId);
            if (!task) {
              await handleTaskError(new Error('Task not found'), 'get', { id: taskId }, {
                component: 'task-store',
                action: 'increment_pomodoro',
                taskId
              });
              return;
            }
            
            const updatedTask = await get().updateTask(taskId, { 
              used: task.used + 1 
            });
            
            toast.success(`Pomodoro completado: ${updatedTask.used}/${updatedTask.estimated}`);
          } catch (error) {
            await handleTaskError(error, 'update', { id: taskId }, {
              component: 'task-store',
              action: 'increment_pomodoro',
              taskId
            });
          }
        },
        
        // Get active task
        getActiveTask: () => {
          const { tasks, activeTaskId } = get();
          return tasks.find(task => task.id === activeTaskId) || null;
        },
        
        // Get tasks by project
        getTasksByProject: (projectId) => {
          const { tasks } = get();
          return projectId 
            ? tasks.filter(task => task.projectId === projectId)
            : tasks.filter(task => !task.projectId);
        },
        
        // Get completed tasks
        getCompletedTasks: () => {
          const { tasks } = get();
          return tasks.filter(task => task.completed);
        },
        
        // Get pending tasks
        getPendingTasks: () => {
          const { tasks } = get();
          return tasks.filter(task => !task.completed);
        },
        
        // Clear all tasks (for logout)
        clearTasks: async () => {
          set({ 
            tasks: [], 
            activeTaskId: null, 
            error: null 
          });
          try {
            localStorage.removeItem('activeTask');
          } catch (error) {
            await handleStorageError(error, 'remove', {
              component: 'task-store',
              key: 'activeTask'
            });
          }
        },
        
        // Reset error state
        clearError: () => set({ error: null })
      }),
      {
        name: 'chronotask-tasks',
        partialize: (state) => ({
          tasks: state.tasks,
          activeTaskId: state.activeTaskId
        })
      }
    ),
    {
      name: 'TaskStore'
    }
  )
);

export default useTaskStore;