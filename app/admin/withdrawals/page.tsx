'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, XCircle, Clock, DollarSign, Building, Banknote, User, Calendar, MessageSquare } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Withdrawal {
  id: string
  user: {
    id: string
    name: string
    email: string
    username: string
  }
  type: 'bank_account' | 'crypto'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requestedAt: string
  processedAt?: string
  processedBy?: string
  adminNotes?: string
  bankDetails?: {
    bankName: string
    accountType: string
    accountNumber: string
    city: string
  }
  cryptoDetails?: {
    cryptoType: string
    networkType: string
    walletAddress: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'process'>('approve')
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchWithdrawals = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/withdrawals?page=${page}&status=${status}&limit=20`,
        { credentials: 'include' }
      )
      
      const result = await response.json()
      
      if (result.success) {
        setWithdrawals(result.data.withdrawals)
        setPagination(result.data.pagination)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al cargar los retiros",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar los retiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    fetchWithdrawals(1, status)
  }

  const handlePageChange = (page: number) => {
    fetchWithdrawals(page)
  }

  const handleViewDetails = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailsModal(true)
  }

  const handleAction = (withdrawal: Withdrawal, action: 'approve' | 'reject' | 'process') => {
    setSelectedWithdrawal(withdrawal)
    setActionType(action)
    setAdminNotes('')
    setShowActionModal(true)
  }

  const handleProcessAction = async () => {
    if (!selectedWithdrawal) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: actionType,
          adminNotes
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        })
        
        setShowActionModal(false)
        setSelectedWithdrawal(null)
        setAdminNotes('')
        
        // Refresh the list
        fetchWithdrawals(pagination.page)
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al procesar la acción",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error processing action:', error)
      toast({
        title: "Error",
        description: "Error de conexión al procesar la acción",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>
      case 'processed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Procesado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getActionButtonText = (action: 'approve' | 'reject' | 'process') => {
    switch (action) {
      case 'approve': return 'Aprobar'
      case 'reject': return 'Rechazar'
      case 'process': return 'Marcar como Procesado'
    }
  }

  const getActionButtonVariant = (action: 'approve' | 'reject' | 'process') => {
    switch (action) {
      case 'approve': return 'default'
      case 'reject': return 'destructive'
      case 'process': return 'default'
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Retiros</h1>
          <p className="text-muted-foreground">Administra las solicitudes de retiro de los usuarios</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                  <SelectItem value="processed">Procesados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de retiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Solicitudes de Retiro
          </CardTitle>
          <CardDescription>
            Total: {pagination.total} solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes de retiro
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{withdrawal.user.name}</div>
                          <div className="text-sm text-muted-foreground">@{withdrawal.user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {withdrawal.type === 'bank_account' ? (
                            <Building className="h-4 w-4" />
                          ) : (
                            <Banknote className="h-4 w-4" />
                          )}
                          {withdrawal.type === 'bank_account' ? 'Cuenta Bancaria' : 'Criptomoneda'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(withdrawal.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(withdrawal.requestedAt).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(withdrawal)}
                          >
                            Ver Detalles
                          </Button>
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAction(withdrawal, 'approve')}
                              >
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleAction(withdrawal, 'reject')}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(withdrawal, 'process')}
                            >
                              Marcar Procesado
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  
                  <span className="px-4 py-2 text-sm">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud de Retiro</DialogTitle>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-6">
              {/* Información del usuario */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Usuario
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span> {selectedWithdrawal.user.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedWithdrawal.user.email}
                  </div>
                  <div>
                    <span className="font-medium">Usuario:</span> @{selectedWithdrawal.user.username}
                  </div>
                </div>
              </div>

              {/* Información del retiro */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Información del Retiro
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Monto:</span> ${selectedWithdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {selectedWithdrawal.type === 'bank_account' ? 'Cuenta Bancaria' : 'Criptomoneda'}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                  <div>
                    <span className="font-medium">Fecha Solicitud:</span> {new Date(selectedWithdrawal.requestedAt).toLocaleString('es-CO')}
                  </div>
                  {selectedWithdrawal.processedAt && (
                    <div>
                      <span className="font-medium">Fecha Procesado:</span> {new Date(selectedWithdrawal.processedAt).toLocaleString('es-CO')}
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles específicos del tipo */}
              {selectedWithdrawal.type === 'bank_account' && selectedWithdrawal.bankDetails && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Datos Bancarios
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Banco:</span> {selectedWithdrawal.bankDetails.bankName}
                    </div>
                    <div>
                      <span className="font-medium">Tipo de Cuenta:</span> {selectedWithdrawal.bankDetails.accountType}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Número de Cuenta:</span> {selectedWithdrawal.bankDetails.accountNumber}
                    </div>
                    <div>
                      <span className="font-medium">Ciudad:</span> {selectedWithdrawal.bankDetails.city}
                    </div>
                  </div>
                </div>
              )}

              {selectedWithdrawal.type === 'crypto' && selectedWithdrawal.cryptoDetails && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Datos de Criptomoneda
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Criptomoneda:</span> {selectedWithdrawal.cryptoDetails.cryptoType}
                    </div>
                    <div>
                      <span className="font-medium">Red:</span> {selectedWithdrawal.cryptoDetails.networkType}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Dirección de Wallet:</span>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                        {selectedWithdrawal.cryptoDetails.walletAddress}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas del administrador */}
              {selectedWithdrawal.adminNotes && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Notas del Administrador
                  </h3>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedWithdrawal.adminNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de acción */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getActionButtonText(actionType)} Solicitud de Retiro
            </DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <>
                  Solicitud de {selectedWithdrawal.user.name} por ${selectedWithdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Notas del Administrador {actionType === 'reject' ? '(Requerido)' : '(Opcional)'}</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ingresa notas sobre esta decisión..."
                rows={3}
              />
            </div>
            
            {actionType === 'reject' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Atención:</p>
                  <p>Al rechazar esta solicitud, el monto será devuelto al saldo del usuario.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              Cancelar
            </Button>
            <Button
              variant={getActionButtonVariant(actionType) as any}
              onClick={handleProcessAction}
              disabled={isProcessing || (actionType === 'reject' && !adminNotes.trim())}
            >
              {isProcessing ? 'Procesando...' : getActionButtonText(actionType)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 