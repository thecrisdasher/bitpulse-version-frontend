import { useEffect, useRef, useCallback } from 'react';
import { useTradePositions } from '@/contexts/TradePositionsContext';

interface PriceUpdateParams {
  symbol: string;
  price: number;
  marketName: string;
}

export function useRealTimePositions() {
  const { positions, updatePositionPrices } = useTradePositions();
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());
  const priceUpdateBufferRef = useRef<Map<string, PriceUpdateParams>>(new Map());
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSymbolsRef = useRef<Set<string>>(new Set());

  // Función para convertir marketName a símbolo de Binance
  const getSymbolFromMarketName = useCallback((marketName: string): string => {
    // Mapeo de nombres de mercado a símbolos de Binance
    const marketToSymbol: { [key: string]: string } = {
      'Bitcoin (BTC/USD)': 'BTCUSDT',
      'Ethereum (ETH/USD)': 'ETHUSDT',
      'Litecoin (LTC/USD)': 'LTCUSDT',
      'Ripple (XRP/USD)': 'XRPUSDT',
      'Bitcoin Cash (BCH/USD)': 'BCHUSDT',
      'Cardano (ADA/USD)': 'ADAUSDT',
      'Polkadot (DOT/USD)': 'DOTUSDT',
      'Solana (SOL/USD)': 'SOLUSDT',
      'Dogecoin (DOGE/USD)': 'DOGEUSDT',
      'Shiba Inu (SHIB/USD)': 'SHIBUSDT',
      'Chainlink (LINK/USD)': 'LINKUSDT',
      'Polygon (MATIC/USD)': 'MATICUSDT',
    };

    return marketToSymbol[marketName] || 'BTCUSDT';
  }, []);

  // Función para procesar actualizaciones de precios en batch
  const processPriceUpdates = useCallback(() => {
    if (priceUpdateBufferRef.current.size === 0) return;

    priceUpdateBufferRef.current.forEach(({ marketName, price }) => {
      updatePositionPrices(marketName, price);
    });

    priceUpdateBufferRef.current.clear();
  }, [updatePositionPrices]);

  // Función para conectar WebSocket para un símbolo específico
  const connectToSymbol = useCallback((symbol: string, marketName: string) => {
    if (wsConnectionsRef.current.has(symbol)) return;

    const stream = symbol.toLowerCase() + '@ticker';
    const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
    
    console.log(`[RealTime Positions] Conectando a ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`[RealTime Positions] Conectado a ${symbol}`);
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
            marketName
          });
        }
      } catch (error) {
        console.error(`[RealTime Positions] Error parsing WebSocket data for ${symbol}:`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[RealTime Positions] WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      console.log(`[RealTime Positions] Desconectado de ${symbol}`);
      wsConnectionsRef.current.delete(symbol);
      
      // Reconectar después de 3 segundos si el símbolo sigue siendo necesario
      if (activeSymbolsRef.current.has(symbol)) {
        setTimeout(() => {
          connectToSymbol(symbol, marketName);
        }, 3000);
      }
    };

    wsConnectionsRef.current.set(symbol, ws);
  }, []);

  // Función para desconectar WebSocket de un símbolo
  const disconnectFromSymbol = useCallback((symbol: string) => {
    const ws = wsConnectionsRef.current.get(symbol);
    if (ws) {
      ws.close();
      wsConnectionsRef.current.delete(symbol);
    }
    activeSymbolsRef.current.delete(symbol);
  }, []);

  // Efecto para manejar las conexiones WebSocket basado en las posiciones abiertas
  useEffect(() => {
    const requiredSymbols = new Set<string>();
    const symbolToMarket = new Map<string, string>();

    // Determinar qué símbolos necesitamos monitorear
    positions.forEach(position => {
      // Solo monitorear posiciones de criptomonedas que están en Binance
      if (position.marketName.includes('BTC') || 
          position.marketName.includes('ETH') || 
          position.marketName.includes('LTC') ||
          position.marketName.includes('XRP') ||
          position.marketName.includes('BCH') ||
          position.marketName.includes('ADA') ||
          position.marketName.includes('DOT') ||
          position.marketName.includes('SOL') ||
          position.marketName.includes('DOGE') ||
          position.marketName.includes('SHIB') ||
          position.marketName.includes('LINK') ||
          position.marketName.includes('Polygon')) {
        
        const symbol = getSymbolFromMarketName(position.marketName);
        requiredSymbols.add(symbol);
        symbolToMarket.set(symbol, position.marketName);
      }
    });

    // Conectar a nuevos símbolos
    requiredSymbols.forEach(symbol => {
      if (!activeSymbolsRef.current.has(symbol)) {
        activeSymbolsRef.current.add(symbol);
        const marketName = symbolToMarket.get(symbol)!;
        connectToSymbol(symbol, marketName);
      }
    });

    // Desconectar símbolos que ya no son necesarios
    Array.from(activeSymbolsRef.current).forEach(symbol => {
      if (!requiredSymbols.has(symbol)) {
        disconnectFromSymbol(symbol);
      }
    });

  }, [positions, getSymbolFromMarketName, connectToSymbol, disconnectFromSymbol]);

  // Efecto para procesar actualizaciones de precios en batch cada 2 segundos
  useEffect(() => {
    bufferIntervalRef.current = setInterval(processPriceUpdates, 2000);

    return () => {
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
      }
    };
  }, [processPriceUpdates]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      // Cerrar todas las conexiones WebSocket
      wsConnectionsRef.current.forEach(ws => ws.close());
      wsConnectionsRef.current.clear();
      
      // Limpiar intervalos
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
      }
    };
  }, []);

  return {
    activeConnections: wsConnectionsRef.current.size,
    isConnected: wsConnectionsRef.current.size > 0
  };
} 