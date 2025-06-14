"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompatButton as Button } from "@/components/ui/compat-button";
import { CompatBadge as Badge } from "@/components/ui/compat-badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp, Clock, AlertCircle, Shield, Calculator, BarChart3, DollarSign, Wifi, WifiOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useRealTimePositions } from "@/hooks/useRealTimePositions";

// Tipos de posición
export type TradePosition = {
  id: string;
  marketId: string;
  marketName: string;
  marketColor: string;
  direction: 'up' | 'down';
  openPrice: number;
  currentPrice: number;
  amount: number;
  stake: number;
  openTime: Date;
  duration: {
    value: number;
    unit: 'minute' | 'hour' | 'day';
  };
  profit: number;
  profitPercentage: number;
  leverage?: number;
};

interface OpenPositionsProps {
  positions: TradePosition[];
  onClosePosition: (positionId: string) => void;
  showRiskMetrics?: boolean;
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ positions, onClosePosition, showRiskMetrics = false }) => {
  const { toast } = useToast();
  const [expandedPositions, setExpandedPositions] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Initialize real-time position updates
  const { activeConnections, isConnected } = useRealTimePositions();
  
  // Update current time every second for accurate time remaining calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Toggle expanded view for a position
  const toggleExpanded = (id: string) => {
    setExpandedPositions(prev => 
      prev.includes(id) ? prev.filter(posId => posId !== id) : [...prev, id]
    );
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date to locale time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Default duration value and sanitizer
  const DEFAULT_DURATION = { value: 1, unit: 'hour' } as const;
  const sanitizeDuration = (input?: any): { value: number; unit: 'minute' | 'hour' | 'day' } => {
    // Handle string formats like "1h", "30m", "2d"
    if (typeof input === 'string') {
      const match = input.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
      if (match) {
        const num = parseFloat(match[1]);
        const unitStr = match[2].toLowerCase();
        let unit: 'minute' | 'hour' | 'day' | null = null;
        if (unitStr.startsWith('h')) unit = 'hour';
        else if (unitStr.startsWith('d')) unit = 'day';
        else if (unitStr.startsWith('m')) unit = 'minute';
        if (!isNaN(num) && unit) {
          return { value: num, unit };
        }
      }
    }
    // Handle object with value and unit, including numeric strings
    if (input && typeof input === 'object') {
      const valRaw = (input as any).value;
      let num: number | null = null;
      if (typeof valRaw === 'number') num = valRaw;
      else if (typeof valRaw === 'string' && !isNaN(Number(valRaw))) num = Number(valRaw);
      const unitRaw = (input as any).unit;
      let unit: 'minute' | 'hour' | 'day' | null = null;
      if (typeof unitRaw === 'string') {
        const unitStr = unitRaw.toLowerCase();
        if (unitStr.startsWith('h')) unit = 'hour';
        else if (unitStr.startsWith('d')) unit = 'day';
        else if (unitStr.startsWith('m')) unit = 'minute';
      }
      if (num !== null && unit) {
        return { value: num, unit };
      }
      // Numeric value present but invalid or missing unit
      if (num !== null && !unit) {
        console.warn('OpenPositions: unidad inválida o indefinida, usando unidad por defecto', input);
        return { value: num, unit: DEFAULT_DURATION.unit };
      }
    }
    // Fallback to default duration
    console.warn('OpenPositions: duration inválido o indefinido, usando valor por defecto', input, DEFAULT_DURATION);
    return DEFAULT_DURATION;
  };
  
  // Format duration
  const formatDuration = (duration?: { value: number; unit: string }): string => {
    const { value, unit } = sanitizeDuration(duration);
    return `${value} ${unit}${value > 1 ? 's' : ''}`;
  };
  
  // Calculate time remaining and return formatted string
  const getTimeRemaining = (position: TradePosition): {
    text: string;
    percentage: number;
    isExpiringSoon: boolean;
  } => {
    // Get expiration time, skip if duration invalid
    const durationMs = getDurationInMs(position.duration);
    if (durationMs <= 0) {
      return { text: 'N/A', percentage: 0, isExpiringSoon: false };
    }
    const expirationTime = new Date(position.openTime.getTime() + durationMs);
    
    // Calculate time remaining in ms
    const remainingMs = expirationTime.getTime() - currentTime.getTime();
    const totalDurationMs = durationMs;
    const percentageComplete = 100 - Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));
    
    // Check if expired or expiring soon
    if (remainingMs <= 0) {
      return { text: "Expirado", percentage: 100, isExpiringSoon: false };
    }
    
    const isExpiringSoon = remainingMs < 30000; // Less than 30 seconds
    
    // Format remaining time
    const remainingSec = Math.floor(remainingMs / 1000);
    const remainingMin = Math.floor(remainingSec / 60);
    const remainingHours = Math.floor(remainingMin / 60);
    
    if (remainingHours > 0) {
      return { 
        text: `${remainingHours}h ${remainingMin % 60}m`, 
        percentage: percentageComplete,
        isExpiringSoon 
      };
    } else if (remainingMin > 0) {
      return { 
        text: `${remainingMin}m ${remainingSec % 60}s`, 
        percentage: percentageComplete,
        isExpiringSoon 
      };
    } else {
      return { 
        text: `${remainingSec}s`, 
        percentage: percentageComplete,
        isExpiringSoon
      };
    }
  };
  
  // Calculate milliseconds for a duration, guard invalid values
  const getDurationInMs = (duration?: { value: number; unit: string }): number => {
    const multipliers: Record<string, number> = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000
    };
    const { value, unit } = sanitizeDuration(duration);
    return value * multipliers[unit];
  };

  // Risk metrics calculation for each position
  const calculatePositionRiskMetrics = (position: TradePosition) => {
    // Normalize marketName to avoid undefined
    const marketNameSafe = typeof position.marketName === 'string' ? position.marketName : '';
    if (!marketNameSafe) {
      console.warn('OpenPositions: position.marketName inválido o indefinido, usando cadena vacía', position);
    }
    const leverage = 100; // Apalancamiento estándar
    const fraction = 0.10; // Fracción por defecto
    
    // Determinar tamaño del contrato según el activo
    let contractSize = 100000; // Forex standard
    if (marketNameSafe.includes('BTC') || marketNameSafe.includes('ETH')) {
      contractSize = 1; // Crypto
    } else if (marketNameSafe.includes('XAU')) {
      contractSize = 100; // Gold
    }
    
    const lotSize = position.amount / (position.openPrice * contractSize); // Calcular lotes desde el monto
    const positionValue = position.openPrice * contractSize * lotSize;
    const marginRequired = positionValue / leverage;
    const capitalUsed = position.amount * fraction;
    
    return {
      marginRequired,
      lotSize,
      positionValue,
      capitalUsed,
      fraction
    };
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            Posiciones abiertas ({positions.length})
          </span>
          <div className="flex items-center gap-2">
            {/* Indicador de conexión en tiempo real */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span className="text-green-500 font-medium">Tiempo real</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-orange-500" />
                        <span className="text-orange-500 font-medium">Sin conexión</span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isConnected 
                      ? `${activeConnections} conexión(es) activa(s) para actualización en tiempo real`
                      : 'Las posiciones no se actualizan en tiempo real'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No tienes posiciones abiertas</p>
            <p className="text-sm">Abre una posición desde cualquier gráfico de mercado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Mercado</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Inversión</TableHead>
                <TableHead className="text-right">Lev.</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-right">Expira</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const timeInfo = getTimeRemaining(position);
                const isExpanded = expandedPositions.includes(position.id);
                const riskMetrics = showRiskMetrics ? calculatePositionRiskMetrics(position) : null;
                // Calculate expiration date/time
                const expirationDate = new Date(position.openTime.getTime() + getDurationInMs(position.duration));
                
                return (
                  <React.Fragment key={position.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: position.marketColor }}
                          />
                          <span className="font-medium text-sm">{position.marketName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={position.direction === 'up' ? 'default' : 'destructive'}
                            className={cn(
                              "text-xs font-medium flex items-center gap-1",
                              position.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            )}
                          >
                            {position.direction === 'up' ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                LONG
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                SHORT
                              </>
                            )}
                          </Badge>
                          {showRiskMetrics && riskMetrics && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs">
                                    {riskMetrics.lotSize.toFixed(2)} lotes
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tamaño de la posición en lotes estándar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span suppressHydrationWarning className="font-medium">{formatCurrency(position.amount)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {position.leverage ? `${position.leverage}×` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span suppressHydrationWarning className={cn(
                            "font-bold",
                            position.profit >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {position.profit >= 0 ? "+" : ""}{formatCurrency(position.profit)}
                          </span>
                          <span suppressHydrationWarning className={cn(
                            "text-xs",
                            position.profitPercentage >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {position.profitPercentage >= 0 ? "+" : ""}{position.profitPercentage.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            <span className={cn(
                              timeInfo.isExpiringSoon ? "text-orange-500 font-medium" : "text-muted-foreground"
                            )}>
                              {timeInfo.text}
                            </span>
                          </div>
                          <Progress 
                            value={timeInfo.percentage} 
                            className="h-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleExpanded(position.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onClosePosition(position.id);
                              toast({
                                title: "🚪 Posición cerrada",
                                description: `La posición en ${position.marketName} se cerró con ${position.profit >= 0 ? '+' : ''}${formatCurrency(position.profit)} (${position.profitPercentage.toFixed(2)}%)`,
                              });
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded view */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-muted/30 p-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Información básica */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground">📊 Información de Operación</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Precio de apertura:</span>
                                    <span className="font-medium">{formatCurrency(position.openPrice)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Precio actual:</span>
                                    <span className="font-medium">{formatCurrency(position.currentPrice)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Apertura:</span>
                                    <span className="font-medium">{position.openTime.toLocaleDateString('es-CO')} {formatTime(position.openTime)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Duración total:</span>
                                    <span className="font-medium">{formatDuration(position.duration)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Apalancamiento:</span>
                                    <span className="font-medium">{(position.leverage ?? 1)}×</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Expiración:</span>
                                    <span className="font-medium">{expirationDate.toLocaleDateString('es-CO')} {formatTime(expirationDate)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Métricas de riesgo (solo si está habilitado) */}
                              {showRiskMetrics && riskMetrics && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                                    <Shield className="h-4 w-4" />
                                    Métricas de Riesgo
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex justify-between cursor-help">
                                            <span>Margen requerido:</span>
                                            <span className="font-medium text-orange-500">
                                              ${riskMetrics.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Capital reservado como garantía para esta posición</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex justify-between cursor-help">
                                            <span>Tamaño del lote:</span>
                                            <span className="font-medium text-purple-500">{riskMetrics.lotSize.toFixed(2)}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Volumen de la operación en lotes estándar</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex justify-between cursor-help">
                                            <span>Valor de posición:</span>
                                            <span className="font-medium text-blue-500">
                                              ${riskMetrics.positionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Valor total de la posición apalancada</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <div className="flex justify-between">
                                      <span>Fracción del capital:</span>
                                      <span className="font-medium text-green-500">{(riskMetrics.fraction * 100).toFixed(1)}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Performance y alertas */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                                  <BarChart3 className="h-4 w-4" />
                                  Estado y Rendimiento
                                </h4>
                                <div className="space-y-2">
                                  {/* Barra de progreso de ganancia/pérdida */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>Performance:</span>
                                      <span className={cn(
                                        "font-medium",
                                        position.profitPercentage >= 0 ? "text-green-500" : "text-red-500"
                                      )}>
                                        {position.profitPercentage >= 0 ? "+" : ""}{position.profitPercentage.toFixed(2)}%
                                      </span>
                                    </div>
                                    <Progress 
                                      value={Math.min(Math.abs(position.profitPercentage), 100)} 
                                      className={cn(
                                        "h-2",
                                        position.profitPercentage >= 0 ? "bg-green-100" : "bg-red-100"
                                      )}
                                    />
                                  </div>

                                  {/* Alertas de tiempo */}
                                  {timeInfo.isExpiringSoon && (
                                    <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Posición expira pronto</span>
                                    </div>
                                  )}

                                  {/* Estado de la posición */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      position.profit >= 0 ? "bg-green-500" : "bg-red-500"
                                    )} />
                                    <span className="text-muted-foreground">
                                      {position.profit >= 0 ? "En beneficio" : "En pérdida"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenPositions; 