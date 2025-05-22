"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, Star, ChevronDown } from "lucide-react";
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

// Dynamically import the chart client to avoid SSR issues
const RealTimeMarketChartClient = dynamic(
  () => import("@/components/RealTimeMarketChartClient"),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);

// Types
type MarketCategory = "volatility" | "boom" | "crash" | "cripto" | "forex" | "materias-primas" | "indices";
type TimeRange = "1h" | "24h" | "7d" | "30d";
type ChartType = "area" | "candle" | "line" | "bar";

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
};

// Market configurations (reducido para mejorar rendimiento)
const MARKETS: MarketItem[] = [
  // Volatility indices (reducidos)
  { id: "volatility-100", name: "Índice Volatility 100", category: "volatility", label: "100", baseValue: 623, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-100-1s", name: "Índice Volatility 100 (1s)", category: "volatility", label: "100", showInRealTime: true, baseValue: 631.36, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-50", name: "Índice Volatility 50", category: "volatility", label: "50", baseValue: 420, color: "hsl(338, 90%, 56%)" },
  
  // Boom indices (reducidos)
  { id: "boom-500", name: "Índice Boom 500", category: "boom", label: "500", baseValue: 500, color: "hsl(143, 85%, 52%)" },
  { id: "boom-1000", name: "Índice Boom 1000", category: "boom", label: "1000", baseValue: 1000, color: "hsl(143, 85%, 52%)" },
  
  // Crash indices (reducidos)
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
const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H" }, 
  { id: "24h" as TimeRange, label: "24H" }, 
  { id: "7d" as TimeRange, label: "7D" }, 
  { id: "30d" as TimeRange, label: "30D" }, 
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
const generateMarketData = (marketConfig: MarketItem, timeRange: TimeRange) => {
  const dataPoints = timeRange === "1h" ? 60 : 
                     timeRange === "24h" ? 24 : 
                     timeRange === "7d" ? 7 : 30;
  
  const now = new Date();
  const data = [];
  
  // Base value with some randomness
  let currentValue = marketConfig.baseValue * (1 + (Math.random() * 0.1 - 0.05));
  
  for (let i = dataPoints; i >= 0; i--) {
    const date = new Date();
    
    if (timeRange === "1h") {
      date.setMinutes(now.getMinutes() - i);
    } else if (timeRange === "24h") {
      date.setHours(now.getHours() - i);
    } else {
      date.setDate(now.getDate() - i);
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
const generateCandlestickData = (marketConfig: MarketItem, timeRange: TimeRange) => {
  const dataPoints = timeRange === "1h" ? 60 : 
                    timeRange === "24h" ? 24 : 
                    timeRange === "7d" ? 7 : 30;
  
  const now = new Date();
  const data: CandlestickDataPoint[] = [];
  
  // Base value with some randomness
  let currentValue = marketConfig.baseValue * (1 + (Math.random() * 0.1 - 0.05));
  
  for (let i = dataPoints; i >= 0; i--) {
    const date = new Date();
    
    if (timeRange === "1h") {
      date.setMinutes(now.getMinutes() - i);
    } else if (timeRange === "24h") {
      date.setHours(now.getHours() - i);
    } else {
      date.setDate(now.getDate() - i);
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
  
  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Current market configuration (memoized)
  const currentMarketConfig = useMemo(() => 
    MARKETS.find(m => m.id === currentMarket) || MARKETS[0], 
    [currentMarket]
  );
  
  // Generate and update chart data when market or time range changes
  useEffect(() => {
    if (isClient && currentMarketConfig) {
      const newData = generateMarketData(currentMarketConfig, timeRange);
      setChartData(newData);
      
      const newCandleData = generateCandlestickData(currentMarketConfig, timeRange);
      setCandlestickData(newCandleData);
    }
  }, [isClient, currentMarketConfig, timeRange, generateCandlestickData]);
  
  // Update data in real-time if enabled with more fluid updates
  useEffect(() => {
    if (!realTimeEnabled || !isClient || !currentMarketConfig) return;
    
    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    // Create smoother updates with appropriate interval
    const updateInterval = currentMarketConfig.showInRealTime ? 500 : 2000;
    
    updateIntervalRef.current = setInterval(() => {
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
        
        // Use Unix timestamp for precise time
        const time = Math.floor(now.getTime() / 1000);
        
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
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [realTimeEnabled, isClient, currentMarketConfig, chartType, chartData, candlestickData]);
  
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
  }, []);

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
          <span className="text-xs font-semibold" style={{ color: market.color }}>
            {market.label || market.id.substring(0, 3).toUpperCase()}
          </span>
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

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded"
            style={{ backgroundColor: currentMarketConfig.color + "20" }}
          >
            <span 
              className="font-bold text-sm"
              style={{ color: currentMarketConfig.color }}
            >
              {currentMarketConfig.label || currentMarketConfig.id.substring(0, 3).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span>{currentMarketConfig.name}</span>
            <div className="flex gap-1 items-center">
              {currentMarketConfig.showInRealTime && (
                <span className="text-xs px-1 py-0.5 rounded bg-red-500 text-white w-fit">1s</span>
              )}
              <span className="text-xs text-muted-foreground">(Datos simulados)</span>
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
                  
                  {/* Categorías (mostrando solo algunas para mejorar rendimiento) */}
                  {Object.entries(MARKET_CATEGORIES)
                    .filter(([category]) => ['volatility', 'cripto', 'forex'].includes(category))
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
                            {categoryMarkets.map(market => renderMarketItem(market))}
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
              variant="outline" 
              size="sm"
              className="h-8"
            >
              Reset Zoom
            </Button>
            <Button 
              variant={realTimeEnabled ? "default" : "outline"} 
              size="sm"
              onClick={toggleRealTime}
              className="h-8 flex items-center gap-1"
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                realTimeEnabled ? "bg-green-500" : "bg-red-500"
              )} />
              {realTimeEnabled ? "Tiempo Real" : "Histórico"}
            </Button>
          </div>
        </div>
        <div className="h-[400px] w-full border border-border rounded-md p-3 bg-card">
          {isClient ? (
            <RealTimeMarketChartClient 
              data={chartType === 'candle' || chartType === 'bar' ? candlestickData : chartData}
              chartType={chartType}
              colors={chartColors}
              height={400}
            />
          ) : (
            <ChartPlaceholder />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMarketChart; 