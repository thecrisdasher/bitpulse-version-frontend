"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Tipo de posición de trading
export interface TradePosition {
  id: string;
  marketId: string;
  marketName: string;
  marketColor: string;
  direction: 'up' | 'down';
  type: 'buy' | 'sell';
  openPrice: number;
  currentPrice: number;
  amount: number;
  stake: number;
  openTime: Date;
  duration: {
    value: number;
    unit: 'minute' | 'hour' | 'day';
  };
  profit: number;
  profitPercentage: number;
  // Nuevos campos para gestión de riesgo
  capitalFraction: number;
  lotSize: number;
  leverage: number;
  marginRequired: number;
  positionValue: number;
}

// Parámetros para crear una nueva posición
export interface NewTradeParams {
  marketName: string;
  marketPrice: number;
  marketColor: string;
  direction: 'up' | 'down';
  amount: number;
  stake: number;
  duration: { value: number; unit: 'minute' | 'hour' | 'day' };
  capitalFraction: number;
  lotSize: number;
  leverage: number;
}

interface TradePositionsContextType {
  positions: TradePosition[];
  addPosition: (tradeParams: any) => Promise<string>;
  removePosition: (id: string) => Promise<void>;
  updatePositionPrices: (marketName: string, newPrice: number) => void;
  getTotalMarginUsed: () => number;
  getTotalFreeMargin: (totalCapital: number) => number;
  getTotalMarginLevel: (totalCapital: number) => number;
  getTotalUnrealizedPnL: () => number;
}

const TradePositionsContext = createContext<TradePositionsContextType | undefined>(undefined);

export const useTradePositions = () => {
  const context = useContext(TradePositionsContext);
  if (!context) {
    throw new Error('useTradePositions must be used within a TradePositionsProvider');
  }
  return context;
};

interface TradePositionsProviderProps {
  children: ReactNode;
}

