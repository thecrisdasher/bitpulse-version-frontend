import { useState, useEffect } from 'react';
import { MarketData } from '@/lib/api/marketDataService';

interface UseMarketDataProps {
  symbol: string;
  category: string;
  baseValue?: number;
  refreshInterval?: number;
  initialData?: MarketData;
}

interface UseMarketDataReturn {
  data: MarketData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

/**
 * Hook personalizado para obtener y gestionar datos de mercado
 */
export function useMarketData({
  symbol,
  category,
  baseValue,
  refreshInterval = 0,
  initialData
}: UseMarketDataProps): UseMarketDataReturn {
  const [data, setData] = useState<MarketData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Función para obtener los datos de la API
  const fetchData = async () => {
    try {
      setIsError(false);
      setError(null);
      
      if (!isLoading) {
        setIsLoading(true);
      }
      
      // Construir la URL de la API con parámetros
      let url = `/api/market/${encodeURIComponent(category)}/${encodeURIComponent(symbol)}`;
      
      if (baseValue) {
        url += `?baseValue=${baseValue}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Datos inválidos');
      }
      
      setData(result.data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      console.error('Error obteniendo datos de mercado:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para cargar datos iniciales y configurar actualizaciones periódicas
  useEffect(() => {
    if (!symbol || !category) return;
    
    // Cargar datos inmediatamente
    fetchData();
    
    // Configurar actualizaciones periódicas si es necesario
    let intervalId: NodeJS.Timeout | undefined;
    
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchData, refreshInterval);
    }
    
    // Limpiar el intervalo al desmontar el componente
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [symbol, category, baseValue, refreshInterval]);

  // Función para recargar datos manualmente
  const mutate = async () => {
    await fetchData();
  };

  return { data, isLoading, isError, error, mutate };
}

/**
 * Hook para obtener datos de varios mercados a la vez
 */
export function useBatchMarketData(
  instruments: Array<{ symbol: string; category: string; baseValue?: number }>,
  refreshInterval = 0
) {
  const [data, setData] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBatchData = async () => {
    try {
      setIsError(false);
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruments }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos batch: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Datos inválidos');
      }
      
      setData(result.data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      console.error('Error obteniendo datos de mercado en batch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!instruments.length) return;
    
    fetchBatchData();
    
    let intervalId: NodeJS.Timeout | undefined;
    
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchBatchData, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [JSON.stringify(instruments), refreshInterval]);

  const mutate = async () => {
    await fetchBatchData();
  };

  return { data, isLoading, isError, error, mutate };
} 