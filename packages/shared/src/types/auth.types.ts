export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  userId: number;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}
