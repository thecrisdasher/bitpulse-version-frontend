import { useEffect, useRef, useCallback, useState } from 'react';

// Reutilizando tipos existentes del sistema
interface TradePosition {
  id: string
  userId: string
  userName: string
  userEmail: string
  instrument: string
  direction: 'long' | 'short'
  openPrice: number
  currentPrice: number
  amount: number
  leverage: number
  openTime: string
  profit?: number
  status: 'open' | 'closed' | 'liquidated'
  stopLoss?: number
  takeProfit?: number
  stake?: number
  durationValue?: number
  durationUnit?: string
  marketColor?: string
}

interface PriceUpdateParams {
  symbol: string;
  price: number;
  instrumentName: string;
}

interface UseAdminRealTimePositionsOptions {
  updateInterval?: number;
  enableWebSocket?: boolean;
}

/**
 * Hook especializado para administradores que maneja datos en tiempo real
 * de múltiples posiciones de usuarios, reutilizando la lógica existente
 * del sistema de trading.
 */
export function useAdminRealTimePositions(
  positions: TradePosition[] = [],
  options: UseAdminRealTimePositionsOptions = {}
) {
  const { updateInterval = 2000, enableWebSocket = true } = options;
  
  // Estados para manejar las actualizaciones en tiempo real
  const [updatedPositions, setUpdatedPositions] = useState<TradePosition[]>(positions);
  const [isConnected, setIsConnected] = useState(false);
  const [activeConnections, setActiveConnections] = useState(0);
  
  // Referencias para WebSockets y buffering (reutilizando lógica existente)
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());
  const priceUpdateBufferRef = useRef<Map<string, PriceUpdateParams>>(new Map());
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSymbolsRef = useRef<Set<string>>(new Set());

  // Función para convertir instrumento a símbolo de Binance (reutilizada del sistema existente)
  const getSymbolFromInstrument = useCallback((instrumentName: string): string | null => {
    // Mapeo extendido basado en la lógica existente
    const instrumentToSymbol: { [key: string]: string } = {
      // Criptomonedas
      'BTCUSD': 'BTCUSDT',
      'BTCUSDT': 'BTCUSDT',
      'Bitcoin (BTC/USD)': 'BTCUSDT',
      'BTC/USD': 'BTCUSDT',
      'ETHUSD': 'ETHUSDT',
      'ETHUSDT': 'ETHUSDT',
      'Ethereum (ETH/USD)': 'ETHUSDT',
      'ETH/USD': 'ETHUSDT',
      'LTCUSD': 'LTCUSDT',
      'Litecoin (LTC/USD)': 'LTCUSDT',
      'XRPUSD': 'XRPUSDT',
      'Ripple (XRP/USD)': 'XRPUSDT',
      'BCHUSD': 'BCHUSDT',
      'Bitcoin Cash (BCH/USD)': 'BCHUSDT',
      'ADAUSD': 'ADAUSDT',
      'Cardano (ADA/USD)': 'ADAUSDT',
      'DOTUSD': 'DOTUSDT',
      'Polkadot (DOT/USD)': 'DOTUSDT',
      'SOLUSD': 'SOLUSDT',
      'Solana (SOL/USD)': 'SOLUSDT',
      'DOGEUSD': 'DOGEUSDT',
      'Dogecoin (DOGE/USD)': 'DOGEUSDT',
      'SHIBUSD': 'SHIBUSDT',
      'Shiba Inu (SHIB/USD)': 'SHIBUSDT',
      'LINKUSD': 'LINKUSDT',
      'Chainlink (LINK/USD)': 'LINKUSDT',
      'MATICUSD': 'MATICUSDT',
      'Polygon (MATIC/USD)': 'MATICUSDT',
    };

    return instrumentToSymbol[instrumentName] || null;
  }, []);

  // Función para determinar si un instrumento tiene soporte de tiempo real
  const isRealTimeSupported = useCallback((instrumentName: string): boolean => {
    const symbol = getSymbolFromInstrument(instrumentName);
    return symbol !== null;
  }, [getSymbolFromInstrument]);

  // Función para calcular profit/loss (reutilizando lógica existente)
  const calculateProfitLoss = useCallback((position: TradePosition, newPrice: number): number => {
    let priceDifference = newPrice - position.openPrice;
    
    // Invertir para posiciones cortas (reutilizando lógica del sistema)
    if (position.direction === 'short') {
      priceDifference = -priceDifference;
    }
    
    return (priceDifference / position.openPrice) * position.amount;
  }, []);

  // Función para procesar actualizaciones de precios en batch (reutilizada)
  const processPriceUpdates = useCallback(() => {
    if (priceUpdateBufferRef.current.size === 0) return;

    setUpdatedPositions(prevPositions => {
      return prevPositions.map(position => {
        const priceUpdate = Array.from(priceUpdateBufferRef.current.values())
          .find(update => update.instrumentName === position.instrument);
        
        if (priceUpdate && position.status === 'open') {
          const newProfit = calculateProfitLoss(position, priceUpdate.price);
          
          return {
            ...position,
            currentPrice: priceUpdate.price,
            profit: newProfit
          };
        }
        
        return position;
      });
    });

    priceUpdateBufferRef.current.clear();
  }, [calculateProfitLoss]);

  // Función para conectar WebSocket (reutilizada y adaptada)
  const connectToSymbol = useCallback((symbol: string, instrumentName: string) => {
    if (!enableWebSocket || wsConnectionsRef.current.has(symbol)) return;

    const stream = symbol.toLowerCase() + '@ticker';
    const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
    
    console.log(`[Admin RealTime] Conectando a ${wsUrl} para ${instrumentName}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`[Admin RealTime] Conectado a ${symbol} (${instrumentName})`);
      setActiveConnections(prev => prev + 1);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.c); // current price
        
        if (!isNaN(price)) {
          // Buffer la actualización para procesamiento en batch
          priceUpdateBufferRef.current.set(symbol, {
            symbol,
            price,
            instrumentName
          });
        }
      } catch (error) {
        console.error(`[Admin RealTime] Error parsing data for ${symbol}:`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[Admin RealTime] WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      console.log(`[Admin RealTime] Desconectado de ${symbol}`);
      wsConnectionsRef.current.delete(symbol);
      setActiveConnections(prev => Math.max(0, prev - 1));
      
      // Reconectar si el símbolo sigue siendo necesario
      if (activeSymbolsRef.current.has(symbol)) {
        setTimeout(() => {
          connectToSymbol(symbol, instrumentName);
        }, 3000);
      }
    };

    wsConnectionsRef.current.set(symbol, ws);
  }, [enableWebSocket]);

  // Función para desconectar WebSocket
  const disconnectFromSymbol = useCallback((symbol: string) => {
    const ws = wsConnectionsRef.current.get(symbol);
    if (ws) {
      ws.close();
      wsConnectionsRef.current.delete(symbol);
      setActiveConnections(prev => Math.max(0, prev - 1));
    }
    activeSymbolsRef.current.delete(symbol);
  }, []);

  // Efecto para manejar conexiones WebSocket basado en posiciones (adaptado para admin)
  useEffect(() => {
    const requiredSymbols = new Set<string>();
    const symbolToInstrument = new Map<string, string>();

    // Solo posiciones abiertas con soporte de tiempo real
    positions
      .filter(position => position.status === 'open')
      .forEach(position => {
        if (isRealTimeSupported(position.instrument)) {
          const symbol = getSymbolFromInstrument(position.instrument);
          if (symbol) {
            requiredSymbols.add(symbol);
            symbolToInstrument.set(symbol, position.instrument);
          }
        }
      });

    // Conectar a nuevos símbolos
    requiredSymbols.forEach(symbol => {
      if (!activeSymbolsRef.current.has(symbol)) {
        activeSymbolsRef.current.add(symbol);
        const instrumentName = symbolToInstrument.get(symbol)!;
        connectToSymbol(symbol, instrumentName);
      }
    });

    // Desconectar símbolos que ya no son necesarios
    Array.from(activeSymbolsRef.current).forEach(symbol => {
      if (!requiredSymbols.has(symbol)) {
        disconnectFromSymbol(symbol);
      }
    });

    // Actualizar estado de conexión
    setIsConnected(requiredSymbols.size > 0);

  }, [positions, isRealTimeSupported, getSymbolFromInstrument, connectToSymbol, disconnectFromSymbol]);

  // Efecto para procesar updates en batch (reutilizado)
  useEffect(() => {
    if (bufferIntervalRef.current) {
      clearInterval(bufferIntervalRef.current);
    }

    bufferIntervalRef.current = setInterval(processPriceUpdates, updateInterval);

    return () => {
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
      }
    };
  }, [processPriceUpdates, updateInterval]);

  // Efecto para sincronizar posiciones cuando cambian
  useEffect(() => {
    setUpdatedPositions(positions);
  }, [positions]);

  // Cleanup al desmontar (reutilizado)
  useEffect(() => {
    return () => {
      // Cerrar todas las conexiones WebSocket
      wsConnectionsRef.current.forEach(ws => ws.close());
      wsConnectionsRef.current.clear();
      
      // Limpiar intervalos
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
      }
      
      setActiveConnections(0);
      setIsConnected(false);
    };
  }, []);

  // Función para forzar actualización manual (útil para administradores)
  const forceUpdate = useCallback(async () => {
    try {
      // Procesar actualizaciones pendientes inmediatamente
      processPriceUpdates();
    } catch (error) {
      console.error('[Admin RealTime] Error in force update:', error);
    }
  }, [processPriceUpdates]);

  // Función para obtener estadísticas de conexión
  const getConnectionStats = useCallback(() => {
    const totalPositions = positions.filter(p => p.status === 'open').length;
    const supportedPositions = positions
      .filter(p => p.status === 'open' && isRealTimeSupported(p.instrument)).length;
    
    return {
      totalPositions,
      supportedPositions,
      activeConnections,
      isConnected,
      supportPercentage: totalPositions > 0 ? (supportedPositions / totalPositions) * 100 : 0
    };
  }, [positions, isRealTimeSupported, activeConnections, isConnected]);

  return {
    // Posiciones actualizadas con precios en tiempo real
    positions: updatedPositions,
    
    // Estados de conexión
    isConnected,
    activeConnections,
    
    // Funciones utilitarias
    forceUpdate,
    getConnectionStats,
    isRealTimeSupported,
    
    // Información para debugging (solo en desarrollo)
    ...(process.env.NODE_ENV !== 'production' && {
      _debug: {
        wsConnections: wsConnectionsRef.current.size,
        activeSymbols: activeSymbolsRef.current.size,
        priceBuffer: priceUpdateBufferRef.current.size
      }
    })
  };
} 