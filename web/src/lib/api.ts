// Same-origin API client: nginx proxies /api/ -> backend in every deployed
// environment; vite dev-server proxies it locally. Never hardcode a backend host.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(path, {
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
