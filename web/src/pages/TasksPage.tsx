import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Task } from '../lib/api';
import StatusBadge from '../components/StatusBadge';

// Seed data mirrors the server's seed-on-empty behaviour so the preview is never blank
// when the API is unreachable (static mockup). Two "todo" + one "done" exercise both badges.
const DEMO_TASKS: Task[] = [
  { id: 1, title: 'Review the project brief', status: 'todo' },
  { id: 2, title: 'Draft the launch checklist', status: 'todo' },
  { id: 3, title: 'Set up the repository', status: 'done' },
];

type LoadState = 'loading' | 'ready' | 'error';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let alive = true;
    api<Task[]>('/api/tasks')
      .then((rows) => {
        if (!alive) return;
        setTasks(rows);
        setState('ready');
      })
      .catch(() => {
        if (!alive) return;
        // Fall back to demo content so the mockup renders meaningfully offline.
        setTasks(DEMO_TASKS);
        setDemo(true);
        setState('ready');
      });
    return () => {
      alive = false;
    };
  }, []);

  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title" data-testid="tasks-title">My Tasks</h1>
          {state === 'ready' && (
            <p className="page__subtitle">
              {tasks.length} task{tasks.length === 1 ? '' : 's'} · {done} done
              {demo && <span className="hint"> · demo data</span>}
            </p>
          )}
        </div>
        <Link to="/tasks/new" className="btn btn--primary" data-testid="add-task-link">
          <span aria-hidden>＋</span> Add Task
        </Link>
      </div>

      {state === 'loading' && (
        <ul className="task-list" data-testid="tasks-loading" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="task-row task-row--skeleton">
              <span className="skeleton skeleton--title" />
              <span className="skeleton skeleton--badge" />
            </li>
          ))}
        </ul>
      )}

      {state === 'error' && (
        <div className="notice notice--error" data-testid="tasks-error" role="alert">
          <p>We couldn’t load your tasks. Please try again.</p>
        </div>
      )}

      {state === 'ready' && tasks.length === 0 && (
        <div className="empty" data-testid="tasks-empty">
          <div className="empty__art" aria-hidden>✓</div>
          <h2>No tasks yet</h2>
          <p>Create your first task to get started.</p>
          <Link to="/tasks/new" className="btn btn--primary">Add your first task</Link>
        </div>
      )}

      {state === 'ready' && tasks.length > 0 && (
        <ul className="task-list" data-testid="tasks-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-row" data-testid="task-row">
              <span className="task-row__title">{task.title}</span>
              <StatusBadge status={task.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
