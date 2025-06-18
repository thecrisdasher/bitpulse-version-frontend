import { MarketData, MarketDataPoint } from './marketDataService';

// Semilla para generación de números pseudoaleatorios
let priceHistorySeed = Date.now();

// Función de generación pseudoaleatoria determinista
const pseudoRandom = (seed: number) => {
  return ((seed * 9301 + 49297) % 233280) / 233280;
};

// Parámetros para simulación de diferentes categorías
const SIMULATION_PARAMS = {
  criptomonedas: {
    baseVolatility: 0.05, // 5% volatilidad
    trendStrength: 0.6,   // Qué tan fuerte es la tendencia
    baseValues: {
      'BTC': 27500 * 4200,
      'ETH': 1850 * 4200,
      'BNB': 215 * 4200,
      'XRP': 0.62 * 4200,
      'ADA': 0.38 * 4200,
      'DOGE': 0.089 * 4200,
      'SOL': 102 * 4200,
      'DOT': 5.9 * 4200,
      'SHIB': 0.00002232 * 4200,
      'AVAX': 39 * 4200,
      'MATIC': 0.98 * 4200,
      'LTC': 70 * 4200,
      'BTC/USD': 27500 * 4200,
      'ETH/USD': 1850 * 4200,
      'default': 500 * 4200
    },
    names: {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'XRP': 'Ripple',
      'ADA': 'Cardano',
      'DOGE': 'Dogecoin',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'SHIB': 'Shiba Inu',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon',
      'LTC': 'Litecoin',
      'BTC/USD': 'Bitcoin/USD',
      'ETH/USD': 'Ethereum/USD'
    }
  },
  forex: {
    baseVolatility: 0.01, // 1% volatilidad
    trendStrength: 0.8,   // Muy estable
    baseValues: {
      'EUR/USD': 1.07 * 4200,
      'GBP/USD': 1.25 * 4200,
      'USD/JPY': 156.37 * 4200,
      'USD/CHF': 0.905 * 4200,
      'USD/CAD': 1.375 * 4200,
      'EUR/GBP': 0.854 * 4200,
      'default': 1 * 4200
    }
  },
  indices: {
    baseVolatility: 0.02, // 2% volatilidad
    trendStrength: 0.7,   // Tendencia moderada
    baseValues: {
      'SPX': 5200 * 4200,
      'NASDAQ': 16450 * 4200,
      'DJI': 39000 * 4200,
      'FTSE': 8000 * 4200,
      'DAX': 18000 * 4200,
      'NIKKEI': 38000 * 4200,
      'default': 10000 * 4200
    },
    names: {
      'SPX': 'S&P 500',
      'NASDAQ': 'NASDAQ Composite',
      'DJI': 'Dow Jones Industrial Average',
      'FTSE': 'FTSE 100',
      'DAX': 'DAX Index',
      'NIKKEI': 'Nikkei 225'
    }
  },
  'materias-primas': {
    baseVolatility: 0.03, // 3% volatilidad
    trendStrength: 0.5,   // Tendencia media
    baseValues: {
      'GOLD': 2300 * 4200,
      'SILVER': 28 * 4200,
      'OIL': 82 * 4200,
      'NGAS': 2.1 * 4200,
      'COPPER': 4.55 * 4200,
      'CORN': 442 * 4200,
      'WHEAT': 608 * 4200,
      'default': 100 * 4200
    },
    names: {
      'GOLD': 'Oro',
      'SILVER': 'Plata',
      'OIL': 'Crudo WTI',
      'NGAS': 'Gas Natural',
      'COPPER': 'Cobre',
      'CORN': 'Maíz',
      'WHEAT': 'Trigo'
    }
  },
  derivados: {
    baseVolatility: 0.04, // 4% volatilidad
    trendStrength: 0.3,   // Tendencia débil (más aleatorio)
    baseValues: {
      'default': 10000 * 4200
    }
  },
  sinteticos: {
    baseVolatility: 0.07, // 7% volatilidad
    trendStrength: 0.2,   // Muy aleatorio
    baseValues: {
      'volatility-10': 10000 * 4200,
      'volatility-25': 25000 * 4200,
      'volatility-50': 50000 * 4200,
      'volatility-75': 75000 * 4200,
      'volatility-100': 100000 * 4200,
      'boom-1000': 16000 * 4200,
      'crash-1000': 17000 * 4200,
      'default': 10000 * 4200
    },
    names: {
      'volatility-10': 'Índice de Volatilidad 10',
      'volatility-25': 'Índice de Volatilidad 25',
      'volatility-50': 'Índice de Volatilidad 50',
      'volatility-75': 'Índice de Volatilidad 75',
      'volatility-100': 'Índice de Volatilidad 100',
      'boom-1000': 'Boom 1000 Índice',
      'crash-1000': 'Crash 1000 Índice'
    }
  },
  baskets: {
    baseVolatility: 0.025, // 2.5% volatilidad
    trendStrength: 0.65,   // Tendencia moderada a fuerte
    baseValues: {
      'FAANG': 15000 * 4200,
      'ENRG': 12000 * 4200, 
      'TECH': 18000 * 4200,
      'BANK': 9000 * 4200,
      'HLTH': 1567.89 * 4200,
      'GAME': 945.32 * 4200,
      'AUTO': 1123.45 * 4200,
      'REIT': 756.78 * 4200,
      'AIML': 1789.23 * 4200,
      'CRYP': 2134.56 * 4200,
      'default': 10000 * 4200
    },
    names: {
      'FAANG': 'Basket FAANG Tech',
      'ENRG': 'Basket Energía',
      'TECH': 'Basket Tecnología',
      'BANK': 'Basket Bancos',
      'HLTH': 'Healthcare Basket',
      'GAME': 'Gaming & Entertainment',
      'AUTO': 'Automotive Basket',
      'REIT': 'Real Estate Basket',
      'AIML': 'AI & Machine Learning',
      'CRYP': 'Crypto Index Basket'
    }
  },
  acciones: {
    baseVolatility: 0.035, // 3.5% volatilidad (mayor que baskets)
    trendStrength: 0.45,   // Tendencia moderada
    baseValues: {
      'AAPL': 192.53 * 4200,
      'MSFT': 378.94 * 4200,
      'GOOGL': 143.67 * 4200,
      'AMZN': 145.23 * 4200,
      'TSLA': 248.42 * 4200,
      'NVDA': 487.56 * 4200,
      'META': 342.89 * 4200,
      'NFLX': 456.78 * 4200,
      'DIS': 89.67 * 4200,
      'JPM': 167.45 * 4200,
      'KO': 58.34 * 4200,
      'BAC': 32.45 * 4200,
      'default': 150 * 4200
    },
    names: {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'DIS': 'Walt Disney Co.',
      'JPM': 'JPMorgan Chase & Co.',
      'KO': 'Coca-Cola Co.',
      'BAC': 'Bank of America Corp.'
    }
  }
};

