import cors from 'cors';
import express from 'express';
import { pool } from './db/pool.js';
import { assessmentsRouter } from './routes/assessments.js';
import { authRouter } from './routes/auth.js';
import { questionsRouter } from './routes/questions.js';

export function createApp() {
  const app = express();

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

  app.use('/api/auth', authRouter);
  app.use('/api/questions', questionsRouter);
  app.use('/api/assessments', assessmentsRouter);

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error.' });
    },
  );

  return app;
}
