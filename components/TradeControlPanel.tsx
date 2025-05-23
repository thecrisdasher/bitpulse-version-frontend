"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Info, ArrowUpCircle, ArrowDownCircle, Percent, DollarSign, BarChart4, CheckCircle2 } from "lucide-react";
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
  // Trading state
  const [tradeDirection, setTradeDirection] = useState<'up' | 'down'>('up');
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [stakePct, setStakePct] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'minute' | 'hour' | 'day'>('minute');
  const [isStakePercent, setIsStakePercent] = useState<boolean>(true);
  const [potentialReturn, setPotentialReturn] = useState<number>(0);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Get toast service for notifications
  const { toast } = useToast();
  
  // Get real-time market data
  const { data: marketData, isLoading } = useRealTimeMarketData(
    marketName,
    'indices',
    { refreshInterval: 5000 }
  );
  
  // Calculate potential return based on stake and direction
  useEffect(() => {
    // Simplified calculation - in a real app this would use real market data
    const multiplier = tradeDirection === 'up' ? 1.85 : 1.8;
    const stakeAmount = isStakePercent 
      ? (investmentAmount * stakePct / 100) 
      : stakePct;
    setPotentialReturn(stakeAmount * multiplier);
  }, [tradeDirection, investmentAmount, stakePct, isStakePercent]);

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
    setIsSubmitting(true);
    
    const stakeAmount = isStakePercent 
      ? (investmentAmount * stakePct / 100) 
      : stakePct;
    
    if (onPlaceTrade) {
      onPlaceTrade(
        tradeDirection, 
        stakeAmount, 
        investmentAmount, 
        {value: duration, unit: durationUnit}
      );
    }
    
    // Show toast notification instead of alert
    toast({
      title: tradeDirection === 'up' ? "Compra ejecutada" : "Venta ejecutada",
      description: (
        <div className="flex flex-col gap-1">
          <p>Operación colocada correctamente:</p>
          <p>
            <strong>Instrumento:</strong> {marketName}
          </p>
          <p>
            <strong>Tipo:</strong> {tradeDirection === 'up' ? 'COMPRA' : 'VENTA'}
          </p>
          <p>
            <strong>Monto:</strong> {formatCurrency(stakeAmount)}
          </p>
          <p>
            <strong>Duración:</strong> {duration} {durationUnit}{duration > 1 ? 's' : ''}
          </p>
        </div>
      ),
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => {
            // Dirigir a la página de portfolio
            window.location.href = "/portfolio";
          }}
        >
          Ver portfolio
        </Button>
      ),
    });
    
    // Allow animation to complete
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
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
    <Card className={cn(
      "w-full transition-all duration-300 overflow-hidden",
      isVisible ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: marketColor }}
            />
            <span className="font-medium">{marketName}</span>
            <span className="text-lg font-semibold">{formatCurrency(marketPrice)}</span>
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
              className="h-8 px-2"
            >
              Cerrar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Trade Direction */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Dirección</label>
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
            <label className="text-sm font-medium text-muted-foreground">Inversión total</label>
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
        </div>

        {/* Stake Amount/Percentage */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isStakePercent ? 'Porcentaje a invertir' : 'Monto a invertir'}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isStakePercent ? 'Porcentaje' : 'Monto fijo'}
              </span>
              <Switch 
                checked={isStakePercent}
                onCheckedChange={toggleStakeType}
              />
            </div>
          </div>
          
          <div className="flex gap-4 items-center mb-2">
            <Slider 
              value={[stakePct]} 
              min={isStakePercent ? 1 : 10}
              max={isStakePercent ? 100 : investmentAmount}
              step={isStakePercent ? 1 : 10}
              onValueChange={(value) => setStakePct(value[0])}
              className="flex-1"
            />
            <div className="flex gap-1 items-center min-w-[80px]">
              {isStakePercent ? (
                <>
                  <Input 
                    type="number"
                    value={stakePct}
                    onChange={(e) => setStakePct(Number(e.target.value))}
                    className="w-16"
                  />
                  <Percent className="w-4 h-4 text-muted-foreground" />
                </>
              ) : (
                <Input 
                  type="number"
                  value={stakePct}
                  onChange={(e) => setStakePct(Number(e.target.value))}
                  className="w-20"
                />
              )}
            </div>
          </div>
          
          {isStakePercent && (
            <div className="text-sm text-muted-foreground">
              Monto aproximado: {formatCurrency(investmentAmount * stakePct / 100)}
            </div>
          )}
        </div>

        {/* Trade Duration */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Duración</label>
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

          <div className="mt-2 flex gap-4 items-center">
            <Slider 
              value={[duration]} 
              min={1}
              max={durationUnit === 'minute' ? 60 : durationUnit === 'hour' ? 24 : 30}
              step={1}
              onValueChange={(value) => setDuration(value[0])}
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

        {/* Potential Return */}
        <div className="p-3 bg-secondary rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Retorno potencial</p>
              <p className="text-xs text-muted-foreground">Estimación aproximada</p>
          </div>
            <p className="text-lg font-bold">{formatCurrency(potentialReturn)}</p>
          </div>
        </div>

        {/* Execute Trade Button */}
        <div className="flex flex-col gap-4">
        <Button 
            onClick={handlePlaceTrade}
            disabled={isSubmitting}
            className={cn(
              "w-full py-6 text-lg font-semibold shadow-lg transition-all",
              tradeDirection === 'up' 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-red-500 hover:bg-red-600 text-white",
              isSubmitting && "opacity-80"
            )}
        >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="animate-pulse h-5 w-5" />
                <span>Procesando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {tradeDirection === 'up' ? (
                  <ArrowUpCircle className="h-5 w-5" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5" />
                )}
                <span>Ejecutar {tradeDirection === 'up' ? 'Compra' : 'Venta'}</span>
              </div>
            )}
        </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Al ejecutar esta operación, aceptas los términos y condiciones del servicio
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TradeControlPanel; 