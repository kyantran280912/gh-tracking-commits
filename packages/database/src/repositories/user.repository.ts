import type { User } from '@repo/shared';
import { BaseRepository } from './base.repository';

export interface UserQueryOptions {
  page?: number;
  limit?: number;
}

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  role?: string;
}

/**
 * UserRepository - Handles all user CRUD operations
 */
export class UserRepository extends BaseRepository {
  private readonly selectFields =
    'id, email, username, role, created_at, updated_at';

  /**
   * Get user by email (without password hash)
   */
  async getByEmail(email: string): Promise<User | null> {
    const result = await this.query(
      `SELECT ${this.selectFields} FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user by ID (without password hash)
   */
  async getById(id: number): Promise<User | null> {
    const result = await this.query(
      `SELECT ${this.selectFields} FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user with password hash for authentication
   */
  async getWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    const result = await this.query(
      `SELECT ${this.selectFields}, password_hash FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    const result = await this.query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${this.selectFields}`,
      [data.email, data.username, data.passwordHash, data.role]
    );
    return result.rows[0];
  }

  /**
   * Update an existing user
   */
  async update(id: number, data: UpdateUserData): Promise<User | null> {
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
      return this.getById(id);
    }

    params.push(id);
    const result = await this.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a user
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get paginated list of users
   */
  async getAll(options?: UserQueryOptions): Promise<{
    users: User[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      this.query(
        `SELECT ${this.selectFields} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.query('SELECT COUNT(*) FROM users'),
    ]);

    return {
      users: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    await this.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
}
