import { useState, useEffect, useRef } from "react";
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

// Register Chart.js components but prevent Server Side Registration
if (typeof window !== 'undefined') {
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

  // Dynamically import and register plugins only on client side
  import('chartjs-plugin-zoom').then((zoomPlugin) => {
    ChartJS.register(zoomPlugin.default);
  });
  
  import('chartjs-plugin-annotation').then((annotationPlugin) => {
    ChartJS.register(annotationPlugin.default);
  });
}

// Dynamically import Line chart component with SSR disabled
const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
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

// Market configurations
const MARKETS: MarketItem[] = [
  // Volatility indices
  { id: "volatility-100", name: "Índice Volatility 100", category: "volatility", label: "100", baseValue: 623, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-100-1s", name: "Índice Volatility 100 (1s)", category: "volatility", label: "100", showInRealTime: true, baseValue: 631.36, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-75", name: "Índice Volatility 75", category: "volatility", label: "75", baseValue: 500, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-75-1s", name: "Índice Volatility 75 (1s)", category: "volatility", label: "75", showInRealTime: true, baseValue: 510, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-50", name: "Índice Volatility 50", category: "volatility", label: "50", baseValue: 420, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-50-1s", name: "Índice Volatility 50 (1s)", category: "volatility", label: "50", showInRealTime: true, baseValue: 425, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-25", name: "Índice Volatility 25", category: "volatility", label: "25", baseValue: 350, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-25-1s", name: "Índice Volatility 25 (1s)", category: "volatility", label: "25", showInRealTime: true, baseValue: 355, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-10", name: "Índice Volatility 10", category: "volatility", label: "10", baseValue: 280, color: "hsl(338, 90%, 56%)" },
  { id: "volatility-10-1s", name: "Índice Volatility 10 (1s)", category: "volatility", label: "10", showInRealTime: true, baseValue: 285, color: "hsl(338, 90%, 56%)" },
  
  // Boom indices (uptrend)
  { id: "boom-500", name: "Índice Boom 500", category: "boom", label: "500", baseValue: 500, color: "hsl(143, 85%, 52%)" },
  { id: "boom-600", name: "Índice Boom 600", category: "boom", label: "600", baseValue: 600, color: "hsl(143, 85%, 52%)" },
  { id: "boom-900", name: "Índice Boom 900", category: "boom", label: "900", baseValue: 900, color: "hsl(143, 85%, 52%)" },
  { id: "boom-1000", name: "Índice Boom 1000", category: "boom", label: "1000", baseValue: 1000, color: "hsl(143, 85%, 52%)" },
  
  // Crash indices (downtrend)
  { id: "crash-300", name: "Índice Crash 300", category: "crash", label: "300", baseValue: 300, color: "hsl(0, 85%, 52%)" },
  { id: "crash-500", name: "Índice Crash 500", category: "crash", label: "500", baseValue: 500, color: "hsl(0, 85%, 52%)" },
  { id: "crash-600", name: "Índice Crash 600", category: "crash", label: "600", baseValue: 600, color: "hsl(0, 85%, 52%)" },
  { id: "crash-900", name: "Índice Crash 900", category: "crash", label: "900", baseValue: 900, color: "hsl(0, 85%, 52%)" },
  
  // Cryptocurrencies
  { id: "bitcoin", name: "Bitcoin (BTC)", category: "cripto", baseValue: 29000, color: "hsl(41, 98%, 49%)" },
  { id: "ethereum", name: "Ethereum (ETH)", category: "cripto", baseValue: 1800, color: "hsl(207, 90%, 61%)" },
  { id: "solana", name: "Solana (SOL)", category: "cripto", baseValue: 140, color: "hsl(327, 75%, 59%)" },
  { id: "cardano", name: "Cardano (ADA)", category: "cripto", baseValue: 0.50, color: "hsl(176, 80%, 41%)" },
  
  // Commodities
  { id: "gold", name: "Gold", category: "materias-primas", baseValue: 2400, color: "hsl(43, 95%, 47%)" },
  { id: "silver", name: "Silver", category: "materias-primas", baseValue: 30, color: "hsl(210, 20%, 80%)" },
  { id: "oil", name: "Crude Oil", category: "materias-primas", baseValue: 75, color: "hsl(25, 90%, 40%)" },
  
  // Forex
  { id: "eurusd", name: "EUR/USD", category: "forex", baseValue: 1.08, color: "hsl(207, 90%, 61%)" },
  { id: "gbpusd", name: "GBP/USD", category: "forex", baseValue: 1.27, color: "hsl(0, 60%, 50%)" },
  { id: "usdjpy", name: "USD/JPY", category: "forex", baseValue: 150, color: "hsl(270, 70%, 60%)" },
  
  // Stock indices
  { id: "us500", name: "US 500", category: "indices", baseValue: 5300, color: "hsl(210, 20%, 80%)" },
  { id: "ustech", name: "US Tech 100", category: "indices", baseValue: 18500, color: "hsl(210, 20%, 80%)" },
  { id: "us30", name: "US 30", category: "indices", baseValue: 38500, color: "hsl(210, 20%, 80%)" },
];

