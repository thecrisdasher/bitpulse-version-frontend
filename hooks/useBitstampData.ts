import { useState, useEffect, useCallback, useRef } from 'react';
import { bitstampService, BitstampTicker, BitstampOHLC } from '@/lib/services/bitstampService';

// Tipos para los datos del hook
export interface BitstampDataPoint {
  time: number;
  value: number;
}

export interface BitstampCandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UseBitstampDataOptions {
  symbol: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
  chartType: 'area' | 'line' | 'candle' | 'bar';
  realTimeEnabled: boolean;
  timeOffset?: number;
  isHistoricalMode?: boolean;
}

export interface UseBitstampDataReturn {
  data: BitstampDataPoint[];
  candlestickData: BitstampCandlestickData[];
  currentPrice: number;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  lastUpdate: Date | null;
  refreshData: () => Promise<void>;
}

// Mapeo de timeRange a step de Bitstamp (en segundos)
const TIME_RANGE_TO_STEP = {
  '1h': 300,    // 5 minutos
  '24h': 3600,  // 1 hora
  '7d': 86400,  // 1 día
  '30d': 86400  // 1 día
};

// Mapeo de timeRange a límite de datos
const TIME_RANGE_TO_LIMIT = {
  '1h': 12,   // 12 puntos de 5 minutos = 1 hora
  '24h': 24,  // 24 puntos de 1 hora = 24 horas
  '7d': 7,    // 7 puntos de 1 día = 7 días
  '30d': 30   // 30 puntos de 1 día = 30 días
};

