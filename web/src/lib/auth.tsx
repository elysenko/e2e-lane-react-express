import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, type SessionUser, type UserRole } from './api';

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'session_user';

function readStored(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readStored());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function persist(next: SessionUser | null, token?: string) {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    if (token) localStorage.setItem('token', token);
    if (!next) localStorage.removeItem('token');
  }

  async function login(email: string, password: string) {
    const res = await api<{ token: string; role: UserRole }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    persist({ email, role: res.role ?? 'USER' }, res.token);
  }

  async function signup(email: string, password: string) {
    const res = await api<{ token: string; role: UserRole }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    persist({ email, role: res.role ?? 'USER' }, res.token);
  }

  async function logout() {
    try {
      await api<void>('/api/auth/logout', { method: 'POST' });
    } catch {
      /* best-effort; clear client session regardless */
    }
    persist(null);
  }

  const value = useMemo<AuthState>(
    () => ({ user, ready, login, signup, logout }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
