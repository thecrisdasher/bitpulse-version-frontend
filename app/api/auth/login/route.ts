import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { SecurityUtils } from '@/lib/utils/security';
import type { LoginCredentials } from '@/lib/types/auth';

/**
 * API Route para login de usuarios
 * POST /api/auth/login
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔐 Login attempt started');

    // Parse del body
    let body;
    try {
      body = await request.json();
      console.log('📝 Body parsed successfully', { email: body.email });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de datos inválido',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    const { email, password } = body as LoginCredentials;
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email y contraseña son requeridos',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    console.log('🔍 Attempting login with:', { email });

    // Obtener información del cliente
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIP || 'unknown';

    // Intentar login usando el servicio
    const result = await AuthService.login({ email, password }, userAgent, ip);
    console.log('🎯 Login result:', { success: result.success, message: result.message });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    console.log('✅ Login successful, sending response');

    // Crear la respuesta con cookies de sesión
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: result.data,
      timestamp: new Date().toISOString()
    });

    // Establecer cookies para que el middleware pueda acceder al token
    if (result.data?.tokens?.accessToken) {
      // Cookie principal para el middleware
      response.cookies.set('bitpulse_session', result.data.tokens.accessToken, {
        httpOnly: true, // Accesible solo desde servidor (seguridad)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/'
      });

      // Cookie del refresh token
      response.cookies.set('refresh_token', result.data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/'
      });

      // Cookie adicional para información del usuario (accesible desde cliente)
      response.cookies.set('user_info', JSON.stringify({
        id: result.data.user.id,
        email: result.data.user.email,
        role: result.data.user.role,
        firstName: result.data.user.firstName
      }), {
        httpOnly: false, // Accesible desde cliente
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', 
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    
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