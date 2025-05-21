import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title, estimated } = req.body;
  const task = await prisma.task.create({
    data: {
      title,
      estimatedPomodoros: estimated,
      completed: false,
      used: 0,
      userId: req.user.userId
    }
  });
  res.status(201).json(task);
});

router.patch('/:id', async (req, res) => {
  const { completed, used } = req.body;
  const task = await prisma.task.update({
    where: { id: Number(req.params.id) },
    data: { completed, used }
  });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  await prisma.task.delete({
    where: { id: Number(req.params.id) }
  });
  res.status(204).end();
});

export default router;
