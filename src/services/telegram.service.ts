import { Telegraf } from 'telegraf';
import { getConfig } from '../config/env.js';

export class TelegramService {
  private bot: Telegraf;
  private chatId: string;

  constructor(token?: string, chatId?: string) {
    const config = getConfig();
    this.bot = new Telegraf(token || config.TELEGRAM_BOT_TOKEN);
    this.chatId = chatId || config.TELEGRAM_CHAT_ID;
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
   * Send notification with error handling
   */
  async sendNotification(message: string): Promise<boolean> {
    try {
      await this.sendMessage(message);
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification');
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
