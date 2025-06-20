'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAdminRealTimePositions } from '@/hooks/useAdminRealTimePositions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  History, 
  AlertTriangle,
  Save,
  X,
  Wifi,
  WifiOff,
  Zap,
  Clock
} from 'lucide-react'

// Reutilizando tipos de la lógica existente de trading
interface TradePosition {
  id: string
  userId: string
  userName: string
  userEmail: string
  instrument: string
  direction: 'long' | 'short'
  openPrice: number
  currentPrice: number
  amount: number
  leverage: number
  openTime: string
  profit?: number
  status: 'open' | 'closed' | 'liquidated'
  stopLoss?: number
  takeProfit?: number
  stake?: number
  durationValue?: number
  durationUnit?: string
  capitalFraction?: number
  lotSize?: number
  marginRequired?: number
  positionValue?: number
}

interface PositionModification {
  id: string
  positionId: string
  modifiedBy: string
  modifiedByName: string
  field: string
  oldValue: any
  newValue: any
  reason: string
  timestamp: string
}

interface PositionManagementProps {
  positions: TradePosition[]
  modifications?: PositionModification[]
  onPositionUpdate?: (positionId: string) => void
  showAllColumns?: boolean
  compactView?: boolean
  userRole?: 'admin' | 'maestro'
}

