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
}

// API keys - En producción, deberían estar en variables de entorno
const ALPHA_VANTAGE_API_KEY = '25HADAI1ZLYMUH8M'; // Alpha Vantage API key
const COIN_API_KEY = 'demo'; // Reemplazar con tu API key
const TWELVE_DATA_API_KEY = 'b54235cde5b640a3b9e3fc3a45f7881b'; // TwelveData API key

// Cache para almacenar datos y reducir llamadas a la API
const dataCache: Record<string, {
  data: MarketData;
  timestamp: number;
  ttl: number;
}> = {};

// Función para verificar si los datos en caché son válidos
const isCacheValid = (symbol: string, ttlMs: number = 60000): boolean => {
  if (!dataCache[symbol]) return false;
  const now = Date.now();
  return now - dataCache[symbol].timestamp < ttlMs;
};

// Función para obtener datos de criptomonedas (usando CoinCap API - gratuita y sin API key)
export const getCryptoMarketData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `crypto-${symbol.toLowerCase()}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 30000)) { // TTL de 30 segundos para cripto
    return dataCache[cacheKey].data;
  }
  
  try {
    // Convertir símbolos como BTC/USD a formato de CoinCap (bitcoin)
    const coinId = symbol.split('/')[0].toLowerCase();
    
    // Obtener datos actuales
    const response = await axios.get(
      `https://api.coincap.io/v2/assets/${coinId}`
    );
    
    if (!response.data || !response.data.data) {
      throw new Error(`No se encontraron datos para ${symbol}`);
    }
    
    const coinData = response.data.data;
    
    // Obtener datos históricos (últimas 24 horas)
    const historyResponse = await axios.get(
      `https://api.coincap.io/v2/assets/${coinId}/history?interval=h1&start=${Date.now() - 24 * 60 * 60 * 1000}&end=${Date.now()}`
    );
    
    if (!historyResponse.data || !historyResponse.data.data) {
      throw new Error(`No se encontraron datos históricos para ${symbol}`);
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
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 30000,
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error fetching crypto data for ${symbol}:`, error);
    throw new Error(`No se pudieron obtener datos para ${symbol}`);
  }
};

// Función para obtener datos de Forex (usando Alpha Vantage API)
export const getForexMarketData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `forex-${symbol.replace('/', '')}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para forex
    return dataCache[cacheKey].data;
  }
  
  try {
    // Parsear el símbolo (por ejemplo, EUR/USD a EURUSD)
    const formattedSymbol = symbol.replace('/', '');
    
    // Obtener datos de forex
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.split('/')[0]}&to_symbol=${symbol.split('/')[1]}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.data || !response.data['Time Series FX (Daily)']) {
      throw new Error('Invalid API response');
    }
    
    const timeSeries = response.data['Time Series FX (Daily)'];
    const dates = Object.keys(timeSeries).sort().reverse();
    
    // Extraer el precio actual y el cambio
    const currentPrice = parseFloat(timeSeries[dates[0]]['4. close']) * 4200; // Convertir a COP
    const previousPrice = parseFloat(timeSeries[dates[1]]['4. close']) * 4200;
    const change24h = currentPrice - previousPrice;
    const changePercent24h = (change24h / previousPrice) * 100;
    
    // Crear historial de precios
    const priceHistory: MarketDataPoint[] = dates.slice(0, 24).map(date => ({
      timestamp: new Date(date).getTime(),
      price: parseFloat(timeSeries[date]['4. close']) * 4200,
    }));
    
    const marketData: MarketData = {
      symbol,
      name: `${symbol.split('/')[0]} / ${symbol.split('/')[1]}`,
      currentPrice,
      change24h,
      changePercent24h,
      priceHistory,
      lastUpdated: Date.now(),
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error fetching forex data for ${symbol}:`, error);
    throw new Error(`No se pudieron obtener datos para ${symbol}`);
  }
};

// Función para obtener datos de índices bursátiles (usando Twelve Data API)
export const getStockIndexData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `index-${symbol}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para índices
    return dataCache[cacheKey].data;
  }
  
  try {
    // Obtener datos actuales
    const response = await axios.get(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
    );
    
    // Obtener datos históricos
    const historyResponse = await axios.get(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${TWELVE_DATA_API_KEY}`
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
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error fetching stock index data for ${symbol}:`, error);
    throw new Error(`No se pudieron obtener datos para ${symbol}`);
  }
};

