"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define the trade position type
export type TradePosition = {
  id: string;
  marketId: string;
  marketName: string;
  marketColor: string;
  direction: 'up' | 'down';
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
};

// Define the context type
type TradePositionsContextType = {
  positions: TradePosition[];
  addPosition: (position: Omit<TradePosition, 'id'>) => void;
  updatePosition: (id: string, updates: Partial<TradePosition>) => void;
  removePosition: (id: string) => void;
  clearPositions: () => void;
};

// Create the context
const TradePositionsContext = createContext<TradePositionsContextType | null>(null);

// Define props for the provider component
interface TradePositionsProviderProps {
  children: ReactNode;
}

// Create a provider component
export const TradePositionsProvider: React.FC<TradePositionsProviderProps> = ({ children }) => {
  // State to store positions
  const [positions, setPositions] = useState<TradePosition[]>([]);

  // Load positions from localStorage on component mount
  useEffect(() => {
    const storedPositions = localStorage.getItem('tradePositions');
    if (storedPositions) {
      try {
        // Parse the JSON and convert date strings back to Date objects
        const parsedPositions = JSON.parse(storedPositions);
        const positionsWithDates = parsedPositions.map((pos: any) => ({
          ...pos,
          openTime: new Date(pos.openTime)
        }));
        setPositions(positionsWithDates);
      } catch (error) {
        console.error('Failed to parse stored positions:', error);
      }
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tradePositions', JSON.stringify(positions));
  }, [positions]);

  // Simulate price updates for positions
  useEffect(() => {
    if (positions.length === 0) return;

    const interval = setInterval(() => {
      setPositions(currentPositions => 
        currentPositions.map(position => {
          // Random price change (1% fluctuation)
          const priceChange = position.openPrice * (Math.random() * 0.02 - 0.01);
          const newPrice = position.currentPrice + priceChange;
          
          // Calculate profit
          const priceDifference = position.direction === 'up' 
            ? newPrice - position.openPrice 
            : position.openPrice - newPrice;
          
          const profit = priceDifference * position.stake / position.openPrice;
          const profitPercentage = (priceDifference / position.openPrice) * 100;
          
          return {
            ...position,
            currentPrice: newPrice,
            profit,
            profitPercentage
          };
        })
      );
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, [positions]);

  // Add a new position
  const addPosition = (position: Omit<TradePosition, 'id'>) => {
    const newPosition = {
      ...position,
      id: uuidv4(),
      profit: 0,
      profitPercentage: 0
    };
    setPositions(prevPositions => [newPosition, ...prevPositions]);
  };

  // Update an existing position
  const updatePosition = (id: string, updates: Partial<TradePosition>) => {
    setPositions(prevPositions => 
      prevPositions.map(position => 
        position.id === id ? { ...position, ...updates } : position
      )
    );
  };

  // Remove a position
  const removePosition = (id: string) => {
    setPositions(prevPositions => 
      prevPositions.filter(position => position.id !== id)
    );
  };

  // Clear all positions
  const clearPositions = () => {
    setPositions([]);
  };

  // Provide the context value
  const contextValue: TradePositionsContextType = {
    positions,
    addPosition,
    updatePosition,
    removePosition,
    clearPositions
  };

  return (
    <TradePositionsContext.Provider value={contextValue}>
      {children}
    </TradePositionsContext.Provider>
  );
};

// Hook for easier context usage
export const useTradePositions = () => {
  const context = useContext(TradePositionsContext);
  if (!context) {
    throw new Error('useTradePositions must be used within a TradePositionsProvider');
  }
  return context;
}; 