import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const userId = req.user.userId;
  let setting = await prisma.setting.findUnique({ where: { userId } });

  if (!setting) {
    setting = await prisma.setting.create({ data: { userId } });
  }

  res.json(setting);
});

router.put('/', async (req, res) => {
  const userId = req.user.userId;
  const { work, break: short, longBreak } = req.body;

  const setting = await prisma.setting.upsert({
    where: { userId },
    update: { work, break: short, longBreak },
    create: { work, break: short, longBreak, userId },
  });

  res.json(setting);
});

export default router;
