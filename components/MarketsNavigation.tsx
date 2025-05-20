import { useState, useEffect } from "react";
import { 
  Star, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  DollarSign, 
  ShoppingBasket, 
  LineChart, 
  BarChart2, 
  Bitcoin, 
  Gem,
  Activity
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

// Importar RealTimeMarketChart con SSR desactivado
const RealTimeMarketChart = dynamic(
  () => import("./RealTimeMarketChart"), 
  { ssr: false }
);

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
    icon: <LineChart className="w-5 h-5" />,
    expanded: false,
    subcategories: [
      { id: "baskets", label: "Baskets" },
      { id: "sinteticos", label: "Sintéticos" },
    ],
  },
  {
    id: "forex",
    label: "Forex",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: "indices",
    label: "Índices Stock",
    icon: <BarChart2 className="w-5 h-5" />,
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
  "dollar-sign": <DollarSign className="w-5 h-5" />,
  "shopping-basket": <ShoppingBasket className="w-5 h-5" />,
  "line-chart": <LineChart className="w-5 h-5" />,
  "bar-chart-2": <BarChart2 className="w-5 h-5" />,
  "bitcoin": <Bitcoin className="w-5 h-5" />,
  "gem": <Gem className="w-5 h-5" />,
  "activity": <Activity className="w-5 h-5" />
};

