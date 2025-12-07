// Format date to ISO string
export function formatDate(date: Date | string): string {
  return new Date(date).toISOString();
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
export function normalizeRepoString(repoString: string): string {
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
 * Parse repo string: "owner/repo", "owner/repo:branch", or GitHub URL
 * Returns owner, repo, and optional branch
 */
export function parseRepoString(repoString: string): {
  owner: string;
  repo: string;
  branch: string | null;
} {
  // Normalize first to handle URL formats
  const normalized = normalizeRepoString(repoString);

  // Check if branch is specified
  let branch: string | null = null;
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
    throw new Error(
      `Invalid repository format: ${repoString}. Expected format: "owner/repo", "owner/repo:branch", or "https://github.com/owner/repo/tree/branch"`
    );
  }

  return {
    owner,
    repo,
    branch,
  };
}

// Format repo display name
export function formatRepoDisplay(
  owner: string,
  repo: string,
  branch?: string | null
): string {
  if (branch) {
    return `${owner}/${repo} (${branch})`;
  }
  return `${owner}/${repo}`;
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random string for tokens
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Export formatter functions
export * from './formatter';
