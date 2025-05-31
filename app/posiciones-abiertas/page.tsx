"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CompatButton as Button } from "@/components/ui/compat-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, History, TrendingUp, Clock, Shield, Calculator, Activity, BarChart3, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cryptocurrencies } from "@/lib/mockData"
import OpenPositions from "@/components/OpenPositions"
import { useTradePositions } from "@/contexts/TradePositionsContext"
import { CompatBadge as Badge } from "@/components/ui/compat-badge"
import { RiskManagement } from "@/components/RiskManagement"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function PosicionesAbiertasPage() {
  const [performance, setPerformance] = useState({ 
    daily: 2.5, 
    weekly: -1.2, 
    monthly: 15.3, 
    allTime: 45.7 
  })
  
  // Obtener las posiciones abiertas del contexto
  const { 
    positions, 
    removePosition, 
    getTotalMarginUsed, 
    getTotalFreeMargin, 
    getTotalMarginLevel, 
    getTotalUnrealizedPnL 
  } = useTradePositions();
  
  // Estados para métricas de riesgo agregadas
  const [riskMetrics, setRiskMetrics] = useState({
    totalCapital: 10000,
    totalMarginUsed: 0,
    totalFreeMargin: 10000,
    totalMarginLevel: 0,
    totalUnrealizedPnL: 0,
    openPositionsCount: 0
  });

  // Simular precios de mercado en tiempo real
  const [marketPrices, setMarketPrices] = useState({
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'BTCUSD': 43250.00,
    'ETHUSD': 2640.00,
    'XAUUSD': 2040.50
  });

  // Actualizar precios en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketPrices(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(symbol => {
          const change = (Math.random() - 0.5) * 0.02; // Cambio de ±1%
          updated[symbol as keyof typeof updated] *= (1 + change);
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Calcular métricas agregadas basadas en las posiciones
  useEffect(() => {
    const totalMarginUsed = getTotalMarginUsed();
    const totalFreeMargin = getTotalFreeMargin(riskMetrics.totalCapital);
    const totalMarginLevel = getTotalMarginLevel(riskMetrics.totalCapital);
    const totalUnrealizedPnL = getTotalUnrealizedPnL();

    setRiskMetrics(prev => ({
      ...prev,
      totalMarginUsed,
      totalFreeMargin,
      totalMarginLevel,
      totalUnrealizedPnL,
      openPositionsCount: positions.length
    }));
  }, [positions, riskMetrics.totalCapital, getTotalMarginUsed, getTotalFreeMargin, getTotalMarginLevel, getTotalUnrealizedPnL]);

  // Obtener color del nivel de margen
  const getMarginLevelColor = (level: number) => {
    if (level >= 200) return 'text-green-500';
    if (level >= 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Obtener estado del nivel de margen
  const getMarginLevelStatus = (level: number) => {
    if (level >= 200) return 'Seguro';
    if (level >= 100) return 'Moderado';
    if (level >= 50) return 'Riesgo';
    return 'Crítico';
  };
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Posiciones Abiertas</h1>
            <p className="text-muted-foreground">
              Gestión avanzada de posiciones activas con análisis de riesgo en tiempo real
            </p>
          </header>
          
          <div className="container mx-auto max-w-7xl">
            
            {/* Panel principal de métricas de riesgo */}
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Wallet className="w-4 h-4" />
                            Capital Total
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${riskMetrics.totalCapital.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Base para cálculos de riesgo
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Capital total disponible para operar. Este es tu balance base para todas las operaciones.</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Shield className="w-4 h-4" />
                            Margen Requerido
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-500">
                            ${riskMetrics.totalMarginUsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Capital comprometido
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cantidad de capital reservada para todas las operaciones abiertas.</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Calculator className="w-4 h-4" />
                            Fondos Libres
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-500">
                            ${riskMetrics.totalFreeMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Disponible para nuevas operaciones
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Capital disponible no comprometido en operaciones. Este es el dinero que puedes usar para nuevas posiciones.</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <BarChart3 className="w-4 h-4" />
                            Nivel de Margen
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={cn("text-2xl font-bold", getMarginLevelColor(riskMetrics.totalMarginLevel))}>
                            {riskMetrics.totalMarginLevel.toFixed(1)}%
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getMarginLevelStatus(riskMetrics.totalMarginLevel)}
                            </Badge>
                            <Progress 
                              value={Math.min(riskMetrics.totalMarginLevel, 500) / 5} 
                              className="w-12 h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Porcentaje de capital libre que tienes para sostener tus operaciones activas. Un nivel alto es más seguro.</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              </div>
            </TooltipProvider>
            
            {/* Sección de posiciones abiertas */}
            {positions.length > 0 ? (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Operaciones Activas
                        </CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {positions.length}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/" className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Nueva Operación</span>
                        </a>
                      </Button>
                    </div>
                    <CardDescription>
                      Posiciones abiertas con métricas de riesgo en tiempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OpenPositions 
                      positions={positions}
                      onClosePosition={removePosition}
                      showRiskMetrics={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Operaciones Activas
                    </CardTitle>
                    <CardDescription>
                      No hay posiciones abiertas actualmente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sin posiciones activas</h3>
                      <p className="text-muted-foreground mb-6">
                        Comienza a operar para ver tus posiciones aquí
                      </p>
                      <Button asChild>
                        <a href="/" className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Abrir Primera Operación
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            <Tabs defaultValue="risk" className="space-y-6">
              <TabsList>
                <TabsTrigger value="risk">
                  <Shield className="h-4 w-4 mr-2" />
                  Gestión de Riesgo
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Historial de Operaciones
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análisis de Rendimiento
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="risk" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sistema de Gestión de Riesgo Avanzado</CardTitle>
                    <CardDescription>
                      Controla y analiza el riesgo de todas tus operaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RiskManagement />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Operaciones</CardTitle>
                    <CardDescription>
                      Registro de operaciones pasadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-16 h-16 mx-auto mb-4" />
                      <p>No hay operaciones cerradas para mostrar</p>
                      <p className="text-sm mt-2">Las operaciones cerradas aparecerán aquí</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Rendimiento</CardTitle>
                    <CardDescription>
                      Métricas de rendimiento y estadísticas de trading
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">+{performance.daily}%</div>
                        <div className="text-sm text-muted-foreground">24h</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-500">{performance.weekly}%</div>
                        <div className="text-sm text-muted-foreground">7 días</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">+{performance.monthly}%</div>
                        <div className="text-sm text-muted-foreground">30 días</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">+{performance.allTime}%</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
} 