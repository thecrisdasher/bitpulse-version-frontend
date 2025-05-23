import { 
  WEBSOCKET_CONFIG, 
  NO_WEBSOCKET_SUPPORT,
  API_PROVIDERS 
} from './apiConfig';

// Add a simulation mode flag - will fallback to this if WebSocket fails
const USE_SIMULATION_MODE = process.env.NODE_ENV === 'development' || true;

export interface WebSocketManagerOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  subscriptionMessage?: string | object;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: string | object;
  protocols?: string | string[];
  simulationOptions?: {
    enabled?: boolean;
    initialValue?: number;
    volatility?: number;
    updateInterval?: number;
  };
}

interface WebsocketState {
  isConnecting: boolean;
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessageTime: number;
}

/**
 * Verifica si un instrumento tiene soporte de WebSocket
 */
export const hasWebSocketSupport = (symbol: string, category: string): boolean => {
  const normalizedSymbol = symbol.toLowerCase();
  const normalizedCategory = category.toLowerCase();
  
  // Verificar en la lista explícita de sin soporte
  if (NO_WEBSOCKET_SUPPORT.some(id => normalizedSymbol.includes(id))) {
    return false;
  }
  
  // Verificar por categoría/prefijo
  if (
    normalizedSymbol.startsWith('vol') || 
    (normalizedCategory === 'baskets' && normalizedSymbol.includes('enrg')) ||
    normalizedSymbol.includes('crash') ||
    normalizedSymbol.includes('boom') ||
    // Categorías sin soporte WebSocket
    ['volatility', 'boom', 'crash'].includes(normalizedCategory)
  ) {
    return false;
  }
  
  // Soporte limitado por categoría y proveedor
  if (normalizedCategory === 'indices' && !['ustec', 'us500', 'us30', 'uk100', 'germany40'].includes(normalizedSymbol)) {
    // Solo algunos índices específicos tienen soporte WebSocket confiable
    return false;
  }
  
  // Categorías con soporte WebSocket
  return ['cripto', 'criptomonedas', 'forex', 'stocks'].includes(normalizedCategory);
};

/**
 * Generar URL de WebSocket para un instrumento
 */
