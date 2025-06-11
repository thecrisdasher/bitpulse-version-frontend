"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  DollarSign,
  Percent,
  Calendar,
  Users,
  Trophy,
  Award,
  Activity,
  PieChart,
  LineChart,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTradePositions } from "@/contexts/TradePositionsContext";
import Sidebar from "@/components/Sidebar";
import { InteractivePerformanceChart } from "@/components/advanced-statistics/InteractivePerformanceChart";

// Tipos
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

// Type for closed positions
interface ClosedPosition {
  id: string;
  instrument: string;
  openTime: string;
  closeTimestamp?: string;
  openPrice: number;
  closePrice?: number;
  pnl?: number;
}

export const StatisticsPage = () => {
  const { positions } = useTradePositions();
  // Closed positions for history and stats
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  // Fetch closed positions
  useEffect(() => {
    const fetchClosed = async () => {
      try {
        const res = await fetch('/api/trading/positions?status=closed', { credentials: 'include' });
        const json = await res.json();
        if (json.success) {
          setClosedPositions(json.data);
        }
      } catch (err) {
        console.error('Error fetching closed positions', err);
      }
    };
    fetchClosed();
  }, []);

  // Compute trading stats from closed positions
  const tradingStats = React.useMemo((): TradingStats => {
    const data: any[] = closedPositions;
    const totalTrades = data.length;
    const pnlArray = data.map(p => p.pnl || 0);
    const totalProfit = pnlArray.reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
    const totalLoss = pnlArray.reduce((sum, v) => sum + (v < 0 ? v : 0), 0);
    const winCount = pnlArray.filter(v => v > 0).length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const averageProfit = winCount > 0 ? totalProfit / winCount : 0;
    const lossCount = totalTrades - winCount;
    const averageLoss = lossCount > 0 ? totalLoss / lossCount : 0;
    const profitFactor = totalLoss !== 0 ? totalProfit / Math.abs(totalLoss) : 0;
    // Sharpe ratio: mean(pnl)/std(pnl)
    const meanPnl = totalTrades > 0 ? pnlArray.reduce((a,b)=>a+b,0)/totalTrades : 0;
    const variance = totalTrades > 1 ? pnlArray.reduce((a,b)=>a+Math.pow(b-meanPnl,2),0)/(totalTrades-1) : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev !== 0 ? meanPnl / stdDev : 0;
    // Max drawdown
    const cumArray: number[] = [];
    pnlArray.reduce((cum, v) => { cumArray.push(cum + v); return cum + v; }, 0);
    let peak = 0; let maxDd = 0;
    cumArray.forEach(val => {
      peak = Math.max(peak, val);
      const dd = peak - val;
      maxDd = Math.max(maxDd, dd);
    });
    const maxDrawdown = peak !== 0 ? -(maxDd/peak)*100 : 0;
    // Consecutive wins/losses
    let currentWinStreak = 0, maxWinStreak = 0;
    let currentLossStreak = 0, maxLossStreak = 0;
    pnlArray.forEach(v => {
      if (v > 0) {
        currentWinStreak++; maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentLossStreak = 0;
      } else {
        currentLossStreak++; maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentWinStreak = 0;
      }
    });
    // Hold times
    const holdTimes = data.map(p => {
      const open = new Date(p.openTime).getTime();
      const close = p.closeTimestamp ? new Date(p.closeTimestamp).getTime() : open;
      return (close-open)/60000;
    });
    const avgHoldTime = holdTimes.length>0 ? holdTimes.reduce((a,b)=>a+b,0)/holdTimes.length : 0;
    const bestTrade = pnlArray.length>0 ? Math.max(...pnlArray) : 0;
    const worstTrade = pnlArray.length>0 ? Math.min(...pnlArray) : 0;
    return { totalTrades, winRate, averageProfit, totalProfit, averageLoss, totalLoss, profitFactor, sharpeRatio, maxDrawdown, consecutiveWins: maxWinStreak, consecutiveLosses: maxLossStreak, averageHoldTime: avgHoldTime, bestTrade, worstTrade };
  }, [closedPositions]);

  // Compute market stats from closed positions
  const marketStats = React.useMemo((): MarketStats => {
    const data: any[] = closedPositions;
    const markets = data.map(p => p.instrument);
    const counts: Record<string, number> = {};
    markets.forEach(m => counts[m] = (counts[m]||0) + 1);
    const mostTradedMarket = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
    // favoriteTimeframe/best direction not available, using defaults
    const favoriteTimeframe = '';
    const preferredDirection: 'long'|'short' = 'long';
    const activeDays = 0;
    const tradingStreak = 0;
    return { mostTradedMarket, favoriteTimeframe, preferredDirection, activeDays, tradingStreak };
  }, [closedPositions]);

  // Compute performance data for chart
  const performanceData = React.useMemo((): PerformanceData[] => {
    // Group by month-year
    const data: any[] = closedPositions;
    const groups: Record<string, { profit: number; trades: number; wins: number }> = {};
    data.forEach(p => {
      const date = new Date(p.closeTimestamp||p.openTime);
      const period = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      if (!groups[period]) groups[period] = { profit: 0, trades: 0, wins: 0 };
      groups[period].profit += (p.pnl||0);
      groups[period].trades += 1;
      if ((p.pnl||0) > 0) groups[period].wins += 1;
    });
    return Object.entries(groups).map(([period, g]) => ({ period, profit: g.profit, trades: g.trades, winRate: g.trades>0 ? (g.wins/g.trades)*100 : 0 }));
  }, [closedPositions]);

  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const liveStats = React.useMemo(() => {
    const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);
    const profitablePositions = positions.filter(pos => pos.profit > 0);
    const currentWinRate = positions.length > 0 ? (profitablePositions.length / positions.length) * 100 : 0;
    return { activePositions: positions.length, unrealizedPnL: totalProfit, currentWinRate };
  }, [positions]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Estadísticas de Trading Avanzadas</h1>
              <p className="text-muted-foreground">
                Análisis detallado de tu rendimiento con inteligencia artificial y métricas avanzadas
              </p>
            </div>

            {/* Nuevo componente de análisis interactivo */}
            <div className="mb-8">
              <InteractivePerformanceChart />
            </div>

            {/* Estadísticas en tiempo real */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posiciones Activas</p>
                <p className="text-2xl font-bold">{liveStats.activePositions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">P&L No Realizado</p>
                <p className={`text-2xl font-bold ${liveStats.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(liveStats.unrealizedPnL)}
                </p>
              </div>
              {liveStats.unrealizedPnL >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> : 
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito Actual</p>
                <p className="text-2xl font-bold">{liveStats.currentWinRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
            </div>

            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="day">Día</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
          <TabsTrigger value="year">Año</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Total de Operaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tradingStats.totalTrades}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +{Math.floor(tradingStats.totalTrades * 0.15)} este {selectedPeriod === 'day' ? 'día' : selectedPeriod === 'week' ? 'semana' : selectedPeriod === 'month' ? 'mes' : 'año'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tasa de Éxito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{tradingStats.winRate}%</div>
                <Progress value={tradingStats.winRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ganancia Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(tradingStats.totalProfit)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Promedio: {formatCurrency(tradingStats.averageProfit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Factor de Ganancia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{tradingStats.profitFactor}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ratio G/P: {(tradingStats.totalProfit / Math.abs(tradingStats.totalLoss)).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas avanzadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Métricas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ratio de Sharpe</p>
                    <p className="text-xl font-bold">{tradingStats.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                    <p className="text-xl font-bold text-red-500">{tradingStats.maxDrawdown}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mejor Operación</p>
                    <p className="text-xl font-bold text-green-500">{formatCurrency(tradingStats.bestTrade)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peor Operación</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(tradingStats.worstTrade)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Patrones de Trading
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mercado Favorito</span>
                    <Badge variant="secondary">{marketStats.mostTradedMarket}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Timeframe Preferido</span>
                    <Badge variant="outline">{marketStats.favoriteTimeframe}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Dirección Preferida</span>
                    <Badge variant={marketStats.preferredDirection === 'long' ? 'default' : 'destructive'}>
                      {marketStats.preferredDirection === 'long' ? 'Long' : 'Short'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tiempo Promedio</span>
                    <span className="font-medium">{formatTime(tradingStats.averageHoldTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rachas y consistencia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  Racha de Victorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{tradingStats.consecutiveWins}</div>
                <div className="text-xs text-muted-foreground mt-1">Operaciones consecutivas</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Días Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{marketStats.activeDays}</div>
                <div className="text-xs text-muted-foreground mt-1">En los últimos 6 meses</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Racha de Trading
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">{marketStats.tradingStreak}</div>
                <div className="text-xs text-muted-foreground mt-1">Días consecutivos</div>
              </CardContent>
            </Card>
          </div>

          {/* Rendimiento por período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Rendimiento Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="font-medium">{data.period}</div>
                      <Badge variant="outline">{data.trades} ops</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-bold ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(data.profit)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.winRate}% éxito
                        </div>
                      </div>
                      <div className="w-16">
                        <Progress value={data.winRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StatisticsPage; 