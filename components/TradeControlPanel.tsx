"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CompatButton as Button } from "@/components/ui/compat-button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Info, ArrowUpCircle, ArrowDownCircle, Percent, DollarSign, BarChart4, CheckCircle2, Shield, Calculator, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import useRealTimeMarketData from "@/hooks/useRealTimeMarketData";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CompatBadge as Badge } from "@/components/ui/compat-badge";
import { useTradePositions } from "@/contexts/TradePositionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TradeControlPanelProps {
  marketName: string;
  marketPrice: number;
  marketColor: string;
  isVisible: boolean;
  onClose: () => void;
  onPlaceTrade?: (
    direction: 'up' | 'down', 
    amount: number, 
    stake: number, 
    duration: {value: number, unit: 'minute' | 'hour' | 'day'}
  ) => void;
}

const TradeControlPanel: React.FC<TradeControlPanelProps> = ({
  marketName,
  marketPrice,
  marketColor,
  isVisible,
  onClose,
  onPlaceTrade
}) => {
  // Get user data for pejecoins
  const { user } = useAuth();
  
  // Trading state
  const [tradeDirection, setTradeDirection] = useState<'up' | 'down'>('up');
  const [investmentAmount, setInvestmentAmount] = useState<number>(0); // Se inicializa en 0, se actualizará con los pejecoins del usuario
  const [stakePct, setStakePct] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'minute' | 'hour' | 'day'>('minute');
  const [isStakePercent, setIsStakePercent] = useState<boolean>(false); // Cambiar a fracciones por defecto
  const [potentialReturn, setPotentialReturn] = useState<number>(0);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [insufficientFunds, setInsufficientFunds] = useState<boolean>(false);
  
  // Risk management state - nuevas variables para gestión de riesgo
  const [capitalFraction, setCapitalFraction] = useState<number>(0.10); // Fracción de capital (0.10 = 10%)
  const [leverage, setLeverage] = useState<number>(100); // Apalancamiento
  const [lotSize, setLotSize] = useState<number>(1.0); // Tamaño del lote
  
  // Risk metrics calculations - métricas de riesgo calculadas
  const [riskMetrics, setRiskMetrics] = useState({
    marginRequired: 0,
    freeMargin: 0,
    marginLevel: 0,
    positionValue: 0,
    capitalUsed: 0
  });
  
  // Get toast service for notifications
  const { toast: uiToast } = useToast();
  
  // Get trading positions context
  const { addPosition } = useTradePositions();
  
  // Get real-time market data
  const { data: marketData, isLoading } = useRealTimeMarketData(
    marketName,
    'indices',
    { refreshInterval: 5000 }
  );
  
  // Actualizar el monto de inversión cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setInvestmentAmount(user.pejecoins || 1000); // Usar pejecoins del usuario o un valor predeterminado
    }
  }, [user]);
  
  // Calculate potential return based on stake and direction
  useEffect(() => {
    // Simplified calculation - in a real app this would use real market data
    const multiplier = tradeDirection === 'up' ? 1.85 : 1.8;
    const stakeAmount = isStakePercent 
      ? (investmentAmount * stakePct / 100) 
      : stakePct;
    setPotentialReturn(stakeAmount * multiplier);
  }, [tradeDirection, investmentAmount, stakePct, isStakePercent]);

  // Calculate risk metrics - nuevo cálculo de métricas de riesgo
  useEffect(() => {
    const capitalToUse = investmentAmount * capitalFraction;
    
    // Calcular valor de la posición
    let contractSize = 100000; // Para forex, 1 lote = 100,000 unidades
    if (marketName.includes('BTC') || marketName.includes('ETH')) {
      contractSize = 1; // Para crypto, 1 lote = 1 unidad
    } else if (marketName.includes('XAU')) {
      contractSize = 100; // Para oro, 1 lote = 100 onzas
    }
    
    const positionValue = marketPrice * contractSize * lotSize;
    const marginRequired = positionValue / leverage;
    const effectiveMarginUsed = Math.min(marginRequired, capitalToUse);
    const freeMargin = investmentAmount - effectiveMarginUsed;
    const marginLevel = effectiveMarginUsed > 0 ? (freeMargin / effectiveMarginUsed) * 100 : 0;
    
    // Verificar si hay fondos suficientes
    setInsufficientFunds(effectiveMarginUsed > investmentAmount);
    
    setRiskMetrics({
      marginRequired: effectiveMarginUsed,
      freeMargin: Math.max(0, freeMargin),
      marginLevel: Math.max(0, marginLevel),
      positionValue,
      capitalUsed: capitalToUse
    });
  }, [investmentAmount, capitalFraction, leverage, lotSize, marketPrice, marketName]);

  // Format currency with 2 decimal places
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle trade execution
  const handlePlaceTrade = () => {
    if (insufficientFunds) {
      toast.error("Fondos insuficientes para realizar esta operación");
      return;
    }
    
    setIsSubmitting(true);
    
    const stakeAmount = isStakePercent 
      ? (investmentAmount * stakePct / 100) 
      : stakePct;
    
    try {
      // Crear la nueva posición usando el contexto
      const positionId = addPosition({
        marketName,
        marketPrice,
        marketColor,
        direction: tradeDirection,
        amount: riskMetrics.capitalUsed,
        stake: stakeAmount,
        duration: { value: duration, unit: durationUnit },
        capitalFraction,
        lotSize,
        leverage
      });

      // Show enhanced toast notification
      uiToast({
        title: tradeDirection === 'up' ? "🚀 Compra Ejecutada" : "📉 Venta Ejecutada",
        description: (
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Operación #{positionId.slice(-6)} creada exitosamente</p>
            <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-2 rounded">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Instrumento:</span>
                <span className="font-medium">{marketName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Dirección:</span>
                <span className={cn("font-bold", tradeDirection === 'up' ? "text-green-500" : "text-red-500")}>
                  {tradeDirection === 'up' ? 'LONG' : 'SHORT'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Fracción:</span>
                <span className="font-medium text-blue-500">{(capitalFraction * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Lotes:</span>
                <span className="font-medium text-purple-500">{lotSize}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Margen:</span>
                <span className="font-medium text-orange-500">${riskMetrics.marginRequired.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{duration} {durationUnit}{duration > 1 ? 's' : ''}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ✅ La posición ha sido agregada a tu cartera de operaciones activas
            </p>
          </div>
        ),
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={() => {
              window.location.href = "/posiciones-abiertas";
            }}
          >
            Ver Posiciones
          </Button>
        ),
      });

      // Call onPlaceTrade callback if provided
      if (onPlaceTrade) {
        onPlaceTrade(
          tradeDirection, 
          riskMetrics.capitalUsed, 
          stakeAmount, 
          { value: duration, unit: durationUnit }
        );
      }

      // Close panel after successful trade
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error('Error executing trade:', error);
      toast.error("Error al ejecutar la operación");
      setIsSubmitting(false);
    }
  };

  // Toggle between percentage and fixed amount
  const toggleStakeType = () => {
    if (isStakePercent) {
      // Convert percentage to equivalent fixed amount
      setStakePct(Math.round(investmentAmount * stakePct / 100));
    } else {
      // Convert fixed amount to equivalent percentage
      setStakePct(Math.round((stakePct / investmentAmount) * 100));
    }
    setIsStakePercent(!isStakePercent);
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "w-full transition-all duration-300 overflow-hidden border-0 shadow-none",
        isVisible ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: marketColor }}
              />
              <div>
                <span className="font-bold text-lg">{marketName}</span>
                <span className="text-2xl font-bold ml-4">{formatCurrency(marketPrice)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Toggle 
                pressed={showChart} 
                onPressedChange={setShowChart}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <BarChart4 className="w-4 h-4 mr-1" />
                <span className="text-xs">Gráfico</span>
              </Toggle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 px-3"
              >
                ✕ Cerrar Panel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sección 1: Configuración Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">⚙️ Configuración Básica</h3>
              
              {/* Trade Direction */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selecciona si esperas que el precio suba (Comprar) o baje (Vender)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={tradeDirection === 'up' ? "default" : "outline"}
                    className={cn(
                      "flex-1 gap-2",
                      tradeDirection === 'up' && "bg-green-500 hover:bg-green-600"
                    )}
                    onClick={() => setTradeDirection('up')}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Comprar
                  </Button>
                  <Button 
                    variant={tradeDirection === 'down' ? "default" : "outline"}
                    className={cn(
                      "flex-1 gap-2",
                      tradeDirection === 'down' && "bg-red-500 hover:bg-red-600"
                    )}
                    onClick={() => setTradeDirection('down')}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Vender
                  </Button>
                </div>
              </div>

              {/* Investment Amount */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Capital Total</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tu capital total disponible para trading. Base para calcular fracciones y riesgo.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2 items-center">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    id="investment-amount"
                    name="investment-amount"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Trade Duration */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Duración</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tiempo que la posición permanecerá abierta antes de cerrarse automáticamente</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={durationUnit === 'minute' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDurationUnit('minute')}
                    className="flex-1"
                  >
                    Minutos
                  </Button>
                  <Button
                    variant={durationUnit === 'hour' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDurationUnit('hour')}
                    className="flex-1"
                  >
                    Horas
                  </Button>
                  <Button
                    variant={durationUnit === 'day' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDurationUnit('day')}
                    className="flex-1"
                  >
                    Días
                  </Button>
                </div>

                <div className="flex gap-4 items-center">
                  <Slider 
                    value={[duration]} 
                    min={1}
                    max={durationUnit === 'minute' ? 60 : durationUnit === 'hour' ? 24 : 30}
                    step={1}
                    onValueChange={(value: number[]) => setDuration(value[0])}
                    className="flex-1"
                  />
                  <Input 
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Gestión de Riesgo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-600">🛡️ Gestión de Riesgo</h3>
              
              {/* Fracción de Capital */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Fracción de Capital (0.01 - 1.00)
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-semibold mb-1">Fracción de Capital</p>
                          <p className="text-sm">Determina qué porción de tu capital total usar para esta operación.</p>
                          <div className="mt-2 text-xs space-y-1">
                            <div>• 0.05 = 5% del capital</div>
                            <div>• 0.10 = 10% del capital</div>
                            <div>• 0.25 = 25% del capital</div>
                          </div>
                          <p className="text-xs mt-2 text-yellow-400">⚠️ Recomendado: No más del 10% por operación</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(capitalFraction * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1.00"
                    value={capitalFraction}
                    onChange={(e) => setCapitalFraction(parseFloat(e.target.value) || 0.01)}
                    className="flex-1"
                    placeholder="0.10"
                  />
                  <span className="text-xs text-muted-foreground min-w-[60px]">
                    ${(investmentAmount * capitalFraction).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tamaño del Lote */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tamaño del Lote
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-semibold mb-1">Tamaño del Lote</p>
                        <p className="text-sm mb-2">Volumen de la operación expresado en lotes estándar.</p>
                        <div className="text-xs space-y-1">
                          <div><strong>Forex:</strong> 1 lote = 100,000 unidades</div>
                          <div><strong>Crypto:</strong> 1 lote = 1 unidad</div>
                          <div><strong>Oro:</strong> 1 lote = 100 onzas</div>
                        </div>
                        <p className="text-xs mt-2 text-blue-400">ℹ️ Ajusta según tu tolerancia al riesgo</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                  placeholder="1.0"
                />
              </div>

              {/* Métricas de Riesgo en tiempo real */}
              <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-muted rounded text-center cursor-help hover:bg-muted/80 transition-colors">
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        Margen Requerido
                      </div>
                      <div className="text-sm font-semibold text-orange-500">
                        ${riskMetrics.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-semibold mb-1">💰 Margen Requerido</p>
                      <p className="text-sm mb-2">Capital que se reserva como garantía para mantener esta posición abierta.</p>
                      <div className="text-xs space-y-1">
                        <div>• Se calcula: Valor Posición ÷ Apalancamiento</div>
                        <div>• Se bloquea hasta cerrar la operación</div>
                        <div>• A mayor apalancamiento, menor margen</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-muted rounded text-center cursor-help hover:bg-muted/80 transition-colors">
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Calculator className="w-3 h-3" />
                        Fondos Libres
                      </div>
                      <div className="text-sm font-semibold text-green-500">
                        ${riskMetrics.freeMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-semibold mb-1">💵 Fondos Libres</p>
                      <p className="text-sm mb-2">Capital disponible que no está comprometido en operaciones.</p>
                      <div className="text-xs space-y-1">
                        <div>• Capital Total - Margen Usado</div>
                        <div>• Disponible para nuevas operaciones</div>
                        <div>• Se actualiza con PnL en tiempo real</div>
                      </div>
                      <p className="text-xs mt-2 text-green-400">✅ Mantén siempre fondos de respaldo</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-muted rounded text-center cursor-help hover:bg-muted/80 transition-colors">
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Nivel de Margen
                      </div>
                      <div className={cn(
                        "text-sm font-semibold",
                        riskMetrics.marginLevel >= 200 ? "text-green-500" :
                        riskMetrics.marginLevel >= 100 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {riskMetrics.marginLevel.toFixed(1)}%
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-semibold mb-1">📊 Nivel de Margen</p>
                      <p className="text-sm mb-2">Indicador de salud financiera de tu cuenta de trading.</p>
                      <div className="text-xs space-y-1">
                        <div className="text-green-400">• &gt;200%: Muy seguro</div>
                        <div className="text-yellow-400">• 100-200%: Moderado</div>
                        <div className="text-red-400">• &lt;100%: Riesgo alto</div>
                      </div>
                      <p className="text-xs mt-2 text-yellow-400">⚠️ Si baja de 20%, podrías recibir margin call</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-muted rounded text-center cursor-help hover:bg-muted/80 transition-colors">
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Volumen Total
                      </div>
                      <div className="text-sm font-semibold text-blue-500">
                        {(lotSize * (marketName.includes('USD') ? 100000 : 1)).toLocaleString()}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-semibold mb-1">📈 Volumen Total</p>
                      <p className="text-sm mb-2">Cantidad real de unidades que estarás operando.</p>
                      <div className="text-xs space-y-1">
                        <div>• Lotes × Tamaño del Contrato</div>
                        <div>• Determina la exposición real al mercado</div>
                        <div>• Impacta directamente en ganancias/pérdidas</div>
                      </div>
                      <p className="text-xs mt-2 text-blue-400">ℹ️ Mayor volumen = Mayor riesgo y potencial</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Sección 3: Ejecución */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">🚀 Ejecución</h3>
              
              {/* Potential Return */}
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Retorno potencial</p>
                    <p className="text-xs text-muted-foreground">Estimación aproximada</p>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(potentialReturn)}</p>
                </div>
              </div>

              {/* Execute Trade Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  onClick={handlePlaceTrade}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-6 text-lg font-bold shadow-xl transition-all duration-300 relative overflow-hidden",
                    "border-2 border-transparent hover:shadow-2xl",
                    tradeDirection === 'up' 
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-400" 
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400",
                    isSubmitting && "opacity-90 cursor-not-allowed"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div 
                        key="submitting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <CheckCircle2 className="h-6 w-6" />
                        </motion.div>
                        <span>Procesando Operación...</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="ready"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: tradeDirection === 'up' ? 5 : -5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          {tradeDirection === 'up' ? (
                            <ArrowUpCircle className="h-6 w-6" />
                          ) : (
                            <ArrowDownCircle className="h-6 w-6" />
                          )}
                        </motion.div>
                        <span>
                          🚀 ABRIR POSICIÓN {tradeDirection === 'up' ? 'LONG' : 'SHORT'}
                        </span>
                        <motion.div
                          className="absolute inset-0 bg-white opacity-0"
                          whileHover={{ opacity: 0.1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
              
              {/* Info Text */}
              <motion.div 
                className="text-center space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs text-muted-foreground">
                  🔒 Al ejecutar esta operación, aceptas los términos y condiciones del servicio
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Transacción segura y encriptada</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default TradeControlPanel; 