// Obtener el precio base para un instrumento
const getBasePrice = (symbol: string, category: string): number => {
  const params = SIMULATION_PARAMS[category as keyof typeof SIMULATION_PARAMS];
  if (!params) return 500 * 4200; // Valor predeterminado

  const values = params.baseValues as Record<string, number>;
  return values[symbol] || values['default'] || 500 * 4200;
};

// Obtener nombre para un instrumento
const getInstrumentName = (symbol: string, category: string): string => {
  const params = SIMULATION_PARAMS[category as keyof typeof SIMULATION_PARAMS];
  if (!params) return symbol;

  // Verificar si la categoría tiene mapeo de nombres
  if ('names' in params) {
    const names = params.names as Record<string, string>;
    return names[symbol] || symbol;
  }
  
  return symbol;
};

// Generar datos simulados con volatilidad realista y tendencias
export const generateRealisticMarketData = (symbol: string, category: string): MarketData => {
  // Obtener parámetros de simulación
  const params = SIMULATION_PARAMS[category as keyof typeof SIMULATION_PARAMS] || SIMULATION_PARAMS.sinteticos;
  
  // Obtener precio base y volatilidad
  const basePrice = getBasePrice(symbol, category);
  const volatility = params.baseVolatility;
  const trendStrength = params.trendStrength;
  
  // Generar semilla estable para este símbolo (para consistencia entre llamadas)
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generar tendencia diaria (positiva o negativa)
  priceHistorySeed = (priceHistorySeed * 9301 + 49297) % 233280;
  const dailyTrend = pseudoRandom(symbolSeed + priceHistorySeed) > 0.5 ? 1 : -1;
  
  // Generar datos de precio histórico con tendencias realistas
  const now = Date.now();
  const priceHistory: MarketDataPoint[] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 60 * 60 * 1000; // Datos horarios
    
    // Generar componente aleatorio
    priceHistorySeed = (priceHistorySeed * 9301 + 49297) % 233280;
    const randomComponent = (pseudoRandom(symbolSeed + priceHistorySeed) * 2 - 1) * volatility;
    
    // Generar componente de tendencia
    const trendComponent = dailyTrend * trendStrength * (i / 24) * volatility;
    
    // Calcular cambio de precio
    const priceChange = currentPrice * (randomComponent + trendComponent);
    currentPrice += priceChange;
    
    // Asegurar que el precio no sea negativo
    currentPrice = Math.max(currentPrice, basePrice * 0.1);
    
    priceHistory.push({ timestamp, price: currentPrice });
  }
  
  // Calcular cambio en las últimas 24h
  const lastPrice = priceHistory[priceHistory.length - 1].price;
  const firstPrice = priceHistory[0].price;
  const change24h = lastPrice - firstPrice;
  const changePercent24h = (change24h / firstPrice) * 100;
  
  // Obtener nombre adecuado para el instrumento
  const name = getInstrumentName(symbol, category);
  
  return {
    symbol,
    name,
    currentPrice: lastPrice,
    change24h,
    changePercent24h,
    high24h: Math.max(...priceHistory.map(p => p.price)),
    low24h: Math.min(...priceHistory.map(p => p.price)),
    priceHistory,
    lastUpdated: now,
    isRealTime: false // Marcar como datos simulados
  };
};

