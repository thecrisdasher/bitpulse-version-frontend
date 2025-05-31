'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Zap,
  Target,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Percent,
  Activity,
  Brain,
  Settings,
  RefreshCw,
  Eye,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  purchasePrice: number;
  allocation: number;
  targetAllocation: number;
  pnl: number;
  pnlPercent: number;
  riskScore: number;
}

interface RiskMetric {
  name: string;
  current: number;
  target: number;
  status: 'good' | 'warning' | 'danger';
  description: string;
}

export function AdvancedPortfolioManager() {
  const [autoRebalanceEnabled, setAutoRebalanceEnabled] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAsset | null>(null);
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  const [portfolioAssets] = useState<PortfolioAsset[]>([
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.5,
      currentPrice: 45000,
      purchasePrice: 42000,
      allocation: 35,
      targetAllocation: 30,
      pnl: 1500,
      pnlPercent: 7.14,
      riskScore: 8.5
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 5,
      currentPrice: 3200,
      purchasePrice: 3000,
      allocation: 25,
      targetAllocation: 25,
      pnl: 1000,
      pnlPercent: 6.67,
      riskScore: 7.2
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      amount: 1000,
      currentPrice: 0.85,
      purchasePrice: 0.75,
      allocation: 15,
      targetAllocation: 20,
      pnl: 100,
      pnlPercent: 13.33,
      riskScore: 6.8
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      amount: 10,
      currentPrice: 120,
      purchasePrice: 100,
      allocation: 15,
      targetAllocation: 15,
      pnl: 200,
      pnlPercent: 20,
      riskScore: 8.9
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      amount: 100,
      currentPrice: 18,
      purchasePrice: 20,
      allocation: 10,
      targetAllocation: 10,
      pnl: -200,
      pnlPercent: -10,
      riskScore: 7.5
    }
  ]);

  const [riskMetrics] = useState<RiskMetric[]>([
    {
      name: 'Diversificación',
      current: 75,
      target: 80,
      status: 'warning',
      description: 'Distribución de activos en el portfolio'
    },
    {
      name: 'Volatilidad',
      current: 65,
      target: 50,
      status: 'danger',
      description: 'Riesgo de fluctuación de precios'
    },
    {
      name: 'Correlación',
      current: 45,
      target: 30,
      status: 'warning',
      description: 'Correlación entre activos'
    },
    {
      name: 'Liquidez',
      current: 85,
      target: 80,
      status: 'good',
      description: 'Facilidad para convertir a efectivo'
    }
  ]);

  const totalValue = portfolioAssets.reduce((sum, asset) => sum + (asset.amount * asset.currentPrice), 0);
  const totalPnL = portfolioAssets.reduce((sum, asset) => sum + asset.pnl, 0);
  const totalPnLPercent = ((totalValue - (totalValue - totalPnL)) / (totalValue - totalPnL)) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Resumen del Portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">P&L Total</p>
                  <p className={cn("text-2xl font-bold", totalPnL >= 0 ? "text-green-500" : "text-red-500")}>
                    {formatCurrency(totalPnL)}
                  </p>
                  <p className={cn("text-sm", totalPnL >= 0 ? "text-green-500" : "text-red-500")}>
                    {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                  </p>
                </div>
                {totalPnL >= 0 ? 
                  <TrendingUp className="w-8 h-8 text-green-500" /> : 
                  <TrendingDown className="w-8 h-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{portfolioAssets.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {portfolioAssets.filter(a => a.pnl > 0).length} positivos
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Riesgo Global</p>
                  <p className="text-2xl font-bold text-yellow-500">Medio</p>
                  <p className="text-sm text-muted-foreground">Score: 7.2/10</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gestión de Riesgo y Rebalanceado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis de Riesgo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Análisis de Riesgo Avanzado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metric.current}%</span>
                    <div className={cn("w-2 h-2 rounded-full", 
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={metric.current} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Objetivo: {metric.target}%</span>
                    <span className={getStatusColor(metric.status)}>
                      {metric.status === 'good' ? 'Óptimo' : 
                       metric.status === 'warning' ? 'Revisar' : 'Crítico'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Rebalanceado Automático */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Rebalanceado Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Auto-Rebalanceado</span>
                <motion.button
                  onClick={() => setAutoRebalanceEnabled(!autoRebalanceEnabled)}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    autoRebalanceEnabled ? "bg-primary" : "bg-muted"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full absolute top-1"
                    animate={{ x: autoRebalanceEnabled ? 20 : 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground">
                Rebalance automático cuando la desviación supere el 5%
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Sugerencias de Rebalanceo:</h4>
              
              {portfolioAssets
                .filter(asset => Math.abs(asset.allocation - asset.targetAllocation) > 2)
                .map((asset, index) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-l-yellow-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{asset.symbol}</span>
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                        {asset.allocation > asset.targetAllocation ? 'Reducir' : 'Aumentar'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Actual: {asset.allocation}% → Objetivo: {asset.targetAllocation}%
                    </div>
                    <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mt-1">
                      {asset.allocation > asset.targetAllocation ? 'Vender' : 'Comprar'}: 
                      {Math.abs(asset.allocation - asset.targetAllocation).toFixed(1)}%
                    </div>
                  </motion.div>
                ))}
            </div>

            <Button className="w-full" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ejecutar Rebalanceado
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Activos Detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Activos del Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolioAssets.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                  selectedAsset?.symbol === asset.symbol ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(asset.amount * asset.currentPrice)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.amount} {asset.symbol}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cn(
                        "font-medium",
                        asset.pnl >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {asset.pnl >= 0 ? '+' : ''}{formatCurrency(asset.pnl)}
                      </div>
                      <div className={cn(
                        "text-sm",
                        asset.pnl >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(2)}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">{asset.allocation}%</div>
                      <div className="w-16">
                        <Progress value={asset.allocation} className="h-1" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-sm">Riesgo:</span>
                      <Badge className={cn(
                        "text-xs",
                        asset.riskScore >= 8 ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300" :
                        asset.riskScore >= 6 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" :
                        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      )}>
                        {asset.riskScore.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Indicador de desviación de la asignación objetivo */}
                {Math.abs(asset.allocation - asset.targetAllocation) > 2 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      Fuera del objetivo ({asset.targetAllocation}%) por {Math.abs(asset.allocation - asset.targetAllocation).toFixed(1)}%
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 