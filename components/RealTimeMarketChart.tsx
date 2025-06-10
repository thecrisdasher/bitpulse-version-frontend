"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, Star, ChevronDown, DollarSign, ArrowUpDown, Layers, ZoomOut, ZoomIn, RefreshCw, ChevronLeft, ChevronRight, SkipBack, SkipForward, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaChartIcon, LineChartIcon, CandleChartIcon, BarChartIcon } from "@/components/icons/icons";
import {
  AppleIcon,
  NvidiaIcon,
  MicrosoftIcon,
  GoogleIcon,
  AmazonIcon,
  MetaIcon,
  TeslaIcon,
  AdobeIcon,
  NetflixIcon,
  DisneyIcon,
  CocaColaIcon,
  PepsiIcon,
  JohnsonIcon,
  VisaIcon,
  MastercardIcon
} from "@/components/icons/StockIcons";
import TradeControlPanel from "@/components/TradeControlPanel";
import OpenPositions, { TradePosition } from "@/components/OpenPositions";
import { v4 as uuidv4 } from 'uuid';
import { useTradePositions } from "@/contexts/TradePositionsContext";
import { Badge } from "@/components/ui/badge";
import { useBitstampData } from "@/hooks/useBitstampData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Label,
} from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Switch,
} from "@/components/ui/switch";
import {
  Calendar,
} from "@/components/ui/calendar";
import useBinanceData, { ChartDataPoint as BinancePoint } from '@/hooks/useBinanceData';

// Dynamically import the chart client to avoid SSR issues
const RealTimeMarketChartClient = dynamic(
  () => import("@/components/RealTimeMarketChartClient"),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);

// Types
type MarketCategory = "volatility" | "boom" | "crash" | "cripto" | "forex" | "materias-primas" | "indices" | "stocks";
type TimeRange = "1h" | "24h" | "7d" | "30d";
type ChartType = "area" | "candle" | "line" | "bar";
type DataSource = "SIMULADO" | "BITSTAMP" | "COINGECKO" | "BINANCE" | "AUTO";

// Tipos adicionales para los niveles
interface ChartLevel {
  id: string;
  value: number;
  color: string;
  lineWidth: number;
  lineStyle: number;
  title?: string;
  type: 'soporte' | 'resistencia' | 'precio' | 'custom';
}

// Component props
interface RealTimeMarketChartProps {
  marketId?: string;
  isRealTime?: boolean;
}

// Market item interface
interface MarketItem {
  id: string;
  name: string;
  category: MarketCategory;
  label?: string;
  showInRealTime?: boolean;
  baseValue: number;
  color: string;
  icon?: React.ReactNode;
}

// Chart data point
interface ChartDataPoint {
  time: number;
  value: number;
}

// Candlestick data point
interface CandlestickDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
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
  stocks: { name: "Acciones", icon: <DollarSign className="w-4 h-4" />, color: "hsl(160, 84%, 39%)" },
};

