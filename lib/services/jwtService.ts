import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { AUTH_CONFIG, ROLE_PERMISSIONS } from '../config/auth';
import { SecurityUtils } from '../utils/security';
import type { JWTPayload as CustomJWTPayload, RefreshTokenPayload, User, UserRole } from '../types/auth';

/**
 * Servicio JWT para manejo seguro de tokens
 */
export class JWTService {
  private static readonly JWT_SECRET = new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET);
  private static readonly ISSUER = 'bitpulse-trading';
  private static readonly AUDIENCE = 'bitpulse-users';

  /**
   * Convierte tiempo de expiración a segundos
   */
  public static parseExpirationTime(duration: string): number {
    const matches = duration.match(/^(\d+)([hdm])$/);
    if (!matches) throw new Error('Formato de duración inválido');

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      default: throw new Error('Unidad de tiempo no soportada');
    }
  }

  /**
   * Genera un access token JWT
   */
  static async generateAccessToken(user: User): Promise<string> {
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const jti = SecurityUtils.generateUniqueId();

    const payload: CustomJWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(AUTH_CONFIG.JWT_EXPIRES_IN),
      jti
    };

    return await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(AUTH_CONFIG.JWT_EXPIRES_IN)
      .setIssuer(this.ISSUER)
      .setAudience(this.AUDIENCE)
      .sign(this.JWT_SECRET);
  }

  /**
   * Genera un refresh token JWT
   */
  static async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = SecurityUtils.generateUniqueId();

    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN)
    };

    return await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN)
      .setIssuer(this.ISSUER)
      .setAudience(this.AUDIENCE)
      .sign(this.JWT_SECRET);
  }

  /**
   * Verifica y decodifica un JWT
   */
  static async verifyToken(token: string): Promise<CustomJWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.JWT_SECRET, {
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
      });

      return payload as unknown as CustomJWTPayload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Verifica un refresh token
   */
  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.JWT_SECRET, {
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
      });

      return payload as unknown as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Decodifica un JWT sin verificación (para inspección)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un token está próximo a expirar
   */
  static isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000;
    const thresholdTime = Date.now() + (thresholdMinutes * 60 * 1000);

    return expirationTime <= thresholdTime;
  }

  /**
   * Genera tokens de acceso y refresh para un usuario
   */
  static async generateTokenPair(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id)
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(AUTH_CONFIG.JWT_EXPIRES_IN)
    };
  }

  /**
   * Invalida un token agregándolo a una blacklist (implementar con Redis en producción)
   */
  static async invalidateToken(jti: string): Promise<void> {
    // Por ahora simulamos con localStorage en el cliente
    // En producción, esto debería usar Redis o una base de datos
    if (typeof window !== 'undefined') {
      const blacklist = JSON.parse(localStorage.getItem('token_blacklist') || '[]');
      blacklist.push(jti);
      localStorage.setItem('token_blacklist', JSON.stringify(blacklist));
    }
  }

  /**
   * Verifica si un token está en la blacklist
   */
  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    // Por ahora simulamos con localStorage en el cliente
    // En producción, esto debería usar Redis o una base de datos
    if (typeof window !== 'undefined') {
      const blacklist = JSON.parse(localStorage.getItem('token_blacklist') || '[]');
      return blacklist.includes(jti);
    }
    return false;
  }

  /**
   * Valida la estructura de un JWT
   */
  static validateTokenStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      // Verificar que cada parte sea base64url válido
      parts.forEach(part => {
        Buffer.from(part, 'base64url');
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  static async getUserFromToken(token: string): Promise<{
    userId: string;
    email: string;
    role: UserRole;
    permissions: string[];
  } | null> {
    try {
      const payload = await this.verifyToken(token);
      
      // Verificar si el token está en blacklist
      if (await this.isTokenBlacklisted(payload.jti)) {
        throw new Error('Token invalidado');
      }

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      };
    } catch {
      return null;
    }
  }

  /**
   * Genera un token temporal para verificación de email o reset de password
   */
  static async generateTemporaryToken(
    userId: string, 
    purpose: 'email_verification' | 'password_reset',
    expirationMinutes: number = 30
  ): Promise<string> {
    const payload = {
      sub: userId,
      purpose,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (expirationMinutes * 60)
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expirationMinutes}m`)
      .setIssuer(this.ISSUER)
      .setAudience(this.AUDIENCE)
      .sign(this.JWT_SECRET);
  }

  /**
   * Verifica un token temporal
   */
  static async verifyTemporaryToken(
    token: string, 
    expectedPurpose: 'email_verification' | 'password_reset'
  ): Promise<{ userId: string; purpose: string }> {
    try {
      const { payload } = await jwtVerify(token, this.JWT_SECRET, {
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
      });

      if (payload.purpose !== expectedPurpose) {
        throw new Error('Propósito del token no coincide');
      }

      return {
        userId: payload.sub as string,
        purpose: payload.purpose as string
      };
    } catch (error) {
      throw new Error('Token temporal inválido o expirado');
    }
  }
} 