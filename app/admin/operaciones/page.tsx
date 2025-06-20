'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  History, 
  Users, 
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Zap,
  RefreshCw
} from 'lucide-react'

// Tipos
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

export default function OperacionesAdminPage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [positions, setPositions] = useState<TradePosition[]>([])
  const [modifications, setModifications] = useState<PositionModification[]>([])
  const [selectedPosition, setSelectedPosition] = useState<TradePosition | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Hook de tiempo real que reutiliza la lógica existente del sistema
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

  // Verificar permisos
  useEffect(() => {
    if (user && !hasRole('admin') && !hasRole('maestro')) {
      router.push('/')
      return
    }
  }, [user, hasRole, router])

  // Cargar datos
  useEffect(() => {
    if (user && (hasRole('admin') || hasRole('maestro'))) {
      loadPositions()
      loadModifications()
    }
  }, [user, hasRole])

  const loadPositions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/positions', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setPositions(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al cargar las posiciones",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading positions:', error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar las posiciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadModifications = async () => {
    try {
      const response = await fetch('/api/admin/positions/modifications', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setModifications(result.data)
      }
    } catch (error) {
      console.error('Error loading modifications:', error)
    }
  }

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

    try {
      const modifications = []
      
      // Verificar qué campos han cambiado
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

      // Nuevos campos de modificación
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

      if (editForm.status !== selectedPosition.status) {
        modifications.push({
          field: 'status',
          oldValue: selectedPosition.status,
          newValue: editForm.status
        })
      }

      if (editForm.stake && parseFloat(editForm.stake) !== (selectedPosition.stake || 0)) {
        modifications.push({
          field: 'stake',
          oldValue: selectedPosition.stake || 0,
          newValue: parseFloat(editForm.stake)
        })
      }

      if (editForm.durationValue && parseInt(editForm.durationValue) !== (selectedPosition.durationValue || 1)) {
        modifications.push({
          field: 'durationValue',
          oldValue: selectedPosition.durationValue || 1,
          newValue: parseInt(editForm.durationValue)
        })
      }

      if (editForm.durationUnit !== (selectedPosition.durationUnit || 'hour')) {
        modifications.push({
          field: 'durationUnit',
          oldValue: selectedPosition.durationUnit || 'hour',
          newValue: editForm.durationUnit
        })
      }

      if (modifications.length === 0) {
        toast({
          title: "Información",
          description: "No se detectaron cambios en los valores",
          variant: "default"
        })
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
        loadPositions()
        loadModifications()
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
    }
  }

  const handleViewHistory = (position: TradePosition) => {
    setSelectedPosition(position)
    setIsHistoryDialogOpen(true)
  }

  // Filtrar posiciones usando datos en tiempo real
  const filteredPositions = realTimePositions.filter(position => {
    const matchesSearch = position.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.instrument.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || position.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Obtener estadísticas de tiempo real
  const connectionStats = getConnectionStats()

  // Obtener modificaciones de una posición específica
  const getPositionModifications = (positionId: string) => {
    return modifications.filter(mod => mod.positionId === positionId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando operaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestión de Operaciones de Clientes
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra y modifica las operaciones abiertas de los usuarios
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de tiempo real */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Tiempo Real ({activeConnections} conexiones)
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">
                  Sin conexión en tiempo real
                </span>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={forceUpdate}
              className="h-6 w-6 p-0 ml-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {user?.role === 'admin' ? 'Administrador' : 'Maestro'}
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar por usuario o instrumento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nombre, email o instrumento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abiertas</SelectItem>
                  <SelectItem value="closed">Cerradas</SelectItem>
                  <SelectItem value="liquidated">Liquidadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posiciones</p>
                <p className="text-2xl font-bold">{filteredPositions.length}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posiciones Abiertas</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPositions.filter(p => p.status === 'open').length}
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posiciones Cerradas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPositions.filter(p => p.status === 'closed').length}
                </p>
              </div>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Modificaciones Hoy</p>
                <p className="text-2xl font-bold text-orange-600">
                  {modifications.filter(m => 
                    new Date(m.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <History className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo Real</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(connectionStats.supportPercentage)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectionStats.supportedPositions}/{connectionStats.totalPositions} soportadas
                </p>
              </div>
              {isConnected ? (
                <Zap className="h-4 w-4 text-purple-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de posiciones */}
      <Card>
        <CardHeader>
          <CardTitle>Posiciones de Trading</CardTitle>
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
                <TableHead>Monto</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{position.userName}</div>
                      <div className="text-sm text-muted-foreground">{position.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{position.instrument}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {isRealTimeSupported(position.instrument) ? (
                              <Zap className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isRealTimeSupported(position.instrument) 
                              ? 'Actualización en tiempo real activa' 
                              : 'Sin actualización en tiempo real'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                  <TableCell>{formatCurrency(position.amount)}</TableCell>
                  <TableCell>
                    {position.profit !== undefined && (
                      <span className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(position.profit)}
                      </span>
                    )}
                  </TableCell>
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
              ))}
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

              {/* Nuevos campos de modificación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Monto de la Posición *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    placeholder="Monto en moneda base"
                  />
                </div>
                <div>
                  <Label htmlFor="leverage">Apalancamiento *</Label>
                  <Input
                    id="leverage"
                    type="number"
                    step="0.1"
                    min="1"
                    max="1000"
                    value={editForm.leverage}
                    onChange={(e) => setEditForm({...editForm, leverage: e.target.value})}
                    placeholder="Nivel de apalancamiento"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Estado de la Posición</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierta</SelectItem>
                      <SelectItem value="closed">Cerrada</SelectItem>
                      <SelectItem value="liquidated">Liquidada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="durationValue">Duración</Label>
                  <Input
                    id="durationValue"
                    type="number"
                    min="1"
                    value={editForm.durationValue}
                    onChange={(e) => setEditForm({...editForm, durationValue: e.target.value})}
                    placeholder="Valor"
                  />
                </div>
                <div>
                  <Label htmlFor="durationUnit">Unidad</Label>
                  <Select value={editForm.durationUnit} onValueChange={(value) => setEditForm({...editForm, durationUnit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minutos</SelectItem>
                      <SelectItem value="hour">Horas</SelectItem>
                      <SelectItem value="day">Días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="stake">Stake/Apuesta</Label>
                <Input
                  id="stake"
                  type="number"
                  step="0.01"
                  value={editForm.stake}
                  onChange={(e) => setEditForm({...editForm, stake: e.target.value})}
                  placeholder="Cantidad apostada"
                />
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
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveModifications}>
              Guardar Cambios
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
                         mod.field === 'amount' ? 'Monto' :
                         mod.field === 'leverage' ? 'Apalancamiento' :
                         mod.field === 'status' ? 'Estado' :
                         mod.field === 'stake' ? 'Stake/Apuesta' :
                         mod.field === 'durationValue' ? 'Duración (Valor)' :
                         mod.field === 'durationUnit' ? 'Duración (Unidad)' : mod.field}
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