import { pool } from './pool.js';
import type { UserRecord } from '../types.js';

export class DuplicateEmailError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'DuplicateEmailError';
  }
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `
      SELECT id, email, password_hash, role, created_at, business_context
      FROM users
      WHERE email = $1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `
      SELECT id, email, password_hash, role, created_at, business_context
      FROM users
      WHERE id = $1
    `,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  role: 'user' | 'admin' = 'user',
): Promise<UserRecord> {
  try {
    const result = await pool.query<UserRecord>(
      `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, password_hash, role, created_at, business_context
      `,
      [email, passwordHash, role],
    );
    return result.rows[0];
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}

export async function updateBusinessContext(
  userId: string,
  businessContext: string | null,
): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `
      UPDATE users
      SET business_context = $2
      WHERE id = $1
      RETURNING id, email, password_hash, role, created_at, business_context
    `,
    [userId, businessContext],
  );
  return result.rows[0] ?? null;
}
