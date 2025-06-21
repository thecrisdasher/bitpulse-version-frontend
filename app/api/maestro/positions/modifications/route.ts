import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y autorización
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea maestro
    if (user.role !== 'maestro') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Solo para maestros.' },
        { status: 403 }
      )
    }

    // Obtener las modificaciones de posiciones de los clientes asignados al maestro
    // Primero obtener los IDs de estudiantes asignados
    const assignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: user.id },
      select: { userId: true }
    })
    
    const assignedUserIds = assignments.map(a => a.userId)
    
    if (assignedUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No hay estudiantes asignados'
      })
    }

    const modifications = await prisma.positionModification.findMany({
      where: {
        position: {
          userId: { in: assignedUserIds } // Solo modificaciones de clientes asignados
        }
      },
      include: {
        position: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
                // Email removido por privacidad para maestros
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Formatear los datos para el frontend
    const formattedModifications = modifications.map(mod => ({
      id: mod.id,
      positionId: mod.positionId,
      modifiedBy: mod.modifiedBy,
      modifiedByName: mod.modifiedByName,
      field: mod.field,
      oldValue: mod.oldValue ? JSON.parse(mod.oldValue as string) : null,
      newValue: mod.newValue ? JSON.parse(mod.newValue as string) : null,
      reason: mod.reason,
      timestamp: mod.timestamp.toISOString(),
      // Información adicional del cliente (sin datos sensibles)
      clientName: `${mod.position.user.firstName} ${mod.position.user.lastName}`,
      // clientEmail removido por privacidad para maestros
      instrument: mod.position.instrument
    }))

    return NextResponse.json({
      success: true,
      data: formattedModifications
    })

  } catch (error) {
    console.error('Error al obtener modificaciones del maestro:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 