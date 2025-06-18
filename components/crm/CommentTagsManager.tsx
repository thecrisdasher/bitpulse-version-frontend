"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tag,
  Plus,
  Edit,
  Trash2,
  Palette
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CommentTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const CommentTagsManager: React.FC = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<CommentTag[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<CommentTag | null>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  // Cargar etiquetas
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/comment-tags', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      } else {
        throw new Error('Error al cargar etiquetas');
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Error al cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('El nombre de la etiqueta es requerido');
        return;
      }

      const response = await fetch('/api/crm/comment-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setTags(prev => [...prev, data.tag]);
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          color: '#3B82F6',
          description: ''
        });
        toast.success('Etiqueta creada exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la etiqueta');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/crm/comment-tags?id=${tagId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        toast.success('Etiqueta eliminada exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la etiqueta');
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      description: ''
    });
    setIsCreateDialogOpen(true);
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando etiquetas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Etiquetas de Comentarios</h2>
        </div>
        
        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Etiqueta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Etiqueta</DialogTitle>
                <DialogDescription>
                  Crea una nueva etiqueta para categorizar comentarios de clientes.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Nombre de la etiqueta"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción de la etiqueta"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="space-y-3">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge style={{ backgroundColor: formData.color }} className="text-white">
                        {formData.name || 'Etiqueta'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Vista previa</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTag}>
                  Crear Etiqueta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de etiquetas */}
      <div className="grid gap-4">
        {tags.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay etiquetas creadas</p>
              {isAdmin && (
                <Button variant="link" onClick={openCreateDialog} className="mt-2">
                  Crear la primera etiqueta
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(tag => (
              <Card key={tag.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge style={{ backgroundColor: tag.color }} className="text-white">
                          {tag.name}
                        </Badge>
                      </div>
                      
                      {tag.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {tag.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Creada el {new Date(tag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center space-x-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar etiqueta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La etiqueta será eliminada permanentemente
                                y se removerá de todos los comentarios que la usen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTag(tag.id)}
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
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre las Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Las etiquetas permiten categorizar y filtrar comentarios de clientes</p>
            <p>• Solo los administradores pueden crear y eliminar etiquetas</p>
            <p>• Los maestros y administradores pueden usar las etiquetas en sus comentarios</p>
            <p>• Puedes usar múltiples etiquetas en un mismo comentario</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentTagsManager; 