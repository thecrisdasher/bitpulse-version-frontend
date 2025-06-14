import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChartDataPoint { 
  time: number; 
  value: number; 
}

export interface CandleDataPoint { 
  time: number; 
  open: number; 
  high: number; 
  low: number; 
  close: number; 
  volume?: number;
}

export interface PositionMarker {
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
  text: string;
  size: number;
}

interface HistoricalDataState {
  data: ChartDataPoint[];
  candlestickData: CandleDataPoint[];
  positionMarkers: PositionMarker[];
  isLoading: boolean;
  hasMoreData: boolean;
  earliestTime: number | null;
}

// Map TimeRange to Binance interval
const timeRangeToInterval = (range: '1h' | '24h' | '7d' | '30d'): string => {
  switch (range) {
    case '1h': return '1m';
    case '24h': return '15m';
    case '7d': return '1h';
    case '30d': return '4h';
    default: return '1m';
  }
};

// Get milliseconds for interval
const getIntervalMs = (interval: string): number => {
  const intervals: { [key: string]: number } = {
    '1m': 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return intervals[interval] || 60 * 1000;
};

/**
 * Enhanced hook for Binance data with historical scroll capability
 * @param symbol e.g. 'BTCUSDT'
 * @param timeRange '1h'|'24h'|'7d'|'30d'
 * @param realTimeEnabled subscribe to WS
 * @param tradePositions array of trade positions to mark on chart
 */
export default function useEnhancedBinanceData(
  symbol: string,
  timeRange: '1h' | '24h' | '7d' | '30d',
  realTimeEnabled: boolean,
  tradePositions: any[] = []
): HistoricalDataState & {
  loadMoreHistoricalData: () => Promise<void>;
  resetData: () => void;
} {
  const [state, setState] = useState<HistoricalDataState>({
    data: [],
    candlestickData: [],
    positionMarkers: [],
    isLoading: false,
    hasMoreData: true,
    earliestTime: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const loadingRef = useRef<boolean>(false);
  const initialLoadRef = useRef<boolean>(false);

  // Create position markers from trade positions
  const createPositionMarkers = useCallback((positions: any[]): PositionMarker[] => {
    return positions.map(position => ({
      time: Math.floor(new Date(position.openTime).getTime() / 1000),
      position: position.direction === 'up' ? 'belowBar' : 'aboveBar',
      color: position.direction === 'up' ? '#26a69a' : '#ef5350',
      shape: position.direction === 'up' ? 'arrowUp' : 'arrowDown',
      text: `${position.direction.toUpperCase()} ${position.marketName}`,
      size: 1,
    }));
  }, []);

  // Load historical data from Binance
  const loadHistoricalData = useCallback(async (
    loadBefore?: number,
    limit: number = 100
  ): Promise<{ data: ChartDataPoint[]; candlestickData: CandleDataPoint[]; earliestTime: number | null }> => {
    try {
      const interval = timeRangeToInterval(timeRange);
      const base = symbol.includes('/') ? symbol.split('/')[0] : symbol;
      const upper = base.toUpperCase();
      const sym = upper.endsWith('USDT') ? upper : `${upper}USDT`;

      let url = `/api/binance/klines?symbol=${encodeURIComponent(sym)}&interval=${interval}&limit=${limit}`;
      
      if (loadBefore) {
        url += `&endTime=${loadBefore}`;
      }

      console.log('[Enhanced Binance] Loading historical data:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.error(`[Enhanced Binance] API error: ${res.status} ${res.statusText}`);
        return { data: [], candlestickData: [], earliestTime: null };
      }
      
      const rawData = await res.json();
      
      // Check if response has an error property
      if (rawData.error) {
        console.error(`[Enhanced Binance] API error: ${rawData.error}`);
        return { data: [], candlestickData: [], earliestTime: null };
      }
      
      if (!Array.isArray(rawData)) {
        console.error(`[Enhanced Binance] Invalid response format:`, rawData);
        return { data: [], candlestickData: [], earliestTime: null };
      }

      if (rawData.length === 0) {
        console.warn(`[Enhanced Binance] No data returned for ${symbol}`);
        return { data: [], candlestickData: [], earliestTime: null };
      }

      const linePoints: ChartDataPoint[] = rawData.map((candle: any) => ({
        time: Math.floor(candle[0] / 1000),
        value: parseFloat(candle[4]) // close price
      }));

      const candlePoints: CandleDataPoint[] = rawData.map((candle: any) => ({
        time: Math.floor(candle[0] / 1000),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));

      const earliestTime = linePoints.length > 0 ? linePoints[0].time : null;

      return {
        data: linePoints,
        candlestickData: candlePoints,
        earliestTime
      };
    } catch (error) {
      console.error('[Enhanced Binance] Error loading historical data:', error);
      return { data: [], candlestickData: [], earliestTime: null };
    }
  }, [symbol, timeRange]);

  // Load more historical data (for scroll back functionality)
  const loadMoreHistoricalData = useCallback(async (): Promise<void> => {
    if (loadingRef.current || !state.hasMoreData || !state.earliestTime) {
      return;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const interval = timeRangeToInterval(timeRange);
      const intervalMs = getIntervalMs(interval);
      const endTime = (state.earliestTime - intervalMs) * 1000; // Convert to milliseconds for Binance API

      const { data: newData, candlestickData: newCandlestickData, earliestTime: newEarliestTime } = 
        await loadHistoricalData(endTime, 100);

      setState(prev => {
        // Merge new data with existing data, ensuring no duplicates
        const mergedData = [...newData, ...prev.data];
        const mergedCandlestickData = [...newCandlestickData, ...prev.candlestickData];
        
        // Remove duplicates based on time
        const uniqueData = mergedData.filter((item, index, arr) => 
          arr.findIndex(t => t.time === item.time) === index
        );
        const uniqueCandlestickData = mergedCandlestickData.filter((item, index, arr) => 
          arr.findIndex(t => t.time === item.time) === index
        );

        // Sort by time
        uniqueData.sort((a, b) => a.time - b.time);
        uniqueCandlestickData.sort((a, b) => a.time - b.time);

        return {
          ...prev,
          data: uniqueData,
          candlestickData: uniqueCandlestickData,
          earliestTime: newEarliestTime || prev.earliestTime,
          hasMoreData: newData.length > 0,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('[Enhanced Binance] Error loading more historical data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      loadingRef.current = false;
    }
  }, [state.hasMoreData, state.earliestTime, loadHistoricalData, timeRange]);

  // Reset data
  const resetData = useCallback(() => {
    setState({
      data: [],
      candlestickData: [],
      positionMarkers: [],
      isLoading: false,
      hasMoreData: true,
      earliestTime: null,
    });
    initialLoadRef.current = false;
  }, []);

  // Initial data load
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    initialLoadRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    loadHistoricalData().then(({ data, candlestickData, earliestTime }) => {
      const markers = createPositionMarkers(tradePositions);
      
      setState(prev => ({
        ...prev,
        data,
        candlestickData,
        positionMarkers: markers,
        earliestTime,
        isLoading: false,
        hasMoreData: data.length > 0
      }));
    }).catch((error) => {
      console.error('[Enhanced Binance] Initial data load failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasMoreData: false,
        data: [],
        candlestickData: [],
        positionMarkers: [],
        earliestTime: null
      }));
    });
  }, [symbol, timeRange, loadHistoricalData, createPositionMarkers, tradePositions]);

  // Update position markers when trade positions change
  useEffect(() => {
    const markers = createPositionMarkers(tradePositions);
    setState(prev => ({ ...prev, positionMarkers: markers }));
  }, [tradePositions, createPositionMarkers]);

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!realTimeEnabled || !initialLoadRef.current) return;

    const stream = symbol.toLowerCase() + '@ticker';
    const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
    
    console.log('[Enhanced Binance WS]', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const time = Math.floor(Date.now() / 1000);
        const price = parseFloat(msg.c);
        
        if (isNaN(price)) return;

        setState(prev => {
          const lastTime = prev.data.length > 0 ? prev.data[prev.data.length - 1].time : 0;
          
          if (time <= lastTime) {
            return prev; // Skip duplicate or out-of-order data
          }

          const newDataPoint: ChartDataPoint = { time, value: price };
          const newCandlePoint: CandleDataPoint = {
            time,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0
          };

          const updatedData = [...prev.data, newDataPoint].slice(-500); // Keep last 500 points
          const updatedCandleData = [...prev.candlestickData, newCandlePoint].slice(-500);

          return {
            ...prev,
            data: updatedData,
            candlestickData: updatedCandleData
          };
        });
      } catch (error) {
        console.error('[Enhanced Binance WS] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[Enhanced Binance WS] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[Enhanced Binance WS] Connection closed');
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, realTimeEnabled]);

  return {
    ...state,
    loadMoreHistoricalData,
    resetData
  };
} 