"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

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
};

interface OpenPositionsProps {
  positions: TradePosition[];
  onClosePosition: (positionId: string) => void;
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ positions, onClosePosition }) => {
  const [expandedPositions, setExpandedPositions] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
  
  // Format duration
  const formatDuration = (duration: { value: number; unit: string }): string => {
    return `${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}`;
  };
  
  // Calculate time remaining and return formatted string
  const getTimeRemaining = (position: TradePosition): {
    text: string;
    percentage: number;
    isExpiringSoon: boolean;
  } => {
    // Get expiration time
    const durationMs = getDurationInMs(position.duration);
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
  
  // Calculate milliseconds for a duration
  const getDurationInMs = (duration: { value: number; unit: string }): number => {
    const multipliers: Record<string, number> = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000
    };
    
    return duration.value * multipliers[duration.unit];
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          Posiciones abiertas ({positions.length})
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
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-right">Expira</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const timeRemaining = getTimeRemaining(position);
                
                return (
                <React.Fragment key={position.id}>
                  <TableRow className={cn(
                    "hover:bg-muted/50 cursor-pointer",
                    timeRemaining.isExpiringSoon && "bg-yellow-500/10"
                  )} onClick={() => toggleExpanded(position.id)}>
                    <TableCell>
                      <div className="flex items-center gap-1 md:gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: position.marketColor }}
                        />
                        <span className="text-xs md:text-sm font-medium whitespace-nowrap truncate max-w-[100px]">
                          {position.marketName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "gap-1",
                          position.direction === 'up' ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                        )}
                      >
                        {position.direction === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs">
                          {position.direction === 'up' ? 'Compra' : 'Venta'}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(position.stake)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium", 
                      position.profit >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {position.profit >= 0 ? '+' : ''}{formatCurrency(position.profit)}
                      <span className="text-xs block">
                        ({position.profit >= 0 ? '+' : ''}{position.profitPercentage.toFixed(2)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <div className={cn(
                          "text-xs flex items-center gap-1",
                          timeRemaining.isExpiringSoon && "text-yellow-500 font-medium"
                        )}>
                          {timeRemaining.isExpiringSoon && <AlertCircle className="h-3 w-3" />}
                          {timeRemaining.text}
                        </div>
                        <Progress 
                          value={timeRemaining.percentage} 
                          className={cn(
                            "h-1 w-16 mt-1",
                            timeRemaining.isExpiringSoon && "bg-yellow-500/30"
                          )}
                          indicatorClassName={timeRemaining.isExpiringSoon ? "bg-yellow-500" : undefined}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {expandedPositions.includes(position.id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded details */}
                  {expandedPositions.includes(position.id) && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Precio de entrada</div>
                            <div className="font-medium">{formatCurrency(position.openPrice)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Precio actual</div>
                            <div className="font-medium">{formatCurrency(position.currentPrice)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Hora de apertura</div>
                            <div className="font-medium">{formatTime(position.openTime)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Duración</div>
                            <div className="font-medium">{formatDuration(position.duration)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Tiempo restante: </span>
                            <span className={cn(
                              "font-medium",
                              timeRemaining.isExpiringSoon && "text-yellow-500"
                            )}>
                              {timeRemaining.text}
                            </span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClosePosition(position.id);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cerrar posición
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenPositions; 