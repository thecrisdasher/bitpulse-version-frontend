import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/positions/[id]/modify
 * Permite a administradores y maestros modificar valores de posiciones de trading
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID de posición requerido' },
        { status: 400 }
      );
    }

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

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();
    const { modifications, reason } = body;

    if (!modifications || !Array.isArray(modifications) || modifications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Se requieren modificaciones válidas' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Se requiere una razón para la modificación' },
        { status: 400 }
      );
    }

    // Obtener la posición actual
    const position = await prisma.tradePosition.findFirst({
      where: { id },
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
    });

    if (!position) {
      return NextResponse.json(
        { success: false, message: 'Posición no encontrada' },
        { status: 404 }
      );
    }

    // Si es maestro, verificar que la posición pertenezca a un estudiante asignado
    if (user.role === 'maestro') {
      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: user.id,
          userId: position.userId
        }
      });

      if (!assignment) {
        return NextResponse.json(
          { success: false, message: 'No tienes permisos para modificar esta posición' },
          { status: 403 }
        );
      }
    }

    // Verificar que la posición esté abierta
    if (position.status !== 'open') {
      return NextResponse.json(
        { success: false, message: 'Solo se pueden modificar posiciones abiertas' },
        { status: 400 }
      );
    }

    // Procesar modificaciones en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      const modificationRecords = [];

      // Procesar cada modificación
      for (const mod of modifications) {
        const { field, oldValue, newValue } = mod;

        // Validar campos permitidos
        const allowedFields = [
          'currentPrice', 'stopLoss', 'takeProfit', 'amount', 
          'leverage', 'status', 'stake', 'durationValue', 'durationUnit'
        ];
        if (!allowedFields.includes(field)) {
          throw new Error(`Campo '${field}' no permitido para modificación`);
        }

        // Validar que el valor anterior coincida con el actual
        const currentValue = (position as any)[field];
        if (currentValue !== oldValue) {
          throw new Error(`El valor anterior de '${field}' no coincide con el valor actual`);
        }

        // Validar el nuevo valor según el tipo de campo
        if (['currentPrice', 'stopLoss', 'takeProfit', 'amount', 'leverage', 'stake'].includes(field)) {
          if (typeof newValue !== 'number' || newValue <= 0) {
            throw new Error(`Valor inválido para '${field}': ${newValue}`);
          }
        } else if (field === 'durationValue') {
          if (typeof newValue !== 'number' || newValue <= 0 || !Number.isInteger(newValue)) {
            throw new Error(`Valor de duración inválido: ${newValue}. Debe ser un número entero positivo`);
          }
        } else if (field === 'durationUnit') {
          if (!['minute', 'hour', 'day'].includes(newValue)) {
            throw new Error(`Unidad de duración inválida: ${newValue}. Debe ser 'minute', 'hour' o 'day'`);
          }
        } else if (field === 'status') {
          if (!['open', 'closed', 'liquidated'].includes(newValue)) {
            throw new Error(`Estado inválido: ${newValue}. Debe ser 'open', 'closed' o 'liquidated'`);
          }
        }

        // Validaciones específicas por campo
        if (field === 'stopLoss' && position.direction === 'long' && newValue >= position.openPrice) {
          throw new Error('El stop loss para posiciones largas debe ser menor al precio de apertura');
        }
        
        if (field === 'stopLoss' && position.direction === 'short' && newValue <= position.openPrice) {
          throw new Error('El stop loss para posiciones cortas debe ser mayor al precio de apertura');
        }
        
        if (field === 'takeProfit' && position.direction === 'long' && newValue <= position.openPrice) {
          throw new Error('El take profit para posiciones largas debe ser mayor al precio de apertura');
        }
        
        if (field === 'takeProfit' && position.direction === 'short' && newValue >= position.openPrice) {
          throw new Error('El take profit para posiciones cortas debe ser menor al precio de apertura');
        }

        // Validaciones adicionales para nuevos campos
        if (field === 'leverage' && (newValue < 1 || newValue > 1000)) {
          throw new Error('El apalancamiento debe estar entre 1 y 1000');
        }

        if (field === 'amount' && newValue < 1) {
          throw new Error('El monto debe ser mayor a 1');
        }

        // Si se modifica el estado a 'closed' o 'liquidated', verificar que la posición esté abierta
        if (field === 'status' && ['closed', 'liquidated'].includes(newValue) && position.status !== 'open') {
          throw new Error('Solo se pueden cerrar o liquidar posiciones que estén abiertas');
        }

        // Agregar al objeto de actualización
        updateData[field] = newValue;

        // Crear registro de modificación
        modificationRecords.push({
          positionId: position.id,
          modifiedBy: user.id,
          modifiedByName: `${user.firstName} ${user.lastName}`,
          field,
          oldValue,
          newValue,
          reason: reason.trim(),
          timestamp: new Date()
        });
      }

      // Recalcular profit si se modificó el precio actual o el monto
      if (updateData.currentPrice || updateData.amount) {
        const newCurrentPrice = updateData.currentPrice || position.currentPrice;
        const newAmount = updateData.amount || position.amount;
        const priceChange = newCurrentPrice - position.openPrice;
        const directionMultiplier = position.direction === 'long' ? 1 : -1;
        const profitLoss = (priceChange * directionMultiplier * newAmount) / position.openPrice;
        updateData.profit = profitLoss;
      }

      // Si se cambia el estado a 'closed' o 'liquidated', establecer la fecha de cierre
      if (updateData.status && ['closed', 'liquidated'].includes(updateData.status)) {
        updateData.closeTime = new Date();
      }

      // Actualizar la posición
      const updatedPosition = await tx.tradePosition.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      // Crear registros de modificación
      for (const modRecord of modificationRecords) {
        await tx.positionModification.create({
          data: modRecord
        });
      }

      // Registrar actividad del usuario
      await tx.userActivity.create({
        data: {
          userId: user.id,
          action: 'position_modified',
          details: {
            positionId: position.id,
            targetUserId: position.userId,
            targetUserEmail: position.user.email,
            modifications: modifications,
            reason: reason.trim()
          } as any,
          timestamp: new Date()
        }
      });

      return updatedPosition;
    });

    return NextResponse.json({
      success: true,
      message: 'Posición modificada exitosamente',
      data: {
        id: result.id,
        modifications: modifications.length,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('[API_ADMIN_MODIFY_POSITION_ERROR]', error);
    
    // Manejar errores específicos de la aplicación
    if (error instanceof Error && error.message.includes('no coincide') || 
        error instanceof Error && error.message.includes('inválido') ||
        error instanceof Error && error.message.includes('debe ser')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 