import { 
  API_URLS, 
  CACHE_TTL, 
  FORCE_MOCK_DATA, 
  API_KEYS,
  API_PROVIDERS
} from './apiConfig';
import { apiClient } from './apiClient';
import { websocketService } from './websocketService';
import { getCachedMarketData, cacheMarketData } from './marketDataCache';
import { 
  generateRealisticMarketData, 
  updateSimulatedMarketData 
} from './marketDataSimulator';

// Interfaces para datos de mercado
export interface MarketDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  priceHistory: MarketDataPoint[];
  lastUpdated: number;
  isRealTime: boolean;
}

// Cache en memoria para almacenar datos (más rápido que localStorage)
const dataCache: Record<string, {
  data: MarketData;
  timestamp: number;
  ttl: number;
}> = {};

// Polling intervals para instrumentos sin soporte WebSocket
const activePollingIntervals: Record<string, NodeJS.Timeout> = {};

// Callbacks para actualización en tiempo real
const realTimeUpdateCallbacks: Record<string, Set<(data: MarketData) => void>> = {};

// Función para verificar si los datos en caché son válidos
const isCacheValid = (symbol: string, category: string, ttlMs: number = 60000): boolean => {
  const key = `${category}-${symbol.toLowerCase()}`;
  if (!dataCache[key]) return false;
  const now = Date.now();
  return now - dataCache[key].timestamp < ttlMs;
};

// Registrar callback para actualizaciones en tiempo real
export const subscribeToRealTimeUpdates = (
  symbol: string, 
  category: string, 
  callback: (data: MarketData) => void
): (() => void) => {
  const key = `${category}-${symbol.toLowerCase()}`;
  
  if (!realTimeUpdateCallbacks[key]) {
    realTimeUpdateCallbacks[key] = new Set();
  }
  
  realTimeUpdateCallbacks[key].add(callback);
  
  // Si ya hay datos en caché, enviar inmediatamente
  if (dataCache[key]) {
    setTimeout(() => callback(dataCache[key].data), 0);
  }
  
  // Usar el nuevo servicio de WebSocket en lugar de la implementación anterior
  // Esto manejará automáticamente la conexión y reconexión
  if (!FORCE_MOCK_DATA) {
    return websocketService.subscribe(
      symbol, 
      category, 
      callback, 
      dataCache[key]?.data
    );
  } else {
    // Si estamos forzando datos simulados, iniciar polling simulado
    startPollingSimulated(symbol, category);
  
  // Devolver función para cancelar la suscripción
  return () => {
    if (realTimeUpdateCallbacks[key]) {
      realTimeUpdateCallbacks[key].delete(callback);
      
        // Si no hay más callbacks, cancelar polling
      if (realTimeUpdateCallbacks[key].size === 0) {
          stopPolling(key);
        }
      }
    };
    }
};

// Iniciar polling para datos simulados
const startPollingSimulated = (symbol: string, category: string) => {
  const key = `${category}-${symbol.toLowerCase()}`;
  
  // Si ya existe un intervalo activo, no hacer nada
  if (activePollingIntervals[key]) return;
  
  // Crear intervalo para actualizar datos cada 3 segundos
  const interval = setInterval(() => {
    try {
      // Si no hay datos en caché, generarlos
      if (!dataCache[key]) {
        const data = generateRealisticMarketData(symbol, category);
        dataCache[key] = {
          data,
                timestamp: Date.now(),
          ttl: 60000
          };
      } else {
        // Actualizar datos existentes
        const updatedData = updateSimulatedMarketData(dataCache[key].data);
          dataCache[key] = {
          data: updatedData,
            timestamp: Date.now(),
            ttl: 60000
          };
      }
          
          // Llamar a todos los callbacks registrados
          if (realTimeUpdateCallbacks[key]) {
            for (const callback of realTimeUpdateCallbacks[key]) {
          callback(dataCache[key].data);
        }
      }
    } catch (error) {
      console.warn(`Error simulando datos para ${key}:`, error);
  }
  }, 3000); // Actualizar cada 3 segundos
  
  // Guardar el intervalo
  activePollingIntervals[key] = interval;
};

