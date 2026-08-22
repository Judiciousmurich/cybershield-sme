import cors from 'cors';
import express from 'express';
import { migrate } from './db/migrate.js';
import { pool } from './db/pool.js';
import './db/env.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'cybershield-server',
      database: 'connected',
      env: process.env.NODE_ENV ?? 'development',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      service: 'cybershield-server',
      database: 'disconnected',
      env: process.env.NODE_ENV ?? 'development',
    });
  }
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'CyberShield API',
    version: '0.1.0',
  });
});

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
