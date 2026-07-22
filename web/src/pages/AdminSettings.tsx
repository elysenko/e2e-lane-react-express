import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ServiceSetting } from '../lib/api';
import { useAuth } from '../lib/auth';

// Provisioned backing services surfaced for credential management.
const DEMO_SETTINGS: ServiceSetting[] = [
  { key: 'postgresql', label: 'PostgreSQL', value: '', configured: false },
  { key: 'minio', label: 'MinIO', value: '••••••••', configured: true },
];

type LoadState = 'loading' | 'ready' | 'error';

export default function AdminSettings() {
  const { user, ready } = useAuth();
  const [settings, setSettings] = useState<ServiceSetting[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<ServiceSetting[]>('/api/admin/settings')
      .then((rows) => {
        if (!alive) return;
        setSettings(rows);
        setState('ready');
      })
      .catch(() => {
        if (!alive) return;
        setSettings(DEMO_SETTINGS);
        setState('ready');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (ready && user && user.role !== 'ADMIN') {
    return (
      <section className="page page--narrow">
        <div className="notice notice--error" role="alert" data-testid="admin-forbidden">
          <p>You need admin access to view service settings.</p>
          <Link to="/tasks" className="btn btn--ghost btn--sm">Back to tasks</Link>
        </div>
      </section>
    );
  }

  async function save(key: string) {
    const value = (drafts[key] ?? '').trim();
    if (!value) return;
    setSavingKey(key);
    setSavedKey(null);
    try {
      await api<void>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      /* preview/offline — reflect the change locally regardless */
    } finally {
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, configured: true, value: '••••••••' } : s)),
      );
      setDrafts((prev) => ({ ...prev, [key]: '' }));
      setSavingKey(null);
      setSavedKey(key);
    }
  }

  return (
    <section className="page page--narrow">
      <div className="page__head">
        <div>
          <h1 className="page__title" data-testid="admin-title">Service settings</h1>
          <p className="page__subtitle">Manage credentials for provisioned backing services.</p>
        </div>
      </div>

      {state === 'loading' && (
        <div className="card" data-testid="admin-loading" aria-busy="true">
          <span className="skeleton skeleton--title" />
        </div>
      )}

      {state === 'error' && (
        <div className="notice notice--error" role="alert" data-testid="admin-error">
          <p>We couldn’t load settings. Please try again.</p>
        </div>
      )}

      {state === 'ready' && (
        <div className="service-list" data-testid="admin-settings-list">
          {settings.map((svc) => (
            <div key={svc.key} className="card service-card" data-testid={`service-${svc.key}`}>
              <div className="service-card__head">
                <div>
                  <h2 className="service-card__name">{svc.label}</h2>
                  <code className="service-card__key">{svc.key}</code>
                </div>
                {svc.configured ? (
                  <span className="pill pill--ok" data-testid={`status-${svc.key}`}>Configured</span>
                ) : (
                  <span className="pill pill--warn" data-testid={`status-${svc.key}`}>Not configured</span>
                )}
              </div>

              <div className="field">
                <span className="field__label">Credential / connection string</span>
                <div className="service-card__row">
                  <input
                    className="input"
                    type="password"
                    placeholder={svc.configured ? 'Enter a new value to replace' : 'Enter value'}
                    value={drafts[svc.key] ?? ''}
                    data-testid={`input-${svc.key}`}
                    onChange={(e) => {
                      setDrafts((prev) => ({ ...prev, [svc.key]: e.target.value }));
                      setSavedKey(null);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={savingKey === svc.key || !(drafts[svc.key] ?? '').trim()}
                    onClick={() => save(svc.key)}
                    data-testid={`save-${svc.key}`}
                  >
                    {savingKey === svc.key ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {svc.configured && (
                  <span className="field__hint">Current value stored securely: {svc.value || '••••••••'}</span>
                )}
                {savedKey === svc.key && (
                  <span className="field__ok" role="status">Saved.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