// Market configurations (reducido para mejorar rendimiento)
const MARKETS: MarketItem[] = [
  // Volatility indices
  { id: "volatility-10", name: "Índice Volatility 10", category: "volatility", label: "10", baseValue: 12.45, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-25", name: "Índice Volatility 25", category: "volatility", label: "25", baseValue: 31.28, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-50", name: "Índice Volatility 50", category: "volatility", label: "50", baseValue: 42.65, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-75", name: "Índice Volatility 75", category: "volatility", label: "75", baseValue: 52.18, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-100", name: "Índice Volatility 100", category: "volatility", label: "100", baseValue: 62.35, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-100-1s", name: "Índice Volatility 100 (1s)", category: "volatility", label: "100", showInRealTime: true, baseValue: 63.14, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-150", name: "Índice Volatility 150", category: "volatility", label: "150", baseValue: 85.22, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-200", name: "Índice Volatility 200", category: "volatility", label: "200", baseValue: 105.45, color: "hsl(338, 90%, 56%)" },
  
  // Boom indices
  { id: "boom-300", name: "Índice Boom 300", category: "boom", label: "300", baseValue: 30.28, color: "hsl(143, 85%, 52%)" },
  { id: "boom-500", name: "Índice Boom 500", category: "boom", label: "500", baseValue: 50.35, color: "hsl(143, 85%, 52%)" },
  { id: "boom-1000", name: "Índice Boom 1000", category: "boom", label: "1000", baseValue: 100.18, color: "hsl(143, 85%, 52%)" },
  { id: "boom-1000-1s", name: "Índice Boom 1000 (1s)", category: "boom", label: "1K", showInRealTime: true, baseValue: 102.05, color: "hsl(143, 85%, 52%)" },
  
  // Crash indices
  { id: "crash-300", name: "Índice Crash 300", category: "crash", label: "300", baseValue: 30.28, color: "hsl(0, 85%, 52%)" },
  { id: "crash-500", name: "Índice Crash 500", category: "crash", label: "500", baseValue: 50.35, color: "hsl(0, 85%, 52%)" },
  { id: "crash-1000", name: "Índice Crash 1000", category: "crash", label: "1000", baseValue: 100.18, color: "hsl(0, 85%, 52%)" },
  { id: "crash-1000-1s", name: "Índice Crash 1000 (1s)", category: "crash", label: "1K", showInRealTime: true, baseValue: 98.05, color: "hsl(0, 85%, 52%)" },
  
  // Cryptocurrencies
  { id: "bitcoin", name: "Bitcoin (BTC/USD)", category: "cripto", baseValue: 111291.22, color: "hsl(41, 98%, 49%)" },
  { id: "ethereum", name: "Ethereum (ETH/USD)", category: "cripto", baseValue: 2657.98, color: "hsl(207, 90%, 61%)" },
  { id: "litecoin", name: "Litecoin (LTC/USD)", category: "cripto", baseValue: 68.75, color: "hsl(214, 5%, 65%)" },
  { id: "ripple", name: "Ripple (XRP/USD)", category: "cripto", baseValue: 0.48, color: "hsl(208, 100%, 58%)" },
  { id: "bitcoin-cash", name: "Bitcoin Cash (BCH/USD)", category: "cripto", baseValue: 244.32, color: "hsl(144, 63%, 41%)" },
  { id: "cardano", name: "Cardano (ADA/USD)", category: "cripto", baseValue: 0.36, color: "hsl(203, 100%, 33%)" },
  { id: "polkadot", name: "Polkadot (DOT/USD)", category: "cripto", baseValue: 5.32, color: "hsl(336, 91%, 65%)" },
  { id: "solana", name: "Solana (SOL/USD)", category: "cripto", baseValue: 91.58, color: "hsl(249, 100%, 65%)" },
  { id: "dogecoin", name: "Dogecoin (DOGE/USD)", category: "cripto", baseValue: 0.10, color: "hsl(45, 93%, 58%)" },
  { id: "shiba-inu", name: "Shiba Inu (SHIB/USD)", category: "cripto", baseValue: 0.000018, color: "hsl(28, 93%, 54%)" },
  { id: "chainlink", name: "Chainlink (LINK/USD)", category: "cripto", baseValue: 11.75, color: "hsl(225, 100%, 60%)" },
  { id: "polygon", name: "Polygon (MATIC/USD)", category: "cripto", baseValue: 0.53, color: "hsl(265, 85%, 60%)" },
  
  // Commodities
  { id: "gold", name: "Oro (XAU/USD)", category: "materias-primas", baseValue: 2415.35, color: "hsl(43, 95%, 47%)" },
  { id: "silver", name: "Plata (XAG/USD)", category: "materias-primas", baseValue: 28.45, color: "hsl(0, 0%, 75%)" },
  { id: "copper", name: "Cobre (HG/USD)", category: "materias-primas", baseValue: 4.18, color: "hsl(26, 90%, 40%)" },
  { id: "oil", name: "Petróleo Crudo (OIL/USD)", category: "materias-primas", baseValue: 82.67, color: "hsl(215, 80%, 30%)" },
  { id: "natural-gas", name: "Gas Natural (NG/USD)", category: "materias-primas", baseValue: 2.18, color: "hsl(195, 90%, 40%)" },
  { id: "platinum", name: "Platino (PL/USD)", category: "materias-primas", baseValue: 975.28, color: "hsl(210, 20%, 70%)" },
  
  // Forex
  { id: "eurusd", name: "EUR/USD", category: "forex", baseValue: 1.0835, color: "hsl(207, 90%, 61%)" },
  { id: "gbpusd", name: "GBP/USD", category: "forex", baseValue: 1.2718, color: "hsl(207, 90%, 61%)" },
  { id: "usdjpy", name: "USD/JPY", category: "forex", baseValue: 155.82, color: "hsl(207, 90%, 61%)" },
  { id: "audusd", name: "AUD/USD", category: "forex", baseValue: 0.6752, color: "hsl(207, 90%, 61%)" },
  { id: "usdcad", name: "USD/CAD", category: "forex", baseValue: 1.3724, color: "hsl(207, 90%, 61%)" },
  { id: "usdchf", name: "USD/CHF", category: "forex", baseValue: 0.9128, color: "hsl(207, 90%, 61%)" },
  { id: "nzdusd", name: "NZD/USD", category: "forex", baseValue: 0.6125, color: "hsl(207, 90%, 61%)" },
  { id: "eurjpy", name: "EUR/JPY", category: "forex", baseValue: 168.45, color: "hsl(207, 90%, 61%)" },
  { id: "eurgbp", name: "EUR/GBP", category: "forex", baseValue: 0.8517, color: "hsl(207, 90%, 61%)" },
  { id: "usdmxn", name: "USD/MXN", category: "forex", baseValue: 17.28, color: "hsl(207, 90%, 61%)" },
  { id: "usdbrl", name: "USD/BRL", category: "forex", baseValue: 5.14, color: "hsl(207, 90%, 61%)" },
  { id: "usdcop", name: "USD/COP", category: "forex", baseValue: 3952, color: "hsl(207, 90%, 61%)" },
  
  // Stock indices
  { id: "us500", name: "US 500 (S&P 500)", category: "indices", baseValue: 5318.25, color: "hsl(210, 20%, 80%)" },
  { id: "ustec", name: "US TECH 100 (NASDAQ)", category: "indices", baseValue: 18572.84, color: "hsl(210, 20%, 80%)" },
  { id: "us30", name: "US 30 (Dow Jones)", category: "indices", baseValue: 39125.15, color: "hsl(210, 20%, 80%)" },
  { id: "uk100", name: "UK 100 (FTSE 100)", category: "indices", baseValue: 8242.18, color: "hsl(210, 20%, 80%)" },
  { id: "germany40", name: "Germany 40 (DAX)", category: "indices", baseValue: 18042.35, color: "hsl(210, 20%, 80%)" },
  { id: "france40", name: "France 40 (CAC 40)", category: "indices", baseValue: 7958.65, color: "hsl(210, 20%, 80%)" },
  { id: "japan225", name: "Japan 225 (Nikkei)", category: "indices", baseValue: 38242.8, color: "hsl(210, 20%, 80%)" },
  { id: "australia200", name: "Australia 200 (ASX)", category: "indices", baseValue: 7835.42, color: "hsl(210, 20%, 80%)" },
  { id: "china50", name: "China 50", category: "indices", baseValue: 11823.15, color: "hsl(210, 20%, 80%)" },
  { id: "india50", name: "India 50 (Nifty)", category: "indices", baseValue: 22534.8, color: "hsl(210, 20%, 80%)" },
  { id: "brazil50", name: "Brazil 50 (Bovespa)", category: "indices", baseValue: 125218.65, color: "hsl(210, 20%, 80%)" },

  // Acciones individuales (stocks)
  { id: "aapl", name: "Apple Inc. (AAPL)", category: "stocks", baseValue: 208.42, color: "hsl(160, 84%, 39%)", icon: <AppleIcon className="w-4 h-4" /> },
  { id: "nvda", name: "NVIDIA Corp. (NVDA)", category: "stocks", baseValue: 126.26, color: "hsl(160, 84%, 39%)", icon: <NvidiaIcon className="w-4 h-4" /> },
  { id: "msft", name: "Microsoft Corp. (MSFT)", category: "stocks", baseValue: 428.15, color: "hsl(160, 84%, 39%)", icon: <MicrosoftIcon className="w-4 h-4" /> },
  { id: "googl", name: "Alphabet Inc. (GOOGL)", category: "stocks", baseValue: 174.38, color: "hsl(160, 84%, 39%)", icon: <GoogleIcon className="w-4 h-4" /> },
  { id: "amzn", name: "Amazon.com Inc. (AMZN)", category: "stocks", baseValue: 183.95, color: "hsl(160, 84%, 39%)", icon: <AmazonIcon className="w-4 h-4" /> },
  { id: "meta", name: "Meta Platforms Inc. (META)", category: "stocks", baseValue: 567.33, color: "hsl(160, 84%, 39%)", icon: <MetaIcon className="w-4 h-4" /> },
  { id: "tsla", name: "Tesla Inc. (TSLA)", category: "stocks", baseValue: 230.82, color: "hsl(160, 84%, 39%)", icon: <TeslaIcon className="w-4 h-4" /> },
  { id: "adbe", name: "Adobe Inc. (ADBE)", category: "stocks", baseValue: 517.75, color: "hsl(160, 84%, 39%)", icon: <AdobeIcon className="w-4 h-4" /> },
  { id: "nflx", name: "Netflix Inc. (NFLX)", category: "stocks", baseValue: 762.92, color: "hsl(160, 84%, 39%)", icon: <NetflixIcon className="w-4 h-4" /> },
  { id: "dis", name: "Walt Disney Co. (DIS)", category: "stocks", baseValue: 114.02, color: "hsl(160, 84%, 39%)", icon: <DisneyIcon className="w-4 h-4" /> },
  { id: "ko", name: "Coca-Cola Co. (KO)", category: "stocks", baseValue: 65.82, color: "hsl(160, 84%, 39%)", icon: <CocaColaIcon className="w-4 h-4" /> },
  { id: "pep", name: "PepsiCo Inc. (PEP)", category: "stocks", baseValue: 173.24, color: "hsl(160, 84%, 39%)", icon: <PepsiIcon className="w-4 h-4" /> },
  { id: "jnj", name: "Johnson & Johnson (JNJ)", category: "stocks", baseValue: 152.31, color: "hsl(160, 84%, 39%)", icon: <JohnsonIcon className="w-4 h-4" /> },
  { id: "v", name: "Visa Inc. (V)", category: "stocks", baseValue: 276.51, color: "hsl(160, 84%, 39%)", icon: <VisaIcon className="w-4 h-4" /> },
  { id: "ma", name: "Mastercard Inc. (MA)", category: "stocks", baseValue: 461.16, color: "hsl(160, 84%, 39%)", icon: <MastercardIcon className="w-4 h-4" /> },
];

// Time periods
const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H" }, 
  { id: "24h" as TimeRange, label: "24H" }, 
  { id: "7d" as TimeRange, label: "7D" }, 
  { id: "30d" as TimeRange, label: "30D" }, 
];

// Data source configurations
const DATA_SOURCES = [
  { 
    id: "AUTO" as DataSource, 
    label: "Automático", 
    description: "Selecciona la mejor fuente disponible",
    icon: "🔄",
    priority: 1
  },
  { 
    id: "BITSTAMP" as DataSource, 
    label: "Bitstamp", 
    description: "Datos reales de Bitstamp (solo criptomonedas)",
    icon: "₿",
    priority: 2,
    supportedCategories: ["cripto"]
  },
  { 
    id: "COINGECKO" as DataSource, 
    label: "CoinGecko", 
    description: "Datos de CoinGecko API",
    icon: "🦎",
    priority: 3,
    supportedCategories: ["cripto"]
  },
  { 
    id: "BINANCE" as DataSource, 
    label: "Binance", 
    description: "Datos de Binance API",
    icon: "🟡",
    priority: 4,
    supportedCategories: ["cripto"]
  },
  { 
    id: "SIMULADO" as DataSource, 
    label: "Simulado", 
    description: "Datos generados para demostración",
    icon: "🎲",
    priority: 5
  }
];

