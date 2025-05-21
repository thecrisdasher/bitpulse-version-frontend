import { 
  WEBSOCKET_CONFIG, 
  NO_WEBSOCKET_SUPPORT,
  API_PROVIDERS 
} from './apiConfig';

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
  
  // Verificar en la lista explícita de sin soporte
  if (NO_WEBSOCKET_SUPPORT.includes(normalizedSymbol)) {
    return false;
  }
  
  // Verificar por categoría/prefijo
  if (
    normalizedSymbol.startsWith('vol') || 
    (category === 'baskets' && normalizedSymbol.includes('enrg')) ||
    normalizedSymbol.includes('crash') ||
    normalizedSymbol.includes('boom')
  ) {
    return false;
  }
  
  return true;
};

/**
 * Generar URL de WebSocket para un instrumento
 */
export const getWebSocketUrlForInstrument = (
  symbol: string, 
  category: string, 
  provider?: string
): string | null => {
  // Normalizar el símbolo para usar en URLs
  const normalizedSymbol = symbol.toLowerCase();
  
  // Si no tiene soporte de WebSocket, devolver null
  if (!hasWebSocketSupport(symbol, category)) {
    return null;
  }
  
  // Determinar qué proveedor usar
  let targetProvider = provider || '';
  
  if (!targetProvider) {
    // Determinar el proveedor basado en la categoría
    const categoryKey = category.toUpperCase() as keyof typeof API_PROVIDERS;
    targetProvider = API_PROVIDERS[categoryKey]?.[0] || '';
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
      // Para forex o índices
      return `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY}&symbols=${symbol}`;
      
    case 'DERIV':
      if (category === 'derivados' || category === 'sinteticos') {
        return `wss://ws.deriv.com/v3/${normalizedSymbol}`;
      } else if (category === 'baskets') {
        return `wss://ws.deriv.com/v3/basket/${normalizedSymbol}`;
      }
      return null;
      
    case 'YAHOO_FINANCE':
      // Yahoo Finance no ofrece WebSockets públicos
      return null;
      
    default:
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
  
  switch (provider.toUpperCase()) {
    case 'BINANCE':
      return JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${normalizedSymbol}@ticker`],
        id: Date.now()
      });
      
    case 'TWELVE_DATA':
      return JSON.stringify({
        action: 'subscribe',
        params: {
          symbols: [symbol]
        }
      });
      
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
  private state: WebsocketState = {
    isConnecting: false,
    isConnected: false,
    reconnectAttempts: 0,
    lastMessageTime: 0
  };
  
  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
      reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
      ...options
    };
  }
  
  /**
   * Conectar al WebSocket
   */
  public connect(): void {
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
    console.error(`WebSocket error: ${error}`);
    
    // Ejecutar callback de error si existe
    if (this.options.onError) {
      this.options.onError(error);
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
  }
} 