// Función para obtener datos de materias primas (usando Alpha Vantage)
export const getCommodityData = async (symbol: string): Promise<MarketData> => {
  const cacheKey = `commodity-${symbol}`;
  
  // Verificar si hay datos en caché válidos
  if (isCacheValid(cacheKey, 60000)) { // TTL de 60 segundos para materias primas
    return dataCache[cacheKey].data;
  }
  
  try {
    // Mapear símbolos a IDs de Alpha Vantage
    const commodityMap: Record<string, string> = {
      'XAU/USD': 'GOLD',
      'XAG/USD': 'SILVER',
      'OIL': 'WTI',
      'NGAS': 'NATURAL_GAS',
    };
    
    const alphaVantageSymbol = commodityMap[symbol] || symbol;
    
    // Obtener datos diarios
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${alphaVantageSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.data || !response.data['Time Series (Daily)']) {
      throw new Error('Invalid API response');
    }
    
    const timeSeries = response.data['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).sort().reverse();
    
    // Extraer el precio actual y el cambio
    const currentPrice = parseFloat(timeSeries[dates[0]]['4. close']) * 4200; // Convertir a COP
    const previousPrice = parseFloat(timeSeries[dates[1]]['4. close']) * 4200;
    const change24h = currentPrice - previousPrice;
    const changePercent24h = (change24h / previousPrice) * 100;
    
    // Crear historial de precios
    const priceHistory: MarketDataPoint[] = dates.slice(0, 24).map(date => ({
      timestamp: new Date(date).getTime(),
      price: parseFloat(timeSeries[date]['4. close']) * 4200,
    }));
    
    const marketData: MarketData = {
      symbol,
      name: getCommodityName(symbol),
      currentPrice,
      change24h,
      changePercent24h,
      priceHistory,
      lastUpdated: Date.now(),
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error fetching commodity data for ${symbol}:`, error);
    throw new Error(`No se pudieron obtener datos para ${symbol}`);
  }
};

// Función para obtener datos sintéticos para índices Volatility, Boom y Crash
// Ya que estos son productos específicos de brokers y no hay API públicas
export const getSyntheticMarketData = async (
  symbol: string, 
  baseValue: number, 
  category: 'volatility' | 'boom' | 'crash'
): Promise<MarketData> => {
  const cacheKey = `synthetic-${symbol}`;
  
  // Estos datos se regeneran más frecuentemente
  if (isCacheValid(cacheKey, 5000)) { // TTL de 5 segundos
    return dataCache[cacheKey].data;
  }
  
  try {
    // Generamos datos sintéticos pero realistas
    const volatility = category === 'volatility' ? 0.002 : 
                        category === 'boom' ? 0.001 : 0.0015;
    
    const bias = category === 'boom' ? 0.0005 : 
                  category === 'crash' ? -0.0005 : 0;
    
    // Precio actual con pequeña variación aleatoria
    const randomFactor = (Math.random() * volatility * 2) - volatility + bias;
    const currentPrice = baseValue * (1 + randomFactor);
    
    // Generamos un historial de precios simulado para las últimas 24 horas
    const priceHistory: MarketDataPoint[] = [];
    const now = Date.now();
    let price = currentPrice;
    
    for (let i = 24; i >= 0; i--) {
      const timeFactor = Math.sin(i / 8) * volatility; // Patrón de ondas
      const randFactor = (Math.random() * volatility) - (volatility / 2) + bias;
      price = price / (1 + randFactor + timeFactor);
      
      priceHistory.unshift({
        timestamp: now - (i * 60 * 60 * 1000),
        price,
      });
    }
    
    // Calcular cambio en 24h
    const change24h = currentPrice - priceHistory[0].price;
    const changePercent24h = (change24h / priceHistory[0].price) * 100;
    
    const marketData: MarketData = {
      symbol,
      name: `Índice ${symbol.toUpperCase()}`,
      currentPrice,
      change24h,
      changePercent24h,
      priceHistory,
      lastUpdated: Date.now(),
    };
    
    // Guardar en caché
    dataCache[cacheKey] = {
      data: marketData,
      timestamp: Date.now(),
      ttl: 5000,
    };
    
    return marketData;
  } catch (error) {
    console.error(`Error generating synthetic data for ${symbol}:`, error);
    throw new Error(`No se pudieron generar datos para ${symbol}`);
  }
};

// Función para obtener el nombre de la materia prima
const getCommodityName = (symbol: string): string => {
  const commodityNames: Record<string, string> = {
    'XAU/USD': 'Oro',
    'XAG/USD': 'Plata',
    'OIL': 'Petróleo Crudo',
    'NGAS': 'Gas Natural',
  };
  
  return commodityNames[symbol] || symbol;
};

// Función principal para obtener datos de cualquier mercado
export const getMarketData = async (
  symbol: string, 
  category: string,
  baseValue?: number
): Promise<MarketData> => {
  try {
    switch (category) {
      case 'cripto':
        return await getCryptoMarketData(symbol);
      case 'forex':
        return await getForexMarketData(symbol);
      case 'indices':
        return await getStockIndexData(symbol);
      case 'materias-primas':
        return await getCommodityData(symbol);
      case 'volatility':
        return await getSyntheticMarketData(symbol, baseValue || 500, 'volatility');
      case 'boom':
        return await getSyntheticMarketData(symbol, baseValue || 500, 'boom');
      case 'crash':
        return await getSyntheticMarketData(symbol, baseValue || 500, 'crash');
      default:
        throw new Error(`Categoría de mercado no soportada: ${category}`);
    }
  } catch (error) {
    console.error(`Error obteniendo datos de mercado para ${symbol}:`, error);
    throw error;
  }
};

// Función para obtener datos de varios mercados en paralelo
export const getBatchMarketData = async (
  requests: Array<{symbol: string; category: string; baseValue?: number}>
): Promise<Record<string, MarketData>> => {
  try {
    const results = await Promise.allSettled(
      requests.map(req => getMarketData(req.symbol, req.category, req.baseValue))
    );
    
    const data: Record<string, MarketData> = {};
    
    results.forEach((result, index) => {
      const symbol = requests[index].symbol;
      if (result.status === 'fulfilled') {
        data[symbol] = result.value;
      } else {
        console.error(`Error fetching data for ${symbol}:`, result.reason);
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching batch market data:', error);
    throw error;
  }
}; 