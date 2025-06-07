import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from '@/lib/config/auth';
import type { User, AuthTokens, JWTPayload, Session } from '@/lib/types/auth';
import { JWTService } from '@/lib/services/jwtService';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sistema de gestión de sesiones seguras con cookies HttpOnly
 */

const secret = new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET);

// Configuración de cookies de sesión
const COOKIE_CONFIG = {
  name: AUTH_CONFIG.SESSION.COOKIE_NAME,
  options: {
    httpOnly: AUTH_CONFIG.SESSION.HTTP_ONLY,
    secure: AUTH_CONFIG.SESSION.SECURE,
    sameSite: AUTH_CONFIG.SESSION.SAME_SITE,
    maxAge: AUTH_CONFIG.SESSION.COOKIE_MAX_AGE,
    path: '/',
  }
} as const;

// Configuración de cookies para preferencias del usuario
const USER_PREFERENCES_COOKIE = {
  name: 'bitpulse_preferences',
  options: {
    httpOnly: false, // Accesible desde el cliente para preferencias
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 año
    path: '/',
  }
} as const;

/**
 * Crear una sesión de usuario y establecer cookies seguras
 */
export async function createUserSession(user: User): Promise<AuthTokens> {
  'use server';

  const { accessToken, refreshToken, expiresIn } = await JWTService.generateTokenPair(user);

  // Almacenar el refresh token en la base de datos
  const expiresAt = new Date(Date.now() + JWTService.parseExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN) * 1000);
  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  // Establecer cookie de sesión segura para el access token
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CONFIG.name, accessToken, {
    ...COOKIE_CONFIG.options,
    maxAge: expiresIn, // Usar el tiempo de expiración del token
  });

  // Opcional: También se podría guardar el refresh token en una cookie HttpOnly
  // cookies().set('refresh_token', refreshToken, ...);

  await logSession({
    userId: user.id,
    token: accessToken,
    action: 'session_created',
  });

  return { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' };
}

/**
 * Obtener la sesión actual desde las cookies
 */
export async function getCurrentSession(): Promise<JWTPayload | null> {
  'use server';

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_CONFIG.name)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const payload = await JWTService.verifyToken(sessionToken);

    // Opcional: Verificar si el token está en blacklist
    // if (await JWTService.isTokenBlacklisted(payload.jti)) {
    //   await destroyUserSession(); // Invalidar sesión si el token está en la lista negra
    //   return null;
    // }

    await logSession({
      userId: payload.sub,
      token: sessionToken,
      action: 'session_accessed',
    });

    return payload;
  } catch (error) {
    console.error('Error getting current session:', error);
    // Si el token es inválido (expirado, etc.), limpiar la cookie
    await destroyUserSession();
    return null;
  }
}

/**
 * Invalidar sesión y limpiar cookies
 */
export async function destroyUserSession(): Promise<void> {
  'use server';
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_CONFIG.name)?.value;

    if (sessionToken) {
      try {
        const payload = await JWTService.decodeToken(sessionToken);
        if (payload && payload.sub) {
          await logSession({
            userId: payload.sub,
            token: sessionToken,
            action: 'session_destroyed',
          });
          // Invalidar todos los refresh tokens asociados al usuario
          await prisma.refreshToken.updateMany({
            where: { userId: payload.sub },
            data: { isActive: false },
          });
        }
      } catch (e) {
        // Ignorar errores si el token es inválido
      }
    }

    // Limpiar todas las cookies de autenticación
    cookieStore.delete(COOKIE_CONFIG.name);
    cookieStore.delete('refresh_token'); // Asegurarse de limpiar también esta
    
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}

/**
 * Renovar token de sesión usando un refresh token
 */
