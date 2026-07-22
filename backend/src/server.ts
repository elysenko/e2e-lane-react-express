import { app } from './app';
import { seedTasks } from './lib/seed-tasks';

const port = Number(process.env.PORT || 3000);

// Seed example tasks on startup (idempotent, only when the table is empty) so /tasks is
// never blank — even after an ephemeral restart. Never block boot if seeding fails.
seedTasks()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Task seed failed (continuing):', err);
  })
  .finally(() => {
    app.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on :${port}`);
    });
  });
