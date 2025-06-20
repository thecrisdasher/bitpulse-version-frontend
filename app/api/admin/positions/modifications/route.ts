import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/positions/modifications
 * Obtiene el historial de modificaciones de posiciones para administradores y maestros
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
    const positionId = url.searchParams.get('positionId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Construir filtros
    const filters: any = {};
    
    if (positionId) {
      filters.positionId = positionId;
    }

    // Si es maestro, filtrar por posiciones de estudiantes asignados
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
          total: 0,
          message: 'No hay estudiantes asignados'
        });
      }

      // Obtener posiciones de estudiantes asignados
      const assignedPositions = await prisma.tradePosition.findMany({
        where: { userId: { in: assignedUserIds } },
        select: { id: true }
      });

      const assignedPositionIds = assignedPositions.map(p => p.id);
      
      if (assignedPositionIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: 'No hay posiciones de estudiantes asignados'
        });
      }

      filters.positionId = { in: assignedPositionIds };
    }

    // Obtener el conteo total
    const total = await prisma.positionModification.count({
      where: filters
    });

    // Obtener las modificaciones con información relacionada
    const modifications = await prisma.positionModification.findMany({
      where: filters,
      include: {
        position: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    // Mapear los datos para el frontend
    const mappedModifications = modifications.map(mod => ({
      id: mod.id,
      positionId: mod.positionId,
      modifiedBy: mod.modifiedBy,
      modifiedByName: mod.modifiedByName,
      field: mod.field,
      oldValue: mod.oldValue,
      newValue: mod.newValue,
      reason: mod.reason,
      timestamp: mod.timestamp.toISOString(),
      position: {
        id: mod.position.id,
        instrument: mod.position.instrument,
        direction: mod.position.direction,
        status: mod.position.status,
        user: {
          id: mod.position.user.id,
          name: `${mod.position.user.firstName} ${mod.position.user.lastName}`,
          email: mod.position.user.email
        }
      }
    }));

    return NextResponse.json({
      success: true,
      data: mappedModifications,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('[API_ADMIN_MODIFICATIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 