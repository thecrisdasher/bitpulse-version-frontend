import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface ModificationData {
  field: string
  oldValue: any
  newValue: any
}

interface RequestBody {
  modifications: ModificationData[]
  reason: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const positionId = params.id
    const body: RequestBody = await request.json()
    const { modifications, reason } = body

    if (!modifications || !Array.isArray(modifications) || modifications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionaron modificaciones' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'La razón de la modificación es obligatoria' },
        { status: 400 }
      )
    }

    // Verificar que la posición existe y pertenece a un cliente asignado al maestro
    // Primero obtener los IDs de estudiantes asignados
    const assignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: user.id },
      select: { userId: true }
    })
    
    const assignedUserIds = assignments.map(a => a.userId)
    
    const position = await prisma.tradePosition.findFirst({
      where: {
        id: positionId,
        userId: { in: assignedUserIds } // Solo posiciones de clientes asignados
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
            // Email removido por privacidad para maestros
          }
        }
      }
    })

    if (!position) {
      return NextResponse.json(
        { success: false, message: 'Posición no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      )
    }

    // Campos permitidos para modificación por maestros
    const allowedFields = [
      'currentPrice',
      'stopLoss', 
      'takeProfit',
      'openPrice',
      'amount',
      'leverage',
      'stake',
      'durationValue',
      'durationUnit'
    ]

    // Validar que todos los campos sean permitidos
    for (const modification of modifications) {
      if (!allowedFields.includes(modification.field)) {
        return NextResponse.json(
          { success: false, message: `Campo '${modification.field}' no permitido para modificación` },
          { status: 400 }
        )
      }
    }

    // Preparar los datos de actualización
    const updateData: any = {}
    
    for (const modification of modifications) {
      const { field, newValue } = modification
      
      // Validaciones específicas por campo
      if (field === 'currentPrice' || field === 'stopLoss' || field === 'takeProfit' || 
          field === 'openPrice' || field === 'amount' || field === 'leverage' || field === 'stake') {
        if (typeof newValue !== 'number' || newValue <= 0) {
          return NextResponse.json(
            { success: false, message: `Valor inválido para ${field}` },
            { status: 400 }
          )
        }
      }
      
      if (field === 'leverage' && (newValue < 1 || newValue > 1000)) {
        return NextResponse.json(
          { success: false, message: 'El apalancamiento debe estar entre 1 y 1000' },
          { status: 400 }
        )
      }

      if (field === 'durationValue' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'El valor de duración debe ser un número positivo' },
          { status: 400 }
        )
      }

      if (field === 'durationUnit' && typeof newValue !== 'string') {
        return NextResponse.json(
          { success: false, message: 'La unidad de duración debe ser una cadena válida' },
          { status: 400 }
        )
      }

      updateData[field] = newValue
    }

    // Usar transacción para actualizar la posición y registrar las modificaciones
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar la posición
      const updatedPosition = await tx.tradePosition.update({
        where: { id: positionId },
        data: updateData
      })

      // Registrar cada modificación en el historial
      const modificationRecords = modifications.map(modification => ({
        positionId,
        modifiedBy: user.id,
        modifiedByName: `${user.firstName} ${user.lastName}` || user.email || 'Maestro',
        field: modification.field,
        oldValue: JSON.stringify(modification.oldValue),
        newValue: JSON.stringify(modification.newValue),
        reason: reason.trim(),
        timestamp: new Date()
      }))

      await tx.positionModification.createMany({
        data: modificationRecords
      })

      return updatedPosition
    })

    return NextResponse.json({
      success: true,
      message: 'Posición modificada correctamente',
      data: result
    })

  } catch (error) {
    console.error('Error al modificar posición (maestro):', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 