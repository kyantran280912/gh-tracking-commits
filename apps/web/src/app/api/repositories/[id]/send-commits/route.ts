import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@repo/database';
import { GitHubService, TelegramService, formatMultipleCommits, formatDetailedCommit } from '@repo/shared';

// Initialize database service
const db = new DatabaseService({
  connectionString: process.env.DATABASE_URL || '',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid repository ID' },
        { status: 400 }
      );
    }

    // Get environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    // DEBUG: Log bot token info
    console.log('🔍 [DEBUG] Send Commits - Environment Variables:');
    console.log(`   TELEGRAM_BOT_TOKEN: ${telegramToken ? `${telegramToken.substring(0, 10)}...${telegramToken.substring(telegramToken.length - 5)}` : 'NOT SET'}`);
    console.log(`   TELEGRAM_CHAT_ID: ${telegramChatId || 'NOT SET'}`);
    console.log(`   GITHUB_TOKEN: ${githubToken ? `${githubToken.substring(0, 8)}...` : 'NOT SET'}`);

    if (!githubToken || !telegramToken || !telegramChatId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required environment variables (GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)',
        },
        { status: 500 }
      );
    }

    // Get repository from database
    const repository = await db.getRepositoryById(id);
    if (!repository) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Initialize services
    const githubService = new GitHubService(githubToken);
    const telegramService = new TelegramService(telegramToken, telegramChatId);

    // Fetch latest 10 commits (DEMO - không check database)
    console.log(`📤 [DEMO] Fetching 10 latest commits from ${repository.repo_string}`);
    const commits = await githubService.fetchLatestCommits(repository.repo_string, 10);

    if (commits.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No commits found',
        data: {
          commitsSent: 0,
        },
      });
    }

    // Format and send to Telegram
    let message: string;
    if (commits.length === 1) {
      message = formatDetailedCommit(commits[0], repository.repo_string);
    } else {
      message = formatMultipleCommits(commits, repository.repo_string);
    }

    await telegramService.sendMessage(message);
    console.log(`✅ [DEMO] Sent ${commits.length} commit(s) to Telegram`);

    // KHÔNG lưu vào database - đây là demo button
    return NextResponse.json({
      success: true,
      message: `Successfully sent ${commits.length} commit(s) to Telegram (DEMO - not saved to database)`,
      data: {
        commitsSent: commits.length,
      },
    });
  } catch (error) {
    console.error('Error in demo send commits:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
