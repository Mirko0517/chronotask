import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useTaskStore from '../useTaskStore';
import { taskService } from '../../utils/taskService';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../utils/taskService', () => ({
  taskService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    toggleComplete: vi.fn()
  }
}));
vi.mock('react-hot-toast');

describe('useTaskStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTaskStore.setState({
      tasks: [],
      activeTaskId: null,
      isLoading: false,
      error: null
    });
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTaskStore());
      
      expect(result.current.tasks).toEqual([]);
      expect(result.current.activeTaskId).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadTasks', () => {
    it('should load tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, estimated: 1, used: 0 },
        { id: '2', title: 'Task 2', completed: true, estimated: 2, used: 2 }
      ];
      
      const { taskService } = await import('../../utils/taskService');
      taskService.get.mockResolvedValue(mockTasks);
      localStorage.getItem.mockReturnValue('1');

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.loadTasks();
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.activeTaskId).toBe('1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load tasks error', async () => {
      const errorMessage = 'Failed to load tasks';
      const { taskService } = await import('../../utils/taskService');
      taskService.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.loadTasks();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Error al cargar las tareas');
    });
  });

  describe('addTask', () => {
    it('should add task successfully', async () => {
      const newTask = { title: 'New Task', estimated: 3 };
      const createdTask = { id: '3', ...newTask, completed: false, used: 0 };
      
      const { taskService } = await import('../../utils/taskService');
      taskService.create.mockResolvedValue(createdTask);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.addTask(newTask);
      });

      expect(result.current.tasks).toContain(createdTask);
      expect(toast.success).toHaveBeenCalledWith('Tarea agregada');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle add task error', async () => {
      const errorMessage = 'Failed to create task';
      const { taskService } = await import('../../utils/taskService');
      taskService.create.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        try {
          await result.current.addTask({ title: 'Test' });
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(toast.error).toHaveBeenCalledWith('Error al agregar la tarea');
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const initialTasks = [
        { id: '1', title: 'Task 1', completed: false, estimated: 1, used: 0 }
      ];
      
      const updatedTask = { title: 'Updated Task' };
      const { taskService } = await import('../../utils/taskService');
      taskService.update.mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTaskStore());
      
      // Set initial state
      act(() => {
        result.current.setTasks(initialTasks);
      });

      await act(async () => {
        await result.current.updateTask('1', updatedTask);
      });

      expect(result.current.tasks[0]).toEqual(
        expect.objectContaining(updatedTask)
      );
    });
  });

  describe('toggleTask', () => {
    it('should toggle task completion', async () => {
      const task = { id: '1', title: 'Task 1', completed: false };
      const toggledTask = { ...task, completed: true };
      
      const { taskService } = await import('../../utils/taskService');
      taskService.toggleComplete.mockResolvedValue(toggledTask);

      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.setTasks([task]);
      });

      await act(async () => {
        await result.current.toggleTask(task);
      });

      expect(result.current.tasks[0].completed).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('Tarea completada');
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ];
      
      const { taskService } = await import('../../utils/taskService');
      taskService.remove.mockResolvedValue();

      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.setTasks(tasks);
      });

      await act(async () => {
        await result.current.deleteTask('1');
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('2');
      expect(toast.success).toHaveBeenCalledWith('Tarea eliminada');
    });

    it('should clear active task if deleting active task', async () => {
      const tasks = [{ id: '1', title: 'Task 1' }];
      
      const { taskService } = await import('../../utils/taskService');
      taskService.remove.mockResolvedValue();

      const { result } = renderHook(() => useTaskStore());
      
      // Set initial state and active task
      act(() => {
        result.current.setTasks(tasks);
        result.current.setActiveTask('1');
      });

      // Clear previous localStorage calls
      localStorage.removeItem.mockClear();

      await act(async () => {
        await result.current.deleteTask('1');
      });

      expect(result.current.activeTaskId).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('activeTask');
    });
  });

  describe('setActiveTask', () => {
    it('should set active task and update localStorage', () => {
      const { result } = renderHook(() => useTaskStore());

      act(() => {
        result.current.setActiveTask('task-1');
      });

      expect(result.current.activeTaskId).toBe('task-1');
      expect(localStorage.setItem).toHaveBeenCalledWith('activeTask', 'task-1');
    });

    it('should clear active task and remove from localStorage', () => {
      const { result } = renderHook(() => useTaskStore());

      act(() => {
        result.current.setActiveTask(null);
      });

      expect(result.current.activeTaskId).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('activeTask');
    });
  });

  describe('getActiveTask', () => {
    it('should return active task when found', () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ];

      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.setTasks(tasks);
        result.current.setActiveTask('2');
      });

      const activeTask = result.current.getActiveTask();
      expect(activeTask).toEqual(tasks[1]);
    });

    it('should return null when no active task', () => {
      const { result } = renderHook(() => useTaskStore());

      const activeTask = result.current.getActiveTask();
      expect(activeTask).toBeNull();
    });
  });

  describe('incrementPomodoro', () => {
    it('should increment pomodoro count', async () => {
      const task = { id: '1', title: 'Task 1', used: 0, estimated: 3 };
      const updatedTask = { ...task, used: 1 };
      
      taskService.update = vi.fn().mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.setTasks([task]);
      });

      // Mock the updateTask method
      result.current.updateTask = vi.fn().mockResolvedValue(updatedTask);

      await act(async () => {
        await result.current.incrementPomodoro('1');
      });

      expect(result.current.updateTask).toHaveBeenCalledWith('1', { used: 1 });
      expect(toast.success).toHaveBeenCalledWith('Pomodoro completado: 1/3');
    });
  });

  describe('clearTasks', () => {
    it('should clear all tasks and active task', () => {
      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.setTasks([{ id: '1', title: 'Task 1' }]);
        result.current.setActiveTask('1');
      });

      act(() => {
        result.current.clearTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.activeTaskId).toBeNull();
      expect(result.current.error).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('activeTask');
    });
  });

  describe('Filtering Methods', () => {
    const tasks = [
      { id: '1', title: 'Task 1', completed: false, projectId: 1 },
      { id: '2', title: 'Task 2', completed: true, projectId: 1 },
      { id: '3', title: 'Task 3', completed: false, projectId: null },
    ];

    beforeEach(() => {
      const { result } = renderHook(() => useTaskStore());
      act(() => {
        result.current.setTasks(tasks);
      });
    });

    it('should get tasks by project', () => {
      const { result } = renderHook(() => useTaskStore());
      
      const projectTasks = result.current.getTasksByProject(1);
      expect(projectTasks).toHaveLength(2);
      expect(projectTasks.every(task => task.projectId === 1)).toBe(true);
    });

    it('should get tasks without project', () => {
      const { result } = renderHook(() => useTaskStore());
      
      const noProjectTasks = result.current.getTasksByProject(null);
      expect(noProjectTasks).toHaveLength(1);
      expect(noProjectTasks[0].projectId).toBeNull();
    });

    it('should get completed tasks', () => {
      const { result } = renderHook(() => useTaskStore());
      
      const completedTasks = result.current.getCompletedTasks();
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].completed).toBe(true);
    });

    it('should get pending tasks', () => {
      const { result } = renderHook(() => useTaskStore());
      
      const pendingTasks = result.current.getPendingTasks();
      expect(pendingTasks).toHaveLength(2);
      expect(pendingTasks.every(task => !task.completed)).toBe(true);
    });
  });
});