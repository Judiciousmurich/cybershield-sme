import { Router } from 'express';
import {
  InvalidCredentialsError,
  loginUser,
  registerUser,
  toPublicUser,
} from '../auth/service.js';
import {
  DuplicateEmailError,
  findUserById,
  updateBusinessContext,
} from '../db/users.js';
import { authRateLimit } from '../middleware/authRateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { normalizeEmail } from '../validation/auth.js';
import {
  authBodySchema,
  businessContextSchema,
  parseBody,
} from '../validation/http.js';

export const authRouter = Router();

authRouter.use(authRateLimit);

authRouter.post('/register', async (req, res, next) => {
  const parsed = parseBody(authBodySchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const user = await registerUser(
      normalizeEmail(parsed.data.email),
      parsed.data.password,
    );
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  const parsed = parseBody(authBodySchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const result = await loginUser(
      normalizeEmail(parsed.data.email),
      parsed.data.password,
    );
    res.json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  const parsed = parseBody(businessContextSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const raw = parsed.data.business_context;
    const context = typeof raw === 'string' ? raw.trim() || null : null;
    const user = await updateBusinessContext(req.user!.id, context);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});
