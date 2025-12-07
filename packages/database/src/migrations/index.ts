import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Migration {
  id: string;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    id: '001',
    name: 'auth_tables',
    sql: readFileSync(join(__dirname, '001_auth_tables.sql'), 'utf-8'),
  },
];

export async function runMigrations(connectionString: string): Promise<void> {
  const pool = new pg.Pool({ connectionString });

  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const result = await pool.query('SELECT id FROM migrations ORDER BY id');
    const appliedMigrations = new Set(result.rows.map((row) => row.id));

    // Run pending migrations
    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.id)) {
        console.log(`Running migration ${migration.id}: ${migration.name}...`);

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO migrations (id, name) VALUES ($1, $2)',
            [migration.id, migration.name]
          );
          await client.query('COMMIT');
          console.log(`✅ Migration ${migration.id} completed`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${migration.id} failed:`, error);
          throw error;
        } finally {
          client.release();
        }
      } else {
        console.log(`⏭️  Migration ${migration.id} already applied`);
      }
    }

    console.log('✅ All migrations completed');
  } finally {
    await pool.end();
  }
}

export async function rollbackLastMigration(
  connectionString: string
): Promise<void> {
  const pool = new pg.Pool({ connectionString });

  try {
    const result = await pool.query(
      'SELECT id, name FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const { id, name } = result.rows[0];
    console.log(`Rolling back migration ${id}: ${name}...`);

    // Note: Rollback is manual - you need to write rollback scripts
    // For now, we just remove from migrations table
    await pool.query('DELETE FROM migrations WHERE id = $1', [id]);
    console.log(`✅ Migration ${id} rolled back from tracking`);
    console.log('⚠️  Note: You need to manually rollback the schema changes');
  } finally {
    await pool.end();
  }
}
