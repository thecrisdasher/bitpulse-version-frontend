import { useState, useEffect } from "react";
import { 
  Star, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  ShoppingBasket, 
  LineChart, 
  BarChart2, 
  Bitcoin, 
  Gem,
  Activity,
  CandlestickChart,
  TrendingUp, 
  TrendingDown,
  BarChart,
  Landmark,
  CoinsIcon,
  CircleDollarSign,
  BadgeDollarSign,
  Currency,
  DollarSign,
  Banknote,
  Workflow,
  Waves,
  ArrowUpDown,
  AreaChart,
  Fuel,
  Gauge,
  Droplets,
  Globe,
  PercentIcon,
  Diamond,
  BarChart4
} from "lucide-react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MarketCategory,
  MarketInstrument
} from "@/lib/mockData";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import axios from "axios";
import useRealTimeMarketData, { useBatchRealTimeMarketData, useCleanupWebSockets } from "@/hooks/useRealTimeMarketData";

// Importar RealTimeMarketChart con SSR desactivado
const RealTimeMarketChart = dynamic(
  () => import("./RealTimeMarketChart"), 
  { ssr: false }
);

// Helper function for consistent number formatting
const formatCurrency = (value: number, minimumFractionDigits = 2, maximumFractionDigits = 4) => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits, 
    maximumFractionDigits: value < 1 ? maximumFractionDigits : minimumFractionDigits 
  });
};

// Navigation Item Type
type MarketCategoryInfo = {
  id: MarketCategory | string;
  label: string;
  icon: React.ReactNode;
  expanded?: boolean;
  subcategories?: { id: string; label: string }[];
};

// Estado inicial mientras carga la data
const INITIAL_MARKET_CATEGORIES: MarketCategoryInfo[] = [
  {
    id: "favoritos",
    label: "Favoritos",
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: "derivados",
    label: "Derivados",
    icon: <Workflow className="w-5 h-5" />,
    expanded: false,
    subcategories: [
      { id: "baskets", label: "Baskets" },
      { id: "sinteticos", label: "Sintéticos" },
    ],
  },
  {
    id: "forex",
    label: "Forex",
    icon: <CircleDollarSign className="w-5 h-5" />,
  },
  {
    id: "indices",
    label: "Índices Stock",
    icon: <BarChart className="w-5 h-5" />,
  },
  {
    id: "criptomonedas",
    label: "Criptomonedas",
    icon: <Bitcoin className="w-5 h-5" />,
  },
  {
    id: "materias-primas",
    label: "Materias primas",
    icon: <Gem className="w-5 h-5" />,
  },
];

// Mapa de íconos para renderizar dinámicamente
const ICON_MAP: Record<string, React.ReactNode> = {
  "star": <Star className="w-5 h-5" />,
  "dollar-sign": <CircleDollarSign className="w-5 h-5" />,
  "shopping-basket": <ShoppingBasket className="w-5 h-5" />,
  "line-chart": <LineChart className="w-5 h-5" />,
  "bar-chart": <BarChart className="w-5 h-5" />,
  "bitcoin": <Bitcoin className="w-5 h-5" />,
  "gem": <Gem className="w-5 h-5" />,
  "activity": <Activity className="w-5 h-5" />,
  "workflow": <Workflow className="w-5 h-5" />,
  "candlestick": <CandlestickChart className="w-5 h-5" />,
  "area-chart": <AreaChart className="w-5 h-5" />,
  "globe": <Globe className="w-5 h-5" />,
  "fuel": <Fuel className="w-5 h-5" />
};

