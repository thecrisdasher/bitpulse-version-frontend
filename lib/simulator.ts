/**
 * Simulador de precios de mercado para fallback automático
 * Se activa cuando la API de Binance falla (errores de red, códigos HTTP 451, 429, etc.)
 */

// Prices and market data simulation
// Map of base prices for crypto assets and other instruments in USD
const BASE_PRICES: Record<string, number> = {
  // Top cryptocurrencies (precios actualizados)
  'BTC': 104249,
  'ETH': 2497,
  'BNB': 646,
  'XRP': 2.18,
  'ADA': 0.61,
  'SOL': 147,
  'DOGE': 0.167,
  'DOT': 6.78,
  'LTC': 84,
  'LINK': 13.04,
  'MATIC': 0.89,
  'BCH': 463,
  'AVAX': 37.89,
  'ATOM': 4.04,
  'ALGO': 0.17,
  
  // Forex pairs (base currencies)
  'EUR': 1.09,
  'GBP': 1.27,
  'JPY': 0.0067,
  'AUD': 0.65,
  'CAD': 0.73,
  'CHF': 1.11,
  'NZD': 0.60,
  
  // Stock indices (in points, not USD)
  'US500': 5123,
  'NAS100': 17876,
  'US30': 38765,
  'UK100': 7654,
  'GER40': 16234,
  'JPN225': 32987,
  'AUS200': 7456,
  'FRA40': 7289,
  'ESP35': 9876,
  'US2000': 2134,
  
  // Individual stocks
  'AAPL': 192.53,
  'MSFT': 378.94,
  'GOOGL': 143.67,
  'AMZN': 145.23,
  'TSLA': 248.42,
  'NVDA': 487.56,
  'META': 342.89,
  'NFLX': 456.78,
  'DIS': 89.67,
  'JPM': 167.45,
  'KO': 58.34,
  'BAC': 32.45,
  
  // Commodities
  'GOLD': 2355,
  'SILVER': 27.65,
  'OIL': 73.42,
  'UKOIL': 76.89,
  'NGAS': 2.13,
  'COPPER': 4.23,
  'PLATINUM': 987,
  'PALLADIUM': 1234,
  'CORN': 442,
  'WHEAT': 608,
  'SUGAR': 23.45,
  'COFFEE': 178.90,
  
  // Baskets (simulated values)
  'TECH': 1234.56,
  'ENRG': 876.54,
  'FINT': 987.65,
  'HLTH': 1567.89,
  'GAME': 945.32,
  'AUTO': 1123.45,
  'REIT': 756.78,
  'AIML': 1789.23,
  'CRYP': 2134.56,
  
  // Synthetic instruments (special values)
  'VOL10': 234.56,
  'VOL25': 293.89,
  'VOL50': 587.32,
  'VOL75': 774.12,
  'VOL100': 1029.45,
  'BOOM300': 2345.67,
  'BOOM500': 2938.45,
  'BOOM1000': 5567.89,
  'CRASH300': 1615.32,
  'CRASH500': 2075.89,
  'CRASH1000': 2612.45,
  'STEP200': 108.67,
  'STEP500': 211.23,
  
  // Fallback
  'USDT': 1.0,
  'USD': 1.0
};

// Cache para precios simulados y timestamps
const priceCache = new Map<string, number>();
const lastUpdateTime = new Map<string, number>();
const priceMovementDirection = new Map<string, number>(); // 1 para arriba, -1 para abajo, 0 para neutro
const volatilityMultiplier = new Map<string, number>(); // Factor de volatilidad dinámico

// Configuración de volatilidad por categoría de mercado
const MARKET_VOLATILITY: Record<string, {
  baseVolatility: number;
  updateInterval: number;
  trendPersistence: number; // 0-1, qué tan probable es continuar la tendencia
  maxDeviation: number; // máximo porcentaje de desviación del precio base
}> = {
  'criptomonedas': {
    baseVolatility: 0.025, // 2.5% por actualización
    updateInterval: 3000, // 3 segundos
    trendPersistence: 0.6,
    maxDeviation: 0.5 // ±50%
  },
  'forex': {
    baseVolatility: 0.005, // 0.5% por actualización
    updateInterval: 2000, // 2 segundos
    trendPersistence: 0.7,
    maxDeviation: 0.1 // ±10%
  },
  'indices': {
    baseVolatility: 0.015, // 1.5% por actualización
    updateInterval: 4000, // 4 segundos
    trendPersistence: 0.65,
    maxDeviation: 0.3 // ±30%
  },
  'acciones': {
    baseVolatility: 0.02, // 2% por actualización
    updateInterval: 3500, // 3.5 segundos
    trendPersistence: 0.55,
    maxDeviation: 0.4 // ±40%
  },
  'materias-primas': {
    baseVolatility: 0.018, // 1.8% por actualización
    updateInterval: 5000, // 5 segundos
    trendPersistence: 0.6,
    maxDeviation: 0.35 // ±35%
  },
  'baskets': {
    baseVolatility: 0.012, // 1.2% por actualización
    updateInterval: 4500, // 4.5 segundos
    trendPersistence: 0.7,
    maxDeviation: 0.25 // ±25%
  },
  'derivados': {
    baseVolatility: 0.035, // 3.5% por actualización
    updateInterval: 1500, // 1.5 segundos
    trendPersistence: 0.45,
    maxDeviation: 0.6 // ±60%
  },
  'sinteticos': {
    baseVolatility: 0.045, // 4.5% por actualización
    updateInterval: 1000, // 1 segundo
    trendPersistence: 0.3,
    maxDeviation: 0.8 // ±80%
  }
};

