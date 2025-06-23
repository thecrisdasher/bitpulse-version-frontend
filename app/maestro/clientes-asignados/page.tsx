'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useChat, ChatProvider } from '@/contexts/ChatContext'
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
  Users,
  Search,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  UserCheck,
  Eye,
  RefreshCw,
  Crown,
  Bell
} from 'lucide-react'

// Tipos
interface AssignedClient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  profilePicture?: string
  createdAt: string
  lastLogin?: string
  isOnline: boolean
  assignedAt: string
  unreadMessages: number
  hasActiveChat: boolean
  totalPositions: number
  totalPejecoins: number
}

function MaestroClientesAsignadosPageContent() {
  const { user, hasRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { findOrCreatePrivateRoom, setCurrentRoom, joinRoom } = useChat()
  
  const [clients, setClients] = useState<AssignedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<AssignedClient | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Verificar permisos
  useEffect(() => {
    if (user && !hasRole('maestro')) {
      router.push('/')
      return
    }
  }, [user, hasRole, router])

  // Cargar datos
  useEffect(() => {
    if (user && hasRole('maestro')) {
      loadAssignedClients()
    }
  }, [user, hasRole])

  const loadAssignedClients = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await fetch('/api/maestro/assigned-clients', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        setClients(result.clients || [])
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al cargar los clientes asignados",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading assigned clients:', error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar los clientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleChatWithClient = async (clientId: string) => {
    try {
      // Intentar encontrar o crear la sala de chat
      const room = await findOrCreatePrivateRoom(clientId)
      
      if (room) {
        // Si se encontró o creó la sala, navegar al chat y seleccionarla
        setCurrentRoom(room)
        joinRoom(room.id)
        router.push(`/chat?roomId=${room.id}`)
      } else {
        // Fallback a la redirección original
        router.push(`/chat?participant=${clientId}`)
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      // Fallback a la redirección original
      router.push(`/chat?participant=${clientId}`)
    }
  }

  const handleViewClientDetails = (client: AssignedClient) => {
    setSelectedClient(client)
    setIsDetailDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short'
    }).format(date)
  }

  const getLastSeenText = (lastLogin?: string, isOnline?: boolean) => {
    if (isOnline) return 'En línea ahora'
    if (!lastLogin) return 'Nunca se ha conectado'
    
    const now = new Date()
    const lastLoginDate = new Date(lastLogin)
    const diffInHours = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace menos de una hora'
    if (diffInHours < 24) return `Hace ${diffInHours} horas`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays} días`
  }

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Estadísticas
  const stats = {
    totalClients: clients.length,
    onlineClients: clients.filter(c => c.isOnline).length,
    clientsWithUnreadMessages: clients.filter(c => c.unreadMessages > 0).length,
    totalUnreadMessages: clients.reduce((sum, c) => sum + c.unreadMessages, 0)
  }

  if (user?.role !== 'maestro') {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-primary" />
              Mis Clientes Asignados
            </h1>
            <p className="text-muted-foreground">
              Gestiona y comunícate con tus clientes asignados
            </p>
          </div>
          <Button 
            onClick={() => loadAssignedClients(true)} 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wifi className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.onlineClients}</p>
                  <p className="text-sm text-muted-foreground">En Línea</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.clientsWithUnreadMessages}</p>
                  <p className="text-sm text-muted-foreground">Con Mensajes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.totalUnreadMessages}</p>
                  <p className="text-sm text-muted-foreground">Mensajes Sin Leer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Clientes Asignados ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Cargando clientes...</span>
                </div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  {searchTerm ? 'No se encontraron clientes con esos criterios' : 'No tienes clientes asignados'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Contacta al administrador para que te asigne clientes
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div key={client.id} className="group relative p-5 border rounded-xl hover:shadow-lg transition-all duration-200 hover:border-primary/30 bg-card">
                    <div className="flex items-center justify-between">
                      {/* Información del Cliente */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                            <AvatarImage src={client.profilePicture} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium text-lg">
                              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Indicador de estado online */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                            client.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {client.firstName} {client.lastName}
                            </h3>
                            {client.isOnline && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                <Wifi className="w-3 h-3 mr-1" />
                                En línea
                              </Badge>
                            )}
                            {client.unreadMessages > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {client.unreadMessages} nuevo{client.unreadMessages > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="break-all">{client.email}</span>
                            </div>
                            
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{client.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Registro: {formatDateShort(client.createdAt)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{getLastSeenText(client.lastLogin, client.isOnline)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewClientDetails(client)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detalles
                        </Button>
                        
                        <Button 
                          onClick={() => handleChatWithClient(client.id)}
                          className="gap-2 bg-primary hover:bg-primary/90"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 pt-3 border-t border-muted/30">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Asignado el {formatDateShort(client.assignedAt)}</span>
                        <div className="flex items-center gap-4">
                          <span>{client.totalPositions} posiciones</span>
                          <span>{client.totalPejecoins.toLocaleString()} PejeCoins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalles del Cliente */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Detalles del Cliente
            </DialogTitle>
            <DialogDescription>
              Información detallada del cliente asignado
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              {/* Información Personal */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  Información Personal
                </h4>
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={selectedClient.profilePicture} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium text-xl">
                      {selectedClient.firstName.charAt(0)}{selectedClient.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h5 className="font-semibold text-lg">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </h5>
                    <div className="space-y-1 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedClient.email}</span>
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={selectedClient.isOnline ? "default" : "secondary"} className="mb-2">
                      {selectedClient.isOnline ? (
                        <>
                          <Wifi className="w-3 h-3 mr-1" />
                          En línea
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información de Actividad */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  Actividad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Fecha de registro:</span>
                    </div>
                    <p className="font-medium mt-1">{formatDate(selectedClient.createdAt)}</p>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Última conexión:</span>
                    </div>
                    <p className="font-medium mt-1">
                      {selectedClient.lastLogin ? formatDate(selectedClient.lastLogin) : 'Nunca se ha conectado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Asignación */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4 text-primary" />
                  Información de Asignación
                </h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{selectedClient.totalPositions}</p>
                      <p className="text-sm text-muted-foreground">Posiciones Totales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedClient.totalPejecoins.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">PejeCoins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedClient.unreadMessages}</p>
                      <p className="text-sm text-muted-foreground">Mensajes Sin Leer</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Asignado el {formatDate(selectedClient.assignedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedClient && (
              <Button onClick={() => {
                setIsDetailDialogOpen(false)
                handleChatWithClient(selectedClient.id)
              }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ir al Chat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MaestroClientesAsignadosPage() {
  return (
    <ChatProvider>
      <MaestroClientesAsignadosPageContent />
    </ChatProvider>
  )
} 