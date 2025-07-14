"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Tag,
  User,
  Calendar,
  Lock,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  DollarSign,
  Clock,
  Users,
  UserCheck,
  Activity,
  Settings,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CommentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface ClientInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  profilePicture?: string | null;
  pejecoins: number;
  lastLogin?: Date | null;
  createdAt: Date;
  isActive: boolean;
}

interface ClientComment {
  id: string;
  clientId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  client: ClientInfo;
  author: ClientInfo & { role: string };
  tags: CommentTag[];
}

interface ClientCardsManagerProps {
  className?: string;
}

const ClientCardsManager: React.FC<ClientCardsManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [tags, setTags] = useState<CommentTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para formulario de comentario
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({
    content: '',
    tagIds: [] as string[],
    isPrivate: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar comentarios cuando se selecciona un cliente
  useEffect(() => {
    if (selectedClient) {
      loadClientComments(selectedClient.id);
    }
  }, [selectedClient]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar clientes
      const clientsResponse = await fetch('/api/crm/assigned-clients', {
        credentials: 'include'
      });
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData.clients || []);
      } else {
        throw new Error('Error al cargar clientes');
      }
      
      // Cargar etiquetas
      const tagsResponse = await fetch('/api/crm/comment-tags', {
        credentials: 'include'
      });
      
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData.tags || []);
      } else {
        console.warn('Error al cargar etiquetas');
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadClientComments = async (clientId: string) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/crm/client-comments?clientId=${clientId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        throw new Error('Error al cargar comentarios');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Error al cargar los comentarios');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreateComment = async () => {
    try {
      if (!formData.content.trim()) {
        toast.error('El contenido del comentario es requerido');
        return;
      }

      if (!selectedClientId) {
        toast.error('Debes seleccionar un cliente');
        return;
      }

      const response = await fetch('/api/crm/client-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          clientId: selectedClientId,
          content: formData.content,
          tagIds: formData.tagIds,
          isPrivate: formData.isPrivate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setIsCreateDialogOpen(false);
        setFormData({
          content: '',
          tagIds: [],
          isPrivate: false
        });
        toast.success('Comentario creado exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el comentario');
    }
  };

  const handleCardClick = (client: ClientInfo) => {
    window.open(`/crm/comentarios?clientId=${client.id}`, '_blank');
  };

  // Abrir automáticamente el modal si la URL contiene ?clientId=...
  useEffect(() => {
    if (preselectedClientId && clients.length > 0) {
      const found = clients.find(c => c.id === preselectedClientId);
      if (found) {
        setSelectedClient(found);
        setIsClientModalOpen(true);
      }
    }
  }, [preselectedClientId, clients]);

  const handleNavigateToOperations = (clientId: string) => {
    // Navegar a la página de operaciones del cliente
    if (user?.role === 'admin') {
      router.push(`/admin/operaciones?clientId=${clientId}`);
    } else {
      router.push(`/maestro/operaciones?clientId=${clientId}`);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isRecentlyOnline = (lastLogin: Date | null | undefined) => {
    if (!lastLogin) return false;
    const now = new Date();
    const loginTime = new Date(lastLogin);
    const diffMinutes = (now.getTime() - loginTime.getTime()) / (1000 * 60);
    return diffMinutes <= 30; // Consideramos "online" si el último login fue hace menos de 30 minutos
  };

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    const phone = client.phone?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
  });

  const canManageComments = user?.role === 'admin' || user?.role === 'maestro';

  if (loading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Clientes</h2>
          <Badge variant="secondary">{filteredClients.length}</Badge>
        </div>
        
        {canManageComments && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Comentario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Comentario</DialogTitle>
                <DialogDescription>
                  Agrega un comentario sobre el progreso o estado del cliente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-select">Cliente</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName} - {client.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content">Comentario</Label>
                  <Textarea
                    id="content"
                    placeholder="Escribe tu comentario aquí..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Etiquetas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer hover:opacity-80",
                          formData.tagIds.includes(tag.id) && "text-white"
                        )}
                        style={formData.tagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            tagIds: prev.tagIds.includes(tag.id) 
                              ? prev.tagIds.filter(id => id !== tag.id)
                              : [...prev.tagIds, tag.id]
                          }));
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="private"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isPrivate: checked as boolean }))
                      }
                    />
                    <label htmlFor="private" className="text-sm font-medium">
                      Comentario privado (solo admins)
                    </label>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateComment}>
                  Crear Comentario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de clientes en tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay clientes para mostrar</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredClients.map(client => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 min-h-[160px] flex flex-col"
                onClick={() => handleCardClick(client)}
              >
                {/* Tarjeta con información completa */}
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.profilePicture || undefined} />
                        <AvatarFallback className="text-sm">
                          {getInitials(client.firstName, client.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      {isRecentlyOnline(client.lastLogin) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-1 mb-1">
                        {client.firstName} {client.lastName}
                        {client.isActive && <UserCheck className="h-3 w-3 text-green-500 flex-shrink-0" />}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-3 mt-auto">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs px-2">
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {isRecentlyOnline(client.lastLogin) && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        En línea
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de información del cliente */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedClient.profilePicture || undefined} />
                      <AvatarFallback>
                        {getInitials(selectedClient.firstName, selectedClient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    {isRecentlyOnline(selectedClient.lastLogin) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedClient.firstName} {selectedClient.lastName}
                      {selectedClient.isActive && <UserCheck className="h-5 w-5 text-green-500 inline ml-2" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Información del cliente */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                        </div>
                      </div>
                      
                      {selectedClient.phone && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Teléfono</p>
                            <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Saldo</p>
                          <p className="text-sm text-muted-foreground">${selectedClient.pejecoins.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Fecha de Registro</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedClient.createdAt)}</p>
                        </div>
                      </div>
                      
                      {selectedClient.lastLogin && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Último Acceso</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(selectedClient.lastLogin)}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex gap-2">
                          <Badge variant={selectedClient.isActive ? "default" : "secondary"}>
                            {selectedClient.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          {isRecentlyOnline(selectedClient.lastLogin) && (
                            <Badge variant="outline" className="text-green-600">
                              En línea
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => handleNavigateToOperations(selectedClient.id)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ver Operaciones
                    </Button>
                    {canManageComments && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedClientId(selectedClient.id);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Comentario
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comentarios */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comentarios
                    </h4>
                  </div>
                  
                  {loadingComments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-3">Cargando comentarios...</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {comments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No hay comentarios aún</p>
                        </div>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="bg-muted p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.author.profilePicture || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(comment.author.firstName, comment.author.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-sm font-medium">
                                    {comment.author.firstName} {comment.author.lastName}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {comment.author.role}
                                    </Badge>
                                    {comment.isPrivate && (
                                      <Badge variant="outline" className="text-xs text-red-600">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Privado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm mb-3">{comment.content}</p>
                            
                            {comment.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {comment.tags.map(tag => (
                                  <Badge
                                    key={tag.id}
                                    className="text-xs text-white"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientCardsManager; 