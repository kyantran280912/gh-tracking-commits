import type { DbRepository } from '@repo/shared';
import { BaseRepository } from './base.repository';
import { QueryBuilder } from '../utils/query-builder';

export interface RepositoryQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateRepositoryData {
  repoString: string;
  owner: string;
  repo: string;
  branch: string | null;
  notificationInterval?: number;
}

export interface UpdateRepositoryData {
  branch?: string;
  notification_interval?: number;
}

/**
 * RepositoryRepository - Handles all repository CRUD operations
 */
export class RepositoryRepository extends BaseRepository {
  /**
   * Get paginated list of repositories with optional search
   */
  async getAll(options?: RepositoryQueryOptions): Promise<{
    repositories: DbRepository[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const builder = new QueryBuilder();
    if (options?.search) {
      builder.where('repo_string', options.search, 'ILIKE');
    }

    const { whereClause, params, paramCount } = builder.build();

    const query = `SELECT * FROM repositories${whereClause} ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    const countQuery = `SELECT COUNT(*) FROM repositories${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      this.query(query, [...params, limit, offset]),
      this.query(countQuery, params),
    ]);

    return {
      repositories: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Get a single repository by ID
   */
  async getById(id: number): Promise<DbRepository | null> {
    const result = await this.query(
      'SELECT * FROM repositories WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get a single repository by repo string (owner/repo:branch)
   */
  async getByString(repoString: string): Promise<DbRepository | null> {
    const result = await this.query(
      'SELECT * FROM repositories WHERE repo_string = $1',
      [repoString]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new repository
   */
  async create(data: CreateRepositoryData): Promise<DbRepository> {
    const interval = data.notificationInterval || 3;
    const result = await this.query(
      `INSERT INTO repositories (repo_string, owner, repo, branch, notification_interval, next_check_time)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($5::integer * INTERVAL '1 hour'))
       RETURNING *`,
      [data.repoString, data.owner, data.repo, data.branch, interval]
    );
    return result.rows[0];
  }

  /**
   * Update an existing repository
   */
  async update(
    id: number,
    data: UpdateRepositoryData
  ): Promise<DbRepository | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.branch !== undefined) {
      updates.push(`branch = $${paramIndex++}`);
      params.push(data.branch);
    }

    if (data.notification_interval !== undefined) {
      updates.push(`notification_interval = $${paramIndex++}`);
      params.push(data.notification_interval);
      // Recalculate next_check_time based on new interval
      updates.push(
        `next_check_time = COALESCE(last_check_time, NOW()) + ($${paramIndex++}::integer * INTERVAL '1 hour')`
      );
      params.push(data.notification_interval);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    params.push(id);
    const result = await this.query(
      `UPDATE repositories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a repository
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM repositories WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get repositories that are due for notification check
   * Uses index on next_check_time for efficient query
   */
  async getDueForNotification(): Promise<DbRepository[]> {
    const result = await this.query(
      `SELECT * FROM repositories
       WHERE next_check_time <= NOW()
       ORDER BY next_check_time ASC`
    );
    return result.rows;
  }

  /**
   * Update next_check_time after processing a repository
   */
  async updateNextCheckTime(id: number): Promise<void> {
    await this.query(
      `UPDATE repositories
       SET next_check_time = NOW() + (notification_interval * INTERVAL '1 hour'),
           last_check_time = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Acquire distributed lock for scheduler
   * Uses PostgreSQL advisory lock to prevent multiple instances running simultaneously
   */
  async acquireSchedulerLock(): Promise<boolean> {
    const result = await this.query(
      "SELECT pg_try_advisory_lock(hashtext('notification_scheduler'))"
    );
    return result.rows[0].pg_try_advisory_lock;
  }

  /**
   * Release distributed lock for scheduler
   */
  async releaseSchedulerLock(): Promise<void> {
    await this.query(
      "SELECT pg_advisory_unlock(hashtext('notification_scheduler'))"
    );
  }
}
