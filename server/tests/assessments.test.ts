import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAuthToken } from '../src/auth/tokens.js';
import { getAssessmentForUser, upsertResponse } from '../src/db/assessments.js';
import { findQuestionById } from '../src/db/questions.js';
import type { AssessmentRecord, QuestionRecord, UserRecord } from '../src/types.js';

jest.mock('../src/db/assessments.js', () => ({
  createAssessment: jest.fn(),
  getAssessmentForUser: jest.fn(),
  getCurrentAssessment: jest.fn(),
  listResponses: jest.fn(),
  upsertResponse: jest.fn(),
  countResponses: jest.fn(),
  completeAssessment: jest.fn(),
}));

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

const mockedGetAssessment = getAssessmentForUser as jest.MockedFunction<
  typeof getAssessmentForUser
>;
const mockedFindQuestion = findQuestionById as jest.MockedFunction<
  typeof findQuestionById
>;
const mockedUpsert = upsertResponse as jest.MockedFunction<typeof upsertResponse>;

const user: UserRecord = {
  id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  email: 'owner@sme.example',
  password_hash: 'hashed',
  role: 'user',
  created_at: new Date('2026-01-15T10:00:00.000Z'),
  business_context: null,
};

const assessment: AssessmentRecord = {
  id: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
  user_id: user.id,
  status: 'in_progress',
  started_at: new Date('2026-01-15T10:00:00.000Z'),
  completed_at: null,
};

const question: QuestionRecord = {
  id: '11111111-1111-4111-8111-111111111101',
  domain: 'access_control',
  text: 'Does each staff member have their own login?',
  weight: 2,
  answer_type: 'yes_no',
  options: { choices: ['yes', 'no'] },
  active: true,
};

describe('Assessment responses', () => {
  const app = createApp();
  const token = signAuthToken(user);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAssessment.mockResolvedValue(assessment);
    mockedFindQuestion.mockResolvedValue(question);
  });

  test('rejects an answer that does not match the question options', async () => {
    const response = await request(app)
      .post(`/api/assessments/${assessment.id}/responses`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question_id: question.id, answer_value: 'sometimes' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/must be one of: yes, no/i);
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  test('saves a valid answer', async () => {
    mockedUpsert.mockResolvedValue({
      id: 'cccccccc-dddd-4eee-8fff-000000000000',
      assessment_id: assessment.id,
      question_id: question.id,
      answer_value: 'yes',
      answered_at: new Date(),
    });

    const response = await request(app)
      .post(`/api/assessments/${assessment.id}/responses`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question_id: question.id, answer_value: 'yes' });

    expect(response.status).toBe(200);
    expect(response.body.response.answer_value).toBe('yes');
  });
});
