import pg from 'pg';

/**
 * BaseRepository - Abstract base class for all repositories
 * Provides common functionality like pool access and initialization
 */
export abstract class BaseRepository {
  protected initialized = false;

  constructor(protected pool: pg.Pool) {}

  /**
   * Ensure database connection is ready before executing queries
   * Called automatically by each repository method
   */
  protected async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Execute a query with automatic initialization
   * Returns rows as any[] for flexibility - callers can type-cast as needed
   */
  protected async query(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<any>> {
    await this.ensureInitialized();
    return this.pool.query(text, params);
  }
}