// Mapa de íconos para instrumentos específicos
const getInstrumentIcon = (instrument: MarketInstrument): React.ReactNode => {
  // Por tipo de categoría
  if (instrument.category === "criptomonedas") {
    if (instrument.symbol.includes("BTC")) return <Bitcoin className="w-5 h-5 text-amber-500" />;
    if (instrument.symbol.includes("ETH")) return <Diamond className="w-5 h-5 text-blue-500" />;
    if (instrument.symbol.includes("XRP")) return <Waves className="w-5 h-5 text-blue-400" />;
    return <CoinsIcon className="w-5 h-5 text-amber-400" />;
  }
  
  if (instrument.category === "forex") {
    if (instrument.symbol.includes("USD")) return <CircleDollarSign className="w-5 h-5 text-green-500" />;
    if (instrument.symbol.includes("EUR")) return <Currency className="w-5 h-5 text-blue-500" />;
    if (instrument.symbol.includes("GBP")) return <BadgeDollarSign className="w-5 h-5 text-purple-500" />;
    if (instrument.symbol.includes("JPY")) return <Currency className="w-5 h-5 text-red-500" />;
    return <DollarSign className="w-5 h-5 text-emerald-500" />;
  }

  if (instrument.category === "indices") {
    if (instrument.name.toLowerCase().includes("nasdaq")) return <BarChart4 className="w-5 h-5 text-blue-500" />;
    if (instrument.name.toLowerCase().includes("dow")) return <BarChart2 className="w-5 h-5 text-blue-700" />;
    if (instrument.name.toLowerCase().includes("s&p")) return <CandlestickChart className="w-5 h-5 text-green-600" />;
    if (instrument.name.toLowerCase().includes("vix")) return <Gauge className="w-5 h-5 text-red-500" />;
    return <BarChart className="w-5 h-5 text-gray-600" />;
  }

  if (instrument.category === "materias-primas") {
    if (instrument.name.toLowerCase().includes("oro") || instrument.name.toLowerCase().includes("gold"))
      return <Gem className="w-5 h-5 text-amber-500" />;
    if (instrument.name.toLowerCase().includes("plata") || instrument.name.toLowerCase().includes("silver")) 
      return <Diamond className="w-5 h-5 text-slate-400" />;
    if (instrument.name.toLowerCase().includes("petrol") || instrument.name.toLowerCase().includes("oil"))
      return <Fuel className="w-5 h-5 text-black" />;
    if (instrument.name.toLowerCase().includes("gas"))
      return <Droplets className="w-5 h-5 text-blue-500" />;
    return <Gem className="w-5 h-5 text-teal-600" />;
  }

  // Para derivados y sintéticos
  if (instrument.category === "derivados" || instrument.category === "sinteticos" || instrument.category === "baskets") {
    if (instrument.name.toLowerCase().includes("volatility"))
      return <PercentIcon className="w-5 h-5 text-pink-600" />;
    if (instrument.name.toLowerCase().includes("boom"))
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (instrument.name.toLowerCase().includes("crash"))
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    if (instrument.name.toLowerCase().includes("synthetic"))
      return <AreaChart className="w-5 h-5 text-indigo-500" />;
    return <Workflow className="w-5 h-5 text-indigo-500" />;
  }

  // Default icon
  return <Activity className="w-5 h-5 text-gray-500" />;
};

// Función para obtener un color gradient para los cards de instrumentos
const getInstrumentCardStyle = (instrument: MarketInstrument) => {
  if (instrument.category === "criptomonedas") {
    if (instrument.symbol.includes("BTC")) 
      return "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10";
    if (instrument.symbol.includes("ETH")) 
      return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10";
    return "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/20 dark:to-yellow-900/10";
  }
  
  if (instrument.category === "forex") {
    return "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/20 dark:to-green-900/10";
  }

  if (instrument.category === "indices") {
    return "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/20 dark:to-slate-900/10";
  }

  if (instrument.category === "materias-primas") {
    if (instrument.name.toLowerCase().includes("oro") || instrument.name.toLowerCase().includes("gold"))
      return "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/20 dark:to-yellow-900/10";
    if (instrument.name.toLowerCase().includes("plata") || instrument.name.toLowerCase().includes("silver")) 
      return "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/20 dark:to-slate-900/10";
    if (instrument.name.toLowerCase().includes("petrol") || instrument.name.toLowerCase().includes("oil"))
      return "bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-950/20 dark:to-blue-900/10";
    return "bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-950/20 dark:to-emerald-900/10";
  }

  // Para derivados y sintéticos
  if (instrument.category === "derivados" || instrument.category === "sinteticos" || instrument.category === "baskets") {
    if (instrument.name.toLowerCase().includes("volatility"))
      return "bg-gradient-to-br from-pink-50 to-purple-100 dark:from-pink-950/20 dark:to-purple-900/10";
    if (instrument.name.toLowerCase().includes("boom"))
      return "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/10";
    if (instrument.name.toLowerCase().includes("crash"))
      return "bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/20 dark:to-orange-900/10";
    return "bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-950/20 dark:to-violet-900/10";
  }

  return "bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950/20 dark:to-gray-900/10";
};

// Market Navigation Component
interface MarketsNavigationProps {
  onInstrumentSelect?: (instrument: MarketInstrument) => void;
}

