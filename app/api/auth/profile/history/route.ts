import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/profile/history - Obtener historial de cambios del perfil
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener sesión
    const session = await createSessionFromRequest(request as any);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No autorizado', 
        timestamp: new Date().toISOString() 
      }, { status: 401 });
    }

    // Obtener historial de cambios del usuario (últimos 50 cambios)
    const history = await prisma.profileChangeHistory.findMany({
      where: {
        userId: session.sub
      },
      orderBy: {
        changedAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        field: true,
        oldValue: true,
        newValue: true,
        changedAt: true,
        ipAddress: true,
      }
    });

    // Formatear los datos para el frontend
    const formattedHistory = history.map(change => ({
      id: change.id,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      changedAt: change.changedAt.toISOString(),
      ipAddress: change.ipAddress,
      // Traducir nombres de campos al español
      fieldName: getFieldDisplayName(change.field),
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedHistory, 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Error fetching profile history:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor', 
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}

// Función helper para traducir nombres de campos
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    bio: 'Biografía',
  };
  
  return fieldNames[field] || field;
} 