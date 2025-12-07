import { Router } from 'express';
import { DatabaseService } from '@repo/database';
import {
  repositoryCreateSchema,
  repositoryUpdateSchema,
  repositoryQuerySchema,
  parseRepoString,
  GitHubService,
  TelegramService,
  formatMultipleCommits,
  formatDetailedCommit,
} from '@repo/shared';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '@repo/shared';

export function createRepositoriesRouter(db: DatabaseService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateToken);

  // GET /api/repositories - List all repositories
  router.get('/', validateQuery(repositoryQuerySchema), async (req: AuthRequest, res, next) => {
    try {
      const { page, limit, search } = req.query as any;

      const result = await db.getRepositories({
        page: page || 1,
        limit: limit || 20,
        search,
      });

      res.json({
        success: true,
        data: result.repositories,
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

  // GET /api/repositories/:id - Get single repository
  router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid repository ID',
        });
      }

      const repository = await db.getRepositoryById(id);

      if (!repository) {
        return res.status(404).json({
          success: false,
          error: 'Repository not found',
        });
      }

      res.json({
        success: true,
        data: repository,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/repositories - Create new repository
  router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.USER),
    validateBody(repositoryCreateSchema),
    async (req: AuthRequest, res, next) => {
      try {
        const { repoString } = req.body;

        // Check if repository already exists
        const existing = await db.getRepositoryByString(repoString);
        if (existing) {
          return res.status(400).json({
            success: false,
            error: 'Repository already being tracked',
          });
        }

        // Parse repo string
        const parsed = parseRepoString(repoString);

        // Create repository
        const repository = await db.createRepository({
          repoString,
          owner: parsed.owner,
          repo: parsed.repo,
          branch: parsed.branch,
        });

        // Log audit
        await db.createAuditLog({
          userId: req.user!.userId,
          action: 'REPOSITORY_CREATED',
          resourceType: 'repository',
          resourceId: repository.id,
          details: { repoString },
          ipAddress: req.ip,
        });

        res.status(201).json({
          success: true,
          data: repository,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // PATCH /api/repositories/:id - Update repository
  router.patch(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.USER),
    validateBody(repositoryUpdateSchema),
    async (req: AuthRequest, res, next) => {
      try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid repository ID',
          });
        }

        const { branch, notification_interval } = req.body;

        const repository = await db.updateRepository(id, {
          branch,
          notification_interval,
        });

        if (!repository) {
          return res.status(404).json({
            success: false,
            error: 'Repository not found',
          });
        }

        // Log audit
        await db.createAuditLog({
          userId: req.user!.userId,
          action: 'REPOSITORY_UPDATED',
          resourceType: 'repository',
          resourceId: id,
          details: { branch, notification_interval },
          ipAddress: req.ip,
        });

        res.json({
          success: true,
          data: repository,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/repositories/:id - Delete repository
  router.delete(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.USER),
    async (req: AuthRequest, res, next) => {
      try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid repository ID',
          });
        }

        const success = await db.deleteRepository(id);

        if (!success) {
          return res.status(404).json({
            success: false,
            error: 'Repository not found',
          });
        }

        // Log audit
        await db.createAuditLog({
          userId: req.user!.userId,
          action: 'REPOSITORY_DELETED',
          resourceType: 'repository',
          resourceId: id,
          ipAddress: req.ip,
        });

        res.json({
          success: true,
          message: 'Repository deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/repositories/test-notifications - Test notifications for all repos
  router.post(
    '/test-notifications',
    requireRole(UserRole.ADMIN, UserRole.USER),
    async (req: AuthRequest, res, next) => {
      try {
        // Get environment variables
        const githubToken = process.env.GITHUB_TOKEN;
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (!githubToken || !telegramToken || !telegramChatId) {
          return res.status(500).json({
            success: false,
            error: 'Missing required environment variables (GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)',
          });
        }

        // Initialize services
        const githubService = new GitHubService(githubToken);
        const telegramService = new TelegramService(telegramToken, telegramChatId);

        // Get all repositories
        const result = await db.getRepositories({ page: 1, limit: 100 });
        const repositories = result.repositories;

        if (repositories.length === 0) {
          return res.json({
            success: true,
            message: 'No repositories found to test',
            data: {
              reposProcessed: 0,
              messagesSent: 0,
              errors: [],
            },
          });
        }

        const results = {
          reposProcessed: 0,
          messagesSent: 0,
          errors: [] as Array<{ repo: string; error: string }>,
        };

        // Process each repository
        for (const repo of repositories) {
          try {
            // Fetch latest 5 commits
            const commits = await githubService.fetchLatestCommits(repo.repo_string, 5);

            if (commits.length > 0) {
              // Format and send notification
              let message: string;
              if (commits.length === 1) {
                message = formatDetailedCommit(commits[0], repo.repo_string);
              } else {
                message = formatMultipleCommits(commits, repo.repo_string);
              }

              await telegramService.sendMessage(message);
              results.messagesSent++;
            }

            results.reposProcessed++;
          } catch (error) {
            console.error(`Error processing ${repo.repo_string}:`, error);
            results.errors.push({
              repo: repo.repo_string,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Log audit
        await db.createAuditLog({
          userId: req.user!.userId,
          action: 'TEST_NOTIFICATIONS',
          resourceType: 'repository',
          details: {
            reposProcessed: results.reposProcessed,
            messagesSent: results.messagesSent,
            errorsCount: results.errors.length,
          },
          ipAddress: req.ip,
        });

        res.json({
          success: true,
          message: `Test completed. Processed ${results.reposProcessed} repositories and sent ${results.messagesSent} messages.`,
          data: results,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
