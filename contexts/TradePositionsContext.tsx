"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRealTimeCrypto } from '@/hooks/useRealTimeCrypto';

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
  const { updateUser, isValidAuth } = useAuth();
  
  // Get crypto symbols from positions for real-time price updates
  const cryptoSymbols = positions
    .filter(pos => {
      const name = pos.marketName.toLowerCase();
      return name.includes('btc') || name.includes('eth') || name.includes('sol') ||
             name.includes('ada') || name.includes('dot') || name.includes('xrp') ||
             name.includes('link') || name.includes('ltc') || name.includes('bch') ||
             name.includes('avax');
    })
    .map(pos => {
      const symbol = pos.marketName.split('(')[1]?.split('/')[0] || pos.marketName.split(' ')[0];
      return symbol.replace(/[^A-Z]/g, '');
    })
    .filter(Boolean);
    
  const { getTicker, isConnected: cryptoConnected } = useRealTimeCrypto(cryptoSymbols);
  
  // Effect para actualizar precios de crypto en tiempo real
  useEffect(() => {
    if (!cryptoConnected || cryptoSymbols.length === 0) return;
    
    const interval = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        const name = pos.marketName.toLowerCase();
        const isCrypto = name.includes('btc') || name.includes('eth') || name.includes('sol') ||
                         name.includes('ada') || name.includes('dot') || name.includes('xrp') ||
                         name.includes('link') || name.includes('ltc') || name.includes('bch') ||
                         name.includes('avax');
                         
        if (isCrypto) {
          const symbol = pos.marketName.split('(')[1]?.split('/')[0] || pos.marketName.split(' ')[0];
          const cleanSymbol = symbol.replace(/[^A-Z]/g, '');
          const ticker = getTicker(cleanSymbol);
          
          if (ticker?.price && ticker.price !== pos.currentPrice) {
            console.log(`[TradePositionsContext] Actualizando posición ${pos.id}: ${ticker.price}`);
            
            // Calcular expiración
            const multipliers: Record<string, number> = {
              minute: 60 * 1000,
              hour: 60 * 60 * 1000,
              day: 24 * 60 * 60 * 1000
            };

            const durationMs = pos.duration ? (multipliers[pos.duration.unit] || 0) * pos.duration.value : 0;
            const isExpired = durationMs > 0 && Date.now() - new Date(pos.openTime).getTime() >= durationMs;

            if (isExpired) {
              return pos; // No actualizar precios ni profit tras expiración
            }
            
            // Calcular profit basado en la dirección y nuevo precio
            let priceDifference = ticker.price - pos.openPrice;
            if (pos.direction === 'down') {
              priceDifference = -priceDifference;
            }
            
            const profit = (priceDifference / pos.openPrice) * pos.stake;
            const profitPercentage = (priceDifference / pos.openPrice) * 100;
            
            return {
              ...pos,
              currentPrice: ticker.price,
              profit,
              profitPercentage
            };
          }
        }
        
        return pos;
      }));
    }, 1000); // Actualizar cada 1 segundo para ser más responsivo
    
    return () => clearInterval(interval);
  }, [cryptoConnected, cryptoSymbols.join(','), getTicker]);

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
            marketColor: pos.marketColor || '', // usar color de DB si existe
            direction: pos.direction === 'long' ? 'up' : 'down',
            type: pos.direction === 'long' ? 'buy' : 'sell',
            openPrice: pos.openPrice,
            currentPrice: pos.currentPrice,
            amount: pos.amount,
            stake: pos.stake || pos.amount,
            openTime: new Date(pos.openTime),
            duration: { 
              value: pos.durationValue || 1, 
              unit: (pos.durationUnit as 'minute' | 'hour' | 'day') || 'hour' 
            }, // usar duración real de la DB
            profit: pos.profit || 0,
            profitPercentage: 0,
            capitalFraction: pos.capitalFraction || 0,
            lotSize: pos.lotSize || 0,
            leverage: pos.leverage || 0,
            marginRequired: pos.marginRequired || 0,
            positionValue: pos.positionValue || 0,
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
        openPrice: tradeParams.openPrice || created.openPrice,
        currentPrice: tradeParams.openPrice || created.openPrice, // Iniciar con precio de apertura
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
      
      // MEJORADO: Verificar si es crypto y obtener precio actual inmediatamente
      const name = newPosition.marketName.toLowerCase();
      const isCrypto = name.includes('btc') || name.includes('eth') || name.includes('sol') ||
                       name.includes('ada') || name.includes('dot') || name.includes('xrp') ||
                       name.includes('link') || name.includes('ltc') || name.includes('bch') ||
                       name.includes('avax');
                       
      if (isCrypto) {
        const symbol = newPosition.marketName.split('(')[1]?.split('/')[0] || newPosition.marketName.split(' ')[0];
        const cleanSymbol = symbol.replace(/[^A-Z]/g, '');
        const currentTicker = getTicker(cleanSymbol);
        
        if (currentTicker?.price) {
          console.log(`[TradePositionsContext] Nueva posición crypto usando precio actual: ${currentTicker.price}`);
          newPosition.currentPrice = currentTicker.price;
          
          // Calcular profit inicial basado en el precio actual vs precio de apertura
          let priceDifference = currentTicker.price - newPosition.openPrice;
          if (newPosition.direction === 'down') {
            priceDifference = -priceDifference;
          }
          
          newPosition.profit = (priceDifference / newPosition.openPrice) * newPosition.stake;
          newPosition.profitPercentage = (priceDifference / newPosition.openPrice) * 100;
        }
      }
      
      console.log(`[TradePositionsContext] Agregando nueva posición:`, newPosition);
      
      // Agregar la nueva posición al estado local
      setPositions(prev => [...prev, newPosition]);
      
      // Actualizar el balance del usuario en el contexto de autenticación si está disponible
      if (json.newBalance !== undefined && json.user && isValidAuth()) {
        try {
          await updateUser({ ...json.user, pejecoins: json.newBalance } as any);
        } catch (err) {
          console.warn('No se pudo actualizar usuario en contexto después de crear posición:', err);
          // No relanzar el error para evitar romper el flujo de creación de posición
        }
      }
      
      return newPosition.id;
    } catch (err) {
      console.error('OpenPositions: error creando posición', err);
      return '';
    }
  }, [updateUser, isValidAuth]);

  // Cerrar posición (liquidar PnL y devolver capital)
  const removePosition = useCallback(async (id: string): Promise<void> => {
    try {
      const target = positions.find(p => p.id === id);
      if (!target) return;

      const body = {
        closePrice: target.currentPrice,
        profit: target.profit ?? 0,
        amount: target.amount
      };

      const res = await fetch(`/api/trading/positions/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (json.success) {
        // Actualizar posiciones locales
        setPositions(prev => prev.filter(pos => pos.id !== id));

        // Intentar actualizar balance en AuthContext; ignorar si no hay token
        if (json.newBalance !== undefined && json.user && isValidAuth()) {
          try {
            await updateUser({ ...json.user, pejecoins: json.newBalance } as any);
          } catch (err) {
            console.warn('No se pudo actualizar usuario en contexto (probablemente sin token):', err);
            // No relanzar el error para evitar romper el flujo de cierre de posición
          }
        }
      } else {
        console.warn('OpenPositions: no se pudo cerrar posición', json.message);
      }
    } catch (err) {
      console.error('OpenPositions: error cerrando posición', err);
    }
  }, [positions, updateUser, isValidAuth]);

  // Actualizar precios y calcular PnL
  const updatePositionPrices = useCallback((marketName: string, newPrice: number) => {
    setPositions(prev => prev.map(pos => {
      if (pos.marketName === marketName) {
        // Calcular expiración
        const multipliers: Record<string, number> = {
          minute: 60 * 1000,
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000
        };

        const durationMs = pos.duration ? (multipliers[pos.duration.unit] || 0) * pos.duration.value : 0;
        const isExpired = durationMs > 0 && Date.now() - new Date(pos.openTime).getTime() >= durationMs;

        if (isExpired) {
          return pos; // No actualizar precios ni profit tras expiración
        }

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