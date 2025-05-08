import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(prev => !prev)}
      className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {dark ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
} 