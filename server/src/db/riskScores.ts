import { pool } from './pool.js';
import type { QuestionDomain } from '../types.js';

export type StoredRiskScore = {
  assessment_id: string;
  domain: QuestionDomain;
  score: number;
  max_score: number;
  calculated_at: Date;
};

export async function replaceRiskScores(
  assessmentId: string,
  scores: { domain: QuestionDomain; score: number; max_score: number }[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM risk_scores WHERE assessment_id = $1', [
      assessmentId,
    ]);
    for (const row of scores) {
      await client.query(
        `
          INSERT INTO risk_scores (assessment_id, domain, score, max_score, calculated_at)
          VALUES ($1, $2, $3, $4, now())
        `,
        [assessmentId, row.domain, row.score, row.max_score],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
