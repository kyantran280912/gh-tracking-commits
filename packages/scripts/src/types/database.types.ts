export interface DatabaseSchema {
  notifiedCommits: string[]; // Array of commit SHAs that have been notified
  lastCheck: string; // ISO 8601 timestamp of last check
  repositories: {
    [key: string]: {
      lastCommitSha?: string;
      lastCheckTime: string;
    };
  };
}

export const defaultDatabase: DatabaseSchema = {
  notifiedCommits: [],
  lastCheck: new Date(0).toISOString(), // Start from epoch
  repositories: {},
};
