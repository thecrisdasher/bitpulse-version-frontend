import { BITSTAMP_CONFIG } from '../config/bitstampConfig';

export interface BitstampWebSocketConfig {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  onOpen?: () => void;
  maxRetries?: number;
  retryInterval?: number;
  heartbeatInterval?: number;
}

interface BitstampSubscription {
  event: string;
  data: {
    channel: string;
  };
}

export class BitstampWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private config: BitstampWebSocketConfig;
  private retryCount: number = 0;
  private maxRetries: number;
  private retryInterval: number;
  private lastMessageTime: number = Date.now();
  private pendingSubscriptions: Set<string> = new Set();
  private isReconnecting: boolean = false;

  constructor(config: BitstampWebSocketConfig = {}) {
    this.config = config;
    this.maxRetries = config.maxRetries || BITSTAMP_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS;
    this.retryInterval = config.retryInterval || BITSTAMP_CONFIG.WEBSOCKET.RECONNECT_INTERVAL;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;

    try {
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3000/proxy/bitstamp-ws'
        : BITSTAMP_CONFIG.API.WS_URL;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Bitstamp WebSocket conectado');
        this.isReconnecting = false;
        this.retryCount = 0;
        this.startHeartbeat();
        
        // Enviar mensaje de inicialización
        this.sendMessage({
          event: 'bts:subscribe',
          data: {
            channel: 'live_trades_btcusd'
          }
        });

        // Resubscribir a canales pendientes
        this.resubscribeAll();
        this.config.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'bts:error') {
            console.error('Error de Bitstamp:', data);
            this.handleBitstampError(data);
          } else if (data.event === 'bts:subscription_succeeded') {
            this.handleSubscriptionSuccess(data.data?.channel);
          } else if (data.event === 'bts:unsubscription_succeeded') {
            this.handleUnsubscriptionSuccess(data.data?.channel);
          } else if (data.event === 'trade') {
            // Procesar datos de trading
            this.config.onMessage?.(data);
          }
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
          this.config.onError?.({
            type: 'PARSE_ERROR',
            message: 'Error al procesar mensaje del servidor',
            originalError: error
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
        this.config.onError?.({
          type: 'WEBSOCKET_ERROR',
          message: 'Error en la conexión WebSocket',
          originalError: error
        });
        this.handleConnectionError();
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket desconectado. Código: ${event.code}, Razón: ${event.reason}`);
        this.stopHeartbeat();
        this.isReconnecting = false;
        this.config.onClose?.();
        this.handleConnectionClose(event);
      };
    } catch (error) {
      console.error('Error al crear conexión WebSocket:', error);
      this.isReconnecting = false;
      this.handleConnectionError();
    }
  }

  private sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ event: 'bts:heartbeat' });
        
        if (Date.now() - this.lastMessageTime > BITSTAMP_CONFIG.WEBSOCKET.HEARTBEAT_INTERVAL * 2) {
          console.warn('No se han recibido mensajes en el intervalo esperado. Reconectando...');
          this.reconnect();
        }
      }
    }, BITSTAMP_CONFIG.WEBSOCKET.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  subscribe(channel: string) {
    if (!channel) return;

    this.pendingSubscriptions.add(channel);
    
    const subscribeMsg: BitstampSubscription = {
      event: 'bts:subscribe',
      data: { channel }
    };

    if (this.sendMessage(subscribeMsg)) {
      console.log(`Solicitando suscripción al canal: ${channel}`);
    } else {
      console.log(`Canal ${channel} en espera de reconexión`);
      this.reconnect();
    }
  }

  unsubscribe(channel: string) {
    if (!channel) return;

    const unsubscribeMsg: BitstampSubscription = {
      event: 'bts:unsubscribe',
      data: { channel }
    };

    if (this.sendMessage(unsubscribeMsg)) {
      console.log(`Cancelando suscripción al canal: ${channel}`);
    }
  }

  private handleSubscriptionSuccess(channel: string | undefined) {
    if (channel) {
      this.subscriptions.add(channel);
      this.pendingSubscriptions.delete(channel);
      console.log(`Suscripción exitosa al canal: ${channel}`);
    }
  }

  private handleUnsubscriptionSuccess(channel: string | undefined) {
    if (channel) {
      this.subscriptions.delete(channel);
      console.log(`Cancelación de suscripción exitosa del canal: ${channel}`);
    }
  }

  private handleBitstampError(error: any) {
    this.config.onError?.({
      type: 'BITSTAMP_ERROR',
      message: error.data?.message || 'Error del servidor Bitstamp',
      originalError: error
    });

    if (error.data?.channel) {
      setTimeout(() => {
        this.subscribe(error.data.channel);
      }, 1000);
    }
  }

  private handleConnectionError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryInterval * Math.pow(2, this.retryCount - 1);
      console.log(`Reintentando conexión en ${delay}ms (intento ${this.retryCount}/${this.maxRetries})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, delay);
    } else {
      console.error('Se alcanzó el máximo número de intentos de reconexión');
      this.config.onError?.({
        type: 'MAX_RETRIES_EXCEEDED',
        message: 'Se alcanzó el máximo número de intentos de reconexión'
      });
    }
  }

  private handleConnectionClose(event: CloseEvent) {
    if (event.code !== 1000 && event.code !== 1001) {
      this.handleConnectionError();
    }
  }

  private resubscribeAll() {
    // Resubscribir a todos los canales pendientes
    for (const channel of this.pendingSubscriptions) {
      this.subscribe(channel);
    }
  }

  private reconnect() {
    this.disconnect();
    this.connect();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();
  }
} 