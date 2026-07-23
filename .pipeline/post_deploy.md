# Post-Deploy Report

**Deployed URL:** https://e2e-lane-react-express-staging-5c52ea590a1ba586.athenconsult.com/
**Date:** 2026-07-23
**Staging namespace:** `colossus-e2e-lane-react-express-staging` (pod `e2e-lane-react-express-staging-58f975bcdf-w7j7v`, image `e2e-lane-react-express-staging:latest`)

## ⚠️ Headline: app is LIVE but its database is not wired

The container runs and serves the SPA + shallow health, but **`DATABASE_URL` is not set** in the pod
(the `app-secrets` secret referenced by the deployment `envFrom` is `optional: true` and **does not exist**).
Every DB-backed feature (tasks list/create, deep health, demo-user seeding) fails. This also affects the
base namespace `colossus-e2e-lane-react-express` — so it is a systemic deploy-provisioning gap, not
staging-specific. Provisioning a database + secret is outside this stage's scope (operational glue only),
so it is surfaced here for the deploy/publisher stage or a human to resolve.

## Phase 3 — Liveness (public URL)
| Endpoint | Status | Time | TLS |
|---|---|---|---|
| `/` (SPA) | **200** | ~0.20s | valid ✅ |
| `/api/health` (shallow) | **200** `{"status":"ok"}` | ~0.28s | valid ✅ |
| `/api/health/deep` | **500** `{"db":"unreachable"}` | ~0.27s | valid ✅ |
| `/api/tasks` | **502** | ~0.19s | valid ✅ |

TLS certificate verifies successfully (`ssl_verify_result = 0`). Frontend and process are up; DB layer is down.

## Phase 0 — Seed demo users & report credentials
- Namespace resolved to `colossus-e2e-lane-react-express-staging` (the `team_id`-derived
  `colossus-029586eb-f0db-4418-b-staging` is not accessible / not the live ns).
- Running pod & production image located; seed script present in image at `/app/backend/prisma/seed.ts`
  (TypeScript; runs via `npx prisma db seed` → `npx tsx prisma/seed.ts`).
- Seed attempted (exec fallback, adapted to this image's TS seed). **Failed** with:
  `PrismaClientInitializationError: Environment variable not found: DATABASE_URL`.
- **No `SEED_CRED` lines captured → no credentials POSTed to Colossus** (posting fake creds for
  non-existent users would be misleading).
- CloudBeaver: no `cloudbeaver` service in the namespace → not deployed, skipped.

## Phase 1 — Deferred secrets
- No secrets store / `integrations.json` present and no secrets marked
  `obtain_timing="post_deploy"` or `obtain_by="defer"` were found. **Nothing to collect.**
- Note: the *required* runtime secret `app-secrets.DATABASE_URL` is missing (see headline).

## Phase 2 — Webhook registration
- No `.pipeline/integrations.json` and the technical plan declares **Integrations: None**.
  **No webhooks to register — skipped.**

## Manual actions required
1. **Provision the database & create `app-secrets` with `DATABASE_URL`** in namespace
   `colossus-e2e-lane-react-express-staging` (and the base ns), then restart the deployment.
   This is the single blocker for tasks, deep-health, and demo seeding.
2. **Re-run demo seeding** once the DB is reachable (e.g. `kubectl exec <pod> -- sh -c 'cd /app/backend && npx prisma db seed'`
   or a K8s Job on the app image), then PATCH the parsed `SEED_CRED` creds to Colossus
   `/api/v1/teams/029586eb-f0db-4418-b68f-b45a753da8e2/demo-credentials`.
