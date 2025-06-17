import { useState, useEffect, useCallback } from 'react';
import { getSimulatedTicker } from '@/lib/simulator';

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
}

interface TrendingDataState {
  data: TrendingCrypto[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  usingFallback: boolean;
}

/**
 * Hook para obtener datos de trending con fallback automático
 * Intenta usar Binance API primero, luego fallback a simulador
 */
export function useTrendingData(limit: number = 20, refreshInterval: number = 30000) {
  const [state, setState] = useState<TrendingDataState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    usingFallback: false
  });

  // Símbolos principales para trending
  const TRENDING_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
    'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'DOGEUSDT',
    'AVAXUSDT', 'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
    'ALGOUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT'
  ];

  /**
   * Intenta obtener datos desde Binance API
   */
  const fetchFromBinance = useCallback(async (): Promise<TrendingCrypto[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      console.log('[TrendingData] Fetching from Binance API...');
      
      // Obtener datos de 24hr ticker para todos los símbolos
      const symbolsQuery = encodeURIComponent(JSON.stringify(TRENDING_SYMBOLS));
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsQuery}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const binanceData = await response.json();
      
      if (!Array.isArray(binanceData)) {
        throw new Error('Invalid API response format');
      }

      // Transformar datos de Binance al formato esperado
      const trendingData: TrendingCrypto[] = binanceData.map((item: any, index: number) => {
        const symbol = String(item.symbol).replace('USDT', '');
        const price = parseFloat(item.lastPrice);
        const change24h = parseFloat(item.priceChangePercent);
        const volume24h = parseFloat(item.volume) * price; // Aproximación del volumen en USD

        return {
          id: index + 1,
          name: getSymbolName(symbol),
          symbol: symbol,
          price: price,
          change24h: change24h,
          change7d: change24h * (0.8 + Math.random() * 0.4), // Estimación 7d
          marketCap: calculateMarketCap(symbol, price),
          volume24h: volume24h,
          circulatingSupply: getCirculatingSupply(symbol),
          totalSupply: getTotalSupply(symbol),
          priceHistory: generatePriceHistory(price),
          rank: index + 1
        };
      });

      console.log(`[TrendingData] Successfully fetched ${trendingData.length} items from Binance`);
      return trendingData.slice(0, limit);

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn(`[TrendingData] Binance API failed: ${error.message}`);
      throw error;
    }
  }, [limit]);

  /**
   * Genera datos usando el simulador como fallback
   */
  const fetchFromSimulator = useCallback((): TrendingCrypto[] => {
    console.log('[TrendingData] Using simulator fallback...');
    
    const simulatedData: TrendingCrypto[] = TRENDING_SYMBOLS.slice(0, limit).map((symbolUsdt, index) => {
      const symbol = symbolUsdt.replace('USDT', '');
      const tickerData = getSimulatedTicker(symbolUsdt);

      return {
        id: index + 1,
        name: getSymbolName(symbol),
        symbol: symbol,
        price: tickerData.price,
        change24h: tickerData.change24h,
        change7d: tickerData.change24h * (0.8 + Math.random() * 0.4),
        marketCap: calculateMarketCap(symbol, tickerData.price),
        volume24h: tickerData.volume,
        circulatingSupply: getCirculatingSupply(symbol),
        totalSupply: getTotalSupply(symbol),
        priceHistory: generatePriceHistory(tickerData.price),
        rank: index + 1
      };
    });

    console.log(`[TrendingData] Generated ${simulatedData.length} items from simulator`);
    return simulatedData;
  }, [limit]);

  /**
   * Función principal para obtener datos con fallback automático
   */
  const fetchTrendingData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Intentar Binance API primero
      const data = await fetchFromBinance();
      
      setState({
        data,
        loading: false,
        error: null,
        lastUpdate: new Date(),
        usingFallback: false
      });

    } catch (error: any) {
      // Fallback automático al simulador
      console.log('[TrendingData] Falling back to simulator...');
      
      try {
        const data = fetchFromSimulator();
        
        setState({
          data,
          loading: false,
          error: null,
          lastUpdate: new Date(),
          usingFallback: true
        });

      } catch (fallbackError: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: `Failed to fetch data: ${fallbackError.message}`,
          usingFallback: false
        }));
      }
    }
  }, [fetchFromBinance, fetchFromSimulator]);

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

/**
 * Funciones auxiliares
 */
function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'BNB',
    'XRP': 'XRP',
    'ADA': 'Cardano',
    'SOL': 'Solana',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'DOGE': 'Dogecoin',
    'AVAX': 'Avalanche',
    'UNI': 'Uniswap',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'ATOM': 'Cosmos',
    'ALGO': 'Algorand',
    'VET': 'VeChain',
    'FIL': 'Filecoin',
    'TRX': 'TRON',
    'ETC': 'Ethereum Classic'
  };
  return names[symbol] || symbol;
}

function calculateMarketCap(symbol: string, price: number): number {
  const circulatingSupply = getCirculatingSupply(symbol);
  return price * circulatingSupply;
}

function getCirculatingSupply(symbol: string): number {
  const supplies: Record<string, number> = {
    'BTC': 19700000,
    'ETH': 120000000,
    'BNB': 154000000,
    'XRP': 52000000000,
    'ADA': 35000000000,
    'SOL': 400000000,
    'DOT': 1250000000,
    'MATIC': 9300000000,
    'LINK': 500000000,
    'DOGE': 145000000000,
    'AVAX': 340000000,
    'UNI': 760000000,
    'LTC': 73000000,
    'BCH': 19700000,
    'ATOM': 350000000,
    'ALGO': 7000000000,
    'VET': 86000000000,
    'FIL': 400000000,
    'TRX': 92000000000,
    'ETC': 140000000
  };
  return supplies[symbol] || 1000000;
}

function getTotalSupply(symbol: string): number {
  const supplies: Record<string, number> = {
    'BTC': 21000000,
    'ETH': 120000000,
    'BNB': 200000000,
    'XRP': 100000000000,
    'ADA': 45000000000,
    'SOL': 500000000,
    'DOT': 1250000000,
    'MATIC': 10000000000,
    'LINK': 1000000000,
    'DOGE': 145000000000,
    'AVAX': 720000000,
    'UNI': 1000000000,
    'LTC': 84000000,
    'BCH': 21000000,
    'ATOM': 350000000,
    'ALGO': 10000000000,
    'VET': 86000000000,
    'FIL': 2000000000,
    'TRX': 92000000000,
    'ETC': 210000000
  };
  return supplies[symbol] || getCirculatingSupply(symbol);
}

function generatePriceHistory(currentPrice: number): number[] {
  const history = [];
  let price = currentPrice;
  
  for (let i = 6; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    price = price * (1 + variation);
    history.unshift(price);
  }
  
  history[history.length - 1] = currentPrice; // Ensure last price is current
  return history;
} 