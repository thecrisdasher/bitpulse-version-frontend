/**
 * Tipos para el sistema de autenticación
 */

export type UserRole = 'cliente' | 'admin' | 'maestro';

export type Permission = 
  | 'view_dashboard'
  | 'trade'
  | 'view_portfolio'
  | 'manage_users'
  | 'assign_pejecoins'
  | 'view_logs'
  | 'create_courses'
  | 'manage_students'
  | 'view_student_progress';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  profilePicture?: string;
  preferences?: Record<string, any>;
  pejecoins: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  jti: string; // JWT ID para invalidación
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface LoginAttempt {
  ip: string;
  userAgent: string;
  email: string;
  timestamp: Date;
  success: boolean;
  failureReason?: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface PejecoinTransaction {
  id: string;
  fromUserId?: string; // Si es null, es una asignación de admin
  toUserId: string;
  amount: number;
  type: 'assignment' | 'transfer' | 'trading_profit' | 'trading_loss' | 'admin_adjustment';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  adminId?: string; // ID del admin que realizó la transacción
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
} 