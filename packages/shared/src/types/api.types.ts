import { DbCommit, DbRepository } from './commit.types';
import { User } from './auth.types';

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Repository API
export interface RepositoryListResponse {
  repositories: DbRepository[];
  total: number;
}

export interface RepositoryCreateRequest {
  repoString: string; // "owner/repo" or "owner/repo:branch"
}

export interface RepositoryUpdateRequest {
  branch?: string;
}

// Commit API
export interface CommitListRequest {
  page?: number;
  limit?: number;
  repositoryId?: number;
  authorEmail?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CommitListResponse {
  commits: DbCommit[];
  total: number;
}

// Stats API
export interface DashboardStats {
  totalRepos: number;
  totalCommits: number;
  commitsLast24h: number;
  commitsLast7d: number;
  commitsLast30d: number;
  topAuthors: {
    author_email: string;
    author_name: string;
    commit_count: number;
  }[];
  commitsByRepo: {
    repository_id: number;
    repo_string: string;
    commit_count: number;
  }[];
  commitsByDay: {
    date: string;
    count: number;
  }[];
}

// User API
export interface UserListResponse {
  users: User[];
  total: number;
}

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  password?: string;
  role?: string;
}

// Health check
export interface HealthResponse {
  status: 'ok' | 'error';
  database: boolean;
  github: {
    connected: boolean;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: Date;
    };
  };
  telegram: {
    connected: boolean;
    botUsername?: string;
  };
}
