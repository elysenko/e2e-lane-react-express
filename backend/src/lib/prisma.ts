import path from 'path';
import { PrismaClient } from '@prisma/client';

// Self-contained SQLite: if no DATABASE_URL secret is injected (none is provisioned for
// this app), fall back to a local file so the DB is always reachable and /api/tasks never
// 502s. DATA_DIR lets the deploy override the location; default matches the Dockerfile ENV.
if (!process.env.DATABASE_URL) {
  const dataDir = process.env.DATA_DIR || '/app/data';
  process.env.DATABASE_URL = `file:${path.join(dataDir, 'app.db')}`;
}

export const prisma = new PrismaClient();