export async function refreshUserSession(refreshToken: string): Promise<AuthTokens | null> {
  'use server';

  try {
    // 1. Verificar y encontrar el refresh token en la BD
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken, isActive: true },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      // Si el token no existe, está inactivo o expiró, invalidar todos los tokens del usuario
      if (storedToken) {
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isActive: false },
        });
      }
      await destroyUserSession(); // Limpiar cookies
      return null;
    }

    // 2. Invalidar el refresh token usado
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isActive: false },
    });

    // 3. Generar un nuevo par de tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = await JWTService.generateTokenPair(storedToken.user);

    // 4. Guardar el nuevo refresh token en la BD
    const newExpiresAt = new Date(Date.now() + JWTService.parseExpirationTime(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN) * 1000);
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: newExpiresAt,
      },
    });

    // 5. Actualizar la cookie de sesión con el nuevo access token
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_CONFIG.name, newAccessToken, {
      ...COOKIE_CONFIG.options,
      maxAge: expiresIn,
    });

    await logSession({
      userId: storedToken.userId,
      token: newAccessToken,
      action: 'session_refreshed',
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    await destroyUserSession();
    return null;
  }
}

/**
 * Establecer preferencias del usuario en cookies
 */
export async function setUserPreferences(preferences: Record<string, any>): Promise<void> {
  'use server';
  
  try {
    const cookieStore = await cookies();
    const preferencesString = JSON.stringify(preferences);
    
    cookieStore.set(
      USER_PREFERENCES_COOKIE.name, 
      preferencesString, 
      USER_PREFERENCES_COOKIE.options
    );

    // Log de cambio de preferencias
    const session = await getCurrentSession();
    if (session) {
      await logUserActivity({
        userId: session.sub,
        action: 'preferences_updated',
        details: { preferences }
      });
    }
  } catch (error) {
    console.error('Error setting user preferences:', error);
  }
}

/**
 * Obtener preferencias del usuario desde cookies
 */
export async function getUserPreferences(): Promise<Record<string, any> | null> {
  'use server';
  
  try {
    const cookieStore = await cookies();
    const preferencesString = cookieStore.get(USER_PREFERENCES_COOKIE.name)?.value;
    
    if (!preferencesString) {
      return null;
    }

    return JSON.parse(preferencesString);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Crear sesión desde request (para middleware)
 */
export async function createSessionFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    // Intentar obtener token desde cookie
    let token = request.cookies.get(COOKIE_CONFIG.name)?.value;
    
    // Si no hay cookie, intentar desde header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    return await JWTService.verifyToken(token);
  } catch (error) {
    console.error('Error creating session from request:', error);
    return null;
  }
}

/**
 * Agregar headers de seguridad a la respuesta
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy básico
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  return response;
}

/**
 * Registrar actividad de sesión (para logs)
 */
async function logSession(data: {
  userId: string;
  token: string;
  action: 'session_created' | 'session_accessed' | 'session_destroyed' | 'session_refreshed';
}): Promise<void> {
  try {
    // En desarrollo, log simple
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [SESSION LOG]', {
        userId: data.userId,
        action: data.action,
        timestamp: new Date().toISOString(),
        tokenPrefix: data.token.substring(0, 20) + '...'
      });
    }

    // TODO: En producción, enviar a sistema de logs real
  } catch (error) {
    console.error('Error logging session:', error);
  }
}

/**
 * Registrar actividad del usuario (para logs)
 */
async function logUserActivity(data: {
  userId: string;
  action: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 [USER ACTIVITY]', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }

    // TODO: En producción, enviar a sistema de logs real
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

/**
 * Validar integridad de la sesión
 */
export async function validateSessionIntegrity(token: string): Promise<boolean> {
  try {
    const payload = await JWTService.verifyToken(token);
    
    if (!payload) {
      return false;
    }

    // Verificaciones adicionales de seguridad
    const now = Math.floor(Date.now() / 1000);
    
    // Verificar que el token no haya expirado
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Verificar que no sea muy antiguo (más de 24 horas)
    if (payload.iat && (now - payload.iat) > (24 * 60 * 60)) {
      return false;
    }

    // TODO: En producción, verificar contra lista de tokens revocados

    return true;
  } catch (error) {
    console.error('Error validating session integrity:', error);
    return false;
  }
} 