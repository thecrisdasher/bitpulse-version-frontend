import { useEffect, useState } from 'react';
import { MarketData, subscribeToRealTimeUpdates, getMarketData, cleanupWebSockets } from '@/lib/api/marketDataService';

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
  
  // Fetch market data initially and set up real-time updates
  useEffect(() => {
    let cleanupFunctions: Array<() => void> = [];
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const requests = instruments.map(inst => ({
          symbol: inst.symbol,
          category: inst.category
        }));
        
        const batchData = await getMarketData(requests[0].symbol, requests[0].category);
        
        setData(prev => ({
          ...prev,
          [requests[0].symbol]: batchData
        }));
        setError(null);
      } catch (err) {
        console.error('Error fetching batch market data:', err);
        setError(err instanceof Error ? err : new Error('Error fetching batch market data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch if requested
    if (initialFetch && instruments.length > 0) {
      fetchAllData();
    }
    
    // Subscribe to real-time updates for each instrument
    instruments.forEach(inst => {
      try {
        const cleanup = subscribeToRealTimeUpdates(
          inst.symbol, 
          inst.category, 
          (marketData) => {
            setData(prev => ({
              ...prev,
              [inst.symbol]: marketData
            }));
          }
        );
        
        cleanupFunctions.push(cleanup);
      } catch (err) {
        console.error(`Error subscribing to updates for ${inst.symbol}:`, err);
      }
    });
    
    // Fallback polling
    intervalId = setInterval(fetchAllData, refreshInterval);
    
    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      if (intervalId) clearInterval(intervalId);
    };
  }, [JSON.stringify(instruments), refreshInterval, initialFetch]);
  
  return { data, isLoading, error };
}

// Clean up all WebSocket connections when app unmounts
export function useCleanupWebSockets() {
  useEffect(() => {
    return () => {
      cleanupWebSockets();
    };
  }, []);
} 