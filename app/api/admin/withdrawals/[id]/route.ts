import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface UpdateWithdrawalRequest {
  action: 'approve' | 'reject' | 'process'
  adminNotes?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y autorización de admin
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Solo para administradores.' },
        { status: 403 }
      )
    }

    const withdrawalId = params.id
    const body: UpdateWithdrawalRequest = await request.json()
    const { action, adminNotes } = body

    if (!action || !['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Acción inválida' },
        { status: 400 }
      )
    }

    // Buscar la solicitud de retiro
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            pejecoins: true
          }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Solicitud de retiro no encontrada' },
        { status: 404 }
      )
    }

    // Determinar el nuevo estado y realizar acciones específicas
    let newStatus: 'pending' | 'approved' | 'rejected' | 'processed'
    let shouldDeductBalance = false
    let shouldRestoreBalance = false
    let notificationTitle = ''
    let notificationBody = ''

    switch (action) {
      case 'approve':
        if (withdrawal.status !== 'pending') {
          return NextResponse.json(
            { success: false, message: 'Solo se pueden aprobar solicitudes pendientes' },
            { status: 400 }
          )
        }
        newStatus = 'approved'
        shouldDeductBalance = true // Descontar saldo al aprobar
        notificationTitle = 'Retiro aprobado'
        notificationBody = `Tu solicitud de retiro por $${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ha sido aprobada y está siendo procesada.`
        break

      case 'reject':
        if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
          return NextResponse.json(
            { success: false, message: 'Solo se pueden rechazar solicitudes pendientes o aprobadas' },
            { status: 400 }
          )
        }
        newStatus = 'rejected'
        // Si se está rechazando una solicitud aprobada, devolver el saldo
        shouldRestoreBalance = withdrawal.status === 'approved'
        notificationTitle = 'Retiro rechazado'
        notificationBody = withdrawal.status === 'approved' 
          ? `Tu solicitud de retiro por $${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ha sido rechazada. El monto ha sido devuelto a tu cuenta.`
          : `Tu solicitud de retiro por $${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ha sido rechazada.`
        break

      case 'process':
        if (withdrawal.status !== 'approved') {
          return NextResponse.json(
            { success: false, message: 'Solo se pueden marcar como procesadas las solicitudes aprobadas' },
            { status: 400 }
          )
        }
        newStatus = 'processed'
        notificationTitle = 'Retiro procesado'
        notificationBody = `Tu retiro por $${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ha sido procesado exitosamente.`
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Acción no válida' },
          { status: 400 }
        )
    }

    // Verificar saldo suficiente si se va a aprobar
    if (shouldDeductBalance) {
      if (withdrawal.amount > withdrawal.user.pejecoins) {
        return NextResponse.json(
          { success: false, message: 'El usuario no tiene saldo suficiente para procesar este retiro' },
          { status: 400 }
        )
      }
    }

    // Realizar la transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar la solicitud de retiro
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: newStatus,
          processedAt: new Date(),
          processedBy: user.id,
          adminNotes: adminNotes || withdrawal.adminNotes
        }
      })

      // Descontar pejecoins si se está aprobando
      if (shouldDeductBalance) {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            pejecoins: {
              decrement: withdrawal.amount
            }
          }
        })
      }

      // Restaurar pejecoins si es necesario (en caso de rechazo de solicitud aprobada)
      if (shouldRestoreBalance) {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            pejecoins: {
              increment: withdrawal.amount
            }
          }
        })
      }

      // Crear notificación para el usuario
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: notificationTitle,
          body: notificationBody,
          link: '/settings?tab=withdrawal'
        }
      })

      // Registrar la actividad del admin
      await tx.userActivity.create({
        data: {
          userId: user.id,
          action: `withdrawal_${action}`,
          details: {
            withdrawalId,
            targetUserId: withdrawal.userId,
            amount: withdrawal.amount,
            adminNotes,
            timestamp: new Date().toISOString()
          }
        }
      })

      return updatedWithdrawal
    })

    return NextResponse.json({
      success: true,
      message: `Solicitud de retiro ${action === 'approve' ? 'aprobada' : action === 'reject' ? 'rechazada' : 'marcada como procesada'} exitosamente`,
      data: {
        id: result.id,
        status: result.status,
        processedAt: result.processedAt,
        processedBy: result.processedBy,
        adminNotes: result.adminNotes
      }
    })

  } catch (error) {
    console.error('Error updating withdrawal:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    const withdrawalId = params.id

    // Los usuarios solo pueden ver sus propias solicitudes, los admins pueden ver todas
    const whereClause: any = { id: withdrawalId }
    if (user.role !== 'admin') {
      whereClause.userId = user.id
    }

    const withdrawal = await prisma.withdrawal.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true
          }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Solicitud de retiro no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: withdrawal
    })

  } catch (error) {
    console.error('Error fetching withdrawal details:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 