import type {
  ApiResponse,
  PaginatedResponse,
  DbRepository,
  DbCommit,
  DashboardStats,
  User,
  LoginRequest,
  RegisterRequest,
  RepositoryCreateRequest,
  CommitListRequest,
} from '@repo/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Load token from localStorage if in browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async login(data: LoginRequest) {
    const response = await this.request<
      ApiResponse<{ user: User; token: string }>
    >('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(data: RegisterRequest) {
    const response = await this.request<
      ApiResponse<{ user: User; token: string }>
    >('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<ApiResponse<User>>('/api/auth/me');
  }

  // ============================================
  // REPOSITORY ENDPOINTS
  // ============================================

  async getRepositories(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request<PaginatedResponse<DbRepository>>(
      `/api/repositories${query ? `?${query}` : ''}`
    );
  }

  async getRepository(id: number) {
    return this.request<ApiResponse<DbRepository>>(`/api/repositories/${id}`);
  }

  async createRepository(data: RepositoryCreateRequest) {
    return this.request<ApiResponse<DbRepository>>('/api/repositories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRepository(id: number, data: { branch?: string }) {
    return this.request<ApiResponse<DbRepository>>(`/api/repositories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRepository(id: number) {
    return this.request<ApiResponse<void>>(`/api/repositories/${id}`, {
      method: 'DELETE',
    });
  }

  async testRepositoryNotifications() {
    return this.request<
      ApiResponse<{
        reposProcessed: number;
        messagesSent: number;
        errors: Array<{ repo: string; error: string }>;
      }>
    >('/api/repositories/test-notifications', {
      method: 'POST',
    });
  }

  // ============================================
  // COMMIT ENDPOINTS
  // ============================================

  async getCommits(params?: CommitListRequest) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.repositoryId)
      queryParams.set('repositoryId', params.repositoryId.toString());
    if (params?.authorEmail) queryParams.set('authorEmail', params.authorEmail);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const query = queryParams.toString();
    return this.request<PaginatedResponse<DbCommit>>(
      `/api/commits${query ? `?${query}` : ''}`
    );
  }

  async getCommit(sha: string) {
    return this.request<ApiResponse<DbCommit>>(`/api/commits/${sha}`);
  }

  // ============================================
  // STATS ENDPOINTS
  // ============================================

  async getStats() {
    return this.request<ApiResponse<DashboardStats>>('/api/stats');
  }

  // ============================================
  // HEALTH ENDPOINT
  // ============================================

  async checkHealth() {
    return this.request<any>('/api/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
