import { NextResponse } from 'next/server';
import { checkAndCloseExpiredPositions } from '@/lib/services/positionAutoCloseService';

/**
 * POST /api/trading/auto-close
 * Endpoint para ejecutar el proceso de cierre automático de posiciones vencidas
 * Se puede llamar periódicamente desde un cron job o scheduler
 */
export async function POST(request: Request) {
  try {
    console.log('[Auto-Close API] Starting auto-close process...');
    
    const closedPositions = await checkAndCloseExpiredPositions();
    
    const response = {
      success: true,
      message: `Auto-close process completed`,
      data: {
        closedPositions: closedPositions.length,
        results: closedPositions.map(result => ({
          positionId: result.positionId,
          profit: result.profit,
          closePrice: result.closePrice,
          newBalance: result.newBalance
        }))
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Auto-Close API] Completed: ${closedPositions.length} positions closed`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[Auto-Close API] Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error en el proceso de cierre automático',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/trading/auto-close
 * Endpoint para obtener información sobre el estado del sistema de cierre automático
 */
export async function GET() {
  try {
    // Contar posiciones abiertas
    const { prisma } = await import('@/lib/db');
    
    const openPositions = await prisma.tradePosition.count({
      where: { status: 'open' }
    });
    
    // Obtener posiciones que están próximas a vencer (en los próximos 10 minutos)
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
    const soonToExpire = await prisma.tradePosition.count({
      where: {
        status: 'open',
        openTime: {
          lt: new Date(Date.now() - 50 * 60 * 1000) // Posiciones abiertas hace más de 50 minutos (asumiendo 1 hora de duración)
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        openPositions,
        soonToExpire,
        autoCloseEnabled: true,
        lastCheck: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[Auto-Close Status API] Error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estado del sistema',
      error: error.message
    }, { status: 500 });
  }
} 