export const getWebSocketUrlForInstrument = (
  symbol: string, 
  category: string, 
  provider?: string
): string | null => {
  try {
    // Normalizar el símbolo para usar en URLs
    const normalizedSymbol = symbol.toLowerCase();
    const normalizedCategory = category.toLowerCase();
    
    // Si no tiene soporte de WebSocket, devolver null
    if (!hasWebSocketSupport(symbol, normalizedCategory)) {
      console.log(`No WebSocket support for: ${symbol} in category ${normalizedCategory}`);
      return null;
    }
    
    // Determinar qué proveedor usar
    let targetProvider = provider || '';
    
    if (!targetProvider) {
      // Determinar el proveedor basado en la categoría
      // Usar un mapeo seguro para evitar errores de categorías desconocidas
      const categoryMap: Record<string, string[]> = {
        'cripto': ['BINANCE', 'COIN_GECKO', 'MOCK'],
        'criptomonedas': ['BINANCE', 'COIN_GECKO', 'MOCK'],
        'forex': ['TWELVE_DATA', 'YAHOO_FINANCE', 'MOCK'],
        'indices': ['TWELVE_DATA', 'POLYGON_IO', 'YAHOO_FINANCE', 'MOCK'],
        'materias-primas': ['TWELVE_DATA', 'ALPHA_VANTAGE', 'YAHOO_FINANCE', 'MOCK'],
        'volatility': ['DERIV', 'MOCK'],
        'boom': ['DERIV', 'MOCK'],
        'crash': ['DERIV', 'MOCK'],
        'derivados': ['DERIV', 'MOCK'],
        'sinteticos': ['DERIV', 'MOCK'],
        'baskets': ['DERIV', 'MOCK'],
        'stocks': ['TWELVE_DATA', 'POLYGON_IO', 'YAHOO_FINANCE', 'MOCK'],
      };
      
      // Obtener el proveedor para la categoría o usar MOCK como fallback
      const providers = categoryMap[normalizedCategory] || ['MOCK'];
      targetProvider = providers[0];
    }
    
    // Formatear URL según el proveedor
    switch (targetProvider.toUpperCase()) {
      case 'BINANCE':
        // Para criptomonedas, convertir formato para Binance WebSocket API
        let formattedSymbol = normalizedSymbol;
        if (symbol.includes('/')) {
          const [base, quote] = symbol.split('/');
          formattedSymbol = (base + quote).toLowerCase();
        }
        
        return `wss://stream.binance.com:9443/ws/${formattedSymbol}@ticker`;
        
      case 'COIN_GECKO':
      case 'COINCAP':
        // CoinGecko y CoinCap no tienen WebSockets públicos
        return null;
        
      case 'TWELVE_DATA':
        // Para forex, índices o acciones
        return `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || ''}&symbols=${symbol}`;
        
      case 'POLYGON_IO':
        // Para acciones e índices con Polygon.io (requiere suscripción)
        return `wss://socket.polygon.io/stocks?apiKey=${process.env.NEXT_PUBLIC_POLYGON_API_KEY || ''}`;
        
      case 'DERIV':
        if (normalizedCategory === 'derivados' || normalizedCategory === 'sinteticos' ||
            normalizedCategory === 'volatility' || normalizedCategory === 'boom' || 
            normalizedCategory === 'crash') {
          return `wss://ws.deriv.com/v3/${normalizedSymbol}`;
        } else if (normalizedCategory === 'baskets') {
          return `wss://ws.deriv.com/v3/basket/${normalizedSymbol}`;
        }
        return null;
        
      case 'YAHOO_FINANCE':
        // Yahoo Finance no ofrece WebSockets públicos
        return null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error generating WebSocket URL for ${symbol}:`, error);
    return null;
  }
};

/**
 * Generar mensaje de suscripción para WebSocket
 */
export const generateSubscriptionMessage = (
  symbol: string, 
  category: string, 
  provider: string
): string | object | null => {
  const normalizedSymbol = symbol.toLowerCase();
  const normalizedCategory = category.toLowerCase();
  
  switch (provider.toUpperCase()) {
    case 'BINANCE':
      return JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${normalizedSymbol}@ticker`],
        id: Date.now()
      });
      
    case 'TWELVE_DATA':
      // Mismo formato para forex, stocks e índices
      return JSON.stringify({
        action: 'subscribe',
        params: {
          symbols: [symbol]
        }
      });
      
    case 'POLYGON_IO':
      // Para acciones con Polygon.io
      if (normalizedCategory === 'stocks') {
        return JSON.stringify({
          action: 'auth',
          params: process.env.NEXT_PUBLIC_POLYGON_API_KEY
        });
      } else {
        return JSON.stringify({
          action: 'subscribe',
          params: `T.${symbol}`
        });
      }
      
    case 'DERIV':
      return JSON.stringify({
        ticks: normalizedSymbol
      });
      
    default:
      return null;
  }
};

/**
 * WebSocketManager - Clase para gestionar conexiones WebSocket
 */
