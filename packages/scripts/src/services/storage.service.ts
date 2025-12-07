import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { DatabaseSchema, defaultDatabase } from '../types/database.types.js';
import { getConfig } from '../config/env.js';

export class StorageService {
  private db: Low<DatabaseSchema>;
  private initialized = false;

  constructor(dbPath?: string) {
    const path = dbPath || getConfig().DB_PATH;
    const adapter = new JSONFile<DatabaseSchema>(path);
    this.db = new Low(adapter, defaultDatabase);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.db.read();

    // Ensure data structure exists
    if (!this.db.data) {
      this.db.data = defaultDatabase;
      await this.db.write();
    }

    this.initialized = true;
  }

  async isCommitNotified(sha: string): Promise<boolean> {
    await this.initialize();
    return this.db.data.notifiedCommits.includes(sha);
  }

  async markCommitAsNotified(sha: string): Promise<void> {
    await this.initialize();

    if (!this.db.data.notifiedCommits.includes(sha)) {
      this.db.data.notifiedCommits.push(sha);
      await this.db.write();
    }
  }

  async markMultipleCommitsAsNotified(shas: string[]): Promise<void> {
    await this.initialize();

    const newShas = shas.filter((sha) => !this.db.data.notifiedCommits.includes(sha));

    if (newShas.length > 0) {
      this.db.data.notifiedCommits.push(...newShas);
      await this.db.write();
    }
  }

  async getLastCheckTime(): Promise<string> {
    await this.initialize();
    return this.db.data.lastCheck;
  }

  async updateLastCheckTime(timestamp: string = new Date().toISOString()): Promise<void> {
    await this.initialize();
    this.db.data.lastCheck = timestamp;
    await this.db.write();
  }

  async getRepositoryInfo(repoKey: string): Promise<{ lastCommitSha?: string; lastCheckTime: string }> {
    await this.initialize();

    if (!this.db.data.repositories[repoKey]) {
      this.db.data.repositories[repoKey] = {
        lastCheckTime: new Date(0).toISOString(),
      };
      await this.db.write();
    }

    return this.db.data.repositories[repoKey];
  }

  async updateRepositoryInfo(
    repoKey: string,
    info: { lastCommitSha?: string; lastCheckTime?: string }
  ): Promise<void> {
    await this.initialize();

    if (!this.db.data.repositories[repoKey]) {
      this.db.data.repositories[repoKey] = {
        lastCheckTime: new Date().toISOString(),
      };
    }

    if (info.lastCommitSha) {
      this.db.data.repositories[repoKey].lastCommitSha = info.lastCommitSha;
    }

    if (info.lastCheckTime) {
      this.db.data.repositories[repoKey].lastCheckTime = info.lastCheckTime;
    }

    await this.db.write();
  }

  async cleanupOldCommits(daysToKeep: number = 30): Promise<void> {
    await this.initialize();

    // Keep only recent commits to prevent unlimited growth
    const maxCommits = daysToKeep * 100; // Rough estimate: 100 commits per day max

    if (this.db.data.notifiedCommits.length > maxCommits) {
      // Keep only the most recent commits
      this.db.data.notifiedCommits = this.db.data.notifiedCommits.slice(-maxCommits);
      await this.db.write();
    }
  }
}
