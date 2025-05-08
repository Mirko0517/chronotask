import { authFetch } from './authFetch';

// Función auxiliar para obtener tareas del localStorage
const getLocalTasks = () => {
  const tasks = localStorage.getItem('tasks');
  return tasks ? JSON.parse(tasks) : [];
};

// Función auxiliar para guardar tareas en localStorage
const saveLocalTasks = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

export const taskService = {
  async get() {
    try {
      // Si hay token, intentamos obtener del backend
      if (localStorage.getItem('token')) {
        const response = await authFetch('/api/tasks');
        if (response.ok) {
          const tasks = await response.json();
          saveLocalTasks(tasks); // Sincronizamos con localStorage
          return tasks;
        }
      }
    } catch (error) {
      console.error('Error al obtener tareas:', error);
    }
    // Si no hay token o hubo error, usamos localStorage
    return getLocalTasks();
  },

  async create(task) {
    try {
      if (localStorage.getItem('token')) {
        const response = await authFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(task)
        });
        if (response.ok) {
          const newTask = await response.json();
          const tasks = getLocalTasks();
          tasks.push(newTask);
          saveLocalTasks(tasks);
          return newTask;
        }
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
    }
    // Si no hay token o hubo error, guardamos en localStorage
    const tasks = getLocalTasks();
    tasks.push(task);
    saveLocalTasks(tasks);
    return task;
  },

  async remove(taskId) {
    try {
      if (localStorage.getItem('token')) {
        const response = await authFetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          const tasks = getLocalTasks().filter(t => t.id !== taskId);
          saveLocalTasks(tasks);
          return;
        }
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
    // Si no hay token o hubo error, eliminamos de localStorage
    const tasks = getLocalTasks().filter(t => t.id !== taskId);
    saveLocalTasks(tasks);
  },

  async toggleComplete(task) {
    try {
      if (localStorage.getItem('token')) {
        const response = await authFetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: !task.completed })
        });
        if (response.ok) {
          const updatedTask = await response.json();
          const tasks = getLocalTasks().map(t => 
            t.id === task.id ? updatedTask : t
          );
          saveLocalTasks(tasks);
          return updatedTask;
        }
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
    // Si no hay token o hubo error, actualizamos en localStorage
    const tasks = getLocalTasks().map(t => 
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    saveLocalTasks(tasks);
    return tasks.find(t => t.id === task.id);
  }
};
  