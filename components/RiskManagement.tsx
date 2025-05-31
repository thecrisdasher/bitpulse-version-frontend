'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompatButton as Button } from '@/components/ui/compat-button';
import { CompatBadge as Badge } from '@/components/ui/compat-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calculator,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  Wallet,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para las operaciones
interface Position {
  id: string;
  type: 'buy' | 'sell';
  direction: 'long' | 'short';
  symbol: string;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  openTime: Date;
  volume: number;
  marginRequired: number;
  unrealizedPnL: number;
  fractionUsed: number;
}

interface RiskManagementState {
  totalCapital: number;
  availableFunds: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  positions: Position[];
}

export function RiskManagement() {
  // Estado principal del sistema de gestión de riesgo
  const [riskState, setRiskState] = useState<RiskManagementState>({
    totalCapital: 10000, // Capital inicial de ejemplo
    availableFunds: 10000,
    usedMargin: 0,
    freeMargin: 10000,
    marginLevel: 0,
    positions: []
  });

  // Estados para nueva operación
  const [newPosition, setNewPosition] = useState({
    symbol: 'EURUSD',
    type: 'buy' as 'buy' | 'sell',
    direction: 'long' as 'long' | 'short',
    fraction: 0.10,
    lotSize: 1,
    leverage: 100
  });

  // Precios simulados para diferentes símbolos
  const [marketPrices, setMarketPrices] = useState({
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'BTCUSD': 43250.00,
    'ETHUSD': 2640.00,
    'XAUUSD': 2040.50
  });

  // Simular actualización de precios en tiempo real
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
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calcular margen requerido para una nueva posición
  const calculateMarginRequired = useCallback((fraction: number, symbol: string, lotSize: number, leverage: number = 100) => {
    const price = marketPrices[symbol as keyof typeof marketPrices] || 1;
    const capitalToUse = riskState.totalCapital * fraction;
    
    // Para forex, típicamente 1 lote = 100,000 unidades
    let contractSize = 100000;
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      contractSize = 1; // Para crypto, 1 lote = 1 unidad
    } else if (symbol.includes('XAU')) {
      contractSize = 100; // Para oro, 1 lote = 100 onzas
    }
    
    const positionValue = price * contractSize * lotSize;
    const marginRequired = positionValue / leverage;
    
    return Math.min(marginRequired, capitalToUse);
  }, [riskState.totalCapital, marketPrices]);

  // Actualizar posiciones en tiempo real
  useEffect(() => {
    setRiskState(prev => {
      const updatedPositions = prev.positions.map(position => {
        const currentPrice = marketPrices[position.symbol as keyof typeof marketPrices] || position.currentPrice;
        
        // Calcular PnL no realizado
        let pnlMultiplier = 1;
        if (position.type === 'sell' || position.direction === 'short') {
          pnlMultiplier = -1;
        }
        
        const priceDifference = currentPrice - position.entryPrice;
        const unrealizedPnL = priceDifference * position.volume * pnlMultiplier;
        
        return {
          ...position,
          currentPrice,
          unrealizedPnL
        };
      });

      const totalUsedMargin = updatedPositions.reduce((sum, pos) => sum + pos.marginRequired, 0);
      const totalUnrealizedPnL = updatedPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
      const freeMargin = prev.totalCapital - totalUsedMargin + totalUnrealizedPnL;
      const marginLevel = totalUsedMargin > 0 ? (freeMargin / totalUsedMargin) * 100 : 0;

      return {
        ...prev,
        positions: updatedPositions,
        usedMargin: totalUsedMargin,
        freeMargin: Math.max(0, freeMargin),
        marginLevel: Math.max(0, marginLevel)
      };
    });
  }, [marketPrices]);

  // Abrir nueva posición
  const openPosition = () => {
    const marginRequired = calculateMarginRequired(
      newPosition.fraction, 
      newPosition.symbol, 
      newPosition.lotSize, 
      newPosition.leverage
    );

    if (marginRequired > riskState.freeMargin) {
      alert('Margen insuficiente para esta operación');
      return;
    }

    const currentPrice = marketPrices[newPosition.symbol as keyof typeof marketPrices] || 1;
    
    // Calcular volumen basado en el tipo de activo
    let contractSize = 100000;
    if (newPosition.symbol.includes('BTC') || newPosition.symbol.includes('ETH')) {
      contractSize = 1;
    } else if (newPosition.symbol.includes('XAU')) {
      contractSize = 100;
    }
    
    const volume = contractSize * newPosition.lotSize;

    const position: Position = {
      id: `pos_${Date.now()}`,
      type: newPosition.type,
      direction: newPosition.direction,
      symbol: newPosition.symbol,
      lotSize: newPosition.lotSize,
      entryPrice: currentPrice,
      currentPrice,
      openTime: new Date(),
      volume,
      marginRequired,
      unrealizedPnL: 0,
      fractionUsed: newPosition.fraction
    };

    setRiskState(prev => ({
      ...prev,
      positions: [...prev.positions, position]
    }));

    // Reset form
    setNewPosition(prev => ({
      ...prev,
      fraction: 0.10,
      lotSize: 1
    }));
  };

  // Cerrar posición
  const closePosition = (positionId: string) => {
    setRiskState(prev => {
      const position = prev.positions.find(p => p.id === positionId);
      if (!position) return prev;

      // Actualizar capital total con el PnL realizado
      const newTotalCapital = prev.totalCapital + position.unrealizedPnL;
      const updatedPositions = prev.positions.filter(p => p.id !== positionId);

      return {
        ...prev,
        totalCapital: newTotalCapital,
        positions: updatedPositions
      };
    });
  };

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
    <div className="space-y-6">
      {/* Panel principal de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="w-4 h-4" />
                Capital Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${riskState.totalCapital.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground">
                Base para cálculos de riesgo
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Margen Requerido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                ${riskState.usedMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground">
                Capital comprometido
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                Fondos Libres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${riskState.freeMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground">
                Disponible para nuevas operaciones
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="w-4 h-4" />
                Nivel de Margen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getMarginLevelColor(riskState.marginLevel))}>
                {riskState.marginLevel.toFixed(1)}%
              </div>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-xs">
                  {getMarginLevelStatus(riskState.marginLevel)}
                </Badge>
                <Progress 
                  value={Math.min(riskState.marginLevel, 500) / 5} 
                  className="w-12 h-2"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Formulario para nueva operación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Nueva Operación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Símbolo</Label>
                <Select 
                  value={newPosition.symbol} 
                  onValueChange={(value: string) => setNewPosition(prev => ({ ...prev, symbol: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EURUSD">EUR/USD</SelectItem>
                    <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                    <SelectItem value="USDJPY">USD/JPY</SelectItem>
                    <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                    <SelectItem value="ETHUSD">ETH/USD</SelectItem>
                    <SelectItem value="XAUUSD">XAU/USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={newPosition.type} 
                  onValueChange={(value: string) => setNewPosition(prev => ({ 
                    ...prev, 
                    type: value as 'buy' | 'sell',
                    direction: value === 'buy' ? 'long' : 'short'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Compra (Long)</SelectItem>
                    <SelectItem value="sell">Venta (Short)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraction">Fracción de Capital</Label>
                <Input
                  id="fraction"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  value={newPosition.fraction}
                  onChange={(e) => setNewPosition(prev => ({ 
                    ...prev, 
                    fraction: parseFloat(e.target.value) || 0.01 
                  }))}
                  placeholder="0.10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lotSize">Lotes</Label>
                <Input
                  id="lotSize"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPosition.lotSize}
                  onChange={(e) => setNewPosition(prev => ({ 
                    ...prev, 
                    lotSize: parseFloat(e.target.value) || 0.01 
                  }))}
                  placeholder="1.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Margen Requerido</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                  ${calculateMarginRequired(
                    newPosition.fraction, 
                    newPosition.symbol, 
                    newPosition.lotSize
                  ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={openPosition}
                  disabled={calculateMarginRequired(
                    newPosition.fraction, 
                    newPosition.symbol, 
                    newPosition.lotSize
                  ) > riskState.freeMargin}
                  className="w-full"
                >
                  Abrir Posición
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de posiciones abiertas */}
      {riskState.positions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Posiciones Abiertas
                <Badge variant="secondary">
                  {riskState.positions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Símbolo</TableHead>
                      <TableHead>Tipo/Dirección</TableHead>
                      <TableHead>Lotes</TableHead>
                      <TableHead>Precio Apertura</TableHead>
                      <TableHead>Precio Actual</TableHead>
                      <TableHead>Volumen</TableHead>
                      <TableHead>Margen</TableHead>
                      <TableHead>PnL</TableHead>
                      <TableHead>Fracción</TableHead>
                      <TableHead>Tiempo</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {riskState.positions.map((position, index) => (
                        <motion.tr
                          key={position.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{position.symbol}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge 
                                variant={position.type === 'buy' ? 'default' : 'secondary'}
                                className="w-fit"
                              >
                                {position.type === 'buy' ? 'Compra' : 'Venta'}
                              </Badge>
                              <span className="text-xs text-muted-foreground mt-1">
                                {position.direction.toUpperCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{position.lotSize}</TableCell>
                          <TableCell>
                            {position.entryPrice.toFixed(
                              position.symbol.includes('JPY') ? 2 : 
                              position.symbol.includes('BTC') || position.symbol.includes('ETH') ? 0 : 4
                            )}
                          </TableCell>
                          <TableCell>
                            {position.currentPrice.toFixed(
                              position.symbol.includes('JPY') ? 2 : 
                              position.symbol.includes('BTC') || position.symbol.includes('ETH') ? 0 : 4
                            )}
                          </TableCell>
                          <TableCell>{position.volume.toLocaleString()}</TableCell>
                          <TableCell>
                            ${position.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-medium",
                              position.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {position.unrealizedPnL >= 0 ? '+' : ''}
                              ${position.unrealizedPnL.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(position.fractionUsed * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {position.openTime.toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => closePosition(position.id)}
                            >
                              Cerrar
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
} 