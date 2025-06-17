/**
 * Scheduler mejorado para cierre automático y actualización de precios
 * Maneja múltiples tareas programadas con diferentes frecuencias
 */

import { checkAndCloseExpiredPositions } from '@/lib/services/positionAutoCloseService';
import { updateBasePricesFromBinance } from '@/lib/simulator';

// Estado del scheduler
interface SchedulerState {
  autoCloseRunning: boolean;
  priceUpdateRunning: boolean;
  autoCloseInterval: NodeJS.Timeout | null;
  priceUpdateInterval: NodeJS.Timeout | null;
  lastAutoClose: Date | null;
  lastPriceUpdate: Date | null;
  stats: {
    autoCloseExecutions: number;
    priceUpdateExecutions: number;
    positionsClosed: number;
    pricesUpdated: number;
  };
}

let schedulerState: SchedulerState = {
  autoCloseRunning: false,
  priceUpdateRunning: false,
  autoCloseInterval: null,
  priceUpdateInterval: null,
  lastAutoClose: null,
  lastPriceUpdate: null,
  stats: {
    autoCloseExecutions: 0,
    priceUpdateExecutions: 0,
    positionsClosed: 0,
    pricesUpdated: 0
  }
};

/**
 * Ejecuta el proceso de cierre automático
 */
async function runAutoCloseProcess(): Promise<void> {
  try {
    console.log('[Enhanced Scheduler] Running auto-close process...');
    
    const closedPositions = await checkAndCloseExpiredPositions();
    
    schedulerState.lastAutoClose = new Date();
    schedulerState.stats.autoCloseExecutions++;
    schedulerState.stats.positionsClosed += closedPositions.length;
    
    if (closedPositions.length > 0) {
      console.log(`[Enhanced Scheduler] Auto-closed ${closedPositions.length} positions`);
    }
    
  } catch (error) {
    console.error('[Enhanced Scheduler] Error in auto-close process:', error);
  }
}

/**
 * Ejecuta el proceso de actualización de precios
 */
async function runPriceUpdateProcess(): Promise<void> {
  try {
    console.log('[Enhanced Scheduler] Running price update process...');
    
    const success = await updateBasePricesFromBinance();
    
    schedulerState.lastPriceUpdate = new Date();
    schedulerState.stats.priceUpdateExecutions++;
    
    if (success) {
      schedulerState.stats.pricesUpdated++;
      console.log('[Enhanced Scheduler] Base prices updated successfully');
    } else {
      console.log('[Enhanced Scheduler] Price update failed, keeping current prices');
    }
    
  } catch (error) {
    console.error('[Enhanced Scheduler] Error in price update process:', error);
  }
}

/**
 * Inicia el scheduler de cierre automático
 */
export function startAutoCloseScheduler(intervalMinutes: number = 1): void {
  if (schedulerState.autoCloseRunning) {
    console.log('[Enhanced Scheduler] Auto-close scheduler is already running');
    return;
  }
  
  console.log(`[Enhanced Scheduler] Starting auto-close scheduler (every ${intervalMinutes} minutes)`);
  
  // Ejecutar inmediatamente
  runAutoCloseProcess();
  
  // Configurar ejecución periódica
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerState.autoCloseInterval = setInterval(runAutoCloseProcess, intervalMs);
  schedulerState.autoCloseRunning = true;
}

/**
 * Inicia el scheduler de actualización de precios
 */
export function startPriceUpdateScheduler(intervalMinutes: number = 30): void {
  if (schedulerState.priceUpdateRunning) {
    console.log('[Enhanced Scheduler] Price update scheduler is already running');
    return;
  }
  
  console.log(`[Enhanced Scheduler] Starting price update scheduler (every ${intervalMinutes} minutes)`);
  
  // Ejecutar inmediatamente
  runPriceUpdateProcess();
  
  // Configurar ejecución periódica
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerState.priceUpdateInterval = setInterval(runPriceUpdateProcess, intervalMs);
  schedulerState.priceUpdateRunning = true;
}

/**
 * Inicia ambos schedulers con configuración por defecto
 */
