import { Commit } from '../types/commit.types.js';

/**
 * Escape HTML special characters for Telegram
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a single commit notification
 */
export function formatSingleCommit(commit: Commit, repoString: string): string {
  const shortSha = commit.sha.substring(0, 7);
  const commitUrl = commit.html_url;
  const author = commit.commit.author.name;
  const message = commit.commit.message.split('\n')[0]; // First line only
  const date = new Date(commit.commit.author.date).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return `
🔔 <b>New Commit</b> trong <code>${escapeHtml(repoString)}</code>

<b>Message:</b> ${escapeHtml(message)}
<b>Author:</b> ${escapeHtml(author)}
<b>SHA:</b> <a href="${commitUrl}">${shortSha}</a>
<b>Date:</b> ${date}
  `.trim();
}

/**
 * Format a detailed commit notification
 */
export function formatDetailedCommit(commit: Commit, repoString: string): string {
  const shortSha = commit.sha.substring(0, 7);
  const commitUrl = commit.html_url;
  const author = commit.commit.author.name;
  const message = commit.commit.message;
  const [title, ...bodyLines] = message.split('\n');
  const date = new Date(commit.commit.author.date).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  let notification = `
📦 <b>${escapeHtml(repoString)}</b>
━━━━━━━━━━━━━━━━

<b>${escapeHtml(title)}</b>
`;

  // Add body if exists
  const body = bodyLines.join('\n').trim();
  if (body) {
    const truncatedBody = body.length > 200 ? body.substring(0, 200) + '...' : body;
    notification += `\n${escapeHtml(truncatedBody)}\n`;
  }

  notification += `
━━━━━━━━━━━━━━━━
👤 ${escapeHtml(author)}
🔗 <a href="${commitUrl}">${shortSha}</a>
🕐 ${date}
  `.trim();

  return notification;
}

/**
 * Format multiple commits summary
 */
export function formatMultipleCommits(commits: Commit[], repoString: string): string {
  const count = commits.length;
  const repoUrl = `https://github.com/${repoString}`;

  let message = `
📢 <b>${count} commit${count > 1 ? 's' : ''} mới</b> trong <a href="${repoUrl}">${escapeHtml(repoString)}</a>

`;

  // Show first 5 commits
  commits.slice(0, 5).forEach((commit, index) => {
    const shortSha = commit.sha.substring(0, 7);
    const title = commit.commit.message.split('\n')[0];
    const author = commit.commit.author.name;

    message += `${index + 1}. <code>${shortSha}</code> ${escapeHtml(title)}\n   by ${escapeHtml(author)}\n\n`;
  });

  if (commits.length > 5) {
    message += `... và ${commits.length - 5} commits nữa\n`;
  }

  return message.trim();
}

/**
 * Format commits by repository
 */
export function formatCommitsByRepo(commitsMap: Map<string, Commit[]>): string[] {
  const messages: string[] = [];

  for (const [repoString, commits] of commitsMap.entries()) {
    if (commits.length === 0) continue;

    if (commits.length === 1) {
      // Single commit - use detailed format
      messages.push(formatDetailedCommit(commits[0], repoString));
    } else {
      // Multiple commits - use summary format
      messages.push(formatMultipleCommits(commits, repoString));
    }
  }

  return messages;
}

/**
 * Format error notification
 */
export function formatError(error: Error, context: string): string {
  return `
❌ <b>Error</b> trong ${escapeHtml(context)}

<code>${escapeHtml(error.message)}</code>
  `.trim();
}

/**
 * Format success summary
 */
export function formatSuccessSummary(totalCommits: number, repoCount: number): string {
  if (totalCommits === 0) {
    return `
✅ <b>Tracking hoàn tất</b>

Không có commits mới từ ${repoCount} repository${repoCount > 1 ? 'ies' : ''}.
    `.trim();
  }

  return `
✅ <b>Tracking hoàn tất</b>

Đã thông báo ${totalCommits} commit${totalCommits > 1 ? 's' : ''} mới từ ${repoCount} repository${repoCount > 1 ? 'ies' : ''}.
  `.trim();
}
