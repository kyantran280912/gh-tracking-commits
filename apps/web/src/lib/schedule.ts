// Schedule calculation utilities for GitHub Actions cron job
// Cron expression: 0 */3 * * * (every 3 hours at minute 0)

// UTC hours when the cron job runs
const CRON_HOURS = [0, 3, 6, 9, 12, 15, 18, 21] as const;

/**
 * Get the next scheduled sync time based on cron schedule
 */
export function getNextSyncTime(): Date {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Find next sync hour (must be strictly after current hour)
  let nextHour = CRON_HOURS.find((h) => h > utcHour);

  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);

  if (nextHour === undefined) {
    // Next sync is tomorrow at 00:00 UTC
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0);
  } else {
    next.setUTCHours(nextHour);
  }

  return next;
}

/**
 * Get the last scheduled sync time based on cron schedule
 */
export function getLastSyncTime(): Date {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Find the last sync hour that has already passed
  const reversedHours = [...CRON_HOURS].reverse();
  const lastHour = reversedHours.find((h) => h <= utcHour);

  const last = new Date(now);
  last.setUTCMinutes(0, 0, 0);

  if (lastHour === undefined) {
    // Last sync was yesterday at 21:00 UTC
    last.setUTCDate(last.getUTCDate() - 1);
    last.setUTCHours(21);
  } else {
    last.setUTCHours(lastHour);
  }

  return last;
}

/**
 * Format time difference as relative string (for future times)
 */
export function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffMinutes < 0) {
    return 'now';
  }

  if (diffHours === 0) {
    return `${diffMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${diffHours}h`;
  }

  return `${diffHours}h ${remainingMinutes}m`;
}

/**
 * Format time ago as relative string (for past times)
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffHours === 0) {
    return `${diffMinutes}m ago`;
  }

  if (remainingMinutes === 0) {
    return `${diffHours}h ago`;
  }

  return `${diffHours}h ${remainingMinutes}m ago`;
}
