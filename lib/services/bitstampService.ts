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

// Interface for raw OHLC data from API
export interface BitstampOHLCResponse {
  high: string;
  timestamp: string;
  volume: string;
  low: string;
  close: string;
  open: string;
}

// Interface for internal OHLC data format
export interface BitstampOHLC {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
  private readonly BASE_URL = 'https://www.bitstamp.net/api/v2';

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
   * Convertir datos de Bitstamp al formato interno
   */
  private convertToInternalFormat(ohlcData: BitstampOHLCResponse[]): BitstampOHLC[] {
    return ohlcData
      .map(item => {
        const timestamp = parseInt(item.timestamp);
        // Validate timestamp
        if (isNaN(timestamp) || timestamp <= 0) {
          console.warn('Invalid timestamp in OHLC data:', item);
          return null;
        }

        return {
          timestamp: timestamp * 1000,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume)
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null) // Remove invalid entries
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure data is sorted by time
  }

  /**
   * Obtener datos OHLC para gráficos de velas
   */
  async getOHLCData(
    symbol: string,
    step: number = 3600,
    limit: number = 100
  ): Promise<BitstampOHLC[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/ohlc/${symbol.toLowerCase()}/?step=${step}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener datos OHLC: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.data.ohlc.map((candle: any) => ({
        timestamp: parseInt(candle.timestamp) * 1000, // Convertir a milisegundos
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume)
      }));
    } catch (error) {
      console.error('Error obteniendo datos OHLC de Bitstamp:', error);
      throw error;
    }
  }

  /**
   * Obtener transacciones recientes
   */
  async getTransactions(symbol: string, time: 'minute' | 'hour' | 'day' = 'hour'): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/transactions/${symbol.toLowerCase()}/?time=${time}`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener transacciones: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo transacciones de Bitstamp:', error);
      throw error;
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

  /**
   * Obtener el libro de órdenes para un par de trading
   * @param symbol Par de trading (e.g., 'btcusd')
   */
  async getOrderBook(symbol: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/order_book/${symbol.toLowerCase()}/`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener libro de órdenes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo libro de órdenes de Bitstamp:', error);
      throw error;
    }
  }

  /**
   * Obtener el volumen de trading diario para un par
   * @param symbol Par de trading (e.g., 'btcusd')
   */
  async getTradingVolume(symbol: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/trading-volume/${symbol.toLowerCase()}/`
      );

      if (!response.ok) {
        throw new Error(`Error al obtener volumen de trading: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo volumen de trading de Bitstamp:', error);
      throw error;
    }
  }

  /**
   * Convierte un par de trading al formato de Bitstamp
   * @param symbol Par de trading (e.g., 'BTC/USD')
   * @returns Par en formato Bitstamp (e.g., 'btcusd')
   */
  formatSymbol(symbol: string): string {
    return symbol.replace('/', '').toLowerCase();
  }
}

// Instancia singleton del servicio
export const bitstampService = new BitstampService(); 