// Función mejorada para determinar categoría del mercado
function getMarketCategory(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  
  // Criptomonedas
  if (['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'LTC', 'LINK', 'MATIC', 'BCH', 'AVAX', 'ATOM', 'ALGO'].includes(upperSymbol)) {
    return 'criptomonedas';
  }
  
  // Forex
  if (['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].includes(upperSymbol) || upperSymbol.includes('/')) {
    return 'forex';
  }
  
  // Índices
  if (['US500', 'NAS100', 'US30', 'UK100', 'GER40', 'JPN225', 'AUS200', 'FRA40', 'ESP35', 'US2000'].includes(upperSymbol)) {
    return 'indices';
  }
  
  // Acciones
  if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'DIS', 'JPM', 'KO', 'BAC'].includes(upperSymbol)) {
    return 'acciones';
  }
  
  // Materias primas
  if (['GOLD', 'SILVER', 'OIL', 'UKOIL', 'NGAS', 'COPPER', 'PLATINUM', 'PALLADIUM', 'CORN', 'WHEAT', 'SUGAR', 'COFFEE'].includes(upperSymbol)) {
    return 'materias-primas';
  }
  
  // Baskets
  if (['TECH', 'ENRG', 'FINT', 'HLTH', 'GAME', 'AUTO', 'REIT', 'AIML', 'CRYP'].includes(upperSymbol)) {
    return 'baskets';
  }
  
  // Sintéticos
  if (upperSymbol.includes('VOL') || upperSymbol.includes('BOOM') || upperSymbol.includes('CRASH') || upperSymbol.includes('STEP')) {
    return 'sinteticos';
  }
  
  // Derivados (por defecto para instrumentos no identificados)
  return 'derivados';
}

// Función para obtener precio simulado con movimiento realista
export function getSimulatedPrice(symbol: string): number {
  const cleanSymbol = symbol.replace(/USDT$/i, '').toUpperCase();
  const basePrice = BASE_PRICES[cleanSymbol] || 100;
  const category = getMarketCategory(cleanSymbol);
  const config = MARKET_VOLATILITY[category] || MARKET_VOLATILITY['derivados'];
  
  const now = Date.now();
  const lastUpdate = lastUpdateTime.get(cleanSymbol) || 0;
  
  // Si no ha pasado suficiente tiempo, devolver precio cacheado
  if (now - lastUpdate < config.updateInterval && priceCache.has(cleanSymbol)) {
    return priceCache.get(cleanSymbol)!;
  }
  
  // Obtener precio anterior o precio base
  const previousPrice = priceCache.get(cleanSymbol) || basePrice;
  const previousDirection = priceMovementDirection.get(cleanSymbol) || 0;
  const currentVolatility = volatilityMultiplier.get(cleanSymbol) || 1;
  
  // Determinar si continuar la tendencia
  const continuesTrend = Math.random() < config.trendPersistence;
  let direction: number;
  
  if (continuesTrend && previousDirection !== 0) {
    direction = previousDirection;
  } else {
    direction = Math.random() > 0.5 ? 1 : -1;
  }
  
  // Calcular cambio de precio
  const volatility = config.baseVolatility * currentVolatility;
  const randomFactor = 0.3 + Math.random() * 0.7; // 0.3 a 1.0
  const priceChange = previousPrice * volatility * direction * randomFactor;
  
  let newPrice = previousPrice + priceChange;
  
  // Aplicar límites de desviación del precio base
  const maxPrice = basePrice * (1 + config.maxDeviation);
  const minPrice = basePrice * (1 - config.maxDeviation);
  
  if (newPrice > maxPrice) {
    newPrice = maxPrice;
    direction = -1; // Forzar reversión
  } else if (newPrice < minPrice) {
    newPrice = minPrice;
    direction = 1; // Forzar reversión
  }
  
  // Asegurar precio mínimo positivo
  newPrice = Math.max(newPrice, basePrice * 0.01);
  
  // Actualizar cache y estado
  priceCache.set(cleanSymbol, newPrice);
  lastUpdateTime.set(cleanSymbol, now);
  priceMovementDirection.set(cleanSymbol, direction);
  
  // Actualizar multiplicador de volatilidad (simula eventos del mercado)
  if (Math.random() < 0.05) { // 5% probabilidad de evento de volatilidad
    const newVolatilityMultiplier = 0.5 + Math.random() * 2; // 0.5x a 2.5x
    volatilityMultiplier.set(cleanSymbol, newVolatilityMultiplier);
  }
  
  return newPrice;
}

