import { useEffect, useState } from 'react';
import { projectService } from '../utils/projectService';

export default function ProjectManager({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    projectService.getAll().then(setProjects);
  }, []);

  const handleCreate = async () => {
    if (newName.trim() === '') return;
    const created = await projectService.create(newName.trim());
    setProjects([...projects, created]);
    setNewName('');
  };

  return (
    <div className="bg-gray-800 p-4 rounded max-w-md mx-auto mt-8">
      <h2 className="text-lg font-semibold mb-3">📁 Proyectos</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Nuevo proyecto..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700"
        >
          Crear
        </button>
      </div>

      <ul className="space-y-1 text-sm">
        {projects.map((p) => (
          <li
            key={p.id}
            className="hover:underline cursor-pointer text-blue-300"
            onClick={() => onSelect?.(p)}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
