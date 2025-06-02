import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Mock Providers
const MockFocusProvider = ({ children, isFocused = false }) => {
  const value = {
    isFocused,
    setIsFocused: vi.fn()
  };
  
  return React.createElement(
    React.createContext().Provider,
    { value },
    children
  );
};

// Custom render function with all providers
export function renderWithProviders(
  ui,
  {
    user,
    focusProviderProps = {},
    ...renderOptions
  } = {}
) {
  const AllTheProviders = ({ children }) => {
    return (
      <ErrorBoundary>
        <MockFocusProvider {...focusProviderProps}>
          <Toaster position="top-right" />
          {children}
        </MockFocusProvider>
      </ErrorBoundary>
    );
  };

  return {
    user: user ?? userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
}

// Mock data generators
export const mockTask = (overrides = {}) => ({
  id: 'test-task-1',
  title: 'Test Task',
  completed: false,
  estimated: 2,
  used: 0,
  projectId: null,
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  userId: 1,
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockSettings = (overrides = {}) => ({
  work: 25,
  break: 5,
  longBreak: 15,
  sound: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  dailyGoal: 8,
  theme: 'system',
  notifications: true,
  ...overrides
});

export const mockStats = (overrides = {}) => ({
  date: new Date().toISOString().split('T')[0],
  count: 1,
  ...overrides
});

// API response helpers
export const mockApiSuccess = (data) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const mockApiError = (message = 'API Error', status = 500) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message }),
  text: () => Promise.resolve(JSON.stringify({ error: message })),
});

// Store helpers
export const createMockTaskStore = (initialState = {}) => ({
  tasks: [],
  activeTaskId: null,
  isLoading: false,
  error: null,
  setTasks: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  setActiveTask: vi.fn(),
  loadTasks: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
  incrementPomodoro: vi.fn(),
  getActiveTask: vi.fn(),
  getTasksByProject: vi.fn(),
  getCompletedTasks: vi.fn(),
  getPendingTasks: vi.fn(),
  clearTasks: vi.fn(),
  clearError: vi.fn(),
  ...initialState
});

export const createMockSettingsStore = (initialState = {}) => ({
  settings: mockSettings(),
  isLoading: false,
  error: null,
  isDirty: false,
  setSettings: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  setDirty: vi.fn(),
  loadSettings: vi.fn(),
  updateSetting: vi.fn(),
  updateSettings: vi.fn(),
  saveSettings: vi.fn(),
  resetToDefaults: vi.fn(),
  toggleTheme: vi.fn(),
  getWorkDurationSeconds: vi.fn(() => 1500),
  getBreakDurationSeconds: vi.fn(() => 300),
  getLongBreakDurationSeconds: vi.fn(() => 900),
  isSoundEnabled: vi.fn(() => true),
  areNotificationsEnabled: vi.fn(() => true),
  getDailyGoal: vi.fn(() => 8),
  clearSettings: vi.fn(),
  clearError: vi.fn(),
  validateSettings: vi.fn(() => []),
  ...initialState
});

// Timer helpers
export const advanceTimersByTime = (ms) => {
  vi.advanceTimersByTime(ms);
};

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Form helpers
export const fillForm = async (user, fields) => {
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(new RegExp(label, 'i'));
    await user.clear(input);
    await user.type(input, value);
  }
};

export const submitForm = async (user, buttonText = /submit|save|add|create/i) => {
  const button = screen.getByRole('button', { name: buttonText });
  await user.click(button);
};

// Assertion helpers
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

export const expectToastMessage = async (message) => {
  await waitFor(() => {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
  });
};

export const expectErrorMessage = (message) => {
  expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
};

// Local storage helpers
export const mockLocalStorageData = (data) => {
  Object.keys(data).forEach(key => {
    localStorage.getItem.mockImplementation((storageKey) =>
      storageKey === key ? JSON.stringify(data[key]) : null
    );
  });
};

export const clearLocalStorageMocks = () => {
  localStorage.getItem.mockReturnValue(null);
  localStorage.setItem.mockClear();
  localStorage.removeItem.mockClear();
};

// Component testing helpers
export const getByTestId = (testId) => screen.getByTestId(testId);
export const queryByTestId = (testId) => screen.queryByTestId(testId);
export const findByTestId = (testId) => screen.findByTestId(testId);

// Async testing helpers
export const waitForElement = (selector) =>
  waitFor(() => expect(screen.getByRole(selector)).toBeInTheDocument());

export const waitForElementToBeRemoved = (element) =>
  waitFor(() => expect(element).not.toBeInTheDocument());

// Mock service responses
export const mockTaskServiceSuccess = (method, returnValue) => {
  const taskService = vi.doMock('../utils/taskService', () => ({
    taskService: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      toggleComplete: vi.fn(),
      [method]: vi.fn().mockResolvedValue(returnValue)
    }
  }));
  return taskService;
};

export const mockTaskServiceError = (method, error) => {
  const taskService = vi.doMock('../utils/taskService', () => ({
    taskService: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      toggleComplete: vi.fn(),
      [method]: vi.fn().mockRejectedValue(new Error(error))
    }
  }));
  return taskService;
};

// Timer testing utilities
export const createTimerTestEnvironment = () => {
  vi.useFakeTimers();
  const cleanup = () => {
    vi.useRealTimers();
  };
  return { cleanup };
};

// Date utilities for testing
export const mockDate = (date) => {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return mockDate;
};

export const resetDate = () => {
  vi.useRealTimers();
  vi.useFakeTimers();
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { userEvent };
export { vi };