const MarketsNavigation = ({ onInstrumentSelect }: MarketsNavigationProps = {}) => {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | string>("favoritos");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["derivados"]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument | null>(null);
  const [selectedMarketForChart, setSelectedMarketForChart] = useState<string>("volatility-100");
  const [categories, setCategories] = useState<Record<string, MarketCategoryInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instrumentsToTrack, setInstrumentsToTrack] = useState<Array<{symbol: string, category: string}>>([]);
  
  // Limpiar WebSockets al desmontar el componente
  useCleanupWebSockets();
  
  // Usar hook para obtener datos en tiempo real para todos los instrumentos visibles
  const { data: realTimeData } = useBatchRealTimeMarketData(instrumentsToTrack, {
    refreshInterval: 5000,
    initialFetch: false // No hacer fetch inicialmente, esperar a tener instrumentos
  });
  
  // Cargar categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/market/categories');
        setCategories(response.data.categories);
        setIsLoading(false);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setError("No se pudieron cargar las categorías de mercado");
        setIsLoading(false);
        
        // Si falla, usar categorías iniciales
        const categoriesMap: Record<string, MarketCategoryInfo> = {};
        INITIAL_MARKET_CATEGORIES.forEach(cat => {
          categoriesMap[cat.id] = cat;
        });
        setCategories(categoriesMap);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Cargar favoritos inicialmente
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('/api/market/favorites');
        setInstruments(response.data.favorites);
        
        // Configurar instrumentos para seguimiento en tiempo real
        const trackedInstruments = response.data.favorites.map((inst: MarketInstrument) => ({
          symbol: inst.symbol,
          category: inst.category
        }));
        setInstrumentsToTrack(trackedInstruments);
      } catch (err) {
        console.error("Error al cargar favoritos:", err);
      }
    };
    
    fetchFavorites();
  }, []);
  
  // Actualizar datos en tiempo real cuando estén disponibles
  useEffect(() => {
    if (realTimeData && Object.keys(realTimeData).length > 0) {
      setInstruments(prevInstruments => {
        return prevInstruments.map(inst => {
          const realTimeInfo = realTimeData[inst.symbol];
          if (realTimeInfo) {
            return {
              ...inst,
              price: realTimeInfo.currentPrice,
              change24h: realTimeInfo.changePercent24h,
              lastUpdated: new Date(realTimeInfo.lastUpdated),
              hasRealTime: realTimeInfo.isRealTime
            };
          }
          return {
            ...inst,
            // Proporcionar valores por defecto para instrumentos sin datos en tiempo real
            price: inst.price || 0,
            change24h: inst.change24h || 0,
            lastUpdated: inst.lastUpdated || new Date(),
            hasRealTime: false
          };
        });
      });
    }
  }, [realTimeData]);
  
  // Handle category selection
  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    
    try {
      let response;
      
      if (category === "favoritos") {
        response = await axios.get('/api/market/favorites');
        setInstruments(response.data.favorites);
      } else {
        response = await axios.get(`/api/market/categories/${category}`);
        setInstruments(response.data.instruments);
      }
      
      // Configurar instrumentos para seguimiento en tiempo real
      const trackedInstruments = response.data.favorites || response.data.instruments;
      setInstrumentsToTrack(
        trackedInstruments.map((inst: MarketInstrument) => ({
          symbol: inst.symbol,
          category: inst.category
        }))
      );
    } catch (err) {
      console.error(`Error al cargar instrumentos para ${category}:`, err);
      setInstruments([]);
    }
  };
  
  // Handle subcategory selection
  const handleSubcategoryClick = async (category: string) => {
    setSelectedCategory(category);
    
    try {
      const response = await axios.get(`/api/market/categories/${category}`);
      setInstruments(response.data.instruments);
      
      // Configurar instrumentos para seguimiento en tiempo real
      const trackedInstruments = response.data.instruments;
      setInstrumentsToTrack(
        trackedInstruments.map((inst: MarketInstrument) => ({
          symbol: inst.symbol,
          category: inst.category
        }))
      );
    } catch (err) {
      console.error(`Error al cargar instrumentos para ${category}:`, err);
      setInstruments([]);
    }
  };
  
  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };
  
  // Handle instrument selection
  const handleInstrumentClick = (instrument: MarketInstrument) => {
    setSelectedInstrument(instrument);
    
    // Map instrument to compatible market type for RealTimeMarketChart
    let marketId = "volatility-100"; // Default
    
    // Intentar hacer un mapeo más preciso según categoría e ID
    if (instrument.id.includes("volatility")) {
      marketId = instrument.id;
    } else if (instrument.id.includes("boom")) {
      marketId = instrument.id;
    } else if (instrument.id.includes("crash")) {
      marketId = instrument.id;
    } else if (instrument.id.includes("btc") || instrument.symbol.includes("BTC")) {
      marketId = "bitcoin";
    } else if (instrument.id.includes("eth") || instrument.symbol.includes("ETH")) {
      marketId = "ethereum";
    } else if (instrument.id === "gold" || instrument.symbol.includes("XAU")) {
      marketId = "gold";
    } else if (instrument.id === "silver" || instrument.symbol.includes("XAG")) {
      marketId = "silver";
    } else if (instrument.id === "oil" || instrument.symbol.includes("OIL")) {
      marketId = "oil";
    } else if (instrument.category === "forex") {
      marketId = instrument.id;
    } else if (instrument.category === "indices") {
      marketId = instrument.id;
    }
    
    setSelectedMarketForChart(marketId);

    // Call parent component handler if provided
    if (onInstrumentSelect) {
      onInstrumentSelect(instrument);
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async (e: React.MouseEvent, instrument: MarketInstrument) => {
    e.stopPropagation();
    
    try {
      await axios.post('/api/market/favorites', { instrumentId: instrument.id });
      
      // Actualizar la UI optimísticamente
      const updatedInstrument = { ...instrument, isFavorite: !instrument.isFavorite };
      
      // Si estamos en favoritos, actualizar la lista completa
      if (selectedCategory === "favoritos") {
        const response = await axios.get('/api/market/favorites');
        setInstruments(response.data.favorites);
      } else {
        // En otras categorías, solo actualizar el instrumento específico
        setInstruments(instruments.map(i => 
          i.id === instrument.id ? updatedInstrument : i
        ));
      }
      
    } catch (err) {
      console.error("Error al cambiar favorito:", err);
    }
  };
  
  // Búsqueda de instrumentos
  const searchInstruments = async () => {
    if (!searchQuery.trim()) {
      handleCategoryClick(selectedCategory);
      return;
    }
    
    try {
      const response = await axios.get(`/api/market/search?query=${encodeURIComponent(searchQuery)}`);
      setInstruments(response.data.instruments);
      
      // Configurar instrumentos para seguimiento en tiempo real
      const trackedInstruments = response.data.instruments;
      setInstrumentsToTrack(
        trackedInstruments.map((inst: MarketInstrument) => ({
          symbol: inst.symbol,
          category: inst.category
        }))
      );
    } catch (err) {
      console.error("Error al buscar instrumentos:", err);
      setInstruments([]);
    }
  };
  
  // Obtener título de sección
  const getSectionTitle = () => {
    if (searchQuery.trim()) {
      return `Resultados para "${searchQuery}"`;
    }
    
    if (selectedCategory === "favoritos") {
      return "Instrumentos favoritos";
    }
    
    // Buscar en categorías
    for (const catKey in categories) {
      if (catKey === selectedCategory) {
        return categories[catKey].label;
      }
      
      // Buscar en subcategorías
      const cat = categories[catKey];
      if (cat.subcategories) {
        const subcat = cat.subcategories.find(sc => sc.id === selectedCategory);
        if (subcat) {
          return subcat.label;
        }
      }
    }
    
    // Si no se encuentra, buscar en las categorías iniciales
    for (const cat of INITIAL_MARKET_CATEGORIES) {
      if (cat.id === selectedCategory) {
        return cat.label;
      }
      
      // Buscar en subcategorías
      if (cat.subcategories) {
        const subcat = cat.subcategories.find(sc => sc.id === selectedCategory);
        if (subcat) {
          return subcat.label;
        }
      }
    }
    
    return "Instrumentos";
  };
  
  // Renderizar categorías
  const renderCategories = () => {
    // Usar categorías cargadas desde API o categorías iniciales como fallback
    const categoriesToRender = Object.keys(categories).length > 0 
      ? Object.values(categories) 
      : INITIAL_MARKET_CATEGORIES;
    
    return (
      <div className="space-y-1">
        {categoriesToRender.map((category) => (
          <div key={category.id} className="space-y-1">
            <button
              onClick={() => {
                if (category.subcategories && category.subcategories.length > 0) {
                  toggleCategoryExpansion(category.id as string);
                } else {
                  handleCategoryClick(category.id as string);
                }
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent",
                selectedCategory === category.id && "bg-accent"
              )}
            >
              <div className="flex items-center">
                <span className="mr-2 text-muted-foreground">{category.icon}</span>
                <span>{category.label}</span>
              </div>
              {category.subcategories && category.subcategories.length > 0 && (
                <span className="text-xs">
                  {expandedCategories.includes(category.id as string) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              )}
            </button>
            
            {/* Subcategorías */}
            {category.subcategories && 
             expandedCategories.includes(category.id as string) && (
              <div className="ml-4 space-y-1 border-l pl-2">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent",
                      selectedCategory === subcategory.id && "bg-accent"
                    )}
                  >
                    {subcategory.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Buscar mercados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchInstruments()}
            className="flex-1"
          />
          <button
            onClick={searchInstruments}
            className="p-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Menú de categorías */}
          <Card className="h-[calc(100vh-220px)] overflow-y-auto">
            <CardContent className="p-3">
              <h3 className="text-sm font-medium mb-3">Mercados</h3>
              {renderCategories()}
            </CardContent>
          </Card>
          
          {/* Lista de instrumentos */}
          <Card className="h-[calc(100vh-220px)]">
            <CardContent className="p-3 h-full flex flex-col">
              <h3 className="text-sm font-medium mb-3">{getSectionTitle()}</h3>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Cargando mercados...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-destructive">{error}</p>
                  <button 
                    onClick={() => handleCategoryClick(selectedCategory)}
                    className="mt-2 text-sm text-primary"
                  >
                    Reintentar
                  </button>
                </div>
              ) : instruments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery.trim() 
                      ? `No hay resultados para "${searchQuery}"` 
                      : "No hay instrumentos disponibles en esta categoría"}
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {instruments.map((instrument) => {
                      const isPositiveChange = instrument.change24h >= 0;
                      const instrumentIcon = getInstrumentIcon(instrument);
                      const cardStyleClass = getInstrumentCardStyle(instrument);
                      
                      return (
                        <div
                          key={instrument.id}
                          onClick={() => handleInstrumentClick(instrument)}
                          className={cn(
                            "border rounded-lg p-3 flex flex-col hover:bg-accent/50 cursor-pointer transition-colors shadow-sm",
                            cardStyleClass
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2 items-center">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/40 dark:bg-black/10 shadow-sm">
                                {instrumentIcon}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-1.5">
                                  {instrument.name}
                                  {instrument.hasRealTime && (
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                      <span className="relative flex h-1.5 w-1.5 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                      </span>
                                      RT
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {instrument.symbol}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleToggleFavorite(e, instrument)}
                              className={`p-1 rounded-full hover:bg-white/30 dark:hover:bg-white/10 ${
                                instrument.isFavorite ? "text-yellow-500" : "text-muted-foreground"
                              }`}
                            >
                              <Star className="h-5 w-5" fill={instrument.isFavorite ? "currentColor" : "none"} />
                            </button>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-end">
                            <div className="text-xl font-semibold">
                              {formatCurrency(instrument.price)}
                            </div>
                            <div className={cn(
                              "text-sm font-medium rounded-full px-2 py-0.5",
                              isPositiveChange 
                                ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                                : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              {isPositiveChange ? "+" : ""}{instrument.change24h.toFixed(2)}%
                            </div>
                          </div>
                          
                          {/* Última actualización */}
                          {instrument.lastUpdated && (
                            <div className="mt-1 text-xs text-muted-foreground flex items-center">
                              <span className="mr-1">Actualizado:</span>
                              <span className="text-xs font-medium">{new Date(instrument.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Gráfico en tiempo real */}
      {selectedInstrument && (
        <div className="flex-1 p-4 bg-card rounded-lg m-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/80 dark:bg-white/10 shadow-sm">
                {getInstrumentIcon(selectedInstrument)}
              </div>
              <div>
                {selectedInstrument.name}
                <span className="text-sm text-muted-foreground ml-2">
                  ({selectedInstrument.symbol})
                </span>
              </div>
              {selectedInstrument.hasRealTime && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30">
                  <span className="relative flex h-1.5 w-1.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Tiempo real
                </span>
              )}
            </h3>
            <div className={cn(
              "text-sm font-medium rounded-full px-2 py-1",
              selectedInstrument.change24h >= 0 
                ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {selectedInstrument.change24h >= 0 ? "+" : ""}
              {selectedInstrument.change24h.toFixed(2)}%
            </div>
          </div>
          
          <div className="h-full rounded-lg overflow-hidden">
            <RealTimeMarketChart 
              marketId={selectedMarketForChart}
              isRealTime={selectedInstrument.hasRealTime}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketsNavigation;