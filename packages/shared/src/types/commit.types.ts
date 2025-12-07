export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface CommitData {
  author: CommitAuthor;
  message: string;
  url: string;
}

export interface Commit {
  sha: string;
  commit: CommitData;
  html_url: string;
  author?: {
    login: string;
  };
}

export interface RepoConfig {
  owner: string;
  repo: string;
  branch?: string;
  repoString: string; // Full string with branch: "owner/repo" or "owner/repo:branch"
}

// Database models
export interface DbCommit {
  id: number;
  sha: string;
  repository_id: number;
  author_name: string;
  author_email: string;
  message: string;
  commit_date: Date;
  html_url: string;
  notified_at: Date;
}

export interface DbRepository {
  id: number;
  repo_string: string;
  owner: string;
  repo: string;
  branch: string | null;
  last_check_time: Date;
  created_at: Date;
  updated_at: Date;
}
