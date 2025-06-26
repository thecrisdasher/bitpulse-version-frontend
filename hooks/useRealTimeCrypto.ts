"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

interface BinanceTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: number;
}

interface ConnectionPool {
  ws: WebSocket;
  symbols: Set<string>;
  subscribers: Set<(data: { [key: string]: BinanceTicker }) => void>;
  reconnectAttempts: number;
  isConnecting: boolean;
}

const MAX_CONNECTIONS = 3;
const MAX_SYMBOLS_PER_CONNECTION = 10;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 3000;

// Pool global de conexiones WebSocket
const connectionPool: ConnectionPool[] = [];
const tickerCache: { [key: string]: BinanceTicker } = {};
const globalSubscribers = new Set<(data: { [key: string]: BinanceTicker }) => void>();

// Función para broadcast a todos los suscriptores
const broadcastUpdate = () => {
  globalSubscribers.forEach(callback => {
    try {
      callback({ ...tickerCache });
    } catch (err) {
      console.error('Error in subscriber callback:', err);
    }
  });
};

// Función para calcular backoff exponencial
const calculateBackoffDelay = (attempt: number): number => {
  return Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), 48000);
};

// Función para crear una nueva conexión WebSocket
const createConnection = (symbols: string[]): ConnectionPool => {
  const streamNames = symbols.map(symbol => `${symbol.toLowerCase()}usdt@ticker`);
  const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;
  
  const pool: ConnectionPool = {
    ws: new WebSocket(url),
    symbols: new Set(symbols),
    subscribers: new Set(),
    reconnectAttempts: 0,
    isConnecting: true
  };

  pool.ws.onopen = () => {
    console.log(`🔗 Binance WebSocket conectado: ${symbols.join(', ')}`);
    pool.isConnecting = false;
    pool.reconnectAttempts = 0;
  };

  pool.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.c && data.s) {
        const symbol = data.s.replace('USDT', '');
        tickerCache[symbol] = {
          symbol,
          price: parseFloat(data.c),
          change: parseFloat(data.p),
          changePercent: parseFloat(data.P),
          volume: parseFloat(data.v),
          lastUpdate: Date.now()
        };
        broadcastUpdate();
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  pool.ws.onerror = (error) => {
    console.error('Binance WebSocket error:', error);
    pool.isConnecting = false;
  };

  pool.ws.onclose = () => {
    console.log('🔌 Binance WebSocket cerrado');
    pool.isConnecting = false;
    
    // Intentar reconectar si hay suscriptores
    if (pool.subscribers.size > 0 && pool.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = calculateBackoffDelay(pool.reconnectAttempts);
      console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${pool.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        if (pool.subscribers.size > 0) {
          pool.reconnectAttempts++;
          const newPool = createConnection(Array.from(pool.symbols));
          
          // Reemplazar la pool en el array global
          const index = connectionPool.indexOf(pool);
          if (index >= 0) {
            connectionPool[index] = newPool;
          }
        }
      }, delay);
    } else {
      // Limpiar la pool del array global si no hay más suscriptores
      const index = connectionPool.indexOf(pool);
      if (index >= 0) {
        connectionPool.splice(index, 1);
      }
    }
  };

  return pool;
};

// Función para encontrar o crear una conexión adecuada
const getOrCreateConnection = (symbols: string[]): ConnectionPool => {
  // Buscar una conexión existente que pueda acomodar los símbolos
  for (const pool of connectionPool) {
    const totalSymbols = new Set([...pool.symbols, ...symbols]);
    if (totalSymbols.size <= MAX_SYMBOLS_PER_CONNECTION && 
        pool.ws.readyState === WebSocket.OPEN) {
      // Agregar nuevos símbolos a la conexión existente
      symbols.forEach(symbol => pool.symbols.add(symbol));
      return pool;
    }
  }

  // Si no hay conexión adecuada y no hemos alcanzado el límite, crear nueva
  if (connectionPool.length < MAX_CONNECTIONS) {
    const newPool = createConnection(symbols);
    connectionPool.push(newPool);
    return newPool;
  }

  // Si hemos alcanzado el límite, usar la primera conexión disponible
  const firstPool = connectionPool[0];
  symbols.forEach(symbol => firstPool.symbols.add(symbol));
  return firstPool;
};

// Hook principal
export const useRealTimeCrypto = (symbols: string[] = []) => {
  const [isConnected, setIsConnected] = useState(false);
  const [tickers, setTickers] = useState<{ [key: string]: BinanceTicker }>({});
  const poolRef = useRef<ConnectionPool | null>(null);
  const subscriberRef = useRef<((data: { [key: string]: BinanceTicker }) => void) | null>(null);

  // Callback para actualizar tickers
  const updateTickers = useCallback((data: { [key: string]: BinanceTicker }) => {
    setTickers(data);
  }, []);

  useEffect(() => {
    if (symbols.length === 0) {
      // Cleanup si no hay símbolos
      if (subscriberRef.current && poolRef.current) {
        poolRef.current.subscribers.delete(subscriberRef.current);
        globalSubscribers.delete(subscriberRef.current);
      }
      setIsConnected(false);
      setTickers({});
      return;
    }

    // Filtrar símbolos válidos
    const validSymbols = symbols.filter(s => s && s.length > 0);
    if (validSymbols.length === 0) return;

    // Crear callback de suscripción
    subscriberRef.current = updateTickers;
    globalSubscribers.add(subscriberRef.current);

    // Obtener o crear conexión
    const pool = getOrCreateConnection(validSymbols);
    poolRef.current = pool;
    pool.subscribers.add(subscriberRef.current);

    // Verificar estado de conexión
    const checkConnection = () => {
      const connected = pool.ws.readyState === WebSocket.OPEN;
      setIsConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (subscriberRef.current && poolRef.current) {
        poolRef.current.subscribers.delete(subscriberRef.current);
        globalSubscribers.delete(subscriberRef.current);
        
        // Si no hay más suscriptores, cerrar la conexión
        if (poolRef.current.subscribers.size === 0) {
          poolRef.current.ws.close();
        }
      }
    };
  }, [symbols.join(','), updateTickers]);

  // Función para obtener ticker específico
  const getTicker = useCallback((symbol: string): BinanceTicker | null => {
    return tickerCache[symbol] || null;
  }, []);

  return {
    tickers,
    isConnected,
    getTicker
  };
};

// Hook de compatibilidad para reemplazar useBinanceTickers
export const useRealTimeBinanceTickers = (symbols: string[] = []) => {
  const { tickers, isConnected } = useRealTimeCrypto(symbols);
  
  return {
    tickers: Object.values(tickers),
    isLoading: !isConnected,
    error: null
  };
}; 