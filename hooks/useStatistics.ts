import { useState, useEffect, useMemo } from 'react';

interface ClosedPosition {
  id: string;
  instrument: string;
  openTime: string;
  closeTimestamp?: string;
  openPrice: number;
  closePrice?: number;
  pnl?: number;
}

interface TradingStats {
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  totalProfit: number;
  averageLoss: number;
  totalLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  averageHoldTime: number;
  bestTrade: number;
  worstTrade: number;
}

interface MarketStats {
  mostTradedMarket: string;
  favoriteTimeframe: string;
  preferredDirection: 'long' | 'short';
  activeDays: number;
  tradingStreak: number;
}

interface PerformanceData {
  period: string;
  profit: number;
  trades: number;
  winRate: number;
}

interface UseStatisticsReturn {
  closedPositions: ClosedPosition[];
  tradingStats: TradingStats;
  marketStats: MarketStats;
  performanceData: PerformanceData[];
  loading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClosedPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/trading/positions?status=closed', { credentials: 'include' });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.success) {
        setClosedPositions(json.data || []);
      } else {
        throw new Error(json.message || 'Failed to fetch positions');
      }
    } catch (err) {
      console.error('Error fetching closed positions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosedPositions();
  }, []);

  // Compute trading stats from closed positions
  const tradingStats = useMemo((): TradingStats => {
    if (closedPositions.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        averageProfit: 0,
        totalProfit: 0,
        averageLoss: 0,
        totalLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        averageHoldTime: 0,
        bestTrade: 0,
        worstTrade: 0
      };
    }

    const totalTrades = closedPositions.length;
    const pnlArray = closedPositions.map(p => p.pnl || 0);
    const totalProfit = pnlArray.reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
    const totalLoss = pnlArray.reduce((sum, v) => sum + (v < 0 ? v : 0), 0);
    const winCount = pnlArray.filter(v => v > 0).length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const averageProfit = winCount > 0 ? totalProfit / winCount : 0;
    const lossCount = totalTrades - winCount;
    const averageLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    const profitFactor = totalLoss !== 0 ? totalProfit / Math.abs(totalLoss) : 0;
    
    // Sharpe ratio: mean(pnl)/std(pnl)
    const meanPnl = totalTrades > 0 ? pnlArray.reduce((a, b) => a + b, 0) / totalTrades : 0;
    const variance = totalTrades > 1 
      ? pnlArray.reduce((a, b) => a + Math.pow(b - meanPnl, 2), 0) / (totalTrades - 1) 
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev !== 0 ? meanPnl / stdDev : 0;
    
    // Max drawdown
    const cumArray: number[] = [];
    pnlArray.reduce((cum, v) => { 
      cumArray.push(cum + v); 
      return cum + v; 
    }, 0);
    let peak = 0; 
    let maxDd = 0;
    cumArray.forEach(val => {
      peak = Math.max(peak, val);
      const dd = peak - val;
      maxDd = Math.max(maxDd, dd);
    });
    const maxDrawdown = peak !== 0 ? -(maxDd / peak) * 100 : 0;
    
    // Consecutive wins/losses
    let currentWinStreak = 0, maxWinStreak = 0;
    let currentLossStreak = 0, maxLossStreak = 0;
    pnlArray.forEach(v => {
      if (v > 0) {
        currentWinStreak++; 
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else {
        currentLossStreak++; 
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentWinStreak = 0;
      }
    });
    
    // Hold times
    const holdTimes = closedPositions.map(p => {
      const open = new Date(p.openTime).getTime();
      const close = p.closeTimestamp ? new Date(p.closeTimestamp).getTime() : open;
      return (close - open) / 60000; // Convert to minutes
    });
    const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;
    const bestTrade = pnlArray.length > 0 ? Math.max(...pnlArray) : 0;
    const worstTrade = pnlArray.length > 0 ? Math.min(...pnlArray) : 0;
    
    return { 
      totalTrades, 
      winRate, 
      averageProfit, 
      totalProfit, 
      averageLoss, 
      totalLoss, 
      profitFactor, 
      sharpeRatio, 
      maxDrawdown, 
      consecutiveWins: maxWinStreak, 
      consecutiveLosses: maxLossStreak, 
      averageHoldTime: avgHoldTime, 
      bestTrade, 
      worstTrade 
    };
  }, [closedPositions]);

  // Compute market stats from closed positions
  const marketStats = useMemo((): MarketStats => {
    if (closedPositions.length === 0) {
      return {
        mostTradedMarket: 'N/A',
        favoriteTimeframe: 'N/A',
        preferredDirection: 'long',
        activeDays: 0,
        tradingStreak: 0
      };
    }

    const markets = closedPositions.map(p => p.instrument);
    const counts: Record<string, number> = {};
    markets.forEach(m => counts[m] = (counts[m] || 0) + 1);
    const mostTradedMarket = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Calculate active days from trading data
    const tradingDates = closedPositions.map(p => {
      const date = new Date(p.closeTimestamp || p.openTime);
      return date.toDateString();
    });
    const uniqueDates = [...new Set(tradingDates)];
    const activeDays = uniqueDates.length;
    
    // Calculate trading streak (consecutive days with trades)
    const sortedDates = uniqueDates
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    
    // Determine preferred direction based on profitable trades
    const longTrades = closedPositions.filter(p => p.pnl && p.pnl > 0).length;
    const shortTrades = closedPositions.filter(p => p.pnl && p.pnl < 0).length;
    const preferredDirection: 'long' | 'short' = longTrades >= shortTrades ? 'long' : 'short';
    
    return { 
      mostTradedMarket, 
      favoriteTimeframe: '1H', // Default since we don't have this data
      preferredDirection, 
      activeDays, 
      tradingStreak: maxStreak 
    };
  }, [closedPositions]);

  // Compute performance data for chart
  const performanceData = useMemo((): PerformanceData[] => {
    if (closedPositions.length === 0) return [];
    
    // Group by month-year
    const groups: Record<string, { profit: number; trades: number; wins: number }> = {};
    closedPositions.forEach(p => {
      const date = new Date(p.closeTimestamp || p.openTime);
      const period = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      if (!groups[period]) groups[period] = { profit: 0, trades: 0, wins: 0 };
      groups[period].profit += (p.pnl || 0);
      groups[period].trades += 1;
      if ((p.pnl || 0) > 0) groups[period].wins += 1;
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => {
        // Sort by date
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([period, g]) => ({ 
        period, 
        profit: g.profit, 
        trades: g.trades, 
        winRate: g.trades > 0 ? (g.wins / g.trades) * 100 : 0 
      }));
  }, [closedPositions]);

  const refetchData = async () => {
    await fetchClosedPositions();
  };

  return {
    closedPositions,
    tradingStats,
    marketStats,
    performanceData,
    loading,
    error,
    refetchData
  };
}; 