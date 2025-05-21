import axios from 'axios';

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

// Cache para almacenar datos y reducir llamadas a la API
const dataCache: Record<string, {
  data: MarketData;
  timestamp: number;
  ttl: number;
}> = {};

// WebSocket connections para datos en tiempo real
const activeWebSockets: Record<string, WebSocket> = {};

// Callbacks para actualización en tiempo real
const realTimeUpdateCallbacks: Record<string, Set<(data: MarketData) => void>> = {};

// Constante para controlar si usamos APIs reales o simuladas
const USE_MOCK_DATA = false; // Usar APIs reales por defecto
const RETRY_ATTEMPTS = 2; // Número de reintentos para las APIs
const API_TIMEOUT_MS = 6000; // Timeout para las llamadas a APIs

// Función para verificar si los datos en caché son válidos
const isCacheValid = (symbol: string, ttlMs: number = 60000): boolean => {
  if (!dataCache[symbol]) return false;
  const now = Date.now();
  return now - dataCache[symbol].timestamp < ttlMs;
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
  
  // Iniciar la conexión WebSocket si no existe
  ensureRealTimeConnection(symbol, category);
  
  // Devolver función para cancelar la suscripción
  return () => {
    if (realTimeUpdateCallbacks[key]) {
      realTimeUpdateCallbacks[key].delete(callback);
      
      // Si no hay más callbacks, cerrar el WebSocket
      if (realTimeUpdateCallbacks[key].size === 0) {
        closeWebSocketConnection(key);
      }
    }
  };
};

