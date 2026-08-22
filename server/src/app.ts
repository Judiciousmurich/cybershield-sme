import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pool } from './db/pool.js';
import { adminQuestionsRouter } from './routes/adminQuestions.js';
import { assessmentsRouter } from './routes/assessments.js';
import { authRouter } from './routes/auth.js';
import { questionsRouter } from './routes/questions.js';

const isTest = process.env.NODE_ENV === 'test';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: isTest ? 1000 : 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

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
  app.use('/api/admin/questions', adminQuestionsRouter);

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
