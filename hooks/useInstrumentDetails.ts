import { useState, useEffect } from 'react';
import { MarketData, getMarketData } from '@/lib/api/marketDataService';

// Additional metadata for instruments
export interface InstrumentMetadata {
  fullName: string;
  description?: string;
  icon?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'very-high';
  tags?: string[];
  tradingHours?: string;
  minimumTrade?: number;
  popularity?: number; // 1-100 score
}

// Combined type with market data and metadata
export interface InstrumentDetails {
  marketData: MarketData;
  metadata: InstrumentMetadata;
  loading: boolean;
  error: string | null;
}

// Map instruments to their metadata
const instrumentMetadataMap: Record<string, InstrumentMetadata> = {
  // Cryptocurrencies
  'BTC/USD': {
    fullName: 'Bitcoin',
    description: 'La primera y más grande criptomoneda del mundo por capitalización de mercado.',
    riskLevel: 'high',
    tags: ['crypto', 'popular', 'bitcoin', 'btc'],
    tradingHours: '24/7',
    minimumTrade: 10000,
    popularity: 95,
  },
  'ETH/USD': {
    fullName: 'Ethereum',
    description: 'Plataforma blockchain que permite la creación de contratos inteligentes y aplicaciones descentralizadas.',
    riskLevel: 'high',
    tags: ['crypto', 'popular', 'ethereum', 'eth', 'smart-contracts'],
    tradingHours: '24/7',
    minimumTrade: 10000,
    popularity: 90,
  },
  'XRP/USD': {
    fullName: 'Ripple',
    description: 'Diseñada para facilitar transacciones rápidas y económicas entre instituciones financieras.',
    riskLevel: 'high',
    tags: ['crypto', 'ripple', 'xrp', 'banking'],
    tradingHours: '24/7',
    minimumTrade: 10000,
    popularity: 75,
  },
  
  // Forex
  'EUR/USD': {
    fullName: 'Euro / Dólar estadounidense',
    description: 'El par de divisas más negociado del mundo, representa las dos mayores economías.',
    riskLevel: 'medium',
    tags: ['forex', 'major', 'popular'],
    tradingHours: 'Lun-Vie 00:00-23:00',
    minimumTrade: 5000,
    popularity: 98,
  },
  'GBP/USD': {
    fullName: 'Libra esterlina / Dólar estadounidense',
    description: 'Par que representa la relación entre la economía británica y estadounidense.',
    riskLevel: 'medium',
    tags: ['forex', 'major'],
    tradingHours: 'Lun-Vie 00:00-23:00',
    minimumTrade: 5000,
    popularity: 85,
  },
  
  // Indices
  'US30': {
    fullName: 'Dow Jones Industrial Average',
    description: 'Índice de las 30 empresas industriales más importantes de Estados Unidos.',
    riskLevel: 'medium',
    tags: ['indices', 'usa', 'stocks'],
    tradingHours: 'Lun-Vie 9:30-16:00 EST',
    minimumTrade: 20000,
    popularity: 88,
  },
  'NAS100': {
    fullName: 'Nasdaq 100',
    description: 'Índice de las 100 empresas no financieras más grandes del Nasdaq.',
    riskLevel: 'high',
    tags: ['indices', 'usa', 'tech'],
    tradingHours: 'Lun-Vie 9:30-16:00 EST',
    minimumTrade: 20000,
    popularity: 92,
  },
  
  // Commodities
  'XAU/USD': {
    fullName: 'Oro / Dólar estadounidense',
    description: 'Metal precioso considerado un valor refugio en tiempos de incertidumbre.',
    riskLevel: 'medium',
    tags: ['commodities', 'metals', 'safe-haven'],
    tradingHours: 'Lun-Vie 23:00-22:00',
    minimumTrade: 15000,
    popularity: 90,
  },
  'OIL': {
    fullName: 'Petróleo Crudo',
    description: 'Materia prima energética esencial para la economía global.',
    riskLevel: 'high',
    tags: ['commodities', 'energy'],
    tradingHours: 'Lun-Vie 23:00-22:00',
    minimumTrade: 15000,
    popularity: 87,
  },
  
  // Synthetics
  'volatility-10': {
    fullName: 'Índice de Volatilidad 10',
    description: 'Índice sintético con volatilidad constante del 10%.',
    riskLevel: 'low',
    tags: ['synthetic', 'volatility'],
    tradingHours: '24/7',
    minimumTrade: 5000,
    popularity: 60,
  },
  'volatility-50': {
    fullName: 'Índice de Volatilidad 50',
    description: 'Índice sintético con volatilidad constante del 50%.',
    riskLevel: 'high',
    tags: ['synthetic', 'volatility'],
    tradingHours: '24/7',
    minimumTrade: 5000,
    popularity: 65,
  },
  'boom-1000': {
    fullName: 'Boom 1000 Índice',
    description: 'Índice sintético con patrones de subida repentina.',
    riskLevel: 'very-high',
    tags: ['synthetic', 'boom'],
    tradingHours: '24/7',
    minimumTrade: 5000,
    popularity: 70,
  },
};

// Default metadata for unknown instruments
const defaultMetadata: InstrumentMetadata = {
  fullName: 'Instrumento desconocido',
  description: 'No hay información disponible para este instrumento.',
  riskLevel: 'medium',
  tags: [],
  tradingHours: 'Desconocido',
  minimumTrade: 10000,
  popularity: 50,
};

// Hook to fetch and combine market data with metadata
export const useInstrumentDetails = (
  symbol: string,
  category: string
): InstrumentDetails => {
  const [result, setResult] = useState<InstrumentDetails>({
    marketData: {} as MarketData,
    metadata: defaultMetadata,
    loading: true,
    error: null,
  });
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Reset to loading state
        setResult(prev => ({
          ...prev,
          loading: true,
          error: null,
        }));
        
        // Fetch market data
        const data = await getMarketData(symbol, category);
        
        // Get metadata or use default
        const metadata = instrumentMetadataMap[symbol] || {
          ...defaultMetadata,
          fullName: data.name || symbol, // Use name from market data if available
        };
        
        // Update state if component is still mounted
        if (isMounted) {
          setResult({
            marketData: data,
            metadata,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error(`Error fetching instrument details for ${symbol}:`, error);
        
        // Update error state if component is still mounted
        if (isMounted) {
          setResult(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          }));
        }
      }
    };
    
    // Fetch data when symbol or category changes
    if (symbol && category) {
      fetchData();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [symbol, category]);
  
  return result;
};

export default useInstrumentDetails; 