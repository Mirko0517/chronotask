import { authFetch } from './authFetch';

const isLoggedIn = () => !!localStorage.getItem('token');

export const projectService = {
  async getAll() {
    if (!isLoggedIn()) return []; // Solo disponible para usuarios logueados
    const res = await authFetch('/api/projects');
    return await res.json();
  },

  async create(name) {
    const res = await authFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return await res.json();
  },

  async remove(id) {
    return await authFetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }
};
