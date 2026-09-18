import { encryptAes256Gcm } from '../crypto/aes.js';
import { insertReport } from '../db/reports.js';

export async function persistReport(
  assessmentId: string,
  pdf: Buffer,
): Promise<string> {
  const encrypted = encryptAes256Gcm(pdf);
  const storedValue = `aes256gcm:${encrypted.toString('base64')}`;
  await insertReport(assessmentId, storedValue);
  return storedValue;
}
