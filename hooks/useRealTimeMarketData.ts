import { useEffect, useState } from 'react';
import { MarketData, subscribeToRealTimeUpdates, getMarketData, getBatchMarketData } from '@/lib/api/marketDataService';

export interface UseRealTimeMarketDataOptions {
  refreshInterval?: number; // Update interval in ms for fallback polling
  initialFetch?: boolean; // Whether to fetch data initially
}

/**
 * Custom hook for subscribing to real-time market data
 * 
 * @param symbol Symbol of the instrument (e.g. 'BTC/USD')
 * @param category Category of the instrument (e.g. 'criptomonedas', 'forex')
 * @param options Additional options
 * @returns { data, isLoading, error }
 */
export default function useRealTimeMarketData(
  symbol: string,
  category: string,
  options: UseRealTimeMarketDataOptions = {}
) {
  const { refreshInterval = 10000, initialFetch = true } = options;
  
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialFetch);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch market data initially and set up real-time updates
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const marketData = await getMarketData(symbol, category);
        setData(marketData);
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError(err instanceof Error ? err : new Error('Error fetching market data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch if requested
    if (initialFetch) {
      fetchData();
    }
    
    // Subscribe to real-time updates
    try {
      cleanup = subscribeToRealTimeUpdates(symbol, category, (marketData) => {
        setData(marketData);
        setError(null);
      });
      
      // Fallback polling for cases where WebSocket might not be available
      intervalId = setInterval(() => {
        // Only poll if we don't have recent data (last 30 seconds)
        if (!data || Date.now() - data.lastUpdated > 30000) {
          fetchData();
        }
      }, refreshInterval);
    } catch (err) {
      console.error('Error subscribing to updates:', err);
      setError(err instanceof Error ? err : new Error('Error subscribing to updates'));
      
      // If subscription fails, fall back to polling
      intervalId = setInterval(fetchData, refreshInterval);
    }
    
    // Cleanup function
    return () => {
      if (cleanup) cleanup();
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol, category, refreshInterval, initialFetch]);
  
  return { data, isLoading, error };
}

// Hook to use multiple real-time market data streams
export function useBatchRealTimeMarketData(
  instruments: Array<{symbol: string; category: string}>,
  options: UseRealTimeMarketDataOptions = {}
) {
  const { refreshInterval = 10000, initialFetch = true } = options;
  
  const [data, setData] = useState<Record<string, MarketData | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(initialFetch);
  const [error, setError] = useState<Error | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  
  // Silenciar errores en producción
  const logError = (message: string, err: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(message, err);
    } else {
      // En producción, solo mostrar un mensaje más simple y sin stack trace
      console.warn('⚠️ ' + message);
    }
  };
  
  // Fetch market data initially and set up real-time updates
  useEffect(() => {
    // Validar que instruments es un array válido y no está vacío
    if (!instruments || !Array.isArray(instruments) || instruments.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('useBatchRealTimeMarketData: No se proporcionaron instrumentos válidos');
      }
      setIsLoading(false);
      return () => {}; // No hacer nada si no hay instrumentos
    }
    
    let cleanupFunctions: Array<() => void> = [];
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchAllData = async () => {
      // Si ya fallaron demasiados intentos, esperar más tiempo antes de reintentar
      if (failedAttempts > 3) {
        const waitTime = Math.min(failedAttempts * 5000, 30000);
        
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Demasiados errores consecutivos (${failedAttempts}), esperando ${waitTime/1000}s antes de reintentar`);
        }
        
        // Resetear contador después de un tiempo
        setTimeout(() => setFailedAttempts(0), 60000);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Crear un array de solicitudes válidas
        const requests = instruments
          .filter(inst => inst && inst.symbol && inst.category) // Filtrar entradas inválidas
          .map(inst => ({
            symbol: inst.symbol,
            category: inst.category
          }));
        
        if (requests.length === 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('No hay instrumentos válidos para obtener datos');
          }
          setIsLoading(false);
          return;
        }
        
        // Usar getBatchMarketData para obtener múltiples instrumentos a la vez
        const batchResults = await getBatchMarketData(requests);
        
        // Verificar si obtuvimos algún resultado
        if (Object.keys(batchResults).length === 0) {
          // Si no se obtuvieron datos pero no hubo error explícito, no mostrar error
          // pero incrementar contador de fallos
          setFailedAttempts(prev => prev + 1);
        } else {
          // Actualizar el estado con todos los resultados
          setData(prev => ({
            ...prev,
            ...batchResults
          }));
        
          // Resetear contador de errores al tener éxito
          if (failedAttempts > 0) {
            setFailedAttempts(0);
          }
        }
        
        setError(null);
      } catch (err) {
        logError('Error obteniendo datos de mercado en lote:', err);
        
        // No mostrar error visual al usuario a menos que sea crítico
        // y hayamos fallado múltiples veces
        if (failedAttempts > 2) {
          setError(err instanceof Error ? err : new Error('Error de conexión temporal'));
        }
        
        // Incrementar contador de intentos fallidos
        setFailedAttempts(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch if requested
    if (initialFetch) {
      fetchAllData();
    }
    
    // Subscribe to real-time updates for each instrument
    instruments.forEach(inst => {
      // Validación adicional
      if (!inst || !inst.symbol || !inst.category) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Instrumento inválido detectado:', inst);
        }
        return;
      }
      
      try {
        const cleanup = subscribeToRealTimeUpdates(
          inst.symbol, 
          inst.category, 
          (marketData) => {
            setData(prev => ({
              ...prev,
              [inst.symbol]: marketData
            }));
            
            // Si recibimos datos por WebSocket, resetear contador de errores
            if (failedAttempts > 0) {
              setFailedAttempts(0);
            }
          }
        );
        
        cleanupFunctions.push(cleanup);
      } catch (err) {
        logError(`Error al suscribirse a actualizaciones para ${inst?.symbol || 'unknown'}:`, err);
      }
    });
    
    // Fallback polling con intervalo dinámico basado en fallos
    intervalId = setInterval(() => {
      // Ajustar intervalo según número de fallos
      const adjustedInterval = Math.min(failedAttempts * 5000, 30000); // Max 30 segundos de retraso
      
      setTimeout(fetchAllData, adjustedInterval);
    }, refreshInterval);
    
    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      if (intervalId) clearInterval(intervalId);
    };
  }, [JSON.stringify(instruments), refreshInterval, initialFetch, failedAttempts]);
  
  return { 
    data, 
    isLoading, 
    // Si tenemos datos pero también errores, no mostrar el error al usuario
    error: Object.keys(data).length > 0 ? null : error,
    // Nueva propiedad que indica si estamos usando datos de respaldo o datos en tiempo real  
    hasRealtimeData: Object.values(data).some(item => item?.isRealTime === true)
  };
}

// Clean up all WebSocket connections when app unmounts
export function useCleanupWebSockets() {
  useEffect(() => {
    return () => {
      // This hook was using a non-existent cleanupWebSockets function
      // Since cleanupFunctions is not accessible here, we can remove this empty hook
    };
  }, []);
}