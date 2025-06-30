'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Zap,
  Target,
  Brain,
  Trophy,
  Activity,
  DollarSign,
  Percent,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Bar,
  Line,
  Legend
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClosedPosition {
  id: string;
  instrument: string;
  openTime: string;
  closeTimestamp?: string;
  openPrice: number;
  closePrice?: number;
  pnl?: number;
}

interface PerformanceData {
  date: string;
  profit: number;
  trades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  cumulativeProfit: number;
}

interface TradingMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

type MetricType = 'profit' | 'winRate' | 'sharpeRatio' | 'maxDrawdown' | 'volatility' | 'cumulative';

interface InteractivePerformanceChartProps {
  closedPositions?: ClosedPosition[];
  liveStats?: {
    activePositions: number;
    unrealizedPnL: number;
    currentWinRate: number;
  };
}

export function InteractivePerformanceChart({ 
  closedPositions = [], 
  liveStats 
}: InteractivePerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('profit');
  const [loading, setLoading] = useState(true);
  const [internalClosedPositions, setInternalClosedPositions] = useState<ClosedPosition[]>([]);

  // Fetch closed positions if not provided as props
  useEffect(() => {
    if (closedPositions.length > 0) {
      setInternalClosedPositions(closedPositions);
      setLoading(false);
    } else {
      const fetchClosedPositions = async () => {
        try {
          setLoading(true);
          const res = await fetch('/api/trading/positions?status=closed', { credentials: 'include' });
          const json = await res.json();
          if (json.success) {
            setInternalClosedPositions(json.data || []);
          }
        } catch (err) {
          console.error('Error fetching closed positions:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchClosedPositions();
    }
  }, [closedPositions]);

  // Process performance data based on period
  const performanceData = useMemo((): PerformanceData[] => {
    if (internalClosedPositions.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;

    switch (selectedPeriod) {
      case '1M':
        startDate = subMonths(now, 1);
        groupByFormat = 'dd/MM';
        break;
      case '3M':
        startDate = subMonths(now, 3);
        groupByFormat = 'dd/MM';
        break;
      case '6M':
        startDate = subMonths(now, 6);
        groupByFormat = 'MMM yyyy';
        break;
      case '1Y':
        startDate = subMonths(now, 12);
        groupByFormat = 'MMM yyyy';
        break;
      default:
        startDate = subMonths(now, 6);
        groupByFormat = 'MMM yyyy';
    }

    // Filter positions within the selected period
    const filteredPositions = internalClosedPositions.filter(pos => {
      const closeDate = new Date(pos.closeTimestamp || pos.openTime);
      return closeDate >= startDate && closeDate <= now;
    });

    // Group by period
    const groups: Record<string, { 
      profit: number; 
      trades: number; 
      wins: number; 
      positions: ClosedPosition[];
      date: Date;
    }> = {};

    filteredPositions.forEach(pos => {
      const closeDate = new Date(pos.closeTimestamp || pos.openTime);
      const periodKey = format(closeDate, groupByFormat, { locale: es });
      
      if (!groups[periodKey]) {
        groups[periodKey] = { 
          profit: 0, 
          trades: 0, 
          wins: 0, 
          positions: [], 
          date: closeDate 
        };
      }
      
      const pnl = pos.pnl || 0;
      groups[periodKey].profit += pnl;
      groups[periodKey].trades += 1;
      groups[periodKey].positions.push(pos);
      if (pnl > 0) groups[periodKey].wins += 1;
    });

    // Convert to array and calculate metrics
    let cumulativeProfit = 0;
    const data = Object.entries(groups)
      .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
      .map(([period, g]) => {
        cumulativeProfit += g.profit;
        const winRate = g.trades > 0 ? (g.wins / g.trades) * 100 : 0;
        
        // Calculate Sharpe ratio for this period
        const pnlArray = g.positions.map(p => p.pnl || 0);
        const meanPnl = pnlArray.length > 0 ? pnlArray.reduce((a, b) => a + b, 0) / pnlArray.length : 0;
        const variance = pnlArray.length > 1 
          ? pnlArray.reduce((a, b) => a + Math.pow(b - meanPnl, 2), 0) / (pnlArray.length - 1) 
          : 0;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev !== 0 ? meanPnl / stdDev : 0;
        
        // Calculate max drawdown for this period
        const cumArray: number[] = [];
        let runningSum = 0;
        pnlArray.forEach(pnl => {
          runningSum += pnl;
          cumArray.push(runningSum);
        });
        
        let peak = 0;
        let maxDd = 0;
        cumArray.forEach(val => {
          peak = Math.max(peak, val);
          const dd = peak - val;
          maxDd = Math.max(maxDd, dd);
        });
        const maxDrawdown = peak !== 0 ? -(maxDd / peak) * 100 : 0;
        
        // Calculate volatility (standard deviation of returns)
        const volatility = stdDev;
        
        return {
          date: period,
          profit: g.profit,
          trades: g.trades,
          winRate,
          sharpeRatio,
          maxDrawdown,
          volatility,
          cumulativeProfit
        };
      });

    return data;
  }, [internalClosedPositions, selectedPeriod]);

  // Calculate overall metrics
  const metrics = useMemo((): TradingMetric[] => {
    if (internalClosedPositions.length === 0) {
      return [
    {
      name: 'Ganancia Total',
          value: '$0',
          change: '0%',
          trend: 'neutral',
      icon: DollarSign,
          color: 'text-muted-foreground'
    },
    {
      name: 'Tasa de Éxito',
          value: '0%',
          change: '0%',
          trend: 'neutral',
      icon: Target,
          color: 'text-muted-foreground'
    },
    {
      name: 'Sharpe Ratio',
          value: '0',
          change: '0',
          trend: 'neutral',
      icon: Brain,
          color: 'text-muted-foreground'
    },
    {
      name: 'Max Drawdown',
          value: '0%',
          change: '0%',
          trend: 'neutral',
      icon: TrendingDown,
          color: 'text-muted-foreground'
        }
      ];
    }

    const totalProfit = internalClosedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const totalTrades = internalClosedPositions.length;
    const wins = internalClosedPositions.filter(pos => (pos.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    
    // Calculate Sharpe ratio
    const pnlArray = internalClosedPositions.map(p => p.pnl || 0);
    const meanPnl = pnlArray.length > 0 ? pnlArray.reduce((a, b) => a + b, 0) / pnlArray.length : 0;
    const variance = pnlArray.length > 1 
      ? pnlArray.reduce((a, b) => a + Math.pow(b - meanPnl, 2), 0) / (pnlArray.length - 1) 
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev !== 0 ? meanPnl / stdDev : 0;
    
    // Calculate max drawdown
    const cumArray: number[] = [];
    let runningSum = 0;
    pnlArray.forEach(pnl => {
      runningSum += pnl;
      cumArray.push(runningSum);
    });
    
    let peak = 0;
    let maxDd = 0;
    cumArray.forEach(val => {
      peak = Math.max(peak, val);
      const dd = peak - val;
      maxDd = Math.max(maxDd, dd);
    });
    const maxDrawdown = peak !== 0 ? -(maxDd / peak) * 100 : 0;

    // Calculate period comparison for trend indicators (comparing last 2 periods)
    const lastTwoPeriods = performanceData.slice(-2);
    const profitTrend = lastTwoPeriods.length === 2 
      ? lastTwoPeriods[1].profit > lastTwoPeriods[0].profit ? 'up' : 'down'
      : 'neutral';
    const winRateTrend = lastTwoPeriods.length === 2 
      ? lastTwoPeriods[1].winRate > lastTwoPeriods[0].winRate ? 'up' : 'down'
      : 'neutral';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

    return [
      {
        name: 'Ganancia Total',
        value: formatCurrency(totalProfit),
        change: lastTwoPeriods.length === 2 
          ? `${lastTwoPeriods[1].profit > 0 ? '+' : ''}${((lastTwoPeriods[1].profit / Math.abs(lastTwoPeriods[0].profit || 1)) * 100).toFixed(1)}%`
          : '0%',
        trend: profitTrend,
        icon: DollarSign,
        color: totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
      },
      {
        name: 'Tasa de Éxito',
        value: `${winRate.toFixed(1)}%`,
        change: lastTwoPeriods.length === 2 
          ? `${lastTwoPeriods[1].winRate > lastTwoPeriods[0].winRate ? '+' : ''}${(lastTwoPeriods[1].winRate - lastTwoPeriods[0].winRate).toFixed(1)}%`
          : '0%',
        trend: winRateTrend,
        icon: Target,
        color: 'text-blue-500'
      },
      {
        name: 'Sharpe Ratio',
        value: sharpeRatio.toFixed(2),
        change: lastTwoPeriods.length === 2 
          ? `${lastTwoPeriods[1].sharpeRatio > lastTwoPeriods[0].sharpeRatio ? '+' : ''}${(lastTwoPeriods[1].sharpeRatio - lastTwoPeriods[0].sharpeRatio).toFixed(2)}`
          : '0',
        trend: lastTwoPeriods.length === 2 
          ? lastTwoPeriods[1].sharpeRatio > lastTwoPeriods[0].sharpeRatio ? 'up' : 'down'
          : 'neutral',
        icon: Brain,
        color: 'text-purple-500'
      },
      {
        name: 'Max Drawdown',
        value: `${maxDrawdown.toFixed(1)}%`,
        change: lastTwoPeriods.length === 2 
          ? `${lastTwoPeriods[1].maxDrawdown > lastTwoPeriods[0].maxDrawdown ? '+' : ''}${(lastTwoPeriods[1].maxDrawdown - lastTwoPeriods[0].maxDrawdown).toFixed(1)}%`
          : '0%',
        trend: lastTwoPeriods.length === 2 
          ? lastTwoPeriods[1].maxDrawdown < lastTwoPeriods[0].maxDrawdown ? 'up' : 'down'
          : 'neutral',
        icon: TrendingDown,
        color: 'text-orange-500'
      }
    ];
  }, [internalClosedPositions, performanceData]);

  const getChartData = () => {
    switch (selectedMetric) {
      case 'profit':
        return performanceData.map(d => ({ ...d, value: d.profit, name: d.date }));
      case 'winRate':
        return performanceData.map(d => ({ ...d, value: d.winRate, name: d.date }));
      case 'sharpeRatio':
        return performanceData.map(d => ({ ...d, value: d.sharpeRatio, name: d.date }));
      case 'maxDrawdown':
        return performanceData.map(d => ({ ...d, value: Math.abs(d.maxDrawdown), name: d.date }));
      case 'volatility':
        return performanceData.map(d => ({ ...d, value: d.volatility, name: d.date }));
      case 'cumulative':
        return performanceData.map(d => ({ ...d, value: d.cumulativeProfit, name: d.date }));
      default:
        return performanceData.map(d => ({ ...d, value: d.profit, name: d.date }));
    }
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'profit': return 'Ganancia';
      case 'winRate': return 'Tasa de Éxito (%)';
      case 'sharpeRatio': return 'Sharpe Ratio';
      case 'maxDrawdown': return 'Max Drawdown (%)';
      case 'volatility': return 'Volatilidad';
      case 'cumulative': return 'Ganancia Acumulada';
    }
  };

  const getMetricColor = (metric: MetricType) => {
    switch (metric) {
      case 'profit': return '#10b981';
      case 'winRate': return '#3b82f6';
      case 'sharpeRatio': return '#8b5cf6';
      case 'maxDrawdown': return '#f59e0b';
      case 'volatility': return '#ef4444';
      case 'cumulative': return '#06b6d4';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando estadísticas...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Métricas principales con animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {metric.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      >
                        <Badge 
                          className={cn(
                            "text-xs",
                            metric.trend === 'up' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300" :
                            metric.trend === 'down' ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                          )}
                        >
                          {metric.change}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <metric.icon className={cn("w-8 h-8", metric.color)} />
                  </motion.div>
                </div>
              </CardContent>
              
              {/* Efecto de brillo animado */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 5,
                  ease: "easeInOut"
                }}
              />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfico interactivo principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Análisis de Rendimiento Avanzado
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Ganancia</SelectItem>
                  <SelectItem value="cumulative">Ganancia Acumulada</SelectItem>
                  <SelectItem value="winRate">Tasa de Éxito</SelectItem>
                  <SelectItem value="sharpeRatio">Sharpe Ratio</SelectItem>
                  <SelectItem value="maxDrawdown">Max Drawdown</SelectItem>
                  <SelectItem value="volatility">Volatilidad</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1 Mes</SelectItem>
                  <SelectItem value="3M">3 Meses</SelectItem>
                  <SelectItem value="6M">6 Meses</SelectItem>
                  <SelectItem value="1Y">1 Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === 'cumulative' ? (
                  <RechartsAreaChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => {
                        const currencyMetrics: MetricType[] = ['profit', 'cumulative'];
                        const percentageMetrics: MetricType[] = ['winRate', 'maxDrawdown'];
                        
                        let formattedValue: string;
                        if (currencyMetrics.includes(selectedMetric)) {
                          formattedValue = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
                        } else if (percentageMetrics.includes(selectedMetric)) {
                          formattedValue = `${value.toFixed(1)}%`;
                        } else {
                          formattedValue = value.toFixed(2);
                        }
                        
                        return [formattedValue, getMetricLabel(selectedMetric)];
                      }}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={getMetricColor(selectedMetric)}
                      fill={getMetricColor(selectedMetric)}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RechartsAreaChart>
                ) : (
                  <RechartsLineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => {
                        const currencyMetrics: MetricType[] = ['profit', 'cumulative'];
                        const percentageMetrics: MetricType[] = ['winRate', 'maxDrawdown'];
                        
                        let formattedValue: string;
                        if (currencyMetrics.includes(selectedMetric)) {
                          formattedValue = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
                        } else if (percentageMetrics.includes(selectedMetric)) {
                          formattedValue = `${value.toFixed(1)}%`;
                        } else {
                          formattedValue = value.toFixed(2);
                        }
                        
                        return [formattedValue, getMetricLabel(selectedMetric)];
                      }}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={getMetricColor(selectedMetric)}
                      strokeWidth={3}
                      dot={{ fill: getMetricColor(selectedMetric), r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
              <BarChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                    No hay datos suficientes
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                    Realiza algunas operaciones para ver estadísticas detalladas
              </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análisis comparativo y insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Comparación con Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Tu Rendimiento', value: metrics[1]?.value ? parseFloat(metrics[1].value.replace('%', '')) : 0, color: 'bg-primary' },
                { name: 'Promedio Plataforma', value: 52.3, color: 'bg-blue-500' },
                { name: 'Top 10%', value: 78.9, color: 'bg-green-500' },
                { name: 'Traders Expertos', value: 85.2, color: 'bg-yellow-500' }
              ].map((benchmark, index) => (
                <motion.div
                  key={benchmark.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{benchmark.name}</span>
                    <span>{benchmark.value.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className={cn("h-2 rounded-full", benchmark.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(benchmark.value, 100)}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Insights Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.length > 0 && (
                <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-l-green-500"
              >
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Análisis de Tendencia
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {performanceData.slice(-2).length === 2 && performanceData.slice(-2)[1].profit > performanceData.slice(-2)[0].profit
                            ? "Tu rendimiento ha mejorado en el último período"
                            : "Mantén la consistencia en tu estrategia de trading"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-l-blue-500"
              >
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Oportunidad de Optimización
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {parseFloat(metrics[1]?.value?.replace('%', '') || '0') < 60 
                            ? "Considera revisar tu estrategia para mejorar la tasa de éxito"
                            : "Excelente tasa de éxito, mantén tu disciplina"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-l-purple-500"
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Patrón Detectado
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Has realizado {internalClosedPositions.length} operaciones en total
                          {internalClosedPositions.length > 0 && `, con un promedio de ${(internalClosedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0) / internalClosedPositions.length).toFixed(0)} COP por operación`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
              
              {performanceData.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border-l-4 border-l-gray-500"
                >
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Comienza tu viaje de trading
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Realiza algunas operaciones para comenzar a ver insights personalizados
                    </p>
                  </div>
                </div>
              </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
} 