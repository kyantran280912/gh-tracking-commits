import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { DatabaseService } from '@repo/database';
import { getEnv } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createRepositoriesRouter } from './routes/repositories.routes.js';
import { createCommitsRouter } from './routes/commits.routes.js';
import { createStatsRouter } from './routes/stats.routes.js';
import { createHealthRouter } from './routes/health.routes.js';
import { SchedulerService } from './services/scheduler.service.js';

async function startServer() {
  const env = getEnv();
  const app = express();

  // Initialize database
  const db = new DatabaseService({
    connectionString: env.DATABASE_URL,
  });

  try {
    await db.initialize();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Initialize scheduler service
  const scheduler = new SchedulerService(
    db,
    env.GITHUB_TOKEN || '',
    env.TELEGRAM_BOT_TOKEN || '',
    env.TELEGRAM_CHAT_ID || '',
    {
      pollingIntervalMs: 5 * 60 * 1000, // 5 minutes
      enabled: env.NODE_ENV === 'production' || env.SCHEDULER_ENABLED === 'true',
    }
  );

  // Start scheduler
  await scheduler.start();

  // Security middleware
  app.use(helmet());

  // CORS configuration - Allow all origins
  app.use(
    cors({
      origin: '*',
      credentials: false,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // API Routes
  app.use('/api/health', createHealthRouter(db));
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/repositories', createRepositoriesRouter(db));
  app.use('/api/commits', createCommitsRouter(db));
  app.use('/api/stats', createStatsRouter(db));

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'GitHub Commit Tracker API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        repositories: '/api/repositories',
        commits: '/api/commits',
        stats: '/api/stats',
      },
    });
  });

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server
  const PORT = env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 CORS enabled for: ${env.CORS_ORIGIN}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await scheduler.stop();
    await db.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    await scheduler.stop();
    await db.close();
    process.exit(0);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
