import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export function getReportEncryptionKey(): Buffer {
  const value = process.env.REPORT_ENCRYPTION_KEY;
  const key = value && (/^[0-9a-fA-F]{64}$/.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64'));
  if (!key || key.length !== KEY_LENGTH) {
    throw new Error(
      'REPORT_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or base64.',
    );
  }
  return key;
}

export function encryptAes256Gcm(plain: Buffer, key = getReportEncryptionKey()): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error('AES-256 key must be 32 bytes.');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptAes256Gcm(
  payload: Buffer,
  key = getReportEncryptionKey(),
): Buffer {
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = payload.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
