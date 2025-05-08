export function exportTasksToCSV(tasks, projects = []) {
    const headers = ['Tarea', 'Completada', 'Usados', 'Estimados', 'Proyecto'];
    const rows = tasks.map(task => {
      const projectName = projects.find(p => p.id === task.projectId)?.name || '—';
      return [
        `"${task.title}"`,
        task.completed ? 'Sí' : 'No',
        task.used,
        task.estimated,
        `"${projectName}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chronotask_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
  