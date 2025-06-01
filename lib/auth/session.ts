import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from '@/lib/config/auth';
import type { User, AuthTokens, JWTPayload, Session } from '@/lib/types/auth';

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
 * Crear un token JWT seguro
 */
export async function createJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 horas
  const jti = crypto.randomUUID(); // JWT ID único para invalidación

  return new SignJWT({
    ...payload,
    iat: now,
    exp,
    jti
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(secret);
}

/**
 * Verificar y decodificar un token JWT
 */
export async function verifyJWTToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Verificar que el token no haya expirado
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Crear una sesión de usuario y establecer cookies seguras
 */
export async function createUserSession(user: User): Promise<AuthTokens> {
  'use server';
  
  const accessToken = await createJWTToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: [] // Se llenarán desde ROLE_PERMISSIONS
  });

  // Crear refresh token (válido por más tiempo)
  const refreshToken = await createJWTToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: []
  });

  const tokens: AuthTokens = {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 horas en segundos
    tokenType: 'Bearer'
  };

  // Establecer cookie de sesión segura
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CONFIG.name, accessToken, COOKIE_CONFIG.options);

  // Registrar la sesión (en producción esto iría a una base de datos)
  await logSession({
    userId: user.id,
    token: accessToken,
    action: 'session_created'
  });

  return tokens;
}

/**
 * Obtener la sesión actual desde las cookies
 */
export async function getCurrentSession(): Promise<JWTPayload | null> {
  'use server';
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_CONFIG.name)?.value;

    if (!sessionToken) {
      return null;
    }

    const payload = await verifyJWTToken(sessionToken);
    
    if (payload) {
      // Registrar actividad de la sesión
      await logSession({
        userId: payload.sub,
        token: sessionToken,
        action: 'session_accessed'
      });
    }

    return payload;
  } catch (error) {
    console.error('Error getting current session:', error);
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
      const payload = await verifyJWTToken(sessionToken);
      if (payload) {
        await logSession({
          userId: payload.sub,
          token: sessionToken,
          action: 'session_destroyed'
        });
      }
    }

    // Limpiar todas las cookies de autenticación
    cookieStore.delete(COOKIE_CONFIG.name);
    cookieStore.delete('auth_tokens');
    
    // Nota: No limpiar las preferencias del usuario al cerrar sesión
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}

/**
 * Renovar token de sesión
 */
export async function refreshUserSession(refreshToken: string): Promise<AuthTokens | null> {
  'use server';
  
  try {
    const payload = await verifyJWTToken(refreshToken);
    
    if (!payload) {
      return null;
    }

    // Crear nuevo access token
    const newAccessToken = await createJWTToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions
    });

    const tokens: AuthTokens = {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Mantener el mismo refresh token
      expiresIn: 24 * 60 * 60,
      tokenType: 'Bearer'
    };

    // Actualizar cookie de sesión
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_CONFIG.name, newAccessToken, COOKIE_CONFIG.options);

    await logSession({
      userId: payload.sub,
      token: newAccessToken,
      action: 'session_refreshed'
    });

    return tokens;
  } catch (error) {
    console.error('Error refreshing session:', error);
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

    return await verifyJWTToken(token);
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
    const payload = await verifyJWTToken(token);
    
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