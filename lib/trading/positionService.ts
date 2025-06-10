import { prisma } from '@/lib/db';
import type { User } from '@/lib/types/auth';
import type { TradePosition } from '@/lib/types/trading';
import { v4 as uuidv4 } from 'uuid';

/**
 * Valida si un usuario tiene suficientes fondos para abrir una posición.
 * @param user - El objeto de usuario autenticado.
 * @param positionData - Los datos de la posición que se intenta abrir.
 * @returns Un objeto que indica si la posición es válida y un mensaje de error si no lo es.
 */
export async function validatePosition(
  user: User, 
  positionData: TradePosition
): Promise<{ isValid: boolean; message?: string }> {
  
  const requiredCapital = positionData.amount;

  if (user.pejecoins < requiredCapital) {
    return {
      isValid: false,
      message: `Fondos insuficientes. Necesitas ${requiredCapital.toFixed(2)} Pejecoins, pero solo tienes ${user.pejecoins.toFixed(2)}.`,
    };
  }

  // Aquí se podrían añadir otras validaciones (ej. límites de apalancamiento, etc.)

  return { isValid: true };
}

/**
 * Crea una nueva posición y actualiza el saldo del usuario.
 * (Actualmente guarda en la base de datos simulada en memoria).
 * @param positionData - Los datos validados de la nueva posición.
 * @returns La posición recién creada.
 */
export async function createPosition(positionData: TradePosition): Promise<any> {
  // 1. Descontar el capital del saldo del usuario
  const user = await prisma.user.findUnique({ where: { id: positionData.userId } });
  
  if (!user) {
    throw new Error('Usuario no encontrado al crear la posición.');
  }

  const newBalance = user.pejecoins - positionData.amount;
  await prisma.user.update({
    where: { id: user.id },
    data: { pejecoins: newBalance },
  });

  // 2.a Registrar transacción de PejeCoins por apertura de posición
  await prisma.pejeCoinTransaction.create({
    data: {
      fromUserId: user.id,
      toUserId: user.id,
      amount: positionData.amount,
      concept: 'trade_open',
      timestamp: new Date(),
      status: 'completed',
      referenceId: positionData.id
    }
  });

  // 2. Crear la posición en la base de datos con solo los campos requeridos
  const newPosition = await prisma.tradePosition.create({
    data: {
      id: uuidv4(),
      userId: positionData.userId,
      instrument: positionData.instrumentName,
      direction: positionData.direction === 'up' ? 'long' : 'short',
      marketColor: positionData.marketColor,
      stake: positionData.stake,
      durationValue: positionData.duration.value,
      durationUnit: positionData.duration.unit,
      openPrice: positionData.openPrice,
      currentPrice: positionData.openPrice, // Inicialmente igual al precio de apertura
      amount: positionData.amount,
      leverage: positionData.leverage ?? 0,
      capitalFraction: positionData.capitalFraction,
      lotSize: positionData.lotSize,
      marginRequired: positionData.marginRequired,
      positionValue: positionData.positionValue,
      status: positionData.status,
      openTime: new Date(positionData.openTimestamp),
    },
  });

  // 2.b Registrar actividad de usuario
  await prisma.userActivity.create({
    data: {
      userId: user.id,
      action: 'position_opened',
      details: positionData as any,
      timestamp: new Date()
    }
  });

  // 3. Devolver la posición creada
  return newPosition;
} 