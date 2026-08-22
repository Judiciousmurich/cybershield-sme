import fs from 'node:fs/promises';
import path from 'node:path';
import { encryptAes256Gcm } from '../crypto/aes.js';
import { insertReport } from '../db/reports.js';

export async function persistReportFile(
  assessmentId: string,
  pdf: Buffer,
): Promise<string> {
  const directory = path.resolve(process.cwd(), 'storage', 'reports');
  await fs.mkdir(directory, { recursive: true });
  const fileName = `${assessmentId}-${Date.now()}.pdf.enc`;
  const filePath = path.join(directory, fileName);
  await fs.writeFile(filePath, encryptAes256Gcm(pdf));
  await insertReport(assessmentId, filePath);
  return filePath;
}
