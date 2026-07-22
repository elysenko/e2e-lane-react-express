# Architecture

## Stack requested
`react-express` — React (Vite/TypeScript) SPA + Express (Node/TypeScript) API, Prisma/PostgreSQL by default.

## Scaffolding status
Newly scaffolded from `template-react-express`. The project directory previously contained only
placeholder infrastructure (a static nginx `Dockerfile`/`index.html`, `k8s/` manifests, `kustomization.yaml`)
with no application source — treated as greenfield.

## Layout
- `web/` — Vite + React + TypeScript frontend.
  - `web/src/App.tsx` — router shell, `data-testid="app-ready"` on the root (readiness landmark for the render gate — do not remove).
  - `web/src/pages/` — route pages (`Home.tsx`, `Login.tsx` as scaffolded).
  - `web/vite.config.ts` — build output `dist/`, dev proxy to `/api` → `http://localhost:3000`.
- `backend/` — Express + TypeScript API.
  - `backend/src/app.ts` — Express app, mounts `/api/health` and `/api/auth/login`.
  - `backend/prisma/schema.prisma` — Prisma schema (PostgreSQL, `User` model, JWT auth helpers in `backend/src/lib/auth.ts`).
  - `backend/src/server.ts` — listens on `process.env.PORT || 3000`.
- `.pipeline/surface.json` — route/component/test-id manifest consumed by the test_spec and Playwright agents.
- `.colossus-acceptance.json` — acceptance contract for the post-deploy render gate (`ready_testid: app-ready`).
- `colossus.yaml` — build manifest read by deploy agents (framework, output dir, base href, backend build info).
- `k8s/`, `kustomization.yaml` — existing Kubernetes deploy manifests (unchanged by scaffolding).

## Next steps
1. Implement the plan's features on top of this scaffold (per the technical plan: task list app with SQLite
   persistence, no authentication — this will require swapping the template's Prisma/Postgres/JWT scaffolding
   for the plan's SQLite + no-auth approach, and replacing the root placeholder `Dockerfile`/`index.html`).
2. `cd web && npm install && npm run dev` — run the frontend locally (proxies `/api` to `http://localhost:3000`).
3. `cd backend && npm install && npm run dev` — run the backend locally.
4. Update `.pipeline/surface.json` and `.colossus-acceptance.json` `expect_text` as real pages/routes/test-ids are added.
5. Replace the root `Dockerfile` (currently a placeholder nginx image) with a real multi-stage build per `colossus.yaml`.

## Template source
`template-react-express` from the scaffold-templates library.