// Detener polling
const stopPolling = (key: string) => {
  const interval = activePollingIntervals[key];
  if (interval) {
    clearInterval(interval);
    delete activePollingIntervals[key];
  }
};

/**
 * Utilidad para mapear símbolos de criptomonedas a IDs de CoinGecko
 */
const mapToCoinGeckoId = (symbol: string): string => {
  const coinGeckoMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'SHIB': 'shiba-inu',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'LTC': 'litecoin'
  };
  
  // Extraer símbolo base en caso de pares (BTC/USD -> BTC)
  const baseSymbol = symbol.split('/')[0].toUpperCase();
  
  return coinGeckoMap[baseSymbol] || baseSymbol.toLowerCase();
};

/**
 * Obtener datos de mercado de criptomonedas usando múltiples APIs
 */
export const getCryptoMarketData = async (symbol: string): Promise<MarketData> => {
  try {
  const cacheKey = `criptomonedas-${symbol.toLowerCase()}`;
  
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, 'criptomonedas');
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.CRYPTO
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, 'criptomonedas', CACHE_TTL.CRYPTO)) {
    return dataCache[cacheKey].data;
  }
  
    // Si se están forzando datos simulados, generarlos
    if (FORCE_MOCK_DATA) {
      const mockData = generateRealisticMarketData(symbol, 'criptomonedas');
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.CRYPTO
      };
      
      return mockData;
    }
    
    const coinGeckoId = mapToCoinGeckoId(symbol);
    
    try {
      // Usar el nuevo cliente API para obtener datos
      const response = await apiClient.get(
        `coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        {
          provider: 'COIN_GECKO',
          category: 'CRYPTO',
          instrument: symbol
        }
      );
      
      const coinData = response.data;
      const marketData = coinData.market_data;
      
      // Obtener datos históricos
      const historyResponse = await apiClient.get(
        `coins/${coinGeckoId}/market_chart?vs_currency=usd&days=1&interval=hourly`,
        {
          provider: 'COIN_GECKO',
          category: 'CRYPTO',
          instrument: symbol
        }
      );
    
      const priceHistory: MarketDataPoint[] = historyResponse.data.prices.map(
      (item: any) => ({
          timestamp: item[0],
          price: item[1] * 4200, // Convertir a COP
      })
    );
    
      const currentPrice = marketData.current_price.usd * 4200;
      const change24h = marketData.price_change_24h * 4200;
      const changePercent24h = marketData.price_change_percentage_24h;
    
      // Crear objeto final
      const data: MarketData = {
        symbol,
        name: coinData.name || symbol,
        currentPrice,
        change24h,
        changePercent24h,
        high24h: marketData.high_24h.usd * 4200,
        low24h: marketData.low_24h.usd * 4200,
      priceHistory,
      lastUpdated: Date.now(),
        isRealTime: false
    };
    
      // Guardar en caché local y memoria
      cacheMarketData(symbol, 'criptomonedas', data, CACHE_TTL.CRYPTO);
    dataCache[cacheKey] = {
        data,
      timestamp: Date.now(),
        ttl: CACHE_TTL.CRYPTO
    };
    
      return data;
    } catch (error: any) {
      // Verificar si el error indica que necesitamos datos simulados
      if (error.message === 'Se necesitan datos simulados') {
        console.log(`Usando datos simulados para ${symbol} (criptomonedas)`);
        return generateAndCacheSimulatedData(symbol, 'criptomonedas');
      }
      
      throw error;
    }
  } catch (error) {
    console.error(`Error obteniendo datos de criptomoneda ${symbol}:`, error);
    
    // Si todo falla, generar datos simulados como último recurso
    return generateAndCacheSimulatedData(symbol, 'criptomonedas');
  }
};

// Función auxiliar para generar y cachear datos simulados
const generateAndCacheSimulatedData = (symbol: string, category: string): MarketData => {
  console.log(`Generando datos simulados para ${symbol} (${category})`);
  const mockData = generateRealisticMarketData(symbol, category);

  // Guardar en caché
  const cacheKey = `${category}-${symbol.toLowerCase()}`;
  dataCache[cacheKey] = {
    data: mockData,
    timestamp: Date.now(),
    ttl: CACHE_TTL[category.toUpperCase() as keyof typeof CACHE_TTL] || CACHE_TTL.DEFAULT
  };
  
  // También guardar en localStorage
  cacheMarketData(symbol, category, mockData);
  
  return mockData;
};

/**
 * Obtener datos de mercado de forex usando múltiples APIs
 */
export const getForexMarketData = async (symbol: string): Promise<MarketData> => {
  try {
    const cacheKey = `forex-${symbol.toLowerCase()}`;
  
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, 'forex');
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.FOREX
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, 'forex', CACHE_TTL.FOREX)) {
    return dataCache[cacheKey].data;
  }
  
    // Si se están forzando datos simulados, generarlos
    if (FORCE_MOCK_DATA) {
      const mockData = generateRealisticMarketData(symbol, 'forex');
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.FOREX
      };
      
      return mockData;
    }
    
    // Parsear el símbolo (por ejemplo, EUR/USD a EURUSD)
    const formattedSymbol = symbol.replace('/', '');
    
    // Obtener datos de forex usando el cliente API
    const response = await apiClient.get(
      `quote?symbol=${formattedSymbol}&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'FOREX',
        instrument: symbol
      }
    );
    
    // Obtener datos históricos
    const historyResponse = await apiClient.get(
      `time_series?symbol=${formattedSymbol}&interval=1h&outputsize=24&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'FOREX',
        instrument: symbol
      }
    );
    
    if (!response.data || !historyResponse.data || !historyResponse.data.values) {
      throw new Error('Invalid API response');
    }
    
    const currentPrice = parseFloat(response.data.close) * 4200; // Convertir a COP
    const previousClose = parseFloat(response.data.previous_close) * 4200;
    const change24h = currentPrice - previousClose;
    const changePercent24h = parseFloat(response.data.percent_change);
    
    // Crear historial de precios
    const priceHistory: MarketDataPoint[] = historyResponse.data.values.map((item: any) => ({
      timestamp: new Date(item.datetime).getTime(),
      price: parseFloat(item.close) * 4200,
    }));
    
    const marketData: MarketData = {
      symbol,
      name: `${symbol.split('/')[0]} / ${symbol.split('/')[1]}`,
      currentPrice,
      change24h,
      changePercent24h,
      high24h: parseFloat(response.data.high) * 4200,
      low24h: parseFloat(response.data.low) * 4200,
      priceHistory,
      lastUpdated: Date.now(),
      isRealTime: false
    };
    
    // Guardar en caché local y memoria
    cacheMarketData(symbol, 'forex', marketData, CACHE_TTL.FOREX);
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: CACHE_TTL.FOREX
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error obteniendo datos de forex ${symbol}:`, error);
    
    // Si fallan las APIs, usar datos simulados
    const mockData = generateRealisticMarketData(symbol, 'forex');
    return mockData;
  }
};

