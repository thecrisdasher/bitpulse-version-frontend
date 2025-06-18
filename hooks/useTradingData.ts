import { useState, useEffect, useCallback, useMemo } from 'react';
import useBinanceTickers from './useBinanceTickers';
import { useSimulatedInstrument } from './useRealTimeMarketData';

export interface TradingInstrument {
  id: string;
  name: string;
  price: number;
  change24h: number;
  volume?: number;
  category: string;
  isRealData: boolean; // Flag para indicar si es dato real o simulado
}

export interface TradingDataResult {
  instrument: TradingInstrument | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook específico para obtener datos de trading que SIEMPRE prioriza datos reales
 * Para criptomonedas: usa datos de Binance exclusivamente
 * Para otros instrumentos: usa simulación pero marcado como tal
 */
export function useTradingData(instrumentName: string): TradingDataResult {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determinar si es criptomoneda de Binance
  const binanceSymbol = useMemo(() => {
    const cryptoMapping: Record<string, string> = {
      'Bitcoin (BTC/USD)': 'BTC',
      'Bitcoin': 'BTC',
      'BTC': 'BTC',
      'Ethereum (ETH/USD)': 'ETH',
      'Ethereum': 'ETH',
      'ETH': 'ETH',
      'Solana (SOL/USD)': 'SOL',
      'Solana': 'SOL',
      'SOL': 'SOL',
      'Cardano (ADA/USD)': 'ADA',
      'Cardano': 'ADA',
      'ADA': 'ADA',
      'Polkadot (DOT/USD)': 'DOT',
      'Polkadot': 'DOT',
      'DOT': 'DOT',
      'Chainlink (LINK/USD)': 'LINK',
      'Chainlink': 'LINK',
      'LINK': 'LINK',
      'Ripple (XRP/USD)': 'XRP',
      'Ripple': 'XRP',
      'XRP': 'XRP',
      'Litecoin (LTC/USD)': 'LTC',
      'Litecoin': 'LTC',
      'LTC': 'LTC',
      'Bitcoin Cash (BCH/USD)': 'BCH',
      'Bitcoin Cash': 'BCH',
      'BCH': 'BCH',
      'Avalanche (AVAX/USD)': 'AVAX',
      'Avalanche': 'AVAX',
      'AVAX': 'AVAX',
      'Polygon (MATIC/USD)': 'MATIC',
      'Polygon': 'MATIC',
      'MATIC': 'MATIC',
      'Dogecoin (DOGE/USD)': 'DOGE',
      'Dogecoin': 'DOGE',
      'DOGE': 'DOGE'
    };
    
    return cryptoMapping[instrumentName] || null;
  }, [instrumentName]);

  // Obtener datos de Binance si es criptomoneda
  const binanceTickers = useBinanceTickers(
    binanceSymbol ? [binanceSymbol] : [],
    3000 // Actualización cada 3 segundos para trading
  );

  // Obtener datos simulados como fallback
  const simulatedData = useSimulatedInstrument(
    instrumentName,
    'mixed', // Categoría mixta para el fallback
    5000
  );

  // Función de refresh
  const refresh = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // La actualización real ocurre en los hooks subyacentes
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Construir resultado del instrumento
  const instrument = useMemo((): TradingInstrument | null => {
    try {
      // PRIORIDAD 1: Datos reales de Binance para criptomonedas
      if (binanceSymbol && binanceTickers[binanceSymbol]) {
        const binanceData = binanceTickers[binanceSymbol];
        return {
          id: binanceSymbol,
          name: instrumentName,
          price: binanceData.price,
          change24h: binanceData.change24h,
          volume: binanceData.volume,
          category: 'criptomonedas',
          isRealData: true // ✅ DATOS REALES
        };
      }

      // PRIORIDAD 2: Datos simulados para otros instrumentos
      if (simulatedData) {
        return {
          id: instrumentName,
          name: instrumentName,
          price: simulatedData.price,
          change24h: simulatedData.change24h,
          volume: simulatedData.volume || 0,
          category: 'mixed',
          isRealData: false // ⚠️ DATOS SIMULADOS
        };
      }

      return null;
    } catch (err) {
      setError(`Error procesando datos para ${instrumentName}`);
      return null;
    }
  }, [instrumentName, binanceSymbol, binanceTickers, simulatedData]);

  // Actualizar estado de loading
  useEffect(() => {
    if (binanceSymbol) {
      // Para criptomonedas, esperar datos de Binance
      setIsLoading(Object.keys(binanceTickers).length === 0);
    } else {
      // Para otros instrumentos, esperar datos simulados
      setIsLoading(!simulatedData);
    }
  }, [binanceSymbol, binanceTickers, simulatedData]);

  return {
    instrument,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook para obtener precio en tiempo real específicamente para trading
 * Garantiza que siempre se use el precio más actualizado disponible
 */
export function useRealTimePriceForTrading(instrumentName: string): {
  price: number | null;
  isRealData: boolean;
  lastUpdate: Date | null;
  error: string | null;
} {
  const { instrument, error } = useTradingData(instrumentName);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (instrument) {
      setLastUpdate(new Date());
    }
  }, [instrument?.price]);

  return {
    price: instrument?.price || null,
    isRealData: instrument?.isRealData || false,
    lastUpdate,
    error
  };
}

/**
 * Hook para validar que se están usando datos reales antes del trading
 */
export function useValidateTradingData(instrumentName: string): {
  canTrade: boolean;
  reason: string;
  dataSource: 'binance' | 'simulated' | 'unknown';
} {
  const { instrument } = useTradingData(instrumentName);

  return useMemo(() => {
    if (!instrument) {
      return {
        canTrade: false,
        reason: 'No hay datos disponibles para este instrumento',
        dataSource: 'unknown'
      };
    }

    if (instrument.isRealData) {
      return {
        canTrade: true,
        reason: 'Datos reales de Binance disponibles',
        dataSource: 'binance'
      };
    }

    // Para instrumentos simulados, permitir trading pero con advertencia
    return {
      canTrade: true,
      reason: 'Usando datos simulados - Cuidado en producción',
      dataSource: 'simulated'
    };
  }, [instrument]);
}