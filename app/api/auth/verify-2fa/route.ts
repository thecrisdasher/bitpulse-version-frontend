import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { prisma } from '@/lib/db';
import { SecurityUtils } from '@/lib/utils/security';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, token } = body;
    // Validate input
    if (!email || !password || !token) {
      return NextResponse.json(
        { success: false, message: 'Email, contraseña y código 2FA son requeridos' },
        { status: 400 }
      );
    }
    
    // Fetch user and check for secret
    const userRecord = (await prisma.user.findUnique({ where: { email } })) as any;
    if (!userRecord || !userRecord.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA no configurado' },
        { status: 400 }
      );
    }

    // Verify password
    const validPassword = await SecurityUtils.verifyPassword(password, userRecord.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verify TOTP code
    const codeValid = authenticator.check(token, userRecord.twoFactorSecret);
    if (!codeValid) {
      return NextResponse.json(
        { success: false, message: 'Código de autenticación 2FA inválido' },
        { status: 401 }
      );
    }

    // Delegate to AuthService to generate tokens
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIP || 'unknown';

    const result = await AuthService.login({ email, password }, userAgent, ip);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Ensure data is present
    if (!result.data) {
      return NextResponse.json(
        { success: false, message: 'Error interno al generar tokens 2FA' },
        { status: 500 }
      );
    }

    // Build response with cookies
    const { user, tokens } = result.data;
    const response = NextResponse.json(
      { success: true, message: 'Login con 2FA exitoso', data: result.data, timestamp: new Date().toISOString() }
    );

    // Set session cookies
    response.cookies.set('bitpulse_session', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    response.cookies.set('user_info', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('❌ 2FA verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al verificar 2FA' },
      { status: 500 }
    );
  }
} 