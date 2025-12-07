import { Octokit } from 'octokit';
import { Commit, RepoConfig } from '../types/commit.types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Normalize repository string to "owner/repo" or "owner/repo:branch" format
   * Supports:
   * - https://github.com/owner/repo
   * - https://github.com/owner/repo/tree/branch
   * - http://github.com/owner/repo
   * - github.com/owner/repo
   * - owner/repo
   * - owner/repo:branch
   */
  normalizeRepoString(repoString: string): string {
    // Remove quotes if present
    let normalized = repoString.trim().replace(/["']/g, '');

    // Check if it's a GitHub URL with /tree/branch
    const urlWithBranchPattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)\/tree\/([^\/\s]+)/i;
    const urlWithBranchMatch = normalized.match(urlWithBranchPattern);
    if (urlWithBranchMatch) {
      const owner = urlWithBranchMatch[1];
      const repo = urlWithBranchMatch[2].replace(/\.git$/, '');
      const branch = urlWithBranchMatch[3];
      return `${owner}/${repo}:${branch}`;
    }

    // Check if it's a GitHub URL without branch
    const urlPatterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/i,
      /^github\.com\/([^\/]+)\/([^\/\s]+)/i,
    ];

    for (const pattern of urlPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const owner = match[1];
        const repo = match[2].replace(/\.git$/, ''); // Remove .git suffix if present
        return `${owner}/${repo}`;
      }
    }

    // Already in owner/repo or owner/repo:branch format
    return normalized;
  }

  /**
   * Parse repository string in format "owner/repo" or "owner/repo:branch"
   */
  parseRepoString(repoString: string): RepoConfig {
    // Normalize first to handle URL formats
    const normalized = this.normalizeRepoString(repoString);

    // Check if branch is specified
    let branch: string | undefined;
    let repoPath: string;

    if (normalized.includes(':')) {
      const [path, branchName] = normalized.split(':');
      repoPath = path;
      branch = branchName;
    } else {
      repoPath = normalized;
    }

    const [owner, repo] = repoPath.split('/');

    if (!owner || !repo) {
      throw new Error(`Invalid repository format: ${repoString}. Expected format: "owner/repo", "owner/repo:branch", or "https://github.com/owner/repo/tree/branch"`);
    }

    return {
      owner,
      repo,
      branch,
      repoString: normalized,
    };
  }

  /**
   * Fetch commits from a repository since a specific timestamp
   */
  async fetchCommitsSince(repoString: string, since: string): Promise<Commit[]> {
    const { owner, repo, branch } = this.parseRepoString(repoString);

    try {
      const displayName = branch ? `${owner}/${repo} (${branch})` : `${owner}/${repo}`;
      console.log(`🔍 Fetching commits from ${displayName} since ${since}`);

      const params: any = {
        owner,
        repo,
        since,
        per_page: 100,
      };

      // Add branch/sha parameter if specified
      if (branch) {
        params.sha = branch;
      }

      const response = await this.octokit.rest.repos.listCommits(params);

      console.log(`✅ Found ${response.data.length} commits in ${displayName}`);

      return response.data as Commit[];
    } catch (error) {
      if (error instanceof Error) {
        const displayName = branch ? `${owner}/${repo} (${branch})` : `${owner}/${repo}`;
        console.error(`❌ Error fetching commits from ${displayName}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Fetch latest commits from a repository
   * @param repoString - Repository string (owner/repo or owner/repo:branch)
   * @param count - Number of commits to fetch (default: 10)
   * @param since - ISO 8601 date string to fetch commits after this date
   */
  async fetchLatestCommits(
    repoString: string,
    count: number = 10,
    since?: string
  ): Promise<Commit[]> {
    const { owner, repo, branch } = this.parseRepoString(repoString);

    try {
      const params: any = {
        owner,
        repo,
        per_page: count,
      };

      // Add branch/sha parameter if specified
      if (branch) {
        params.sha = branch;
      }

      // Add since parameter if specified
      if (since) {
        params.since = since;
      }

      const response = await this.octokit.rest.repos.listCommits(params);

      return response.data as Commit[];
    } catch (error) {
      if (error instanceof Error) {
        const displayName = branch ? `${owner}/${repo} (${branch})` : `${owner}/${repo}`;
        console.error(`❌ Error fetching latest commits from ${displayName}:`, error.message);
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
