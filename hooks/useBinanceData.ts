import { useState, useEffect, useRef } from 'react';

export interface ChartDataPoint { time: number; value: number; }
export interface CandleDataPoint { time: number; open: number; high: number; low: number; close: number; }

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

/**
 * Fetches Binance historical candlestick data and subscribes to real-time ticker
 * @param symbol e.g. 'BTCUSDT'
 * @param timeRange '1h'|'24h'|'7d'|'30d'
 * @param realTimeEnabled subscribe to WS
 */
export default function useBinanceData(
  symbol: string,
  timeRange: '1h' | '24h' | '7d' | '30d',
  realTimeEnabled: boolean
): { data: ChartDataPoint[]; candlestickData: CandleDataPoint[] } {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [candlestickData, setCandleData] = useState<CandleDataPoint[]>([]);
  const wsRef = useRef<WebSocket|null>(null);

  // load historical data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const interval = timeRangeToInterval(timeRange);
        const limit = 100;
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        console.log('[Binance REST]', url);
        const res = await fetch(url);
        const raw = await res.json();
        const linePoints: ChartDataPoint[] = raw.map((c: any) => ({
          time: Math.floor(c[0] / 1000),
          value: parseFloat(c[4])
        }));
        const candles: CandleDataPoint[] = raw.map((c: any) => ({
          time: Math.floor(c[0] / 1000),
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4])
        }));
        setData(linePoints);
        setCandleData(candles);
      } catch (err) {
        console.error('Error fetching Binance history', err);
      }
    };
    fetchHistory();
  }, [symbol, timeRange]);

  // subscribe to real-time ticker
  useEffect(() => {
    if (!realTimeEnabled) return;
    const stream = symbol.toLowerCase() + '@ticker';
    const url = `wss://stream.binance.com:9443/ws/${stream}`;
    console.log('[Binance WS]', url);
    const ws = new WebSocket(url);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const time = Math.floor(Date.now() / 1000);
        setData(prev => {
          const lastTime = prev.length ? prev[prev.length - 1].time : 0;
          if (time <= lastTime) {
            // skip duplicate or out-of-order
            return prev;
          }
          const next = [...prev, { time, value: parseFloat(msg.c) } as ChartDataPoint];
          return next.slice(-100);
        });
      } catch (e) {
        console.error('Error parsing Binance WS message', e);
      }
    };
    wsRef.current = ws;
    return () => { ws.close(); };
  }, [symbol, realTimeEnabled]);

  return { data, candlestickData };
} 