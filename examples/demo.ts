/**
 * Demo Script
 * Fetch and display recent commits without using database
 * Perfect for testing notification format
 */

import { loadConfig } from '../src/config/env.js';
import { GitHubService } from '../src/services/github.service.js';
import { TelegramService } from '../src/services/telegram.service.js';
import { formatCommitsByRepo } from '../src/utils/formatter.js';
import { Commit } from '../src/types/commit.types.js';

async function runDemo() {
  console.log('🎬 Starting Demo Mode...\n');
  console.log('━'.repeat(50) + '\n');

  try {
    // Load configuration
    console.log('1️⃣  Loading configuration...');
    const config = loadConfig();
    console.log('   ✅ Configuration loaded\n');

    console.log('📋 Demo Configuration:');
    console.log(`   - Repositories: ${config.GITHUB_REPOS.length}`);
    config.GITHUB_REPOS.forEach((repo, i) => {
      console.log(`     ${i + 1}. ${repo}`);
    });
    console.log('');

    console.log('━'.repeat(50) + '\n');

    // Initialize services
    const github = new GitHubService();
    const telegram = new TelegramService();

    // Check rate limit
    console.log('2️⃣  Checking GitHub API rate limit...');
    const rateLimit = await github.checkRateLimit();
    console.log(`   ✅ Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    console.log(`   ⏰ Resets at: ${rateLimit.reset.toLocaleString('vi-VN')}\n`);

    if (rateLimit.remaining < 10) {
      console.warn('   ⚠️  WARNING: Low rate limit! Demo may fail.\n');
    }

    console.log('━'.repeat(50) + '\n');

    // Test Telegram connection
    console.log('3️⃣  Testing Telegram connection...');
    const telegramConnected = await telegram.testConnection();
    if (!telegramConnected) {
      throw new Error('Failed to connect to Telegram bot');
    }
    console.log('');

    console.log('━'.repeat(50) + '\n');

    // Fetch recent commits from all repos
    console.log('4️⃣  Fetching recent commits...\n');

    const commitsPerRepo = 5; // Show 5 recent commits per repo
    const allCommitsMap = new Map<string, Commit[]>();

    for (const repoString of config.GITHUB_REPOS) {
      try {
        console.log(`   📦 Fetching from ${repoString}...`);
        const commits = await github.fetchLatestCommits(repoString, commitsPerRepo);

        if (commits.length > 0) {
          allCommitsMap.set(repoString, commits);
          console.log(`   ✅ Found ${commits.length} recent commit(s)`);
        } else {
          console.log(`   ⚠️  No commits found`);
        }
      } catch (error) {
        console.error(`   ❌ Error fetching from ${repoString}`);
        if (error instanceof Error) {
          console.error(`      ${error.message}`);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
    console.log('━'.repeat(50) + '\n');

    // Send demo notifications
    const totalCommits = Array.from(allCommitsMap.values()).reduce(
      (sum, commits) => sum + commits.length,
      0
    );

    if (totalCommits === 0) {
      console.log('⚠️  No commits found to demo\n');
      return;
    }

    console.log('5️⃣  Sending demo notifications to Telegram...\n');
    console.log(`   📊 Sending ${totalCommits} commit(s) from ${allCommitsMap.size} repo(s)\n`);

    // Format messages
    const messages = formatCommitsByRepo(allCommitsMap);

    // Send header message
    await telegram.sendMessage(`
🎬 <b>Demo Mode</b>

Hiển thị ${totalCommits} commit(s) gần đây từ ${allCommitsMap.size} repository(ies).

<i>Đây là demo - commits này KHÔNG được lưu vào database.</i>
    `.trim());

    console.log('   ✅ Sent demo header\n');

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send each commit notification
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      try {
        await telegram.sendNotification(message);
        console.log(`   ✅ Sent notification ${i + 1}/${messages.length}`);

        // Delay between messages
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ Failed to send notification ${i + 1}`);
      }
    }

    console.log('');
    console.log('━'.repeat(50) + '\n');

    // Summary
    console.log('✅ Demo completed successfully!\n');
    console.log('📱 Check your Telegram to see the notification format.\n');
    console.log('💡 Tips:');
    console.log('   - These commits were NOT saved to database');
    console.log('   - Run `npm run dev` for actual tracking');
    console.log('   - Customize message format in src/utils/formatter.ts\n');

  } catch (error) {
    console.error('\n❌ Demo failed:\n');

    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);

      if (error.stack) {
        console.error('   Stack trace:');
        console.error(`   ${error.stack}\n`);
      }
    } else {
      console.error('   Unknown error occurred\n');
    }

    process.exit(1);
  }
}

// Run demo
console.log('\n');
runDemo();
