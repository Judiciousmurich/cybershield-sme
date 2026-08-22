import { rateLimit } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Try again later.',
  },
});
