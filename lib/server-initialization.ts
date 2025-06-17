/**
 * Inicialización del servidor - Maneja schedulers y servicios automáticos
 */

import { startAllSchedulers, getSchedulerStatus } from '@/lib/scheduler/enhancedAutoCloseScheduler';

let serverInitialized = false;

/**
 * Inicializa todos los servicios del servidor
 */
export function initializeServer(): void {
  if (serverInitialized) {
    console.log('[Server Init] Server already initialized');
    return;
  }
  
  console.log('[Server Init] Initializing server services...');
  
  try {
    // Iniciar schedulers después de un breve delay
    setTimeout(() => {
      console.log('[Server Init] Starting schedulers...');
      
      // Configuración de production vs development
      const isProd = process.env.NODE_ENV === 'production';
      const autoCloseMinutes = isProd ? 1 : 2; // Más frecuente en dev para testing
      const priceUpdateMinutes = isProd ? 30 : 15; // Más frecuente en dev
      
      startAllSchedulers(autoCloseMinutes, priceUpdateMinutes);
      
      // Log de estado
      setTimeout(() => {
        const status = getSchedulerStatus();
        console.log('[Server Init] Scheduler status:', {
          autoCloseRunning: status.autoCloseRunning,
          priceUpdateRunning: status.priceUpdateRunning,
          environment: process.env.NODE_ENV
        });
      }, 5000);
      
         }, process.env.NODE_ENV === 'production' ? 30000 : 10000); // 30s en prod, 10s en dev
    
    serverInitialized = true;
    console.log('[Server Init] Server initialization completed');
    
  } catch (error) {
    console.error('[Server Init] Error during server initialization:', error);
  }
}

/**
 * Verifica si el servidor está inicializado
 */
export function isServerInitialized(): boolean {
  return serverInitialized;
}

/**
 * Reinicia los servicios del servidor
 */
export function restartServer(): void {
  console.log('[Server Init] Restarting server services...');
  serverInitialized = false;
  initializeServer();
}

// Auto-inicializar en el lado del servidor
if (typeof window === 'undefined') {
  // Solo en el lado del servidor (no en el cliente)
  setTimeout(() => {
    initializeServer();
  }, 1000); // Pequeño delay para asegurar que el servidor esté listo
} 