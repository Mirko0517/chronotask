import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Obtener todos los proyectos del usuario
router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user.userId },
    orderBy: { name: 'asc' }
  });
  res.json(projects);
});

// Crear un nuevo proyecto
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        userId: req.user.userId
      }
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: 'Ese proyecto ya existe' });
  }
});

// Eliminar un proyecto (solo si no tiene tareas asociadas)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.project.delete({
      where: { id },
    });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: 'No se puede eliminar un proyecto con tareas asociadas' });
  }
});

export default router;
