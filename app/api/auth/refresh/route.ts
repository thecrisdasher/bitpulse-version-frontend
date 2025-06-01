import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/services/jwtService';
import { refreshUserSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/logger';

/**
 * API Route para renovar tokens de acceso
 * POST /api/auth/refresh
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtener refresh token desde cookies
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token requerido',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Verificar refresh token
    try {
      const payload = await JWTService.verifyRefreshToken(refreshToken);
      
      // Usar el sistema de sesiones para renovar
      const newTokens = await refreshUserSession(refreshToken);

      if (!newTokens) {
        return NextResponse.json(
          {
            success: false,
            message: 'Refresh token inválido o expirado',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      logger.logUserActivity('token_refresh_success', payload.sub, {
        timestamp: new Date().toISOString()
      });

      // Crear respuesta con nuevos tokens
      const response = NextResponse.json({
        success: true,
        data: newTokens,
        message: 'Token renovado exitosamente',
        timestamp: new Date().toISOString()
      });

      // Actualizar cookie del refresh token si es necesario
      response.cookies.set('refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: '/'
      });

      return response;

    } catch (tokenError) {
      logger.warn('auth', 'Invalid refresh token during refresh attempt', {
        error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token inválido o expirado',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    
    logger.error('auth', 'Token refresh failed', error as Error);

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