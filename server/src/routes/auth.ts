import { Router } from 'express';
import {
  InvalidCredentialsError,
  loginUser,
  registerUser,
  toPublicUser,
} from '../auth/service.js';
import { DuplicateEmailError, findUserById } from '../db/users.js';
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
