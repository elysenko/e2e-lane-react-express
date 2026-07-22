// Same-origin API client: nginx proxies /api/ -> backend in every deployed
// environment; vite dev-server proxies it locally. Never hardcode a backend host.
//
// The SPA is served under the ingress base path (import.meta.env.BASE_URL, e.g.
// `/e2e-lane-react-express/` in prod, `/` in dev). The ingress only routes that prefix
// to this service and rewrites it away, so absolute API paths MUST be prefixed with the
// base — otherwise `/api/...` never matches the ingress rule. In dev BASE_URL is `/`, so
// the prefix collapses to nothing and vite's `/api` proxy still applies.
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function resolveUrl(path: string): string {
  return path.startsWith('/') ? `${API_BASE}${path}` : path;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(resolveUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const err = new Error(`${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  // Some endpoints (e.g. logout) return an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ----- Domain types (mirror the surface contract) -----
export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  created_at?: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface SessionUser {
  email: string;
  role: UserRole;
}

export interface ServiceSetting {
  key: string;
  label: string;
  value: string; // masked
  configured: boolean;
}
