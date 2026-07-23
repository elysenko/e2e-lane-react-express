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
  try {
    const tasks = await prisma.task.findMany({ orderBy: { id: 'asc' } });
    res.json(tasks.map(serialize));
  } catch (err) {
    // Never let a DB error become an unhandled rejection (which would crash the process
    // and surface as a 502 at the ingress). Return a clean 500 instead.
    // eslint-disable-next-line no-console
    console.error('GET /api/tasks failed:', err);
    res.status(500).json({ error: 'failed to load tasks' });
  }
});

// POST /api/tasks — create a task. `title` is required and trimmed; `status` is
// server-controlled and always defaults to 'todo' (client-supplied status is ignored).
tasksRouter.post('/', async (req, res) => {
  const rawTitle = (req.body ?? {}).title;
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  try {
    const task = await prisma.task.create({ data: { title, status: 'todo' } });
    return res.status(201).json(serialize(task));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /api/tasks failed:', err);
    return res.status(500).json({ error: 'failed to create task' });
  }
});
