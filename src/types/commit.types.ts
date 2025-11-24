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
}
