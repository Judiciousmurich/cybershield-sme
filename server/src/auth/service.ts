import bcrypt from 'bcryptjs';
import {
  createUser,
  DuplicateEmailError,
  findUserByEmail,
} from '../db/users.js';
import type { PublicUser, UserRecord } from '../types.js';
import { getJwtExpiry, signAuthToken } from './tokens.js';

const BCRYPT_ROUNDS = 10;

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function registerUser(
  email: string,
  password: string,
): Promise<PublicUser> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new DuplicateEmailError();
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser(email, passwordHash);
  return toPublicUser(user);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ token: string; expiresIn: string; user: PublicUser }> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new InvalidCredentialsError();
  }

  return {
    token: signAuthToken(user),
    expiresIn: getJwtExpiry(),
    user: toPublicUser(user),
  };
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}
