import express, { type NextFunction, type Request, type Response } from 'express';
import { prisma } from './lib/prisma';
import { signToken, verifyPassword, hashPassword } from './lib/auth';
import { tasksRouter } from './routes/tasks';
import { healthRouter } from './routes/health';

export const app = express();
app.use(express.json());

// Malformed JSON bodies should surface as a clean 400 JSON error, not an HTML stack trace.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }
  return next(err);
});

// Health probes (liveness + deep readiness). Public per spec — descriptor backend_probe_path=/api/health.
app.use('/api/health', healthRouter);

// Task list API — the authoritative feature surface. Public: no authentication in scope.
app.use('/api/tasks', tasksRouter);

// ---------------------------------------------------------------------------
// Auth endpoints. Authentication is out of scope for the task-list spec, but the
// scaffolded UI ships login/signup pages, so these remain available and functional
// rather than 404-ing. Task routes above never require a session.
// ---------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  return res.json({ token: signToken({ sub: user.id, role: user.role }), role: user.role });
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email already registered' });
  const user = await prisma.user.create({
    data: { email, name: email.split('@')[0], password: hashPassword(password) },
  });
  return res.status(201).json({ token: signToken({ sub: user.id, role: user.role }), role: user.role });
});

app.post('/api/auth/logout', (_req, res) => {
  // Stateless JWT — nothing to invalidate server-side; the client clears its token.
  res.status(204).end();
});
