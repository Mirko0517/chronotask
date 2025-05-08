export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token'); // Limpiar token en errores de autenticación
    window.location.reload(); // Recargar para mostrar el formulario de login
    throw new Error('No autorizado');
  }

  return response;
} 