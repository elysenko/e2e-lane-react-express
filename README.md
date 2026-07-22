# e2e-lane-react-express

A small **Task List** app: a Vite + React (TypeScript) SPA served by nginx, backed by an
Express (TypeScript) API using Prisma + PostgreSQL. No authentication is required to view or
create tasks. Three example tasks are seeded on first run so the list is never empty.

## Stack
- **web/** — Vite + React + TypeScript SPA (nginx serves the build, proxies `/api` → backend).
- **backend/** — Express + TypeScript API, Prisma ORM against PostgreSQL.
- Deploy: two containers (`web/Dockerfile.frontend`, `backend/Dockerfile`) behind an ingress
  that serves the app under the `/e2e-lane-react-express/` base path.

## Screens
- `/tasks` — "My Tasks" list (title + To do / Done badge), with an "Add Task" button.
- `/tasks/new` — create a task (title field + Create).
- `/about` — static "About Task List" page.

## API
- `GET  /api/tasks` — list all tasks (ascending id), public.
- `POST /api/tasks` — create a task `{ "title": "…" }`; empty/whitespace title → 400; new
  tasks default to `status: "todo"`. Public.
- `GET  /api/health` — liveness → `{ "status": "ok" }`.
- `GET  /api/health/deep` — readiness (runs a DB query) → 200 when the DB is reachable.

## Run locally
```bash
# Backend (needs DATABASE_URL pointing at a Postgres instance)
cd backend
npm install
export DATABASE_URL="postgresql://user:pass@localhost:5432/app"
npx prisma migrate deploy      # apply schema
npm run dev                    # API on :3000, seeds 3 tasks if the table is empty

# Frontend (proxies /api -> http://localhost:3000)
cd web
npm install
npm run dev                    # SPA on :5173
```

## Build
```bash
cd backend && npm run build          # tsc -> dist/
cd web && npx vite build --base=/e2e-lane-react-express/   # -> dist/
```
