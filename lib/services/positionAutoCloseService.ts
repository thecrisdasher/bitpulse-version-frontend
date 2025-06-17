/**
 * Servicio para el cierre automático de operaciones vencidas
 * Verifica y cierra posiciones que han superado su tiempo límite
 */

import { prisma } from '@/lib/db';
import { getSimulatedPrice } from '@/lib/simulator';

interface PositionCloseResult {
  positionId: string;
  profit: number;
  closePrice: number;
  userId: string;
  newBalance: number;
}

/**
 * Obtiene el precio actual de un instrumento
 * Primero intenta Binance, si falla usa simulación
 */
async function getCurrentPrice(instrument: string): Promise<number> {
  try {
    // Normalizar símbolo para Binance
    const base = instrument.includes('/') ? instrument.split('/')[0] : instrument;
    const symbol = base.toUpperCase();
    
    // Intentar obtener precio real de Binance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const price = parseFloat(data.price);
      if (!isNaN(price)) {
        return price;
      }
    }
    
    throw new Error('Binance API failed');
    
  } catch (error) {
    // Fallback a simulación
    console.warn(`[Auto-Close] Using simulated price for ${instrument}:`, error);
    return getSimulatedPrice(instrument);
  }
}

/**
 * Calcula la ganancia/pérdida de una posición
 */
function calculateProfit(
  direction: 'long' | 'short',
  openPrice: number,
  closePrice: number,
  amount: number
): number {
  let profit: number;
  
  if (direction === 'long') {
    // Compra: ganancia = (precio_cierre - precio_apertura) * cantidad
    profit = (closePrice - openPrice) * amount / openPrice;
  } else {
    // Venta: ganancia = (precio_apertura - precio_cierre) * cantidad
    profit = (openPrice - closePrice) * amount / openPrice;
  }
  
  return Math.round(profit * 100) / 100; // Redondear a 2 decimales
}

/**
 * Verifica si una posición ha vencido
 */
function isPositionExpired(
  openTime: Date,
  durationValue: number,
  durationUnit: string
): boolean {
  const now = new Date();
  const openTimestamp = openTime.getTime();
  
  let durationMs: number;
  switch (durationUnit) {
    case 'minute':
      durationMs = durationValue * 60 * 1000;
      break;
    case 'hour':
      durationMs = durationValue * 60 * 60 * 1000;
      break;
    case 'day':
      durationMs = durationValue * 24 * 60 * 60 * 1000;
      break;
    default:
      durationMs = durationValue * 60 * 60 * 1000; // Default a horas
  }
  
  return (now.getTime() - openTimestamp) >= durationMs;
}

/**
 * Cierra una posición automáticamente
 */
async function closePosition(position: any): Promise<PositionCloseResult> {
  const currentPrice = await getCurrentPrice(position.instrument);
  const profit = calculateProfit(
    position.direction,
    position.openPrice,
    currentPrice,
    position.amount
  );
  
  // Usar transacción para asegurar consistencia
  const result = await prisma.$transaction(async (tx) => {
    // 1. Actualizar la posición
    await tx.tradePosition.update({
      where: { id: position.id },
      data: {
        status: 'closed',
        closeTime: new Date(),
        currentPrice: currentPrice,
        profit: profit
      }
    });
    
    // 2. Actualizar el balance del usuario
    const user = await tx.user.update({
      where: { id: position.userId },
      data: {
        pejecoins: {
          increment: position.amount + profit // Devolver stake + ganancia/pérdida
        }
      },
      select: { pejecoins: true }
    });
    
    // 3. Registrar la transacción
    await tx.pejeCoinTransaction.create({
      data: {
        fromUserId: position.userId,
        toUserId: position.userId,
        amount: position.amount + profit,
        concept: 'trade_auto_close',
        timestamp: new Date(),
        status: 'completed',
        referenceId: position.id
      }
    });
    
    // 4. Registrar actividad del usuario
    await tx.userActivity.create({
      data: {
        userId: position.userId,
        action: 'position_auto_closed',
        details: {
          positionId: position.id,
          instrument: position.instrument,
          openPrice: position.openPrice,
          closePrice: currentPrice,
          profit: profit,
          duration: `${position.durationValue} ${position.durationUnit}(s)`
        }
      }
    });
    
    return user.pejecoins;
  });
  
  return {
    positionId: position.id,
    profit,
    closePrice: currentPrice,
    userId: position.userId,
    newBalance: result
  };
}

/**
 * Función principal para verificar y cerrar posiciones vencidas
 */
export async function checkAndCloseExpiredPositions(): Promise<PositionCloseResult[]> {
  try {
    // Obtener todas las posiciones abiertas
    const openPositions = await prisma.tradePosition.findMany({
      where: { status: 'open' },
      orderBy: { openTime: 'asc' }
    });
    
    if (openPositions.length === 0) {
      return [];
    }
    
    console.log(`[Auto-Close] Checking ${openPositions.length} open positions`);
    
    const expiredPositions = openPositions.filter(position => 
      isPositionExpired(position.openTime, position.durationValue, position.durationUnit)
    );
    
    if (expiredPositions.length === 0) {
      console.log('[Auto-Close] No expired positions found');
      return [];
    }
    
    console.log(`[Auto-Close] Found ${expiredPositions.length} expired positions`);
    
    // Cerrar posiciones vencidas
    const results: PositionCloseResult[] = [];
    
    for (const position of expiredPositions) {
      try {
        const result = await closePosition(position);
        results.push(result);
        
        console.log(`[Auto-Close] Closed position ${position.id} - Profit: ${result.profit} - New balance: ${result.newBalance}`);
      } catch (error) {
        console.error(`[Auto-Close] Error closing position ${position.id}:`, error);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('[Auto-Close] Error in checkAndCloseExpiredPositions:', error);
    return [];
  }
}

/**
 * Función auxiliar para verificar una posición específica
 */
export async function checkSpecificPosition(positionId: string): Promise<PositionCloseResult | null> {
  try {
    const position = await prisma.tradePosition.findUnique({
      where: { id: positionId, status: 'open' }
    });
    
    if (!position) {
      return null;
    }
    
    if (isPositionExpired(position.openTime, position.durationValue, position.durationUnit)) {
      return await closePosition(position);
    }
    
    return null;
  } catch (error) {
    console.error(`[Auto-Close] Error checking position ${positionId}:`, error);
    return null;
  }
} 