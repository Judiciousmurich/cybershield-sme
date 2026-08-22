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

export async function listAllQuestions(): Promise<QuestionRecord[]> {
  const result = await pool.query<QuestionRecord>(
    `
      SELECT id, domain, text, weight, answer_type, options, active
      FROM questions
      ORDER BY domain, id
    `,
  );
  return result.rows.map(mapQuestion);
}

export async function createQuestion(input: {
  domain: QuestionRecord['domain'];
  text: string;
  weight: number;
  answer_type: QuestionRecord['answer_type'];
  options?: Record<string, unknown> | null;
  active?: boolean;
}): Promise<QuestionRecord> {
  const result = await pool.query<QuestionRecord>(
    `
      INSERT INTO questions (domain, text, weight, answer_type, options, active)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING id, domain, text, weight, answer_type, options, active
    `,
    [
      input.domain,
      input.text,
      input.weight,
      input.answer_type,
      JSON.stringify(input.options ?? null),
      input.active ?? true,
    ],
  );
  return mapQuestion(result.rows[0]);
}

export async function updateQuestion(
  id: string,
  input: Partial<{
    domain: QuestionRecord['domain'];
    text: string;
    weight: number;
    answer_type: QuestionRecord['answer_type'];
    options: Record<string, unknown> | null;
    active: boolean;
  }>,
): Promise<QuestionRecord | null> {
  const existing = await findQuestionById(id);
  if (!existing) {
    return null;
  }

  const next = {
    domain: input.domain ?? existing.domain,
    text: input.text ?? existing.text,
    weight: input.weight ?? existing.weight,
    answer_type: input.answer_type ?? existing.answer_type,
    options: input.options === undefined ? existing.options : input.options,
    active: input.active ?? existing.active,
  };

  const result = await pool.query<QuestionRecord>(
    `
      UPDATE questions
      SET domain = $2, text = $3, weight = $4, answer_type = $5, options = $6::jsonb, active = $7
      WHERE id = $1
      RETURNING id, domain, text, weight, answer_type, options, active
    `,
    [
      id,
      next.domain,
      next.text,
      next.weight,
      next.answer_type,
      JSON.stringify(next.options),
      next.active,
    ],
  );
  return result.rows[0] ? mapQuestion(result.rows[0]) : null;
}

export async function countActiveQuestions(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM questions WHERE active = true',
  );
  return Number(result.rows[0]?.count ?? 0);
}
