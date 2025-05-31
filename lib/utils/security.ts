import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AUTH_CONFIG } from '../config/auth';

/**
 * Utilidades de seguridad para la aplicación
 */

export class SecurityUtils {
  /**
   * Hashea una contraseña usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, AUTH_CONFIG.PASSWORD.SALT_ROUNDS);
  }

  /**
   * Verifica una contraseña contra su hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Genera un token seguro aleatorio
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera un CSRF token
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(AUTH_CONFIG.CSRF.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Valida la fuerza de una contraseña
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Longitud mínima
    if (password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
      errors.push(`La contraseña debe tener al menos ${AUTH_CONFIG.PASSWORD.MIN_LENGTH} caracteres`);
    } else {
      score += 1;
    }

    // Mayúsculas
    if (AUTH_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    } else {
      score += 1;
    }

    // Minúsculas
    if (AUTH_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    } else {
      score += 1;
    }

    // Números
    if (AUTH_CONFIG.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    } else {
      score += 1;
    }

    // Caracteres especiales
    if (AUTH_CONFIG.PASSWORD.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un caracter especial');
    } else {
      score += 1;
    }

    // Bonificaciones por complejidad adicional
    if (password.length >= 12) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 5)
    };
  }

  /**
   * Sanitiza input del usuario para prevenir XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Valida formato de email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }

  /**
   * Genera un ID único
   */
  static generateUniqueId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Extrae información del device del User-Agent
   */
  static parseUserAgent(userAgent: string): {
    device: string;
    browser: string;
    os: string;
  } {
    const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';
    
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { device, browser, os };
  }

  /**
   * Encripta datos sensibles usando AES-256-GCM
   */
  static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }

  /**
   * Desencripta datos usando AES-256-GCM
   */
  static decrypt(encryptedText: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de datos encriptados inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Genera un hash de sesión
   */
  static generateSessionHash(userId: string, userAgent: string, ip: string): string {
    const data = `${userId}:${userAgent}:${ip}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Valida si una IP está en una lista de IPs permitidas
   */
  static isIPAllowed(ip: string, allowedIPs: string[] = []): boolean {
    if (allowedIPs.length === 0) return true;
    return allowedIPs.includes(ip);
  }

  /**
   * Genera un código de verificación numérico
   */
  static generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  /**
   * Calcula el tiempo de expiración basado en configuración
   */
  static calculateExpirationTime(duration: string): Date {
    const now = new Date();
    const matches = duration.match(/^(\d+)([hdm])$/);
    
    if (!matches) {
      throw new Error('Formato de duración inválido');
    }
    
    const value = parseInt(matches[1]);
    const unit = matches[2];
    
    switch (unit) {
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
    }
    
    return now;
  }
} 