// Market Navigation Component
const MarketsNavigation = () => {
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | string>("favoritos");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["derivados"]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument | null>(null);
  const [selectedMarketForChart, setSelectedMarketForChart] = useState<string>("volatility-100");
  const [categories, setCategories] = useState<Record<string, MarketCategoryInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      } catch (err) {
        console.error("Error al cargar favoritos:", err);
      }
    };
    
    fetchFavorites();
  }, []);
  
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
      
      // Si el instrumento seleccionado es el que cambiamos, actualizarlo también
      if (selectedInstrument?.id === instrument.id) {
        setSelectedInstrument(updatedInstrument);
      }
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
    }
  };
  
  // Búsqueda de instrumentos
  useEffect(() => {
    const searchInstruments = async () => {
      if (searchQuery.trim().length < 2) {
        // Si la búsqueda está vacía, mostrar la categoría seleccionada
        handleCategoryClick(selectedCategory);
        return;
      }
      
      try {
        const response = await axios.get(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        setInstruments(response.data.results);
      } catch (err) {
        console.error("Error al buscar instrumentos:", err);
        setInstruments([]);
      }
    };
    
    // Debounce para evitar muchas llamadas a la API
    const timeoutId = setTimeout(searchInstruments, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Display section title based on selected category
  const getSectionTitle = () => {
    if (searchQuery.trim() !== "") {
      return "Resultados de búsqueda";
    }
    
    // Buscar la categoría en los datos cargados de la API
    const categoryInfo = categories[selectedCategory as string];
    if (categoryInfo) {
      return categoryInfo.label;
    }
    
    // Buscar si es una subcategoría
    for (const catKey in categories) {
      const category = categories[catKey];
      if (category.subcategories) {
        const subcategory = category.subcategories.find(sc => sc.id === selectedCategory);
        if (subcategory) {
          return `${category.label} > ${subcategory.label}`;
        }
      }
    }
    
    return "Mercados";
  };

  // Renderizar categorías desde la API o lista inicial mientras carga
  const renderCategories = () => {
    const categoriesToRender = Object.keys(categories).length > 0 
      ? Object.values(categories) 
      : INITIAL_MARKET_CATEGORIES;
    
    return categoriesToRender.map((category) => (
      <li key={category.id} className="mb-1">
        <div 
          className={cn(
            "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 text-sm",
            selectedCategory === category.id && "bg-muted"
          )}
          onClick={() => handleCategoryClick(category.id as string)}
        >
          <div className="flex items-center gap-2">
            {ICON_MAP[category.icon as string] || category.icon}
            <span>{category.label}</span>
          </div>
          
          {category.subcategories && category.subcategories.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpansion(category.id as string);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedCategories.includes(category.id as string) ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
        </div>
        
        {/* Subcategories */}
        {category.subcategories && expandedCategories.includes(category.id as string) && (
          <ul className="pl-10 py-1 bg-muted/20">
            {category.subcategories.map((subcategory) => (
              <li key={subcategory.id}>
                <div
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-muted/50 text-sm",
                    selectedCategory === subcategory.id && "bg-muted"
                  )}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                >
                  {subcategory.label}
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <div className="flex h-screen">
      {/* Left Navigation Sidebar */}
      <div className="w-64 bg-card h-screen border-r border-border overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Mercados</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav>
            <ul className="py-2">
              {isLoading ? (
                <li className="px-4 py-2 text-muted-foreground">Cargando categorías...</li>
              ) : error ? (
                <li className="px-4 py-2 text-red-500">{error}</li>
              ) : (
                renderCategories()
              )}
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar instrumentos..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Instruments List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-semibold mb-4">{getSectionTitle()}</h2>
          
          {isLoading && instruments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Cargando instrumentos...
            </div>
          ) : instruments.length > 0 ? (
            <div className="space-y-1">
              {instruments.map((instrument) => (
                <div
                  key={instrument.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted/50",
                    selectedInstrument?.id === instrument.id && "bg-muted"
                  )}
                  onClick={() => handleInstrumentClick(instrument)}
                >
                  <div className="flex items-center gap-3">
                    {/* Instrument Icon/Indicator */}
                    <div 
                      className="w-6 h-6 flex items-center justify-center rounded-md"
                      style={{ backgroundColor: instrument.color || 'hsl(var(--primary))' }}
                    >
                      <span className="text-xs text-white font-semibold">
                        {instrument.symbol.substring(0, 2)}
                      </span>
                    </div>
                    
                    {/* Instrument Name */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{instrument.name}</span>
                        {instrument.hasRealTime && (
                          <span className="text-xs bg-red-500 text-white px-1 rounded">1s</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {instrument.symbol}
                      </div>
                    </div>
                  </div>
                  
                  {/* Favorite Button */}
                  <button
                    className={cn(
                      "p-1 rounded-full hover:bg-muted",
                      instrument.isFavorite ? "text-yellow-500" : "text-muted-foreground"
                    )}
                    onClick={(e) => handleToggleFavorite(e, instrument)}
                  >
                    <Star className="h-5 w-5" fill={instrument.isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              {searchQuery.trim() !== "" 
                ? "No se encontraron instrumentos que coincidan con la búsqueda."
                : selectedCategory === "favoritos"
                  ? "No tienes instrumentos favoritos. Marca alguno con la estrella."
                  : "No hay instrumentos disponibles en esta categoría."
              }
            </div>
          )}
        </div>
        
        {/* Chart Area - Show when an instrument is selected */}
        {selectedInstrument && (
          <div className="p-4 border-t border-border">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 flex items-center justify-center rounded-md"
                      style={{ backgroundColor: selectedInstrument.color || 'hsl(var(--primary))' }}
                    >
                      <span className="text-sm text-white font-semibold">
                        {selectedInstrument.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedInstrument.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{selectedInstrument.symbol}</span>
                        {selectedInstrument.hasRealTime && (
                          <span className="text-xs bg-red-500 text-white px-1 rounded">1s</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={selectedInstrument.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                      <span className="text-lg font-bold">
                        {selectedInstrument.price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: selectedInstrument.price < 1 ? 4 : 2
                        })}
                      </span>
                      <span className="text-sm ml-2">
                        {selectedInstrument.change24h >= 0 ? "+" : ""}
                        {selectedInstrument.change24h}%
                      </span>
                    </div>
                    
                    {/* Favorite Button */}
                    <button
                      className={cn(
                        "p-1 rounded-full hover:bg-muted",
                        selectedInstrument.isFavorite ? "text-yellow-500" : "text-muted-foreground"
                      )}
                      onClick={(e) => handleToggleFavorite(e, selectedInstrument)}
                    >
                      <Star className="h-5 w-5" fill={selectedInstrument.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <RealTimeMarketChart selectedMarket={selectedMarketForChart} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsNavigation;