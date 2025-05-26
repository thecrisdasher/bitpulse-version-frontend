export interface MockDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MockMarketData {
  symbol: string;
  data: MockDataPoint[];
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
}

// Generar datos simulados realistas
export const generateMockData = (
  symbol: string,
  basePrice: number = 100,
  days: number = 30,
  volatility: number = 0.02
): MockMarketData => {
  const data: MockDataPoint[] = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  let currentPrice = basePrice;
  
  // Generar datos históricos
  for (let i = days; i >= 0; i--) {
    const time = now - (i * msPerDay);
    
    // Simular movimiento de precio con tendencia y volatilidad
    const trend = (Math.random() - 0.5) * 0.001; // Tendencia muy pequeña
    const randomChange = (Math.random() - 0.5) * volatility;
    const priceChange = currentPrice * (trend + randomChange);
    
    const open = currentPrice;
    const close = Math.max(0.01, currentPrice + priceChange);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    data.push({
      time: Math.floor(time / 1000),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 1000000)
    });
    
    currentPrice = close;
  }
  
  const firstPrice = data[0]?.close || basePrice;
  const lastPrice = data[data.length - 1]?.close || basePrice;
  const change24h = lastPrice - firstPrice;
  const changePercent24h = (change24h / firstPrice) * 100;
  
  return {
    symbol,
    data,
    currentPrice: lastPrice,
    change24h,
    changePercent24h
  };
};

// Datos simulados para diferentes mercados
export const getMockMarketData = (symbol: string): MockMarketData => {
  const marketConfigs = {
    'BTC': { basePrice: 43250, volatility: 0.03 },
    'ETH': { basePrice: 2650, volatility: 0.035 },
    'EUR/USD': { basePrice: 1.0835, volatility: 0.008 },
    'GBP/USD': { basePrice: 1.2718, volatility: 0.01 },
    'SPX': { basePrice: 4750, volatility: 0.015 },
    'NASDAQ': { basePrice: 16800, volatility: 0.02 },
    'GOLD': { basePrice: 2415, volatility: 0.02 },
    'OIL': { basePrice: 78.25, volatility: 0.025 }
  };
  
  const config = marketConfigs[symbol as keyof typeof marketConfigs] || 
                 { basePrice: 100, volatility: 0.02 };
  
  return generateMockData(symbol, config.basePrice, 30, config.volatility);
};

// Simular datos en tiempo real
export const generateRealTimeUpdate = (
  currentPrice: number,
  volatility: number = 0.02
): MockDataPoint => {
  const now = Math.floor(Date.now() / 1000);
  const change = (Math.random() - 0.5) * volatility * currentPrice;
  const newPrice = Math.max(0.01, currentPrice + change);
  
  const high = newPrice * (1 + Math.random() * 0.005);
  const low = newPrice * (1 - Math.random() * 0.005);
  
  return {
    time: now,
    open: currentPrice,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(newPrice * 100) / 100,
    volume: Math.floor(Math.random() * 100000)
  };
}; 