/**
 * Obtener datos de mercado de índices usando múltiples APIs
 */
export const getStockIndexData = async (symbol: string): Promise<MarketData> => {
  try {
    const cacheKey = `indices-${symbol.toLowerCase()}`;
  
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, 'indices');
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.INDICES
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, 'indices', CACHE_TTL.INDICES)) {
    return dataCache[cacheKey].data;
  }
  
    // Si se están forzando datos simulados, generarlos
    if (FORCE_MOCK_DATA) {
      const mockData = generateRealisticMarketData(symbol, 'indices');
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.INDICES
      };
      
      return mockData;
    }
    
    // Obtener datos actuales
    const response = await apiClient.get(
      `quote?symbol=${symbol}&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'INDICES',
        instrument: symbol
      }
    );
    
    // Obtener datos históricos
    const historyResponse = await apiClient.get(
      `time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'INDICES',
        instrument: symbol
      }
    );
    
    if (!response.data || !historyResponse.data || !historyResponse.data.values) {
      throw new Error('Invalid API response');
    }
    
    const currentPrice = parseFloat(response.data.close) * 4200; // Convertir a COP
    const previousClose = parseFloat(response.data.previous_close) * 4200;
    const change24h = currentPrice - previousClose;
    const changePercent24h = parseFloat(response.data.percent_change);
    
    // Crear historial de precios
    const priceHistory: MarketDataPoint[] = historyResponse.data.values.map((item: any) => ({
      timestamp: new Date(item.datetime).getTime(),
      price: parseFloat(item.close) * 4200,
    }));
    
    const marketData: MarketData = {
      symbol,
      name: response.data.name || symbol,
      currentPrice,
      change24h,
      changePercent24h,
      high24h: parseFloat(response.data.high) * 4200,
      low24h: parseFloat(response.data.low) * 4200,
      priceHistory,
      lastUpdated: Date.now(),
      isRealTime: false
    };
    
    // Guardar en caché local y memoria
    cacheMarketData(symbol, 'indices', marketData, CACHE_TTL.INDICES);
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: CACHE_TTL.INDICES
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error obteniendo datos de índice ${symbol}:`, error);
    
    // Si fallan las APIs, usar datos simulados
    const mockData = generateRealisticMarketData(symbol, 'indices');
    return mockData;
  }
};

/**
 * Obtener datos de materias primas usando múltiples APIs
 */
export const getCommodityData = async (symbol: string): Promise<MarketData> => {
  try {
    const cacheKey = `materias-primas-${symbol.toLowerCase()}`;
  
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, 'materias-primas');
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.COMMODITIES
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, 'materias-primas', CACHE_TTL.COMMODITIES)) {
    return dataCache[cacheKey].data;
  }
  
    // Si se están forzando datos simulados, generarlos
    if (FORCE_MOCK_DATA) {
      const mockData = generateRealisticMarketData(symbol, 'materias-primas');
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.COMMODITIES
      };
      
      return mockData;
    }
    
    // Mapear símbolos a símbolos de Twelve Data
    const commodityMap: Record<string, string> = {
      'XAU/USD': 'GOLD',
      'XAG/USD': 'SILVER',
      'OIL': 'WTI',
      'NGAS': 'NATURAL_GAS',
    };
    
    const apiSymbol = commodityMap[symbol] || symbol;
    
    // Obtener datos actuales
    const response = await apiClient.get(
      `quote?symbol=${apiSymbol}&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'COMMODITIES',
        instrument: symbol
      }
    );
    
    // Obtener datos históricos
    const historyResponse = await apiClient.get(
      `time_series?symbol=${apiSymbol}&interval=1h&outputsize=24&apikey=${API_KEYS.TWELVE_DATA}`,
      {
        provider: 'TWELVE_DATA',
        category: 'COMMODITIES',
        instrument: symbol
      }
    );
    
    if (!response.data || !historyResponse.data || !historyResponse.data.values) {
      throw new Error('Invalid API response');
    }
    
    const currentPrice = parseFloat(response.data.close) * 4200; // Convertir a COP
    const previousClose = parseFloat(response.data.previous_close) * 4200;
    const change24h = currentPrice - previousClose;
    const changePercent24h = parseFloat(response.data.percent_change);
    
    // Crear historial de precios
    const priceHistory: MarketDataPoint[] = historyResponse.data.values.map((item: any) => ({
      timestamp: new Date(item.datetime).getTime(),
      price: parseFloat(item.close) * 4200,
    }));
    
    const marketData: MarketData = {
      symbol,
      name: getCommodityName(symbol),
      currentPrice,
      change24h,
      changePercent24h,
      high24h: parseFloat(response.data.high) * 4200,
      low24h: parseFloat(response.data.low) * 4200,
      priceHistory,
      lastUpdated: Date.now(),
      isRealTime: false
    };
    
    // Guardar en caché local y memoria
    cacheMarketData(symbol, 'materias-primas', marketData, CACHE_TTL.COMMODITIES);
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: CACHE_TTL.COMMODITIES
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error obteniendo datos de materia prima ${symbol}:`, error);
    
    // Si fallan las APIs, usar datos simulados
    const mockData = generateRealisticMarketData(symbol, 'materias-primas');
    return mockData;
  }
};

/**
 * Obtener datos de instrumentos sintéticos
 */
export const getSyntheticMarketData = async (
  symbol: string, 
  baseValue: number = 10000
): Promise<MarketData> => {
  try {
    const category = symbol.includes('volatility') ? 'sinteticos' : 'derivados';
    const cacheKey = `${category}-${symbol.toLowerCase()}`;
    
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, category);
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.SYNTHETIC
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, category, CACHE_TTL.SYNTHETIC)) {
      return dataCache[cacheKey].data;
    }
    
    // Los instrumentos sintéticos generalmente no tienen APIs disponibles,
    // por lo que usamos datos simulados
    const mockData = generateRealisticMarketData(symbol, category);
    
    // Guardar en caché local y memoria
    cacheMarketData(symbol, category, mockData, CACHE_TTL.SYNTHETIC);
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: CACHE_TTL.SYNTHETIC
    };
    
    return mockData;
  } catch (error) {
    console.error(`Error obteniendo datos sintéticos ${symbol}:`, error);
    
    // Si hay algún error, siempre usar datos simulados
    const category = symbol.includes('volatility') ? 'sinteticos' : 'derivados';
    const mockData = generateRealisticMarketData(symbol, category);
    return mockData;
  }
};

/**
 * Obtener nombre para materias primas
 */
const getCommodityName = (symbol: string): string => {
  const nameMap: Record<string, string> = {
    'GOLD': 'Oro',
    'XAU/USD': 'Oro',
    'SILVER': 'Plata',
    'XAG/USD': 'Plata',
    'OIL': 'Crudo WTI',
    'WTI': 'Crudo WTI',
    'NGAS': 'Gas Natural',
    'NATURAL_GAS': 'Gas Natural',
    'COPPER': 'Cobre',
    'CORN': 'Maíz',
    'WHEAT': 'Trigo'
  };
  
  return nameMap[symbol] || `Commodity ${symbol}`;
};

/**
 * Obtener nombre para instrumentos sintéticos
 */
const getSyntheticName = (symbol: string): string => {
  const nameMap: Record<string, string> = {
    'volatility-10': 'Índice de Volatilidad 10',
    'volatility-25': 'Índice de Volatilidad 25',
    'volatility-50': 'Índice de Volatilidad 50',
    'volatility-75': 'Índice de Volatilidad 75',
    'volatility-100': 'Índice de Volatilidad 100',
    'boom-1000': 'Boom 1000 Índice',
    'crash-1000': 'Crash 1000 Índice'
  };
  
  return nameMap[symbol] || `Sintético ${symbol}`;
};

/**
 * Obtener datos de acciones (stocks) individuales
 */
export const getStockData = async (symbol: string): Promise<MarketData> => {
  try {
    const cacheKey = `stocks-${symbol.toLowerCase()}`;
  
    // Verificar si hay datos en caché (localStorage)
    const cachedData = getCachedMarketData(symbol, 'stocks');
    if (cachedData) {
      // Si hay datos en caché, guardar en memoria
      dataCache[cacheKey] = {
        data: cachedData,
        timestamp: Date.now(),
        ttl: CACHE_TTL.DEFAULT
      };
      return cachedData;
    }
    
    // Verificar caché en memoria
    if (isCacheValid(symbol, 'stocks', CACHE_TTL.DEFAULT)) {
      return dataCache[cacheKey].data;
    }
    
    // Para stocks, siempre usamos datos simulados por ahora
    const mockData = generateRealisticMarketData(symbol, 'stocks');
    
    // Guardar en caché local y memoria
    cacheMarketData(symbol, 'stocks', mockData, CACHE_TTL.DEFAULT);
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: CACHE_TTL.DEFAULT
    };
    
    return mockData;
  } catch (error) {
    console.error(`Error obteniendo datos de acción ${symbol}:`, error);
    
    // Si hay algún error, siempre usar datos simulados
    const mockData = generateRealisticMarketData(symbol, 'stocks');
    return mockData;
  }
};

/**
 * Función principal para obtener datos de mercado
 */
export const getMarketData = async (
  symbol: string, 
  category: string,
  baseValue?: number
): Promise<MarketData> => {
  try {
    // Normalize category names to support a broader range of inputs
    const normalizedCategory = 
      category.toLowerCase() === 'cripto' ? 'criptomonedas' :
      category.toLowerCase() === 'volatility' || 
      category.toLowerCase() === 'boom' || 
      category.toLowerCase() === 'crash' ? 'sinteticos' : 
      category.toLowerCase();
    
    // Skip API calls and directly use simulated data if the instrument or category requires it
    if (
      FORCE_MOCK_DATA ||
      symbol.includes('volatility') ||
      symbol.includes('boom') ||
      symbol.includes('crash') ||
      normalizedCategory === 'sinteticos' ||
      normalizedCategory === 'derivados' ||
      normalizedCategory === 'baskets' ||
      normalizedCategory === 'stocks'  // Añadir stocks a las categorías que usan datos simulados
    ) {
      return generateAndCacheSimulatedData(symbol, normalizedCategory);
    }
    
    let data: MarketData;
    
    try {
      // Try to get data from API
      switch (normalizedCategory) {
        case 'criptomonedas':
          data = await getCryptoMarketData(symbol);
          break;
        case 'forex':
          data = await getForexMarketData(symbol);
          break;
        case 'indices':
          data = await getStockIndexData(symbol);
          break;
        case 'materias-primas':
          data = await getCommodityData(symbol);
          break;
        case 'stocks':
          data = await getStockData(symbol);
          break;
        case 'sinteticos':
        case 'derivados':
        case 'baskets':
          data = await getSyntheticMarketData(symbol, baseValue || 10000);
          break;
        default:
          // For unknown categories, use simulated data
          console.warn(`Categoría no reconocida: ${normalizedCategory}, usando datos simulados`);
          return generateAndCacheSimulatedData(symbol, 'sinteticos');
      }
      
      return data;
    } catch (error: any) {
      // Check if this is our special signal to use simulated data
      if (error && error.message === 'Se necesitan datos simulados') {
        console.log(`Usando datos simulados para ${symbol} (${normalizedCategory})`);
        return generateAndCacheSimulatedData(symbol, normalizedCategory);
      }
      
      // Rethrow any other errors to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error(`Error en getMarketData para ${symbol} (${category}):`, error);
    
    // Last resort - if everything fails, use simulated data
    const normalizedCategory = 
      category.toLowerCase() === 'cripto' ? 'criptomonedas' :
      category.toLowerCase() === 'volatility' || 
      category.toLowerCase() === 'boom' || 
      category.toLowerCase() === 'crash' ? 'sinteticos' : 
      category.toLowerCase();
      
    return generateAndCacheSimulatedData(symbol, normalizedCategory);
  }
};

/**
 * Obtener datos de mercado para múltiples instrumentos en paralelo
 */
export const getBatchMarketData = async (
  requests: Array<{symbol: string; category: string; baseValue?: number}>
): Promise<Record<string, MarketData | null>> => {
  try {
    const result: Record<string, MarketData | null> = {};
    
    // Filtrar peticiones válidas
    const validRequests = requests.filter(req => req.symbol && req.category);
    
    // Procesar en lotes para evitar sobrecargar las APIs
    const batchSize = 5;
    
    for (let i = 0; i < validRequests.length; i += batchSize) {
      const batch = validRequests.slice(i, i + batchSize);
      
      // Crear promesas para cada petición
      const promises = batch.map(async req => {
        try {
          const data = await getMarketData(req.symbol, req.category, req.baseValue);
          
          // Guardar resultado usando una clave que combine categoría y símbolo
          const key = `${req.category}-${req.symbol.toLowerCase()}`;
          result[key] = data;
          
          return data;
        } catch (error) {
          console.error(`Error batch para ${req.symbol}:`, error);
          return null;
        }
      });
      
      // Esperar a que se completen todas las promesas del lote actual
      await Promise.all(promises);
      
      // Pequeña pausa entre lotes para no sobrecargar las APIs
      if (i + batchSize < validRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error en getBatchMarketData:', error instanceof Error ? error.message : 'Error desconocido');
    
    // En caso de error crítico, devolver un objeto vacío
    return {};
  }
};

// Exportar la función de limpieza de websockets para que pueda usarse desde otros componentes
export const cleanupWebSockets = () => {
  websocketService.closeAll();
};

// Limpiar recursos al cerrar la aplicación
export const cleanupResources = () => {
  // Limpiar intervalos de polling
  Object.values(activePollingIntervals).forEach(interval => {
    clearInterval(interval);
  });
  
  // Desconectar websockets
  cleanupWebSockets();
}; 