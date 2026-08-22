import { createApp } from './app.js';
import { migrate } from './db/migrate.js';
import './db/env.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

async function start(): Promise<void> {
  await migrate();
  app.listen(port, '0.0.0.0', () => {
    console.log(`CyberShield server listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
