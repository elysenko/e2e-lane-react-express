# Test Specification

> ⚠️ **Warning — surface.json is a stale placeholder.** `.pipeline/surface.json` contains only
> `GET /api/health` and `POST /api/auth/login` plus generic `App`/`Home` components. It does **not**
> match this application (it is missing `/api/tasks`, `/api/health/deep`, and every real screen). The
> API surface below is therefore **derived from the approved `<spec>`**, not from `surface.json`.
>
> ⚠️ **Scope note — authentication.** The spec's Assumptions section states: *"No authentication — the
> spec's 'No authentication' scenario is authoritative and overrides the default auth baseline."* The
> upstream `tasks.md` layered on `full_auth` (login/signup/admin) but its own Open Questions flag this
> as an unresolved policy conflict. Because `<spec>` is the authoritative input, **auth, signup, login,
> logout, and `/admin/settings` are treated as Out of scope** (see final section) until the conflict is
> resolved. No test in this document assumes an authenticated session.

## Coverage summary
- Total cases: 27
- API endpoints covered: 4 / 4 (spec-derived; surface.json is invalid — see warning)
- User journeys covered: 5

## API tests

Endpoints derived from the spec's Implementation Plan (Steps 3 & 4) and Testing Strategy. Base DB state
for each suite: a **fresh** SQLite DB where seed-on-empty has inserted exactly 3 tasks (two `todo`,
one `done`).

### `GET /api/tasks`
- **Happy path**: On a fresh DB, `GET /api/tasks` → `200` with a JSON array of exactly **3** task objects.
  Each object has keys `id` (number), `title` (string), `status` (`'todo'`|`'done'`), `created_at`
  (string). Exactly 2 items have `status:'todo'` and 1 has `status:'done'`.
- **Ordering**: Response array is ordered by ascending `id` (item `[0].id < [1].id < [2].id`).
- **Reflects mutations**: After a successful `POST /api/tasks` with `title:"Buy milk"`, a subsequent
  `GET /api/tasks` returns 4 items and the last item has `title:"Buy milk"`, `status:'todo'`.
- **Validation failures**: N/A (no request body/params).
- **Auth failures**: N/A — endpoint is public (no authentication in scope).
- **Idempotency / edge cases**: Two consecutive `GET`s with no intervening mutation return identical
  bodies (read is side-effect free).

### `POST /api/tasks`
- **Happy path**: `POST` with body `{"title":"Write tests"}` → `201` with a JSON object
  `{ id:<number>, title:"Write tests", status:"todo", created_at:<string> }`. `status` defaults to
  `'todo'` even though it was not supplied. `id` is greater than the max pre-existing id.
- **Validation failures**:
  - Body `{"title":""}` (empty string) → `400`, task **not** created (subsequent `GET /api/tasks`
    count unchanged).
  - Body `{"title":"   "}` (whitespace-only) → `400` (title treated as empty after trim).
  - Body `{}` (missing `title`) → `400`.
  - Body with `title` present and non-empty but a client-supplied `status:'bogus'` → server ignores
    client status and stores `'todo'` (status is not client-settable per spec), OR `400` if the
    implementation validates status; assert created row's `status === 'todo'` in the accepted case.
- **Auth failures**: N/A — endpoint is public.
- **Idempotency / edge cases**: `POST` is **not** idempotent — two identical `POST {"title":"dup"}`
  calls create two distinct rows with different `id`s. Non-JSON / malformed body → `400` (JSON
  middleware rejects).

### `GET /api/health`
- **Happy path**: `GET /api/health` → `200` with body `{"status":"ok"}`.
- **Validation failures**: N/A.
- **Auth failures**: N/A — health routes are explicitly public per spec.
- **Idempotency / edge cases**: Returns `200` regardless of DB task count (works even before/after seed).

### `GET /api/health/deep`
- **Happy path**: `GET /api/health/deep` → `200` (runs a trivial DB query successfully). Body indicates
  a healthy status (e.g. `{"status":"ok"}` or equivalent truthy DB-ok payload).
- **Validation failures**: N/A.
- **Auth failures**: N/A — public.
- **Idempotency / edge cases**: If the DB is unreachable/uninitialized the endpoint returns a non-2xx
  (e.g. `500`); on a normally-started app it must be `200`. Used as the readiness/liveness signal.

## UI / journey tests

All journeys run against the app served under the base path `/e2e-lane-react-express/`. Router uses
`basename={import.meta.env.BASE_URL}`. Assertions describe user-visible behaviour.

### Journey: View seeded task list
- **Steps**:
  1. Navigate to `/e2e-lane-react-express/tasks`.
- **Expected outcomes**:
  - Heading text **"My Tasks"** is visible.
  - Exactly **3** task rows are rendered (from seed).
  - Each row shows a task title plus a status badge. Badge text reads **"To do"** for `todo` rows and
    **"Done"** for `done` rows (2 "To do", 1 "Done").
  - A prominent **"Add Task"** link/button is visible and points to `/tasks/new`.
