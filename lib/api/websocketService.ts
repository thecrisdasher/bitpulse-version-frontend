import { WebSocketManager, WebSocketManagerOptions, getWebSocketUrlForInstrument, generateSubscriptionMessage } from './websocketManager';
import { MarketData } from './marketDataService';
import { WEBSOCKET_CONFIG } from './apiConfig';

type WebSocketCallback = (data: MarketData) => void;

interface WebSocketConnection {
  manager: WebSocketManager;
  subscribers: Set<WebSocketCallback>;
  lastData: MarketData | null;
  symbol: string;
  category: string;
  provider: string;
}

// Almacén de conexiones WebSocket activas
const activeConnections: Record<string, WebSocketConnection> = {};

/**
 * Crear clave única para una conexión WebSocket
 */
const getConnectionKey = (symbol: string, category: string): string => {
  return `${category.toLowerCase()}-${symbol.toLowerCase()}`;
};

/**
 * Procesar datos recibidos por WebSocket según el proveedor
 */
const processWebSocketData = (
  rawData: any, 
  symbol: string, 
  category: string, 
  provider: string, 
  lastData: MarketData | null
): MarketData | null => {
  try {
    if (!rawData) return null;
    
    // Si no hay datos previos, no podemos actualizar (necesitamos el objeto base)
    if (!lastData) return null;
    
    // Clonar los datos anteriores como base
    const updatedData: MarketData = { ...lastData };
    
    // Actualizar timestamp
    updatedData.lastUpdated = Date.now();
    updatedData.isRealTime = true;
    
    switch (provider.toUpperCase()) {
      case 'BINANCE': {
        // Formato de datos de Binance WebSocket
        if (rawData.e === '24hrTicker') {
          const price = parseFloat(rawData.c) * 4200; // Convertir a COP
          const prevPrice = parseFloat(rawData.o) * 4200;
          const high = parseFloat(rawData.h) * 4200;
          const low = parseFloat(rawData.l) * 4200;
          
          updatedData.currentPrice = price;
          updatedData.change24h = price - prevPrice;
          updatedData.changePercent24h = parseFloat(rawData.P); // Ya viene en porcentaje
          updatedData.high24h = high;
          updatedData.low24h = low;
          
          // Agregar nuevo punto al historial si ha pasado suficiente tiempo
          const lastPoint = updatedData.priceHistory[updatedData.priceHistory.length - 1];
          const timeSinceLastPoint = Date.now() - lastPoint.timestamp;
          
          if (timeSinceLastPoint > 60000) { // 1 minuto mínimo entre puntos
            updatedData.priceHistory = [
              ...updatedData.priceHistory,
              { timestamp: Date.now(), price }
            ].slice(-100); // Mantener solo los últimos 100 puntos
          }
        }
        break;
      }
      
      case 'TWELVE_DATA': {
        // Formato de datos de TwelveData WebSocket
        if (rawData.price) {
          const price = parseFloat(rawData.price) * 4200; // Convertir a COP
          
          // Actualizar precio y calcular cambio desde el último
          const prevPrice = updatedData.currentPrice;
          updatedData.currentPrice = price;
          
          // Actualizar cambio porcentual solo si tenemos precio anterior
          if (prevPrice) {
            const change = price - prevPrice;
            updatedData.change24h = updatedData.change24h + change;
            updatedData.changePercent24h = (updatedData.change24h / (prevPrice - updatedData.change24h)) * 100;
          }
          
          // Actualizar máximos y mínimos
          if (!updatedData.high24h || price > updatedData.high24h) {
            updatedData.high24h = price;
          }
          
          if (!updatedData.low24h || price < updatedData.low24h) {
            updatedData.low24h = price;
          }
          
          // Agregar punto al historial
          const lastPoint = updatedData.priceHistory[updatedData.priceHistory.length - 1];
          const timeSinceLastPoint = Date.now() - lastPoint.timestamp;
          
          if (timeSinceLastPoint > 60000) { // 1 minuto mínimo entre puntos
            updatedData.priceHistory = [
              ...updatedData.priceHistory,
              { timestamp: Date.now(), price }
            ].slice(-100); // Mantener solo los últimos 100 puntos
          }
        }
        break;
      }
      
      case 'DERIV': {
        // Formato de datos de Deriv WebSocket
        if (rawData.tick) {
          const price = parseFloat(rawData.tick.quote);
          
          // Actualizar precio y calcular cambio desde el último
          const prevPrice = updatedData.currentPrice;
          updatedData.currentPrice = price;
          
          if (prevPrice) {
            const change = price - prevPrice;
            updatedData.change24h = updatedData.change24h + change;
            updatedData.changePercent24h = (updatedData.change24h / (prevPrice - updatedData.change24h)) * 100;
          }
          
          // Actualizar máximos y mínimos
          if (!updatedData.high24h || price > updatedData.high24h) {
            updatedData.high24h = price;
          }
          
          if (!updatedData.low24h || price < updatedData.low24h) {
            updatedData.low24h = price;
          }
          
          // Agregar punto al historial
          updatedData.priceHistory = [
            ...updatedData.priceHistory,
            { timestamp: Date.now(), price }
          ].slice(-100); // Mantener solo los últimos 100 puntos
        }
        break;
      }
      
      default:
        // Formato desconocido, no podemos procesar
        return null;
    }
    
    return updatedData;
  } catch (error) {
    console.error('Error procesando datos de WebSocket:', error);
    return null;
  }
};

/**
 * Servicio para gestionar conexiones WebSocket
 */
export const websocketService = {
  /**
   * Suscribirse a actualizaciones de datos en tiempo real
   */
  subscribe(
    symbol: string, 
    category: string, 
    callback: WebSocketCallback, 
    initialData?: MarketData
  ): () => void {
    const key = getConnectionKey(symbol, category);
    
    // Si ya existe una conexión, agregar el callback a los suscriptores
    if (activeConnections[key]) {
      const connection = activeConnections[key];
      connection.subscribers.add(callback);
      
      // Si hay datos disponibles, ejecutar el callback inmediatamente
      if (connection.lastData) {
        setTimeout(() => callback(connection.lastData!), 0);
      }
      
      // Devolver función para cancelar la suscripción
      return () => {
        connection.subscribers.delete(callback);
        
        // Si no quedan suscriptores, cerrar la conexión
        if (connection.subscribers.size === 0) {
          this.closeConnection(key);
        }
      };
    }
    
    // Determinar el proveedor preferente para este instrumento y categoría
    // A través del WebSocket Manager se seleccionará la URL apropiada
    let provider = '';
    
    switch (category.toLowerCase()) {
      case 'criptomonedas':
        provider = 'BINANCE';
        break;
      case 'forex':
      case 'indices':
      case 'materias-primas':
        provider = 'TWELVE_DATA';
        break;
      case 'derivados':
      case 'sinteticos':
      case 'baskets':
        provider = 'DERIV';
        break;
      default:
        provider = 'BINANCE';
    }
    
    // Obtener URL del WebSocket para este instrumento
    const wsUrl = getWebSocketUrlForInstrument(symbol, category, provider);
    
    // Si no hay URL disponible, no podemos crear una conexión
    if (!wsUrl) {
      console.warn(`No hay WebSocket disponible para ${symbol} (${category})`);
      return () => {}; // Función vacía como cancelación
    }
    
    // Generar mensaje de suscripción apropiado para este proveedor
    const subscriptionMessage = generateSubscriptionMessage(symbol, category, provider);
    
    // Crear nueva conexión
    const options: WebSocketManagerOptions = {
      url: wsUrl,
      subscriptionMessage: subscriptionMessage || undefined,
      autoReconnect: true,
      maxReconnectAttempts: WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS,
      reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
      heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
      
      // Callback para procesar mensajes recibidos
      onMessage: (data) => {
        const connection = activeConnections[key];
        
        if (!connection) return;
        
        // Procesar datos según el proveedor
        const processedData = processWebSocketData(
          data, 
          symbol, 
          category, 
          provider, 
          connection.lastData || initialData || null
        );
        
        // Si no se pudieron procesar los datos, ignorarlos
        if (!processedData) return;
        
        // Actualizar datos en la conexión
        connection.lastData = processedData;
        
        // Notificar a todos los suscriptores
        connection.subscribers.forEach(cb => {
          try {
            cb(processedData);
          } catch (error) {
            console.error('Error en callback de WebSocket:', error);
          }
        });
      },
      
      // Callback para manejar errores
      onError: (error) => {
        console.error(`Error en WebSocket para ${symbol} (${category}):`, error);
      }
    };
    
    // Crear y guardar la conexión
    const manager = new WebSocketManager(options);
    
    activeConnections[key] = {
      manager,
      subscribers: new Set([callback]),
      lastData: initialData || null,
      symbol,
      category,
      provider
    };
    
    // Iniciar la conexión
    manager.connect();
    
    // Devolver función para cancelar la suscripción
    return () => {
      const connection = activeConnections[key];
      if (!connection) return;
      
      connection.subscribers.delete(callback);
      
      // Si no quedan suscriptores, cerrar la conexión
      if (connection.subscribers.size === 0) {
        this.closeConnection(key);
      }
    };
  },
  
  /**
   * Cerrar una conexión específica
   */
  closeConnection(key: string): void {
    const connection = activeConnections[key];
    if (!connection) return;
    
    // Limpiar y cerrar el WebSocket
    connection.manager.cleanup();
    
    // Eliminar la conexión del registro
    delete activeConnections[key];
    
    console.log(`Closed WebSocket connection for ${key}`);
  },
  
  /**
   * Cerrar todas las conexiones activas
   */
  closeAll(): void {
    Object.keys(activeConnections).forEach(key => {
      this.closeConnection(key);
    });
    
    console.log('Closed all WebSocket connections');
  },
  
  /**
   * Verificar si existe una conexión activa para un símbolo y categoría
   */
  hasActiveConnection(symbol: string, category: string): boolean {
    const key = getConnectionKey(symbol, category);
    return !!activeConnections[key];
  },
  
  /**
   * Obtener el número de conexiones activas
   */
  getActiveConnectionCount(): number {
    return Object.keys(activeConnections).length;
  },
  
  /**
   * Reconectar todas las conexiones activas
   */
  reconnectAll(): void {
    Object.keys(activeConnections).forEach(key => {
      const connection = activeConnections[key];
      connection.manager.cleanup();
      connection.manager.connect();
    });
    
    console.log('Reconnected all WebSocket connections');
  }
}; 