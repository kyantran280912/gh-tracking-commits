import { Router } from 'express';
import { DatabaseService } from '@repo/database';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

export function createStatsRouter(db: DatabaseService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateToken);

  // GET /api/stats - Get dashboard statistics
  router.get('/', async (req: AuthRequest, res, next) => {
    try {
      const stats = await db.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
