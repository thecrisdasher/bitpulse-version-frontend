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

/**
 * Servicio de autenticación para gestionar usuarios y sesiones
 * NOTA: Esta es una implementación simulada para desarrollo
 * En producción debería conectarse a una base de datos real
 */

// Simulación de base de datos en memoria
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@bitpulse.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'BitPulse',
    role: 'admin' as UserRole,
    isActive: true,
    isEmailVerified: true,
    pejecoins: 10000,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    email: 'user@bitpulse.com',
    username: 'user',
    firstName: 'Usuario',
    lastName: 'Demo',
    role: 'cliente' as UserRole,
    isActive: true,
    isEmailVerified: true,
    pejecoins: 5000,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    email: 'maestro@bitpulse.com',
    username: 'maestro',
    firstName: 'Maestro',
    lastName: 'Trading',
    role: 'maestro' as UserRole,
    isActive: true,
    isEmailVerified: true,
    pejecoins: 8000,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    email: 'cliente@bitpulse.com',
    username: 'cliente',
    firstName: 'Cliente',
    lastName: 'Demo',
    role: 'cliente' as UserRole,
    isActive: true,
    isEmailVerified: true,
    pejecoins: 3000,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Simulación de contraseñas en texto plano (TEMPORAL para testing)
const mockPasswords: Record<string, string> = {
  'admin@bitpulse.com': 'Admin123!',
  'cliente@bitpulse.com': 'Cliente123!', 
  'maestro@bitpulse.com': 'Maestro123!',
  // Mantener las anteriores para compatibilidad
  'user@bitpulse.com': '123456'
};
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
      logger.logAuth('info', 'login', true, {
        email: credentials.email
      });

      // Buscar usuario por email
      const user = mockUsers.find(u => u.email === credentials.email && u.isActive);
      
      if (!user) {
        logger.logAuth('warn', 'login', false, {
          email: credentials.email,
          failureReason: 'User not found'
        });
        
        return {
          success: false,
          message: 'Email o contraseña incorrectos',
          timestamp: new Date().toISOString()
        };
      }
      // Verificar contraseña (temporal - sin hash)
      const storedPassword = mockPasswords[credentials.email];
      const isPasswordValid = credentials.password === storedPassword;
      
      if (!isPasswordValid) {
        logger.logAuth('warn', 'login', false, {
          email: credentials.email,
          failureReason: 'Invalid password'
        });
        
        return {
          success: false,
          message: 'Email o contraseña incorrectos',
          timestamp: new Date().toISOString()
        };
      }

      // Actualizar último login
      user.lastLogin = new Date();

      // Generar tokens
      const tokens = await JWTService.generateTokenPair(user);

      logger.logAuth('info', 'login', true, {
        email: credentials.email,
        role: user.role
      });

      return {
        success: true,
        data: {
          user,
          tokens: {
            ...tokens,
            tokenType: 'Bearer' as const
          }
        },
        message: 'Login exitoso',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('auth', 'Login error', error as Error, {
        email: credentials.email
      });

      return {
        success: false,
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(data: RegisterData): Promise<ApiResponse<{ user: User }>> {
    try {
      logger.logAuth('info', 'register', true, {
        email: data.email
      });

      // Verificar si el usuario ya existe
      const existingUser = mockUsers.find(u => 
        u.email === data.email || u.username === data.username
      );

      if (existingUser) {
        const field = existingUser.email === data.email ? 'email' : 'username';
        logger.logAuth('warn', 'register', false, {
          email: data.email,
          failureReason: `Duplicate ${field}`
        });

        return {
          success: false,
          message: `El ${field === 'email' ? 'email' : 'nombre de usuario'} ya está registrado`,
          timestamp: new Date().toISOString()
        };
      }

      // Validar contraseñas coinciden
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Las contraseñas no coinciden',
          timestamp: new Date().toISOString()
        };
      }

      // Validar fuerza de contraseña
      const passwordValidation = SecurityUtils.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', '),
          errors: { password: passwordValidation.errors },
          timestamp: new Date().toISOString()
        };
      }

      // Crear nuevo usuario
      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'cliente' as UserRole, // Rol por defecto
        isActive: true,
        isEmailVerified: false,
        pejecoins: 1000, // Bonus de bienvenida
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Hashear contraseña
      const hashedPassword = await SecurityUtils.hashPassword(data.password);
      mockPasswords[data.email] = hashedPassword;

      // Agregar a "base de datos"
      mockUsers.push(newUser);

      logger.logAuth('info', 'register', true, {
        email: data.email,
        role: newUser.role
      });

      return {
        success: true,
        data: { user: newUser },
        message: 'Usuario registrado exitosamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('auth', 'Register error', error as Error, {
        email: data.email
      });

      return {
        success: false,
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener perfil de usuario por token
   */
  static async getUserProfile(token: string): Promise<ApiResponse<User>> {
    try {
      const payload = await JWTService.verifyToken(token);
      const user = mockUsers.find(u => u.id === payload.sub && u.isActive);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('auth', 'Get profile error', error as Error);
      
      return {
        success: false,
        message: 'Token inválido o expirado',
        timestamp: new Date().toISOString()
      };
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
      const userIndex = mockUsers.findIndex(u => u.id === userId && u.isActive);

      if (userIndex === -1) {
        return {
          success: false,
          message: 'Usuario no encontrado',
          timestamp: new Date().toISOString()
        };
      }

      // Actualizar usuario
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updatedAt: new Date()
      };

      logger.logUserActivity('profile_updated', userId, {
        updatedFields: Object.keys(updates)
      });

      return {
        success: true,
        data: mockUsers[userIndex],
        message: 'Perfil actualizado exitosamente',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('auth', 'Update profile error', error as Error, {
        userId
      });

      return {
        success: false,
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Logout de usuario
   */
  static async logout(token: string): Promise<ApiResponse> {
    try {
      const payload = await JWTService.verifyToken(token);
      
      logger.logAuth('info', 'logout', true, {
        email: payload.email
      });

      // En una implementación real, aquí se invalidaría el token
      // agregándolo a una blacklist o removiéndolo de la base de datos

      return {
        success: true,
        message: 'Logout exitoso',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Incluso si el token es inválido, consideramos el logout exitoso
      return {
        success: true,
        message: 'Logout exitoso',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verificar si un usuario existe
   */
  static async userExists(email: string, username?: string): Promise<boolean> {
    return mockUsers.some(u => 
      u.email === email || (username && u.username === username)
    );
  }

  /**
   * Obtener todos los usuarios (solo para admin)
   */
  static async getAllUsers(): Promise<User[]> {
    return mockUsers.filter(u => u.isActive);
  }
} 