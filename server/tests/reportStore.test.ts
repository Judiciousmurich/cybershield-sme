import { decryptAes256Gcm } from '../src/crypto/aes.js';
import { insertReport } from '../src/db/reports.js';
import { persistReport } from '../src/reports/store.js';

jest.mock('../src/db/reports.js', () => ({
  insertReport: jest.fn().mockResolvedValue({}),
}));

test('stores an encrypted report in PostgreSQL instead of the local filesystem', async () => {
  const assessmentId = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
  const pdf = Buffer.from('%PDF-1.4 test report');

  const stored = await persistReport(assessmentId, pdf);

  expect(insertReport).toHaveBeenCalledWith(assessmentId, stored);
  expect(stored.startsWith('aes256gcm:')).toBe(true);
  const encrypted = Buffer.from(stored.slice('aes256gcm:'.length), 'base64');
  expect(encrypted.equals(pdf)).toBe(false);
  expect(decryptAes256Gcm(encrypted).equals(pdf)).toBe(true);
});
