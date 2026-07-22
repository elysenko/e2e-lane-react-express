import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const healthRouter = Router();

// GET /api/health — liveness probe. Cheap, no DB access, always 200 when the process is up.
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/health/deep — readiness probe. Runs a trivial query so a broken DB connection
// surfaces as a non-2xx (500) instead of a false-healthy signal.
healthRouter.get('/deep', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(500).json({ status: 'error', db: 'unreachable' });
  }
});
