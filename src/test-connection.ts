/**
 * Test Connection Script
 * Kiểm tra kết nối với GitHub và Telegram trước khi chạy tracker
 */

import { loadConfig } from './config/env.js';
import { GitHubService } from './services/github.service.js';
import { TelegramService } from './services/telegram.service.js';

async function testConnections() {
  console.log('🧪 Testing Connections...\n');
  console.log('━'.repeat(50) + '\n');

  let allPassed = true;

  try {
    // Load config
    console.log('1️⃣  Loading configuration...');
    const config = loadConfig();
    console.log('   ✅ Configuration loaded\n');

    console.log('📋 Configuration Summary:');
    console.log(`   - Repositories: ${config.GITHUB_REPOS.length}`);
    config.GITHUB_REPOS.forEach((repo, i) => {
      console.log(`     ${i + 1}. ${repo}`);
    });
    console.log(`   - Check Interval: ${config.CHECK_INTERVAL_HOURS} hours`);
    console.log(`   - Database Path: ${config.DB_PATH}\n`);

    console.log('━'.repeat(50) + '\n');

    // Test GitHub connection
    console.log('2️⃣  Testing GitHub API...');
    const github = new GitHubService();

    try {
      const rateLimit = await github.checkRateLimit();
      console.log('   ✅ GitHub API connected successfully');
      console.log(`   📊 Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
      console.log(`   ⏰ Resets at: ${rateLimit.reset.toLocaleString('vi-VN')}\n`);

      if (rateLimit.remaining < 100) {
        console.log('   ⚠️  WARNING: Low rate limit remaining!\n');
      }
    } catch (error) {
      allPassed = false;
      console.log('   ❌ GitHub API connection failed');
      if (error instanceof Error) {
        console.log(`   Error: ${error.message}\n`);
      }
    }

    // Test repositories access
    console.log('3️⃣  Testing repository access...');
    let repoTestsPassed = 0;

    for (const repoString of config.GITHUB_REPOS.slice(0, 3)) {
      try {
        const commits = await github.fetchLatestCommits(repoString, 1);
        if (commits.length > 0) {
          console.log(`   ✅ ${repoString} - accessible`);
          repoTestsPassed++;
        } else {
          console.log(`   ⚠️  ${repoString} - no commits found`);
        }
      } catch (error) {
        allPassed = false;
        console.log(`   ❌ ${repoString} - access failed`);
        if (error instanceof Error) {
          console.log(`      Error: ${error.message}`);
        }
      }
    }

    if (config.GITHUB_REPOS.length > 3) {
      console.log(`   ℹ️  Tested 3/${config.GITHUB_REPOS.length} repositories\n`);
    } else {
      console.log('');
    }

    console.log('━'.repeat(50) + '\n');

    // Test Telegram connection
    console.log('4️⃣  Testing Telegram Bot...');
    const telegram = new TelegramService();

    const telegramConnected = await telegram.testConnection();
    if (telegramConnected) {
      console.log('   ✅ Telegram bot connected successfully\n');
    } else {
      allPassed = false;
      console.log('   ❌ Telegram bot connection failed\n');
    }

    // Send test message
    console.log('5️⃣  Sending test notification...');
    try {
      await telegram.sendMessage(`
🧪 <b>Test Notification</b>

GitHub Commit Tracker đã được cấu hình thành công!

📊 Đang tracking ${config.GITHUB_REPOS.length} repository(ies)
⏰ Check interval: ${config.CHECK_INTERVAL_HOURS} giờ

<i>Thông báo test từ: ${new Date().toLocaleString('vi-VN')}</i>
      `.trim());

      console.log('   ✅ Test notification sent to Telegram\n');
      console.log('   📱 Kiểm tra Telegram app để xem message!\n');
    } catch (error) {
      allPassed = false;
      console.log('   ❌ Failed to send test notification');
      if (error instanceof Error) {
        console.log(`   Error: ${error.message}\n`);
      }
    }

    console.log('━'.repeat(50) + '\n');

    // Final summary
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!\n');
      console.log('🚀 Bạn có thể chạy tracker bằng lệnh:');
      console.log('   npm run dev\n');
      console.log('📖 Hoặc đọc SETUP.md để deploy lên GitHub Actions\n');
    } else {
      console.log('❌ SOME TESTS FAILED\n');
      console.log('📖 Vui lòng kiểm tra lại cấu hình trong file .env');
      console.log('📚 Đọc SETUP.md để biết hướng dẫn chi tiết\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:\n');
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
    } else {
      console.error('   Unknown error occurred\n');
    }
    process.exit(1);
  }
}

// Run tests
testConnections();
