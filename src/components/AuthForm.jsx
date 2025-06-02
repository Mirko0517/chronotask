import { useState, useEffect } from 'react';
import { validateAuth, validateField, loginSchema, registerSchema } from '../schemas';
import toast from 'react-hot-toast';

export default function AuthForm({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [validationState, setValidationState] = useState({
    email: null,
    password: null,
    confirmPassword: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset form when switching between login/register
  useEffect(() => {
    setFormData({ email: '', password: '', confirmPassword: '' });
    setFormErrors({});
    setValidationState({ email: null, password: null, confirmPassword: null });
  }, [isLogin]);

  // Validate field in real-time
  const validateFormField = (field, value) => {
    const schema = isLogin ? loginSchema : registerSchema;
    
    if (field === 'confirmPassword' && !isLogin) {
      // Special validation for confirm password
      const isValid = value === formData.password;
      const error = isValid ? null : 'Las contraseñas no coinciden';
      
      setFormErrors(prev => ({ ...prev, [field]: error }));
      setValidationState(prev => ({ ...prev, [field]: isValid ? 'valid' : 'invalid' }));
      return isValid;
    }
    
    const validation = validateField(schema, field, value);
    
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

  // Get password strength info
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) return { strength: 1, label: 'Débil', color: 'bg-red-500' };
    if (score === 3) return { strength: 2, label: 'Regular', color: 'bg-yellow-500' };
    if (score === 4) return { strength: 3, label: 'Buena', color: 'bg-blue-500' };
    return { strength: 4, label: 'Excelente', color: 'bg-green-500' };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change for immediate feedback
    if (value.length > 0) {
      validateFormField(field, value);
    } else {
      setValidationState(prev => ({ ...prev, [field]: null }));
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }

    // Re-validate confirm password if password changes
    if (field === 'password' && !isLogin && formData.confirmPassword) {
      validateFormField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate entire form
    const validation = validateAuth(formData, isLogin);
    if (!validation.success) {
      setFormErrors(validation.errors);
      setIsSubmitting(false);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      if (isLogin) {
        // Simulate login
        if (localStorage.getItem(formData.email) === formData.password) {
          const token = btoa(formData.email + ':' + new Date().getTime());
          localStorage.setItem('token', token);
          toast.success('¡Sesión iniciada correctamente!');
          onLoginSuccess();
        } else {
          toast.error('Credenciales incorrectas');
        }
      } else {
        // Simulate registration
        if (localStorage.getItem(formData.email)) {
          toast.error('El usuario ya existe');
          return;
        }
        localStorage.setItem(formData.email, formData.password);
        const token = btoa(formData.email + ':' + new Date().getTime());
        localStorage.setItem('token', token);
        toast.success('¡Cuenta creada e iniciada correctamente!');
        onLoginSuccess();
      }
    } catch (err) {
      toast.error('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const hasErrors = Object.values(formErrors).some(error => error !== null);
    const hasEmptyFields = !formData.email || !formData.password || (!isLogin && !formData.confirmPassword);
    return !hasErrors && !hasEmptyFields;
  };

  const ValidationIcon = ({ state }) => {
    if (state === 'valid') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (state === 'invalid') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Chronotask 🧠
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin 
              ? 'Accede a tu cuenta para gestionar tus tareas' 
              : 'Únete para comenzar a organizar tu tiempo'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={(e) => e.target.value && validateFormField('email', e.target.value)}
                className={`w-full px-4 py-3 pr-10 border rounded-lg transition-all duration-200 ${
                  formErrors.email 
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                    : validationState.email === 'valid'
                    ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <ValidationIcon state={validationState.email} />
              </div>
            </div>
            {formErrors.email && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={(e) => e.target.value && validateFormField('password', e.target.value)}
                className={`w-full px-4 py-3 pr-20 border rounded-lg transition-all duration-200 ${
                  formErrors.password 
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                    : validationState.password === 'valid'
                    ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                disabled={isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <ValidationIcon state={validationState.password} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Password strength indicator for registration */}
            {!isLogin && formData.password.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                      style={{ width: `${(getPasswordStrength(formData.password).strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    getPasswordStrength(formData.password).strength <= 2 ? 'text-red-500' :
                    getPasswordStrength(formData.password).strength === 3 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {getPasswordStrength(formData.password).label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className={formData.password.length >= 6 ? 'text-green-500' : 'text-gray-500'}>
                    ✓ Mínimo 6 caracteres
                  </span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                    ✓ Una mayúscula
                  </span>
                  <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                    ✓ Una minúscula
                  </span>
                  <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-500'}>
                    ✓ Un número
                  </span>
                </div>
              </div>
            )}
            
            {formErrors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field (only for registration) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onBlur={(e) => e.target.value && validateFormField('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3 pr-20 border rounded-lg transition-all duration-200 ${
                    formErrors.confirmPassword 
                      ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                      : validationState.confirmPassword === 'valid'
                      ? 'border-green-500 focus:border-green-400 focus:ring-2 focus:ring-green-400/20'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                  placeholder="Repite tu contraseña"
                  disabled={isSubmitting}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <ValidationIcon state={validationState.confirmPassword} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </>
            ) : (
              <>
                {isLogin ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )}
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </>
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLogin
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}