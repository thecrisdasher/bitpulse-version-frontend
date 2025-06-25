import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { prisma } from '@/lib/db';
import { SecurityUtils } from '@/lib/utils/security';
import { createSessionFromRequest } from '@/lib/auth/session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await createSessionFromRequest(request as any);
    if (!session) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const userRecord = await prisma.user.findUnique({ 
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        firstName: true,
        lastName: true
      }
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!userRecord.twoFactorEnabled || !userRecord.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA no está activado' },
        { status: 400 }
      );
    }

    // Verificar contraseña actual
    const validPassword = await SecurityUtils.verifyPassword(password, userRecord.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Verificar código 2FA
    const codeValid = authenticator.check(token, userRecord.twoFactorSecret);
    if (!codeValid) {
      return NextResponse.json(
        { success: false, message: 'Código 2FA inválido' },
        { status: 401 }
      );
    }

    // Desactivar 2FA
    await prisma.user.update({ 
      where: { id: session.sub }, 
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null // Eliminar el secreto también por seguridad
      } 
    });

    // Registrar actividad del usuario
    await prisma.userActivity.create({
      data: {
        userId: userRecord.id,
        action: '2fa_disabled',
        details: {
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'Unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 'unknown'
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: '2FA desactivado exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 2FA disable error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al desactivar 2FA' },
      { status: 500 }
    );
  }
} 