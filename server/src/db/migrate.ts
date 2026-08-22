import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool.js';

const migrationsDir = path.resolve(process.cwd(), 'migrations');

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE id = $1',
      [file],
    );

    if ((alreadyApplied.rowCount ?? 0) > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      console.log(`Applied migration ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function runCli(): Promise<void> {
  try {
    await migrate();
    console.log('Migrations are up to date.');
  } finally {
    await pool.end();
  }
}

const isDirectRun = /migrate\.(ts|js)$/.test(process.argv[1] ?? '');

if (isDirectRun) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
