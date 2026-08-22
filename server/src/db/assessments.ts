import { pool } from './pool.js';
import type { AssessmentRecord, ResponseRecord } from '../types.js';

export async function createAssessment(
  userId: string,
): Promise<AssessmentRecord> {
  const result = await pool.query<AssessmentRecord>(
    `
      INSERT INTO assessments (user_id, status)
      VALUES ($1, 'in_progress')
      RETURNING id, user_id, status, started_at, completed_at
    `,
    [userId],
  );
  return result.rows[0];
}

export async function getAssessmentForUser(
  id: string,
  userId: string,
): Promise<AssessmentRecord | null> {
  const result = await pool.query<AssessmentRecord>(
    `
      SELECT id, user_id, status, started_at, completed_at
      FROM assessments
      WHERE id = $1 AND user_id = $2
    `,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

export async function getCurrentAssessment(
  userId: string,
): Promise<AssessmentRecord | null> {
  const result = await pool.query<AssessmentRecord>(
    `
      SELECT id, user_id, status, started_at, completed_at
      FROM assessments
      WHERE user_id = $1 AND status = 'in_progress'
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function listResponses(
  assessmentId: string,
): Promise<ResponseRecord[]> {
  const result = await pool.query<ResponseRecord>(
    `
      SELECT id, assessment_id, question_id, answer_value, answered_at
      FROM responses
      WHERE assessment_id = $1
      ORDER BY answered_at
    `,
    [assessmentId],
  );
  return result.rows;
}

export async function upsertResponse(
  assessmentId: string,
  questionId: string,
  answerValue: string,
): Promise<ResponseRecord> {
  const result = await pool.query<ResponseRecord>(
    `
      INSERT INTO responses (assessment_id, question_id, answer_value, answered_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (assessment_id, question_id)
      DO UPDATE SET
        answer_value = EXCLUDED.answer_value,
        answered_at = now()
      RETURNING id, assessment_id, question_id, answer_value, answered_at
    `,
    [assessmentId, questionId, answerValue],
  );
  return result.rows[0];
}

export async function countResponses(assessmentId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM responses WHERE assessment_id = $1',
    [assessmentId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function completeAssessment(
  id: string,
  userId: string,
): Promise<AssessmentRecord | null> {
  const result = await pool.query<AssessmentRecord>(
    `
      UPDATE assessments
      SET status = 'completed', completed_at = now()
      WHERE id = $1 AND user_id = $2 AND status = 'in_progress'
      RETURNING id, user_id, status, started_at, completed_at
    `,
    [id, userId],
  );
  return result.rows[0] ?? null;
}
