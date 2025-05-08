import { useState } from 'react';
import AuthForm from './AuthForm';

export default function AccountNotice({ onLogin }) {
  const [showAuth, setShowAuth] = useState(false);
  const token = localStorage.getItem('token');

  if (token) return null;

  return (
    <div className="max-w-xl mx-auto mt-8 bg-blue-900 text-white rounded p-4 text-center">
      {!showAuth ? (
        <>
          <p className="mb-3">
            🧠 Estás usando Chronotask en modo invitado. Solo con una cuenta podrás guardar tareas y estadísticas en la nube.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Crear cuenta / Iniciar sesión
          </button>
        </>
      ) : (
        <AuthForm onLoginSuccess={onLogin} />
      )}
    </div>
  );
}
