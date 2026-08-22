import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createUser, findUserByEmail, findUserById } from '../src/db/users.js';
import type { UserRecord } from '../src/types.js';

jest.mock('../src/db/users.js', () => ({
  DuplicateEmailError: class DuplicateEmailError extends Error {
    constructor() {
      super('Email already registered');
      this.name = 'DuplicateEmailError';
    }
  },
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
}));

jest.mock('../src/db/pool.js', () => ({
  pool: { query: jest.fn() },
}));

const mockedFindByEmail = findUserByEmail as jest.MockedFunction<
  typeof findUserByEmail
>;
const mockedFindById = findUserById as jest.MockedFunction<typeof findUserById>;
const mockedCreateUser = createUser as jest.MockedFunction<typeof createUser>;

function fakeUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    email: 'owner@sme.example',
    password_hash: 'hashed',
    role: 'user',
    created_at: new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  };
}

describe('Auth API', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers a new user and never returns the password hash', async () => {
    mockedFindByEmail.mockResolvedValue(null);
    mockedCreateUser.mockResolvedValue(
      fakeUser({ password_hash: 'should-not-leak' }),
    );

    const response = await request(app).post('/api/auth/register').send({
      email: 'Owner@SME.example',
      password: 'SecurePass1',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('owner@sme.example');
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(mockedCreateUser).toHaveBeenCalledTimes(1);
    const storedHash = mockedCreateUser.mock.calls[0][1];
    expect(storedHash).not.toBe('SecurePass1');
    expect(await bcrypt.compare('SecurePass1', storedHash)).toBe(true);
  });

  test('rejects a duplicate email with 409', async () => {
    mockedFindByEmail.mockResolvedValue(fakeUser());

    const response = await request(app).post('/api/auth/register').send({
      email: 'owner@sme.example',
      password: 'SecurePass1',
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already registered/i);
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  test('logs in with valid credentials and returns a JWT', async () => {
    const passwordHash = await bcrypt.hash('SecurePass1', 10);
    mockedFindByEmail.mockResolvedValue(fakeUser({ password_hash: passwordHash }));

    const response = await request(app).post('/api/auth/login').send({
      email: 'owner@sme.example',
      password: 'SecurePass1',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.expiresIn).toBe('1h');
    expect(response.body.user.email).toBe('owner@sme.example');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  test('rejects a wrong password with 401', async () => {
    const passwordHash = await bcrypt.hash('SecurePass1', 10);
    mockedFindByEmail.mockResolvedValue(fakeUser({ password_hash: passwordHash }));

    const response = await request(app).post('/api/auth/login').send({
      email: 'owner@sme.example',
      password: 'WrongPass1',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid email or password/i);
    expect(response.body.token).toBeUndefined();
  });

  test('requireAuth rejects an unauthenticated request', async () => {
    mockedFindById.mockResolvedValue(fakeUser());

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/authentication required/i);
  });
});
