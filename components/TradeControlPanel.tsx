"use client";

import React, { useState, useEffect } from 'react';
import { useRealTimeCrypto } from '@/hooks/useRealTimeCrypto';
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
  marketId: string;
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
  marketId,
  marketName,
  marketPrice,
  marketColor,
  isVisible,
  onClose,
  onPlaceTrade
}) => {
  // Get user data for pejecoins
  const { user, updateUser } = useAuth();
  
  // Trading state
  const [tradeDirection, setTradeDirection] = useState<'up' | 'down'>('up');
  const [investmentAmount, setInvestmentAmount] = useState<number>(0); // This is the total capital (pejecoins)
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'minute' | 'hour' | 'day'>('minute');
  const [potentialReturn, setPotentialReturn] = useState<number>(0);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Risk management state
  const [capitalFraction, setCapitalFraction] = useState<number>(0.10); // Fracción de capital (0.10 = 10%)
  const [leverage, setLeverage] = useState<number>(100); // Apalancamiento
  const [lotSize, setLotSize] = useState<number>(() => {
    // Establecer lotSize inicial basado en el tipo de instrumento
    if (marketName.includes('BTC') || marketName.includes('ETH')) {
      return 0.01; // Para crypto, usar un valor más pequeño por defecto
    } else if (marketName.includes('XAU')) {
      return 0.1; // Para oro
    }
    return 1.0; // Para forex
  }); // Tamaño del lote
  
  // Risk metrics calculations
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
  
  // Hook para obtener precios en tiempo real (solo para crypto)
  const isCrypto = marketName.toLowerCase().includes('btc') || 
                   marketName.toLowerCase().includes('eth') || 
                   marketName.toLowerCase().includes('sol') ||
                   marketName.toLowerCase().includes('ada') ||
                   marketName.toLowerCase().includes('dot') ||
                   marketName.toLowerCase().includes('xrp') ||
                   marketName.toLowerCase().includes('link') ||
                   marketName.toLowerCase().includes('ltc') ||
                   marketName.toLowerCase().includes('bch') ||
                   marketName.toLowerCase().includes('avax');
                   
  const cryptoSymbol = isCrypto ? marketName.split('(')[1]?.split('/')[0] || marketName.split(' ')[0] : '';
  const { getTicker, isConnected: cryptoConnected } = useRealTimeCrypto(isCrypto ? [cryptoSymbol] : []);
  
  // Precio en tiempo real para crypto, marketPrice para otros
  const realTimePrice = isCrypto && cryptoConnected ? 
    (getTicker(cryptoSymbol)?.price || marketPrice) : 
    marketPrice;
    
  // Estado para mostrar indicador de tiempo real
  const [displayPrice, setDisplayPrice] = useState(marketPrice);
  
  // Actualizar precio mostrado cuando cambie el precio en tiempo real
  useEffect(() => {
    setDisplayPrice(realTimePrice);
  }, [realTimePrice]);
  
  // NUEVO: Actualización automática cada segundo para crypto
  useEffect(() => {
    if (!isCrypto || !cryptoConnected) return;
    
    const interval = setInterval(() => {
      const latestTicker = getTicker(cryptoSymbol);
      if (latestTicker?.price && latestTicker.price !== displayPrice) {
        console.log(`[TradeControlPanel] Actualizando precio ${cryptoSymbol}: ${latestTicker.price}`);
        setDisplayPrice(latestTicker.price);
      }
    }, 500); // Actualizar cada 500ms para crypto
    
    return () => clearInterval(interval);
  }, [isCrypto, cryptoConnected, cryptoSymbol, getTicker, displayPrice]);
  
  // Actualizar el monto de inversión cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setInvestmentAmount(user.pejecoins || 0); // Use user's pejecoins, default to 0
    }
  }, [user]);
  
  // Calculate potential return based on investment amount and fraction
  useEffect(() => {
    // Simplified calculation based on a fixed multiplier
    const multiplier = tradeDirection === 'up' ? 1.85 : 1.8;
    const amountToInvest = investmentAmount * capitalFraction;
    
    // The return is the profit, not the total amount back
    const potentialProfit = (amountToInvest * multiplier) - amountToInvest;

    setPotentialReturn(potentialProfit);

  }, [tradeDirection, investmentAmount, capitalFraction]);

  // Calculate risk metrics
  useEffect(() => {
    const capitalToUse = investmentAmount * capitalFraction;
    
    // Determinar tamaño del contrato según el instrumento
    let contractSize = 100000; // Para forex, 1 lote = 100,000 unidades
    if (marketName.includes('BTC') || marketName.includes('ETH')) {
      contractSize = 1; // Para crypto, 1 lote = 1 unidad
    } else if (marketName.includes('XAU')) {
      contractSize = 100; // Para oro, 1 lote = 100 onzas
    }
    
    // Calcular valor de la posición basado en el monto de inversión actual
    const positionValue = capitalToUse * leverage; // Valor total de la posición con apalancamiento
    const marginRequired = positionValue / leverage; // Margen requerido = capital que necesitamos
    
    // IMPORTANTE: El margen requerido debe ser igual al capital que vamos a usar
    // porque estamos calculando basado en lo que queremos invertir
    const actualMarginRequired = capitalToUse;
    
    const freeMargin = investmentAmount - actualMarginRequired;
    const marginLevel = actualMarginRequired > 0 ? (freeMargin / actualMarginRequired) * 100 : 0;
    
    // Verificar si hay fondos suficientes
    setRiskMetrics({
      marginRequired: actualMarginRequired, // Mostrar el margen real requerido
      freeMargin: Math.max(0, freeMargin),
      marginLevel: Math.max(0, marginLevel),
      positionValue, // Valor total de la posición con apalancamiento
      capitalUsed: capitalToUse
    });
    
  }, [investmentAmount, capitalFraction, leverage, displayPrice, marketName]);

  // Format currency in 'dolarizado' style
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format lot size for better readability
  const formatLotSize = (value: number): string => {
    if (value >= 1) {
      return value.toFixed(2);
    } else if (value >= 0.01) {
      return value.toFixed(4);
    } else if (value >= 0.0001) {
      return value.toFixed(6);
    } else {
      // Para números muy pequeños, usar notación científica
      return value.toExponential(3);
    }
  };

  // Handle trade execution
  const handlePlaceTrade = async () => {
    const capitalToUse = riskMetrics.capitalUsed;
    if (capitalToUse <= 0) {
      toast.error("El monto de inversión debe ser mayor a cero.");
      return;
    }
    if (capitalToUse > (user?.pejecoins ?? 0)) {
      toast.error("Fondos insuficientes para realizar esta operación.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the real-time price for crypto, or marketPrice for others
      const priceToUse = displayPrice;
      console.log(`[TradeControlPanel] Abriendo posición para ${marketName}:`);
      console.log(`  - Precio a usar: ${priceToUse}`);
      console.log(`  - Es crypto: ${isCrypto}`);
      console.log(`  - Conectado: ${cryptoConnected}`);
      console.log(`  - marketPrice original: ${marketPrice}`);
      console.log(`  - displayPrice calculado: ${displayPrice}`);
      
      // Llamar addPosition del contexto API-driven
      const id = await addPosition({
        instrumentId: marketName,
        instrumentName: marketName,
        marketColor: marketColor,
        direction: tradeDirection,
        amount: capitalToUse,
        stake: capitalToUse,
        openPrice: priceToUse,
        duration: { value: duration, unit: durationUnit },
        leverage: leverage,
        capitalFraction: capitalFraction,
        lotSize: lotSize
      });
      if (!id) throw new Error('No se recibió ID de posición');

      console.log(`[TradeControlPanel] Posición creada exitosamente con ID: ${id}`);

      // Obtener el usuario actualizado para sincronizar el balance
      try {
        const response = await fetch('/api/auth/profile', { 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const profileData = await response.json();
        if (profileData.success && profileData.data) {
          updateUser(profileData.data);
          console.log(`[TradeControlPanel] Balance actualizado: ${profileData.data.pejecoins}`);
        }
      } catch (err) {
        console.warn('No se pudo actualizar el perfil del usuario después de crear posición:', err);
      }

      toast.success("🚀 Operación ejecutada", {
        description: `Posición #${id.slice(-6)} en ${marketName} creada exitosamente.`,
      });

      // Cerrar panel después de una operación exitosa
      setTimeout(onClose, 500);

    } catch (error: any) {
      console.error('Error al ejecutar la operación:', error);
      const errorMessage = (error.response?.data?.message) || error.message || "Error desconocido al ejecutar la operación.";
      toast.error("Error en la operación", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState('stake');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [lotSizeInput, setLotSizeInput] = useState<string>(() => {
    // Establecer input inicial basado en el tipo de instrumento
    if (marketName.includes('BTC') || marketName.includes('ETH')) {
      return '0.01'; // Para crypto, usar un valor más pequeño por defecto
    } else if (marketName.includes('XAU')) {
      return '0.1'; // Para oro
    }
    return '1.0'; // Para forex
  }); // Estado local para el input del lote

  // Update capital fraction when input amount changes
  useEffect(() => {
    const amount = parseFloat(inputAmount);
    if (!isNaN(amount) && investmentAmount > 0) {
      const fraction = amount / investmentAmount;
      if (fraction >= 0 && fraction <= 1) {
        setCapitalFraction(fraction);
      } else if (fraction > 1) {
        setCapitalFraction(1);
        toast.warning("El monto de inversión no puede superar tu capital total.");
      }
    }
  }, [inputAmount, investmentAmount]);

  // Update lotSizeInput when lotSize changes (but not during user input)
  useEffect(() => {
    setLotSizeInput(formatLotSize(lotSize));
  }, [lotSize]);

  // Handle lot size input change
  const handleLotSizeChange = (value: string) => {
    setLotSizeInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setLotSize(numValue);
    }
  };

  if (!isVisible) return null;

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
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{marketName}</span>
                  {isCrypto && cryptoConnected && (
                    <div className="flex items-center gap-1 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Tiempo real
                    </div>
                  )}
                </div>
                <span className="text-2xl font-bold">{formatCurrency(displayPrice)}</span>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Monto de Inversión</h3>
                
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Capital Total</span>
                    <span className="font-semibold">{formatCurrency(investmentAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monto a Invertir</span>
                    <span className="font-semibold text-primary">{formatCurrency(investmentAmount * capitalFraction)}</span>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="w-full text-lg p-4 pr-12"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    min="0"
                    max={investmentAmount}
                    step="10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">USD</span>
                </div>
                
                <Slider
                  value={[capitalFraction * 100]}
                  onValueChange={(value) => {
                    const fraction = value[0] / 100;
                    setCapitalFraction(fraction);
                    setInputAmount((investmentAmount * fraction).toFixed(2));
                  }}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
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
                  value={lotSizeInput}
                  onChange={(e) => handleLotSizeChange(e.target.value)}
                  placeholder="1.0"
                />
              </div>

              {/* Leverage Selector */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Apalancamiento
                </h4>
                <div className="flex items-center gap-2">
                  <Slider
                    min={1}
                    max={100}
                    step={1}
                    value={[leverage]}
                    onValueChange={(val)=>setLeverage(val[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={leverage}
                    onChange={e=>setLeverage(Math.max(1, Math.min(100, Number(e.target.value))))}
                    className="w-20 text-center"
                  />
                  <span className="text-sm">×</span>
                </div>
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
                        {(() => {
                          const contractSize = marketName.includes('BTC') || marketName.includes('ETH') ? 1 : 
                                             marketName.includes('XAU') ? 100 : 100000;
                          const volume = lotSize * contractSize;
                          return volume >= 1 ? volume.toLocaleString(undefined, { maximumFractionDigits: 2 }) :
                                 volume >= 0.01 ? volume.toFixed(4) :
                                 volume.toExponential(2);
                        })()}
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
                    <p className="text-xs text-muted-foreground">Ganancia estimada si el mercado se mueve a tu favor</p>
                  </div>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(potentialReturn)}</p>
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
                  disabled={isSubmitting || (investmentAmount * capitalFraction) <= 0}
                  className={cn(
                    "w-full py-6 text-lg font-bold shadow-xl transition-all duration-300 relative overflow-hidden",
                    "border-2 border-transparent hover:shadow-2xl",
                    tradeDirection === 'up' 
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-400" 
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400",
                    (isSubmitting || (investmentAmount * capitalFraction) <= 0) && "opacity-90 cursor-not-allowed"
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