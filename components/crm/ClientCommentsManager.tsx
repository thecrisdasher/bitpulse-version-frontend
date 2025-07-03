"use client";

import React, { useState, useEffect } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CommentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
}

interface ClientComment {
  id: string;
  clientId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  client: User;
  author: User;
  tags: CommentTag[];
}

interface ClientCommentsManagerProps {
  clientId?: string;
  showClientSelector?: boolean;
}

const ClientCommentsManager: React.FC<ClientCommentsManagerProps> = ({
  clientId,
  showClientSelector = false
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [tags, setTags] = useState<CommentTag[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>(clientId || 'all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Estados para formularios
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<ClientComment | null>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    clientId: clientId || '',
    content: '',
    tagIds: [] as string[],
    isPrivate: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar comentarios cuando cambie el filtro de cliente
  useEffect(() => {
    if (selectedClient && selectedClient !== 'all') {
      loadComments();
    } else if (selectedClient === 'all') {
      loadComments();
    }
  }, [selectedClient]);

  // Inicializar formData.clientId cuando se abra el diálogo de creación
  useEffect(() => {
    if (isCreateDialogOpen && !showClientSelector && clientId) {
      setFormData(prev => ({ ...prev, clientId }));
    }
  }, [isCreateDialogOpen, clientId, showClientSelector]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar etiquetas
      const tagsResponse = await fetch('/api/crm/comment-tags', {
        credentials: 'include'
      });
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData.tags || []);
      } else {
        const errorData = await tagsResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Tags API Error:', tagsResponse.status, errorData);
        toast.error(`Error cargando etiquetas: ${errorData.error}`);
      }

      // Cargar clientes si es necesario
      if (showClientSelector) {
        const clientsResponse = await fetch('/api/crm/assigned-clients', {
          credentials: 'include'
        });
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData.clients || []);
        } else {
          const errorData = await clientsResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Clients API Error:', clientsResponse.status, errorData);
          toast.error(`Error cargando clientes: ${errorData.error}`);
        }
      }

      // Cargar comentarios si hay un cliente seleccionado
      if (selectedClient) {
        await loadComments();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const url = selectedClient && selectedClient !== 'all'
        ? `/api/crm/client-comments?clientId=${selectedClient}`
        : '/api/crm/client-comments';
        
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error al cargar comentarios'}`);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar los comentarios');
    }
  };

  const handleCreateComment = async () => {
    try {
      if (!formData.content.trim()) {
        toast.error('El contenido del comentario es requerido');
        return;
      }

      // Validar clientId cuando showClientSelector es true
      if (showClientSelector && (!formData.clientId || formData.clientId === 'all')) {
        toast.error('Debes seleccionar un cliente válido');
        return;
      }

      // Asegurar que tengamos un clientId válido
      const finalClientId = formData.clientId || clientId || (selectedClient !== 'all' ? selectedClient : '');
      if (!finalClientId) {
        toast.error('No se pudo determinar el cliente para el comentario');
        return;
      }

      const response = await fetch('/api/crm/client-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          clientId: finalClientId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setIsCreateDialogOpen(false);
        setFormData({
          clientId: clientId || '',
          content: '',
          tagIds: [],
          isPrivate: false
        });
        setClientSearchTerm(''); // Limpiar filtro de búsqueda
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

  const handleEditComment = async () => {
    try {
      if (!editingComment || !formData.content.trim()) {
        toast.error('El contenido del comentario es requerido');
        return;
      }

      const response = await fetch(`/api/crm/client-comments/${editingComment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: formData.content,
          tagIds: formData.tagIds,
          isPrivate: formData.isPrivate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(c => c.id === editingComment.id ? data.comment : c));
        setIsEditDialogOpen(false);
        setEditingComment(null);
        setFormData({
          clientId: clientId || '',
          content: '',
          tagIds: [],
          isPrivate: false
        });
        toast.success('Comentario actualizado exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el comentario');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/crm/client-comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comentario eliminado exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el comentario');
    }
  };

  const openEditDialog = (comment: ClientComment) => {
    setEditingComment(comment);
    setFormData({
      clientId: comment.clientId,
      content: comment.content,
      tagIds: comment.tags.map(t => t.id),
      isPrivate: comment.isPrivate
    });
    setIsEditDialogOpen(true);
  };

  // Filtrar clientes basado en el término de búsqueda
  const filteredClients = clients.filter(client => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Filtrar comentarios
  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.client.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === 'all' || !selectedTag || comment.tags.some(tag => tag.id === selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const canManageComments = user?.role === 'admin' || user?.role === 'maestro';
  const canEditDeleteComments = user?.role === 'admin';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando comentarios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Comentarios del Cliente</h2>
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
                {showClientSelector && (
                  <div>
                    <Label htmlFor="client-search">Buscar Cliente</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder="Buscar por nombre o correo..." 
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {clientSearchTerm && (
                        <button
                          onClick={() => setClientSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Label htmlFor="client-select">Cliente</Label>
                    <Select 
                      value={formData.clientId || selectedClient} 
                      onValueChange={(value) => {
                        setSelectedClient(value);
                        setFormData(prev => ({ ...prev, clientId: value !== 'all' ? value : '' }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {filteredClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                          </SelectItem>
                        ))}
                        {clientSearchTerm && filteredClients.length === 0 && (
                          <SelectItem value="no_results" disabled>
                            No se encontraron resultados
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {clientSearchTerm && filteredClients.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {filteredClients.length} resultado{filteredClients.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
                
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
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={formData.tagIds.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                tagIds: [...prev.tagIds, tag.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                tagIds: prev.tagIds.filter(id => id !== tag.id)
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <Badge style={{ backgroundColor: tag.color }} className="text-white">
                            {tag.name}
                          </Badge>
                        </label>
                      </div>
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
                    <label
                      htmlFor="private"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Comentario privado (solo admins)
                    </label>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setClientSearchTerm('');
                }}>
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en comentarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {showClientSelector && (
              <div className="w-64 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10 pr-8 h-9"
                  />
                  {clientSearchTerm && (
                    <button
                      onClick={() => setClientSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                          <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                    {(clientSearchTerm ? filteredClients : clients).map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </SelectItem>
                ))}
                    {clientSearchTerm && filteredClients.length === 0 && (
                      <SelectItem value="no_results" disabled>
                        No se encontraron clientes
                      </SelectItem>
                    )}
              </SelectContent>
            </Select>
                {clientSearchTerm && filteredClients.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {filteredClients.length} resultado{filteredClients.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las etiquetas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay comentarios para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map(comment => (
            <Card key={comment.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar>
                      <AvatarImage src={comment.author.profilePicture} />
                      <AvatarFallback>
                        {comment.author.firstName[0]}{comment.author.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <Badge variant={comment.author.role === 'admin' ? 'default' : 'secondary'}>
                          {comment.author.role}
                        </Badge>
                        {comment.isPrivate && (
                          <Badge variant="outline" className="text-red-600">
                            <Lock className="h-3 w-3 mr-1" />
                            Privado
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      
                      {comment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {comment.tags.map(tag => (
                            <Badge 
                              key={tag.id} 
                              style={{ backgroundColor: tag.color }} 
                              className="text-white text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {showClientSelector && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{comment.client.firstName} {comment.client.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canEditDeleteComments && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(comment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteComment(comment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Comentario</DialogTitle>
            <DialogDescription>
              Modifica el contenido y etiquetas del comentario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content">Comentario</Label>
              <Textarea
                id="edit-content"
                placeholder="Escribe tu comentario aquí..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            
            <div>
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-tag-${tag.id}`}
                      checked={formData.tagIds.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            tagIds: [...prev.tagIds, tag.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            tagIds: prev.tagIds.filter(id => id !== tag.id)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-tag-${tag.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <Badge style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPrivate: checked as boolean }))
                  }
                />
                <label
                  htmlFor="edit-private"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Comentario privado (solo admins)
                </label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditComment}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientCommentsManager; 