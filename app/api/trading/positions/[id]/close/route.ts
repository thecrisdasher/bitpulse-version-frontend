import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/trading/positions/[id]/close
 * Liquida una posición abierta: calcula la PnL, actualiza el saldo del usuario
 * y marca la posición como cerrada.
 * Espera en el body: { closePrice: number, profit?: number, amount: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 });
  }

  // Autenticación
  const { user } = await getAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const closePrice = typeof body.closePrice === 'number' ? body.closePrice : null;
    const clientProfit = typeof body.profit === 'number' ? body.profit : null;
    const amount = typeof body.amount === 'number' ? body.amount : null;

    // Obtener la posición
    const position = await prisma.tradePosition.findFirst({ where: { id, userId: user.id } });
    if (!position) {
      return NextResponse.json({ success: false, message: 'Posición no encontrada' }, { status: 404 });
    }

    if (position.status !== 'open') {
      return NextResponse.json({ success: false, message: 'La posición ya está cerrada' }, { status: 400 });
    }

    // Determinar el precio de cierre
    const finalPrice = closePrice ?? position.currentPrice;

    // Calcular beneficio
    const directionFactor = position.direction === 'long' ? 1 : -1;
    const priceDiff = (finalPrice - position.openPrice) * directionFactor;
    const stake = amount ?? position.amount;
    const profit = clientProfit !== null ? clientProfit : (priceDiff / position.openPrice) * stake;

    // Actualizar posición y saldo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Marcar posición como cerrada y guardar PnL
      await tx.tradePosition.update({
        where: { id },
        data: {
          status: 'closed',
          closeTime: new Date(),
          currentPrice: finalPrice,
          profit
        }
      });

      // 2. Actualizar saldo del usuario: devolver capital + profit
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          pejecoins: { increment: stake + profit }
        },
        select: { id: true, pejecoins: true, firstName: true, lastName: true, email: true, role: true }
      });

      // 3. Registrar transacción
      await tx.pejeCoinTransaction.create({
        data: {
          fromUserId: user.id,
          toUserId: user.id,
          amount: stake + profit,
          concept: 'trade_close',
          timestamp: new Date(),
          status: 'completed',
          referenceId: id
        }
      });

      return updatedUser;
    });

    return NextResponse.json({ success: true, newBalance: result.pejecoins, user: result });
  } catch (error) {
    console.error('[CLOSE_POSITION_ERROR]', error);
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 });
  }
} 