export function startAllSchedulers(autoCloseMinutes: number = 1, priceUpdateMinutes: number = 30): void {
  startAutoCloseScheduler(autoCloseMinutes);
  startPriceUpdateScheduler(priceUpdateMinutes);
}

/**
 * Detiene el scheduler de cierre automático
 */
export function stopAutoCloseScheduler(): void {
  if (!schedulerState.autoCloseRunning || !schedulerState.autoCloseInterval) {
    console.log('[Enhanced Scheduler] Auto-close scheduler is not running');
    return;
  }
  
  console.log('[Enhanced Scheduler] Stopping auto-close scheduler');
  
  clearInterval(schedulerState.autoCloseInterval);
  schedulerState.autoCloseInterval = null;
  schedulerState.autoCloseRunning = false;
}

/**
 * Detiene el scheduler de actualización de precios
 */
export function stopPriceUpdateScheduler(): void {
  if (!schedulerState.priceUpdateRunning || !schedulerState.priceUpdateInterval) {
    console.log('[Enhanced Scheduler] Price update scheduler is not running');
    return;
  }
  
  console.log('[Enhanced Scheduler] Stopping price update scheduler');
  
  clearInterval(schedulerState.priceUpdateInterval);
  schedulerState.priceUpdateInterval = null;
  schedulerState.priceUpdateRunning = false;
}

/**
 * Detiene todos los schedulers
 */
export function stopAllSchedulers(): void {
  stopAutoCloseScheduler();
  stopPriceUpdateScheduler();
}

/**
 * Verifica el estado de los schedulers
 */
export function getSchedulerStatus(): {
  autoCloseRunning: boolean;
  priceUpdateRunning: boolean;
  lastAutoClose: string | null;
  lastPriceUpdate: string | null;
  stats: typeof schedulerState.stats;
  nextAutoClose: string | null;
  nextPriceUpdate: string | null;
} {
  const now = new Date();
  
  // Calcular próximas ejecuciones
  let nextAutoClose: string | null = null;
  if (schedulerState.autoCloseRunning && schedulerState.lastAutoClose) {
    const next = new Date(schedulerState.lastAutoClose.getTime() + 60000); // +1 minuto
    nextAutoClose = next > now ? next.toISOString() : 'Soon';
  }
  
  let nextPriceUpdate: string | null = null;
  if (schedulerState.priceUpdateRunning && schedulerState.lastPriceUpdate) {
    const next = new Date(schedulerState.lastPriceUpdate.getTime() + 1800000); // +30 minutos
    nextPriceUpdate = next > now ? next.toISOString() : 'Soon';
  }
  
  return {
    autoCloseRunning: schedulerState.autoCloseRunning,
    priceUpdateRunning: schedulerState.priceUpdateRunning,
    lastAutoClose: schedulerState.lastAutoClose?.toISOString() || null,
    lastPriceUpdate: schedulerState.lastPriceUpdate?.toISOString() || null,
    stats: { ...schedulerState.stats },
    nextAutoClose,
    nextPriceUpdate
  };
}

/**
 * Ejecuta el proceso de cierre automático una sola vez
 */
export async function runAutoCloseOnce(): Promise<void> {
  await runAutoCloseProcess();
}

/**
 * Ejecuta el proceso de actualización de precios una sola vez
 */
export async function runPriceUpdateOnce(): Promise<void> {
  await runPriceUpdateProcess();
}

/**
 * Reinicia las estadísticas
 */
export function resetStats(): void {
  schedulerState.stats = {
    autoCloseExecutions: 0,
    priceUpdateExecutions: 0,
    positionsClosed: 0,
    pricesUpdated: 0
  };
  console.log('[Enhanced Scheduler] Statistics reset');
}

// Auto-iniciar schedulers en producción
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Iniciar después de 30 segundos para permitir que la aplicación se inicie completamente
  setTimeout(() => {
    console.log('[Enhanced Scheduler] Auto-starting schedulers in production...');
    startAllSchedulers(1, 30); // Auto-close cada 1 minuto, precios cada 30 minutos
  }, 30000);
} 