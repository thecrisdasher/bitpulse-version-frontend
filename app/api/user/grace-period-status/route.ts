import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        adminApprovalRequired: true,
        adminApproved: true,
        adminApprovalRequestedAt: true,
        adminApprovalExpiresAt: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Si no requiere aprobación o ya está aprobado, no está en periodo de gracia
    if (!user.adminApprovalRequired || user.adminApproved) {
      return NextResponse.json({
        isInGracePeriod: false,
        isApproved: user.adminApproved || !user.adminApprovalRequired,
        daysRemaining: 0,
        hoursRemaining: 0,
        approvalExpiresAt: null
      });
    }

    // Calcular tiempo restante
    const now = new Date();
    const expiresAt = user.adminApprovalExpiresAt;
    
    if (!expiresAt) {
      return NextResponse.json({
        isInGracePeriod: false,
        isApproved: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        approvalExpiresAt: null
      });
    }

    const timeRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const isInGracePeriod = timeRemaining > 0 && user.isActive;

    return NextResponse.json({
      isInGracePeriod,
      isApproved: false,
      daysRemaining: Math.max(0, daysRemaining),
      hoursRemaining: Math.max(0, hoursRemaining),
      approvalExpiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estado del periodo de gracia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 