import { useState, useEffect } from 'react';
import { marketAnalysisService } from '../services/marketAnalysisService';
import { binanceService } from '../services/binanceService';
import type { MarketAnalysis } from '../services/marketAnalysisService';

interface UseMarketAnalysisProps {
  symbol: string;
  timeframe: number;
}

interface UseMarketAnalysisState {
  analysis: MarketAnalysis | null;
  loading: boolean;
  error: string | null;
}

export function useMarketAnalysis({ symbol, timeframe }: UseMarketAnalysisProps) {
  const [state, setState] = useState<UseMarketAnalysisState>({
    analysis: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Obtener datos del par actual desde Binance
        const currentPairData = await binanceService.getOHLCData(symbol, timeframe);

        // Obtener datos de todos los pares disponibles para comparación desde Binance
        const allPairsData: Record<string, any> = {};
        const pairs = ['BTC/USD', 'ETH/USD', 'XRP/USD'];
        
        await Promise.all(
          pairs.map(async (pair) => {
            const data = await binanceService.getOHLCData(pair, timeframe);
            allPairsData[pair] = data;
          })
        );

        // Realizar análisis completo
        const analysis = marketAnalysisService.analyzeMarket(currentPairData, allPairsData);

        if (mounted) {
          setState({
            analysis,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Error al analizar el mercado'
          }));
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Actualizar cada minuto

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbol, timeframe]);

  return state;
} 