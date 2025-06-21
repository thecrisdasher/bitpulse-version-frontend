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

    // Verificar autenticación
    const session = await getAuth(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol de administrador o maestro
    if (!['admin', 'maestro'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const { modifications, reason } = await request.json();

    if (!modifications || !Array.isArray(modifications) || modifications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionaron modificaciones' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Debe proporcionar una razón para la modificación' },
        { status: 400 }
      );
    }

    // Verificar que la posición existe y el usuario tiene acceso
    const position = await prisma.tradePosition.findFirst({
      where: {
        id: id,
        status: 'open'
      },
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
      }
    });

    if (!position) {
      return NextResponse.json(
        { success: false, message: 'Posición no encontrada o no está abierta' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol
    if (session.user.role === 'maestro') {
      // Los maestros solo pueden modificar posiciones de sus estudiantes asignados
      const mentorAssignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: session.user.id,
          userId: position.userId
        }
      });

      if (!mentorAssignment) {
        return NextResponse.json(
          { success: false, message: 'No tienes permisos para modificar esta posición' },
          { status: 403 }
        );
      }
    }

    // Campos permitidos para modificación - AMPLIADO
    const allowedFields = [
      'currentPrice', 
      'stopLoss', 
      'takeProfit', 
      'openPrice',
      'amount', 
      'leverage', 
      'stake', 
      'durationValue', 
      'durationUnit', 
      'marketColor'
    ];

    // Validar que todos los campos a modificar sean permitidos
    for (const mod of modifications) {
      if (!allowedFields.includes(mod.field)) {
        return NextResponse.json(
          { success: false, message: `Campo no permitido para modificación: ${mod.field}` },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    const modificationRecords: Array<{
      positionId: string;
      modifiedBy: string;
      modifiedByName: string;
      field: string;
      oldValue: any;
      newValue: any;
      reason: string;
    }> = [];

    for (const mod of modifications) {
      const { field, oldValue, newValue } = mod;

      // Validaciones específicas por campo - AMPLIADAS
      if (field === 'currentPrice' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'El precio actual debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'openPrice' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'El precio de apertura debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'amount' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'La cantidad debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'leverage' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'El apalancamiento debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'stake' && newValue !== null && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'El stake debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'durationValue' && (typeof newValue !== 'number' || newValue <= 0)) {
        return NextResponse.json(
          { success: false, message: 'La duración debe ser un número positivo' },
          { status: 400 }
        );
      }

      if (field === 'durationUnit' && typeof newValue !== 'string') {
        return NextResponse.json(
          { success: false, message: 'La unidad de duración debe ser texto' },
          { status: 400 }
        );
      }

      if (field === 'marketColor' && typeof newValue !== 'string') {
        return NextResponse.json(
          { success: false, message: 'El color de mercado debe ser texto' },
          { status: 400 }
        );
      }

      // Validaciones de trading para stop loss y take profit (mantener lógica existente)
      if (field === 'stopLoss' && newValue !== null) {
        if (typeof newValue !== 'number' || newValue <= 0) {
          return NextResponse.json(
            { success: false, message: 'El stop loss debe ser un número positivo' },
            { status: 400 }
          );
        }

        // Validar que el stop loss sea lógico según la dirección
        if (position.direction === 'long' && newValue >= position.currentPrice) {
          return NextResponse.json(
            { success: false, message: 'Para posiciones long, el stop loss debe ser menor al precio actual' },
            { status: 400 }
          );
        }

        if (position.direction === 'short' && newValue <= position.currentPrice) {
          return NextResponse.json(
            { success: false, message: 'Para posiciones short, el stop loss debe ser mayor al precio actual' },
            { status: 400 }
          );
        }
      }

      if (field === 'takeProfit' && newValue !== null) {
        if (typeof newValue !== 'number' || newValue <= 0) {
          return NextResponse.json(
            { success: false, message: 'El take profit debe ser un número positivo' },
            { status: 400 }
          );
        }

        // Validar que el take profit sea lógico según la dirección
        if (position.direction === 'long' && newValue <= position.currentPrice) {
          return NextResponse.json(
            { success: false, message: 'Para posiciones long, el take profit debe ser mayor al precio actual' },
            { status: 400 }
          );
        }

        if (position.direction === 'short' && newValue >= position.currentPrice) {
          return NextResponse.json(
            { success: false, message: 'Para posiciones short, el take profit debe ser menor al precio actual' },
            { status: 400 }
          );
        }
      }

      // Agregar al objeto de actualización
      updateData[field] = newValue;

      // Preparar registro de modificación
      modificationRecords.push({
        positionId: position.id,
        modifiedBy: session.user.id,
        modifiedByName: `${session.user.firstName} ${session.user.lastName}`,
        field,
        oldValue,
        newValue,
        reason: reason.trim()
      });
    }

    // Recalcular profit si se modificó el precio actual
    if (updateData.currentPrice) {
      const priceDiff = updateData.currentPrice - position.openPrice;
      const newProfit = position.direction === 'long' 
        ? priceDiff * position.amount * position.leverage
        : -priceDiff * position.amount * position.leverage;
      
      updateData.profit = newProfit;
    }

    // Usar transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // Actualizar la posición
      await tx.tradePosition.update({
        where: { id: position.id },
        data: updateData
      });

      // Crear registros de modificación
      await tx.positionModification.createMany({
        data: modificationRecords
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Posición modificada correctamente',
      modificationsCount: modifications.length
    });

  } catch (error) {
    console.error('Error modifying position:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 