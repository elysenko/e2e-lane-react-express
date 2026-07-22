import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <section className="page page--narrow">
      <h1 className="page__title" data-testid="about-title">About Task List</h1>
      <p className="prose">
        Task List is a small, focused app for keeping track of what needs doing. Add a task,
        mark your progress with clear status badges, and keep your list tidy.
      </p>

      <div className="card about-card">
        <h2 className="about-card__heading">How it works</h2>
        <ol className="steps">
          <li><strong>My Tasks</strong> shows every task with a “To do” or “Done” badge.</li>
          <li><strong>Add Task</strong> lets you create a new task with a title.</li>
          <li>New tasks start as <strong>To do</strong> and appear at the top of your list.</li>
        </ol>
      </div>

      <div className="about-cta">
        <Link to="/tasks" className="btn btn--primary">Go to my tasks</Link>
      </div>
    </section>
  );
}
