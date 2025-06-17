import { NextResponse } from 'next/server';
import { 
  getSchedulerStatus, 
  startAllSchedulers, 
  stopAllSchedulers,
  startAutoCloseScheduler,
  startPriceUpdateScheduler,
  stopAutoCloseScheduler,
  stopPriceUpdateScheduler,
  runAutoCloseOnce,
  runPriceUpdateOnce,
  resetStats
} from '@/lib/scheduler/enhancedAutoCloseScheduler';

/**
 * GET /api/trading/scheduler
 * Obtiene el estado actual de los schedulers
 */
export async function GET() {
  try {
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Scheduler API] Error getting status:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estado del scheduler',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/trading/scheduler
 * Controla los schedulers (start, stop, run-once, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, autoCloseMinutes, priceUpdateMinutes } = body;
    
    let result: any = { success: true };
    
    switch (action) {
      case 'start-all':
        startAllSchedulers(
          autoCloseMinutes || 1,
          priceUpdateMinutes || 30
        );
        result.message = 'Todos los schedulers iniciados';
        break;
        
      case 'stop-all':
        stopAllSchedulers();
        result.message = 'Todos los schedulers detenidos';
        break;
        
      case 'start-auto-close':
        startAutoCloseScheduler(autoCloseMinutes || 1);
        result.message = 'Scheduler de cierre automático iniciado';
        break;
        
      case 'stop-auto-close':
        stopAutoCloseScheduler();
        result.message = 'Scheduler de cierre automático detenido';
        break;
        
      case 'start-price-update':
        startPriceUpdateScheduler(priceUpdateMinutes || 30);
        result.message = 'Scheduler de actualización de precios iniciado';
        break;
        
      case 'stop-price-update':
        stopPriceUpdateScheduler();
        result.message = 'Scheduler de actualización de precios detenido';
        break;
        
      case 'run-auto-close-once':
        await runAutoCloseOnce();
        result.message = 'Proceso de cierre automático ejecutado una vez';
        break;
        
      case 'run-price-update-once':
        await runPriceUpdateOnce();
        result.message = 'Proceso de actualización de precios ejecutado una vez';
        break;
        
      case 'reset-stats':
        resetStats();
        result.message = 'Estadísticas reiniciadas';
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Acción no válida',
          availableActions: [
            'start-all', 'stop-all',
            'start-auto-close', 'stop-auto-close',
            'start-price-update', 'stop-price-update',
            'run-auto-close-once', 'run-price-update-once',
            'reset-stats'
          ]
        }, { status: 400 });
    }
    
    // Obtener estado actualizado
    const status = getSchedulerStatus();
    result.status = status;
    result.timestamp = new Date().toISOString();
    
    console.log(`[Scheduler API] Action '${action}' executed successfully`);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('[Scheduler API] Error executing action:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error ejecutando acción del scheduler',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/trading/scheduler
 * Actualiza la configuración de los schedulers
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { autoCloseMinutes, priceUpdateMinutes, restart = false } = body;
    
    if (restart) {
      // Detener schedulers actuales
      stopAllSchedulers();
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reiniciar con nueva configuración
      startAllSchedulers(
        autoCloseMinutes || 1,
        priceUpdateMinutes || 30
      );
    }
    
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
      data: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Scheduler API] Error updating config:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error actualizando configuración',
      error: error.message
    }, { status: 500 });
  }
} 