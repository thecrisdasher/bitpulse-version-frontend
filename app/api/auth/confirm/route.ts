import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.redirect('/auth?confirmed=false&message=token_missing');
  }

  const user = await (prisma.user as any).findFirst({ where: { emailConfirmationToken: token } });
  if (!user) {
    return NextResponse.redirect('/auth?confirmed=false&message=token_invalid');
  }

  if (!user.emailConfirmationExpiresAt || user.emailConfirmationExpiresAt < new Date()) {
    return NextResponse.redirect('/auth?confirmed=false&message=token_expired');
  }

  await (prisma.user as any).update({
    where: { id: user.id },
    data: {
      emailConfirmed: true,
      emailConfirmationToken: null,
      emailConfirmationExpiresAt: null
    }
  });

  return NextResponse.redirect('/auth?confirmed=true');
} 