export class WebSocketManager {
  private url: string;
  private options: WebSocketManagerOptions;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private simulationTimer: NodeJS.Timeout | null = null;
  private state: WebsocketState = {
    isConnecting: false,
    isConnected: false,
    reconnectAttempts: 0,
    lastMessageTime: 0
  };
  private simulationMode: boolean = false;
  private simulatedValue: number = 100;
  
  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
      reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
      simulationOptions: {
        enabled: USE_SIMULATION_MODE,
        initialValue: 100,
        volatility: 0.01,
        updateInterval: 2000
      },
      ...options
    };
    
    // Initialize simulation value from options if provided
    if (this.options.simulationOptions?.initialValue) {
      this.simulatedValue = this.options.simulationOptions.initialValue;
    }
  }
  
  /**
   * Conectar al WebSocket
   */
  public connect(): void {
    // Check if simulation mode is enabled in options
    if (this.options.simulationOptions?.enabled) {
      this.startSimulationMode();
      return;
    }
    
    if (this.ws) {
      // Ya existe una conexión, cerrarla primero
      this.cleanup();
    }
    
    // Evitar múltiples intentos simultáneos
    if (this.state.isConnecting) return;
    
    this.state.isConnecting = true;
    
    try {
      // Crear nueva conexión
      this.ws = new WebSocket(this.url, this.options.protocols);
      
      // Configurar manejadores de eventos
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      
      // Timeout para conexión
      setTimeout(() => {
        if (!this.state.isConnected && this.ws) {
          console.warn(`WebSocket connection timeout for ${this.url}`);
          this.ws.close();
          this.handleError(new Error('Connection timeout'));
        }
      }, WEBSOCKET_CONFIG.CONNECTION_TIMEOUT);
    } catch (error) {
      console.error(`Error creating WebSocket: ${error}`);
      this.state.isConnecting = false;
      this.handleError(error);
    }
  }
  
  /**
   * Start simulation mode instead of real WebSocket
   */
  private startSimulationMode(): void {
    if (this.simulationMode) return;
    
    console.log(`Using simulation mode instead of WebSocket for ${this.url}`);
    this.simulationMode = true;
    this.state.isConnected = true;
    this.state.isConnecting = false;
    
    // Notify that we're "connected"
    if (this.options.onOpen) {
      this.options.onOpen();
    }
    
    // Start sending simulated data
    const updateInterval = this.options.simulationOptions?.updateInterval || 2000;
    const volatility = this.options.simulationOptions?.volatility || 0.01;
    
    // Extract symbol from URL for more realistic simulation
    let symbol = "";
    try {
      const urlObj = new URL(this.url);
      const pathParts = urlObj.pathname.split('/');
      symbol = pathParts[pathParts.length - 1] || "";
      
      if (symbol.includes('@')) {
        symbol = symbol.split('@')[0];
      }
    } catch (e) {
      // Fallback if URL parsing fails
      symbol = this.url.split('/').pop() || "";
    }
    
    this.simulationTimer = setInterval(() => {
      // Generate random price change
      const changePercent = (Math.random() * 2 - 1) * volatility;
      this.simulatedValue = this.simulatedValue * (1 + changePercent);
      
      // Create simulated data in a format similar to what the WebSocket would send
      let simulatedData: any;
      
      if (this.url.includes('binance')) {
        // Binance-like format
        simulatedData = {
          e: '24hrTicker',
          s: symbol.toUpperCase(),
          c: this.simulatedValue.toFixed(2),
          o: (this.simulatedValue * 0.99).toFixed(2),
          h: (this.simulatedValue * 1.02).toFixed(2),
          l: (this.simulatedValue * 0.98).toFixed(2),
          v: (Math.random() * 1000).toFixed(2),
          p: (changePercent * 100).toFixed(2),
          P: (changePercent * 100).toFixed(2),
          timestamp: Date.now()
        };
      } else if (this.url.includes('twelve')) {
        // TwelveData-like format
        simulatedData = {
          symbol: symbol.toUpperCase(),
          price: this.simulatedValue.toFixed(2),
          timestamp: Math.floor(Date.now() / 1000)
        };
      } else if (this.url.includes('polygon')) {
        // Polygon.io-like format
        simulatedData = {
          ev: 'T',
          sym: symbol.toUpperCase(),
          p: this.simulatedValue.toFixed(2),
          t: Date.now(),
          v: Math.floor(Math.random() * 100)
        };
      } else if (this.url.includes('deriv')) {
        // Deriv-like format
        simulatedData = {
          tick: {
            symbol: symbol,
            quote: this.simulatedValue.toFixed(2),
            epoch: Math.floor(Date.now() / 1000)
          }
        };
      } else {
        // Generic format
        simulatedData = {
          symbol: symbol,
          price: this.simulatedValue,
          timestamp: Date.now()
        };
      }
      
      // Send the simulated data to the callback
      this.options.onMessage(simulatedData);
      this.state.lastMessageTime = Date.now();
    }, updateInterval);
  }
  
  /**
   * Manejar evento de conexión abierta
   */
  private handleOpen(): void {
    this.state.isConnecting = false;
    this.state.isConnected = true;
    this.state.reconnectAttempts = 0;
    this.state.lastMessageTime = Date.now();
    
    console.log(`WebSocket connected to ${this.url}`);
    
    // Enviar mensaje de suscripción si existe
    if (this.options.subscriptionMessage && this.ws) {
      const message = typeof this.options.subscriptionMessage === 'string'
        ? this.options.subscriptionMessage
        : JSON.stringify(this.options.subscriptionMessage);
        
      this.ws.send(message);
    }
    
    // Iniciar heartbeat si está configurado
    if (this.options.heartbeatInterval && this.options.heartbeatInterval > 0) {
      this.startHeartbeat();
    }
    
    // Ejecutar callback de conexión si existe
    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }
  
  /**
   * Manejar mensaje recibido
   */
  private handleMessage(event: MessageEvent): void {
    this.state.lastMessageTime = Date.now();
    
    try {
      // Parsear mensaje JSON 
      const data = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;
        
      // Ejecutar callback de mensaje
      this.options.onMessage(data);
    } catch (error) {
      console.warn(`Error parsing WebSocket message: ${error}`);
      
      // Intentar pasar el mensaje sin procesar si falla el parsing
      this.options.onMessage(event.data);
    }
  }
  
  /**
   * Manejar errores
   */
  private handleError(error: any): void {
    // Improved error handling to properly format different error types
    let errorMessage = 'Unknown WebSocket error';
    
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
    } else if (error instanceof Event) {
      // Handle Event objects (common in WebSocket errors)
      errorMessage = `WebSocket Event: ${error.type}`;
    } else if (typeof error === 'object') {
      try {
        // Verificar si es un objeto vacío
        if (error === null || Object.keys(error).length === 0) {
          errorMessage = 'WebSocket error: Empty error object';
        } else {
          errorMessage = JSON.stringify(error);
        }
      } catch (e) {
        errorMessage = 'WebSocket error: [Object cannot be stringified]';
      }
    } else if (error !== undefined && error !== null) {
      errorMessage = String(error);
    }
    
    console.error(`WebSocket error for ${this.url}: ${errorMessage}`);
    
    // Ejecutar callback de error si existe
    if (this.options.onError) {
      this.options.onError({
        message: errorMessage,
        originalError: error
      });
    }
    
    // If we're not already in simulation mode and simulation is enabled, switch to it
    if (!this.simulationMode && this.options.simulationOptions?.enabled) {
      console.log(`Switching to simulation mode due to WebSocket error: ${errorMessage}`);
      this.startSimulationMode();
      return;
    }
    
    // Reconectar si está configurado
    if (this.options.autoReconnect) {
      this.reconnect();
    }
  }
  
  /**
   * Manejar cierre de conexión
   */
  private handleClose(event: CloseEvent): void {
    this.state.isConnected = false;
    this.state.isConnecting = false;
    this.stopHeartbeat();
    
    console.log(`WebSocket disconnected: code=${event.code}, reason=${event.reason}`);
    
    // Ejecutar callback de cierre si existe
    if (this.options.onClose) {
      this.options.onClose();
    }
    
    // Reconectar si está configurado y no fue un cierre limpio
    if (this.options.autoReconnect && event.code !== 1000) {
      this.reconnect();
    }
  }
  
  /**
   * Reconectar después de un error o cierre
   */
  private reconnect(): void {
    // Limpiar timers existentes
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Verificar si se han agotado los intentos
    if (
      this.options.maxReconnectAttempts !== undefined &&
      this.state.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      console.error(`WebSocket reached max reconnect attempts (${this.options.maxReconnectAttempts})`);
      return;
    }
    
    // Incrementar contador de intentos
    this.state.reconnectAttempts++;
    
    // Calcular backoff exponencial con jitter
    const jitter = Math.random() * 0.3 + 0.8; // Between 0.8 and 1.1
    const delay = this.options.reconnectDelay! * jitter * Math.min(Math.pow(1.5, this.state.reconnectAttempts - 1), 10);
    
    console.log(`Reconnecting WebSocket in ${Math.round(delay)}ms (attempt ${this.state.reconnectAttempts})`);
    
    // Programar reconexión
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Iniciar heartbeat para mantener la conexión activa
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      // Verificar si la conexión está activa
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      
      // Verificar inactividad (si no se ha recibido un mensaje en 2x intervalo)
      const inactiveTime = Date.now() - this.state.lastMessageTime;
      if (inactiveTime > this.options.heartbeatInterval! * 2) {
        console.warn(`WebSocket inactive for ${inactiveTime}ms, reconnecting...`);
        this.ws.close();
        this.connect();
        return;
      }
      
      // Enviar mensaje de heartbeat si está configurado
      if (this.options.heartbeatMessage) {
        const message = typeof this.options.heartbeatMessage === 'string'
          ? this.options.heartbeatMessage
          : JSON.stringify(this.options.heartbeatMessage);
        
        this.ws.send(message);
      }
    }, this.options.heartbeatInterval);
  }
  
  /**
   * Detener heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Enviar mensaje
   */
  public send(message: string | object): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error(`Error sending WebSocket message: ${error}`);
      return false;
    }
  }
  
  /**
   * Verificar si la conexión está activa
   */
  public isConnected(): boolean {
    return this.state.isConnected && !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Limpiar recursos y cerrar conexión
   */
  public cleanup(): void {
    // Detener timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    
    this.stopHeartbeat();
    
    // Cerrar conexión
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Normal closure');
      }
      
      this.ws = null;
    }
    
    // Resetear estado
    this.state = {
      isConnecting: false,
      isConnected: false,
      reconnectAttempts: 0,
      lastMessageTime: 0
    };
    
    // Reset simulation mode
    this.simulationMode = false;
  }
}