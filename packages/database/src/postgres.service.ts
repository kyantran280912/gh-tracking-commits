import pg from 'pg';
import type {
  DbCommit,
  DbRepository,
  User,
  DashboardStats,
} from '@repo/shared';

// Import repositories
import {
  RepositoryRepository,
  CommitRepository,
  UserRepository,
  SessionRepository,
  AuditLogRepository,
  StatsRepository,
} from './repositories';

export interface DatabaseConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * DatabaseService - Facade that provides access to all repositories
 * Maintains backwards compatibility with existing API while using new repository pattern internally
 */
export class DatabaseService {
  private pool: pg.Pool;
  private initialized = false;

  // New repository-based access (recommended for new code)
  public readonly repos: RepositoryRepository;
  public readonly commitRepo: CommitRepository;
  public readonly userRepo: UserRepository;
  public readonly sessionRepo: SessionRepository;
  public readonly auditLogRepo: AuditLogRepository;
  public readonly statsRepo: StatsRepository;

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

    // Initialize repositories
    this.repos = new RepositoryRepository(this.pool);
    this.commitRepo = new CommitRepository(this.pool);
    this.userRepo = new UserRepository(this.pool);
    this.sessionRepo = new SessionRepository(this.pool);
    this.auditLogRepo = new AuditLogRepository(this.pool);
    this.statsRepo = new StatsRepository(this.pool);
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
  // BACKWARDS COMPATIBLE API - Repository Operations
  // These methods delegate to the new RepositoryRepository
  // ============================================

  async getRepositories(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ repositories: DbRepository[]; total: number }> {
    return this.repos.getAll(options);
  }

  async getRepositoryById(id: number): Promise<DbRepository | null> {
    return this.repos.getById(id);
  }

  async getRepositoryByString(repoString: string): Promise<DbRepository | null> {
    return this.repos.getByString(repoString);
  }

  async createRepository(data: {
    repoString: string;
    owner: string;
    repo: string;
    branch: string | null;
    notificationInterval?: number;
  }): Promise<DbRepository> {
    return this.repos.create(data);
  }

  async updateRepository(
    id: number,
    data: { branch?: string; notification_interval?: number }
  ): Promise<DbRepository | null> {
    return this.repos.update(id, data);
  }

  async deleteRepository(id: number): Promise<boolean> {
    return this.repos.delete(id);
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - Scheduler Operations
  // ============================================

  async getRepositoriesDueForNotification(): Promise<DbRepository[]> {
    return this.repos.getDueForNotification();
  }

  async updateNextCheckTime(id: number): Promise<void> {
    return this.repos.updateNextCheckTime(id);
  }

  async acquireSchedulerLock(): Promise<boolean> {
    return this.repos.acquireSchedulerLock();
  }

  async releaseSchedulerLock(): Promise<void> {
    return this.repos.releaseSchedulerLock();
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - Commit Operations
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
    return this.commitRepo.getAll(options);
  }

  async getCommitBySha(sha: string): Promise<DbCommit | null> {
    return this.commitRepo.getBySha(sha);
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - Statistics Operations
  // ============================================

  async getDashboardStats(): Promise<DashboardStats> {
    return this.statsRepo.getDashboardStats();
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - User Operations
  // ============================================

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.getByEmail(email);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepo.getById(id);
  }

  async getUserWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    return this.userRepo.getWithPassword(email);
  }

  async createUser(data: {
    email: string;
    username: string;
    passwordHash: string;
    role: string;
  }): Promise<User> {
    return this.userRepo.create(data);
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
    return this.userRepo.update(id, data);
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.userRepo.delete(id);
  }

  async getUsers(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    return this.userRepo.getAll(options);
  }

  async updateLastLogin(userId: number): Promise<void> {
    return this.userRepo.updateLastLogin(userId);
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - Session Operations
  // ============================================

  async createSession(data: {
    userId: number;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    return this.sessionRepo.create(data);
  }

  async getSession(token: string): Promise<any | null> {
    return this.sessionRepo.getByToken(token);
  }

  async deleteSession(token: string): Promise<void> {
    return this.sessionRepo.delete(token);
  }

  async cleanupExpiredSessions(): Promise<void> {
    return this.sessionRepo.cleanupExpired();
  }

  // ============================================
  // BACKWARDS COMPATIBLE API - Audit Log Operations
  // ============================================

  async createAuditLog(data: {
    userId: number | null;
    action: string;
    resourceType?: string;
    resourceId?: number;
    details?: any;
    ipAddress?: string;
  }): Promise<void> {
    return this.auditLogRepo.create(data);
  }
}
