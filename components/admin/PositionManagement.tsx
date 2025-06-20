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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  marketColor?: string
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
  
  // Estados para el formulario de modificación - AMPLIADO
  const [editForm, setEditForm] = useState({
    currentPrice: '',
    stopLoss: '',
    takeProfit: '',
    amount: '',
    leverage: '',
    stake: '',
    durationValue: '',
    durationUnit: '',
    marketColor: '',
    reason: ''
  })

  // Nuevo estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
      stake: position.stake?.toString() || '',
      durationValue: position.durationValue?.toString() || '',
      durationUnit: position.durationUnit || '',
      marketColor: position.marketColor || '',
      reason: ''
    })
    setIsEditDialogOpen(true)
  }

  // Función de validación en tiempo real
  const validateField = (field: string, value: string, position: TradePosition) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'currentPrice':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) <= 0)) {
          errors[field] = 'El precio debe ser un número positivo'
        }
        break
      case 'amount':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) <= 0)) {
          errors[field] = 'La cantidad debe ser un número positivo'
        }
        break
      case 'leverage':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 1 || parseFloat(value) > 1000)) {
          errors[field] = 'El apalancamiento debe estar entre 1 y 1000'
        }
        break
      case 'stake':
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) <= 0)) {
          errors[field] = 'El stake debe ser un número positivo'
        }
        break
      case 'durationValue':
        if (value && (isNaN(parseInt(value)) || parseInt(value) <= 0)) {
          errors[field] = 'La duración debe ser un número entero positivo'
        }
        break
      case 'stopLoss':
        if (value && !isNaN(parseFloat(value))) {
          const currentPrice = parseFloat(editForm.currentPrice) || position.currentPrice
          if (position.direction === 'long' && parseFloat(value) >= currentPrice) {
            errors[field] = 'Para posiciones long, el stop loss debe ser menor al precio actual'
          } else if (position.direction === 'short' && parseFloat(value) <= currentPrice) {
            errors[field] = 'Para posiciones short, el stop loss debe ser mayor al precio actual'
          }
        }
        break
      case 'takeProfit':
        if (value && !isNaN(parseFloat(value))) {
          const currentPrice = parseFloat(editForm.currentPrice) || position.currentPrice
          if (position.direction === 'long' && parseFloat(value) <= currentPrice) {
            errors[field] = 'Para posiciones long, el take profit debe ser mayor al precio actual'
          } else if (position.direction === 'short' && parseFloat(value) >= currentPrice) {
            errors[field] = 'Para posiciones short, el take profit debe ser menor al precio actual'
          }
        }
        break
    }
    
    return errors
  }

  // Actualizar el handle de cambio de formulario
  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    
    if (selectedPosition) {
      const fieldErrors = validateField(field, value, selectedPosition)
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors,
        [field]: fieldErrors[field] || ''
      }))
    }
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

    // Verificar si hay errores de validación
    const hasErrors = Object.values(validationErrors).some(error => error !== '')
    if (hasErrors) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario antes de continuar",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const modifications = []
      
      // Verificar qué campos han cambiado - AMPLIADO
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

      // NUEVOS CAMPOS DE MODIFICACIÓN
      if (parseFloat(editForm.amount) !== selectedPosition.amount) {
        modifications.push({
          field: 'amount',
          oldValue: selectedPosition.amount,
          newValue: parseFloat(editForm.amount)
        })
      }

      if (parseFloat(editForm.leverage) !== selectedPosition.leverage) {
        modifications.push({
          field: 'leverage',
          oldValue: selectedPosition.leverage,
          newValue: parseFloat(editForm.leverage)
        })
      }

      if (editForm.stake && parseFloat(editForm.stake) !== selectedPosition.stake) {
        modifications.push({
          field: 'stake',
          oldValue: selectedPosition.stake,
          newValue: parseFloat(editForm.stake)
        })
      }

      if (editForm.durationValue && parseInt(editForm.durationValue) !== selectedPosition.durationValue) {
        modifications.push({
          field: 'durationValue',
          oldValue: selectedPosition.durationValue,
          newValue: parseInt(editForm.durationValue)
        })
      }

      if (editForm.durationUnit && editForm.durationUnit !== selectedPosition.durationUnit) {
        modifications.push({
          field: 'durationUnit',
          oldValue: selectedPosition.durationUnit,
          newValue: editForm.durationUnit
        })
      }

      if (editForm.marketColor && editForm.marketColor !== selectedPosition.marketColor) {
        modifications.push({
          field: 'marketColor',
          oldValue: selectedPosition.marketColor,
          newValue: editForm.marketColor
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
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔧 Modificar Posición - 9 Campos Disponibles</DialogTitle>
            <DialogDescription>
              Modifica los valores de la posición de {selectedPosition?.userName} - Módulo Ampliado con Monto, Apalancamiento, Stake, Duración y Color
            </DialogDescription>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="grid gap-4 py-4">
              {/* === FORMULARIO AMPLIADO CON 9 CAMPOS EDITABLES === */}
              
              {/* Información de campos disponibles */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Campos Modificables Disponibles (9 Total)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-green-800">
                  <div>• Precio Actual</div>
                  <div>• Stop Loss</div>
                  <div>• Take Profit</div>
                  <div>• Monto</div>
                  <div>• Apalancamiento</div>
                  <div>• Stake</div>
                  <div>• Duración (Valor)</div>
                  <div>• Duración (Unidad)</div>
                  <div>• Color de Mercado</div>
                </div>
              </div>

              {/* Información de la posición */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">📊 Información de la Posición</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>Usuario: <span className="font-medium">{selectedPosition.userName}</span></div>
                  <div>P&L Actual: <span className={`font-medium ${(selectedPosition.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedPosition.profit ? formatCurrency(selectedPosition.profit) : 'N/A'}
                  </span></div>
                  <div>Apertura: <span className="font-medium">{formatDateTime(selectedPosition.openTime)}</span></div>
                  <div>Estado: <span className="font-medium capitalize">{selectedPosition.status}</span></div>
                </div>
              </div>
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
                    min="0"
                    value={editForm.currentPrice}
                    onChange={(e) => handleFormChange('currentPrice', e.target.value)}
                    placeholder="Nuevo precio actual"
                    className={validationErrors.currentPrice ? 'border-red-500' : ''}
                  />
                  {validationErrors.currentPrice && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.currentPrice}</p>
                  )}
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
                    onChange={(e) => handleFormChange('stopLoss', e.target.value)}
                    placeholder="Precio de stop loss"
                    className={validationErrors.stopLoss ? 'border-red-500' : ''}
                  />
                  {validationErrors.stopLoss && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.stopLoss}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="takeProfit">Take Profit</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    value={editForm.takeProfit}
                    onChange={(e) => handleFormChange('takeProfit', e.target.value)}
                    placeholder="Precio de take profit"
                    className={validationErrors.takeProfit ? 'border-red-500' : ''}
                  />
                  {validationErrors.takeProfit && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.takeProfit}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    placeholder={`Actual: ${formatCurrency(selectedPosition.amount)}`}
                    className={validationErrors.amount ? 'border-red-500' : ''}
                  />
                  {validationErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="leverage">Apalancamiento</Label>
                  <Input
                    id="leverage"
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={editForm.leverage}
                    onChange={(e) => handleFormChange('leverage', e.target.value)}
                    placeholder={`Actual: ${selectedPosition.leverage}x`}
                    className={validationErrors.leverage ? 'border-red-500' : ''}
                  />
                  {validationErrors.leverage && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.leverage}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stake">Stake</Label>
                  <Input
                    id="stake"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.stake}
                    onChange={(e) => handleFormChange('stake', e.target.value)}
                    placeholder={`Actual: ${selectedPosition.stake ? formatCurrency(selectedPosition.stake) : 'No definido'}`}
                    className={validationErrors.stake ? 'border-red-500' : ''}
                  />
                  {validationErrors.stake && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.stake}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="durationValue">Duración (Valor)</Label>
                  <Input
                    id="durationValue"
                    type="number"
                    step="1"
                    min="1"
                    value={editForm.durationValue}
                    onChange={(e) => handleFormChange('durationValue', e.target.value)}
                    placeholder={`Actual: ${selectedPosition.durationValue || 'No definido'}`}
                    className={validationErrors.durationValue ? 'border-red-500' : ''}
                  />
                  {validationErrors.durationValue && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.durationValue}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationUnit">Duración (Unidad)</Label>
                  <Select 
                    value={editForm.durationUnit} 
                    onValueChange={(value) => handleFormChange('durationUnit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minutos</SelectItem>
                      <SelectItem value="hour">Horas</SelectItem>
                      <SelectItem value="day">Días</SelectItem>
                      <SelectItem value="week">Semanas</SelectItem>
                      <SelectItem value="month">Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="marketColor">Color de Mercado</Label>
                  <div className="flex gap-2">
                    <Input
                      id="marketColor"
                      value={editForm.marketColor}
                      onChange={(e) => handleFormChange('marketColor', e.target.value)}
                      placeholder="Ej: #3B82F6"
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded border border-input"
                      style={{ backgroundColor: editForm.marketColor || '#3B82F6' }}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Resumen de cambios</Label>
                <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                  {selectedPosition && (
                    <>
                      {parseFloat(editForm.currentPrice) !== selectedPosition.currentPrice && (
                        <div className="flex justify-between">
                          <span>Precio actual:</span>
                          <span>{formatCurrency(selectedPosition.currentPrice)} → {formatCurrency(parseFloat(editForm.currentPrice) || 0)}</span>
                        </div>
                      )}
                      {parseFloat(editForm.amount) !== selectedPosition.amount && (
                        <div className="flex justify-between">
                          <span>Cantidad:</span>
                          <span>{formatCurrency(selectedPosition.amount)} → {formatCurrency(parseFloat(editForm.amount) || 0)}</span>
                        </div>
                      )}
                      {parseFloat(editForm.leverage) !== selectedPosition.leverage && (
                        <div className="flex justify-between">
                          <span>Apalancamiento:</span>
                          <span>{selectedPosition.leverage}x → {parseFloat(editForm.leverage) || 0}x</span>
                        </div>
                      )}
                      {editForm.stopLoss && parseFloat(editForm.stopLoss) !== selectedPosition.stopLoss && (
                        <div className="flex justify-between">
                          <span>Stop Loss:</span>
                          <span>{selectedPosition.stopLoss ? formatCurrency(selectedPosition.stopLoss) : 'N/A'} → {formatCurrency(parseFloat(editForm.stopLoss))}</span>
                        </div>
                      )}
                      {editForm.takeProfit && parseFloat(editForm.takeProfit) !== selectedPosition.takeProfit && (
                        <div className="flex justify-between">
                          <span>Take Profit:</span>
                          <span>{selectedPosition.takeProfit ? formatCurrency(selectedPosition.takeProfit) : 'N/A'} → {formatCurrency(parseFloat(editForm.takeProfit))}</span>
                        </div>
                      )}
                      {editForm.stake && parseFloat(editForm.stake) !== selectedPosition.stake && (
                        <div className="flex justify-between">
                          <span>Stake:</span>
                          <span>{selectedPosition.stake ? formatCurrency(selectedPosition.stake) : 'N/A'} → {formatCurrency(parseFloat(editForm.stake))}</span>
                        </div>
                      )}
                      {editForm.durationValue && parseInt(editForm.durationValue) !== selectedPosition.durationValue && (
                        <div className="flex justify-between">
                          <span>Duración:</span>
                          <span>{selectedPosition.durationValue || 'N/A'} → {editForm.durationValue}</span>
                        </div>
                      )}
                      {editForm.durationUnit && editForm.durationUnit !== selectedPosition.durationUnit && (
                        <div className="flex justify-between">
                          <span>Unidad de Duración:</span>
                          <span>{selectedPosition.durationUnit || 'N/A'} → {editForm.durationUnit}</span>
                        </div>
                      )}
                      {editForm.marketColor && editForm.marketColor !== selectedPosition.marketColor && (
                        <div className="flex justify-between">
                          <span>Color de Mercado:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: selectedPosition.marketColor || '#cccccc' }} />
                            <span>→</span>
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: editForm.marketColor || '#3B82F6' }} />
                            <span className="text-xs">{editForm.marketColor}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!((parseFloat(editForm.currentPrice) !== selectedPosition.currentPrice && editForm.currentPrice) ||
                     (parseFloat(editForm.amount) !== selectedPosition.amount && editForm.amount) ||
                     (parseFloat(editForm.leverage) !== selectedPosition.leverage && editForm.leverage) ||
                     (editForm.stopLoss && parseFloat(editForm.stopLoss) !== selectedPosition.stopLoss) ||
                     (editForm.takeProfit && parseFloat(editForm.takeProfit) !== selectedPosition.takeProfit) ||
                     (editForm.stake && parseFloat(editForm.stake) !== selectedPosition.stake) ||
                     (editForm.durationValue && parseInt(editForm.durationValue) !== selectedPosition.durationValue) ||
                     (editForm.durationUnit && editForm.durationUnit !== selectedPosition.durationUnit) ||
                     (editForm.marketColor && editForm.marketColor !== selectedPosition.marketColor)) && (
                    <div className="text-center text-muted-foreground py-2">
                      💡 Modifica los campos que desees cambiar y aparecerán aquí
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="reason">Razón de la modificación *</Label>
                <Textarea
                  id="reason"
                  value={editForm.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="Explica detalladamente por qué realizas esta modificación"
                  rows={3}
                  className="resize-none"
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
                         mod.field === 'takeProfit' ? 'Take Profit' :
                         mod.field === 'amount' ? 'Cantidad' :
                         mod.field === 'leverage' ? 'Apalancamiento' :
                         mod.field === 'stake' ? 'Stake' :
                         mod.field === 'durationValue' ? 'Duración (Valor)' :
                         mod.field === 'durationUnit' ? 'Duración (Unidad)' :
                         mod.field === 'marketColor' ? 'Color de Mercado' : mod.field}
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