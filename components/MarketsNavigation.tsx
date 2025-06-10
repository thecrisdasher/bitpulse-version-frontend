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
  MarketInstrument
} from "@/lib/mockData";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import axios from "axios";
import useBinanceTickers from '@/hooks/useBinanceTickers';
import { toast } from "sonner";

// Importar RealTimeMarketChart con SSR desactivado
const RealTimeMarketChart = dynamic(
  () => import("./RealTimeMarketChart"), 
  { ssr: false }
);

// Dynamically import trade panel for client only
const TradeControlPanel = dynamic(() => import("@/components/TradeControlPanel"), { ssr: false });

// Helper function for consistent number formatting
const formatCurrency = (value?: number, minimumFractionDigits = 2, maximumFractionDigits = 4): string => {
  // Guard against undefined or null values
  if (value == null || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits: value < 1 ? maximumFractionDigits : minimumFractionDigits
  });
};

// Navigation Item Type
type MarketCategoryInfo = {
  id: string;
  label: string;
  icon: React.ReactNode;
  expanded?: boolean;
  subcategories?: { id: string; label: string }[];
};

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

// Market Navigation Component
interface MarketsNavigationProps {
  onInstrumentSelect?: (instrument: MarketInstrument) => void;
}

const MarketsNavigation = ({ onInstrumentSelect }: MarketsNavigationProps = {}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("favoritos");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["derivados"]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument | null>(null);
  const [selectedMarketForChart, setSelectedMarketForChart] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, MarketCategoryInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use Binance tickers for crypto instruments to override prices
  const cryptoSymbols = instruments
    .filter(inst => inst.category === 'criptomonedas')
    .map(inst => inst.symbol.split('/')[0]);
  const binanceTickers = useBinanceTickers(cryptoSymbols);

  // Derive display list with real Binance data for cryptos
  const displayInstruments = instruments.map(inst => {
    if (inst.category === 'criptomonedas') {
      // Use base symbol for ticker lookup
      const base = inst.symbol.split('/')[0];
      const ticker = binanceTickers[base];
      return {
        ...inst,
        price: ticker?.price ?? inst.price,
        change24h: ticker?.change24h ?? inst.change24h
      };
    }
    return inst;
  });
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/market/categories');
        if (response.data.success) {
          // Map API categories object into an array
          const categoriesObj = response.data.categories || {};
          const categoriesList = Object.values(categoriesObj);
          const fetchedCategories = categoriesList.reduce((acc: Record<string, MarketCategoryInfo>, category: any) => {
            acc[category.id] = {
              ...category,
              icon: ICON_MAP[category.icon] || <Activity className="w-5 h-5" />,
            };
            return acc;
          }, {});
          setCategories(fetchedCategories);
        } else {
          throw new Error(response.data.message || 'Error al cargar categorías');
        }
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar las categorías.');
        toast.error("Error", { description: "No se pudieron cargar las categorías del mercado." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);
  
  useEffect(() => {
    const fetchInstruments = async (category: string) => {
      if (!category) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const url = category === 'favoritos' ? '/api/market/favorites' : `/api/market/${category}`;
        const response = await axios.get(url);
        
        if (response.data.success) {
          const instrumentsData = response.data.data || [];
          // set raw instruments; displayInstruments applies live data
          setInstruments(instrumentsData);
          // Clear any previous selection so chart only shows when user clicks an instrument
          setSelectedMarketForChart(null);
          setSelectedInstrument(null);
        } else {
          setInstruments([]);
          throw new Error(response.data.message || `Error al cargar instrumentos para ${category}`);
        }
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los instrumentos.');
        setInstruments([]);
        toast.error("Error", { description: `No se pudieron cargar los datos para ${category}.` });
      } finally {
        setIsLoading(false);
      }
    };

    if (Object.keys(categories).length > 0) {
       fetchInstruments(selectedCategory);
    }
  }, [selectedCategory, categories]);
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };
  
  const handleSubcategoryClick = (category: string) => {
    setSelectedCategory(category);
  };
  
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleInstrumentClick = (instrument: MarketInstrument) => {
    setSelectedInstrument(instrument);
    setSelectedMarketForChart(instrument.id);
    onInstrumentSelect?.(instrument);
  };
  
  const handleToggleFavorite = async (e: React.MouseEvent, instrument: MarketInstrument) => {
    e.stopPropagation();
    
    const isFavorite = instrument.isFavorite;
    
    setInstruments(prev => prev.map(inst => 
      inst.id === instrument.id ? { ...inst, isFavorite: !isFavorite } : inst
    ));
    
    try {
      const response = await axios.post('/api/market/favorites', {
        instrumentId: instrument.id,
        action: isFavorite ? 'remove' : 'add'
      });
      
      if (!response.data.success) {
        setInstruments(prev => prev.map(inst => 
          inst.id === instrument.id ? { ...inst, isFavorite } : inst
        ));
        toast.error("Error", { description: "No se pudo actualizar tus favoritos." });
      } else {
        toast.success(isFavorite ? "Eliminado de favoritos" : "Añadido a favoritos");
        if (selectedCategory === 'favoritos') {
           setInstruments(prev => prev.filter(i => i.id !== instrument.id));
        }
      }
    } catch (error) {
       setInstruments(prev => prev.map(inst => 
         inst.id === instrument.id ? { ...inst, isFavorite } : inst
       ));
       toast.error("Error", { description: "Ocurrió un error al gestionar favoritos." });
    }
  };
  
  // Filter on displayInstruments to include live Binance overrides
  const filteredInstruments = displayInstruments.filter(
    (instrument) =>
      instrument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instrument.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getSectionTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (categories[selectedCategory]) {
      return categories[selectedCategory].label;
    }
    for (const cat of Object.values(categories)) {
      if (cat.subcategories) {
        const subcat = cat.subcategories.find(sub => sub.id === selectedCategory);
        if (subcat) return subcat.label;
      }
    }
    return "Mercados";
  };
  
  const renderCategories = () => {
    const categoriesToRender = Object.values(categories);
    
    return (
      <div className="space-y-2">
        {categoriesToRender.map((category) => (
          <div key={category.id}>
            <button
              className={cn(
                "w-full flex items-center p-2 rounded-md text-sm font-medium transition-colors",
                selectedCategory === category.id && "bg-primary/10 text-primary",
                "hover:bg-muted/50"
              )}
              onClick={() => {
                if (category.subcategories && category.subcategories.length > 0) {
                 toggleCategoryExpansion(category.id);
                } else {
                 handleCategoryClick(category.id);
                }
              }}
            >
              <div className="mr-3">{category.icon}</div>
              <span className="flex-1 text-left">{category.label}</span>
              {category.subcategories && category.subcategories.length > 0 && (
                <span className="text-xs">
                 {expandedCategories.includes(category.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              )}
            </button>
            {category.subcategories && 
             expandedCategories.includes(category.id) && (
              <div className="ml-4 space-y-1 border-l pl-2 mt-1">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    className={cn(
                      "w-full flex items-center p-2 rounded-md text-sm font-medium transition-colors",
                      selectedCategory === subcategory.id && "bg-primary/10 text-primary",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                  >
                    <span className="ml-5 text-left">{subcategory.label}</span>
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
    <div className="flex h-full">
      {/* Columna de Navegación de Mercados */}
      <div className="w-64 border-r border-border p-3 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Mercados</h2>
        {isLoading && !Object.keys(categories).length ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          renderCategories()
        )}
      </div>

      {/* Contenido Principal (Gráfico y Lista de Instrumentos) */}
      <div className="flex-1 flex flex-col">
        {/* Gráfico en Tiempo Real */}
        <div className="border-b border-border p-2">
          {selectedMarketForChart ? (
            <RealTimeMarketChart 
              marketId={selectedMarketForChart} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Selecciona un instrumento para ver el gráfico
            </div>
          )}
        </div>
        {/* Operar: Trade panel appears before the market list */}
        {selectedInstrument && (
          <div className="border-b border-border p-4">
            <TradeControlPanel
              marketId={selectedInstrument.id}
              marketName={selectedInstrument.name}
              marketPrice={selectedInstrument.price}
              marketColor={selectedInstrument.color || ''}
              isVisible={true}
              onClose={() => {
                setSelectedInstrument(null);
                setSelectedMarketForChart(null);
              }}
            />
          </div>
        )}

        {/* Lista de Instrumentos */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{getSectionTitle()}</h3>
            <div className="relative w-full max-w-xs">
              <Input
                type="text"
                placeholder="Buscar instrumento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          {isLoading && !displayInstruments.length ? (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
               ))}
             </div>
          ) : filteredInstruments.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filteredInstruments.map((instrument) => {
                  const isPositiveChange = (instrument.change24h ?? 0) >= 0;
                  const instrumentIcon = getInstrumentIcon(instrument);
                  
                  return (
                    <Card
                      key={instrument.id}
                      className="p-3 flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleInstrumentClick(instrument)}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                        {instrumentIcon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{instrument.name}</div>
                        <div className="text-sm text-muted-foreground">{instrument.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(instrument.price)}</div>
                        <div className={cn(
                          "text-sm font-medium",
                          isPositiveChange
                            ? "text-green-500"
                            : "text-red-500"
                        )}>
                          {isPositiveChange ? "+" : ""}{(instrument.changePercent ?? 0).toFixed(2)}%
                        </div>
                      </div>
                      <button onClick={(e) => handleToggleFavorite(e, instrument)}>
                        <Star className={cn("w-5 h-5", instrument.isFavorite ? "text-yellow-400 fill-current" : "text-gray-400")} />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No se encontraron instrumentos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketsNavigation;