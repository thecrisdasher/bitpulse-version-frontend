import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Types
export type MarketCategory = "volatility" | "boom" | "crash" | "cripto" | "forex" | "materias-primas" | "indices";
export type Market = string;
export type TimeRange = "1h" | "24h" | "7d" | "30d";
export type ChartPoint = { x: Date; y: number };

// Define market categories
export interface MarketItem {
  id: string;
  name: string;
  category: MarketCategory;
  label?: string;
  showInRealTime?: boolean;
  baseValue: number;
  color: string;
  icon?: string;
}

// Market configuration with categories
export const MARKET_CATEGORIES: { [key in MarketCategory]: { name: string; icon: string; color: string } } = {
  volatility: { name: "Volatility", icon: "trending-up", color: "hsl(338, 90%, 56%)" },
  boom: { name: "Índices Boom", icon: "trending-up", color: "hsl(143, 85%, 52%)" },
  crash: { name: "Índices Crash", icon: "trending-down", color: "hsl(0, 85%, 52%)" },
  cripto: { name: "Criptomonedas", icon: "trending-up", color: "hsl(41, 98%, 49%)" },
  forex: { name: "Forex", icon: "trending-up", color: "hsl(207, 90%, 61%)" },
  "materias-primas": { name: "Materias Primas", icon: "trending-up", color: "hsl(43, 95%, 47%)" },
  indices: { name: "Índices Stock", icon: "trending-up", color: "hsl(210, 20%, 80%)" },
};

// Market configurations
export const MARKETS: MarketItem[] = [
  // Volatility indices
  { id: "volatility-100", name: "Índice Volatility 100", category: "volatility", label: "100", baseValue: 623, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-100-1s", name: "Índice Volatility 100 (1s)", category: "volatility", label: "100", showInRealTime: true, baseValue: 631.36, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-50", name: "Índice Volatility 50", category: "volatility", label: "50", baseValue: 420, color: "hsl(338, 90%, 56%)" },
  
  // Boom indices
  { id: "boom-500", name: "Índice Boom 500", category: "boom", label: "500", baseValue: 500, color: "hsl(143, 85%, 52%)" },
  { id: "boom-1000", name: "Índice Boom 1000", category: "boom", label: "1000", baseValue: 1000, color: "hsl(143, 85%, 52%)" },
  
  // Crash indices
  { id: "crash-300", name: "Índice Crash 300", category: "crash", label: "300", baseValue: 300, color: "hsl(0, 85%, 52%)" },
  { id: "crash-500", name: "Índice Crash 500", category: "crash", label: "500", baseValue: 500, color: "hsl(0, 85%, 52%)" },
  
  // Cryptocurrencies
  { id: "bitcoin", name: "Bitcoin (BTC)", category: "cripto", baseValue: 29000, color: "hsl(41, 98%, 49%)" },
  { id: "ethereum", name: "Ethereum (ETH)", category: "cripto", baseValue: 1800, color: "hsl(207, 90%, 61%)" },
  
  // Commodities
  { id: "gold", name: "Gold", category: "materias-primas", baseValue: 2400, color: "hsl(43, 95%, 47%)" },
  
  // Forex
  { id: "eurusd", name: "EUR/USD", category: "forex", baseValue: 1.08, color: "hsl(207, 90%, 61%)" },
  
  // Stock indices
  { id: "us500", name: "US 500", category: "indices", baseValue: 5300, color: "hsl(210, 20%, 80%)" },
];

// Time periods
export const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H", dataPoints: 20, interval: 3 * 60 * 1000 }, 
  { id: "24h" as TimeRange, label: "24H", dataPoints: 24, interval: 60 * 60 * 1000 }, 
  { id: "7d" as TimeRange, label: "7D", dataPoints: 21, interval: 8 * 60 * 60 * 1000 }, 
  { id: "30d" as TimeRange, label: "30D", dataPoints: 15, interval: 48 * 60 * 60 * 1000 }, 
];

// Generate historical data
export const generateHistoricalData = (marketId: Market, timeRange: TimeRange): ChartPoint[] => {
  const marketConfig = MARKETS.find(m => m.id === marketId);
  const baseValue = marketConfig?.baseValue || 500;
  const rangeConfig = TIME_RANGES.find(r => r.id === timeRange) || TIME_RANGES[0];
  
  const now = new Date();
  let currentValue = baseValue;
  const data: ChartPoint[] = [];
  const volatility = timeRange === "1h" ? 0.001 : 
                     timeRange === "24h" ? 0.005 : 
                     timeRange === "7d" ? 0.02 : 0.05;
  
  // Special trends based on market category
  const isBoom = marketConfig?.category === "boom";
  const isCrash = marketConfig?.category === "crash";
  
  // Generate historical data with trends
  const dataPoints = Math.min(rangeConfig.dataPoints, 30); 
  
  for (let i = dataPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * rangeConfig.interval);
    
    let trend = Math.sin(i / (dataPoints / (timeRange === "30d" ? 3 : 2))) * volatility * 2;
    
    // Adjust trend for boom/crash indices
    if (isBoom) {
      trend += 0.001;
    } else if (isCrash) {
      trend -= 0.001;
    }
    
    const randomFactor = (Math.random() * volatility * 2) - volatility + trend;
    
    currentValue = currentValue * (1 + randomFactor);
    
    // Ensure value stays within reasonable bounds
    if (currentValue < baseValue * 0.5 || currentValue > baseValue * 1.5) {
      currentValue = baseValue * (0.8 + Math.random() * 0.4);
    }
    
    data.push({ 
      x: time, 
      y: parseFloat(currentValue.toFixed(baseValue < 10 ? 4 : 2)) 
    });
  }
  
  return data;
};

// Calculate significant price levels
export const calculatePriceLevels = (data: ChartPoint[]): number[] => {
  if (data.length === 0) return [];
  
  // Get min and max values
  const values = data.map(point => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Calculate only 3 levels
  const midPoint = min + (range / 2);
  
  return [min, midPoint, max];
}; 