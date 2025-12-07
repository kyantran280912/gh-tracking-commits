import type { DashboardStats } from '@repo/shared';
import { BaseRepository } from './base.repository';

/**
 * StatsRepository - Handles dashboard statistics operations
 */
export class StatsRepository extends BaseRepository {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRepos,
      totalCommits,
      commitsLast24h,
      commitsLast7d,
      commitsLast30d,
      topAuthors,
      commitsByRepo,
      commitsByDay,
    ] = await Promise.all([
      this.query('SELECT COUNT(*) FROM repositories'),
      this.query('SELECT COUNT(*) FROM commits'),
      this.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        oneDayAgo,
      ]),
      this.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        sevenDaysAgo,
      ]),
      this.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        thirtyDaysAgo,
      ]),
      this.query(
        `SELECT author_email, author_name, COUNT(*) as commit_count
         FROM commits
         GROUP BY author_email, author_name
         ORDER BY commit_count DESC
         LIMIT 10`
      ),
      this.query(
        `SELECT c.repository_id, r.repo_string, COUNT(*) as commit_count
         FROM commits c
         JOIN repositories r ON c.repository_id = r.id
         GROUP BY c.repository_id, r.repo_string
         ORDER BY commit_count DESC
         LIMIT 10`
      ),
      this.query(
        `SELECT DATE(commit_date) as date, COUNT(*) as count
         FROM commits
         WHERE commit_date >= $1
         GROUP BY DATE(commit_date)
         ORDER BY date DESC
         LIMIT 30`,
        [thirtyDaysAgo]
      ),
    ]);

    return {
      totalRepos: parseInt(totalRepos.rows[0].count),
      totalCommits: parseInt(totalCommits.rows[0].count),
      commitsLast24h: parseInt(commitsLast24h.rows[0].count),
      commitsLast7d: parseInt(commitsLast7d.rows[0].count),
      commitsLast30d: parseInt(commitsLast30d.rows[0].count),
      topAuthors: topAuthors.rows,
      commitsByRepo: commitsByRepo.rows,
      commitsByDay: commitsByDay.rows.map((row) => ({
        date: row.date.toISOString().split('T')[0],
        count: parseInt(row.count),
      })),
    };
  }
}