// Generar actualizaciones incrementales para datos simulados
export const updateSimulatedMarketData = (prevData: MarketData): MarketData => {
  if (!prevData) return prevData;
  
  // Extraer el símbolo y categoría desde el nombre
  let category = 'criptomonedas'; // Categoría predeterminada
  
  // Intentar adivinar la categoría basado en el símbolo y el nombre
  if (prevData.symbol.includes('/') && !prevData.symbol.includes('BTC')) {
    category = 'forex';
  } else if (prevData.name.includes('Índice') || prevData.name.includes('Index')) {
    category = 'indices';
  } else if (prevData.name.includes('Volatility') || prevData.name.includes('Boom') || 
             prevData.name.includes('Crash') || prevData.name.includes('Step')) {
    category = 'sinteticos';
  } else if (prevData.name.includes('Basket')) {
    category = 'baskets';
  } else if (prevData.name.includes('Oro') || prevData.name.includes('Gold') || 
             prevData.name.includes('Oil') || prevData.name.includes('Silver') ||
             prevData.name.includes('Copper') || prevData.name.includes('Platinum')) {
    category = 'materias-primas';
  } else if (prevData.name.includes('Inc.') || prevData.name.includes('Corp.') ||
             prevData.name.includes('Co.') || prevData.symbol.match(/^[A-Z]{1,5}$/)) {
    category = 'acciones';
  }

  // Obtener parámetros de simulación
  const params = SIMULATION_PARAMS[category as keyof typeof SIMULATION_PARAMS] || 
                 SIMULATION_PARAMS.sinteticos;

  // Decidir si seguir la tendencia anterior o cambiarla
  priceHistorySeed = (priceHistorySeed * 9301 + 49297) % 233280;
  const continueTrend = pseudoRandom(priceHistorySeed) < 0.8; // 80% probabilidad de continuar tendencia

  // Calcular volatilidad actual
  const volatility = params.baseVolatility * 0.5; // Reducir volatilidad para actualizaciones pequeñas

  // Generar cambio aleatorio
  priceHistorySeed = (priceHistorySeed * 9301 + 49297) % 233280;
  let randomChange = (pseudoRandom(priceHistorySeed) * 2 - 1) * volatility;

  if (continueTrend) {
    // Seguir la tendencia anterior (si el precio estaba subiendo, tiende a seguir subiendo)
    const prevTrend = prevData.change24h > 0 ? 1 : -1;
    randomChange = Math.abs(randomChange) * prevTrend * 0.7 + randomChange * 0.3;
  }

  // Calcular nuevo precio
  const newPrice = prevData.currentPrice * (1 + randomChange);

  // Actualizar historial de precios
  const now = Date.now();
  const updatedHistory = [
    ...prevData.priceHistory,
    { timestamp: now, price: newPrice }
  ].slice(-100); // Mantener solo los últimos 100 puntos

  // Calcular cambios
  const change24h = newPrice - (updatedHistory[0]?.price || prevData.currentPrice);
  const changePercent24h = (change24h / (updatedHistory[0]?.price || prevData.currentPrice)) * 100;

  return {
    ...prevData,
    currentPrice: newPrice,
    change24h,
    changePercent24h,
    high24h: Math.max(prevData.high24h || 0, newPrice),
    low24h: Math.min(prevData.low24h || Infinity, newPrice),
    priceHistory: updatedHistory,
    lastUpdated: now,
    isRealTime: false // Marcar como datos simulados
  };
}; 