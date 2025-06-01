import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { JWTService } from '@/lib/services/jwtService';

/**
 * API Route para logout de usuarios
 * POST /api/auth/logout
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtener token desde header Authorization
    const authHeader = request.headers.get('authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
      // Intentar logout usando el servicio
      await AuthService.logout(token);
    }

    // Crear respuesta de logout exitoso
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso',
      timestamp: new Date().toISOString()
    });

    // Limpiar todas las cookies de sesión
    response.cookies.set('bitpulse_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expira inmediatamente
      path: '/'
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', 
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('user_info', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error during logout:', error);
    
    // Aún así retornar éxito y limpiar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout completado',
      timestamp: new Date().toISOString()
    });

    // Limpiar cookies incluso si hay error
    response.cookies.set('bitpulse_session', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_info', '', { maxAge: 0, path: '/' });

    return response;
  }
} 