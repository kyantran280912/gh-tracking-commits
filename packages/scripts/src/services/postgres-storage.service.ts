import pg from 'pg';
import { getConfig } from '../config/env.js';

interface CommitData {
  sha: string;
  repoString: string;
  authorName: string;
  authorEmail: string;
  message: string;
  commitDate: string;
  htmlUrl: string;
}

/**
 * PostgreSQL Storage Service for CLI
 * Handles commit tracking using PostgreSQL database
 */
export class PostgresStorageService {
  private pool: pg.Pool;
  private initialized = false;

  constructor() {
    const config = getConfig();
    if (!config.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }

    this.pool = new pg.Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connection
      const client = await this.pool.connect();

      // Ensure commits table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS cli_commits (
          sha VARCHAR(40) PRIMARY KEY,
          repo_string VARCHAR(255) NOT NULL,
          author_name VARCHAR(255),
          author_email VARCHAR(255),
          message TEXT,
          commit_date TIMESTAMP,
          html_url VARCHAR(500),
          notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_cli_commits_repo ON cli_commits(repo_string);
        CREATE INDEX IF NOT EXISTS idx_cli_commits_date ON cli_commits(commit_date);
      `);

      // Ensure metadata table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS cli_metadata (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      client.release();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PostgreSQL storage:', error);
      throw error;
    }
  }

  async isCommitNotified(sha: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT 1 FROM cli_commits WHERE sha = $1 LIMIT 1',
        [sha]
      );
      return result.rowCount! > 0;
    } catch (error) {
      console.error(`Error checking if commit ${sha} is notified:`, error);
      return false;
    }
  }

  async markMultipleCommitsAsNotified(commits: CommitData[]): Promise<void> {
    if (commits.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const commit of commits) {
        await client.query(
          `INSERT INTO cli_commits
           (sha, repo_string, author_name, author_email, message, commit_date, html_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sha) DO NOTHING`,
          [
            commit.sha,
            commit.repoString,
            commit.authorName,
            commit.authorEmail,
            commit.message,
            commit.commitDate,
            commit.htmlUrl,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error marking commits as notified:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLastCheckTime(): Promise<string> {
    try {
      const result = await this.pool.query(
        "SELECT value FROM cli_metadata WHERE key = 'lastCheckTime' LIMIT 1"
      );

      if (result.rows.length > 0) {
        return result.rows[0].value;
      }

      // Return epoch if no last check time
      return new Date(0).toISOString();
    } catch (error) {
      console.error('Error getting last check time:', error);
      return new Date(0).toISOString();
    }
  }

  async updateLastCheckTime(timestamp: string): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO cli_metadata (key, value, updated_at)
         VALUES ('lastCheckTime', $1, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
         SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [timestamp]
      );
    } catch (error) {
      console.error('Error updating last check time:', error);
      throw error;
    }
  }

  async cleanupOldCommits(daysToKeep: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.pool.query(
        'DELETE FROM cli_commits WHERE notified_at < $1',
        [cutoffDate.toISOString()]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`🗑️  Cleaned up ${result.rowCount} old commit(s) (older than ${daysToKeep} days)`);
      }
    } catch (error) {
      console.error('Error cleaning up old commits:', error);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
