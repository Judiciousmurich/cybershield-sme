import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAuthToken } from '../src/auth/tokens.js';
import { listAllQuestions } from '../src/db/questions.js';
import type { UserRecord } from '../src/types.js';

jest.mock('../src/db/questions.js', () => ({
  listActiveQuestions: jest.fn(),
  listAllQuestions: jest.fn(),
  findQuestionById: jest.fn(),
  countActiveQuestions: jest.fn(),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
}));

jest.mock('../src/db/pool.js', () => ({
  pool: { query: jest.fn() },
}));

const mockedListAll = listAllQuestions as jest.MockedFunction<
  typeof listAllQuestions
>;

function user(role: UserRecord['role']): UserRecord {
  return {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    email: 'owner@sme.example',
    password_hash: 'hashed',
    role,
    created_at: new Date('2026-01-15T10:00:00.000Z'),
    business_context: null,
  };
}

describe('RBAC for admin question management', () => {
  const app = createApp();

  test('rejects a standard user from admin question routes', async () => {
    const response = await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${signAuthToken(user('user'))}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/permission/i);
  });

  test('allows an admin to list questions', async () => {
    mockedListAll.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${signAuthToken(user('admin'))}`);

    expect(response.status).toBe(200);
    expect(response.body.questions).toEqual([]);
  });
});
