import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';
import projectsRoutes from './routes/projects.js';

dotenv.config();
const app = express();
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/projects', projectsRoutes);
app.get('/', (req, res) => {
  res.send('Chronotask API funcionando 🎯');
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack); // Registrar el stack trace del error

  // Si el error tiene un statusCode, úsalo, de lo contrario, usa 500
  const statusCode = err.statusCode || 500;
  // Si el error tiene un mensaje, úsalo, de lo contrario, un mensaje genérico
  const message = err.message || 'Ocurrió un error interno en el servidor.';

  res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

