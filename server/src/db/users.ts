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
      SELECT id, email, password_hash, role, created_at
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
      SELECT id, email, password_hash, role, created_at
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
): Promise<UserRecord> {
  try {
    const result = await pool.query<UserRecord>(
      `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, password_hash, role, created_at
      `,
      [email, passwordHash],
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
