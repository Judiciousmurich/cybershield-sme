import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to do that.' });
      return;
    }
    next();
  };
}
