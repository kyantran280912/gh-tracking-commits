import { Router } from 'express';
import { DatabaseService } from '@repo/database';
import { commitQuerySchema } from '@repo/shared';
import { validateQuery } from '../middleware/validation.middleware.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

export function createCommitsRouter(db: DatabaseService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateToken);

  // GET /api/commits - List commits with filters
  router.get('/', validateQuery(commitQuerySchema), async (req: AuthRequest, res, next) => {
    try {
      const {
        page,
        limit,
        repositoryId,
        authorEmail,
        search,
        startDate,
        endDate,
      } = req.query as any;

      const result = await db.getCommits({
        page: page || 1,
        limit: limit || 20,
        repositoryId,
        authorEmail,
        search,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: result.commits,
        pagination: {
          page: page || 1,
          limit: limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (limit || 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/commits/:sha - Get single commit
  router.get('/:sha', async (req: AuthRequest, res, next) => {
    try {
      const { sha } = req.params;

      const commit = await db.getCommitBySha(sha);

      if (!commit) {
        return res.status(404).json({
          success: false,
          error: 'Commit not found',
        });
      }

      res.json({
        success: true,
        data: commit,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
