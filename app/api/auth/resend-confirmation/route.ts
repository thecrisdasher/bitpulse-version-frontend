import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { sendConfirmationEmail } from '@/lib/services/emailService';

// In-memory rate limiter per email
const resendMap = new Map<string, number>();
const RESEND_LIMIT_MS = 60 * 1000; // 1 minuto

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await request.json() as { email: string };
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email es requerido' },
        { status: 400 }
      );
    }
    const now = Date.now();
    const last = resendMap.get(email) || 0;
    if (now - last < RESEND_LIMIT_MS) {
      return NextResponse.json(
        { success: false, message: 'Espere antes de reenviar' },
        { status: 429 }
      );
    }
    // Generar nuevo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
    // Guardar en DB
    await (prisma.user as any).update({
      where: { email },
      data: { emailConfirmationToken: token, emailConfirmationExpiresAt: expiresAt }
    });
    // Enviar email
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm?token=${token}`;
    await sendConfirmationEmail(email, confirmUrl);
    resendMap.set(email, now);
    return NextResponse.json(
      { success: true, message: 'Correo de confirmación reenviado' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno al reenviar' },
      { status: 500 }
    );
  }
} 