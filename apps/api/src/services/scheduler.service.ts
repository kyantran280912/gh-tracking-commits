import { DatabaseService } from '@repo/database';
import {
  GitHubService,
  TelegramService,
  formatMultipleCommits,
  formatDetailedCommit,
  DbRepository,
} from '@repo/shared';

export interface SchedulerConfig {
  pollingIntervalMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  enabled?: boolean;
}

export interface SchedulerStats {
  isRunning: boolean;
  lastRunTime: Date | null;
  lastRunDuration: number | null;
  totalCycles: number;
  totalReposProcessed: number;
  totalNotificationsSent: number;
  totalErrors: number;
}

/**
 * Scheduler Service for per-repository notification intervals
 * Polls database every 5 minutes to check for repos due for notification
 * Uses PostgreSQL advisory lock to prevent duplicate processing in horizontal scaling
 */
export class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isShuttingDown = false;

  // Configuration
  private readonly POLLING_INTERVAL_MS: number;
  private readonly MAX_RETRIES: number;
  private readonly RETRY_DELAY_MS: number;
  private readonly enabled: boolean;

  // Stats
  private stats: SchedulerStats = {
    isRunning: false,
    lastRunTime: null,
    lastRunDuration: null,
    totalCycles: 0,
    totalReposProcessed: 0,
    totalNotificationsSent: 0,
    totalErrors: 0,
  };

  constructor(
    private db: DatabaseService,
    private githubToken: string,
    private telegramToken: string,
    private telegramChatId: string,
    config?: SchedulerConfig
  ) {
    this.POLLING_INTERVAL_MS = config?.pollingIntervalMs || 5 * 60 * 1000; // 5 minutes
    this.MAX_RETRIES = config?.maxRetries || 3;
    this.RETRY_DELAY_MS = config?.retryDelayMs || 1000;
    this.enabled = config?.enabled !== false;
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      console.log('📅 Scheduler: Disabled by configuration');
      return;
    }

    if (!this.githubToken || !this.telegramToken || !this.telegramChatId) {
      console.log('📅 Scheduler: Missing required tokens, skipping...');
      return;
    }

    console.log(
      `📅 Scheduler: Starting with ${this.POLLING_INTERVAL_MS / 1000}s polling interval`
    );

    // Start polling
    this.intervalId = setInterval(() => this.runCycle(), this.POLLING_INTERVAL_MS);

    // Run immediately on start
    await this.runCycle();
  }

  /**
   * Stop the scheduler gracefully
   */
  async stop(): Promise<void> {
    console.log('📅 Scheduler: Graceful shutdown initiated...');
    this.isShuttingDown = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Wait for current cycle to finish (max 30s)
    const maxWait = 30000;
    const start = Date.now();
    while (this.isRunning && Date.now() - start < maxWait) {
      await this.delay(100);
    }

    console.log('📅 Scheduler: Shutdown complete');
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats, isRunning: this.isRunning };
  }

  /**
   * Run a single notification cycle
   */
  private async runCycle(): Promise<void> {
    if (this.isShuttingDown || this.isRunning) {
      return;
    }

    // Try to acquire distributed lock
    let lockAcquired = false;
    try {
      lockAcquired = await this.db.acquireSchedulerLock();
    } catch (error) {
      console.error('📅 Scheduler: Failed to acquire lock:', error);
      return;
    }

    if (!lockAcquired) {
      console.log('📅 Scheduler: Another instance is running, skipping...');
      return;
    }

    this.isRunning = true;
    this.stats.isRunning = true;
    const cycleStart = Date.now();

    try {
      const repos = await this.db.getRepositoriesDueForNotification();

      if (repos.length > 0) {
        console.log(`📅 Scheduler: Processing ${repos.length} repos due for notification`);
      }

      for (const repo of repos) {
        if (this.isShuttingDown) {
          console.log('📅 Scheduler: Shutdown requested, stopping cycle');
          break;
        }

        await this.processRepoWithRetry(repo);
      }

      this.stats.totalCycles++;
      this.stats.lastRunTime = new Date();
      this.stats.lastRunDuration = Date.now() - cycleStart;
    } catch (error) {
      console.error('📅 Scheduler: Cycle error:', error);
      this.stats.totalErrors++;
    } finally {
      this.isRunning = false;
      this.stats.isRunning = false;

      // Release lock
      try {
        await this.db.releaseSchedulerLock();
      } catch (error) {
        console.error('📅 Scheduler: Failed to release lock:', error);
      }
    }
  }

  /**
   * Process a repository with retry logic
   */
  private async processRepoWithRetry(repo: DbRepository): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.processRepo(repo);
        return;
      } catch (error) {
        console.error(
          `📅 Scheduler: Attempt ${attempt}/${this.MAX_RETRIES} failed for ${repo.repo_string}:`,
          error instanceof Error ? error.message : error
        );

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    console.error(`📅 Scheduler: All retries failed for ${repo.repo_string}`);
    this.stats.totalErrors++;
  }

  /**
   * Process a single repository - fetch commits and send notifications
   */
  private async processRepo(repo: DbRepository): Promise<void> {
    const githubService = new GitHubService(this.githubToken);
    const telegramService = new TelegramService(this.telegramToken, this.telegramChatId);

    // 1. Fetch commits since last check
    const since = repo.last_check_time
      ? new Date(repo.last_check_time).toISOString()
      : undefined;

    const commits = await githubService.fetchLatestCommits(repo.repo_string, 100, since);

    // 2. Filter out already notified commits
    const newCommits = [];
    for (const commit of commits) {
      const existing = await this.db.getCommitBySha(commit.sha);
      if (!existing) {
        newCommits.push(commit);
      }
    }

    // 3. Send telegram notification if there are new commits
    if (newCommits.length > 0) {
      let message: string;
      if (newCommits.length === 1) {
        message = formatDetailedCommit(newCommits[0], repo.repo_string);
      } else {
        message = formatMultipleCommits(newCommits, repo.repo_string);
      }

      await telegramService.sendMessage(message);
      this.stats.totalNotificationsSent++;

      console.log(
        `📅 Scheduler: Sent notification for ${repo.repo_string} (${newCommits.length} commits)`
      );
    }

    // 4. Update next_check_time
    await this.db.updateNextCheckTime(repo.id);
    this.stats.totalReposProcessed++;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
