/**
 * Esquema de la base de datos para BitPulse Trading
 * Define las tablas necesarias para usuarios, autenticación y trading
 */

export type UserRole = 'cliente' | 'admin' | 'maestro';

export interface User {
  id: string;
  email: string;
  password: string; // Almacenar siempre hasheado
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  profilePicture?: string;
  preferences?: Record<string, any>;
  pejecoins: number; // Saldo de pejecoins para prácticas
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
}

export interface PejeCoinTransaction {
  id: string;
  fromUserId: string | null; // null si es una asignación del sistema
  toUserId: string;
  amount: number;
  concept: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  referenceId?: string; // ID de referencia para operaciones relacionadas
}

export interface TradePosition {
  id: string;
  userId: string;
  instrument: string; // Ej. "BTC/USD"
  direction: 'long' | 'short'; // Compra o venta
  openPrice: number;
  currentPrice: number;
  amount: number; // Cantidad de pejecoins invertidos
  leverage: number;
  openTime: Date;
  closeTime?: Date;
  profit?: number; // Ganancia o pérdida actual
  status: 'open' | 'closed' | 'liquidated';
  stopLoss?: number;
  takeProfit?: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string; // login, trade, pejecoin_transfer, etc.
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Define los permisos disponibles en el sistema
export const Permissions = {
  // Permisos generales
  VIEW_DASHBOARD: 'view_dashboard',
  TRADE: 'trade',
  VIEW_PORTFOLIO: 'view_portfolio',
  
  // Permisos de administrador
  MANAGE_USERS: 'manage_users',
  ASSIGN_PEJECOINS: 'assign_pejecoins',
  VIEW_LOGS: 'view_logs',
  
  // Permisos de maestro
  CREATE_COURSES: 'create_courses',
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENT_PROGRESS: 'view_student_progress'
};

// Define los permisos asignados a cada rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  cliente: [
    Permissions.VIEW_DASHBOARD,
    Permissions.TRADE,
    Permissions.VIEW_PORTFOLIO
  ],
  admin: [
    Permissions.VIEW_DASHBOARD,
    Permissions.TRADE,
    Permissions.VIEW_PORTFOLIO,
    Permissions.MANAGE_USERS,
    Permissions.ASSIGN_PEJECOINS,
    Permissions.VIEW_LOGS,
    Permissions.CREATE_COURSES,
    Permissions.MANAGE_STUDENTS,
    Permissions.VIEW_STUDENT_PROGRESS
  ],
  maestro: [
    Permissions.VIEW_DASHBOARD,
    Permissions.TRADE,
    Permissions.VIEW_PORTFOLIO,
    Permissions.CREATE_COURSES,
    Permissions.MANAGE_STUDENTS,
    Permissions.VIEW_STUDENT_PROGRESS
  ]
}; 