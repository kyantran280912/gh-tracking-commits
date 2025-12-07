import pg from 'pg';
import type {
  DbCommit,
  DbRepository,
  User,
  DashboardStats,
} from '@repo/shared';

export interface DatabaseConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Enhanced PostgreSQL Database Service
 * Handles all database operations for the dashboard
 */
export class DatabaseService {
  private pool: pg.Pool;
  private initialized = false;

  constructor(config: DatabaseConfig) {
    this.pool = new pg.Pool({
      connectionString: config.connectionString,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.initialized = true;
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.initialized = false;
  }

  // ============================================
  // REPOSITORY OPERATIONS
  // ============================================

  async getRepositories(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ repositories: DbRepository[]; total: number }> {
    await this.initialize();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM repositories';
    let countQuery = 'SELECT COUNT(*) FROM repositories';
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.search) {
      const searchCondition = ` WHERE repo_string ILIKE $${paramIndex}`;
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2)),
    ]);

    return {
      repositories: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async getRepositoryById(id: number): Promise<DbRepository | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT * FROM repositories WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async getRepositoryByString(repoString: string): Promise<DbRepository | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT * FROM repositories WHERE repo_string = $1',
      [repoString]
    );

    return result.rows[0] || null;
  }

  async createRepository(data: {
    repoString: string;
    owner: string;
    repo: string;
    branch: string | null;
    notificationInterval?: number;
  }): Promise<DbRepository> {
    await this.initialize();

    const interval = data.notificationInterval || 3;
    const result = await this.pool.query(
      `INSERT INTO repositories (repo_string, owner, repo, branch, notification_interval, next_check_time)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($5 * INTERVAL '1 hour'))
       RETURNING *`,
      [data.repoString, data.owner, data.repo, data.branch, interval]
    );

    return result.rows[0];
  }

  async updateRepository(
    id: number,
    data: { branch?: string; notification_interval?: number }
  ): Promise<DbRepository | null> {
    await this.initialize();

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
        `next_check_time = COALESCE(last_check_time, NOW()) + ($${paramIndex++} * INTERVAL '1 hour')`
      );
      params.push(data.notification_interval);
    }

    if (updates.length === 0) {
      return this.getRepositoryById(id);
    }

    params.push(id);
    const result = await this.pool.query(
      `UPDATE repositories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  async deleteRepository(id: number): Promise<boolean> {
    await this.initialize();

    const result = await this.pool.query(
      'DELETE FROM repositories WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================
  // SCHEDULER OPERATIONS
  // ============================================

  /**
   * Get repositories that are due for notification check
   * Uses index on next_check_time for efficient query
   */
  async getRepositoriesDueForNotification(): Promise<DbRepository[]> {
    await this.initialize();

    const result = await this.pool.query(
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
    await this.initialize();

    await this.pool.query(
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
   * Returns true if lock acquired, false if another instance holds the lock
   */
  async acquireSchedulerLock(): Promise<boolean> {
    await this.initialize();

    const result = await this.pool.query(
      "SELECT pg_try_advisory_lock(hashtext('notification_scheduler'))"
    );

    return result.rows[0].pg_try_advisory_lock;
  }

  /**
   * Release distributed lock for scheduler
   */
  async releaseSchedulerLock(): Promise<void> {
    await this.initialize();

    await this.pool.query(
      "SELECT pg_advisory_unlock(hashtext('notification_scheduler'))"
    );
  }

  // ============================================
  // COMMIT OPERATIONS
  // ============================================

  async getCommits(options?: {
    page?: number;
    limit?: number;
    repositoryId?: number;
    authorEmail?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ commits: DbCommit[]; total: number }> {
    await this.initialize();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM commits';
    let countQuery = 'SELECT COUNT(*) FROM commits';
    const params: any[] = [];
    const conditions: string[] = [];
    let paramIndex = 1;

    if (options?.repositoryId) {
      conditions.push(`repository_id = $${paramIndex++}`);
      params.push(options.repositoryId);
    }

    if (options?.authorEmail) {
      conditions.push(`author_email = $${paramIndex++}`);
      params.push(options.authorEmail);
    }

    if (options?.search) {
      conditions.push(`message ILIKE $${paramIndex++}`);
      params.push(`%${options.search}%`);
    }

    if (options?.startDate) {
      conditions.push(`commit_date >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push(`commit_date <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY commit_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    const queryParams = [...params, limit, offset];

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(query, queryParams),
      this.pool.query(countQuery, params),
    ]);

    return {
      commits: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async getCommitBySha(sha: string): Promise<DbCommit | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT * FROM commits WHERE sha = $1',
      [sha]
    );

    return result.rows[0] || null;
  }

  // ============================================
  // STATISTICS OPERATIONS
  // ============================================

  async getDashboardStats(): Promise<DashboardStats> {
    await this.initialize();

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
      this.pool.query('SELECT COUNT(*) FROM repositories'),
      this.pool.query('SELECT COUNT(*) FROM commits'),
      this.pool.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        oneDayAgo,
      ]),
      this.pool.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        sevenDaysAgo,
      ]),
      this.pool.query('SELECT COUNT(*) FROM commits WHERE commit_date >= $1', [
        thirtyDaysAgo,
      ]),
      this.pool.query(
        `SELECT author_email, author_name, COUNT(*) as commit_count
         FROM commits
         GROUP BY author_email, author_name
         ORDER BY commit_count DESC
         LIMIT 10`
      ),
      this.pool.query(
        `SELECT c.repository_id, r.repo_string, COUNT(*) as commit_count
         FROM commits c
         JOIN repositories r ON c.repository_id = r.id
         GROUP BY c.repository_id, r.repo_string
         ORDER BY commit_count DESC
         LIMIT 10`
      ),
      this.pool.query(
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

  // ============================================
  // USER OPERATIONS (AUTH)
  // ============================================

  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT id, email, username, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT id, email, username, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async getUserWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    await this.initialize();

    const result = await this.pool.query(
      'SELECT id, email, username, role, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  async createUser(data: {
    email: string;
    username: string;
    passwordHash: string;
    role: string;
  }): Promise<User> {
    await this.initialize();

    const result = await this.pool.query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, role, created_at, updated_at`,
      [data.email, data.username, data.passwordHash, data.role]
    );

    return result.rows[0];
  }

  async updateUser(
    id: number,
    data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      role?: string;
    }
  ): Promise<User | null> {
    await this.initialize();

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(data.email);
    }
    if (data.username) {
      updates.push(`username = $${paramIndex++}`);
      params.push(data.username);
    }
    if (data.passwordHash) {
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(data.passwordHash);
    }
    if (data.role) {
      updates.push(`role = $${paramIndex++}`);
      params.push(data.role);
    }

    if (updates.length === 0) {
      return this.getUserById(id);
    }

    params.push(id);
    const result = await this.pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, username, role, created_at, updated_at`,
      params
    );

    return result.rows[0] || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    await this.initialize();

    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [
      id,
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUsers(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    await this.initialize();

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(
        'SELECT id, email, username, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      this.pool.query('SELECT COUNT(*) FROM users'),
    ]);

    return {
      users: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.initialize();

    await this.pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // ============================================
  // SESSION OPERATIONS
  // ============================================

  async createSession(data: {
    userId: number;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.initialize();

    await this.pool.query(
      `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.userId, data.token, data.expiresAt, data.ipAddress, data.userAgent]
    );
  }

  async getSession(token: string): Promise<any | null> {
    await this.initialize();

    const result = await this.pool.query(
      `SELECT s.*, u.email, u.username, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    return result.rows[0] || null;
  }

  async deleteSession(token: string): Promise<void> {
    await this.initialize();

    await this.pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.initialize();

    await this.pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  }

  // ============================================
  // AUDIT LOG OPERATIONS
  // ============================================

  async createAuditLog(data: {
    userId: number | null;
    action: string;
    resourceType?: string;
    resourceId?: number;
    details?: any;
    ipAddress?: string;
  }): Promise<void> {
    await this.initialize();

    await this.pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.userId,
        data.action,
        data.resourceType,
        data.resourceId,
        JSON.stringify(data.details),
        data.ipAddress,
      ]
    );
  }
}
