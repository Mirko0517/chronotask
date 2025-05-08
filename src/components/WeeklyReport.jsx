import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';
import { statsService } from '../utils/statsService';


ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function WeeklyReport() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    statsService.getWeeklyStats().then(setStats);
  }, []);


  const data = {
    labels: stats.map(s => s.day),
    datasets: [
      {
        label: 'Pomodoros completados',
        data: stats.map(s => s.count),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  return (
    <div className="mt-10 max-w-md mx-auto bg-gray-800 p-4 rounded">
      <h2 className="text-xl font-semibold mb-4">📊 Productividad semanal</h2>
      <Bar data={data} />
    </div>
  );
}
