import { JWTService } from './jwtService';
import { SecurityUtils } from '../utils/security';
import { logger } from '../logging/logger';
import type { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthTokens, 
  ApiResponse,
  UserRole 
} from '../types/auth';
import { prisma } from '@/lib/db';
import type { RefreshTokenPayload } from '../types/auth';
// import type { User as DBUser } from '@prisma/client'; // commented out due to TS import errors

/**
 * Servicio de autenticación para gestionar usuarios y sesiones
 * NOTA: Esta es una implementación simulada para desarrollo
 * En producción debería conectarse a una base de datos real
 */

/**
 * Convertir un usuario de Prisma al tipo User de manera segura
 */
function convertPrismaUserToUser(dbUser: any): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    role: dbUser.role,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    lastLogin: dbUser.lastLogin?.toISOString(),
    isActive: dbUser.isActive,
    profilePicture: dbUser.profilePicture || undefined,
    preferences: dbUser.preferences && 
      typeof dbUser.preferences === 'object' && 
      !Array.isArray(dbUser.preferences) && 
      dbUser.preferences !== null && 
      typeof dbUser.preferences !== 'string' && 
      typeof dbUser.preferences !== 'number' && 
      typeof dbUser.preferences !== 'boolean'
      ? dbUser.preferences as Record<string, any> 
      : undefined,
    pejecoins: dbUser.pejecoins,
    twoFactorEnabled: Boolean(dbUser.twoFactorSecret)
  };
}

export class AuthService {
  /**
   * Autenticar usuario con email y contraseña
   */
  static async login(
    credentials: LoginCredentials,
    userAgent: string,
    ip: string
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      logger.logAuth('info', 'login', true, { email: credentials.email });
      // Buscar usuario en DB
      const dbUser = await prisma.user.findUnique({ where: { email: credentials.email } });
      if (!dbUser || !dbUser.isActive) {
        return { success: false, message: 'Email o contraseña incorrectos', timestamp: new Date().toISOString() };
      }
      // Verificar contraseña
      const isPasswordValid = await SecurityUtils.verifyPassword(credentials.password, dbUser.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Email o contraseña incorrectos', timestamp: new Date().toISOString() };
      }
      // Actualizar lastLogin
      const updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() }
      });
      // Generar tokens
      const tokens = await JWTService.generateTokenPair(updatedUser as any);
      // Persistir refresh token en DB
      const decoded = await JWTService.verifyRefreshToken(tokens.refreshToken);
      await prisma.refreshToken.create({
        data: {
          id: decoded.tokenId,
          token: tokens.refreshToken,
          userId: updatedUser.id,
          expiresAt: new Date(decoded.exp * 1000)
        }
      });
      // Mapear usuario para respuesta (sin password)
      const user = convertPrismaUserToUser(updatedUser);
      return { success: true, data: { user, tokens: { ...tokens, tokenType: 'Bearer' } }, message: 'Login exitoso', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('auth', 'Login error', error as Error, { email: credentials.email });
      return { success: false, message: 'Error interno del servidor', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Generar un nombre de usuario único
   */
  static async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;

    // Verificar si el username base está disponible
    while (await prisma.user.findUnique({ where: { username } })) {
      // Si no está disponible, agregar un número al final
      const suffix = counter.toString();
      const maxBaseLength = 20 - suffix.length;
      username = baseUsername.substring(0, maxBaseLength) + suffix;
      counter++;
      
      // Evitar bucle infinito
      if (counter > 9999) {
        throw new Error('No se pudo generar un nombre de usuario único');
      }
    }

    return username;
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(data: RegisterData): Promise<ApiResponse<{ user: User }>> {
    try {
      // Validar existencia
      const exists = await prisma.user.findUnique({ where: { email: data.email } });
      if (exists) {
        return { success: false, message: 'El email ya está registrado', timestamp: new Date().toISOString() };
      }
      if (data.password !== data.confirmPassword) {
        return { success: false, message: 'Las contraseñas no coinciden', timestamp: new Date().toISOString() };
      }
      const pwdStrength = SecurityUtils.validatePasswordStrength(data.password);
      if (!pwdStrength.isValid) {
        return { success: false, message: pwdStrength.errors.join(', '), errors: { password: pwdStrength.errors }, timestamp: new Date().toISOString() };
      }

      // Generar username único basado en el username proporcionado
      const uniqueUsername = await this.generateUniqueUsername(data.username);

      const hashed = await SecurityUtils.hashPassword(data.password);
      
      // Configurar fechas de aprobación
      const now = new Date();
      const approvalExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días
      
      const newUser = await prisma.user.create({
        data: {
        username: uniqueUsername,
        email: data.email,
          password: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
          role: 'cliente',
          pejecoins: 1000,
          emailConfirmed: true, // Se confirma automáticamente
          adminApprovalRequired: true,
          adminApprovalRequestedAt: now,
          adminApprovalExpiresAt: approvalExpiresAt,
          adminApproved: false
        }
      });
      const responseUser: User = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
        isActive: newUser.isActive,
        pejecoins: newUser.pejecoins,
        twoFactorEnabled: false
      };
      return { success: true, data: { user: responseUser }, message: 'Usuario registrado exitosamente', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('auth', 'Register error', error as Error, { email: data.email });
      return { success: false, message: 'Error interno del servidor', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Obtener perfil de usuario por token
   */
  static async getUserProfile(token: string): Promise<ApiResponse<User>> {
    try {
      const payload = await JWTService.verifyToken(token);
      const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!dbUser) return { success: false, message: 'Usuario no encontrado', timestamp: new Date().toISOString() };
      const user = convertPrismaUserToUser(dbUser);
      return { success: true, data: user, timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('auth', 'Get profile error', error as Error);
      return { success: false, message: 'Token inválido o expirado', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<ApiResponse<User>> {
    try {
      const dbUser = await prisma.user.update({ where: { id: userId }, data: { ...updates as any } });
      logger.logUserActivity('profile_updated', userId, { updatedFields: Object.keys(updates) });
      const user = convertPrismaUserToUser(dbUser);
      return { success: true, data: user, message: 'Perfil actualizado exitosamente', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('auth', 'Update profile error', error as Error, { userId });
      return { success: false, message: 'Error interno del servidor', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(token: string): Promise<ApiResponse> {
    try {
      const payload = await JWTService.verifyToken(token);
      // Invalidar todos los refresh tokens del usuario
      await prisma.refreshToken.updateMany({ where: { userId: payload.sub }, data: { isActive: false } });
      logger.logAuth('info', 'logout', true, { email: payload.email });
      return { success: true, message: 'Logout exitoso', timestamp: new Date().toISOString() };
    } catch {
      return { success: true, message: 'Logout exitoso', timestamp: new Date().toISOString() };
    }
  }

  /**
   * Verificar si un usuario existe
   */
  static async userExists(email: string, username?: string): Promise<boolean> {
    const user = await prisma.user.findFirst({ where: { OR: [{ email }, ...(username ? [{ username }] : [])] } });
    return !!user;
  }

  /**
   * Obtener todos los usuarios (solo para admin)
   */
  static async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({ where: { isActive: true } }) as any[];
    return users.map((u: any) => convertPrismaUserToUser(u));
  }
} 