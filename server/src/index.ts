import { createApp } from './app.js';
import { migrate } from './db/migrate.js';
import { pool } from './db/pool.js';
import { seedQuestions } from './db/seed.js';
import './db/env.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

async function start(): Promise<void> {
  await migrate();
  const existingQuestions = await pool.query('SELECT 1 FROM questions LIMIT 1');
  if (existingQuestions.rowCount === 0) {
    await seedQuestions();
  }
  app.listen(port, '0.0.0.0', () => {
    console.log(`CyberShield server listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
