/**
 * Simulador de precios de mercado para fallback automático
 * Se activa cuando la API de Binance falla (errores de red, códigos HTTP 451, 429, etc.)
 */

// Cache de precios para mantener consistencia durante la ejecución del servidor
const priceCache = new Map<string, number>();
const lastUpdateTime = new Map<string, number>();

// Precios base actualizados con datos reales de Binance - 17/6/2025
const BASE_PRICES: Record<string, number> = {
  'BTC': 104249.06,
  'ETH': 2497.81,
  'BNB': 646.21,
  'XRP': 2.18,
  'ADA': 0.61,
  'SOL': 147.54,
  'DOT': 3.72,
  'MATIC': 0.45, // Usamos precio por defecto ya que MATIC mostró 0 en Binance
  'LINK': 13.04,
  'DOGE': 0.167,
  'AVAX': 18.64,
  'UNI': 7.35,
  'LTC': 84.06,
  'BCH': 463.40,
  'ATOM': 4.04,
  'ALGO': 0.17,
  'VET': 0.022,
  'FIL': 2.39,
  'TRX': 0.275,
  'ETC': 16.47,
  'MANA': 0.257,
  'SAND': 0.257,
  'SUSHI': 0.622,
  'AAVE': 266.49,
  'COMP': 51.65,
  'MKR': 2038.00,
  'SNX': 0.588,
  'YFI': 5051.00,
  'USDC': 1.0,
  'USDT': 1.0,
  'BUSD': 1.0,
  'DAI': 1.0
};

/**
 * Genera un precio simulado para un símbolo específico
 * Mantiene variaciones realistas y persistencia durante la ejecución
 */
export function getSimulatedPrice(symbol: string): number {
  // Normalizar símbolo (remover USDT si existe)
  const baseSymbol = symbol.replace(/USDT$/i, '').toUpperCase();
  
  // Obtener precio actual del cache
  let currentPrice = priceCache.get(baseSymbol);
  const lastUpdate = lastUpdateTime.get(baseSymbol) || 0;
  const now = Date.now();
  
  // Inicializar precio si no existe
  if (!currentPrice) {
    currentPrice = BASE_PRICES[baseSymbol] || 100;
    priceCache.set(baseSymbol, currentPrice);
    lastUpdateTime.set(baseSymbol, now);
    return parseFloat(currentPrice.toFixed(8));
  }
  
  // Solo actualizar si han pasado al menos 5 segundos
  if (now - lastUpdate < 5000) {
    return parseFloat(currentPrice.toFixed(8));
  }
  
  // Generar variación realista basada en el tipo de activo
  let maxVariation = 0.002; // 0.2% por defecto
  
  // Ajustar variación según el tipo de activo
  if (['BTC', 'ETH'].includes(baseSymbol)) {
    maxVariation = 0.001; // 0.1% para criptos principales
  } else if (['USDC', 'USDT', 'BUSD', 'DAI'].includes(baseSymbol)) {
    maxVariation = 0.0001; // 0.01% para stablecoins
  } else if (BASE_PRICES[baseSymbol] && BASE_PRICES[baseSymbol] < 1) {
    maxVariation = 0.005; // 0.5% para altcoins de bajo precio
  }
  
  // Aplicar variación aleatoria suave
  const variation = (Math.random() - 0.5) * 2 * maxVariation;
  const newPrice = currentPrice * (1 + variation);
  
  // Asegurar que el precio nunca sea negativo o cero
  const finalPrice = Math.max(newPrice, 0.00000001);
  
  // Actualizar cache
  priceCache.set(baseSymbol, finalPrice);
  lastUpdateTime.set(baseSymbol, now);
  
  return parseFloat(finalPrice.toFixed(8));
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
  
  // Generar cambio 24h simulado (-5% a +5%)
  const change24h = (Math.random() - 0.5) * 10;
  
  // Generar volumen simulado basado en el tipo de activo
  let baseVolume = 1000000;
  if (['BTC', 'ETH'].includes(baseSymbol)) {
    baseVolume = 50000000;
  } else if (BASE_PRICES[baseSymbol] && BASE_PRICES[baseSymbol] < 1) {
    baseVolume = 10000000;
  }
  
  const volume = baseVolume * (0.5 + Math.random());
  
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
    
    const symbols = Object.keys(BASE_PRICES).filter(s => !['USDC', 'USDT', 'BUSD', 'DAI'].includes(s));
    const fullSymbols = symbols.map(s => `${s}USDT`);
    
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
 * Resetea el cache de precios (útil para testing)
 */
export function resetPriceCache(): void {
  priceCache.clear();
  lastUpdateTime.clear();
}

/**
 * Obtiene el estado actual del cache (útil para debugging)
 */
export function getCacheStatus(): { symbols: string[]; cacheSize: number; basePrices: Record<string, number> } {
  return {
    symbols: Array.from(priceCache.keys()),
    cacheSize: priceCache.size,
    basePrices: { ...BASE_PRICES }
  };
} 