import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { combineMiddlewares, RateLimiter, sanitizeHeaders, validateJSON } from '@/lib/middleware/authMiddleware';
import { SecurityUtils } from '@/lib/utils/security';
import type { LoginCredentials } from '@/lib/types/auth';

/**
 * API Route para login de usuarios
 * POST /api/auth/login
 */

async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email y contraseña son requeridos',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const credentials: LoginCredentials = {
      email: SecurityUtils.sanitizeInput(body.email).toLowerCase(),
      password: body.password, // No sanitizar contraseña
      rememberMe: body.rememberMe || false
    };

    // Obtener información del cliente
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIP || 'unknown';

    // Intentar login
    const result = await AuthService.login(credentials, userAgent, ip);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Configurar cookie segura con el refresh token
    const response = NextResponse.json(result);
    
    if (result.data?.tokens.refreshToken) {
      response.cookies.set('refresh_token', result.data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Aplicar middlewares
export const POST = combineMiddlewares(
  sanitizeHeaders,
  validateJSON,
  RateLimiter.middleware(10, 15 * 60 * 1000) // 10 intentos por 15 minutos
)(handleLogin); 