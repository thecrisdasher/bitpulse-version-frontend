// Configuración centralizada para APIs de datos financieros
// Incluye claves, URLs, tiempos de espera y opciones de fallback

// API Keys - en producción deben estar en variables de entorno
export const API_KEYS = {
  ALPHA_VANTAGE: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '25HADAI1ZLYMUH8M',
  COIN_API: process.env.NEXT_PUBLIC_COIN_API_KEY || 'B0D6-6AEF-9B0F-8C4A',
  TWELVE_DATA: process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || 'b54235cde5b640a3b9e3fc3a45f7881b',
  POLYGON_IO: process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'EVzYeGUGbj9y9q44j20w6YYbngre1q_w',
  COINMARKETCAP: process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY || 'b54235cde5b640a3b9e3fc3a45f7881b'
};

// Base URLs para las diferentes APIs
export const API_URLS = {
  COIN_GECKO: 'https://api.coingecko.com/api/v3',
  BINANCE: 'https://api.binance.com',
  TWELVE_DATA: 'https://api.twelvedata.com',
  COINCAP: 'https://api.coincap.io/v2',
  ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
  POLYGON_IO: 'https://api.polygon.io/v2',
  DERIV: 'https://deriv-api.deriv.com/api',
  YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance'
};

// URLs de proxy para desarrollo local (soluciona problemas de CORS)
export const PROXY_URLS = {
  COIN_GECKO: '/proxy/coingecko',
  BINANCE: '/proxy/binance',
  TWELVE_DATA: '/proxy/twelvedata',
  COINCAP: '/proxy/coincap',
  POLYGON_IO: '/proxy/polygon',
  ALPHA_VANTAGE: '/proxy/alphavantage',
  DERIV: '/proxy/deriv',
  YAHOO_FINANCE: '/proxy/yahoo'
};

// Configuración del cliente HTTP
export const HTTP_CONFIG = {
  DEFAULT_TIMEOUT: 12000,
  RETRY_ATTEMPTS: 3,
  INITIAL_BACKOFF: 300,  // ms
  MAX_BACKOFF: 10000,    // ms
  BATCH_SIZE: 5          // Número máximo de peticiones en paralelo
};

// Opciones de WebSocket
export const WEBSOCKET_CONFIG = {
  CONNECTION_TIMEOUT: 10000,  // ms
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,      // ms
  HEARTBEAT_INTERVAL: 30000   // ms
};

// APIs a usar por tipo de instrumento
export const API_PROVIDERS = {
  CRYPTO: ['COIN_GECKO', 'COINCAP', 'BINANCE', 'MOCK'],
  FOREX: ['TWELVE_DATA', 'ALPHA_VANTAGE', 'YAHOO_FINANCE', 'MOCK'],
  INDICES: ['TWELVE_DATA', 'POLYGON_IO', 'YAHOO_FINANCE', 'MOCK'],
  COMMODITIES: ['TWELVE_DATA', 'ALPHA_VANTAGE', 'YAHOO_FINANCE', 'MOCK'],
  SYNTHETIC: ['DERIV', 'MOCK'],
  STOCKS: ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK']
};

// Mapeo de instrumentos específicos a proveedores preferenciales
export const INSTRUMENT_API_MAPPING: Record<string, string[]> = {
  // Criptomonedas
  'BTC': ['BINANCE', 'COIN_GECKO', 'MOCK'],
  'ETH': ['BINANCE', 'COIN_GECKO', 'MOCK'],
  'BTC/USD': ['BINANCE', 'COIN_GECKO', 'MOCK'],
  'ETH/USD': ['BINANCE', 'COIN_GECKO', 'MOCK'],
  // Forex
  'EUR/USD': ['TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  // Índices
  'SPX': ['TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  // Instrumentos sintéticos
  'volatility-50': ['YAHOO_FINANCE', 'MOCK'], // Sin API disponible, usar simulador
  'volatility-75': ['YAHOO_FINANCE', 'MOCK'],
  // Acciones
  'AAPL': ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  'MSFT': ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  'AMZN': ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  'GOOGL': ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
  'NVDA': ['POLYGON_IO', 'TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK']
};

// Símbolos no compatibles con WebSockets
export const NO_WEBSOCKET_SUPPORT = [
  'vol50', 'vol75', 'vol100', 
  'baskets-enrg', 'crash-1000', 
  'boom-1000'
];

// Constante para control de simulación forzada (desarrollo/pruebas)
export const FORCE_MOCK_DATA = false;

// Cache TTL en milisegundos por tipo de instrumento
export const CACHE_TTL = {
  CRYPTO: 120000,      // 2 minutos
  FOREX: 300000,       // 5 minutos
  INDICES: 300000,     // 5 minutos
  COMMODITIES: 300000, // 5 minutos
  SYNTHETIC: 60000,    // 1 minuto
  STOCKS: 300000,      // 5 minutos
  DEFAULT: 300000      // 5 minutos
}; 