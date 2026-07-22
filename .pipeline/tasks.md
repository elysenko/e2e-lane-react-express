# Pipeline Task Decomposition

## Summary
A single-container React (Vite/TypeScript) + Express (Node) app with SQLite persistence that serves a simple task list. It exposes `/tasks` (list), `/tasks/new` (create form), and `/about`, seeds 3 example tasks on first run so the list is never empty, and serves the built SPA plus a JSON API under `/api` on port 80 behind the `/e2e-lane-react-express/` base path. Per the mandated `full_auth` model and provisioned backing services (postgresql, minio), the build also includes a User/role model, auth flows, an admin route group, and an admin settings page for service credentials.

## Surface contract
Source of truth for ui_agent + service_agent + tester.

### Public app routes / screens
- `GET /` → redirect to `/tasks`
- `/tasks` — "My Tasks": task rows (title + status badge), prominent "Add Task" link to `/tasks/new`
- `/tasks/new` — form with "Title" field + "Create" button; POST then navigate to `/tasks`
- `/about` — static page, heading "About Task List"

### Auth screens (full_auth)
- `/login` — user + admin login
- `/signup` — public signup (first user → ADMIN, subsequent → USER); after signup, redirect to `/tasks`
- Logout action (from nav)

### Admin screens
- `/admin/settings` — service credential management (postgresql, minio); visible only to admins

