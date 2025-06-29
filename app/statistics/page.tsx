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
  Zap,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTradePositions } from "@/contexts/TradePositionsContext";
import Sidebar from "@/components/Sidebar";
import { InteractivePerformanceChart } from "@/components/advanced-statistics/InteractivePerformanceChart";
import { useStatistics } from "@/hooks/useStatistics";

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
  const { 
    closedPositions, 
    tradingStats, 
    marketStats, 
    performanceData, 
    loading, 
    error,
    refetchData 
  } = useStatistics();

  // All statistics are now computed in the useStatistics hook

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
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const liveStats = React.useMemo(() => {
    const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);
    const profitablePositions = positions.filter(pos => pos.profit > 0);
    const currentWinRate = positions.length > 0 ? (profitablePositions.length / positions.length) * 100 : 0;
    return { activePositions: positions.length, unrealizedPnL: totalProfit, currentWinRate };
  }, [positions]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando estadísticas...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            <div className="container mx-auto max-w-7xl">
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-96 flex-col gap-4">
                    <div className="text-red-500 text-center">
                      <h3 className="text-lg font-semibold mb-2">Error al cargar estadísticas</h3>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Intentar de nuevo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Estadísticas de Trading Avanzadas</h1>
                  <p className="text-muted-foreground">
                    Análisis detallado de tu rendimiento con inteligencia artificial y métricas avanzadas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {closedPositions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {closedPositions.length} operaciones analizadas
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetchData}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>

            {/* Componente de análisis interactivo mejorado */}
            <div className="mb-8">
              <InteractivePerformanceChart 
                closedPositions={closedPositions}
                liveStats={liveStats}
              />
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
                        Operaciones completadas
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
                      <div className="text-2xl font-bold text-green-500">{tradingStats.winRate.toFixed(1)}%</div>
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
                      <div className={`text-2xl font-bold ${tradingStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
                      <div className="text-2xl font-bold text-blue-500">{tradingStats.profitFactor.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tradingStats.profitFactor > 1 ? 'Rentable' : 'En pérdida'}
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
                          <p className="text-xl font-bold">{tradingStats.sharpeRatio.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                          <p className="text-xl font-bold text-red-500">{tradingStats.maxDrawdown.toFixed(1)}%</p>
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
                      <div className="text-xs text-muted-foreground mt-1">Días con operaciones</div>
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
                {performanceData.length > 0 && (
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
                                  {data.winRate.toFixed(1)}% éxito
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
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StatisticsPage; 