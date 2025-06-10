'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Eye, 
  Bot,
  AlertTriangle,
  Target,
  Sparkles,
  Activity,
  ChartLine,
  Compass,
  Shield,
  Rocket,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import useAIMarketInsights from '@/hooks/useAIMarketInsights';
import useMarketSentiment from '@/hooks/useMarketSentiment';

interface MarketPrediction {
  market: string;
  direction: 'up' | 'down';
  confidence: number;
  timeframe: string;
  potentialGain: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

interface SmartAlert {
  id: string;
  type: 'breakout' | 'support' | 'volatility';
  market: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  action?: string;
}

export function MarketSimulator() {
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [aiAssistanceLevel, setAiAssistanceLevel] = useState([75]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<MarketPrediction | null>(null);

  const { predictions, alerts: smartAlerts, monitored, patterns, activeAlerts, precisionToday } = useAIMarketInsights([
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'MATICUSDT'
  ]);

  const sentiment = useMarketSentiment();
  const marketSentiment = {
    overall: sentiment.text === 'miedo' ? 'bajista' : sentiment.text === 'codicia' ? 'alcista' : 'neutral',
    fear: sentiment.score < 50 ? sentiment.score : 100 - sentiment.score,
    greed: sentiment.score >= 50 ? sentiment.score : 100 - sentiment.score,
    momentum: 'fuerte',
    volatilidad: 'moderada'
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de Control Principal */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Centro de Trading Inteligente
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles de AI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Simulación en Tiempo Real</label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={isSimulationActive} 
                  onCheckedChange={setIsSimulationActive}
                />
                <span className="text-sm text-muted-foreground">
                  {isSimulationActive ? 'Activa' : 'Pausada'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nivel de Asistencia AI</label>
              <Slider
                value={aiAssistanceLevel}
                onValueChange={setAiAssistanceLevel}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                {aiAssistanceLevel[0]}% - {aiAssistanceLevel[0] > 80 ? 'Máximo' : aiAssistanceLevel[0] > 50 ? 'Alto' : 'Moderado'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auto-Trading</label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={autoTradingEnabled} 
                  onCheckedChange={setAutoTradingEnabled}
                />
                <span className="text-sm text-muted-foreground">
                  {autoTradingEnabled ? 'Habilitado' : 'Manual'}
                </span>
              </div>
            </div>
          </div>

          {/* Estado del sistema */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Estado del Sistema AI</span>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <span className="text-sm text-green-600">Operativo</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Mercados monitoreados:</span>
                <span className="font-medium ml-1">{monitored}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Patrones detectados:</span>
                <span className="font-medium ml-1">{patterns}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Alertas activas:</span>
                <span className="font-medium ml-1">{activeAlerts}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Precisión del día:</span>
                <span className="font-medium ml-1 text-green-600">{precisionToday}%</span>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Predicciones AI y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predicciones AI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Predicciones AI de Alto Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <motion.div
                  key={prediction.market}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    selectedPrediction?.market === prediction.market 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prediction.market}</span>
                      <Badge className={cn(
                        "text-xs",
                        prediction.direction === 'up' 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      )}>
                        {prediction.direction === 'up' ? 'LONG' : 'SHORT'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600">
                        {prediction.potentialGain}
                      </span>
                      <span className={cn("text-xs font-medium", getRiskColor(prediction.riskLevel))}>
                        {prediction.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confianza AI:</span>
                      <span className="font-medium">{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Timeframe: {prediction.timeframe}</span>
                      <span>🎯 {prediction.reasoning}</span>
                    </div>
                  </div>

                  {autoTradingEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-border"
                    >
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant={prediction.direction === 'up' ? 'default' : 'destructive'}
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Ejecutar Automáticamente
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas Inteligentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Alertas Inteligentes en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {smartAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    getUrgencyColor(alert.urgency)
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {/* {alert.type === 'ai' && <Brain className="w-4 h-4 text-purple-500" />} */}
                        {alert.type === 'breakout' && <Rocket className="w-4 h-4 text-green-500" />}
                        {alert.type === 'support' && <Shield className="w-4 h-4 text-blue-500" />}
                        {alert.type === 'volatility' && <Gauge className="w-4 h-4 text-orange-500" />}
                        <span className="text-sm font-medium">{alert.market}</span>
                      </div>
                      {alert.urgency === 'high' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      hace {Math.floor(Math.random() * 10 + 1)}m
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{alert.message}</p>
                  
                  {alert.action && (
                    <div className="flex items-center gap-2">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        {alert.action}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Sentimiento del Mercado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            Análisis de Sentimiento del Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Sentimiento General</span>
              </div>
              <div className="text-2xl font-bold text-green-500 capitalize">
                {marketSentiment.overall}
              </div>
              <div className="text-xs text-muted-foreground">
                Basado en 15 indicadores
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Índice de Miedo</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{marketSentiment.fear}</div>
                <Progress value={marketSentiment.fear} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Índice de Codicia</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-500">{marketSentiment.greed}</div>
                <Progress value={marketSentiment.greed} className="h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Momentum</span>
              </div>
              <div className="text-2xl font-bold text-purple-500 capitalize">
                {marketSentiment.momentum}
              </div>
              <div className="text-xs text-muted-foreground">
                Volatilidad: {marketSentiment.volatilidad}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 