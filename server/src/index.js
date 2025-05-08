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
const prisma = new PrismaClient();

app.use('/api/tasks', tasksRoutes);
app.use('/api/settings', settingsRoutes);
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send('Chronotask API funcionando 🎯');
});
app.use('/api/stats', statsRoutes);
app.use('/api/projects', projectsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

