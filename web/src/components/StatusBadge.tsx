import type { TaskStatus } from '../lib/api';

const LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  done: 'Done',
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const label = LABELS[status] ?? status;
  return (
    <span className={`badge badge--${status}`} data-testid={`status-${status}`}>
      <span className="badge__dot" aria-hidden />
      {label}
    </span>
  );
}