// Iniciar conexión WebSocket para datos en tiempo real
const ensureRealTimeConnection = (symbol: string, category: string) => {
  // Si estamos usando datos simulados, no establecer conexiones WebSocket
  if (USE_MOCK_DATA) {
    console.log(`Using simulated data for ${category}-${symbol}, skipping WebSocket connection`);
    return;
  }
  
  const key = `${category}-${symbol.toLowerCase()}`;
  
  // Si ya existe una conexión activa, no hacer nada
  if (activeWebSockets[key]) return;
  
  let wsUrl: string | null = null;
  
  // Convertir formatos de símbolo para diferentes APIs
  let formattedSymbol = '';
  
  try {
    // Determinar la URL del WebSocket según la categoría
    if (category === 'criptomonedas') {
      // Para criptomonedas, procesar el formato para Binance WebSocket API
      if (symbol.includes('/')) {
        const [base, quote] = symbol.split('/');
        formattedSymbol = (base + quote).toLowerCase();
      } else {
        formattedSymbol = symbol.toLowerCase();
      }
      
      // Verificar si es un par válido para Binance
      const validBinancePairs = ['btcusdt', 'ethusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'dogeusdt', 'dotusdt'];
      
      if (validBinancePairs.includes(formattedSymbol)) {
        wsUrl = `wss://stream.binance.com:9443/ws/${formattedSymbol}@ticker`;
        console.log(`Creating Binance WebSocket for ${formattedSymbol} with URL: ${wsUrl}`);
      } else {
        console.warn(`Symbol ${formattedSymbol} not supported by Binance WebSockets, using fallback`);
        // Aquí podríamos usar una API alternativa o simular datos
        return; // No establecer WebSocket para este símbolo
      }
    } else if (category === 'forex') {
      // Para forex, usar otra API con WebSockets (ejemplo: TradingView)
      wsUrl = `wss://data.tradingview.com/socket.io/websocket?symbol=${symbol}`;
    } else if (category === 'indices') {
      // WebSocket para índices
      wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}&symbols=${symbol}`;
    } else if (category === 'materias-primas') {
      // WebSocket para materias primas
      wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${TWELVE_DATA_API_KEY}&symbols=${symbol}`;
    } else if (category === 'derivados' || category === 'sinteticos' || category === 'baskets') {
      // Para sintéticos, usar una API específica o simular con datos reales
      wsUrl = `wss://ws.derive.com/v3/${symbol.toLowerCase()}`;
    }
    
    // Si no hay URL de WebSocket disponible, no continuar
    if (!wsUrl) return; 
    
    // Crear conexión WebSocket
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`WebSocket connection opened for ${key}`);
      
      // Para algunas APIs, enviar mensaje de suscripción
      if (category === 'forex' || category === 'indices' || category === 'materias-primas') {
        ws.send(JSON.stringify({
          action: 'subscribe',
          params: {
            symbols: [symbol]
          }
        }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Procesar datos según el formato de la API
        let updatedData: Partial<MarketData> | null = null;
        
        if (category === 'criptomonedas') {
          // Procesar datos de Binance
          updatedData = {
            symbol: symbol,
            currentPrice: parseFloat(data.c) * 4200, // Convertir a COP
            change24h: parseFloat(data.p) * 4200,
            changePercent24h: parseFloat(data.P),
            high24h: parseFloat(data.h) * 4200,
            low24h: parseFloat(data.l) * 4200,
            lastUpdated: Date.now(),
            isRealTime: true
          };
        } else if (category === 'forex' || category === 'indices' || category === 'materias-primas') {
          // Procesar datos de TwelveData
          if (data.price) {
            updatedData = {
              symbol: symbol,
              currentPrice: parseFloat(data.price) * 4200,
              lastUpdated: Date.now(),
              isRealTime: true
            };
          }
        } else if (category === 'derivados' || category === 'sinteticos' || category === 'baskets') {
          // Procesar datos de sintéticos
          updatedData = {
            symbol: symbol,
            currentPrice: parseFloat(data.price) * 4200,
            change24h: parseFloat(data.change) * 4200,
            changePercent24h: parseFloat(data.percent_change),
            lastUpdated: Date.now(),
            isRealTime: true
          };
        }
        
        // Si hay datos actualizados y están en caché, actualizar
        if (updatedData && dataCache[key]) {
          const currentData = { ...dataCache[key].data };
          
          // Actualizar solo los campos que han cambiado
          const updatedMarketData: MarketData = {
            ...currentData,
            ...updatedData,
            // Agregar punto al historial
            priceHistory: [
              ...currentData.priceHistory,
              {
                timestamp: Date.now(),
                price: updatedData.currentPrice || currentData.currentPrice
              }
            ].slice(-100) // Mantener sólo los últimos 100 puntos
          };
          
          // Actualizar caché
          dataCache[key] = {
            data: updatedMarketData,
            timestamp: Date.now(),
            ttl: 60000
          };
          
          // Llamar a todos los callbacks registrados
          if (realTimeUpdateCallbacks[key]) {
            for (const callback of realTimeUpdateCallbacks[key]) {
              callback(updatedMarketData);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing WebSocket message for ${key}:`, error);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`WebSocket error for ${key}:`, error);
      
      // Registrar información adicional para ayudar en depuración
      console.error(`WebSocket URL: ${wsUrl}`);
      console.error(`Connection state: ${ws.readyState}`);
      
      // Intentar reconectar después de un error
      setTimeout(() => {
        if (realTimeUpdateCallbacks[key] && realTimeUpdateCallbacks[key].size > 0) {
          console.log(`Attempting to reconnect WebSocket for ${key}`);
          closeWebSocketConnection(key);
          ensureRealTimeConnection(symbol, category);
        }
      }, 3000);
    };
    
    ws.onclose = () => {
      console.log(`WebSocket connection closed for ${key}`);
      delete activeWebSockets[key];
      
      // Intentar reconectar después de un tiempo
      setTimeout(() => {
        if (realTimeUpdateCallbacks[key] && realTimeUpdateCallbacks[key].size > 0) {
          ensureRealTimeConnection(symbol, category);
        }
      }, 5000);
    };
    
    // Guardar la conexión WebSocket
    activeWebSockets[key] = ws;
  } catch (error) {
    console.error(`Error creating WebSocket for ${key}:`, error);
  }
};

// Cerrar conexión WebSocket
const closeWebSocketConnection = (key: string) => {
  const ws = activeWebSockets[key];
  if (ws) {
    ws.close();
    delete activeWebSockets[key];
  }
};

// API keys - En producción, deberían estar en variables de entorno
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '25HADAI1ZLYMUH8M'; 
const COIN_API_KEY = process.env.COIN_API_KEY || 'demo';
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || 'b54235cde5b640a3b9e3fc3a45f7881b';
// Añadir CoinGecko como API alternativa
const COIN_GECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Función de utilidad para espera exponencial para reintentos
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para hacer peticiones con reintentos y backoff exponencial
const fetchWithRetry = async (
  url: string, 
  options: any = {}, 
  retries = 3, 
  backoff = 300
): Promise<any> => {
  try {
    const response = await axios({
      url,
      ...options,
      timeout: options.timeout || API_TIMEOUT_MS
    });
    return response;
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    console.log(`Error fetching ${url}, retrying in ${backoff}ms... (${retries} retries left)`);
    await sleep(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// Función para mapear ID de moneda para CoinGecko
const mapToCoinGeckoId = (symbol: string): string => {
  const symbolMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'LTC': 'litecoin',
    'BTC/USD': 'bitcoin',
    'ETH/USD': 'ethereum',
    // Añadir más mapeos según sea necesario
  };
  
  // Extraer símbolo base si contiene "/"
  const baseSymbol = symbol.split('/')[0];
  return symbolMap[baseSymbol] || symbolMap[symbol] || baseSymbol.toLowerCase();
};

// Generador de datos mock para cuando las APIs fallan
const generateMockMarketData = (symbol: string, category: string): MarketData => {
  // Valores base según la categoría
  let basePrice = 0;
  let volatility = 0;
  
  if (category === 'criptomonedas') {
    if (symbol.toLowerCase().includes('btc')) basePrice = 27500 * 4200;
    else if (symbol.toLowerCase().includes('eth')) basePrice = 1850 * 4200;
    else if (symbol.toLowerCase().includes('bnb')) basePrice = 215 * 4200;
    else basePrice = 500 * 4200;
    volatility = 0.05; // 5% volatilidad
  } else if (category === 'forex') {
    if (symbol.toLowerCase().includes('eur')) basePrice = 1.07 * 4200;
    else if (symbol.toLowerCase().includes('gbp')) basePrice = 1.25 * 4200;
    else if (symbol.toLowerCase().includes('jpy')) basePrice = 0.0067 * 4200;
    else basePrice = 1 * 4200;
    volatility = 0.01; // 1% volatilidad
  } else if (category === 'indices') {
    if (symbol.toLowerCase().includes('nasdaq')) basePrice = 15700 * 4200;
    else if (symbol.toLowerCase().includes('dow')) basePrice = 36000 * 4200;
    else if (symbol.toLowerCase().includes('sp')) basePrice = 4900 * 4200;
    else basePrice = 10000;
    volatility = 0.02; // 2% volatilidad
  } else if (category === 'materias-primas') {
    if (symbol.toLowerCase().includes('xau') || symbol.toLowerCase().includes('gold')) basePrice = 2000 * 4200;
    else if (symbol.toLowerCase().includes('xag') || symbol.toLowerCase().includes('silver')) basePrice = 25 * 4200;
    else if (symbol.toLowerCase().includes('oil')) basePrice = 75 * 4200;
    else basePrice = 100 * 4200;
    volatility = 0.03; // 3% volatilidad
  } else {
    // Derivados, sintéticos o baskets
    basePrice = 10000;
    volatility = 0.04; // 4% volatilidad
  }
  
  // Generar datos de precio histórico
  const now = Date.now();
  const priceHistory: MarketDataPoint[] = [];
  
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (23 - i) * 60 * 60 * 1000; // Datos horarios
    const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
    const price = basePrice * randomFactor;
    priceHistory.push({ timestamp, price });
  }
  
  // Calcular cambio en las últimas 24h
  const lastPrice = priceHistory[priceHistory.length - 1].price;
  const firstPrice = priceHistory[0].price;
  const change24h = lastPrice - firstPrice;
  const changePercent24h = (change24h / firstPrice) * 100;
  
  // Generar nombre si no se proporciona
  let name = symbol;
  if (category === 'criptomonedas') {
    if (symbol.toLowerCase().includes('btc')) name = 'Bitcoin';
    else if (symbol.toLowerCase().includes('eth')) name = 'Ethereum';
    else if (symbol.toLowerCase().includes('bnb')) name = 'Binance Coin';
    else name = `Crypto ${symbol}`;
  } else if (category === 'forex') {
    name = symbol;
  } else if (category === 'materias-primas') {
    name = getCommodityName(symbol);
  } else if (category === 'derivados' || category === 'sinteticos') {
    name = getSyntheticName(symbol);
  }
  
  return {
    symbol,
    name,
    currentPrice: lastPrice,
    change24h,
    changePercent24h,
    high24h: Math.max(...priceHistory.map(p => p.price)),
    low24h: Math.min(...priceHistory.map(p => p.price)),
    priceHistory,
    lastUpdated: now,
    isRealTime: false // Datos simulados no son en tiempo real
  };
};

// Modificar getCryptoMarketData para usar múltiples APIs y reintentos avanzados
export const getCryptoMarketData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `criptomonedas-${symbol.toLowerCase()}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 30000)) { // TTL de 30 segundos para cripto
    return dataCache[cacheKey].data;
  }
  
  // Si estamos usando datos simulados, devolver directamente
  if (USE_MOCK_DATA) {
    const mockData = generateMockMarketData(symbol, 'criptomonedas');
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: 30000,
    };
    
    return mockData;
  }
  
  // 1. Intento con CoinCap API
  try {
    // Convertir símbolos como BTC/USD a formato de CoinCap (bitcoin)
    const coinId = symbol.split('/')[0].toLowerCase();
    
    console.log(`Intentando obtener datos para ${symbol} desde CoinCap...`);
    
    // Obtener datos actuales con reintentos y backoff exponencial
    const response = await fetchWithRetry(
      `https://api.coincap.io/v2/assets/${coinId}`,
      { timeout: API_TIMEOUT_MS },
      2,  // 2 reintentos
      500  // Empezar con 500ms, luego 1000ms, 2000ms
    );
    
    if (!response.data || !response.data.data) {
      throw new Error(`No se encontraron datos para ${symbol} en CoinCap`);
    }
    
    const coinData = response.data.data;
    
    // Obtener datos históricos (últimas 24 horas) con reintentos
    const historyResponse = await fetchWithRetry(
      `https://api.coincap.io/v2/assets/${coinId}/history?interval=h1&start=${Date.now() - 24 * 60 * 60 * 1000}&end=${Date.now()}`,
      { timeout: API_TIMEOUT_MS },
      2,
      500
    );
    
    if (!historyResponse.data || !historyResponse.data.data) {
      throw new Error(`No se encontraron datos históricos para ${symbol} en CoinCap`);
    }
    
    const priceHistory: MarketDataPoint[] = historyResponse.data.data.map(
      (item: any) => ({
        timestamp: item.time,
        price: parseFloat(item.priceUsd) * 4200, // Convertir a COP (aproximado)
      })
    );
    
    const currentPrice = parseFloat(coinData.priceUsd) * 4200;
    const changePercent24h = parseFloat(coinData.changePercent24h);
    const change24h = currentPrice * (changePercent24h / 100);
    
    const marketData: MarketData = {
      symbol: symbol,
      name: coinData.name,
      currentPrice: currentPrice,
      change24h: change24h,
      changePercent24h: changePercent24h,
      high24h: currentPrice * 1.05, // Aproximado
      low24h: currentPrice * 0.95, // Aproximado
      priceHistory,
      lastUpdated: Date.now(),
      isRealTime: true
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 30000,
    };
    
    // Establecer conexión WebSocket para datos en tiempo real
    ensureRealTimeConnection(symbol, 'criptomonedas');
    
    return marketData;
  } catch (coinCapError) {
    // Registrar error de CoinCap para análisis
    console.error(`Error al obtener datos de CoinCap para ${symbol}:`, coinCapError);
    console.log(`Intentando API alternativa para ${symbol}...`);
    
    // 2. Intento con CoinGecko API como respaldo
    try {
      const coinGeckoId = mapToCoinGeckoId(symbol);
      
      // Obtener datos actuales de CoinGecko
      const response = await fetchWithRetry(
        `${COIN_GECKO_API_URL}/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        { timeout: API_TIMEOUT_MS },
        2,
        500
      );
      
      if (!response.data || !response.data.market_data) {
        throw new Error(`No se encontraron datos para ${symbol} en CoinGecko`);
      }
      
      const coinData = response.data;
      const marketData = response.data.market_data;
      
      // Obtener datos históricos de CoinGecko
      const historyResponse = await fetchWithRetry(
        `${COIN_GECKO_API_URL}/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=1&interval=hourly`,
        { timeout: API_TIMEOUT_MS },
        2,
        500
      );
      
      if (!historyResponse.data || !historyResponse.data.prices) {
        throw new Error(`No se encontraron datos históricos para ${symbol} en CoinGecko`);
      }
      
      const priceHistory: MarketDataPoint[] = historyResponse.data.prices.map(
        (item: any) => ({
          timestamp: item[0],
          price: item[1] * 4200, // Convertir a COP
        })
      );
      
      const currentPrice = marketData.current_price.usd * 4200;
      const change24h = marketData.price_change_24h * 4200;
      const changePercent24h = marketData.price_change_percentage_24h;
      
      const coinMarketData: MarketData = {
        symbol: symbol,
        name: coinData.name,
        currentPrice: currentPrice,
        change24h: change24h,
        changePercent24h: changePercent24h,
        high24h: marketData.high_24h.usd * 4200,
        low24h: marketData.low_24h.usd * 4200,
        priceHistory,
        lastUpdated: Date.now(),
        isRealTime: true
      };
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: coinMarketData,
        timestamp: Date.now(),
        ttl: 30000,
      };
      
      console.log(`Datos obtenidos con éxito desde CoinGecko para ${symbol}`);
      
      // Intentar establecer conexión WebSocket para datos en tiempo real
      ensureRealTimeConnection(symbol, 'criptomonedas');
      
      return coinMarketData;
    } catch (coinGeckoError) {
      // Si ambas APIs fallan, registrar error y usar datos simulados
      console.error(`Error al obtener datos de CoinGecko para ${symbol}:`, coinGeckoError);
      console.warn(`Todas las APIs fallaron para ${symbol}, usando datos simulados como último recurso`);
      
      const mockData = generateMockMarketData(symbol, 'criptomonedas');
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        ttl: 30000,
      };
      
      return mockData;
    }
  }
};

// Modificar getForexMarketData para reintentar y usar fallback a datos simulados si la API falla
export const getForexMarketData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `forex-${symbol.replace('/', '')}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para forex
    return dataCache[cacheKey].data;
  }
  
  // Si estamos usando datos simulados, devolver directamente
  if (USE_MOCK_DATA) {
    const mockData = generateMockMarketData(symbol, 'forex');
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return mockData;
  }
  
  // Intentar obtener datos reales con reintentos
  let lastError: any = null;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Parsear el símbolo (por ejemplo, EUR/USD a EURUSD)
      const formattedSymbol = symbol.replace('/', '');
      
      // Obtener datos de forex usando Twelve Data para tener datos más actualizados
      const response = await axios.get(
        `https://api.twelvedata.com/quote?symbol=${formattedSymbol}&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
      );
      
      // Obtener datos históricos
      const historyResponse = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=1h&outputsize=24&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
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
        isRealTime: true
      };
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: marketData,
        timestamp: Date.now(),
        ttl: 60000,
      };
      
      // Establecer conexión WebSocket para datos en tiempo real
      ensureRealTimeConnection(symbol, 'forex');
      
      return marketData;
    } catch (error) {
      lastError = error;
      console.error(`Error fetching forex data for ${symbol} (attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1}):`, error);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Si todos los intentos fallaron, usar datos simulados como fallback
  console.warn(`All API attempts failed for ${symbol}, using simulated data`);
  const mockData = generateMockMarketData(symbol, 'forex');
  
  // Guardar en caché
  dataCache[cacheKey] = {
    data: mockData,
    timestamp: Date.now(),
    ttl: 60000,
  };
  
  return mockData;
};

// Modificar getStockIndexData para reintentar y usar fallback a datos simulados si la API falla
export const getStockIndexData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `indices-${symbol}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para índices
    return dataCache[cacheKey].data;
  }
  
  // Si estamos usando datos simulados, devolver directamente
  if (USE_MOCK_DATA) {
    const mockData = generateMockMarketData(symbol, 'indices');
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return mockData;
  }
  
  // Intentar obtener datos reales con reintentos
  let lastError: any = null;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Obtener datos actuales
      const response = await axios.get(
        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
      );
      
      // Obtener datos históricos
      const historyResponse = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
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
        isRealTime: true
      };
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: marketData,
        timestamp: Date.now(),
        ttl: 60000,
      };
      
      // Establecer conexión WebSocket para datos en tiempo real
      ensureRealTimeConnection(symbol, 'indices');
      
      return marketData;
    } catch (error) {
      lastError = error;
      console.error(`Error fetching stock index data for ${symbol} (attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1}):`, error);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Si todos los intentos fallaron, usar datos simulados como fallback
  console.warn(`All API attempts failed for ${symbol}, using simulated data`);
  const mockData = generateMockMarketData(symbol, 'indices');
  
  // Guardar en caché
  dataCache[cacheKey] = {
    data: mockData,
    timestamp: Date.now(),
    ttl: 60000,
  };
  
  return mockData;
};

// Modificar getCommodityData para reintentar y usar fallback a datos simulados si la API falla
export const getCommodityData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `materias-primas-${symbol}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para materias primas
    return dataCache[cacheKey].data;
  }
  
  // Si estamos usando datos simulados, devolver directamente
  if (USE_MOCK_DATA) {
    const mockData = generateMockMarketData(symbol, 'materias-primas');
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return mockData;
  }
  
  // Intentar obtener datos reales con reintentos
  let lastError: any = null;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Mapear símbolos a símbolos de Twelve Data
      const commodityMap: Record<string, string> = {
        'XAU/USD': 'GOLD',
        'XAG/USD': 'SILVER',
        'OIL': 'WTI',
        'NGAS': 'NATURAL_GAS',
      };
      
      const apiSymbol = commodityMap[symbol] || symbol;
      
      // Obtener datos actuales
      const response = await axios.get(
        `https://api.twelvedata.com/quote?symbol=${apiSymbol}&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
      );
      
      // Obtener datos históricos
      const historyResponse = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${apiSymbol}&interval=1h&outputsize=24&apikey=${TWELVE_DATA_API_KEY}`,
        { timeout: API_TIMEOUT_MS }
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
        isRealTime: true
      };
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: marketData,
        timestamp: Date.now(),
        ttl: 60000,
      };
      
      // Establecer conexión WebSocket para datos en tiempo real
      ensureRealTimeConnection(symbol, 'materias-primas');
      
      return marketData;
    } catch (error) {
      lastError = error;
      console.error(`Error fetching commodity data for ${symbol} (attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1}):`, error);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Si todos los intentos fallaron, usar datos simulados como fallback
  console.warn(`All API attempts failed for ${symbol}, using simulated data`);
  const mockData = generateMockMarketData(symbol, 'materias-primas');
  
  // Guardar en caché
  dataCache[cacheKey] = {
    data: mockData,
    timestamp: Date.now(),
    ttl: 60000,
  };
  
  return mockData;
};

// Modificar getSyntheticMarketData para reintentar y usar fallback a datos simulados si la API falla
export const getSyntheticMarketData = async (
  symbol: string, 
  baseValue: number = 10000
): Promise<MarketData> => {
  const cacheKey = `derivados-${symbol.toLowerCase()}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 30000)) { // TTL de 30 segundos para sintéticos
    return dataCache[cacheKey].data;
  }
  
  // Si estamos usando datos simulados, devolver directamente
  if (USE_MOCK_DATA) {
    const mockData = generateMockMarketData(symbol, symbol.includes('volatility') ? 'sinteticos' : 'derivados');
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: mockData,
      timestamp: Date.now(),
      ttl: 30000,
    };
    
    return mockData;
  }
  
  // Intentar obtener datos reales con reintentos
  let lastError: any = null;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Conectar a la API de Deriv para datos reales
      const response = await axios.get(
        `https://deriv-api.deriv.com/api/ticks?ticks=${symbol.toLowerCase()}&count=500`,
        { timeout: API_TIMEOUT_MS }
      );
      
      if (!response.data || !response.data.ticks) {
        throw new Error('Invalid API response');
      }
      
      const ticks = response.data.ticks;
      const priceHistory: MarketDataPoint[] = ticks.map((tick: any) => ({
        timestamp: tick.epoch * 1000,
        price: tick.quote,
      }));
      
      // Calcular precio actual y cambios
      const currentPrice = ticks[ticks.length - 1].quote;
      const previousPrice = ticks[0].quote;
      const change24h = currentPrice - previousPrice;
      const changePercent24h = (change24h / previousPrice) * 100;
      
      const marketData: MarketData = {
        symbol,
        name: getSyntheticName(symbol),
        currentPrice,
        change24h,
        changePercent24h,
        priceHistory,
        lastUpdated: Date.now(),
        isRealTime: true
      };
      
      // Guardar en caché
      dataCache[cacheKey] = {
        data: marketData,
        timestamp: Date.now(),
        ttl: 30000,
      };
      
      // Establecer conexión WebSocket para datos en tiempo real
      ensureRealTimeConnection(symbol, 'derivados');
      
      return marketData;
    } catch (error) {
      lastError = error;
      console.error(`Error fetching synthetic data for ${symbol} (attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1}):`, error);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Si todos los intentos fallaron, usar datos simulados como fallback
  console.warn(`All API attempts failed for ${symbol}, using simulated data`);
  const mockData = generateMockMarketData(symbol, symbol.includes('volatility') ? 'sinteticos' : 'derivados');
  
  // Guardar en caché
  dataCache[cacheKey] = {
    data: mockData,
    timestamp: Date.now(),
    ttl: 30000,
  };
  
  return mockData;
};

