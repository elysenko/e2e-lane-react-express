import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const tasksRouter = Router();

// Serialize a Prisma Task row into the JSON shape the client expects
// (`created_at` snake_case string; see web/src/lib/api.ts `Task`).
function serialize(task: { id: number; title: string; status: string; createdAt: Date }) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    created_at: task.createdAt.toISOString(),
  };
}

// GET /api/tasks — list every task ordered by ascending id (public, no auth).
tasksRouter.get('/', async (_req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: { id: 'asc' } });
  res.json(tasks.map(serialize));
});

// POST /api/tasks — create a task. `title` is required and trimmed; `status` is
// server-controlled and always defaults to 'todo' (client-supplied status is ignored).
tasksRouter.post('/', async (req, res) => {
  const rawTitle = (req.body ?? {}).title;
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const task = await prisma.task.create({ data: { title, status: 'todo' } });
  return res.status(201).json(serialize(task));
});
