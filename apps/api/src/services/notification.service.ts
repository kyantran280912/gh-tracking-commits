import { DatabaseService } from '@repo/database';
import {
  GitHubService,
  TelegramService,
  formatMultipleCommits,
  formatDetailedCommit,
} from '@repo/shared';

export interface NotificationResult {
  reposProcessed: number;
  messagesSent: number;
  errors: Array<{ repo: string; error: string }>;
}

export interface NotificationConfig {
  githubToken: string;
  telegramToken: string;
  telegramChatId: string;
}

/**
 * NotificationService - Handles notification testing and sending
 */
export class NotificationService {
  private githubService: GitHubService;
  private telegramService: TelegramService;

  constructor(
    private db: DatabaseService,
    config: NotificationConfig
  ) {
    this.githubService = new GitHubService(config.githubToken);
    this.telegramService = new TelegramService(
      config.telegramToken,
      config.telegramChatId
    );
  }

  /**
   * Test notifications for all repositories
   * Fetches latest commits and sends formatted messages to Telegram
   */
  async testNotifications(): Promise<NotificationResult> {
    const result = await this.db.getRepositories({ page: 1, limit: 100 });
    const repositories = result.repositories;

    const results: NotificationResult = {
      reposProcessed: 0,
      messagesSent: 0,
      errors: [],
    };

    if (repositories.length === 0) {
      return results;
    }

    for (const repo of repositories) {
      try {
        const commits = await this.githubService.fetchLatestCommits(
          repo.repo_string,
          5
        );

        if (commits.length > 0) {
          const message = this.formatNotification(commits, repo.repo_string);
          await this.telegramService.sendMessage(message);
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

    return results;
  }

  /**
   * Send commits for a specific repository
   */
  async sendCommitsForRepo(
    repoString: string,
    limit: number = 5
  ): Promise<{ messagesSent: number }> {
    const commits = await this.githubService.fetchLatestCommits(
      repoString,
      limit
    );

    if (commits.length === 0) {
      return { messagesSent: 0 };
    }

    const message = this.formatNotification(commits, repoString);
    await this.telegramService.sendMessage(message);

    return { messagesSent: 1 };
  }

  /**
   * Format notification message based on number of commits
   */
  private formatNotification(commits: any[], repoString: string): string {
    return commits.length === 1
      ? formatDetailedCommit(commits[0], repoString)
      : formatMultipleCommits(commits, repoString);
  }

  /**
   * Validate notification configuration from environment
   */
  static validateConfig(): NotificationConfig | null {
    const githubToken = process.env.GITHUB_TOKEN;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!githubToken || !telegramToken || !telegramChatId) {
      return null;
    }

    return { githubToken, telegramToken, telegramChatId };
  }
}