export const TradePositionsProvider: React.FC<TradePositionsProviderProps> = ({ children }) => {
  const [positions, setPositions] = useState<TradePosition[]>([]);

  // Hydrate positions from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/trading/positions');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverPositions = json.data.map((pos: any): TradePosition => ({
            id: pos.id,
            marketId: pos.instrument,
            marketName: pos.instrument,
            marketColor: '', // backend does not store color
            direction: pos.direction === 'long' ? 'up' : 'down',
            type: pos.direction === 'long' ? 'buy' : 'sell',
            openPrice: pos.openPrice,
            currentPrice: pos.currentPrice,
            amount: pos.amount,
            stake: pos.amount,
            openTime: new Date(pos.openTime),
            duration: { value: 1, unit: 'hour' }, // default until DB supports duration
            profit: 0,
            profitPercentage: 0,
            capitalFraction: 0,
            lotSize: 0,
            leverage: pos.leverage,
            marginRequired: 0,
            positionValue: 0,
          }));
          setPositions(serverPositions);
        }
      } catch (err) {
        console.error('Error fetching positions', err);
      }
    })();
  }, []);

  // Generar ID único para posición
  const generatePositionId = (): string => {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Agregar nueva posición mediante API y actualizar contexto
  const addPosition = useCallback(async (tradeParams: any): Promise<string> => {
    try {
      // Iniciar creación en backend
      const res = await fetch('/api/trading/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeParams)
      });
      const json = await res.json();
      if (!json.success) {
        console.error('Error creating position:', json.message);
        return '';
      }
      const created = json.data;
      // Mapear datos de API y parámetros de cliente a TradePosition
    const newPosition: TradePosition = {
        id: created.id,
        marketId: tradeParams.instrumentId || created.instrument,
        marketName: tradeParams.instrumentName || created.instrument,
        marketColor: tradeParams.marketColor || '',
        direction: tradeParams.direction,
        type: tradeParams.direction === 'up' ? 'buy' : 'sell',
        openPrice: created.openPrice,
        currentPrice: created.currentPrice ?? created.openPrice,
        amount: tradeParams.amount,
        stake: tradeParams.stake,
        openTime: new Date(created.openTime),
        duration: tradeParams.duration,
      profit: 0,
      profitPercentage: 0,
        capitalFraction: tradeParams.capitalFraction ?? 0,
        lotSize: tradeParams.lotSize ?? 0,
        leverage: tradeParams.leverage ?? 0,
        marginRequired: tradeParams.marginRequired ?? 0,
        positionValue: tradeParams.positionValue ?? 0,
    };
    setPositions(prev => [...prev, newPosition]);
    return newPosition.id;
    } catch (err) {
      console.error('OpenPositions: error creando posición', err);
      return '';
    }
  }, []);

  // Remover posición en servidor y contexto
  const removePosition = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/trading/positions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
    setPositions(prev => prev.filter(pos => pos.id !== id));
      } else {
        console.warn('OpenPositions: no se pudo eliminar posición en el servidor', json.message);
      }
    } catch (err) {
      console.error('OpenPositions: error eliminando posición', err);
    }
  }, []);

  // Actualizar precios y calcular PnL
  const updatePositionPrices = useCallback((marketName: string, newPrice: number) => {
    setPositions(prev => prev.map(pos => {
      if (pos.marketName === marketName) {
        // Calcular profit basado en la dirección
        let priceDifference = newPrice - pos.openPrice;
        if (pos.direction === 'down') {
          priceDifference = -priceDifference; // Invertir para posiciones cortas
        }
        
        const profit = (priceDifference / pos.openPrice) * pos.stake;
        const profitPercentage = (priceDifference / pos.openPrice) * 100;

        return {
          ...pos,
          currentPrice: newPrice,
          profit,
          profitPercentage
        };
      }
      return pos;
    }));
  }, []);

  // Calcular margen total usado
  const getTotalMarginUsed = (): number => {
    return positions.reduce((total, pos) => total + pos.marginRequired, 0);
  };

  // Calcular fondos libres
  const getTotalFreeMargin = (totalCapital: number): number => {
    const totalMarginUsed = getTotalMarginUsed();
    const totalUnrealizedPnL = getTotalUnrealizedPnL();
    return Math.max(0, totalCapital - totalMarginUsed + totalUnrealizedPnL);
  };

  // Calcular nivel de margen
  const getTotalMarginLevel = (totalCapital: number): number => {
    const totalMarginUsed = getTotalMarginUsed();
    const freeMargin = getTotalFreeMargin(totalCapital);
    
    if (totalMarginUsed === 0) return 0;
    return (freeMargin / totalMarginUsed) * 100;
  };

  // Calcular PnL total no realizado
  const getTotalUnrealizedPnL = (): number => {
    return positions.reduce((total, pos) => total + pos.profit, 0);
  };

  // Simular actualizaciones de precios en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const marketPrices: Record<string, number> = {
        'EURUSD': 1.0850,
        'GBPUSD': 1.2650,
        'USDJPY': 149.50,
        'BTCUSD': 43250.00,
        'ETHUSD': 2640.00,
        'XAUUSD': 2040.50,
        'Bitcoin': 43250.00,
        'Ethereum': 2640.00,
        'Gold': 2040.50
      };

      // Actualizar precios con variación aleatoria
      Object.keys(marketPrices).forEach(market => {
        const change = (Math.random() - 0.5) * 0.02; // ±1% cambio
        const newPrice = marketPrices[market] * (1 + change);
        updatePositionPrices(market, newPrice);
      });
    }, 3000); // Actualizar cada 3 segundos

    return () => clearInterval(interval);
  }, [positions.length]);

  const value: TradePositionsContextType = {
    positions,
    addPosition,
    removePosition,
    updatePositionPrices,
    getTotalMarginUsed,
    getTotalFreeMargin,
    getTotalMarginLevel,
    getTotalUnrealizedPnL
  };

  return (
    <TradePositionsContext.Provider value={value}>
      {children}
    </TradePositionsContext.Provider>
  );
}; 