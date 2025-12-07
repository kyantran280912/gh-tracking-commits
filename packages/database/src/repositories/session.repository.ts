import { BaseRepository } from './base.repository';

export interface CreateSessionData {
  userId: number;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionWithUser {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  email: string;
  username: string;
  role: string;
}

/**
 * SessionRepository - Handles session management
 */
export class SessionRepository extends BaseRepository {
  /**
   * Create a new session
   */
  async create(data: CreateSessionData): Promise<void> {
    await this.query(
      `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.userId, data.token, data.expiresAt, data.ipAddress, data.userAgent]
    );
  }

  /**
   * Get session by token with user info
   */
  async getByToken(token: string): Promise<SessionWithUser | null> {
    const result = await this.query(
      `SELECT s.*, u.email, u.username, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a session by token
   */
  async delete(token: string): Promise<void> {
    await this.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpired(): Promise<void> {
    await this.query('DELETE FROM sessions WHERE expires_at < NOW()');
  }
}
