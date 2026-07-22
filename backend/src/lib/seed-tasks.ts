import { prisma } from './prisma';

// Seed-on-empty: the spec requires /tasks is never blank. Because there is no PVC the DB
// can reset on restart, so we re-seed only when the table is empty (idempotent). Two 'todo'
// + one 'done' exercise both status badges. Ordered so ascending-id listing matches the
// approved mockup (Review, Draft = todo; Set up = done).
const SEED_TASKS: Array<{ title: string; status: string }> = [
  { title: 'Review the project brief', status: 'todo' },
  { title: 'Draft the launch checklist', status: 'todo' },
  { title: 'Set up the repository', status: 'done' },
];

export async function seedTasks(): Promise<void> {
  const count = await prisma.task.count();
  if (count > 0) return;
  await prisma.task.createMany({ data: SEED_TASKS });
  // eslint-disable-next-line no-console
  console.log(`Seeded ${SEED_TASKS.length} example tasks`);
}
