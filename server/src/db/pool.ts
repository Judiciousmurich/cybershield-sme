import { Pool } from 'pg';
import { requireDatabaseUrl } from './env.js';

export const pool = new Pool({
  connectionString: requireDatabaseUrl(),
});
