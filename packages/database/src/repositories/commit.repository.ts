import type { DbCommit } from '@repo/shared';
import { BaseRepository } from './base.repository';
import { QueryBuilder } from '../utils/query-builder';

export interface CommitQueryOptions {
  page?: number;
  limit?: number;
  repositoryId?: number;
  authorEmail?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * CommitRepository - Handles all commit operations
 */
export class CommitRepository extends BaseRepository {
  /**
   * Get paginated list of commits with filters
   */
  async getAll(options?: CommitQueryOptions): Promise<{
    commits: DbCommit[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const builder = new QueryBuilder()
      .where('repository_id', options?.repositoryId)
      .where('author_email', options?.authorEmail)
      .where('message', options?.search, 'ILIKE')
      .where('commit_date', options?.startDate, '>=')
      .where('commit_date', options?.endDate, '<=');

    const { whereClause, params, paramCount } = builder.build();

    const query = `SELECT * FROM commits${whereClause} ORDER BY commit_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    const countQuery = `SELECT COUNT(*) FROM commits${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      this.query(query, [...params, limit, offset]),
      this.query(countQuery, params),
    ]);

    return {
      commits: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Get a single commit by SHA
   */
  async getBySha(sha: string): Promise<DbCommit | null> {
    const result = await this.query('SELECT * FROM commits WHERE sha = $1', [
      sha,
    ]);
    return result.rows[0] || null;
  }
}