export const useBitstampData = (options: UseBitstampDataOptions): UseBitstampDataReturn => {
  const {
    symbol,
    timeRange,
    chartType,
    realTimeEnabled,
    timeOffset = 0,
    isHistoricalMode = false
  } = options;

  // Estados
  const [data, setData] = useState<BitstampDataPoint[]>([]);
  const [candlestickData, setCandlestickData] = useState<BitstampCandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Referencias
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSupported = bitstampService.isSymbolSupported(symbol);

  // Función para cargar datos históricos
  const loadHistoricalData = useCallback(async () => {
    if (!isSupported) {
      setError(`Símbolo ${symbol} no soportado por Bitstamp`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const step = TIME_RANGE_TO_STEP[timeRange];
      const limit = TIME_RANGE_TO_LIMIT[timeRange];

      let ohlcData: BitstampOHLC[] = [];

      // Timeout para evitar que la petición se cuelgue indefinidamente
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La conexión con Bitstamp tardó demasiado')), 15000);
      });

              if (isHistoricalMode && timeOffset > 0) {
        // Cargar datos históricos para una fecha específica
        const endDate = new Date();
        const startDate = new Date();

        // Calcular fechas basadas en el offset
        if (timeRange === '1h') {
          endDate.setHours(endDate.getHours() - timeOffset);
          startDate.setHours(startDate.getHours() - timeOffset - 1);
        } else if (timeRange === '24h') {
          endDate.setDate(endDate.getDate() - timeOffset);
          startDate.setDate(startDate.getDate() - timeOffset - 1);
        } else if (timeRange === '7d') {
          endDate.setDate(endDate.getDate() - (timeOffset * 7));
          startDate.setDate(startDate.getDate() - (timeOffset * 7) - 7);
        } else {
          endDate.setDate(endDate.getDate() - (timeOffset * 30));
          startDate.setDate(startDate.getDate() - (timeOffset * 30) - 30);
        }

        ohlcData = await Promise.race([
          bitstampService.getHistoricalData(symbol, startDate, endDate, step),
          timeoutPromise
        ]);
      } else {
        // Cargar datos recientes
        ohlcData = await Promise.race([
          bitstampService.getOHLCData(symbol, step, limit),
          timeoutPromise
        ]);
      }

      if (ohlcData.length === 0) {
        console.warn('No hay datos disponibles de Bitstamp para', symbol);
        // En lugar de lanzar error, usar datos vacíos y marcar como no soportado
        setError('No hay datos disponibles para este símbolo en Bitstamp');
        setIsLoading(false);
        return;
      }

      // Convertir datos para gráficos de línea/área
      const lineData: BitstampDataPoint[] = ohlcData.map(item => ({
        time: parseInt(item.timestamp),
        value: parseFloat(item.close)
      }));

      // Convertir datos para gráficos de velas
      const candleData: BitstampCandlestickData[] = ohlcData.map(item => ({
        time: parseInt(item.timestamp),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume)
      }));

      setData(lineData);
      setCandlestickData(candleData);

      // Establecer precio actual
      if (lineData.length > 0) {
        setCurrentPrice(lineData[lineData.length - 1].value);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error cargando datos de Bitstamp:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión con Bitstamp';
      setError(errorMessage);
      
      // Limpiar datos en caso de error
      setData([]);
      setCandlestickData([]);
      setCurrentPrice(0);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeRange, isSupported, isHistoricalMode, timeOffset]);

  // Función para actualizar precio en tiempo real
  const updateRealTimePrice = useCallback(async () => {
    if (!isSupported || isHistoricalMode) return;

    try {
      const ticker = await bitstampService.getTicker(symbol);
      if (ticker) {
        const newPrice = parseFloat(ticker.last);
        const timestamp = Math.floor(Date.now() / 1000);

        setCurrentPrice(newPrice);

        // Actualizar datos de línea/área
        if (chartType === 'area' || chartType === 'line') {
          setData(prev => {
            const newData = [...prev, { time: timestamp, value: newPrice }];
            // Mantener solo los últimos 100 puntos para rendimiento
            return newData.slice(-100);
          });
        }

        // Para gráficos de velas, actualizar la vela actual
        if (chartType === 'candle' || chartType === 'bar') {
          setCandlestickData(prev => {
            if (prev.length === 0) return prev;

            const lastCandle = prev[prev.length - 1];
            const timeDiff = timestamp - lastCandle.time;

            // Si han pasado más de 5 minutos, crear nueva vela
            if (timeDiff > 300) {
              const newCandle: BitstampCandlestickData = {
                time: timestamp,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
                volume: 0
              };
              return [...prev.slice(-99), newCandle];
            } else {
              // Actualizar vela actual
              const updatedCandle = {
                ...lastCandle,
                close: newPrice,
                high: Math.max(lastCandle.high, newPrice),
                low: Math.min(lastCandle.low, newPrice)
              };
              return [...prev.slice(0, -1), updatedCandle];
            }
          });
        }

        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error actualizando precio en tiempo real:', err);
    }
  }, [symbol, isSupported, isHistoricalMode, chartType]);

  // Crear una versión estable de updateRealTimePrice para el useEffect
  const updateRealTimePriceRef = useRef(updateRealTimePrice);
  updateRealTimePriceRef.current = updateRealTimePrice;

  // Función para refrescar datos manualmente
  const refreshData = useCallback(async () => {
    await loadHistoricalData();
  }, [loadHistoricalData]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (isSupported) {
      loadHistoricalData();
    } else {
      setIsLoading(false);
      setError(`Símbolo ${symbol} no está soportado por Bitstamp`);
    }
  }, [symbol, timeRange, isSupported, isHistoricalMode, timeOffset]); // Usar dependencias directas

  // Efecto para actualizaciones en tiempo real
  useEffect(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Solo configurar tiempo real si está habilitado y no estamos en modo histórico
    if (realTimeEnabled && !isHistoricalMode && isSupported) {
      // Actualizar cada 10 segundos (Bitstamp no tiene WebSocket público gratuito)
      intervalRef.current = setInterval(() => {
        updateRealTimePriceRef.current();
      }, 10000);

      // Actualización inicial
      updateRealTimePriceRef.current();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [realTimeEnabled, isHistoricalMode, isSupported, symbol, chartType]); // Usar dependencias directas

  return {
    data,
    candlestickData,
    currentPrice,
    isLoading,
    error,
    isSupported,
    lastUpdate,
    refreshData
  };
}; 