import { useState, useEffect, useCallback } from 'react';

export interface TrendingCrypto {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  priceHistory: number[];
  rank: number;
  lastUpdated: string;
}

interface TrendingDataState {
  data: TrendingCrypto[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  usingFallback: boolean;
}

/**
 * Hook alternativo que usa la API local /api/market/trending
 * Esta API ya maneja el fallback automático internamente
 */
export function useTrendingDataAPI(
  limit: number = 20, 
  refreshInterval: number = 30000,
  sortBy: string = 'rank'
) {
  const [state, setState] = useState<TrendingDataState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    usingFallback: false
  });

  /**
   * Función para obtener datos de la API local
   */
  const fetchTrendingData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[TrendingDataAPI] Fetching from local API...');
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy: sortBy
      });

      const response = await fetch(`/api/market/trending?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date(),
          usingFallback: result.meta.usingFallback || false
        });

        console.log(`[TrendingDataAPI] Successfully loaded ${result.data.length} items (source: ${result.meta.source})`);
      } else {
        throw new Error(result.message || 'API returned error');
      }

    } catch (error: any) {
      console.error('[TrendingDataAPI] Error fetching data:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Error obteniendo datos: ${error.message}`,
        usingFallback: false
      }));
    }
  }, [limit, sortBy]);

  // Configurar actualización automática
  useEffect(() => {
    fetchTrendingData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchTrendingData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrendingData, refreshInterval]);

  return {
    ...state,
    refresh: fetchTrendingData
  };
} 