// Colores predeterminados para niveles
const LEVEL_COLORS = {
  soporte: "hsl(143, 85%, 52%)",  // Verde para soporte
  resistencia: "hsl(0, 85%, 52%)", // Rojo para resistencia
  precio: "#2962FF",              // Azul para precio
  custom: "#8a0303"               // Burdeos para personalizado
};

// Estilos de línea disponibles
const LINE_STYLES = [
  { id: 0, label: "Sólida" },
  { id: 1, label: "Punteada" },
  { id: 2, label: "Discontinua" },
  { id: 3, label: "Guiones largos" }
];

// Group markets by category for the dropdown
const getGroupedMarkets = () => {
  const grouped: { [key in MarketCategory]?: MarketItem[] } = {};
  
  MARKETS.forEach(market => {
    if (!grouped[market.category]) {
      grouped[market.category] = [];
    }
    grouped[market.category]?.push(market);
  });
  
  return grouped;
};

// Chart Placeholder component
const ChartPlaceholder = () => (
  <div className="w-full h-full bg-muted/30 animate-pulse rounded-md flex flex-col items-center justify-center">
    <div className="text-center p-6 max-w-md">
      <div className="text-xl font-semibold mb-2">Cargando gráfico...</div>
      <div className="text-sm text-muted-foreground mb-4">
        Estamos preparando los datos del mercado. Este componente puede tardar unos segundos en cargar.
      </div>
      <div className="w-full h-2 bg-muted/50 rounded overflow-hidden">
        <div className="h-full bg-primary/60 animate-[grow_2s_ease-in-out_infinite]" style={{width: '70%'}}/>
      </div>
    </div>
  </div>
);

// Generate market data based on market configuration and time range
const generateMarketData = (marketConfig: MarketItem, timeRange: TimeRange, timeOffsetValue: number = 0) => {
  const dataPoints = timeRange === "1h" ? 60 : 
                     timeRange === "24h" ? 24 : 
                     timeRange === "7d" ? 7 : 30;
  
  // Usar la hora actual exacta del usuario con offset
  const now = new Date();
  
  // Aplicar offset temporal basado en el rango de tiempo
  if (timeOffsetValue > 0) {
    if (timeRange === "1h") {
      now.setMinutes(now.getMinutes() - (timeOffsetValue * 60)); // Retroceder horas
    } else if (timeRange === "24h") {
      now.setHours(now.getHours() - (timeOffsetValue * 24)); // Retroceder días
    } else if (timeRange === "7d") {
      now.setDate(now.getDate() - (timeOffsetValue * 7)); // Retroceder semanas
    } else {
      now.setDate(now.getDate() - (timeOffsetValue * 30)); // Retroceder meses
    }
  }
  
  const data = [];
  
  // Base value with some randomness
  let currentValue = marketConfig.baseValue * (1 + (Math.random() * 0.1 - 0.05));
  
  for (let i = dataPoints; i >= 0; i--) {
    // Crear una nueva fecha exacta para cada punto
    const date = new Date();
    
    if (timeRange === "1h") {
      // Para periodos de 1h, ir reduciendo minutos
      date.setMinutes(date.getMinutes() - i);
      // Asegurar que incluye segundos exactos
      date.setSeconds(now.getSeconds());
    } else if (timeRange === "24h") {
      // Para periodos de 24h, ir reduciendo horas
      date.setHours(date.getHours() - i);
    } else if (timeRange === "7d") {
      // Para periodos de 7d, ir reduciendo días
      date.setDate(date.getDate() - i);
    } else {
      // Para periodos de 30d, ir reduciendo días
      date.setDate(date.getDate() - i);
    }
    
    // Add some randomness to create a realistic looking chart
    const change = (Math.random() * 0.02 - 0.01) * currentValue;
    currentValue += change;
    
    // Use Unix timestamp (seconds) for precise time representation
    const time = Math.floor(date.getTime() / 1000);
    
    data.push({
      time,
      value: Math.round(currentValue * 100) / 100,
    });
  }
  
  return data;
};

// Generate candlestick data
const generateCandlestickData = (marketConfig: MarketItem, timeRange: TimeRange, timeOffsetValue: number = 0) => {
  const dataPoints = timeRange === "1h" ? 60 : 
                    timeRange === "24h" ? 24 : 
                    timeRange === "7d" ? 7 : 30;
  
  // Usar la hora actual exacta del usuario con offset
  const now = new Date();
  
  // Aplicar offset temporal basado en el rango de tiempo
  if (timeOffsetValue > 0) {
    if (timeRange === "1h") {
      now.setMinutes(now.getMinutes() - (timeOffsetValue * 60)); // Retroceder horas
    } else if (timeRange === "24h") {
      now.setHours(now.getHours() - (timeOffsetValue * 24)); // Retroceder días
    } else if (timeRange === "7d") {
      now.setDate(now.getDate() - (timeOffsetValue * 7)); // Retroceder semanas
    } else {
      now.setDate(now.getDate() - (timeOffsetValue * 30)); // Retroceder meses
    }
  }
  
  const data: CandlestickDataPoint[] = [];
  
  // Base value with some randomness
  let currentValue = marketConfig.baseValue * (1 + (Math.random() * 0.1 - 0.05));
  
  for (let i = dataPoints; i >= 0; i--) {
    // Crear una nueva fecha exacta para cada vela
    const date = new Date();
    
    if (timeRange === "1h") {
      // Para periodos de 1h, reducir minutos
      date.setMinutes(date.getMinutes() - i);
      // Mantener los mismos segundos que ahora
      date.setSeconds(now.getSeconds());
    } else if (timeRange === "24h") {
      // Para periodos de 24h, reducir horas
      date.setHours(date.getHours() - i);
    } else if (timeRange === "7d") {
      // Para periodos de 7d, reducir días
      date.setDate(date.getDate() - i);
    } else {
      // Para periodos de 30d, reducir días
      date.setDate(date.getDate() - i);
    }
    
    // Calculate open, high, low, close
    const open = currentValue;
    const volatility = marketConfig.category === "volatility" ? 0.015 : 0.008;
    const change = (Math.random() * volatility * 2 - volatility) * currentValue;
    const close = open + change;
    
    // Generate high and low with some randomness
    const highOffset = Math.abs(Math.random() * 0.008 * currentValue);
    const lowOffset = Math.abs(Math.random() * 0.008 * currentValue);
    
    const high = Math.max(open, close) + highOffset;
    const low = Math.min(open, close) - lowOffset;
    
    // Update current value for next candle
    currentValue = close;
    
    // Use Unix timestamp (seconds) for precise time representation
    const time = Math.floor(date.getTime() / 1000);
    
    data.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100
    });
  }
  
  return data;
};

