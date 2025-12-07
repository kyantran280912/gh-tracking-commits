import pg from 'pg';

export interface Migration {
  id: string;
  name: string;
  sql: string;
}

// Inline SQL to avoid file read issues on serverless platforms (Vercel)
const AUTH_TABLES_SQL = `
-- Migration: Add authentication tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_users_updated_at') THEN
    CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
  END IF;
END
$$;

-- Insert default admin user (password: Admin@12345)
INSERT INTO users (email, username, password_hash, role)
VALUES (
  'admin@example.com',
  'admin',
  '$2b$10$4xH8LhFE7IqJqO5rX3Y8gOQFZLqW5Y3hGxHJQN8uZ9LKMvZxW5Y3O',
  'admin'
) ON CONFLICT (email) DO NOTHING;
`;

const NOTIFICATION_INTERVAL_SQL = `
-- Migration: Add per-repository notification interval support

-- Add notification_interval column with CHECK constraint
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS notification_interval INTEGER DEFAULT 3
CONSTRAINT valid_notification_interval
CHECK (notification_interval IN (1, 2, 3, 6, 12, 24));

-- Add next_check_time column for efficient query (index-friendly)
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS next_check_time TIMESTAMP WITH TIME ZONE;

-- Initialize next_check_time for existing repos
UPDATE repositories
SET next_check_time = COALESCE(last_check_time, NOW()) + (notification_interval * INTERVAL '1 hour')
WHERE next_check_time IS NULL;

-- Create partial index for efficient due notification query
CREATE INDEX IF NOT EXISTS idx_repos_next_check_time
ON repositories(next_check_time)
WHERE next_check_time IS NOT NULL;
`;

export const migrations: Migration[] = [
  {
    id: '001',
    name: 'auth_tables',
    sql: AUTH_TABLES_SQL,
  },
  {
    id: '003',
    name: 'notification_interval',
    sql: NOTIFICATION_INTERVAL_SQL,
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
