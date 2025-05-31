'use client';

import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceData {
  date: string;
  profit: number;
  trades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

interface TradingMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

export function InteractivePerformanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  const [selectedMetric, setSelectedMetric] = useState('profit');
  const [performanceData] = useState<PerformanceData[]>([
    { date: '2024-01', profit: 1250.30, trades: 45, winRate: 71.1, sharpeRatio: 1.85, maxDrawdown: -8.2, volatility: 12.5 },
    { date: '2024-02', profit: 890.50, trades: 38, winRate: 65.8, sharpeRatio: 1.72, maxDrawdown: -12.1, volatility: 15.8 },
    { date: '2024-03', profit: 1580.20, trades: 52, winRate: 75.0, sharpeRatio: 2.15, maxDrawdown: -6.5, volatility: 10.2 },
    { date: '2024-04', profit: -320.10, trades: 29, winRate: 55.2, sharpeRatio: 0.95, maxDrawdown: -18.7, volatility: 22.1 },
    { date: '2024-05', profit: 2140.75, trades: 61, winRate: 78.7, sharpeRatio: 2.45, maxDrawdown: -4.8, volatility: 8.9 },
    { date: '2024-06', profit: 1650.80, trades: 48, winRate: 68.8, sharpeRatio: 1.95, maxDrawdown: -9.3, volatility: 13.4 }
  ]);

  const [metrics] = useState<TradingMetric[]>([
    {
      name: 'Ganancia Total',
      value: '$7,191.45',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      name: 'Tasa de Éxito',
      value: '69.1%',
      change: '+2.8%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-500'
    },
    {
      name: 'Sharpe Ratio',
      value: '1.84',
      change: '+0.15',
      trend: 'up',
      icon: Brain,
      color: 'text-purple-500'
    },
    {
      name: 'Max Drawdown',
      value: '-9.9%',
      change: '-1.2%',
      trend: 'down',
      icon: TrendingDown,
      color: 'text-orange-500'
    }
  ]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Análisis de Rendimiento Avanzado
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Ganancia</SelectItem>
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
          <div className="h-80 w-full bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <BarChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Gráfico Interactivo de {selectedMetric}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Período: {selectedPeriod}
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis comparativo */}
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
                { name: 'Tu Rendimiento', value: 69.1, color: 'bg-primary' },
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
                    <span>{benchmark.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className={cn("h-2 rounded-full", benchmark.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${benchmark.value}%` }}
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
                      Mejora Consistente
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Tu tasa de éxito ha mejorado 12% en los últimos 3 meses
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
                      Considera reducir el tamaño de posición los viernes para mejorar el Sharpe Ratio
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
                      Tus mejores resultados ocurren entre 10:00-14:00 GMT
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
} 