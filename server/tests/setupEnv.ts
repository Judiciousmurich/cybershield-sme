process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/cybershield_test';
process.env.JWT_SECRET = 'unit-test-jwt-secret-not-for-production';
process.env.JWT_EXPIRY = '1h';
process.env.REPORT_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