- **Negative path**: If `GET /api/tasks` fails (server 5xx/network), the page shows an error state
  (not a blank/crashed screen); while the request is pending a loading state is shown.

### Journey: Root redirect
- **Steps**:
  1. Navigate to `/e2e-lane-react-express/` (root).
- **Expected outcomes**: Browser is redirected to `/tasks`; the "My Tasks" heading renders.
- **Negative path**: N/A.

### Journey: Add a task
- **Steps**:
  1. From `/tasks`, click **"Add Task"**.
  2. Assert URL is now `/tasks/new` and a **"Title"** field + **"Create"** button are visible.
  3. Type `"Ship the feature"` into the Title field.
  4. Click **"Create"**.
- **Expected outcomes**:
  - A `POST /api/tasks` is sent with `{title:"Ship the feature"}`.
  - On success the app navigates back to `/tasks`.
  - The new task **"Ship the feature"** appears in the list with a **"To do"** badge (now 4 rows).
- **Negative path**:
  - Submitting with an empty Title does not create a task; the form surfaces a validation error and/or
    the server `400` is shown as an error state; the user remains able to correct and retry.
  - If the `POST` fails server-side, an error state is shown and the user is not silently navigated away
    with lost input.

### Journey: About page
- **Steps**:
  1. Navigate to `/about` via the nav link in the Layout shell.
- **Expected outcomes**: Heading **"About Task List"** is visible; it is a static page (no data fetch
  required to render the heading).
- **Negative path**: N/A (static content).

### Journey: Deep-link / SPA fallback + base path
- **Steps** (container/prod behaviour — see Testing Strategy):
  1. With the built app served by Express, directly request (fresh browser, no client-side nav)
     `http://localhost/e2e-lane-react-express/tasks`.
  2. Directly request `http://localhost/e2e-lane-react-express/tasks/new`.
  3. Directly request `http://localhost/e2e-lane-react-express/about`.
- **Expected outcomes**:
  - Each deep link returns the SPA `index.html` (Express catch-all for non-`/api` routes) and the
    correct page renders ("My Tasks" / Title+Create form / "About Task List" respectively).
  - Static assets (JS/CSS) load successfully under the `/e2e-lane-react-express/` prefix (no 404s).
  - A request to `/api/tasks` under the app still hits the JSON API (is **not** swallowed by the SPA
    fallback).
- **Negative path**: A non-`/api` unknown route (e.g. `/e2e-lane-react-express/does-not-exist`) still
  serves `index.html` (client router decides what to show), and does **not** return the raw index for
  `/api/*` paths.

## Data integrity tests
- **Seed invariant**: On a fresh DB (empty `tasks` table at startup), after seed runs the table
  contains exactly 3 rows — two with `status='todo'`, one with `status='done'`. Seed does **not** run
  (no duplicate insert) when the table already has ≥1 row on startup.
- **Task NOT NULL / defaults**: Every persisted task row has a non-null `title` and a `status` that is
  exactly `'todo'` or `'done'`; `created_at` is populated (defaults to `CURRENT_TIMESTAMP`).
- **Create persistence**: After a successful `POST /api/tasks`, the row is durably present — a fresh
  `GET /api/tasks` (new request) returns it. Row count increases by exactly 1 per successful create.
- **Rejected create leaves no trace**: A `400` create (empty/whitespace/missing title) does not insert
  a row — table count is unchanged.
- **Auto-increment id**: New task `id` is unique and strictly greater than all existing ids.
- **Ephemerality note (not a failing assertion)**: There is no PVC, so data resets on restart; seed-on-
  empty guarantees `/tasks` is never empty after a restart. Tests must not assume created tasks survive
  a container/pod restart.

## Out of scope
- **Authentication, signup, login, logout** — the spec declares "No authentication" authoritative and
  overriding the auth baseline; no login/guards/accounts exist to test. (`tasks.md` proposed `full_auth`
  but its own Open Questions flag this as an unresolved conflict; excluded until resolved.)
- **`/admin/settings` and `/api/admin/settings` (GET/PATCH), roles (ADMIN/USER), `resolveConfig`,
  `SystemSetting`, `User` model** — same reason: these belong to the `full_auth` layer the spec does not
  scope. Not tested here.
- **`POST /api/auth/login` (listed in stale surface.json)** — endpoint is not part of the authoritative
  spec surface; excluded.
- **Task status toggling / editing / deletion** — spec states status is display-only and requires only
  list + create; no update/delete endpoints or UI exist.
- **Persistence across restarts / durable storage** — no PVC by design (data is ephemeral); only the
  seed-on-empty guarantee is asserted, not long-term durability.
- **Third-party integrations / postgresql / minio backing services** — spec Integrations = None; SQLite
  is the only datastore under test.
- **Kubernetes deployment/ingress wiring, TLS, and infra-level probes** — verified operationally, not by
  this application test suite (the app-level `/api/health` behaviour is covered above).
