import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/positions
 * Obtiene todas las posiciones de trading para administradores y maestros
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y autorización
    const { user } = await getAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin o maestro
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Se requiere rol de administrador o maestro.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const userId = url.searchParams.get('userId');

    // Construir filtros
    const filters: any = {};
    
    if (status !== 'all') {
      filters.status = status;
    }
    
    if (userId) {
      filters.userId = userId;
    }

    // Si es maestro, solo puede ver posiciones de sus estudiantes asignados
    if (user.role === 'maestro') {
      // Obtener IDs de estudiantes asignados
      const assignments = await prisma.mentorAssignment.findMany({
        where: { mentorId: user.id },
        select: { userId: true }
      });
      
      const assignedUserIds = assignments.map(a => a.userId);
      
      if (assignedUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No hay estudiantes asignados'
        });
      }
      
      filters.userId = { in: assignedUserIds };
    }

    // Obtener posiciones con información del usuario
    const positions = await prisma.tradePosition.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { openTime: 'desc' }
    });

    // Mapear los datos para el frontend
    const mappedPositions = positions.map(position => ({
      id: position.id,
      userId: position.userId,
      userName: `${position.user.firstName} ${position.user.lastName}`,
      userEmail: position.user.email,
      instrument: position.instrument,
      direction: position.direction,
      openPrice: position.openPrice,
      currentPrice: position.currentPrice,
      amount: position.amount,
      leverage: position.leverage,
      openTime: position.openTime.toISOString(),
      closeTime: position.closeTime?.toISOString(),
      profit: position.profit,
      status: position.status,
      stopLoss: position.stopLoss,
      takeProfit: position.takeProfit,
      stake: position.stake,
      durationValue: position.durationValue,
      durationUnit: position.durationUnit,
      marketColor: position.marketColor
    }));

    return NextResponse.json({
      success: true,
      data: mappedPositions,
      total: mappedPositions.length
    });

  } catch (error) {
    console.error('[API_ADMIN_POSITIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 