export const PositionManagement: React.FC<PositionManagementProps> = ({
  positions = [],
  modifications = [],
  onPositionUpdate,
  showAllColumns = true,
  compactView = false,
  userRole = 'admin'
}) => {
  const { toast } = useToast()
  
  const [selectedPosition, setSelectedPosition] = useState<TradePosition | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Integrar tiempo real reutilizando la lógica existente
  const { 
    positions: realTimePositions, 
    isConnected, 
    activeConnections, 
    forceUpdate,
    getConnectionStats,
    isRealTimeSupported
  } = useAdminRealTimePositions(positions, {
    updateInterval: 2000,
    enableWebSocket: true
  })
  
  // Estados para el formulario de modificación
  const [editForm, setEditForm] = useState({
    currentPrice: '',
    stopLoss: '',
    takeProfit: '',
    amount: '',
    leverage: '',
    status: '',
    stake: '',
    durationValue: '',
    durationUnit: '',
    reason: ''
  })

  // Reutilizando lógica de formateo del sistema existente
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(amount)
  }, [])

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO')
  }, [])

  const handleEditPosition = (position: TradePosition) => {
    setSelectedPosition(position)
    setEditForm({
      currentPrice: position.currentPrice.toString(),
      stopLoss: position.stopLoss?.toString() || '',
      takeProfit: position.takeProfit?.toString() || '',
      amount: position.amount.toString(),
      leverage: position.leverage.toString(),
      status: position.status,
      stake: position.stake?.toString() || '0',
      durationValue: position.durationValue?.toString() || '1',
      durationUnit: position.durationUnit || 'hour',
      reason: ''
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveModifications = async () => {
    if (!selectedPosition || !editForm.reason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para la modificación",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const modifications = []
      
      // Verificar qué campos han cambiado (reutilizando lógica existente)
      if (parseFloat(editForm.currentPrice) !== selectedPosition.currentPrice) {
        modifications.push({
          field: 'currentPrice',
          oldValue: selectedPosition.currentPrice,
          newValue: parseFloat(editForm.currentPrice)
        })
      }
      
      if (editForm.stopLoss && parseFloat(editForm.stopLoss) !== selectedPosition.stopLoss) {
        modifications.push({
          field: 'stopLoss',
          oldValue: selectedPosition.stopLoss,
          newValue: parseFloat(editForm.stopLoss)
        })
      }
      
      if (editForm.takeProfit && parseFloat(editForm.takeProfit) !== selectedPosition.takeProfit) {
        modifications.push({
          field: 'takeProfit',
          oldValue: selectedPosition.takeProfit,
          newValue: parseFloat(editForm.takeProfit)
        })
      }

      if (modifications.length === 0) {
        toast({
          title: "Información",
          description: "No se detectaron cambios en los valores",
          variant: "default"
        })
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/admin/positions/${selectedPosition.id}/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          modifications,
          reason: editForm.reason
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Posición modificada correctamente",
          variant: "default"
        })
        setIsEditDialogOpen(false)
        
        // Notificar al componente padre sobre la actualización
        onPositionUpdate?.(selectedPosition.id)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al modificar la posición",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving modifications:', error)
      toast({
        title: "Error",
        description: "Error de conexión al guardar los cambios",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewHistory = (position: TradePosition) => {
    setSelectedPosition(position)
    setIsHistoryDialogOpen(true)
  }

  // Obtener modificaciones de una posición específica
  const getPositionModifications = (positionId: string) => {
    return modifications.filter(mod => mod.positionId === positionId)
  }

  // Calcular métricas de profit/loss reutilizando lógica existente
  const calculateProfitMetrics = (position: TradePosition) => {
    if (!position.profit) return null
    
    const profitPercentage = (position.profit / position.amount) * 100
    const isProfit = position.profit >= 0
    
    return {
      profit: position.profit,
      profitPercentage,
      isProfit,
      formattedProfit: formatCurrency(position.profit),
      formattedPercentage: `${profitPercentage.toFixed(2)}%`
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabla de posiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Posiciones de Trading
              {userRole && (
                <Badge variant="outline" className="ml-2">
                  {userRole === 'admin' ? 'Administrador' : 'Maestro'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Indicador de tiempo real */}
              <div className="flex items-center gap-1 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">En vivo</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">Offline</span>
                  </>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Instrumento</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Precio Apertura</TableHead>
                <TableHead>Precio Actual</TableHead>
                {showAllColumns && <TableHead>Monto</TableHead>}
                {showAllColumns && <TableHead>P&L</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realTimePositions.map((position) => {
                const profitMetrics = calculateProfitMetrics(position)
                
                return (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{position.userName}</div>
                        {!compactView && (
                          <div className="text-sm text-muted-foreground">{position.userEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{position.instrument}</span>
                        {isRealTimeSupported(position.instrument) ? (
                          <Zap className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={position.direction === 'long' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {position.direction === 'long' ? 
                          <TrendingUp className="h-3 w-3" /> : 
                          <TrendingDown className="h-3 w-3" />
                        }
                        {position.direction === 'long' ? 'Compra' : 'Venta'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(position.openPrice)}</TableCell>
                    <TableCell>{formatCurrency(position.currentPrice)}</TableCell>
                    {showAllColumns && (
                      <TableCell>{formatCurrency(position.amount)}</TableCell>
                    )}
                    {showAllColumns && (
                      <TableCell>
                        {profitMetrics && (
                          <span className={profitMetrics.isProfit ? 'text-green-600' : 'text-red-600'}>
                            {profitMetrics.formattedProfit}
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge 
                        variant={
                          position.status === 'open' ? 'default' :
                          position.status === 'closed' ? 'secondary' : 'destructive'
                        }
                      >
                        {position.status === 'open' ? 'Abierta' :
                         position.status === 'closed' ? 'Cerrada' : 'Liquidada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {position.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPosition(position)}
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewHistory(position)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {realTimePositions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showAllColumns ? 9 : 7} className="text-center text-muted-foreground">
                    No hay posiciones disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para editar posición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modificar Posición</DialogTitle>
            <DialogDescription>
              Modifica los valores de la posición de {selectedPosition?.userName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instrument">Instrumento</Label>
                  <Input 
                    id="instrument" 
                    value={selectedPosition.instrument} 
                    disabled 
                  />
                </div>
                <div>
                  <Label htmlFor="direction">Dirección</Label>
                  <Input 
                    id="direction" 
                    value={selectedPosition.direction === 'long' ? 'Compra' : 'Venta'} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openPrice">Precio de Apertura</Label>
                  <Input 
                    id="openPrice" 
                    value={formatCurrency(selectedPosition.openPrice)} 
                    disabled 
                  />
                </div>
                <div>
                  <Label htmlFor="currentPrice">Precio Actual *</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={editForm.currentPrice}
                    onChange={(e) => setEditForm({...editForm, currentPrice: e.target.value})}
                    placeholder="Nuevo precio actual"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.01"
                    value={editForm.stopLoss}
                    onChange={(e) => setEditForm({...editForm, stopLoss: e.target.value})}
                    placeholder="Precio de stop loss"
                  />
                </div>
                <div>
                  <Label htmlFor="takeProfit">Take Profit</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    value={editForm.takeProfit}
                    onChange={(e) => setEditForm({...editForm, takeProfit: e.target.value})}
                    placeholder="Precio de take profit"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">Razón de la modificación *</Label>
                <Input
                  id="reason"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                  placeholder="Explica por qué realizas esta modificación"
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <strong>Advertencia:</strong> Estas modificaciones afectarán directamente la posición del usuario y quedarán registradas en el historial de auditoría.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveModifications}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver historial */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Historial de Modificaciones</DialogTitle>
            <DialogDescription>
              Historial completo de cambios para la posición de {selectedPosition?.userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {selectedPosition && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>Valor Anterior</TableHead>
                    <TableHead>Valor Nuevo</TableHead>
                    <TableHead>Modificado por</TableHead>
                    <TableHead>Razón</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPositionModifications(selectedPosition.id).map((mod) => (
                    <TableRow key={mod.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(mod.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {mod.field === 'currentPrice' ? 'Precio Actual' :
                         mod.field === 'stopLoss' ? 'Stop Loss' :
                         mod.field === 'takeProfit' ? 'Take Profit' : mod.field}
                      </TableCell>
                      <TableCell>
                        {typeof mod.oldValue === 'number' ? 
                          formatCurrency(mod.oldValue) : 
                          (mod.oldValue || 'N/A')
                        }
                      </TableCell>
                      <TableCell>
                        {typeof mod.newValue === 'number' ? 
                          formatCurrency(mod.newValue) : 
                          (mod.newValue || 'N/A')
                        }
                      </TableCell>
                      <TableCell>{mod.modifiedByName}</TableCell>
                      <TableCell className="text-sm">{mod.reason}</TableCell>
                    </TableRow>
                  ))}
                  {getPositionModifications(selectedPosition.id).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No se han realizado modificaciones en esta posición
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PositionManagement