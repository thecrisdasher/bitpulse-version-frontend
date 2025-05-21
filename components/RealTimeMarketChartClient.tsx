"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
  TooltipItem,
  TimeScale,
  ChartDataset,
} from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Line } from "react-chartjs-2";
import 'chartjs-adapter-date-fns';
import { 
  TrendingUp, TrendingDown, Star, ChevronDown, BarChart3, ZoomIn, ZoomOut, 
  PanelLeftClose, Maximize2, Minimize2, RotateCcw, MousePointer2, Crosshair, 
  Settings, Play, CandlestickChart, LineChart, DollarSign, Percent
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types
type MarketCategory = "volatility" | "boom" | "crash" | "cripto" | "forex" | "materias-primas" | "indices" | "acciones" | "etf";
type Market = string;
type TimeRange = "1h" | "24h" | "7d" | "30d" | "1m" | "3m";
type ChartPoint = { x: Date; y: number; volume?: number; o?: number; h?: number; l?: number; c?: number };
type TimeSeriesChartRef = ChartJS<"line", ChartPoint[]>;

// Types for mixed chart (line and bar)
type MixedChartDataset = 
  | ChartDataset<"line", ChartPoint[]> 
  | (Omit<ChartDataset<"bar", {x: Date, y: number}[]>, "type"> & { type: "bar", yAxisID: string });

// Chart type 
type ChartType = "line" | "candle";

// Indicator type
type IndicatorType = "ma" | "ema" | "bollinger" | "rsi" | "volume" | "none";

// Component props
interface RealTimeMarketChartProps {
  marketId: string;
  isRealTime?: boolean;
  showVolume?: boolean;
}

// Define market categories
interface MarketItem {
  group: string;
  id: string;
  name: string;
  category: MarketCategory;
  label?: string;
  showInRealTime?: boolean;
  baseValue: number;
  color: string;
  icon?: React.ReactNode;
  volumeMultiplier?: number;
  tickSize?: number;
}

// Market configuration with categories
const MARKET_CATEGORIES: { [key in MarketCategory]: { name: string; icon: React.ReactNode; color: string } } = {
  volatility: { name: "Volatility", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(338, 90%, 56%)" },
  boom: { name: "Índices Boom", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(143, 85%, 52%)" },
  crash: { name: "Índices Crash", icon: <TrendingDown className="w-4 h-4" />, color: "hsl(0, 85%, 52%)" },
  cripto: { name: "Criptomonedas", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(41, 98%, 49%)" },
  forex: { name: "Forex", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(207, 90%, 61%)" },
  "materias-primas": { name: "Materias Primas", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(43, 95%, 47%)" },
  indices: { name: "Índices Stock", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(210, 20%, 80%)" },
  acciones: { name: "Acciones", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(262, 70%, 65%)" },
  etf: { name: "ETFs", icon: <TrendingUp className="w-4 h-4" />, color: "hsl(169, 70%, 45%)" },
};

// Market configurations (instrumentos financieros)
const MARKETS: MarketItem[] = [
  // Volatility indices
  { id: "volatility-100", name: "Índice Volatility 100", category: "volatility", label: "100", baseValue: 623, color: "hsl(338, 90%, 56%)", group: "volatility", volumeMultiplier: 450 },
  { id: "volatility-100-1s", name: "Volatility 100 (1s)", category: "volatility", label: "100", showInRealTime: true, baseValue: 631.36, color: "hsl(338, 90%, 56%)", group: "volatility", volumeMultiplier: 480 },
  { id: "volatility-50", name: "Volatility 50", category: "volatility", label: "50", baseValue: 420, color: "hsl(338, 90%, 56%)", group: "volatility", volumeMultiplier: 320 },
  { id: "volatility-25", name: "Volatility 25", category: "volatility", label: "25", baseValue: 210, color: "hsl(338, 90%, 56%)", group: "volatility", volumeMultiplier: 280 },
  
  // Boom indices
  { id: "boom-500", name: "Boom 500", category: "boom", label: "500", baseValue: 500, color: "hsl(143, 85%, 52%)", group: "boom", volumeMultiplier: 400 },
  { id: "boom-1000", name: "Boom 1000", category: "boom", label: "1000", baseValue: 1000, color: "hsl(143, 85%, 52%)", group: "boom", volumeMultiplier: 650 },
  { id: "boom-300", name: "Boom 300", category: "boom", label: "300", baseValue: 300, color: "hsl(143, 85%, 52%)", group: "boom", volumeMultiplier: 280 },
  
  // Crash indices
  { id: "crash-300", name: "Crash 300", category: "crash", label: "300", baseValue: 300, color: "hsl(0, 85%, 52%)", group: "crash", volumeMultiplier: 280 },
  { id: "crash-500", name: "Crash 500", category: "crash", label: "500", baseValue: 500, color: "hsl(0, 85%, 52%)", group: "crash", volumeMultiplier: 400 },
  { id: "crash-1000", name: "Crash 1000", category: "crash", label: "1000", baseValue: 1000, color: "hsl(0, 85%, 52%)", group: "crash", volumeMultiplier: 650 },
  
  // Cryptocurrencies
  { id: "bitcoin", name: "Bitcoin (BTC)", category: "cripto", baseValue: 29000, color: "hsl(41, 98%, 49%)", group: "cripto", volumeMultiplier: 1200 },
  { id: "ethereum", name: "Ethereum (ETH)", category: "cripto", baseValue: 1800, color: "hsl(207, 90%, 61%)", group: "cripto", volumeMultiplier: 800 },
  { id: "solana", name: "Solana (SOL)", category: "cripto", baseValue: 62, color: "hsl(272, 70%, 60%)", group: "cripto", volumeMultiplier: 600 },
  { id: "xrp", name: "XRP (XRP)", category: "cripto", baseValue: 0.50, color: "hsl(215, 60%, 50%)", group: "cripto", volumeMultiplier: 900 },
  { id: "cardano", name: "Cardano (ADA)", category: "cripto", baseValue: 0.35, color: "hsl(205, 65%, 55%)", group: "cripto", volumeMultiplier: 750 },
  { id: "bnb", name: "Binance Coin (BNB)", category: "cripto", baseValue: 235, color: "hsl(45, 95%, 65%)", group: "cripto", volumeMultiplier: 500 },
  
  // Commodities
  { id: "gold", name: "Oro (XAUUSD)", category: "materias-primas", baseValue: 2400, color: "hsl(43, 95%, 47%)", group: "materias-primas", volumeMultiplier: 450 },
  { id: "silver", name: "Plata (XAGUSD)", category: "materias-primas", baseValue: 27.5, color: "hsl(210, 20%, 80%)", group: "materias-primas", volumeMultiplier: 380 },
  { id: "crude-oil", name: "WTI (CL)", category: "materias-primas", baseValue: 75.20, color: "hsl(0, 70%, 35%)", group: "materias-primas", volumeMultiplier: 550 },
  { id: "brent", name: "Brent (BRENT)", category: "materias-primas", baseValue: 78.90, color: "hsl(10, 75%, 40%)", group: "materias-primas", volumeMultiplier: 520 },
  { id: "natural-gas", name: "Gas Natural (NG)", category: "materias-primas", baseValue: 2.15, color: "hsl(190, 70%, 45%)", group: "materias-primas", volumeMultiplier: 420 },
  
  // Forex
  { id: "eurusd", name: "EUR/USD", category: "forex", baseValue: 1.08, color: "hsl(207, 90%, 61%)", group: "forex", volumeMultiplier: 850 },
  { id: "gbpusd", name: "GBP/USD", category: "forex", baseValue: 1.26, color: "hsl(240, 60%, 60%)", group: "forex", volumeMultiplier: 720 },
  { id: "usdjpy", name: "USD/JPY", category: "forex", baseValue: 151.80, color: "hsl(0, 75%, 60%)", group: "forex", volumeMultiplier: 780 },
  { id: "audusd", name: "AUD/USD", category: "forex", baseValue: 0.654, color: "hsl(30, 90%, 45%)", group: "forex", volumeMultiplier: 650 },
  { id: "usdcad", name: "USD/CAD", category: "forex", baseValue: 1.355, color: "hsl(0, 60%, 50%)", group: "forex", volumeMultiplier: 620 },
  { id: "usdchf", name: "USD/CHF", category: "forex", baseValue: 0.901, color: "hsl(0, 70%, 45%)", group: "forex", volumeMultiplier: 580 },
  { id: "eurgbp", name: "EUR/GBP", category: "forex", baseValue: 0.852, color: "hsl(225, 65%, 55%)", group: "forex", volumeMultiplier: 540 },
  
  // Stock indices
  { id: "us500", name: "S&P 500 (US500)", category: "indices", baseValue: 5300, color: "hsl(210, 20%, 80%)", group: "indices", volumeMultiplier: 750 },
  { id: "nas100", name: "Nasdaq 100 (NAS100)", category: "indices", baseValue: 18700, color: "hsl(195, 75%, 50%)", group: "indices", volumeMultiplier: 680 },
  { id: "dji", name: "Dow Jones (US30)", category: "indices", baseValue: 38900, color: "hsl(210, 65%, 55%)", group: "indices", volumeMultiplier: 620 },
  { id: "ftse100", name: "FTSE 100 (UK100)", category: "indices", baseValue: 8200, color: "hsl(0, 60%, 50%)", group: "indices", volumeMultiplier: 580 },
  { id: "dax", name: "DAX 40 (GER40)", category: "indices", baseValue: 17850, color: "hsl(45, 75%, 50%)", group: "indices", volumeMultiplier: 550 },
  { id: "nikkei", name: "Nikkei 225 (JPN225)", category: "indices", baseValue: 38500, color: "hsl(0, 70%, 60%)", group: "indices", volumeMultiplier: 520 },
  
  // Acciones - Top empresas globales
  { id: "aapl", name: "Apple Inc (AAPL)", category: "acciones", baseValue: 176.5, color: "hsl(262, 70%, 65%)", group: "acciones", volumeMultiplier: 920 },
  { id: "msft", name: "Microsoft (MSFT)", category: "acciones", baseValue: 416.2, color: "hsl(262, 70%, 65%)", group: "acciones", volumeMultiplier: 880 },
  { id: "nvda", name: "NVIDIA (NVDA)", category: "acciones", baseValue: 125.3, color: "hsl(262, 70%, 65%)", group: "acciones", volumeMultiplier: 1050 },
  { id: "amzn", name: "Amazon (AMZN)", category: "acciones", baseValue: 183.4, color: "hsl(262, 70%, 65%)", group: "acciones", volumeMultiplier: 850 },
  { id: "meta", name: "Meta (META)", category: "acciones", baseValue: 511.5, color: "hsl(262, 70%, 65%)", group: "acciones", volumeMultiplier: 780 },
  
  // ETFs populares
  { id: "spy", name: "SPDR S&P 500 (SPY)", category: "etf", baseValue: 530.4, color: "hsl(169, 70%, 45%)", group: "etf", volumeMultiplier: 820 },
  { id: "qqq", name: "Invesco QQQ Trust (QQQ)", category: "etf", baseValue: 457.3, color: "hsl(169, 70%, 45%)", group: "etf", volumeMultiplier: 790 },
  { id: "voo", name: "Vanguard S&P 500 (VOO)", category: "etf", baseValue: 487.9, color: "hsl(169, 70%, 45%)", group: "etf", volumeMultiplier: 750 },
];

// Time ranges
const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H", dataPoints: 20, interval: 3 * 60 * 1000 }, 
  { id: "24h" as TimeRange, label: "24H", dataPoints: 24, interval: 60 * 60 * 1000 }, 
  { id: "7d" as TimeRange, label: "7D", dataPoints: 21, interval: 8 * 60 * 60 * 1000 }, 
  { id: "30d" as TimeRange, label: "30D", dataPoints: 15, interval: 48 * 60 * 60 * 1000 },
  { id: "1m" as TimeRange, label: "1M", dataPoints: 22, interval: 24 * 60 * 60 * 1000 }, 
  { id: "3m" as TimeRange, label: "3M", dataPoints: 30, interval: 72 * 60 * 60 * 1000 }, 
]; 

// Trading tool types
type TradingTool = "pointer" | "crosshair" | "pan" | "zoom-in" | "zoom-out" | "reset";

// Order type
type OrderType = "buy" | "sell";

// Generate historical data with volume
const generateHistoricalData = (marketId: Market, timeRange: TimeRange): ChartPoint[] => {
  const marketConfig = MARKETS.find(m => m.id === marketId);
  const baseValue = marketConfig?.baseValue || 500;
  const volumeMultiplier = marketConfig?.volumeMultiplier || 300;
  const rangeConfig = TIME_RANGES.find(r => r.id === timeRange) || TIME_RANGES[0];
  
  const now = new Date();
  let currentValue = baseValue;
  const data: ChartPoint[] = [];
  const volatility = timeRange === "1h" ? 0.001 : 
                     timeRange === "24h" ? 0.005 : 
                     timeRange === "7d" ? 0.02 : 
                     timeRange === "30d" ? 0.05 :
                     timeRange === "1m" ? 0.08 : 0.12;
  
  // Special trends based on market category
  const isBoom = marketConfig?.category === "boom";
  const isCrash = marketConfig?.category === "crash";
  const isStock = marketConfig?.category === "acciones";
  const isETF = marketConfig?.category === "etf";
  const isCrypto = marketConfig?.category === "cripto";
  
  // Generate historical data with trends
  const dataPoints = Math.min(rangeConfig.dataPoints, 30);
  
  // Tendencia base para esta serie
  const trendBias = Math.random() * 0.002 - 0.001;
  
  for (let i = dataPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * rangeConfig.interval);
    
    let trend = Math.sin(i / (dataPoints / (timeRange === "30d" ? 3 : 2))) * volatility * 2;
    
    // Ajuste de tendencia por categoría
    if (isBoom) {
      trend += 0.001;
    } else if (isCrash) {
      trend -= 0.001;
    } else if (isStock || isETF) {
      trend += (Math.random() * 0.004 - 0.002) + trendBias;
    } else if (isCrypto) {
      trend += (Math.random() * 0.006 - 0.003) + trendBias;
    }
    
    const randomFactor = (Math.random() * volatility * 2) - volatility + trend;
    
    currentValue = currentValue * (1 + randomFactor);
    
    // Asegurar que el valor no se aleje demasiado del valor base
    if (currentValue < baseValue * 0.5 || currentValue > baseValue * 1.5) {
      currentValue = baseValue * (0.8 + Math.random() * 0.4);
    }
    
    // Generar volumen basado en la volatilidad y el multiplicador de volumen
    const volumeScale = volumeMultiplier * (1 + Math.abs(randomFactor) * 10);
    const volume = Math.round(volumeScale * (0.6 + Math.random() * 0.8));
    
    data.push({ 
      x: time, 
      y: parseFloat(currentValue.toFixed(baseValue < 10 ? 4 : 2)),
      volume: volume 
    });
  }
  
  return data;
};

// Generate historical candlestick data
const generateCandlestickData = (marketId: Market, timeRange: TimeRange): ChartPoint[] => {
  const marketConfig = MARKETS.find(m => m.id === marketId);
  const baseValue = marketConfig?.baseValue || 500;
  const volumeMultiplier = marketConfig?.volumeMultiplier || 300;
  const rangeConfig = TIME_RANGES.find(r => r.id === timeRange) || TIME_RANGES[0];
  
  const now = new Date();
  let currentValue = baseValue;
  const data: ChartPoint[] = [];
  const volatility = timeRange === "1h" ? 0.001 : 
                     timeRange === "24h" ? 0.005 : 
                     timeRange === "7d" ? 0.02 : 
                     timeRange === "30d" ? 0.05 :
                     timeRange === "1m" ? 0.08 : 0.12;
  
  // Generate candle data
  const dataPoints = Math.min(rangeConfig.dataPoints, 30);
  
  for (let i = dataPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * rangeConfig.interval);
    
    // Random walk with trend bias
    const trend = (Math.random() - 0.5) * volatility * 3;
    currentValue = currentValue * (1 + trend);
    
    // Generate OHLC data
    const open = currentValue;
    const close = open * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);
    
    // Keep values within reasonable range
    if (currentValue < baseValue * 0.5 || currentValue > baseValue * 1.5) {
      currentValue = baseValue * (0.9 + Math.random() * 0.2);
    }
    
    // Generate volume
    const volumeScale = volumeMultiplier * (1 + Math.abs(trend) * 10);
    const volume = Math.round(volumeScale * (0.6 + Math.random() * 0.8));
    
    data.push({ 
      x: time,
      y: parseFloat(close.toFixed(baseValue < 10 ? 4 : 2)),
      o: parseFloat(open.toFixed(baseValue < 10 ? 4 : 2)),
      h: parseFloat(high.toFixed(baseValue < 10 ? 4 : 2)),
      l: parseFloat(low.toFixed(baseValue < 10 ? 4 : 2)),
      c: parseFloat(close.toFixed(baseValue < 10 ? 4 : 2)),
      volume: volume 
    });
  }
  
  return data;
};

// Calculate significant price levels
const calculatePriceLevels = (data: ChartPoint[]): number[] => {
  if (data.length === 0) return [];
  
  // Get min and max values
  const values = data.map(point => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Calcular niveles de precio importantes
  const midPoint = min + (range / 2);
  const quarter = min + (range / 4);
  const threeQuarters = min + (3 * range / 4);
  
  return [min, quarter, midPoint, threeQuarters, max];
};

// Calculate Moving Average
const calculateMA = (data: ChartPoint[], period: number): {x: Date, y: number}[] => {
  const result: {x: Date, y: number}[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, point) => acc + point.y, 0);
      
    const ma = sum / period;
    result.push({ x: data[i].x, y: ma });
  }
  
  return result;
};

// Calculate EMA
const calculateEMA = (data: ChartPoint[], period: number): {x: Date, y: number}[] => {
  const result: {x: Date, y: number}[] = [];
  
  // First EMA is SMA
  const firstSum = data.slice(0, period).reduce((acc, point) => acc + point.y, 0);
  let ema = firstSum / period;
  
  // Multiplier: (2 / (period + 1))
  const multiplier = 2 / (period + 1);
  
  for (let i = period - 1; i < data.length; i++) {
    if (i === period - 1) {
      result.push({ x: data[i].x, y: ema });
    } else {
      // EMA = (Close - EMA(previous)) * multiplier + EMA(previous)
      ema = (data[i].y - ema) * multiplier + ema;
      result.push({ x: data[i].x, y: ema });
    }
  }
  
  return result;
};

// Calculate Bollinger Bands
const calculateBollingerBands = (data: ChartPoint[], period: number): { 
  middle: {x: Date, y: number}[],
  upper: {x: Date, y: number}[],
  lower: {x: Date, y: number}[]
} => {
  const middle = calculateMA(data, period);
  const upper: {x: Date, y: number}[] = [];
  const lower: {x: Date, y: number}[] = [];
  
  // Calculate standard deviation and bands
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((acc, point) => acc + point.y, 0) / period;
    
    const squaredDiffs = slice.map(point => Math.pow(point.y - avg, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper.push({ x: data[i].x, y: middle[i - (period - 1)].y + 2 * stdDev });
    lower.push({ x: data[i].x, y: middle[i - (period - 1)].y - 2 * stdDev });
  }
  
  return { middle, upper, lower };
};

// Calculate RSI
const calculateRSI = (data: ChartPoint[], period: number): {x: Date, y: number}[] => {
  const result: {x: Date, y: number}[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate initial gains/losses
  for (let i = 1; i < data.length; i++) {
    const change = data[i].y - data[i-1].y;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
    
    if (i >= period) {
      const avgGain = gains.slice(i - period, i).reduce((acc, g) => acc + g, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((acc, l) => acc + l, 0) / period;
      
      const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
      const rsi = 100 - (100 / (1 + rs));
      
      result.push({ x: data[i].x, y: rsi });
    }
  }
  
  return result;
};

// Registrar los componentes de Chart.js
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    annotationPlugin
  );
} 

// Componente cliente de Chart
const RealTimeMarketChartClient = ({ marketId: initialMarketId, isRealTime = false, showVolume: initialShowVolume = false }: RealTimeMarketChartProps) => {
  // Estados
  const [currentMarket, setCurrentMarket] = useState<string>(initialMarketId || "volatility-100");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [realTimeEnabled, setRealTimeEnabled] = useState(isRealTime);
  const [showPriceLevels, setShowPriceLevels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>(["volatility-100-1s", "bitcoin"]);
  const [chartData, setChartData] = useState<ChartData<"line", ChartPoint[]>>({
    datasets: [],
  });
  const [showVolume, setShowVolume] = useState(initialShowVolume);
  const [showIndicators, setShowIndicators] = useState(false);
  const chartRef = useRef<TimeSeriesChartRef | null>(null);
  const [priceLevels, setPriceLevels] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number>(0);
  // New states for trading tools
  const [currentTool, setCurrentTool] = useState<TradingTool>("crosshair");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "neutral">("neutral");
  const lastPriceRef = useRef<number | null>(null);
  // Trading states
  const [orderAmount, setOrderAmount] = useState<number>(100);
  const [showTradePanel, setShowTradePanel] = useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  // Chart type and indicators
  const [chartType, setChartType] = useState<ChartType>("line");
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType>("none");
  const [indicatorPeriod, setIndicatorPeriod] = useState<number>(14);
  const [tradeMode, setTradeMode] = useState<"simple" | "advanced">("simple");
  const [orderPercentage, setOrderPercentage] = useState<number>(10);
  const [orderType, setOrderType] = useState<OrderType>("buy");
  const [selectedInstrument, setSelectedInstrument] = useState<MarketItem | null>(null);

  // Obtener la configuración del mercado actual
  const currentMarketConfig = useMemo(() => {
    return MARKETS.find(m => m.id === currentMarket) || MARKETS[0];
  }, [currentMarket]);

  // Formatear precio
  const formatPrice = useCallback((price: number) => {
    if (currentMarketConfig.category === 'forex') {
      return price.toFixed(currentMarketConfig.baseValue < 1 ? 4 : 2);
    } else if (currentMarketConfig.category === 'cripto' && currentMarketConfig.baseValue < 10) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  }, [currentMarketConfig]);

  // Filtrar mercados por búsqueda
  const filteredMarkets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return MARKETS.filter(market => 
      market.name.toLowerCase().includes(query) || 
      market.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Gestionar favoritos
  const toggleFavorite = useCallback((marketId: string) => {
    setFavoriteMarkets(prev => {
      if (prev.includes(marketId)) {
        return prev.filter(id => id !== marketId);
      } else {
        return [...prev, marketId];
      }
    });
  }, []);

  // Toggle para actualización en tiempo real
  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(prev => !prev);
  }, []);

  // Toggle para mostrar/ocultar volumen
  const toggleVolume = useCallback(() => {
    setShowVolume(prev => !prev);
  }, []);

  // Toggle para mostrar/ocultar indicadores
  const toggleIndicators = useCallback(() => {
    setShowIndicators(prev => !prev);
  }, []);

  // Calculate order amount
  const calculateOrderAmount = useCallback(() => {
    if (!currentPrice || !selectedInstrument) return 0;
    
    if (tradeMode === "simple") {
      return orderAmount;
    } else {
      // Calculate amount based on percentage
      const baseAmount = 1000; // Base amount for percentage calculation
      return (baseAmount * orderPercentage) / 100;
    }
  }, [tradeMode, orderAmount, orderPercentage, currentPrice, selectedInstrument]);

  // Handle trade execution
  const executeOrder = useCallback((type: OrderType) => {
    if (!currentPrice || !selectedInstrument) return;
    
    const amount = calculateOrderAmount();
    const orderTotal = (currentPrice * amount).toFixed(2);
    
    setTradeMessage(`${type === 'buy' ? 'Compra' : 'Venta'} de ${amount} ${selectedInstrument.name} a ${formatPrice(currentPrice)} por $${orderTotal}`);
    
    // Show message and hide after 3 seconds
    setShowTradePanel(true);
    setTimeout(() => {
      setShowTradePanel(false);
      setTradeMessage(null);
    }, 3000);
    
  }, [selectedInstrument, currentPrice, calculateOrderAmount, formatPrice]);

  // Renderizar item de mercado 
  const renderMarketItem = useCallback((market: MarketItem) => {
    return (
      <div 
        key={market.id}
        className={cn(
          "px-2 py-1 text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-900 rounded",
          currentMarket === market.id && "bg-neutral-800"
        )}
        onClick={() => setCurrentMarket(market.id)}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: market.color }}
          />
          <span>{market.name}</span>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 hover:text-yellow-500 focus:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(market.id);
          }}
          title={favoriteMarkets.includes(market.id) ? "Eliminar de favoritos" : "Añadir a favoritos"}
        >
          <Star className={cn(
            "h-3 w-3",
            favoriteMarkets.includes(market.id) ? "text-yellow-500" : "text-neutral-400"
          )} />
        </button>
      </div>
    );
  }, [currentMarket, favoriteMarkets, toggleFavorite]);

  // Actualizar los datos del gráfico con volumen e indicadores
  const updateChartData = useCallback(() => {
    // Clear any pending updates to prevent multiple rapid updates
    if (chartUpdateTimeoutRef.current) {
      clearTimeout(chartUpdateTimeoutRef.current);
      chartUpdateTimeoutRef.current = null;
    }

    setIsLoading(true);
    const marketConfig = MARKETS.find(m => m.id === currentMarket);
    
    // Generate data based on chart type
    const data = chartType === "candle" 
      ? generateCandlestickData(currentMarket, timeRange)
      : generateHistoricalData(currentMarket, timeRange);
      
    const priceLevelValues = calculatePriceLevels(data);
    setPriceLevels(priceLevelValues);
    
    // Calcular el precio actual y el porcentaje de cambio
    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      const firstPoint = data[0];
      
      // Calculate price direction
      if (lastPriceRef.current !== null) {
        if (lastPoint.y > lastPriceRef.current) {
          setPriceDirection("up");
        } else if (lastPoint.y < lastPriceRef.current) {
          setPriceDirection("down");
        }
      }
      
      // Update current price
      setCurrentPrice(lastPoint.y);
      lastPriceRef.current = lastPoint.y;
      
      if (firstPoint && firstPoint.y > 0) {
        const change = ((lastPoint.y - firstPoint.y) / firstPoint.y) * 100;
        setPercentChange(change);
      }
    }
    
    // Get color based on price direction
    const baseColor = marketConfig?.color || "hsl(210, 80%, 60%)";
    const upColor = "hsl(143, 85%, 52%)";
    const downColor = "hsl(0, 85%, 52%)";
    
    // Choose color based on price direction
    const lineColor = priceDirection === "up" ? upColor :
                      priceDirection === "down" ? downColor : baseColor;
    
    // Create datasets based on chart type
    let datasets: MixedChartDataset[] = [];
    
    if (chartType === "candle") {
      // For candlestick chart, generate two datasets:
      // 1. Up candles (green)
      const upData = data.filter(d => (d.c || d.y) >= (d.o || 0));
      const upCandles: ChartDataset<"bar", ChartPoint[]> = {
        type: "bar",
        label: "Up Candles",
        data: upData,
        backgroundColor: upColor,
        borderColor: upColor,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      };
      
      // 2. Down candles (red)
      const downData = data.filter(d => (d.c || d.y) < (d.o || 0));
      const downCandles: ChartDataset<"bar", ChartPoint[]> = {
        type: "bar",
        label: "Down Candles",
        data: downData,
        backgroundColor: downColor,
        borderColor: downColor,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      };
      
      datasets.push(upCandles as any, downCandles as any);
    } else {
      // Line chart dataset
      const priceDataset: ChartDataset<"line", ChartPoint[]> = {
        type: "line",
        label: marketConfig?.name || currentMarket,
        data: data,
        borderColor: lineColor,
        backgroundColor: `${lineColor}1a`,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
      };
      
      datasets.push(priceDataset);
    }
    
    // Add volume dataset if enabled
    if (showVolume) {
      const volumeDataset: MixedChartDataset = {
        type: "bar",
        label: 'Volumen',
        data: data.map(point => ({
          x: point.x,
          y: point.volume || 0,
        })),
        backgroundColor: 'rgba(160, 160, 160, 0.3)',
        borderColor: 'rgba(160, 160, 160, 0.5)',
        borderWidth: 1,
        yAxisID: 'volume',
        order: 1,
      };
      datasets.push(volumeDataset);
    }
    
    // Add technical indicators based on selection
    if (selectedIndicator !== 'none' && selectedIndicator !== 'volume') {
      switch (selectedIndicator) {
        case 'ma':
          const maData = calculateMA(data, indicatorPeriod);
          datasets.push({
            type: 'line',
            label: `MA(${indicatorPeriod})`,
            data: maData,
            borderColor: 'rgba(255, 165, 0, 0.8)',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
          });
          break;
          
        case 'ema':
          const emaData = calculateEMA(data, indicatorPeriod);
          datasets.push({
            type: 'line',
            label: `EMA(${indicatorPeriod})`,
            data: emaData,
            borderColor: 'rgba(255, 105, 180, 0.8)',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
          });
          break;
          
        case 'bollinger':
          const { middle, upper, lower } = calculateBollingerBands(data, indicatorPeriod);
          
          datasets.push({
            type: 'line',
            label: 'BB Middle',
            data: middle,
            borderColor: 'rgba(150, 150, 150, 0.8)',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
          });
          
          datasets.push({
            type: 'line',
            label: 'BB Upper',
            data: upper,
            borderColor: 'rgba(130, 130, 255, 0.7)',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
            borderDash: [5, 5],
          });
          
          datasets.push({
            type: 'line',
            label: 'BB Lower',
            data: lower,
            borderColor: 'rgba(130, 130, 255, 0.7)',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
            borderDash: [5, 5],
          });
          break;
          
        case 'rsi':
          const rsiData = calculateRSI(data, indicatorPeriod);
          datasets.push({
            type: 'line',
            label: `RSI(${indicatorPeriod})`,
            data: rsiData,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
            yAxisID: 'rsi',
          });
          break;
      }
    }
    
    // Actualizar los datos del gráfico
    setChartData({ datasets } as ChartData<"line", ChartPoint[]>);
    setIsLoading(false);
  }, [currentMarket, timeRange, showVolume, priceDirection, selectedIndicator, indicatorPeriod, chartType]);

  // Update chart options to include volume and technical indicators
  const chartOptions = useMemo<ChartOptions<"line">>(() => {
    const marketConfig = MARKETS.find(m => m.id === currentMarket);
    const categoryColor = marketConfig?.color || "hsl(210, 80%, 60%)";
    
    // Prepare scales object with base scales
    const scales: Record<string, any> = {
      x: {
        type: 'time',
        time: {
          unit: timeRange === "1h" ? 'minute' : 
                timeRange === "24h" ? 'hour' : 
                timeRange === "7d" ? 'day' : 'week',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd MMM',
            week: 'dd MMM',
          },
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: {
          display: false,
        },
      },
      y: {
        position: 'right',
        grace: '15%', // Increased padding to prevent auto-scrolling
        stacked: false,
        ticks: {
          precision: 2,
          callback: (value: number) => {
            // Format based on asset type
            if (marketConfig?.category === 'forex') {
              return Number(value).toFixed(marketConfig.baseValue < 1 ? 4 : 2);
            } else if (marketConfig?.category === 'cripto' && marketConfig.baseValue < 10) {
              return Number(value).toFixed(4);
            } else {
              return Number(value).toFixed(2);
            }
          },
        },
        grid: {
          color: 'rgba(180, 180, 180, 0.1)',
        },
      },
    };
    
    // Special options for candlestick chart
    if (chartType === "candle") {
      scales.y.stacked = false; // Make sure bars aren't stacked
    }
    
    // Add volume scale if needed
    if (showVolume) {
      scales.volume = {
        position: 'bottom',
        height: '20%',
        beginAtZero: true,
        grid: {
          display: false,
        }
      };
    }
    
    // Add RSI scale if needed
    if (selectedIndicator === 'rsi') {
      scales.rsi = {
        position: 'right',
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(180, 180, 180, 0.1)',
        },
        ticks: {
          stepSize: 25,
        },
      };
    }
    
    // Optional price level annotations
    const annotations: Record<string, any> = {};
    
    if (showPriceLevels && priceLevels.length > 0) {
      priceLevels.forEach((level, i) => {
        annotations[`line${i}`] = {
          type: 'line',
          yMin: level,
          yMax: level,
          borderColor: i === 2 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(150, 150, 150, 0.3)',
          borderWidth: i === 2 ? 1 : 0.5,
          borderDash: i === 2 ? [] : [5, 5],
        };
      });
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: realTimeEnabled ? 0 : 400,
      },
      layout: {
        padding: {
          top: 5,
          right: 20,
          left: 10,
          bottom: (showVolume || selectedIndicator === 'rsi') ? 80 : 10,
        },
      },
      scales,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const value = context.parsed.y;
              let valueFormatted: string;
              
              // Format based on asset type
              if (marketConfig?.category === 'forex') {
                valueFormatted = value.toFixed(marketConfig.baseValue < 1 ? 4 : 2);
              } else if (marketConfig?.category === 'cripto' && marketConfig.baseValue < 10) {
                valueFormatted = value.toFixed(4);
              } else {
                valueFormatted = value.toFixed(2);
              }
              
              if (context.dataset.label === 'Volumen') {
                return `Volumen: ${valueFormatted}`;
              }
              
              // Special formatting for indicators
              if (context.dataset.label?.includes('RSI')) {
                return `${context.dataset.label}: ${valueFormatted}`;
              }
              
              if (context.dataset.label?.includes('BB') || 
                  context.dataset.label?.includes('MA') || 
                  context.dataset.label?.includes('EMA')) {
                return `${context.dataset.label}: ${valueFormatted}`;
              }
              
              // Change % calculation for tooltip
              if (chartData.datasets[0]?.data.length > 0) {
                const firstPoint = chartData.datasets[0].data[0];
                const lastPoint = chartData.datasets[0].data[chartData.datasets[0].data.length - 1];
                
                if (firstPoint && lastPoint) {
                  const startPrice = firstPoint.y;
                  const currentPrice = value;
                  const changePercent = ((currentPrice - startPrice) / startPrice) * 100;
                  return `${marketConfig?.name || currentMarket}: ${valueFormatted} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`;
                }
              }
              
              return `${marketConfig?.name || currentMarket}: ${valueFormatted}`;
            },
          },
        },
        annotation: {
          annotations,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };
  }, [currentMarket, timeRange, realTimeEnabled, chartData, showVolume, priceLevels, showPriceLevels, selectedIndicator, chartType]);

  // Set selected instrument when market changes
  useEffect(() => {
    const market = MARKETS.find(m => m.id === currentMarket);
    if (market) {
      setSelectedInstrument(market);
    }
  }, [currentMarket]);

  // Trading tool handlers
  const handleToolChange = (tool: TradingTool) => {
    setCurrentTool(tool);
    
    // Apply chart interaction settings based on tool
    if (chartRef.current) {
      const chart = chartRef.current;
      
      switch (tool) {
        case "pointer":
          chart.options.interaction = { mode: 'nearest', intersect: true };
          break;
        case "crosshair":
          chart.options.interaction = { mode: 'index', intersect: false };
          break;
        case "pan":
          // Would need custom implementation for actual panning
          break;
        case "zoom-in":
        case "zoom-out":
          // Would need custom implementation for actual zooming
          break;
        case "reset":
          updateChartData();
          break;
      }
      
      chart.update();
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (chartContainerRef.current) {
      if (!isFullscreen) {
        if (chartContainerRef.current.requestFullscreen) {
          chartContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Efecto para actualizar datos al cambiar mercado o rango de tiempo
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  // Efecto para actualizar datos en tiempo real
  useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      // Schedule update with delay to prevent overlapping updates
      chartUpdateTimeoutRef.current = setTimeout(() => {
        updateChartData();
      }, 300); // Increased delay to prevent rapid updates
    }, 3000);
    
    return () => {
      clearInterval(interval);
      if (chartUpdateTimeoutRef.current) {
        clearTimeout(chartUpdateTimeoutRef.current);
      }
    };
  }, [realTimeEnabled, updateChartData]);

  // Toggle price levels
  const togglePriceLevels = useCallback(() => {
    setShowPriceLevels(prev => !prev);
  }, []);

  // Handle indicator change
  const handleIndicatorChange = useCallback((value: string) => {
    setSelectedIndicator(value as IndicatorType);
  }, []);

  // Renderizado del componente
  return (
    <Card className="h-full w-full overflow-hidden border border-neutral-800 bg-neutral-950/50 backdrop-blur-sm">
      {/* TradingView-like toolbar */}
      <div className="w-full border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-2 py-1">
        <div className="flex items-center space-x-1">
          {/* Trading tools */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              currentTool === "pointer" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => handleToolChange("pointer")}
            title="Cursor"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              currentTool === "crosshair" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => handleToolChange("crosshair")}
            title="Cruz de mira"
          >
            <Crosshair className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              currentTool === "pan" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => handleToolChange("pan")}
            title="Mover gráfico"
          >
            <PanelLeftClose className="h-4 w-4 rotate-90" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              currentTool === "zoom-in" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => handleToolChange("zoom-in")}
            title="Ampliar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              currentTool === "zoom-out" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => handleToolChange("zoom-out")}
            title="Reducir"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            onClick={() => handleToolChange("reset")}
            title="Restablecer gráfico"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="h-5 w-px bg-neutral-700 mx-1"></div>
          
          {/* Chart type selection */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              chartType === "line" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => {
              setChartType("line");
              updateChartData();
            }}
            title="Gráfico de líneas"
          >
            <LineChart className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              chartType === "candle" && "bg-neutral-800 text-neutral-100"
            )}
            onClick={() => {
              setChartType("candle");
              updateChartData();
            }}
            title="Gráfico de velas"
          >
            <CandlestickChart className="h-4 w-4" />
          </Button>
          
          <div className="h-5 w-px bg-neutral-700 mx-1"></div>
          
          {/* Indicators */}
          <Select value={selectedIndicator} onValueChange={handleIndicatorChange}>
            <SelectTrigger className="h-8 w-auto min-w-28 border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs px-2 rounded">
              <SelectValue placeholder="Indicadores" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border border-neutral-700 text-neutral-100">
              <SelectItem value="none" className="text-xs">Sin indicadores</SelectItem>
              <SelectItem value="ma" className="text-xs">Media Móvil</SelectItem>
              <SelectItem value="ema" className="text-xs">Media Móvil Exp.</SelectItem>
              <SelectItem value="bollinger" className="text-xs">Bandas Bollinger</SelectItem>
              <SelectItem value="rsi" className="text-xs">RSI</SelectItem>
              <SelectItem value="volume" className="text-xs">Volumen</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedIndicator !== 'none' && (
            <Input
              type="number"
              min="2"
              max="50"
              className="h-8 w-14 px-2 border-neutral-800 bg-neutral-900 text-xs rounded"
              value={indicatorPeriod}
              onChange={(e) => setIndicatorPeriod(Number(e.target.value) || 14)}
            />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
              showPriceLevels && "bg-neutral-800 text-neutral-100"
            )}
            onClick={togglePriceLevels}
            title="Mostrar niveles de precio"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-neutral-400">
            HORA EN LA PLATAFORMA
          </span>
          <span className="text-xs text-neutral-200 font-medium">
            {new Date().toLocaleTimeString()} UTC +0
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            onClick={() => {}}
            title="Ajustes del gráfico"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardHeader className="px-4 py-3 border-b border-neutral-800 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <CardTitle className="text-base font-medium text-white">
              {selectedInstrument?.name || "Seleccione un instrumento"}
            </CardTitle>
            <div className="text-xs text-neutral-400 mt-0.5">
              {currentPrice && (
                <>
                  <span className="text-sm text-neutral-100 font-medium mr-1">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className={cn(
                    percentChange >= 0 
                      ? "text-emerald-500" 
                      : "text-rose-500"
                  )}>
                    {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex space-x-1">
            {/* Botón de volumen */}
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "h-7 w-7 rounded border-neutral-800 bg-neutral-900/50",
                showVolume && "border-neutral-700 bg-neutral-800"
              )}
              onClick={toggleVolume}
              title="Mostrar/ocultar volumen"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
            
            {/* Selector de categorías */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 rounded border-neutral-800 bg-neutral-900/50 text-xs"
                >
                  {selectedInstrument 
                    ? MARKET_CATEGORIES[selectedInstrument.category].name
                    : "Categoría"}
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-neutral-950 border border-neutral-800 text-neutral-100"
                align="end"
              >
                <DropdownMenuLabel className="text-xs text-neutral-400">
                  Categorías de mercado
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-neutral-800" />
                {Object.entries(MARKET_CATEGORIES).map(([category, data]) => (
                  <DropdownMenuItem 
                    key={category}
                    className="flex items-center text-xs gap-2 cursor-pointer"
                    onClick={() => {
                      const marketsInCategory = MARKETS.filter(m => m.category === category as MarketCategory);
                      if (marketsInCategory.length > 0) {
                        setCurrentMarket(marketsInCategory[0].id);
                      }
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: data.color}} />
                    {data.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Botón de favoritos */}
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "h-7 w-7 rounded border-neutral-800 bg-neutral-900/50",
                selectedInstrument && favoriteMarkets.includes(selectedInstrument.id) && "border-neutral-700 bg-neutral-800 text-yellow-500"
              )}
              onClick={() => selectedInstrument && toggleFavorite(selectedInstrument.id)}
              disabled={!selectedInstrument}
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {TIME_RANGES.map(({ id, label }) => (
              <Button 
                key={id}
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 rounded px-2 text-xs border-neutral-800 bg-neutral-900/50",
                  timeRange === id && "border-neutral-700 bg-neutral-800"
                )}
                onClick={() => setTimeRange(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-6 rounded px-2 text-xs border-neutral-800 bg-neutral-900/50",
              realTimeEnabled && "border-green-800 bg-green-900/20 text-green-500"
            )}
            onClick={toggleRealTime}
          >
            {realTimeEnabled ? 'En vivo' : 'Estático'}
          </Button>
        </div>
        
        {/* Instrument selector */}
        <div className="bg-neutral-900/50 rounded border border-neutral-800 p-2">
          <h3 className="text-xs text-neutral-300 mb-2 font-medium">Seleccione Instrumento:</h3>
          
          <div className="grid grid-cols-3 gap-2 max-h-28 overflow-y-auto custom-scrollbar">
            {MARKETS.map(market => (
              <button
                key={market.id}
                onClick={() => setCurrentMarket(market.id)}
                className={cn(
                  "px-2 py-1 text-xs rounded flex items-center gap-1 hover:bg-neutral-800",
                  currentMarket === market.id ? "bg-neutral-800 text-white" : "text-neutral-400"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: market.color }}
                />
                <span className="truncate">{market.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Trading interface */}
        {selectedInstrument && (
          <div className="bg-neutral-900/50 rounded border border-neutral-800 p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-neutral-300 font-medium flex items-center gap-1">
                <span>Operar con:</span>
                <span className="text-white">{selectedInstrument.name}</span>
              </h3>
              
              <Tabs value={tradeMode} onValueChange={(value) => setTradeMode(value as "simple" | "advanced")} className="h-6">
                <TabsList className="h-6 bg-neutral-800">
                  <TabsTrigger value="simple" className="h-5 text-xs px-2">
                    Unidades
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="h-5 text-xs px-2">
                    Porcentaje
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex gap-2 mb-2">
              {tradeMode === "simple" ? (
                <div className="flex-1 flex items-center">
                  <div className="relative flex-1">
                    <DollarSign className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(parseFloat(e.target.value) || 0)}
                      className="h-7 pl-7 rounded bg-neutral-900 border-neutral-800 focus-visible:ring-neutral-600 text-xs"
                      placeholder="Cantidad"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center">
                  <div className="relative flex-1">
                    <Percent className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={orderPercentage}
                      onChange={(e) => setOrderPercentage(parseFloat(e.target.value) || 0)}
                      className="h-7 pl-7 rounded bg-neutral-900 border-neutral-800 focus-visible:ring-neutral-600 text-xs"
                      placeholder="Porcentaje"
                    />
                  </div>
                  
                  <div className="flex ml-2 gap-1">
                    {[25, 50, 75, 100].map(percent => (
                      <Button
                        key={percent}
                        size="sm"
                        variant="outline"
                        onClick={() => setOrderPercentage(percent)}
                        className={cn(
                          "h-7 px-1 text-xs border-neutral-800 bg-neutral-900",
                          orderPercentage === percent && "border-neutral-600 bg-neutral-800"
                        )}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded"
                onClick={() => executeOrder('buy')}
              >
                Comprar {calculateOrderAmount()} {selectedInstrument.id.toUpperCase()}
              </Button>
              
              <Button
                size="sm"
                className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded"
                onClick={() => executeOrder('sell')}
              >
                Vender {calculateOrderAmount()} {selectedInstrument.id.toUpperCase()}
              </Button>
            </div>
          </div>
        )}
        
        {/* Trade confirmation message */}
        {showTradePanel && tradeMessage && (
          <div className="p-2 bg-neutral-800/80 rounded text-xs text-neutral-100 border border-neutral-700">
            {tradeMessage}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-20rem)]" ref={chartContainerRef}>
        <div className="h-full w-full relative">
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            className="h-full w-full"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/50 backdrop-blur-sm">
              <div className="text-neutral-300 text-sm">Cargando datos...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMarketChartClient; 