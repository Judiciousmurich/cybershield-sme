import jwt from 'jsonwebtoken';
import type { AuthTokenPayload, UserRecord } from '../types.js';

const MIN_SECRET_LENGTH = 16;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }
  return secret;
}

export function getJwtExpiry(): string {
  return process.env.JWT_EXPIRY || '1h';
}

export function signAuthToken(user: UserRecord): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiry() as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded)) {
    throw new Error('Invalid token payload');
  }

  const payload = decoded as jwt.JwtPayload;
  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    (payload.role !== 'user' && payload.role !== 'admin')
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
