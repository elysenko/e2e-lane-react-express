import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Task } from '../lib/api';

export default function NewTaskPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a title.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: trimmed }),
      });
      navigate('/tasks');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 400) {
        setError('Please enter a title.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page page--narrow">
      <nav className="crumbs">
        <Link to="/tasks">← Back to tasks</Link>
      </nav>
      <h1 className="page__title" data-testid="new-task-title">+ New Task</h1>
      <p className="page__subtitle">Give your task a short, clear title.</p>

      <form className="card form" onSubmit={submit} data-testid="new-task-form" noValidate>
        <label className="field">
          <span className="field__label">Title</span>
          <input
            className="input"
            data-testid="task-title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Prepare the weekly report"
            autoFocus
            aria-invalid={!!error}
          />
          {error && (
            <span className="field__error" data-testid="task-error" role="alert">
              {error}
            </span>
          )}
        </label>

        <div className="form__actions">
          <Link to="/tasks" className="btn btn--ghost">Cancel</Link>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            data-testid="create-task-button"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </section>
  );
}
