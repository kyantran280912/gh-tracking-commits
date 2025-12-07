import { Router } from 'express';
import { DatabaseService } from '@repo/database';

export function createHealthRouter(db: DatabaseService): Router {
  const router = Router();

  // GET /api/health - Health check endpoint
  router.get('/', async (req, res, next) => {
    try {
      // Test database connection
      let databaseHealthy = false;
      try {
        await db.initialize();
        databaseHealthy = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      const health = {
        status: databaseHealthy ? 'ok' : 'error',
        database: databaseHealthy,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      const statusCode = databaseHealthy ? 200 : 503;

      res.status(statusCode).json(health);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
