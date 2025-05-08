import { useState } from 'react';

export default function AuthForm({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Aquí irían las llamadas reales a tu API
      // Por ahora simulamos el proceso
      if (isLogin) {
        // Simular login
        if (localStorage.getItem(email) === password) {
          const token = btoa(email + ':' + new Date().getTime());
          localStorage.setItem('token', token);
          onLoginSuccess();
        } else {
          setError('Credenciales incorrectas');
        }
      } else {
        // Simular registro
        if (localStorage.getItem(email)) {
          setError('El usuario ya existe');
          return;
        }
        localStorage.setItem(email, password);
        // Auto login después del registro
        const token = btoa(email + ':' + new Date().getTime());
        localStorage.setItem('token', token);
        onLoginSuccess();
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Chronotask 🧠
          </h1>
          <h2 className="text-center text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-center text-sm">{error}</div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              {isLogin
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
