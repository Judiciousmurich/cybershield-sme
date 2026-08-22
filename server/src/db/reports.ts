import { pool } from './pool.js';

export type ReportRecord = {
  id: string;
  assessment_id: string;
  generated_at: Date;
  file_path_or_blob: string | null;
};

export async function insertReport(
  assessmentId: string,
  filePath: string,
): Promise<ReportRecord> {
  const result = await pool.query<ReportRecord>(
    `
      INSERT INTO reports (assessment_id, generated_at, file_path_or_blob)
      VALUES ($1, now(), $2)
      RETURNING id, assessment_id, generated_at, file_path_or_blob
    `,
    [assessmentId, filePath],
  );
  return result.rows[0];
}