// Main Chart Component
const RealTimeMarketChart = ({ marketId: initialMarketId, isRealTime: initialRealTime = false }: RealTimeMarketChartProps) => {
  // State
  const [currentMarket, setCurrentMarket] = useState<string>(initialMarketId || "volatility-100");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [realTimeEnabled, setRealTimeEnabled] = useState(initialRealTime);
  const [showPriceLevels, setShowPriceLevels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>(["volatility-100-1s", "bitcoin"]);
  const [isClient, setIsClient] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [candlestickData, setCandlestickData] = useState<CandlestickDataPoint[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showTradingPanel, setShowTradingPanel] = useState(false);
  
  // Estado para fuente de datos
  const [dataSource, setDataSource] = useState<DataSource>("AUTO");
  
  // Estado para controlar si los datos son simulados o reales
  const [isSimulatedData, setIsSimulatedData] = useState<boolean>(true);
  
  // Estado para navegación temporal
  const [timeOffset, setTimeOffset] = useState<number>(0); // Offset en unidades de tiempo hacia atrás
  const [isHistoricalMode, setIsHistoricalMode] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
  // Usar el contexto de posiciones en lugar del estado local
  const { positions, addPosition, removePosition, updatePositionPrices } = useTradePositions();
  
  // Animation ref for trading panel transition
  const chartHeightRef = useRef<number>(400);
  const [chartContainerHeight, setChartContainerHeight] = useState<number>(400);
  
  // Estados para niveles
  const [showLevels, setShowLevels] = useState<boolean>(true);
  const [levels, setLevels] = useState<ChartLevel[]>([]);
  const [newLevel, setNewLevel] = useState<{
    value: string;
    type: 'soporte' | 'resistencia' | 'precio' | 'custom';
    color: string;
    lineWidth: number;
    lineStyle: number;
    title: string;
  }>({
    value: '100',
    type: 'precio',
    color: LEVEL_COLORS.precio,
    lineWidth: 1,
    lineStyle: 0,
    title: '',
  });
  const [isAddLevelDialogOpen, setIsAddLevelDialogOpen] = useState(false);
  
  // Ref para el componente del gráfico
  const chartRef = useRef<any>(null);
  
  // Ref para la función resetZoom
  const resetZoomRef = useRef<(() => void) | null>(null);
  
  // Trading mode toggle
  const toggleTradingPanel = () => {
    setShowTradingPanel(!showTradingPanel);
    
    // Adjust chart height with animation when trading panel is shown/hidden
    if (!showTradingPanel) {
      // Shrink chart when showing trading panel
      setChartContainerHeight(240);
    } else {
      // Restore chart height when hiding trading panel
      setChartContainerHeight(400);
    }
  };
  
  // Current market configuration (memoized)
  const currentMarketConfig = useMemo(() => 
    MARKETS.find(m => m.id === currentMarket) || MARKETS[0], 
    [currentMarket]
  );

  // Determinar la fuente de datos efectiva
  const effectiveDataSource = useMemo(() => {
    if (dataSource === "AUTO") {
      // Lógica automática: usar Bitstamp para criptos soportadas, simulado para el resto
      if (currentMarketConfig.category === "cripto") {
        return "BITSTAMP";
      }
      return "SIMULADO";
    }
    
    // Verificar si la fuente seleccionada soporta la categoría actual
    const sourceConfig = DATA_SOURCES.find(s => s.id === dataSource);
    if (sourceConfig?.supportedCategories && 
        !sourceConfig.supportedCategories.includes(currentMarketConfig.category)) {
      // Si la fuente no soporta la categoría, usar simulado
      return "SIMULADO";
    }
    
    return dataSource;
  }, [dataSource, currentMarketConfig.category]);

  // Hook de Bitstamp (solo se usa cuando la fuente efectiva es Bitstamp)
  const shouldUseBitstamp = effectiveDataSource === "BITSTAMP";
  const bitstampData = useBitstampData({
    symbol: shouldUseBitstamp ? currentMarket : "bitcoin", // Usar un valor por defecto cuando no se necesita
    timeRange,
    chartType,
    realTimeEnabled: shouldUseBitstamp && realTimeEnabled && !isHistoricalMode,
    timeOffset,
    isHistoricalMode
  });

  // Prepare Binance data when selected
  const cryptoSymbolMatch = currentMarketConfig.name.match(/\((\w+)\/USD\)/);
  const binanceSymbol = cryptoSymbolMatch ? `${cryptoSymbolMatch[1]}USDT` : currentMarketConfig.id.toUpperCase();
  const binanceData = useBinanceData(
    binanceSymbol,
    timeRange,
    effectiveDataSource === 'BINANCE' && realTimeEnabled && !isHistoricalMode
  );

  // Determine if we should fallback to simulated
  const shouldFallbackToSimulated = useMemo(() => {
    return effectiveDataSource === "BITSTAMP" && 
           bitstampData.error && 
           !bitstampData.isLoading;
  }, [effectiveDataSource, bitstampData.error, bitstampData.isLoading]);
  
  // Replace random price generation with stable initial value
  const [currentPrice, setCurrentPrice] = useState(0);
  
  // Verificar si los datos son simulados basado en la fuente efectiva
  useEffect(() => {
    // Los datos son simulados si la fuente es SIMULADO o si hay fallback
    const isSimulated = effectiveDataSource === "SIMULADO" || Boolean(shouldFallbackToSimulated);
    setIsSimulatedData(isSimulated);
  }, [effectiveDataSource, shouldFallbackToSimulated]);

  // Initialize price after component mounts (client-side only)
  useEffect(() => {
    if (!shouldUseBitstamp) {
      // Solo establecer precio inicial para datos simulados
      setCurrentPrice(currentMarketConfig.baseValue);
      
      // After a short delay, start using random values
      const timer = setTimeout(() => {
        const randomPrice = Math.round(currentMarketConfig.baseValue * (1 + (Math.random() * 0.05 - 0.025)) * 100) / 100;
        setCurrentPrice(randomPrice);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentMarketConfig.baseValue, shouldUseBitstamp]);
  
  // Handle trade placement and add to open positions
  const handlePlaceTrade = (direction: 'up' | 'down', stake: number, totalAmount: number, duration: {value: number, unit: 'minute' | 'hour' | 'day'} = {value: 1, unit: 'minute'}) => {
    // Create new position
    const newPosition = {
      marketId: currentMarketConfig.id,
      marketName: currentMarketConfig.name,
      marketColor: currentMarketConfig.color,
      direction,
      openPrice: currentPrice,
      currentPrice: currentPrice,
      amount: totalAmount,
      stake,
      openTime: new Date(),
      duration: duration,
      profit: 0,
      profitPercentage: 0,
    };
    
    // Usar el método del contexto para añadir la posición
    addPosition(newPosition);
    
    // Close the trading panel
    setShowTradingPanel(false);
  };
  
  // Close a position
  const handleClosePosition = (positionId: string) => {
    // Usar el método del contexto para eliminar la posición
    removePosition(positionId);
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate the milliseconds for a duration
  const getDurationInMs = (duration: { value: number; unit: string }): number => {
    const multipliers: Record<string, number> = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000
    };
    
    return duration.value * (multipliers[duration.unit] || 0);
  };
  
  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Generate and update chart data when market or time range changes
  useEffect(() => {
    if (!isClient || !currentMarketConfig) return;

    // If Binance is selected, use its data
    if (effectiveDataSource === 'BINANCE') {
      setChartData(binanceData as any);
      setCandlestickData([]);
      return;
    }
    if (shouldUseBitstamp && bitstampData.isSupported && !shouldFallbackToSimulated) {
      // Use Bitstamp data
      if (!bitstampData.isLoading && !bitstampData.error && bitstampData.data.length > 0) {
        setChartData(bitstampData.data);
        setCandlestickData(bitstampData.candlestickData);
        if (bitstampData.currentPrice > 0) {
          setCurrentPrice(bitstampData.currentPrice);
        }
      }
    } else {
      // Simulated data
      const newData = generateMarketData(currentMarketConfig, timeRange, timeOffset);
      setChartData(newData);
      const newCandleData = generateCandlestickData(currentMarketConfig, timeRange, timeOffset);
      setCandlestickData(newCandleData);
      if (newData.length > 0) {
        setCurrentPrice(newData[newData.length - 1].value);
      }
    }
  }, [
    isClient,
    currentMarketConfig.id,
    timeRange,
    timeOffset,
    shouldUseBitstamp,
    shouldFallbackToSimulated,
    bitstampData.isLoading,
    bitstampData.error,
    bitstampData.data.length,
    bitstampData.currentPrice,
    effectiveDataSource,
    binanceData
  ]);
  
  // Update data in real-time if enabled with more fluid updates (solo para datos simulados)
  useEffect(() => {
    if (!realTimeEnabled || !isClient || !currentMarketConfig || isHistoricalMode || shouldUseBitstamp) return;
    
    // Clear any existing interval for chart updates
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Create smoother updates with appropriate interval
    const updateInterval = currentMarketConfig.showInRealTime ? 500 : 2000;
    
    const chartUpdateInterval = setInterval(() => {
      // Usar la fecha actual exacta
      const now = new Date();
      
      if (chartType === 'area' || chartType === 'line') {
        // Handle line/area chart updates
        const latestValue = chartData.length > 0 
          ? chartData[chartData.length - 1].value 
          : currentMarketConfig.baseValue;
        
        // Add some random movement to the value (smoother changes)
        const changeMultiplier = currentMarketConfig.category === "volatility" ? 0.01 : 0.005;
        const change = (Math.random() * changeMultiplier * 2 - changeMultiplier) * latestValue;
        const newValue = Math.round((latestValue + change) * 100) / 100;
        
        // Use Unix timestamp for precise time - usar el tiempo actual real
        const time = Math.floor(now.getTime() / 1000);
        
        // Actualizamos el precio actual del mercado para reflejar el último valor
        setCurrentPrice(prevPrice => newValue);
        
        // Add new point and remove oldest if needed
        setChartData(prev => {
          const newData = [...prev, { time, value: newValue }];
          // Limit the number of points to maintain performance
          const maxPoints = 100;
          if (newData.length > maxPoints) {
            return newData.slice(-maxPoints);
          }
          return newData;
        });
      } else if (chartType === 'candle' || chartType === 'bar') {
        // Handle candlestick/bar chart updates
        if (candlestickData.length === 0) return;
        
        // Get the latest candle
        const latestCandle = {...candlestickData[candlestickData.length - 1]};
        
        // Create a new candle or update the current one
        const time = Math.floor(now.getTime() / 1000);
        const volatility = currentMarketConfig.category === "volatility" ? 0.008 : 0.004;
        
        // 20% chance to create a new candle, 80% chance to update current
        if (Math.random() > 0.8 || time - latestCandle.time > 60) {
          // Create a new candle
          const open = latestCandle.close;
          const change = (Math.random() * volatility * 2 - volatility) * open;
          const close = Math.round((open + change) * 100) / 100;
          
          const highOffset = Math.abs(Math.random() * 0.005 * open);
          const lowOffset = Math.abs(Math.random() * 0.005 * open);
          
          const high = Math.round((Math.max(open, close) + highOffset) * 100) / 100;
          const low = Math.round((Math.min(open, close) - lowOffset) * 100) / 100;
          
          // Actualizamos el precio actual del mercado para reflejar el cierre actual
          setCurrentPrice(prevPrice => close);
          
          setCandlestickData(prev => {
            const newData = [...prev, { time, open, high, low, close }];
            const maxPoints = 100;
            if (newData.length > maxPoints) {
              return newData.slice(-maxPoints);
            }
            return newData;
          });
        } else {
          // Update the current candle
          const change = (Math.random() * volatility * 2 - volatility) * latestCandle.close;
          const newClose = Math.round((latestCandle.close + change) * 100) / 100;
          
          const newHigh = Math.max(latestCandle.high, newClose);
          const newLow = Math.min(latestCandle.low, newClose);
          
          // Actualizamos el precio actual del mercado para reflejar el cierre actual
          setCurrentPrice(prevPrice => newClose);
          
          setCandlestickData(prev => {
            const newData = [...prev];
            newData[newData.length - 1] = {
              ...latestCandle,
              close: newClose,
              high: newHigh,
              low: newLow
            };
            return newData;
          });
        }
      }
    }, updateInterval);
    
    // Store reference to clear later
    updateIntervalRef.current = chartUpdateInterval;
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [realTimeEnabled, isClient, currentMarketConfig, chartType, chartData, candlestickData, isHistoricalMode]);
  
  // Filtered markets by search (memoized)
  const filteredMarkets = useMemo(() => 
    searchQuery 
      ? MARKETS.filter(market => 
          market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.id.toLowerCase().includes(searchQuery.toLowerCase()))
      : MARKETS, 
    [searchQuery]
  );
  
  // Toggle real-time updates (memoized)
  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(prev => !prev);
  }, []);
  
  // Toggle favorite status (memoized)
  const toggleFavorite = useCallback((marketId: string) => {
    setFavoriteMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId) 
        : [...prev, marketId]
    );
  }, []);
  
  // Handle time range change (memoized)
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    // Resetear al presente cuando se cambia el rango de tiempo para evitar inconsistencias
    if (isHistoricalMode) {
      setTimeOffset(0);
      setIsHistoricalMode(false);
      setSelectedDate(undefined);
    }
  }, [isHistoricalMode]);

  // Toggle price levels (memoized)
  const togglePriceLevels = useCallback(() => {
    setShowPriceLevels(prev => !prev);
  }, []);

  // Render market item (memoized)
  const renderMarketItem = useCallback((market: MarketItem) => (
    <div 
      key={market.id} 
      className="flex items-center justify-between py-2 px-3 hover:bg-muted cursor-pointer"
      onClick={() => setCurrentMarket(market.id)}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-6 flex items-center justify-center rounded",
          market.id === currentMarket && "bg-primary/30"
        )} 
          style={{ backgroundColor: market.id === currentMarket ? `${market.color}30` : 'transparent' }}
        >
          {market.icon ? (
            <span className="text-xs" style={{ color: market.color }}>
              {market.icon}
            </span>
          ) : (
          <span className="text-xs font-semibold" style={{ color: market.color }}>
            {market.label || market.id.substring(0, 3).toUpperCase()}
          </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{market.name}</span>
          <div className="flex items-center gap-1">
            {market.showInRealTime && (
              <span className="text-xs px-1 py-0.5 rounded bg-red-500 text-white w-fit">1s</span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(market.baseValue)}
            </span>
          </div>
        </div>
      </div>
      <button 
        className="p-1 rounded-sm hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(market.id);
        }}
      >
        <Star 
          className="w-4 h-4" 
          fill={favoriteMarkets.includes(market.id) ? "currentColor" : "none"} 
          color={favoriteMarkets.includes(market.id) ? "hsl(41, 98%, 49%)" : "currentColor"} 
        />
      </button>
    </div>
  ), [currentMarket, favoriteMarkets, toggleFavorite]);

  // Grouped markets (memoized)
  const groupedMarkets = useMemo(() => getGroupedMarkets(), []);

  // Chart colors based on market type and theme
  const chartColors = useMemo(() => {
    const color = currentMarketConfig.color;
    // Extract the HSL values to properly create HSLA colors
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    
    let areaTopColor = color;
    let areaBottomColor = color;
    
    if (match) {
      const [_, h, s, l] = match;
      areaTopColor = `hsla(${h}, ${s}%, ${l}%, 0.3)`;
      areaBottomColor = `hsla(${h}, ${s}%, ${l}%, 0)`;
    }
    
    return {
      backgroundColor: 'transparent',
      lineColor: color,
      textColor: 'rgba(255, 255, 255, 0.6)',
      areaTopColor,
      areaBottomColor,
      upColor: 'hsl(143, 85%, 52%)',
      downColor: 'hsl(0, 85%, 52%)',
      wickUpColor: 'hsl(143, 85%, 65%)',
      wickDownColor: 'hsl(0, 85%, 65%)',
    };
  }, [currentMarketConfig]);

  // Chart type options
  const chartTypeOptions = [
    { id: 'area', label: 'Área', icon: <AreaChartIcon className="w-4 h-4" /> },
    { id: 'line', label: 'Línea', icon: <LineChartIcon className="w-4 h-4" /> },
    { id: 'candle', label: 'Velas', icon: <CandleChartIcon className="w-4 h-4" /> },
    { id: 'bar', label: 'Barras', icon: <BarChartIcon className="w-4 h-4" /> },
  ];

  // Función para añadir un nivel nuevo
  const handleAddLevel = useCallback(() => {
    const value = parseFloat(newLevel.value);
    
    if (isNaN(value)) return;
    
    const levelId = uuidv4();
    const newLevelObj: ChartLevel = {
      id: levelId,
      value,
      color: newLevel.color || LEVEL_COLORS[newLevel.type],
      lineWidth: newLevel.lineWidth || 1,
      lineStyle: newLevel.lineStyle,
      title: newLevel.title || `${newLevel.type} ${value.toFixed(2)}`,
      type: newLevel.type
    };
    
    setLevels(prev => [...prev, newLevelObj]);
    
    // Reset the form
    setNewLevel(prev => ({
      ...prev,
      value: currentPrice ? currentPrice.toFixed(2) : '100',
      title: ''
    }));
    
    setIsAddLevelDialogOpen(false);
  }, [newLevel, currentPrice]);
  
  // Función para eliminar un nivel
  const handleRemoveLevel = useCallback((levelId: string) => {
    setLevels(prev => prev.filter(level => level.id !== levelId));
  }, []);
  
  // Función para usar el precio actual
  const handleUseCurrentPrice = useCallback(() => {
    if (currentPrice) {
      setNewLevel(prev => ({
        ...prev,
        value: currentPrice.toFixed(2)
      }));
    }
  }, [currentPrice]);

  // Actualizar color basado en el tipo seleccionado
  useEffect(() => {
    setNewLevel(prev => ({
      ...prev,
      color: LEVEL_COLORS[prev.type]
    }));
  }, [newLevel.type]);

  // Callback cuando el gráfico está listo
  const handleChartReady = useCallback((resetZoom: () => void) => {
    resetZoomRef.current = resetZoom;
  }, []);

  // Función para resetear el zoom del gráfico
  const handleResetZoom = useCallback(() => {
    if (resetZoomRef.current) {
      resetZoomRef.current();
    } else if (typeof window !== 'undefined' && (window as any).resetChartZoom) {
      (window as any).resetChartZoom();
    }
  }, [resetZoomRef]);

  // Funciones de navegación temporal
  const handleTimeNavigation = useCallback((direction: 'back' | 'forward') => {
    setTimeOffset(prev => {
      const newOffset = direction === 'back' ? prev + 1 : Math.max(0, prev - 1);
      setIsHistoricalMode(newOffset > 0);
      
      // Actualizar la fecha seleccionada basada en el nuevo offset
      if (newOffset === 0) {
        setSelectedDate(undefined);
      } else {
        const newDate = new Date();
        if (timeRange === "1h") {
          newDate.setHours(newDate.getHours() - newOffset);
        } else if (timeRange === "24h") {
          newDate.setDate(newDate.getDate() - newOffset);
        } else if (timeRange === "7d") {
          newDate.setDate(newDate.getDate() - (newOffset * 7));
        } else {
          newDate.setDate(newDate.getDate() - (newOffset * 30));
        }
        setSelectedDate(newDate);
      }
      
      return newOffset;
    });
  }, [timeRange]);

  const handleGoToPresent = useCallback(() => {
    setTimeOffset(0);
    setIsHistoricalMode(false);
    setSelectedDate(undefined);
    setShowCalendar(false);
  }, []);

  const handleJumpBack = useCallback(() => {
    setTimeOffset(prev => {
      const newOffset = prev + 5; // Saltar 5 unidades hacia atrás
      setIsHistoricalMode(true);
      
      // Actualizar la fecha seleccionada
      const newDate = new Date();
      if (timeRange === "1h") {
        newDate.setHours(newDate.getHours() - newOffset);
      } else if (timeRange === "24h") {
        newDate.setDate(newDate.getDate() - newOffset);
      } else if (timeRange === "7d") {
        newDate.setDate(newDate.getDate() - (newOffset * 7));
      } else {
        newDate.setDate(newDate.getDate() - (newOffset * 30));
      }
      setSelectedDate(newDate);
      
      return newOffset;
    });
  }, [timeRange]);

  // Función para navegar a una fecha específica
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // Calcular el offset basado en el rango de tiempo actual
    let newOffset = 0;
    if (timeRange === "1h") {
      newOffset = Math.floor(diffInMs / (60 * 60 * 1000)); // Diferencia en horas
    } else if (timeRange === "24h") {
      newOffset = Math.floor(diffInMs / (24 * 60 * 60 * 1000)); // Diferencia en días
    } else if (timeRange === "7d") {
      newOffset = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000)); // Diferencia en semanas
    } else {
      newOffset = Math.floor(diffInMs / (30 * 24 * 60 * 60 * 1000)); // Diferencia en meses
    }
    
    // Solo permitir fechas en el pasado
    if (newOffset > 0) {
      setTimeOffset(newOffset);
      setIsHistoricalMode(true);
      setSelectedDate(date);
    }
    
    setShowCalendar(false);
  }, [timeRange]);

  // Función para obtener la fecha actual basada en el offset
  const getCurrentDisplayDate = useCallback(() => {
    if (timeOffset === 0) return new Date();
    
    const now = new Date();
    if (timeRange === "1h") {
      now.setHours(now.getHours() - timeOffset);
    } else if (timeRange === "24h") {
      now.setDate(now.getDate() - timeOffset);
    } else if (timeRange === "7d") {
      now.setDate(now.getDate() - (timeOffset * 7));
    } else {
      now.setDate(now.getDate() - (timeOffset * 30));
    }
    return now;
  }, [timeOffset, timeRange]);

  // Función para formatear la fecha de visualización
  const formatDisplayDate = useCallback((date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return "Hoy";
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return "Ayer";
    }
    
    // Para fechas más antiguas, mostrar fecha completa
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Update open positions currentPrice in context whenever market price changes
  useEffect(() => {
    updatePositionPrices(currentMarketConfig.name, currentPrice);
  }, [currentMarketConfig.name, currentPrice, updatePositionPrices]);

  // al definir effectiveDataSource:
  useEffect(() => {
    console.log('>> Data source efectivo:', effectiveDataSource)
  }, [effectiveDataSource]);

  return (
    <div className="space-y-4">
      <Card className="mb-4 overflow-hidden transition-all duration-300">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded"
            style={{ backgroundColor: currentMarketConfig.color + "20" }}
          >
            {currentMarketConfig.icon ? (
              <span style={{ color: currentMarketConfig.color }}>
                {currentMarketConfig.icon}
              </span>
            ) : (
            <span 
              className="font-bold text-sm"
              style={{ color: currentMarketConfig.color }}
            >
              {currentMarketConfig.label || currentMarketConfig.id.substring(0, 3).toUpperCase()}
            </span>
            )}
          </div>
          <div className="flex flex-col">
              <div className="flex items-center gap-2">
            <span>{currentMarketConfig.name}</span>
                {/* Badge para indicar la fuente de datos actual */}
                <Badge 
                  variant={isSimulatedData ? "secondary" : "default"}
                  className={cn(
                    "px-1.5 py-0 text-[10px] font-medium",
                    isSimulatedData
                      ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20" 
                      : effectiveDataSource === "BITSTAMP"
                      ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20"
                      : "bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                  )}
                >
                  {shouldFallbackToSimulated 
                    ? "SIMULADO (FALLBACK)" 
                    : DATA_SOURCES.find(s => s.id === effectiveDataSource)?.label.toUpperCase()
                  }
                </Badge>
              </div>
            <div className="flex gap-1 items-center">
              {currentMarketConfig.showInRealTime && (
                <span className="text-xs px-1 py-0.5 rounded bg-red-500 text-white w-fit">1s</span>
              )}
                <span className="text-xs text-muted-foreground">
                  {shouldFallbackToSimulated
                    ? "(Fallback a datos simulados - Error en Bitstamp)"
                    : isSimulatedData 
                    ? "(Precios generados para fines de demostración)"
                    : effectiveDataSource === "BITSTAMP"
                    ? "(Datos reales de Bitstamp Exchange)"
                    : "(Datos de mercado en tiempo real)"
                  }
                  {effectiveDataSource === "BITSTAMP" && bitstampData.isLoading && " - Cargando..."}
                  {effectiveDataSource === "BITSTAMP" && bitstampData.error && !shouldFallbackToSimulated && " - Error de conexión"}
                </span>
            </div>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: currentMarketConfig.color }}
                  />
                  <span className="truncate">{currentMarketConfig.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px] max-h-[400px] overflow-y-auto">
              <div className="p-2">
                <Input
                  placeholder="Buscar mercado..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
              </div>
              
              {searchQuery ? (
                <>
                  <DropdownMenuLabel>Resultados de búsqueda</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filteredMarkets.length > 0 ? (
                    filteredMarkets.map(market => renderMarketItem(market))
                  ) : (
                    <div className="py-2 px-3 text-muted-foreground text-sm">No se encontraron resultados</div>
                  )}
                </>
              ) : (
                <>
                  {/* Favoritos */}
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    Favoritos
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {favoriteMarkets.length > 0 ? (
                    MARKETS.filter(m => favoriteMarkets.includes(m.id))
                      .map(market => renderMarketItem(market))
                  ) : (
                    <div className="py-2 px-3 text-muted-foreground text-sm">
                      No hay mercados favoritos
                    </div>
                  )}
                  
                    {/* Categorías */}
                  {Object.entries(MARKET_CATEGORIES)
                    .map(([category, info]) => {
                      const categoryMarkets = groupedMarkets[category as MarketCategory] || [];
                      if (categoryMarkets.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="flex items-center gap-2 mt-1">
                            {info.icon}
                            {info.name}
                          </DropdownMenuLabel>
                          <DropdownMenuGroup>
                              {categoryMarkets.slice(0, 10).map(market => renderMarketItem(market))}
                              {categoryMarkets.length > 10 && (
                                <div className="py-1 px-3 text-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs text-muted-foreground w-full"
                                    onClick={() => setSearchQuery(info.name.toLowerCase())}
                                  >
                                    Ver más ({categoryMarkets.length - 10} mercados)
                                  </Button>
                                </div>
                              )}
                          </DropdownMenuGroup>
                        </div>
                      );
                    })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Data Source Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <span className="text-sm">
                      {DATA_SOURCES.find(s => s.id === effectiveDataSource)?.icon}
                    </span>
                    <span className="hidden sm:inline">
                      {DATA_SOURCES.find(s => s.id === effectiveDataSource)?.label}
                    </span>
                    <span className="sm:hidden">Fuente</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Fuente de Datos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DATA_SOURCES.map((source) => {
                    const isSupported = !source.supportedCategories || 
                                      source.supportedCategories.includes(currentMarketConfig.category);
                    const isSelected = dataSource === source.id;
                    const isEffective = effectiveDataSource === source.id;
                    
                    return (
                      <DropdownMenuItem
                        key={source.id}
                        onClick={() => setDataSource(source.id)}
                        disabled={!isSupported}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3",
                          isSelected && "bg-accent",
                          !isSupported && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-base">{source.icon}</span>
                          <span className="font-medium">{source.label}</span>
                          {isSelected && <Badge variant="secondary" className="ml-auto text-xs">Seleccionado</Badge>}
                          {isEffective && !isSelected && <Badge variant="outline" className="ml-auto text-xs">Activo</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {source.description}
                        </span>
                        {!isSupported && (
                          <span className="text-xs text-red-500">
                            No compatible con {MARKET_CATEGORIES[currentMarketConfig.category].name}
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <div className="p-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-medium">Fuente actual:</span>
                      <span>{DATA_SOURCES.find(s => s.id === effectiveDataSource)?.label}</span>
                    </div>
                    {effectiveDataSource === "BITSTAMP" && bitstampData.lastUpdate && (
                      <div className="text-xs text-green-600">
                        Última actualización: {bitstampData.lastUpdate.toLocaleTimeString()}
                      </div>
                    )}
                    {effectiveDataSource === "BITSTAMP" && bitstampData.error && (
                      <div className="text-xs text-red-500">
                        Error: {bitstampData.error}
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chart Type Selector */}
              <div className="flex items-center bg-secondary rounded-md mr-2">
                {chartTypeOptions.map((type) => (
                  <Button
                    key={type.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 rounded-md flex items-center gap-1",
                      chartType === type.id && "bg-muted"
                    )}
                    onClick={() => setChartType(type.id as ChartType)}
                    title={type.label}
                  >
                    {type.icon}
                    <span className="hidden sm:inline">{type.label}</span>
                  </Button>
                ))}
              </div>
              
              {/* Time Range Selector */}
            <div className="flex items-center bg-secondary rounded-md">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 rounded-md",
                    timeRange === range.id && "bg-muted"
                  )}
                  onClick={() => handleTimeRangeChange(range.id)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            <Button 
              variant={showPriceLevels ? "outline" : "ghost"} 
              size="sm"
              onClick={togglePriceLevels}
              className="h-8"
            >
              {showPriceLevels ? "Ocultar Niveles" : "Mostrar Niveles"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant={showTradingPanel ? "default" : "outline"}
              size="sm"
                className={cn(
                  "h-8 gap-1",
                  showTradingPanel && "bg-primary"
                )}
                onClick={toggleTradingPanel}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Operar</span>
            </Button>
            <Button
              variant={realTimeEnabled && !isHistoricalMode ? "default" : "outline"}
              size="sm"
              onClick={toggleRealTime}
              className="gap-1 h-8"
              title={isHistoricalMode ? "No disponible en modo histórico" : (realTimeEnabled ? "Desactivar tiempo real" : "Activar tiempo real")}
              disabled={isHistoricalMode}
            >
              <span className={cn(
                "relative flex h-2 w-2 mr-1",
                realTimeEnabled ? "opacity-100" : "opacity-60"
              )}>
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  realTimeEnabled ? "bg-green-400" : "bg-muted-foreground"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  realTimeEnabled ? "bg-green-500" : "bg-muted-foreground"
                )}></span>
              </span>
              <span>Tiempo real</span>
            </Button>
            
            {/* Controles de navegación temporal */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border-r"
                onClick={handleJumpBack}
                title="Saltar 5 períodos atrás"
                disabled={false}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border-r"
                onClick={() => handleTimeNavigation('back')}
                title="Ir un período atrás"
                disabled={false}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border-r"
                onClick={() => handleTimeNavigation('forward')}
                title="Ir un período adelante"
                disabled={timeOffset === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={handleGoToPresent}
                title="Ir al presente"
                disabled={timeOffset === 0}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Selector de fecha histórica */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                                  <Button
                    variant={isHistoricalMode ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "gap-2 h-8 relative",
                      isHistoricalMode && "bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-500/30"
                    )}
                    title="Seleccionar fecha específica"
                  >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-xs">
                    {isHistoricalMode 
                      ? formatDisplayDate(getCurrentDisplayDate())
                      : "Fecha"
                    }
                  </span>
                  {isHistoricalMode && (
                    <span className="text-xs opacity-70">(-{timeOffset})</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Navegar a fecha específica</div>
                    <div className="text-xs text-muted-foreground">
                      Selecciona una fecha para ver los datos históricos del mercado
                    </div>
                    
                    {/* Atajos rápidos */}
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          handleDateSelect(yesterday);
                        }}
                      >
                        Ayer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const lastWeek = new Date();
                          lastWeek.setDate(lastWeek.getDate() - 7);
                          handleDateSelect(lastWeek);
                        }}
                      >
                        Hace 1 semana
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const lastMonth = new Date();
                          lastMonth.setMonth(lastMonth.getMonth() - 1);
                          handleDateSelect(lastMonth);
                        }}
                      >
                        Hace 1 mes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const lastYear = new Date();
                          lastYear.setFullYear(lastYear.getFullYear() - 1);
                          handleDateSelect(lastYear);
                        }}
                      >
                        Hace 1 año
                      </Button>
                    </div>

                    <Calendar
                      mode="single"
                      selected={selectedDate || getCurrentDisplayDate()}
                      onSelect={handleDateSelect}
                      disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                      initialFocus
                      className="rounded-md border"
                    />
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Rango: {timeRange === "1h" ? "Horas" : timeRange === "24h" ? "Días" : timeRange === "7d" ? "Semanas" : "Meses"}
                      </div>
                      {isHistoricalMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleGoToPresent}
                          className="h-7 text-xs"
                        >
                          Ir al presente
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Botón para actualizar datos (Bitstamp) o resetear zoom */}
            {effectiveDataSource === "BITSTAMP" ? (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={bitstampData.refreshData}
                title="Actualizar datos de Bitstamp"
                disabled={bitstampData.isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", bitstampData.isLoading && "animate-spin")} />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleResetZoom}
                title="Resetear zoom"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

          {/* Chart Container - With animated height transition */}
          <div 
            className="w-full border border-border rounded-md p-3 bg-card overflow-hidden transition-all duration-300 ease-in-out" 
            style={{ height: `${chartContainerHeight}px` }}
          >
          {isClient ? (
            effectiveDataSource === "BITSTAMP" && bitstampData.isLoading ? (
              <div className="w-full h-full bg-muted/30 animate-pulse rounded-md flex flex-col items-center justify-center">
                <div className="text-center p-6 max-w-md">
                  <div className="text-xl font-semibold mb-2">Conectando con Bitstamp...</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Obteniendo datos reales de {currentMarketConfig.name}
                  </div>
                  <div className="w-full h-2 bg-muted/50 rounded overflow-hidden">
                    <div className="h-full bg-blue-500/60 animate-[grow_2s_ease-in-out_infinite]" style={{width: '70%'}}/>
                  </div>
                </div>
              </div>
            ) : effectiveDataSource === "BITSTAMP" && bitstampData.error ? (
              <div className="w-full h-full bg-muted/30 rounded-md flex flex-col items-center justify-center">
                <div className="text-center p-6 max-w-md">
                  <div className="text-xl font-semibold mb-2 text-red-500">Error de conexión</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {bitstampData.error}
                  </div>
                  <Button 
                    onClick={bitstampData.refreshData}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : (
              <RealTimeMarketChartClient 
                data={chartType === 'candle' || chartType === 'bar' ? candlestickData : chartData}
                chartType={chartType}
                colors={chartColors}
                height={chartContainerHeight}
                isSimulatedData={isSimulatedData}
                levels={levels}
                showLevels={showLevels}
                onReady={handleChartReady}
              />
            )
          ) : (
            <ChartPlaceholder />
          )}
        </div>

          {/* Trading Panel */}
          <TradeControlPanel 
            marketId={currentMarketConfig.id}
            marketName={currentMarketConfig.name}
            marketPrice={currentPrice}
            marketColor={currentMarketConfig.color}
            isVisible={showTradingPanel}
            onClose={() => setShowTradingPanel(false)}
          />

          {/* New level dialog */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={showLevels ? "default" : "outline"}
                size="icon" 
                className="relative h-8 w-8"
                title="Niveles"
              >
                <Layers className="h-4 w-4" />
                {levels.length > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {levels.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-levels">Mostrar niveles</Label>
                  <Switch 
                    id="show-levels" 
                    checked={showLevels} 
                    onCheckedChange={setShowLevels}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium">Niveles ({levels.length})</span>
                  <div className="flex gap-1">
                    <Dialog open={isAddLevelDialogOpen} onOpenChange={setIsAddLevelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">Añadir</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Añadir nuevo nivel</DialogTitle>
                          <DialogDescription>
                            Establece un nivel para mostrar en el gráfico (soporte, resistencia o precio)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level-value" className="text-right">Valor</Label>
                            <div className="col-span-3 flex gap-2">
                              <Input 
                                id="level-value" 
                                type="text"
                                inputMode="decimal"
                                value={newLevel.value} 
                                onChange={(e) => setNewLevel(prev => ({...prev, value: e.target.value}))}
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={handleUseCurrentPrice}
                                disabled={currentPrice === null}
                                title="Usar precio actual"
                              >
                                Actual
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level-type" className="text-right">Tipo</Label>
                            <Select 
                              value={newLevel.type} 
                              onValueChange={(value: any) => setNewLevel(prev => ({...prev, type: value}))}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Tipo de nivel" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="soporte">Soporte</SelectItem>
                                <SelectItem value="resistencia">Resistencia</SelectItem>
                                <SelectItem value="precio">Precio</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level-style" className="text-right">Estilo</Label>
                            <Select 
                              value={newLevel.lineStyle.toString()} 
                              onValueChange={(value) => setNewLevel(prev => ({...prev, lineStyle: parseInt(value)}))}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Estilo de línea" />
                              </SelectTrigger>
                              <SelectContent>
                                {LINE_STYLES.map(style => (
                                  <SelectItem key={style.id} value={style.id.toString()}>
                                    {style.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level-title" className="text-right">Etiqueta</Label>
                            <Input 
                              id="level-title" 
                              value={newLevel.title} 
                              onChange={(e) => setNewLevel(prev => ({...prev, title: e.target.value}))}
                              placeholder="Opcional"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddLevel}>Añadir nivel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">Presets</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Niveles Predefinidos</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => {
                            if (!currentPrice) return;
                            // Añadir niveles Fibonacci (retrocesos)
                            const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786, 1];
                            const basePrice = currentPrice;
                            const priceRange = basePrice * 0.1; // 10% del precio actual
                            
                            // Creamos niveles de retroceso
                            const newLevels = fibLevels.map(level => ({
                              id: uuidv4(),
                              value: basePrice - (priceRange * level),
                              color: 'hsl(259, 85%, 65%)',
                              lineWidth: 1,
                              lineStyle: 1,
                              title: `Fib ${level * 100}%`,
                              type: 'custom' as const
                            }));
                            
                            setLevels(prev => [...prev, ...newLevels]);
                          }}>
                            Niveles Fibonacci
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (!currentPrice) return;
                            // Añadir niveles de Pivote (soporte y resistencia)
                            const basePrice = currentPrice;
                            const priceRange = basePrice * 0.03; // 3% del precio actual
                            
                            // Crear niveles de pivote
                            const pivotLevels = [
                              { name: 'R3', offset: priceRange * 2.5, type: 'resistencia' as const, color: 'hsl(0, 85%, 52%)' },
                              { name: 'R2', offset: priceRange * 1.5, type: 'resistencia' as const, color: 'hsl(0, 85%, 60%)' },
                              { name: 'R1', offset: priceRange * 0.75, type: 'resistencia' as const, color: 'hsl(0, 85%, 68%)' },
                              { name: 'Pivote', offset: 0, type: 'precio' as const, color: 'hsl(207, 90%, 61%)' },
                              { name: 'S1', offset: -priceRange * 0.75, type: 'soporte' as const, color: 'hsl(143, 85%, 68%)' },
                              { name: 'S2', offset: -priceRange * 1.5, type: 'soporte' as const, color: 'hsl(143, 85%, 60%)' },
                              { name: 'S3', offset: -priceRange * 2.5, type: 'soporte' as const, color: 'hsl(143, 85%, 52%)' },
                            ];
                            
                            const newLevels = pivotLevels.map(level => ({
                              id: uuidv4(),
                              value: basePrice + level.offset,
                              color: level.color,
                              lineWidth: level.name === 'Pivote' ? 2 : 1,
                              lineStyle: level.name === 'Pivote' ? 0 : 1,
                              title: level.name,
                              type: level.type
                            }));
                            
                            setLevels(prev => [...prev, ...newLevels]);
                          }}>
                            Niveles de Pivote
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (!currentPrice) return;
                            // Añadir líneas de tendencia basadas en el precio actual
                            const basePrice = currentPrice;
                            
                            // Calculamos los niveles psicológicos más cercanos 
                            // (números redondos que suelen ser importantes en trading)
                            
                            // Determinamos la escala del precio para encontrar niveles psicológicos relevantes
                            let scale = 1;
                            if (basePrice >= 10000) scale = 1000;
                            else if (basePrice >= 1000) scale = 100;
                            else if (basePrice >= 100) scale = 10;
                            else if (basePrice >= 10) scale = 1;
                            else if (basePrice >= 1) scale = 0.1;
                            else scale = 0.01;
                            
                            const roundedBase = Math.round(basePrice / scale) * scale;
                            
                            // Creamos 5 niveles psicológicos
                            const psychLevels = [
                              roundedBase - scale * 2,
                              roundedBase - scale,
                              roundedBase,
                              roundedBase + scale,
                              roundedBase + scale * 2
                            ];
                            
                            const newLevels = psychLevels.map(value => ({
                              id: uuidv4(),
                              value,
                              color: value === roundedBase ? 'hsl(207, 90%, 61%)' : 'hsl(20, 85%, 58%)',
                              lineWidth: value === roundedBase ? 2 : 1,
                              lineStyle: 0,
                              title: `Nivel ${value.toFixed(2)}`,
                              type: 'precio' as const
                            }));
                            
                            setLevels(prev => [...prev, ...newLevels]);
                          }}>
                            Niveles Psicológicos
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50" 
                          onClick={() => setLevels([])}
                        >
                          Borrar todos los niveles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Lista de niveles existentes */}
                <div className="max-h-[200px] overflow-y-auto">
                  {levels.length > 0 ? (
                    <div className="space-y-1">
                      {levels.map(level => (
                        <div key={level.id} className="flex items-center justify-between p-1 rounded hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: level.color }}
                            />
                            <span className="text-sm">
                              {level.title || `${level.type} ${level.value.toFixed(2)}`}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0" 
                            onClick={() => handleRemoveLevel(level.id)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2 text-center">
                      No hay niveles configurados
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
      </CardContent>
    </Card>
      
      {/* Open Positions */}
      {positions.length > 0 && (
        <OpenPositions 
          positions={positions}
          onClosePosition={handleClosePosition}
        />
      )}
    </div>
  );
};

export default RealTimeMarketChart; 