import { loadConfig } from './config/env.js';
import { GitHubService } from './services/github.service.js';
import { TelegramService } from './services/telegram.service.js';
import { StorageService } from './services/storage.service.js';
import { PostgresStorageService } from './services/postgres-storage.service.js';
import { formatCommitsByRepo } from './utils/formatter.js';
import { Commit } from '@repo/shared/types';

async function main() {
  console.log('🚀 Starting GitHub Commit Tracker...\n');

  try {
    // Load and validate configuration
    const config = loadConfig();
    console.log('✅ Configuration loaded successfully');
    console.log(`📝 Tracking ${config.GITHUB_REPOS.length} repositories:\n   - ${config.GITHUB_REPOS.join('\n   - ')}\n`);

    // Initialize services
    // Use PostgreSQL if DATABASE_URL is provided, otherwise fallback to lowdb
    const usePostgres = !!config.DATABASE_URL;
    const storage = usePostgres ? new PostgresStorageService() : new StorageService();
    const github = new GitHubService();
    const telegram = new TelegramService();

    await storage.initialize();
    console.log(`✅ Storage initialized (using ${usePostgres ? 'PostgreSQL' : 'lowdb'})\n`);

    // Test Telegram connection
    const telegramConnected = await telegram.testConnection();
    if (!telegramConnected) {
      throw new Error('Failed to connect to Telegram bot');
    }
    console.log('');

    // Check GitHub rate limit
    const rateLimit = await github.checkRateLimit();
    console.log(`📊 GitHub API Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    console.log(`   Resets at: ${rateLimit.reset.toLocaleString('vi-VN')}\n`);

    if (rateLimit.remaining < 10) {
      console.warn('⚠️  Low rate limit remaining. Consider waiting until reset.\n');
    }

    // Get last check time
    const lastCheckTime = await storage.getLastCheckTime();
    const lastCheckDate = new Date(lastCheckTime);
    console.log(`⏱️  Last check: ${lastCheckDate.toLocaleString('vi-VN')}\n`);

    // Calculate the "since" timestamp for fetching commits
    // Use last check time, or 24 hours ago if this is the first run
    const sinceTime = lastCheckTime === new Date(0).toISOString()
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : lastCheckTime;

    console.log(`🔍 Fetching commits since: ${new Date(sinceTime).toLocaleString('vi-VN')}\n`);

    // Fetch commits from all repositories
    const allCommitsMap = await github.fetchCommitsFromMultipleRepos(config.GITHUB_REPOS, sinceTime);

    // Filter out already notified commits
    const newCommitsMap = new Map<string, Commit[]>();
    let totalNewCommits = 0;

    for (const [repoString, commits] of allCommitsMap.entries()) {
      const newCommits: Commit[] = [];

      for (const commit of commits) {
        const isNotified = await storage.isCommitNotified(commit.sha);
        if (!isNotified) {
          newCommits.push(commit);
        }
      }

      if (newCommits.length > 0) {
        newCommitsMap.set(repoString, newCommits);
        totalNewCommits += newCommits.length;
        console.log(`  📌 ${repoString}: ${newCommits.length} new commit(s)`);
      }
    }

    console.log(`\n📊 Total new commits: ${totalNewCommits}\n`);

    // Send notifications for new commits
    if (totalNewCommits > 0) {
      console.log('📤 Sending notifications...\n');

      const messages = formatCommitsByRepo(newCommitsMap);

      for (const message of messages) {
        await telegram.sendNotification(message);
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mark all new commits as notified
      if (storage instanceof PostgresStorageService) {
        // PostgreSQL needs full commit data
        const allCommitsData: Array<{
          sha: string;
          repoString: string;
          authorName: string;
          authorEmail: string;
          message: string;
          commitDate: string;
          htmlUrl: string;
        }> = [];

        for (const [repoString, commits] of newCommitsMap.entries()) {
          for (const commit of commits) {
            allCommitsData.push({
              sha: commit.sha,
              repoString,
              authorName: commit.commit.author.name,
              authorEmail: commit.commit.author.email,
              message: commit.commit.message,
              commitDate: commit.commit.author.date,
              htmlUrl: commit.html_url,
            });
          }
        }

        await storage.markMultipleCommitsAsNotified(allCommitsData);
      } else {
        // lowdb only needs SHAs
        const allNewCommitShas: string[] = [];
        for (const commits of newCommitsMap.values()) {
          allNewCommitShas.push(...commits.map(c => c.sha));
        }
        await storage.markMultipleCommitsAsNotified(allNewCommitShas);
      }

      console.log('✅ All commits marked as notified\n');
    } else {
      console.log('ℹ️  No new commits to notify\n');
    }

    // Update last check time
    const now = new Date().toISOString();
    await storage.updateLastCheckTime(now);
    console.log(`✅ Updated last check time: ${new Date(now).toLocaleString('vi-VN')}\n`);

    // Cleanup old commits (keep last 30 days)
    await storage.cleanupOldCommits(30);

    console.log('✅ Tracking completed successfully!');
    console.log(`📊 Summary: ${totalNewCommits} new commit(s) from ${config.GITHUB_REPOS.length} repository(ies)\n`);

  } catch (error) {
    console.error('\n❌ Error occurred during tracking:\n');

    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      console.error(`\n   Stack trace:\n   ${error.stack}\n`);
    } else {
      console.error('   Unknown error:', error);
    }

    process.exit(1);
  }
}

// Run the tracker
main();