### API endpoints
- `GET /api/tasks` — list all tasks ordered by id
- `POST /api/tasks` — create; validates non-empty `title` (400 if empty), `status` defaults `'todo'`, returns 201 + created row
- `GET /api/health` → `{status:'ok'}`
- `GET /api/health/deep` → trivial DB query
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout` (full_auth)
- `GET /api/admin/settings` — list service/integration keys with masked values + configured status (admin only)
- `PATCH /api/admin/settings` — upsert key-value pairs (admin only)

### Entities
- `Task` — `id`, `title`, `status` (`'todo'`|`'done'`), `created_at`
- `User` — with `role` (`ADMIN`|`USER`)
- `SystemSetting` — `key`, `value`, `updatedAt`

## db_agent tasks
- [ ] Create `server/src/db.ts` opening SQLite at `${process.env.DATA_DIR || './data'}/tasks.db` and run `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`.
- [ ] Add `User` table/model with a `role` field constrained to enum `UserRole { ADMIN, USER }`, defaulting to `USER` (full_auth); include unique email + password hash columns for auth.
- [ ] Add `SystemSetting` table/model — `key String @id` (`key TEXT PRIMARY KEY`), `value String` (`value TEXT NOT NULL`), `updatedAt DateTime @updatedAt`.
- [ ] Create `server/src/seed.ts`: if `SELECT COUNT(*) FROM tasks` is 0, insert 3 example tasks (two `'todo'`, one `'done'` to exercise both badges). Called once from `index.ts` after DB init.

## backend_agent tasks
- [ ] Create `server/package.json` (deps `express`, `better-sqlite3`; dev `typescript`, `@types/*`, `tsx`) and `server/tsconfig.json` (Node/CommonJS TS config).
- [ ] Create `server/src/routes/tasks.ts`: `GET /api/tasks` returns all rows ordered by id; `POST /api/tasks` validates `title` (400 if empty), inserts with `status='todo'`, returns 201 + created row.
- [ ] Create `server/src/routes/health.ts`: `GET /api/health` → `{status:'ok'}`; `GET /api/health/deep` → runs a trivial DB query.
- [ ] Create `server/src/index.ts`: JSON middleware, mount task + health + auth + admin routers under `/api`, `express.static('../client/dist')`, SPA catch-all `GET *` (non-`/api`) → `client/dist/index.html`, run seed, then `listen(process.env.PORT || 80)`.
- [ ] Implement auth flows (full_auth): `POST /api/auth/signup` (first user gets `ADMIN`, subsequent get `USER`), `POST /api/auth/login`, `POST /api/auth/logout`; hash passwords and issue a session/token.
- [ ] Implement admin guard middleware (role check) and generate the protected `/api/admin/*` route group; admin can always log in.
- [ ] Create `lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or is absent, reads from the `SystemSetting` DB row; returns null if neither is set.
- [ ] Create `GET /api/admin/settings` (list `postgresql` and `minio` service keys with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, admin role required).

## ui_agent tasks
- [ ] Create `client/package.json` (deps `react`, `react-dom`, `react-router-dom`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react*`), `client/vite.config.ts` (`base: '/e2e-lane-react-express/'`, React plugin, dev proxy `/e2e-lane-react-express/api` → `http://localhost:80`), `client/tsconfig.json`, `client/index.html`.
- [ ] Create `client/src/main.tsx`: `BrowserRouter` with `basename={import.meta.env.BASE_URL}`; route table (`/` → redirect `/tasks`, `/tasks`, `/tasks/new`, `/about`, `/login`, `/signup`, `/admin/settings`).
- [ ] Create `client/src/components/Layout.tsx` — nav shell with links to Tasks / About, a logout action, and an Admin section link visible only to admins.
- [ ] Create `client/src/pages/TasksPage.tsx` — heading "My Tasks", task rows (title + `StatusBadge`), prominent "Add Task" link to `/tasks/new`; handle empty/loading/error states.
- [ ] Create `client/src/pages/NewTaskPage.tsx` — form with "Title" field + "Create" button; on submit POST then `navigate('/tasks')`; handle validation/error states.
- [ ] Create `client/src/pages/AboutPage.tsx` — static page, heading "About Task List".
- [ ] Create `client/src/components/StatusBadge.tsx` — maps `'todo'`→"To do", `'done'`→"Done".
- [ ] Create `/login` and `/signup` screens as part of the main app (full_auth), with loading/error states.
- [ ] Create `/admin/settings` page — list `postgresql` and `minio`, each with a configured/unconfigured badge and a per-service credential form. (No placeholder services/integrations flagged, so no activation banner is required.)

## service_agent tasks
- [ ] Create `client/src/api.ts` — fetch helpers using `${import.meta.env.BASE_URL}api/tasks` for list (`GET`) and create (`POST`), resolving to the ingress-prefixed path in prod.
- [ ] Wire `TasksPage` to `GET /api/tasks` and `NewTaskPage` to `POST /api/tasks`, threading loading/error results into the UI states.
- [ ] Add client auth data layer: signup/login/logout calls to `/api/auth/*`, session/token persistence, and current-user/role fetch to drive admin nav visibility.
- [ ] Add admin settings data layer: `GET /api/admin/settings` (load masked values + status) and `PATCH /api/admin/settings` (submit credential form) for the `/admin/settings` page.

## tester tasks
- [ ] E2E happy path: `/tasks` shows 3 seeded tasks with correct badges; "Add Task" navigates to `/tasks/new`; submitting a title returns to `/tasks` with the new item; `/about` shows "About Task List".
- [ ] API tests: fresh DB `GET /api/tasks` returns 3 items; `POST /api/tasks {title}` → 201 with `status:'todo'`; `POST` empty title → 400; `GET /api/health` → 200; `GET /api/health/deep` → 200.
- [ ] Auth tests (full_auth): first signup gets `ADMIN`, subsequent signup gets `USER`; login/logout succeed; non-admin blocked from `/api/admin/settings` (403), admin allowed.
- [ ] Admin settings tests: `GET /api/admin/settings` lists `postgresql` and `minio` with masked values + configured status; `PATCH` upserts values and flips status to configured; `resolveConfig` prefers env, falls back to `SystemSetting`, returns null when unset.
- [ ] Container/base-path regression: `docker build` + `docker run -p 80:80`; deep-link `/e2e-lane-react-express/tasks`, `/tasks/new`, `/about` directly to verify SPA fallback + base path; confirm assets load under the `/e2e-lane-react-express/` prefix.

## Open questions
- **Auth conflict:** the spec's `## Assumptions` explicitly states "No authentication … overrides the default auth baseline," but the mandated `<auth_model>` is `full_auth`. This decomposition applies the `full_auth` rules (User/role, `/login`, `/signup`, admin guard) as required by pipeline policy. Confirm which is authoritative before backend/ui agents build auth surface the spec did not scope.
- **Persistence conflict:** the spec specifies SQLite (`better-sqlite3`), but `<spec_deployments>` lists `postgresql` and `minio`. Tasks assume SQLite for the app's `tasks` table (per spec) while adding a `SystemSetting`-backed admin settings surface for the provisioned services. Confirm whether postgres/minio should actually back persistence, or are only surfaced as configurable admin settings.
- **Integrations:** `<spec_integrations>` contains a single `None` entry with a placeholder `NONE_API_KEY` env key; treated as "no integrations" (spec `## Integrations` says None). No integration client modules generated. Confirm this is correct.
- **Admin seed account:** with signup-driven ADMIN bootstrap (full_auth), confirm no separate admin seed script is needed and that the first signup convention is acceptable.
