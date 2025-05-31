/**
 * Configuración de autenticación y seguridad
 */

export const AUTH_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  
  // Rate Limiting
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutos de bloqueo
  },
  
  // Session Configuration
  SESSION: {
    COOKIE_NAME: 'bitpulse_session',
    COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 horas
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
  },
  
  // Password Configuration
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    SALT_ROUNDS: 12,
  },
  
  // CSRF Protection
  CSRF: {
    SECRET: process.env.CSRF_SECRET || 'your-csrf-secret-key',
    TOKEN_LENGTH: 32,
  },
  
  // API Rate Limiting
  API_RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 100, // máximo 100 requests por ventana
  },
  
  // Default roles
  ROLES: {
    CLIENTE: 'cliente',
    ADMIN: 'admin',
    MAESTRO: 'maestro',
  } as const,
  
  // Default permissions
  PERMISSIONS: {
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_USERS: 'manage_users',
    ASSIGN_PEJECOINS: 'assign_pejecoins',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_SETTINGS: 'manage_settings',
    EDUCATE_USERS: 'educate_users',
  } as const,
} as const;

export type UserRole = typeof AUTH_CONFIG.ROLES[keyof typeof AUTH_CONFIG.ROLES];
export type Permission = typeof AUTH_CONFIG.PERMISSIONS[keyof typeof AUTH_CONFIG.PERMISSIONS];

// Mapeo de roles a permisos
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [AUTH_CONFIG.ROLES.CLIENTE]: [
    AUTH_CONFIG.PERMISSIONS.VIEW_DASHBOARD,
  ],
  [AUTH_CONFIG.ROLES.ADMIN]: [
    AUTH_CONFIG.PERMISSIONS.VIEW_DASHBOARD,
    AUTH_CONFIG.PERMISSIONS.MANAGE_USERS,
    AUTH_CONFIG.PERMISSIONS.ASSIGN_PEJECOINS,
    AUTH_CONFIG.PERMISSIONS.VIEW_ANALYTICS,
    AUTH_CONFIG.PERMISSIONS.MANAGE_SETTINGS,
  ],
  [AUTH_CONFIG.ROLES.MAESTRO]: [
    AUTH_CONFIG.PERMISSIONS.VIEW_DASHBOARD,
    AUTH_CONFIG.PERMISSIONS.VIEW_ANALYTICS,
    AUTH_CONFIG.PERMISSIONS.EDUCATE_USERS,
    AUTH_CONFIG.PERMISSIONS.ASSIGN_PEJECOINS,
  ],
}; 