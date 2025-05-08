const TASKS_KEY = 'chronotask_tasks';
const ACTIVE_TASK_KEY = 'chronotask_active';

export function getTasks() {
  const stored = localStorage.getItem(TASKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function addTask(newTask) {
  const tasks = getTasks();
  tasks.push(newTask);
  saveTasks(tasks);
}

export function removeTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

export function toggleTaskComplete(id) {
  const tasks = getTasks().map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks(tasks);
}

export function setActiveTask(id) {
  localStorage.setItem(ACTIVE_TASK_KEY, id);
}

export function getActiveTask() {
  return localStorage.getItem(ACTIVE_TASK_KEY);
}

export function incrementPomodoro(id) {
  const tasks = getTasks().map(t =>
    t.id === id ? { ...t, used: t.used + 1 } : t
  );
  saveTasks(tasks);
}