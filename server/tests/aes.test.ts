import { decryptAes256Gcm, encryptAes256Gcm } from '../src/crypto/aes.js';

describe('AES-256-GCM report encryption', () => {
  const key = Buffer.from(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex',
  );

  test('round-trips plaintext and uses a 32-byte key', () => {
    const plain = Buffer.from('%PDF-1.4 demo report');
    const encrypted = encryptAes256Gcm(plain, key);
    expect(encrypted.equals(plain)).toBe(false);
    expect(decryptAes256Gcm(encrypted, key).equals(plain)).toBe(true);
  });
});
