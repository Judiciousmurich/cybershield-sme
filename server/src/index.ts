import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cybershield-server',
    env: process.env.NODE_ENV ?? 'development',
  });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'CyberShield API',
    version: '0.1.0',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`CyberShield server listening on port ${port}`);
});
