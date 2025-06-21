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

    // Obtener las posiciones de los clientes asignados al maestro
    // Buscar asignaciones de mentor primero
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

    const positions = await prisma.tradePosition.findMany({
      where: {
        userId: { in: assignedUserIds }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
            // Email y otros datos sensibles no incluidos para maestros
          }
        }
      },
      orderBy: {
        openTime: 'desc'
      }
    })

    // Formatear los datos para el frontend (sin información sensible)
    const formattedPositions = positions.map(position => ({
      id: position.id,
      userId: position.userId,
      userName: `${position.user.firstName} ${position.user.lastName}`,
      // userEmail removido por privacidad para maestros
      instrument: position.instrument,
      direction: position.direction,
      openPrice: position.openPrice,
      currentPrice: position.currentPrice,
      amount: position.amount,
      leverage: position.leverage,
      openTime: position.openTime.toISOString(),
      profit: position.profit,
      status: position.status,
      stopLoss: position.stopLoss,
      takeProfit: position.takeProfit,
      stake: position.stake,
      durationValue: position.durationValue,
      durationUnit: position.durationUnit
    }))

    return NextResponse.json({
      success: true,
      data: formattedPositions
    })

  } catch (error) {
    console.error('Error al obtener posiciones del maestro:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 