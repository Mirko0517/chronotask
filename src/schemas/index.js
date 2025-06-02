import { z } from 'zod';

// Task Schemas
export const taskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string()
    .min(1, 'El título es requerido')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  completed: z.boolean().default(false),
  estimated: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 pomodoro')
    .max(20, 'Máximo 20 pomodoros')
    .default(1),
  used: z.number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .default(0),
  projectId: z.number().int().positive().optional().nullable(),
  createdAt: z.date().optional(),
  userId: z.number().int().positive().optional()
});

export const createTaskSchema = taskSchema.omit({ 
  id: true, 
  createdAt: true, 
  userId: true 
});

export const updateTaskSchema = taskSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  userId: true 
});

// Auth Schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .max(255, 'Email muy largo'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'Contraseña muy larga')
});

export const registerSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .max(255, 'Email muy largo'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Settings Schemas
export const settingsSchema = z.object({
  work: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 minuto')
    .max(90, 'Máximo 90 minutos')
    .default(25),
  break: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 minuto')
    .max(30, 'Máximo 30 minutos')
    .default(5),
  longBreak: z.number()
    .int('Debe ser un número entero')
    .min(5, 'Mínimo 5 minutos')
    .max(60, 'Máximo 60 minutos')
    .default(15),
  sound: z.boolean().default(true),
  autoStartBreaks: z.boolean().default(false),
  autoStartPomodoros: z.boolean().default(false),
  dailyGoal: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Mínimo 1 pomodoro')
    .max(20, 'Máximo 20 pomodoros')
    .default(8),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.boolean().default(true)
});

export const updateSettingsSchema = settingsSchema.partial();

// Project Schemas
export const projectSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  userId: z.number().int().positive().optional(),
  createdAt: z.date().optional()
});

export const createProjectSchema = projectSchema.omit({ 
  id: true, 
  createdAt: true, 
  userId: true 
});

export const updateProjectSchema = projectSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  userId: true 
});

// Stats Schemas
export const statsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  count: z.number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(50, 'Máximo 50 pomodoros por día')
    .default(1)
});

// Form Validation Helpers
export const validateTask = (data) => {
  try {
    return { success: true, data: createTaskSchema.parse(data), errors: null };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      errors: error.errors.reduce((acc, err) => {
        acc[err.path[0]] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateAuth = (data, isLogin = true) => {
  try {
    const schema = isLogin ? loginSchema : registerSchema;
    return { success: true, data: schema.parse(data), errors: null };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      errors: error.errors.reduce((acc, err) => {
        acc[err.path[0]] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateSettings = (data) => {
  try {
    return { success: true, data: updateSettingsSchema.parse(data), errors: null };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      errors: error.errors.reduce((acc, err) => {
        acc[err.path[0]] = err.message;
        return acc;
      }, {})
    };
  }
};

export const validateProject = (data) => {
  try {
    return { success: true, data: createProjectSchema.parse(data), errors: null };
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      errors: error.errors.reduce((acc, err) => {
        acc[err.path[0]] = err.message;
        return acc;
      }, {})
    };
  }
};

// Field-level validation for real-time feedback
export const validateField = (schema, field, value) => {
  try {
    const fieldSchema = schema.shape[field];
    if (!fieldSchema) return { isValid: true, error: null };
    
    fieldSchema.parse(value);
    return { isValid: true, error: null };
  } catch (error) {
    return { 
      isValid: false, 
      error: error.errors[0]?.message || 'Valor inválido' 
    };
  }
};