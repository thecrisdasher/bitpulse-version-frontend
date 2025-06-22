import { z } from 'zod';
import type { UserRole, Permission } from '@/lib/config/auth';

/**
 * Tipos para el sistema de autenticación
 */
export type { UserRole, Permission };

export interface User {
  id: string;
  username: string;
  twoFactorEnabled: boolean;
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

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

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
  recaptchaToken?: string;
}

export interface RegisterData {
  username: string;
  recaptchaToken: string;
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
  mustChangePassword?: boolean; // Indica si debe cambiar contraseña en primer login
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

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['cliente', 'admin', 'maestro']),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLogin: z.string().optional(),
  isActive: z.boolean(),
  profilePicture: z.string().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  pejecoins: z.number(),
  twoFactorEnabled: z.boolean(),
});

export const JWTPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.enum(['cliente', 'admin', 'maestro']),
  permissions: z.array(z.string()),
  mustChangePassword: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string(),
});

export const RefreshTokenPayloadSchema = z.object({
  sub: z.string(),
  tokenId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type LoginResponse = {
  success: boolean;
  // ... existing code ...
}; 