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
    const userRecord = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!userRecord || !userRecord.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA no configurado' },
        { status: 400 }
      );
    }
    const validPassword = await SecurityUtils.verifyPassword(password, userRecord.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }
    const codeValid = authenticator.check(token, userRecord.twoFactorSecret);
    if (!codeValid) {
      return NextResponse.json(
        { success: false, message: 'Código 2FA inválido' },
        { status: 401 }
      );
    }
    await prisma.user.update({ where: { id: session.sub }, data: { twoFactorEnabled: true } });
    return NextResponse.json({ success: true, message: '2FA activado' });
  } catch (error) {
    console.error('❌ 2FA enable error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al activar 2FA' },
      { status: 500 }
    );
  }
} 