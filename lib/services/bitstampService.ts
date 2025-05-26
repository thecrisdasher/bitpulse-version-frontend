import { apiClient } from '../api/apiClient';

// Interfaces para los datos de Bitstamp
export interface BitstampTicker {
  high: string;
  last: string;
  timestamp: string;
  bid: string;
  vwap: string;
  volume: string;
  low: string;
  ask: string;
  open: string;
}

export interface BitstampOHLC {
  high: string;
  timestamp: string;
  volume: string;
  low: string;
  close: string;
  open: string;
}

export interface BitstampTransaction {
  date: string;
  tid: string;
  amount: string;
  type: string;
  price: string;
}

// Mapeo de símbolos internos a símbolos de Bitstamp
const SYMBOL_MAPPING: Record<string, string> = {
  'bitcoin': 'btcusd',
  'ethereum': 'ethusd',
  'litecoin': 'ltcusd',
  'ripple': 'xrpusd',
  'bitcoin-cash': 'bchusd',
  'cardano': 'adausd',
  'polkadot': 'dotusd',
  'solana': 'solusd',
  'dogecoin': 'dogeusd',
  'chainlink': 'linkusd',
  'polygon': 'maticusd',
};

// Clase principal del servicio Bitstamp
export class BitstampService {
  private baseUrl = 'https://www.bitstamp.net/api/v2';

  /**
   * Obtener ticker actual para una criptomoneda
   */
  async getTicker(symbol: string): Promise<BitstampTicker | null> {
    try {
      const bitstampSymbol = SYMBOL_MAPPING[symbol];
      if (!bitstampSymbol) {
        console.warn(`Símbolo ${symbol} no soportado por Bitstamp`);
        return null;
      }

      const response = await apiClient.get<BitstampTicker>(
        `/ticker/${bitstampSymbol}/`,
        {
          provider: 'BITSTAMP',
          category: 'CRYPTO',
          instrument: symbol,
          useProxy: true,
          useFetch: true
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error obteniendo ticker de ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Obtener datos OHLC para gráficos de velas
   */
  async getOHLCData(
    symbol: string, 
    step: number = 3600, // 1 hora por defecto
    limit: number = 100
  ): Promise<BitstampOHLC[]> {
    try {
      const bitstampSymbol = SYMBOL_MAPPING[symbol];
      if (!bitstampSymbol) {
        console.warn(`Símbolo ${symbol} no soportado por Bitstamp`);
        return [];
      }

      const response = await apiClient.get<{ data: { ohlc: BitstampOHLC[] } }>(
        `/ohlc/${bitstampSymbol}/`,
        {
          provider: 'BITSTAMP',
          category: 'CRYPTO',
          instrument: symbol,
          useProxy: true,
          useFetch: true,
          params: {
            step: step.toString(),
            limit: limit.toString()
          }
        }
      );

      const ohlcData = response.data.data?.ohlc || [];
      
      if (ohlcData.length === 0) {
        console.warn(`No hay datos OHLC disponibles para ${symbol} en Bitstamp`);
      }

      return ohlcData;
    } catch (error) {
      console.error(`Error obteniendo datos OHLC de ${symbol}:`, error);
      // Re-lanzar el error para que sea manejado por el hook
      throw new Error(`No se pudo conectar con Bitstamp para obtener datos de ${symbol}`);
    }
  }

  /**
   * Obtener transacciones recientes
   */
  async getTransactions(symbol: string, time: string = 'hour'): Promise<BitstampTransaction[]> {
    try {
      const bitstampSymbol = SYMBOL_MAPPING[symbol];
      if (!bitstampSymbol) {
        console.warn(`Símbolo ${symbol} no soportado por Bitstamp`);
        return [];
      }

      const response = await apiClient.get<BitstampTransaction[]>(
        `/transactions/${bitstampSymbol}/`,
        {
          provider: 'BITSTAMP',
          category: 'CRYPTO',
          instrument: symbol,
          useProxy: true,
          useFetch: true,
          params: {
            time
          }
        }
      );

      return response.data || [];
    } catch (error) {
      console.error(`Error obteniendo transacciones de ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Obtener datos históricos para una fecha específica
   */
  async getHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    step: number = 3600
  ): Promise<BitstampOHLC[]> {
    try {
      const bitstampSymbol = SYMBOL_MAPPING[symbol];
      if (!bitstampSymbol) {
        console.warn(`Símbolo ${symbol} no soportado por Bitstamp`);
        return [];
      }

      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      const response = await apiClient.get<{ data: { ohlc: BitstampOHLC[] } }>(
        `/ohlc/${bitstampSymbol}/`,
        {
          provider: 'BITSTAMP',
          category: 'CRYPTO',
          instrument: symbol,
          useProxy: true,
          useFetch: true,
          params: {
            step: step.toString(),
            start: startTimestamp.toString(),
            end: endTimestamp.toString()
          }
        }
      );

      const ohlcData = response.data.data?.ohlc || [];
      
      if (ohlcData.length === 0) {
        console.warn(`No hay datos históricos disponibles para ${symbol} en Bitstamp`);
      }

      return ohlcData;
    } catch (error) {
      console.error(`Error obteniendo datos históricos de ${symbol}:`, error);
      // Re-lanzar el error para que sea manejado por el hook
      throw new Error(`No se pudo conectar con Bitstamp para obtener datos históricos de ${symbol}`);
    }
  }

  /**
   * Convertir datos de Bitstamp al formato interno
   */
  convertToInternalFormat(ohlcData: BitstampOHLC[]) {
    return ohlcData.map(item => ({
      time: parseInt(item.timestamp),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume)
    }));
  }

  /**
   * Verificar si un símbolo está soportado
   */
  isSymbolSupported(symbol: string): boolean {
    return symbol in SYMBOL_MAPPING;
  }

  /**
   * Obtener todos los símbolos soportados
   */
  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_MAPPING);
  }
}

// Instancia singleton del servicio
export const bitstampService = new BitstampService(); 