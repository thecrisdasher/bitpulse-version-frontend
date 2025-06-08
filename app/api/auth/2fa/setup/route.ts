import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    await prisma.user.update({
      where: { email },
      data: { twoFactorSecret: secret } as any
    });

    // Build otpauth URL for scanning
    const otpauthUrl = authenticator.keyuri(email, 'BitPulse', secret);

    return NextResponse.json({ success: true, data: { otpauthUrl }, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('⚠️ 2FA setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al configurar 2FA' },
      { status: 500 }
    );
  }
} 