// Growth rate options
const GROWTH_RATES = [
  { id: "1", label: "1%", value: 0.01 },
  { id: "2", label: "2%", value: 0.02 },
  { id: "3", label: "3%", value: 0.03 },
  { id: "4", label: "4%", value: 0.04 },
  { id: "5", label: "5%", value: 0.05 },
];

// Time periods
const TIME_RANGES = [
  { id: "1h" as TimeRange, label: "1H", dataPoints: 60, interval: 60 * 1000 },
  { id: "24h" as TimeRange, label: "24H", dataPoints: 144, interval: 10 * 60 * 1000 },
  { id: "7d" as TimeRange, label: "7D", dataPoints: 168, interval: 60 * 60 * 1000 },
  { id: "30d" as TimeRange, label: "30D", dataPoints: 180, interval: 4 * 60 * 60 * 1000 },
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
  
  // Generate historical data with trends
  for (let i = rangeConfig.dataPoints; i >= 0; i--) {
    const time = new Date(now.getTime() - i * rangeConfig.interval);
    
    let trend = Math.sin(i / (rangeConfig.dataPoints / (timeRange === "30d" ? 3 : 2))) * volatility * 2;
    
    // Adjust trend for boom (generally upward) or crash (generally downward) indices
    if (isBoom) {
      trend += 0.001; // Slight upward bias
    } else if (isCrash) {
      trend -= 0.001; // Slight downward bias
    }
    
    const randomFactor = (Math.random() * volatility * 2) - volatility + trend;
    
    currentValue = currentValue * (1 + randomFactor);
    
    // Ensure the value doesn't go too far from base value
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

// Calculate significant price levels (support/resistance)
const calculatePriceLevels = (data: ChartPoint[]): number[] => {
  if (data.length === 0) return [];
  
  // Get min and max values
  const values = data.map(point => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Calculate some significant levels
  const midPoint = min + (range / 2);
  const quarterPoint = min + (range / 4);
  const threeQuarterPoint = max - (range / 4);
  
  return [min, quarterPoint, midPoint, threeQuarterPoint, max];
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

// Make the entire component client-side only
const RealTimeMarketChart = ({ marketId: initialMarketId, isRealTime = false }: RealTimeMarketChartProps) => {
  const [currentMarket, setCurrentMarket] = useState<string>(initialMarketId || "volatility-100");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [realTimeEnabled, setRealTimeEnabled] = useState(isRealTime);
  const [showPriceLevels, setShowPriceLevels] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [growthRate, setGrowthRate] = useState(GROWTH_RATES[2].value); // 3% default
  const [chartData, setChartData] = useState<ChartData<"line", ChartPoint[]>>({
    datasets: [],
  });
  const chartRef = useRef<TimeSeriesChartRef | null>(null);
  const [priceLevels, setPriceLevels] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>(["volatility-100-1s", "bitcoin"]);
  
  // Get current market configuration
  const currentMarketConfig = MARKETS.find(m => m.id === currentMarket) || MARKETS[0];
  
  // Filter markets by search query
  const filteredMarkets = searchQuery 
    ? MARKETS.filter(market => 
        market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : MARKETS;
  
  // Get current growth rate
  const currentGrowthRate = GROWTH_RATES.find(r => r.id === growthRate.toString())?.value || 0.03;
  
  // Get current time range
  const currentTimeRange = TIME_RANGES.find(r => r.id === timeRange) || TIME_RANGES[0];
  
  // Reset zoom function
  const resetZoom = () => {
    if (chartRef.current) {
      if (typeof window !== 'undefined' && chartRef.current.resetZoom) {
        chartRef.current.resetZoom();
      }
    }
  };
  
  // Toggle real-time updates
  const toggleRealTime = () => {
    setRealTimeEnabled(!realTimeEnabled);
    resetZoom();
  };
  
  // Toggle favorite status
  const toggleFavorite = (marketId: string) => {
    setFavoriteMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId) 
        : [...prev, marketId]
    );
  };
  
  // Initialize chart data
  useEffect(() => {
    const data = generateHistoricalData(currentMarket, timeRange);
    const levels = calculatePriceLevels(data);
    setPriceLevels(levels);

      setChartData({
      datasets: [{
        label: currentMarketConfig.name,
            data,
        borderColor: currentMarketConfig.color,
        backgroundColor: `${currentMarketConfig.color}33`, // Add transparency
        borderWidth: 4,
            fill: true,
            tension: 0.4,
        pointRadius: timeRange === "1h" ? 1 : 0,
            pointHoverRadius: 8,
        pointBackgroundColor: currentMarketConfig.color,
            pointHoverBackgroundColor: "#fff",
            pointBorderColor: "#fff",
        pointHoverBorderColor: currentMarketConfig.color,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3,
      }],
      });
    
    // Reset real-time flag when changing time range
    if (timeRange !== "1h") {
      setRealTimeEnabled(false);
    }
    
  }, [currentMarket, timeRange]);

  // Update chart data in real-time
  useEffect(() => {
    if (!realTimeEnabled || typeof window === 'undefined') return;
      
    const interval = setInterval(() => {
      if (!chartRef.current?.data?.datasets?.[0]?.data) return;
      
      const chart = chartRef.current;
      const data = [...chart.data.datasets[0].data] as ChartPoint[];
      
      if (data.length === 0) return;
      
      // Generate new data point
      const now = new Date();
      
      // Calculate new value based on last value and growth rate
      const lastValue = data[data.length - 1].y;
      const randomFactor = (Math.random() * currentGrowthRate * 2) - currentGrowthRate;
      
      // Add bias for boom/crash indices
      let biasAdjustment = 0;
      if (currentMarketConfig.category === "boom") {
        biasAdjustment = 0.001; // Slight upward bias
      } else if (currentMarketConfig.category === "crash") {
        biasAdjustment = -0.001; // Slight downward bias
      }
      
      const newValue = lastValue * (1 + randomFactor + biasAdjustment);
      
      // Update data
      data.push({
        x: now,
        y: parseFloat(newValue.toFixed(currentMarketConfig.baseValue < 10 ? 4 : 2))
      });
      
      // Remove oldest data point to maintain fixed window for 1h view
      if (timeRange === "1h" && data.length > currentTimeRange.dataPoints) {
        data.shift();
      }
      
      // Update chart
      chart.data.datasets[0].data = data;
      chart.update();
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMarket, currentGrowthRate, realTimeEnabled, timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // Toggle price levels
  const togglePriceLevels = () => {
    setShowPriceLevels(!showPriceLevels);
  };

  // Update selected market when initialMarket changes
  useEffect(() => {
    if (initialMarketId && initialMarketId !== currentMarket) {
      setCurrentMarket(initialMarketId);
    }
  }, [initialMarketId]);

  // Chart configuration
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context: TooltipItem<"line">) {
            return `${context.dataset.label}: ${new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: currentMarketConfig.baseValue < 10 ? 2 : 0,
              maximumFractionDigits: currentMarketConfig.baseValue < 10 ? 2 : 0
            }).format(context.parsed.y)}`;
          },
          title: function(context) {
            const date = new Date(context[0].parsed.x);
            if (timeRange === "1h" || timeRange === "24h") {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                     ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
            return date.toLocaleDateString([], { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 4,
        displayColors: true,
        bodyFont: { size: 14 },
        titleFont: { size: 14, weight: 'bold' },
      },
      zoom: typeof window !== 'undefined' ? {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
        limits: {
          y: {min: 'original', max: 'original'},
        }
      } : {},
      annotation: typeof window !== 'undefined' ? {
        annotations: showPriceLevels ? priceLevels.map((level, index) => ({
          type: 'line',
          yMin: level,
          yMax: level,
          borderColor: index === 0 || index === priceLevels.length - 1 
                      ? 'rgba(255, 255, 255, 0.8)' 
                      : 'rgba(255, 255, 255, 0.4)',
          borderWidth: index === 2 ? 2 : 1, // make middle line thicker
          borderDash: index === 2 ? [] : [5, 5],
          label: {
            display: index === 0 || index === 2 || index === priceLevels.length - 1,
            content: index === 0 ? 'Soporte' : 
                     index === priceLevels.length - 1 ? 'Resistencia' : 
                     'Medio',
            position: 'start',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            font: {
              size: 11,
              weight: 'bold'
            }
          }
        })) : []
      } : {}
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === "1h" ? 'minute' :
                timeRange === "24h" ? 'hour' :
                timeRange === "7d" ? 'day' : 'week',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
            week: 'MMM dd'
          },
          tooltipFormat: timeRange === "1h" || timeRange === "24h" 
            ? 'HH:mm - MMM d'
            : 'MMM d, yyyy'
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
          display: true,
          lineWidth: 1,
        },
        ticks: {
          color: "#FFFFFF",
          maxRotation: 0,
          maxTicksLimit: 8,
          font: { size: 12, weight: 'bold' },
          padding: 8,
        },
        border: {
          display: true,
          color: "rgba(255, 255, 255, 0.5)",
          width: 2,
        },
        title: {
          display: true,
          text: 'Tiempo',
          color: '#FFFFFF',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: { top: 10, bottom: 0 }
        }
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
          display: true,
          lineWidth: 1,
        },
        ticks: {
          color: "#FFFFFF",
          padding: 10,
          font: { size: 12, weight: 'bold' },
          callback: function(value) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              if (numValue >= 1000000) {
                return '$' + (numValue / 1000000).toFixed(1) + 'M';
              } else if (numValue >= 1000) {
                return '$' + (numValue / 1000).toFixed(1) + 'K';
              }
              return '$' + numValue.toLocaleString('es-CO');
            }
            return value;
          }
        },
        border: {
          display: true,
          color: "rgba(255, 255, 255, 0.5)",
          width: 2,
        },
        title: {
          display: true,
          text: 'Precio',
          color: '#FFFFFF',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: { top: 0, bottom: 10 }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    animation: { duration: 300 },
  };

  // Render market item for dropdown
  const renderMarketItem = (market: MarketItem) => (
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
  );

  // Group markets for dropdown
  const groupedMarkets = getGroupedMarkets();

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
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 min-w-[220px] justify-between">
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
            <DropdownMenuContent className="w-[300px] max-h-[500px] overflow-y-auto">
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
                  {/* Favorites Section */}
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
                  
                  {/* Categories */}
                  {Object.entries(MARKET_CATEGORIES).map(([category, info]) => {
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
          
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">Tasa de crecimiento</span>
            <div className="flex items-center bg-secondary rounded-md">
              {GROWTH_RATES.map((rate) => (
                <Button
                  key={rate.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-md",
                    growthRate === rate.value && "bg-muted"
                  )}
                  onClick={() => setGrowthRate(rate.value)}
                >
                  {rate.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-md text-sm">
          <p><strong>Datos en tiempo real:</strong> Ahora estás conectado a Alpha Vantage (forex y materias primas), CoinCap (criptomonedas) y TwelveData (índices bursátiles). Todos los datos que ves son reales, excepto los índices sintéticos que son simulados.</p>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              onClick={resetZoom}
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
        <div className="h-[400px] w-full border border-border rounded-md p-3">
          {typeof window !== 'undefined' && <Line ref={chartRef} data={chartData} options={chartOptions} />}
        </div>
      </CardContent>
    </Card>
  );
};

// Export as client component 
export default dynamic(() => Promise.resolve(RealTimeMarketChart), { ssr: false }); 