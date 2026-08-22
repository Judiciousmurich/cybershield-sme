import { pool } from './pool.js';
import type { QuestionRecord } from '../types.js';

function mapQuestion(row: QuestionRecord): QuestionRecord {
  return {
    ...row,
    weight: Number(row.weight),
  };
}

export async function listActiveQuestions(): Promise<QuestionRecord[]> {
  const result = await pool.query<QuestionRecord>(
    `
      SELECT id, domain, text, weight, answer_type, options, active
      FROM questions
      WHERE active = true
      ORDER BY domain, id
    `,
  );
  return result.rows.map(mapQuestion);
}

export async function findQuestionById(
  id: string,
): Promise<QuestionRecord | null> {
  const result = await pool.query<QuestionRecord>(
    `
      SELECT id, domain, text, weight, answer_type, options, active
      FROM questions
      WHERE id = $1
    `,
    [id],
  );
  return result.rows[0] ? mapQuestion(result.rows[0]) : null;
}

export async function countActiveQuestions(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM questions WHERE active = true',
  );
  return Number(result.rows[0]?.count ?? 0);
}
