"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import useRealTimeMarketData from "@/hooks/useRealTimeMarketData";

interface TradeControlPanelProps {
  instrumentName: string;
  instrumentPrice: number;
  instrumentId: string;
  onClose?: () => void;
  instrumentCategory?: string;
  instrumentSymbol?: string;
}

const TradeControlPanel = ({
  instrumentName = "Índice Volatility 10 (1s)",
  instrumentPrice = 9120.21,
  instrumentId = "volatility-10-1s",
  instrumentCategory = "volatility",
  instrumentSymbol = "VOL10",
  onClose,
}: TradeControlPanelProps) => {
  const [amount, setAmount] = useState("21");
  const [selectedRate, setSelectedRate] = useState<number>(3);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(instrumentPrice);
  
  // Get real-time market data
  const { data: marketData, isLoading } = useRealTimeMarketData(
    instrumentSymbol,
    instrumentCategory || getCategoryFromId(instrumentId),
    { refreshInterval: 5000 }
  );
  
  // Helper function to determine category from ID
  function getCategoryFromId(id: string): string {
    if (id.includes('volatility') || id.includes('boom') || id.includes('crash')) {
      return 'derivados';
    } else if (id.includes('btc') || id.includes('eth')) {
      return 'criptomonedas';
    } else if (id.includes('eur') || id.includes('usd') || id.includes('gbp')) {
      return 'forex';
    } else if (id.includes('gold') || id.includes('oil')) {
      return 'materias-primas';
    } else {
      return 'indices';
    }
  }
  
  // Update price when new market data is received
  useEffect(() => {
    if (marketData) {
      setCurrentPrice(marketData.currentPrice);
    }
  }, [marketData]);
  
  // Animation effect on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Available growth rates
  const growthRates = [
    { value: 1, label: "1%" },
    { value: 2, label: "2%" },
    { value: 3, label: "3%" },
    { value: 4, label: "4%" },
    { value: 5, label: "5%" },
  ];

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate maximum payout based on amount and rate
  const calculateMaxPayout = () => {
    const investmentAmount = parseFloat(amount) || 0;
    const multiplier = 1 + (selectedRate / 100);
    return investmentAmount * multiplier;
  };

  // Handle buy/trade action
  const handleBuy = () => {
    console.log("Buy order placed", {
      instrumentId,
      amount: parseFloat(amount),
      growthRate: selectedRate,
      takeProfit: takeProfitEnabled,
      currentPrice
    });
    // Here you would implement the actual trading logic
  };

  return (
    <Card className={cn(
      "w-full md:w-[350px] transition-all duration-300 ease-in-out", 
      isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <CardContent className="p-4">
        {/* Header with back button option */}
        {onClose && (
          <div className="flex items-center mb-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Volver</span>
            </Button>
          </div>
        )}

        {/* Instrument details */}
        <div className="mb-4">
          <h3 className="font-semibold">{instrumentName}</h3>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">
              {isLoading ? (
                <span className="text-muted-foreground">Cargando...</span>
              ) : (
                `${formatCurrency(currentPrice)}`
              )}
            </span>
            {marketData && (
              <div className={`text-sm font-medium ${marketData.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketData.changePercent24h >= 0 ? '+' : ''}
                {marketData.changePercent24h.toFixed(2)}%
              </div>
            )}
          </div>
          {marketData?.isRealTime && (
            <div className="flex items-center mt-1">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-600">Tiempo real</span>
            </div>
          )}
        </div>

        {/* Accumulators Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-5 h-5 mr-2">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path 
                  d="M2 12h5l3-9 4 18 3-9h5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-medium">Accumulators</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Aprenda más sobre este tipo de operación
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Growth Rate */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Tasa de crecimiento</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Seleccione la tasa de crecimiento para su operación
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {growthRates.map((rate) => (
              <Button
                key={rate.value}
                variant={selectedRate === rate.value ? "default" : "outline"}
                className={cn(
                  "h-8 text-sm font-medium",
                  selectedRate === rate.value ? "" : "bg-muted/30"
                )}
                onClick={() => setSelectedRate(rate.value)}
              >
                {rate.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Investment Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Inversión</label>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 rounded-r-none"
              onClick={() => {
                const currentAmount = parseFloat(amount) || 0;
                if (currentAmount > 1) {
                  setAmount((currentAmount - 1).toString());
                }
              }}
            >
              −
            </Button>
            <Input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="h-10 text-center border-x-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="px-3 h-10 flex items-center justify-center border border-input border-l-0 rounded-none">
              USD
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 rounded-l-none"
              onClick={() => {
                const currentAmount = parseFloat(amount) || 0;
                setAmount((currentAmount + 1).toString());
              }}
            >
              +
            </Button>
          </div>
        </div>

        {/* Take Profit */}
        <div className="flex items-center mb-6">
          <Checkbox
            id="take-profit"
            checked={takeProfitEnabled}
            onCheckedChange={() => setTakeProfitEnabled(!takeProfitEnabled)}
            className="h-4 w-4"
          />
          <label htmlFor="take-profit" className="ml-2 text-sm font-medium">
            Take profit
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6 ml-1">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Cerrar automáticamente la operación al alcanzar el objetivo de beneficio
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Payment Details */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm">Pago máximo</span>
            <span className="font-medium">{formatCurrency(calculateMaxPayout())} USD</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Máximo de ticks</span>
            <span className="font-medium">85 ticks</span>
          </div>
        </div>

        {/* Buy Button */}
        <Button 
          className="w-full bg-[#05A6AA] hover:bg-[#048D91] text-white font-medium h-12"
          onClick={handleBuy}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
          Comprar
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradeControlPanel; 