// Función auxiliar para obtener nombre de materia prima
const getCommodityName = (symbol: string): string => {
  const commodityNames: Record<string, string> = {
    'XAU/USD': 'Oro',
    'XAG/USD': 'Plata',
    'OIL': 'Petróleo Crudo',
    'NGAS': 'Gas Natural',
  };
  
  return commodityNames[symbol] || symbol;
};

// Función auxiliar para obtener nombre de sintético
const getSyntheticName = (symbol: string): string => {
  const syntheticNames: Record<string, string> = {
    'volatility-10': 'Volatilidad 10 Índice',
    'volatility-25': 'Volatilidad 25 Índice',
    'volatility-50': 'Volatilidad 50 Índice',
    'volatility-75': 'Volatilidad 75 Índice',
    'volatility-100': 'Volatilidad 100 Índice',
    'boom-1000': 'Boom 1000 Índice',
    'crash-1000': 'Crash 1000 Índice',
  };
  
  return syntheticNames[symbol] || symbol;
};

// Función principal para obtener datos de mercado
export const getMarketData = async (
  symbol: string, 
  category: string,
  baseValue?: number
): Promise<MarketData> => {
  try {
    let data: MarketData;
    
    switch (category) {
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
      case 'derivados':
      case 'sinteticos':
      case 'baskets':
        data = await getSyntheticMarketData(symbol, baseValue || 10000);
        break;
      default:
        throw new Error(`Categoría no soportada: ${category}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error en getMarketData:`, error);
    throw error;
  }
};

// Función para obtener datos de múltiples instrumentos en paralelo
export const getBatchMarketData = async (
  requests: Array<{symbol: string; category: string; baseValue?: number}>
): Promise<Record<string, MarketData | null>> => {
  try {
    const promises = requests.map(req => 
      getMarketData(req.symbol, req.category, req.baseValue)
        .then(data => ({ [req.symbol]: data }))
        .catch(error => {
          console.error(`Error obteniendo datos para ${req.symbol}:`, error);
          return { [req.symbol]: null };
        })
    );
    
    const results = await Promise.all(promises);
    
    // Combinar resultados
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {} as Record<string, MarketData | null>);
  } catch (error) {
    console.error('Error en getBatchMarketData:', error);
    throw error;
  }
};

// Limpiar WebSockets al desmontar componentes o cambiar de página
export const cleanupWebSockets = () => {
  Object.keys(activeWebSockets).forEach(key => {
    closeWebSocketConnection(key);
  });
};

// Exportar para uso en el frontend
export default {
  getMarketData,
  getBatchMarketData,
  subscribeToRealTimeUpdates,
  cleanupWebSockets
}; 