/**
 * Genera datos de ticker simulados compatibles con la estructura de Binance
 */
export function getSimulatedTicker(symbol: string): {
  price: number;
  change24h: number;
  volume: number;
} {
  const price = getSimulatedPrice(symbol);
  const baseSymbol = symbol.replace(/USDT$/i, '').toUpperCase();
  const category = getMarketCategory(baseSymbol);
  
  // Calcular cambio 24h basado en la categoría
  const config = MARKET_VOLATILITY[category] || MARKET_VOLATILITY['derivados'];
  const maxDailyChange = config.baseVolatility * 24; // Simulado como 24 actualizaciones
  const change24h = (Math.random() - 0.5) * 2 * maxDailyChange * 100; // Convertir a porcentaje
  
  // Generar volumen realista basado en el tipo de activo
  let baseVolume = 1000000;
  
  switch (category) {
    case 'criptomonedas':
      if (['BTC', 'ETH'].includes(baseSymbol)) {
        baseVolume = 50000000;
      } else if (BASE_PRICES[baseSymbol] && BASE_PRICES[baseSymbol] < 1) {
        baseVolume = 100000000;
      } else {
        baseVolume = 10000000;
      }
      break;
    case 'forex':
      baseVolume = 500000000;
      break;
    case 'indices':
      baseVolume = 2000000;
      break;
    case 'acciones':
      baseVolume = 5000000;
      break;
    case 'materias-primas':
      baseVolume = 1500000;
      break;
    case 'baskets':
      baseVolume = 800000;
      break;
    default:
      baseVolume = 1000000;
  }
  
  const volume = baseVolume * (0.7 + Math.random() * 0.6); // Variación del 70% al 130%
  
  return {
    price,
    change24h,
    volume
  };
}

/**
 * Genera datos OHLC simulados para gráficos
 */
export function getSimulatedOHLC(symbol: string, intervals: number = 100): any[] {
  const currentPrice = getSimulatedPrice(symbol);
  const now = Date.now();
  const intervalMs = 60000; // 1 minuto por intervalo
  
  const ohlcData = [];
  
  for (let i = intervals - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const basePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variación
    
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.005);
    const close = basePrice * (1 + (Math.random() - 0.5) * 0.005);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 1000000 * (0.5 + Math.random());
    
    ohlcData.push([
      timestamp,
      open.toFixed(8),
      high.toFixed(8),
      low.toFixed(8),
      close.toFixed(8),
      volume.toFixed(2),
      timestamp + intervalMs - 1,
      (volume * ((open + close) / 2)).toFixed(2),
      Math.floor(Math.random() * 100),
      (volume * 0.5).toFixed(2),
      (volume * 0.5 * ((open + close) / 2)).toFixed(2),
      "0"
    ]);
  }
  
  return ohlcData;
}

/**
 * Actualiza los precios base con datos reales de Binance
 */
export async function updateBasePricesFromBinance(): Promise<boolean> {
  try {
    console.log('[Simulator] Updating base prices from Binance...');
    
    const symbols = Object.keys(BASE_PRICES).filter(s => !['USDC', 'USDT', 'BUSD', 'DAI', 'USD'].includes(s));
    const cryptoSymbols = symbols.filter(s => getMarketCategory(s) === 'criptomonedas');
    const fullSymbols = cryptoSymbols.map(s => `${s}USDT`);
    
    if (fullSymbols.length === 0) return false;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(fullSymbols))}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    let updatedCount = 0;
    
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const base = String(item.symbol).replace(/USDT$/i, '');
        const newPrice = parseFloat(item.lastPrice);
        
        if (BASE_PRICES[base] && !isNaN(newPrice) && newPrice > 0) {
          BASE_PRICES[base] = newPrice;
          // También actualizar el cache para que tome efecto inmediatamente
          priceCache.set(base, newPrice);
          lastUpdateTime.set(base, Date.now());
          updatedCount++;
        }
      });
      
      console.log(`[Simulator] Updated ${updatedCount} base prices from Binance`);
      return true;
    }
    
    return false;
    
  } catch (error: any) {
    console.warn(`[Simulator] Failed to update base prices: ${error.message}`);
    return false;
  }
}

/**
 * Forzar actualización de precio para obtener nuevo valor
 */
export function forceUpdatePrice(symbol: string): number {
  const cleanSymbol = symbol.replace(/USDT$/i, '').toUpperCase();
  lastUpdateTime.set(cleanSymbol, 0); // Forzar actualización
  return getSimulatedPrice(cleanSymbol);
}

/**
 * Obtener estadísticas del simulador
 */
export function getSimulatorStats() {
  return {
    cachedPrices: priceCache.size,
    activeSymbols: Array.from(priceCache.keys()),
    lastUpdateTimes: Object.fromEntries(lastUpdateTime),
    priceDirections: Object.fromEntries(priceMovementDirection),
    volatilityMultipliers: Object.fromEntries(volatilityMultiplier)
  };
}

// Auto-actualizar precios base desde Binance cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    updateBasePricesFromBinance().catch(console.warn);
  }, 5 * 60 * 1000);
} 