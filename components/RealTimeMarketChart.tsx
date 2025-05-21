"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
  TooltipItem,
  TimeScale,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import 'chartjs-adapter-date-fns';
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

// Implementar un registro condicional de Chart.js para evitar renderizados innecesarios
const registerChartComponents = () => {
  if (typeof window !== 'undefined' && !ChartJS.registry.controllers.get('line')) {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      TimeScale,
      Title,
      Tooltip,
      Legend,
      Filler
    );
  }
};

// Registrar plugins solo cuando sea necesario y solo una vez
let pluginsRegistered = false;
const registerPlugins = async () => {
  if (typeof window !== 'undefined' && !pluginsRegistered) {
    try {
      const [zoomPlugin, annotationPlugin] = await Promise.all([
        import('chartjs-plugin-zoom').then(mod => mod.default),
        import('chartjs-plugin-annotation').then(mod => mod.default)
      ]);
      
      ChartJS.register(zoomPlugin, annotationPlugin);
      pluginsRegistered = true;
    } catch (error) {
      console.error("Error loading chart plugins:", error);
    }
  }
};

// Iniciar registro de componentes
registerChartComponents();
// Registrar plugins de forma asíncrona sin bloquear
registerPlugins();

// Limitar la carga de Line con SSR desactivado
const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-muted/30 animate-pulse rounded-md flex items-center justify-center">Cargando gráfico...</div> }
);

// Types
type MarketCategory = "volatility" | "boom" | "crash" | "cripto" | "forex" | "materias-primas" | "indices";
type Market = string;
type TimeRange = "1h" | "24h" | "7d" | "30d";
type ChartPoint = { x: Date; y: number };
type TimeSeriesChartRef = ChartJS<"line", ChartPoint[]>;

// Component props
interface RealTimeMarketChartProps {
  marketId: string;
  isRealTime?: boolean;
}

// Define market categories
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

// Growth rate options
const GROWTH_RATES = [
  { id: "1", label: "1%", value: 0.01 },
  { id: "3", label: "3%", value: 0.03 },
  { id: "5", label: "5%", value: 0.05 },
];

// Time periods (reducidos para mejorar rendimiento)
const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H", dataPoints: 20, interval: 3 * 60 * 1000 }, 
  { id: "24h" as TimeRange, label: "24H", dataPoints: 24, interval: 60 * 60 * 1000 }, 
  { id: "7d" as TimeRange, label: "7D", dataPoints: 21, interval: 8 * 60 * 60 * 1000 }, 
  { id: "30d" as TimeRange, label: "30D", dataPoints: 15, interval: 48 * 60 * 60 * 1000 }, 
];

// Generate historical data
const generateHistoricalData = (marketId: Market, timeRange: TimeRange): ChartPoint[] => {
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
  
  // Generate historical data with trends (mejorado para rendimiento)
  const dataPoints = Math.min(rangeConfig.dataPoints, 30); 
  
  for (let i = dataPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * rangeConfig.interval);
    
    let trend = Math.sin(i / (dataPoints / (timeRange === "30d" ? 3 : 2))) * volatility * 2;
    
    // Ajuste de tendencia para índices boom/crash
    if (isBoom) {
      trend += 0.001;
    } else if (isCrash) {
      trend -= 0.001;
    }
    
    const randomFactor = (Math.random() * volatility * 2) - volatility + trend;
    
    currentValue = currentValue * (1 + randomFactor);
    
    // Asegurar que el valor no se aleje demasiado del valor base
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
const calculatePriceLevels = (data: ChartPoint[]): number[] => {
  if (data.length === 0) return [];
  
  // Get min and max values
  const values = data.map(point => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Calcular solo 3 niveles en lugar de 5 para mejorar rendimiento
  const midPoint = min + (range / 2);
  
  return [min, midPoint, max];
};

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

// Placeholder component mientras se carga el chart
const ChartPlaceholder = () => (
  <div className="w-full h-[400px] bg-muted/30 animate-pulse rounded-md flex flex-col items-center justify-center">
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

// Componente de interfaz de usuario del gráfico sin la implementación real de Chart.js
const RealTimeMarketChartUI = ({ marketId: initialMarketId, isRealTime = false }: RealTimeMarketChartProps) => {
  const [currentMarket, setCurrentMarket] = useState<string>(initialMarketId || "volatility-100");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [realTimeEnabled, setRealTimeEnabled] = useState(isRealTime);
  const [showPriceLevels, setShowPriceLevels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>(["volatility-100-1s", "bitcoin"]);
  
  // Usar useMemo para evitar recálculos costosos
  const currentMarketConfig = useMemo(() => 
    MARKETS.find(m => m.id === currentMarket) || MARKETS[0], 
    [currentMarket]
  );
  
  // Filtrar mercados por búsqueda (memoizado)
  const filteredMarkets = useMemo(() => 
    searchQuery 
      ? MARKETS.filter(market => 
          market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.id.toLowerCase().includes(searchQuery.toLowerCase()))
      : MARKETS, 
    [searchQuery]
  );
  
  // Toggle real-time updates (memoizado)
  const toggleRealTime = useCallback(() => {
    setRealTimeEnabled(prev => !prev);
  }, []);
  
  // Toggle favorite status (memoizado)
  const toggleFavorite = useCallback((marketId: string) => {
    setFavoriteMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId) 
        : [...prev, marketId]
    );
  }, []);
  
  // Manejar cambio de rango de tiempo (memoizado)
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  // Toggle price levels (memoizado)
  const togglePriceLevels = useCallback(() => {
    setShowPriceLevels(prev => !prev);
  }, []);

  // Actualizar mercado seleccionado cuando cambia initialMarketId
  useEffect(() => {
    if (initialMarketId && initialMarketId !== currentMarket) {
      setCurrentMarket(initialMarketId);
    }
  }, [initialMarketId, currentMarket]);

  // Renderizar item de mercado para el dropdown (memoizado)
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

  // Mercados agrupados para dropdown (memoizado)
  const groupedMarkets = useMemo(() => getGroupedMarkets(), []);

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
          <div className="flex items-center gap-2">
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
          <ChartPlaceholder />
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Chart real implementado completamente en el cliente
const RealTimeMarketChartWithData = dynamic(
  () => import('./RealTimeMarketChartClient').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <RealTimeMarketChartUI marketId="volatility-100" />
  }
);

export default RealTimeMarketChartWithData; 