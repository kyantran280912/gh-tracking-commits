import { Octokit } from 'octokit';
import { Commit, RepoConfig } from '@repo/shared/types';
import { getConfig } from '../config/env.js';

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    const githubToken = token || getConfig().GITHUB_TOKEN;
    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * Parse repository string in format "owner/repo"
   */
  parseRepoString(repoString: string): RepoConfig {
    const [owner, repo] = repoString.split('/');

    if (!owner || !repo) {
      throw new Error(`Invalid repository format: ${repoString}. Expected format: "owner/repo"`);
    }

    return { owner, repo, repoString };
  }

  /**
   * Fetch commits from a repository since a specific timestamp
   */
  async fetchCommitsSince(repoString: string, since: string): Promise<Commit[]> {
    const { owner, repo } = this.parseRepoString(repoString);

    try {
      console.log(`🔍 Fetching commits from ${owner}/${repo} since ${since}`);

      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since,
        per_page: 100,
      });

      console.log(`✅ Found ${response.data.length} commits in ${owner}/${repo}`);

      return response.data as Commit[];
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error fetching commits from ${owner}/${repo}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch latest commits from a repository
   */
  async fetchLatestCommits(repoString: string, count: number = 10): Promise<Commit[]> {
    const { owner, repo } = this.parseRepoString(repoString);

    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: count,
      });

      return response.data as Commit[];
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error fetching latest commits from ${owner}/${repo}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Check GitHub API rate limit
   */
  async checkRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    try {
      const response = await this.octokit.rest.rateLimit.get();

      return {
        limit: response.data.rate.limit,
        remaining: response.data.rate.remaining,
        reset: new Date(response.data.rate.reset * 1000),
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Error checking rate limit:', error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch commits from multiple repositories
   */
  async fetchCommitsFromMultipleRepos(
    repoStrings: string[],
    since: string
  ): Promise<Map<string, Commit[]>> {
    const results = new Map<string, Commit[]>();

    for (const repoString of repoStrings) {
      try {
        const commits = await this.fetchCommitsSince(repoString, since);
        results.set(repoString, commits);
      } catch (error) {
        console.error(`⚠️  Skipping ${repoString} due to error`);
        results.set(repoString, []);
      }
    }

    return results;
  }
}
