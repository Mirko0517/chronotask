import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateToken);

// Registrar 1 pomodoro
router.post('/', async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];

  const [log] = await prisma.pomodoroLog.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(today),
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      date: new Date(today),
      count: 1,
    },
  });

  res.status(200).json(log);
});

// Obtener los últimos 7 días
router.get('/', async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const pastWeek = new Date();
  pastWeek.setDate(now.getDate() - 6);

  const logs = await prisma.pomodoroLog.findMany({
    where: {
      userId,
      date: {
        gte: pastWeek,
        lte: now,
      },
    },
  });

  res.json(logs);
});

export default router;
