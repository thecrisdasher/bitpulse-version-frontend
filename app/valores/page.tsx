'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Zap, 
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketAnalysis } from '@/lib/hooks/useMarketAnalysis';

const AVAILABLE_PAIRS = [
  { value: 'BTC/USD', label: 'Bitcoin (BTC)' },
  { value: 'ETH/USD', label: 'Ethereum (ETH)' },
  { value: 'XRP/USD', label: 'Ripple (XRP)' },
  { value: 'LTC/USD', label: 'Litecoin (LTC)' },
  { value: 'ADA/USD', label: 'Cardano (ADA)' }
];

const TIMEFRAMES = [
  { value: 300, label: '5m' },
  { value: 900, label: '15m' },
  { value: 3600, label: '1h' },
  { value: 14400, label: '4h' },
  { value: 86400, label: '1d' }
];

const TrendIndicator = ({ trend }: { trend: 'ALCISTA' | 'BAJISTA' | 'LATERAL' }) => {
  const config = {
    ALCISTA: {
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Alcista'
    },
    BAJISTA: {
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Bajista'
    },
    LATERAL: {
      icon: Activity,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      label: 'Lateral'
    }
  };

  const { icon: Icon, color, bg, label } = config[trend];

  return (
    <Badge variant="outline" className={cn("gap-2 px-3 py-1", bg)}>
      <Icon className={cn("h-4 w-4", color)} />
      <span className={color}>{label}</span>
    </Badge>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  description 
}: {
  title: string;
  value: number;
  unit?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">
                {value.toFixed(2)}{unit}
              </p>
            </div>
          </div>
          {trend && (
            <div className={cn(
              "p-1 rounded-full",
              trend === 'up' && "bg-green-500/10",
              trend === 'down' && "bg-red-500/10",
              trend === 'neutral' && "bg-gray-500/10"
            )}>
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {trend === 'neutral' && <Activity className="h-4 w-4 text-gray-500" />}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SignalCard = ({ 
  type, 
  confidence, 
  reasons, 
  action 
}: {
  type: 'entry' | 'exit' | 'hold';
  confidence: number;
  reasons: string[];
  action?: () => void;
}) => {
  const config = {
    entry: {
      icon: Target,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Señal de Entrada'
    },
    exit: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: 'Señal de Salida'
    },
    hold: {
      icon: Shield,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      label: 'Mantener Posición'
    }
  };

  const { icon: Icon, color, bg, border, label } = config[type];

  return (
    <Card className={cn("transition-all hover:shadow-md", border)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <CardTitle className="text-lg">{label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Confianza: {confidence}%
              </p>
            </div>
          </div>
          <Badge 
            variant={confidence > 75 ? "default" : confidence > 50 ? "secondary" : "outline"}
            className="text-xs"
          >
            {confidence > 75 ? 'Alta' : confidence > 50 ? 'Media' : 'Baja'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">Análisis:</p>
          {reasons.map((reason, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          ))}
        </div>
        {action && (
          <Button 
            className="w-full mt-4" 
            variant={type === 'entry' ? 'default' : 'outline'}
            onClick={action}
          >
            {type === 'entry' ? 'Abrir Posición' : type === 'exit' ? 'Cerrar Posición' : 'Ver Detalles'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default function ValoresPage() {
  const [selectedPair, setSelectedPair] = useState('BTC/USD');
  const [timeframe, setTimeframe] = useState(3600);
  const [activeTab, setActiveTab] = useState('overview');

  const { analysis, loading, error } = useMarketAnalysis({
    symbol: selectedPair,
    timeframe
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Análisis Técnico</h1>
          <p className="text-muted-foreground">
            Análisis avanzado de mercado con indicadores técnicos en tiempo real
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_PAIRS.map(pair => (
                <SelectItem key={pair.value} value={pair.value}>
                  {pair.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeframe.toString()} onValueChange={(value) => setTimeframe(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map(tf => (
                <SelectItem key={tf.value} value={tf.value.toString()}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              <p>Analizando mercado...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/20">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="signals">Señales</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Precio Actual"
                value={analysis.bestEntryPoint.price}
                unit="$"
                icon={DollarSign}
                description="Precio de entrada recomendado"
              />
              <MetricCard
                title="Confianza"
                value={analysis.bestEntryPoint.confidence}
                unit="%"
                icon={Target}
                trend={analysis.bestEntryPoint.confidence > 70 ? 'up' : 'neutral'}
                description="Nivel de confianza del análisis"
              />
              <MetricCard
                title="Volatilidad"
                value={analysis.marketCondition.volatility}
                unit="%"
                icon={Activity}
                trend={analysis.marketCondition.volatility > 3 ? 'up' : 'down'}
                description="Volatilidad del mercado"
              />
              <MetricCard
                title="Riesgo"
                value={analysis.marketCondition.risk}
                unit="%"
                icon={Shield}
                trend={analysis.marketCondition.risk > 50 ? 'down' : 'up'}
                description="Nivel de riesgo actual"
              />
            </div>

            {/* Condición del mercado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  Condición del Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Tendencia</p>
                    <TrendIndicator trend={analysis.marketCondition.trend} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Fuerza</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analysis.marketCondition.strength}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-[3rem]">
                        {analysis.marketCondition.strength}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Timeframe</p>
                    <Badge variant="outline" className="px-3 py-1">
                      <Clock className="h-4 w-4 mr-2" />
                      {analysis.bestEntryPoint.timeframe}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SignalCard
                type="entry"
                confidence={analysis.bestEntryPoint.confidence}
                reasons={analysis.bestEntryPoint.reason}
                action={() => console.log('Abrir posición')}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="h-5 w-5" />
                    Niveles de Trading
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Take Profit</span>
                    <span className="font-bold text-green-600">
                      ${analysis.bestEntryPoint.takeProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                    <span className="text-sm font-medium">Entrada</span>
                    <span className="font-bold text-blue-600">
                      ${analysis.bestEntryPoint.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                    <span className="text-sm font-medium">Stop Loss</span>
                    <span className="font-bold text-red-600">
                      ${analysis.bestEntryPoint.stopLoss.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ratio R/R</span>
                      <span className="font-medium">
                        1:{((analysis.bestEntryPoint.takeProfit - analysis.bestEntryPoint.price) / 
                           (analysis.bestEntryPoint.price - analysis.bestEntryPoint.stopLoss)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Tendencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Dirección</span>
                      <TrendIndicator trend={analysis.marketCondition.trend} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fuerza</span>
                      <span className="font-medium">{analysis.marketCondition.strength}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Volatilidad</span>
                      <Badge variant={analysis.marketCondition.volatility > 3 ? "destructive" : "secondary"}>
                        {analysis.marketCondition.volatility.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Nivel de Riesgo</span>
                      <Badge variant={analysis.marketCondition.risk > 70 ? "destructive" : "secondary"}>
                        {analysis.marketCondition.risk > 70 ? 'Alto' : 
                         analysis.marketCondition.risk > 40 ? 'Medio' : 'Bajo'}
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          analysis.marketCondition.risk > 70 ? "bg-red-500" : 
                          analysis.marketCondition.risk > 40 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${analysis.marketCondition.risk}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysis.marketCondition.risk > 70 ? 
                        'Condiciones de alto riesgo. Considere reducir el tamaño de posición.' :
                        analysis.marketCondition.risk > 40 ?
                        'Riesgo moderado. Use gestión de capital apropiada.' :
                        'Condiciones de bajo riesgo. Entorno favorable para trading.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Criptomonedas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Clasificación basada en análisis técnico y fundamentales
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.bestCrypto.map((crypto, index) => (
                    <div 
                      key={crypto.symbol} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{crypto.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {crypto.score}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={crypto.score > 70 ? "default" : "secondary"}
                          className="mb-2"
                        >
                          {crypto.score > 70 ? 'Recomendado' : 'Neutro'}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {crypto.reason.slice(0, 2).map((reason, idx) => (
                            <div key={idx}>• {reason}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 