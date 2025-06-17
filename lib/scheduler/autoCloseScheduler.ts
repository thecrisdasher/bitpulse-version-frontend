/**
 * Scheduler para el cierre automático de posiciones vencidas
 * Se ejecuta cada minuto para verificar y cerrar posiciones
 */

import { checkAndCloseExpiredPositions } from '@/lib/services/positionAutoCloseService';

// Variable para controlar si el scheduler está activo
let isSchedulerRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Ejecuta el proceso de cierre automático
 */
async function runAutoCloseProcess(): Promise<void> {
  try {
    console.log('[Scheduler] Running auto-close process...');
    
    const closedPositions = await checkAndCloseExpiredPositions();
    
    if (closedPositions.length > 0) {
      console.log(`[Scheduler] Auto-closed ${closedPositions.length} positions`);
    }
    
  } catch (error) {
    console.error('[Scheduler] Error in auto-close process:', error);
  }
}

/**
 * Inicia el scheduler
 */
export function startAutoCloseScheduler(): void {
  if (isSchedulerRunning) {
    console.log('[Scheduler] Auto-close scheduler is already running');
    return;
  }
  
  console.log('[Scheduler] Starting auto-close scheduler (every 60 seconds)');
  
  // Ejecutar inmediatamente
  runAutoCloseProcess();
  
  // Configurar ejecución periódica cada 60 segundos
  schedulerInterval = setInterval(runAutoCloseProcess, 60000);
  isSchedulerRunning = true;
}

/**
 * Detiene el scheduler
 */
export function stopAutoCloseScheduler(): void {
  if (!isSchedulerRunning || !schedulerInterval) {
    console.log('[Scheduler] Auto-close scheduler is not running');
    return;
  }
  
  console.log('[Scheduler] Stopping auto-close scheduler');
  
  clearInterval(schedulerInterval);
  schedulerInterval = null;
  isSchedulerRunning = false;
}

/**
 * Verifica si el scheduler está activo
 */
export function isAutoCloseSchedulerRunning(): boolean {
  return isSchedulerRunning;
}

/**
 * Ejecuta el proceso una sola vez (para testing o ejecución manual)
 */
export async function runAutoCloseOnce(): Promise<void> {
  await runAutoCloseProcess();
}

// Auto-iniciar el scheduler en entornos de producción
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Iniciar después de 30 segundos para permitir que la aplicación se inicie completamente
  setTimeout(() => {
    startAutoCloseScheduler();
  }, 30000);
} 