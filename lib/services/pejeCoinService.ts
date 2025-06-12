import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logging/logger';
import type { PejeCoinTransaction, User } from '@/lib/db/schema';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Servicio para gestionar las transacciones de pejecoins entre usuarios
 */

export class PejeCoinService {
  /**
   * Asigna pejecoins a un usuario (solo administradores)
   */
  static async assignCoins(
    adminId: string, 
    userId: string, 
    amount: number, 
    concept: string
  ): Promise<PejeCoinTransaction> {
    try {
      // Validar que el monto sea positivo
      if (amount <= 0) {
        throw new Error('El monto debe ser un número positivo');
      }

      // En un sistema real, aquí verificaríamos si el adminId tiene permisos
      // Por ahora simulamos una transacción con éxito
      
      const txId = uuidv4();
      
      const updated = await prisma.$transaction(async (tx) => {
        // Sumar pejecoins al usuario destino
        await tx.user.update({
          where: { id: userId },
          data: { pejecoins: { increment: amount } }
        });

        const createdTx = await tx.pejeCoinTransaction.create({
          data: {
            id: txId,
            fromUserId: adminId,
            toUserId: userId,
        amount,
        concept: concept || 'Asignación de pejecoins por administrador',
        timestamp: new Date(),
            status: 'completed' as const,
            referenceId: null
          }
        });
        return createdTx;
      });
      
      logger.logUserActivity('pejeCoin_assigned', adminId, {
        toUserId: userId,
        amount,
        transactionId: updated.id
      });

      return updated as PejeCoinTransaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('user_activity', 'Failed to assign coins', error as Error);
      throw new Error(`Error al asignar pejecoins: ${message}`);
    }
  }

  /**
   * Transfiere pejecoins entre usuarios (para futuras implementaciones peer-to-peer)
   */
  static async transferCoins(
    fromUserId: string,
    toUserId: string,
    amount: number,
    concept: string
  ): Promise<PejeCoinTransaction> {
    try {
      // Validar que el monto sea positivo
      if (amount <= 0) {
        throw new Error('El monto debe ser un número positivo');
      }

      // Validar que no se transfiera a sí mismo
      if (fromUserId === toUserId) {
        throw new Error('No puedes transferir pejecoins a ti mismo');
      }

      // En un sistema real, verificaríamos el saldo disponible
      // y realizaríamos la transacción en la base de datos

      const transaction: PejeCoinTransaction = {
        id: uuidv4(),
        fromUserId,
        toUserId,
        amount,
        concept: concept || 'Transferencia entre usuarios',
        timestamp: new Date(),
        status: 'completed' as const
      };

      logger.logUserActivity('pejeCoin_transferred', fromUserId, {
        toUserId,
        amount,
        transactionId: transaction.id
      });

      return transaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('user_activity', 'Failed to transfer coins', error as Error);
      throw new Error(`Error al transferir pejecoins: ${message}`);
    }
  }

  /**
   * Obtiene el saldo actual de pejecoins de un usuario
   */
  static async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { pejecoins: true } });
      return user?.pejecoins ?? 0;
    } catch (error) {
      logger.error('user_activity', 'Failed to get user balance', error as Error);
      throw new Error('Error al obtener el saldo');
    }
  }

  /**
   * Obtiene historial de transacciones de un usuario
   */
  static async getUserTransactions(userId: string): Promise<PejeCoinTransaction[]> {
    try {
      const txs = await prisma.pejeCoinTransaction.findMany({
        where: { toUserId: userId },
        orderBy: { timestamp: 'desc' },
      });
      return txs as PejeCoinTransaction[];
    } catch (error) {
      logger.error('user_activity', 'Failed to get transaction history', error as Error);
      throw new Error('Error al obtener el historial de transacciones');
    }
  }
} 