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
  addPosition: (positionData: any) => string;
  removePosition: (id: string) => void;
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

  // Generar ID único para posición
  const generatePositionId = (): string => {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Agregar nueva posición desde UI o API
  const addPosition = useCallback((positionData: any): string => {
    const newPosition: TradePosition = {
      id: positionData.id || generatePositionId(),
      marketId: positionData.marketId || positionData.instrumentId || '',
      marketName: positionData.marketName || positionData.instrumentName || '',
      marketColor: positionData.marketColor || '',
      direction: positionData.direction,
      type: positionData.direction === 'up' ? 'buy' : 'sell',
      openPrice: positionData.openPrice,
      currentPrice: positionData.currentPrice ?? positionData.openPrice,
      amount: positionData.amount,
      stake: positionData.stake ?? 0,
      openTime: positionData.openTime instanceof Date
        ? positionData.openTime
        : new Date(positionData.openTime),
      duration: positionData.duration,
      profit: positionData.profit ?? 0,
      profitPercentage: positionData.profitPercentage ?? 0,
      capitalFraction: positionData.capitalFraction ?? 0,
      lotSize: positionData.lotSize ?? 0,
      leverage: positionData.leverage ?? 0,
      marginRequired: positionData.marginRequired ?? 0,
      positionValue: positionData.positionValue ?? 0,
    };

    setPositions(prev => [...prev, newPosition]);
    return newPosition.id;
  }, []);

  // Remover posición
  const removePosition = useCallback((id: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== id));
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