import type { BitstampOHLC } from './bitstampService';

// Map seconds-based timeframes to Binance interval strings
const SECONDS_TO_BINANCE_INTERVAL: Record<number, string> = {
  300: '5m',
  900: '15m',
  3600: '1h',
  14400: '4h',
  86400: '1d'
};

class BinanceService {
  private readonly API_ROUTE = '/api/binance/klines';

  /**
   * Fetch OHLC data from the Binance API route and convert to BitstampOHLC format
   * @param symbol e.g. 'BTC/USD' or 'BTCUSD'
   * @param step timeframe in seconds (300, 900, 3600, etc)
   * @param limit number of data points to fetch (default 100)
   */
  async getOHLCData(symbol: string, step: number, limit: number = 100): Promise<BitstampOHLC[]> {
    // Extract base asset from symbol
    let base = symbol.includes('/') ? symbol.split('/')[0] : symbol;
    base = base.toUpperCase();
    // Append USDT if missing
    const rawSymbol = base.endsWith('USDT') ? base : `${base}USDT`;
    // Determine Binance interval
    const interval = SECONDS_TO_BINANCE_INTERVAL[step] || '1h';
    // Build API URL
    const url = `${this.API_ROUTE}?symbol=${encodeURIComponent(rawSymbol)}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const rawArray: any[] = Array.isArray(data) ? data : [];
    // Convert each kline to BitstampOHLC shape
    return rawArray.map((c: any) => ({
      timestamp: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    }));
  }
}

export const binanceService = new BinanceService();