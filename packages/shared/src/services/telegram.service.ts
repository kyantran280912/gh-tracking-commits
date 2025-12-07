import { Telegraf } from 'telegraf';

// Retry configuration for Telegram API calls
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds max
};

export class TelegramService {
  private bot: Telegraf;
  private chatId: string;

  constructor(token: string, chatId: string) {
    this.bot = new Telegraf(token);
    this.chatId = chatId;
  }

  /**
   * Retry with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < RETRY_CONFIG.maxRetries - 1) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
            RETRY_CONFIG.maxDelay
          );
          console.log(`Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} for ${context} in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(message: string, options?: { parse_mode?: 'HTML' | 'MarkdownV2' }): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: options?.parse_mode || 'HTML',
      });

      console.log('✅ Message sent to Telegram successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error sending Telegram message:', error.message);
      }
      throw error;
    }
  }

  /**
   * Send multiple messages in sequence
   */
  async sendMessages(messages: string[], options?: { parse_mode?: 'HTML' | 'MarkdownV2' }): Promise<void> {
    for (const message of messages) {
      try {
        await this.sendMessage(message, options);
        // Small delay to avoid rate limiting
        await this.delay(100);
      } catch (error) {
        console.error('⚠️  Failed to send one message, continuing...');
      }
    }
  }

  /**
   * Send notification with retry and error handling
   */
  async sendNotification(message: string): Promise<boolean> {
    try {
      await this.withRetry(
        () => this.sendMessage(message),
        'sendNotification'
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification after retries');
      return false;
    }
  }

  /**
   * Test bot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const botInfo = await this.bot.telegram.getMe();
      console.log(`✅ Bot connected: @${botInfo.username}`);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Bot connection failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Utility function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
