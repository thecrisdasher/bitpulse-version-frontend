import { MarketData } from './marketDataService';

// TTL predeterminado de caché en milisegundos
const DEFAULT_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 horas

// Prefijo para almacenamiento en localStorage
const CACHE_PREFIX = 'bitpulse_market_data_';

// Interfaz para los datos almacenados en caché
interface CachedData {
  data: MarketData;
  timestamp: number;
  expiresAt: number;
}

/**
 * Guarda datos de mercado en localStorage
 */
export const cacheMarketData = (symbol: string, category: string, data: MarketData, ttlMs: number = DEFAULT_CACHE_TTL): void => {
  try {
    if (typeof window === 'undefined') return; // No ejecutar en servidor
    
    const key = `${CACHE_PREFIX}${category}_${symbol.toLowerCase()}`;
    const cacheEntry: CachedData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    
    // También guardamos un índice de todas las claves almacenadas
    const cachedKeys = getCachedKeys();
    if (!cachedKeys.includes(key)) {
      cachedKeys.push(key);
      localStorage.setItem(`${CACHE_PREFIX}index`, JSON.stringify(cachedKeys));
    }
  } catch (error) {
    console.warn('Error al guardar datos en caché:', error);
  }
};

/**
 * Recupera datos de mercado de localStorage
 */
export const getCachedMarketData = (symbol: string, category: string): MarketData | null => {
  try {
    if (typeof window === 'undefined') return null; // No ejecutar en servidor
    
    const key = `${CACHE_PREFIX}${category}_${symbol.toLowerCase()}`;
    const cachedJson = localStorage.getItem(key);
    
    if (!cachedJson) return null;
    
    const cached: CachedData = JSON.parse(cachedJson);
    
    // Verificar si los datos están expirados
    if (Date.now() > cached.expiresAt) {
      // Aún devolvemos los datos expirados, pero los marcamos como no en tiempo real
      return {
        ...cached.data,
        isRealTime: false,
        lastUpdated: cached.timestamp
      };
    }
    
    return cached.data;
  } catch (error) {
    console.warn('Error al leer datos de caché:', error);
    return null;
  }
};

/**
 * Obtener todas las claves almacenadas en caché
 */
export const getCachedKeys = (): string[] => {
  try {
    if (typeof window === 'undefined') return []; // No ejecutar en servidor
    
    const cachedKeysJson = localStorage.getItem(`${CACHE_PREFIX}index`);
    return cachedKeysJson ? JSON.parse(cachedKeysJson) : [];
  } catch {
    return [];
  }
};

/**
 * Limpia datos de caché antiguos (llama periódicamente para liberar espacio)
 */
export const cleanupExpiredCache = (): void => {
  try {
    if (typeof window === 'undefined') return; // No ejecutar en servidor
    
    const cachedKeys = getCachedKeys();
    const now = Date.now();
    const validKeys: string[] = [];
    
    cachedKeys.forEach(key => {
      const cachedJson = localStorage.getItem(key);
      if (cachedJson) {
        const cached: CachedData = JSON.parse(cachedJson);
        if (now > cached.expiresAt + (7 * 24 * 60 * 60 * 1000)) {
          // Si los datos tienen más de 7 días de expirados, eliminarlos
          localStorage.removeItem(key);
        } else {
          validKeys.push(key);
        }
      }
    });
    
    // Actualizar índice
    localStorage.setItem(`${CACHE_PREFIX}index`, JSON.stringify(validKeys));
  } catch (error) {
    console.warn('Error al limpiar caché:', error);
  }
};

/**
 * Función para inicializar la limpieza periódica de caché
 */
export const initCacheCleanup = (): (() => void) => {
  // Limpiar caché cada 24 horas
  const interval = setInterval(cleanupExpiredCache, 24 * 60 * 60 * 1000);
  
  // Devolver función para cancelar la limpieza
  return () => clearInterval(interval);
}; 