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
import {
  isValidationFailure,
  validateAuthInput,
} from '../validation/auth.js';

export const authRouter = Router();

authRouter.use(authRateLimit);

authRouter.post('/register', async (req, res, next) => {
  const input = validateAuthInput(req.body);
  if (isValidationFailure(input)) {
    res.status(input.status).json({ error: input.error });
    return;
  }

  try {
    const user = await registerUser(input.email, input.password);
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
  const input = validateAuthInput(req.body);
  if (isValidationFailure(input)) {
    res.status(input.status).json({ error: input.error });
    return;
  }

  try {
    const result = await loginUser(input.email, input.password);
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
  try {
    const raw = (req.body as { business_context?: unknown }).business_context;
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      res.status(400).json({ error: 'business_context must be a string.' });
      return;
    }

    const context =
      typeof raw === 'string' ? raw.trim().slice(0, 500) || null : null;
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
