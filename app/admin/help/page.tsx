"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  HelpCircle, 
  Book, 
  Video, 
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Search,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";

interface HelpCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  _count: {
    faqs: number;
    guides: number;
    videos: number;
    resources: number;
  };
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  status: string;
  views: number;
  isHelpful: number;
  notHelpful: number;
  tags: string[];
  createdAt: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  content: string;
  level: string;
  duration?: string;
  views: number;
  likes: number;
  tags: string[];
  topics: string[];
  category: HelpCategory;
  status: string;
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  duration?: string;
  views: number;
  likes: number;
  tags: string[];
  category: HelpCategory;
  status: string;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  downloads: number;
  tags: string[];
  category: HelpCategory;
  status: string;
  createdAt: string;
}

const HelpAdminPage = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de datos
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // Estados de formularios
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);

  // Estados de diálogos de edición
  const [editingCategoryDialog, setEditingCategoryDialog] = useState(false);
  const [editingFaqDialog, setEditingFaqDialog] = useState(false);
  const [editingGuideDialog, setEditingGuideDialog] = useState(false);
  const [editingVideoDialog, setEditingVideoDialog] = useState(false);
  const [editingResourceDialog, setEditingResourceDialog] = useState(false);
  
  // Estados de edición
  const [editingCategory, setEditingCategory] = useState<HelpCategory | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { user, hasRole } = useAuth();

  // Cargar datos - Mover useEffect antes del return condicional
  useEffect(() => {
    if (hasRole('admin')) {
      loadAllData();
    }
  }, [hasRole]);

  // Verificar permisos
  if (!hasRole('admin')) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>No tienes permiso para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const loadAllData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [categoriesRes, faqsRes, guidesRes, videosRes, resourcesRes] = await Promise.all([
        fetch('/api/help/categories?includeInactive=true'),
        fetch('/api/help/faq'),
        fetch('/api/help/guides'),
        fetch('/api/help/videos'),
        fetch('/api/help/resources')
      ]);

      const [categoriesData, faqsData, guidesData, videosData, resourcesData] = await Promise.all([
        categoriesRes.json(),
        faqsRes.json(),
        guidesRes.json(),
        videosRes.json(),
        resourcesRes.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data);
      if (faqsData.success) setFaqs(faqsData.data);
      if (guidesData.success) setGuides(guidesData.data);
      if (videosData.success) setVideos(videosData.data);
      if (resourcesData.success) setResources(resourcesData.data);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para crear categoría
  const createCategory = async (data: any) => {
    try {
      const response = await fetch('/api/help/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setShowCategoryForm(false);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al crear la categoría');
    }
  };

  // Función para actualizar categoría
  const updateCategory = async (data: any) => {
    try {
      const response = await fetch('/api/help/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setEditingCategory(null);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar la categoría');
    }
  };

  // Función para eliminar categoría
  const deleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const response = await fetch(`/api/help/categories?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al eliminar la categoría');
    }
  };

  // Función para crear FAQ
  const createFaq = async (data: any) => {
    try {
      const response = await fetch('/api/help/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('FAQ creada exitosamente');
        setShowFaqForm(false);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al crear la FAQ');
    }
  };

  const updateFaq = async (data: any) => {
    try {
      const response = await fetch('/api/help/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('FAQ actualizada exitosamente');
        setEditingFaq(null);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar la FAQ');
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta FAQ?')) return;

    try {
      const response = await fetch(`/api/help/faq?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('FAQ eliminada exitosamente');
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al eliminar la FAQ');
    }
  };

  // Funciones para videos
  const createVideo = async (data: any) => {
    try {
      const response = await fetch('/api/help/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Video creado exitosamente');
        setShowVideoForm(false);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al crear el video');
    }
  };

  const updateVideo = async (data: any) => {
    try {
      const response = await fetch('/api/help/videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Video actualizado exitosamente');
        setEditingVideo(null);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar el video');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;

    try {
      const response = await fetch(`/api/help/videos?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Video eliminado exitosamente');
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al eliminar el video');
    }
  };

  // Funciones para recursos
  const createResource = async (data: any) => {
    try {
      const response = await fetch('/api/help/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Recurso creado exitosamente');
        setShowResourceForm(false);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al crear el recurso');
    }
  };

  const updateResource = async (data: any) => {
    try {
      const response = await fetch('/api/help/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Recurso actualizado exitosamente');
        setEditingResource(null);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar el recurso');
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    try {
      const response = await fetch(`/api/help/resources?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Recurso eliminado exitosamente');
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al eliminar el recurso');
    }
  };

  const createGuide = async (data: any) => {
    try {
      const response = await fetch('/api/help/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Guía creada exitosamente');
        setShowGuideForm(false);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al crear la guía');
    }
  };

  const updateGuide = async (data: any) => {
    try {
      const response = await fetch('/api/help/guides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Guía actualizada exitosamente');
        setEditingGuide(null);
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al actualizar la guía');
    }
  };

  const deleteGuide = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta guía?')) return;

    try {
      const response = await fetch(`/api/help/guides?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Guía eliminada exitosamente');
        loadAllData(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al eliminar la guía');
    }
  };

  // Filtrar datos por búsqueda
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    guide.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.fileType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const updateFaqFeedback = async (id: string, action: 'view' | 'helpful' | 'not_helpful') => {
    try {
      const response = await fetch(`/api/help/faq?id=${id}&action=${action}`, {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.success) {
        // Actualizar el estado local
        setFaqs(faqs.map(faq => 
          faq.id === id ? result.data : faq
        ));
      }
    } catch (error) {
      console.error('Error updating FAQ feedback:', error);
      toast.error('Error al actualizar la retroalimentación');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Settings className="w-8 h-8 text-primary" />
                  Gestión de Ayuda
                </h1>
                <p className="text-muted-foreground">
                  Administra el contenido del centro de ayuda
                </p>
              </div>
              <Button
                onClick={() => loadAllData(true)}
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </motion.div>

          {/* Estadísticas generales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HelpCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">FAQs</p>
                    <p className="text-2xl font-bold">{faqs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Book className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Guías</p>
                    <p className="text-2xl font-bold">{guides.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Video className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Videos</p>
                    <p className="text-2xl font-bold">{videos.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Download className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recursos</p>
                    <p className="text-2xl font-bold">{resources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Búsqueda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Tabs de contenido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="categories">Categorías</TabsTrigger>
                <TabsTrigger value="faq">FAQs</TabsTrigger>
                <TabsTrigger value="guides">Guías</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="resources">Recursos</TabsTrigger>
              </TabsList>

              {/* Tab Categorías */}
              <TabsContent value="categories" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Categorías ({filteredCategories.length})</h2>
                  <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Categoría
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Categoría</DialogTitle>
                      </DialogHeader>
                      <CategoryForm
                        category={null}
                        categories={categories}
                        onSubmit={createCategory}
                        onCancel={() => setShowCategoryForm(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Orden</TableHead>
                          <TableHead>Contenido</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{category.description}</TableCell>
                            <TableCell>
                              <Badge variant={category.isActive ? "default" : "secondary"}>
                                {category.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell>{category.sortOrder}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Badge variant="outline">FAQs: {category._count.faqs}</Badge>
                                <Badge variant="outline">Guías: {category._count.guides}</Badge>
                                <Badge variant="outline">Videos: {category._count.videos}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteCategory(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab FAQs */}
              <TabsContent value="faq">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>FAQs ({filteredFaqs.length})</CardTitle>
                    <Dialog open={showFaqForm} onOpenChange={setShowFaqForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva FAQ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Crear Nueva FAQ</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <FaqForm
                            faq={null}
                            categories={categories}
                            onSubmit={createFaq}
                            onCancel={() => setShowFaqForm(false)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pregunta</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Vistas</TableHead>
                          <TableHead>Utilidad</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFaqs.map((faq) => (
                          <TableRow key={faq.id}>
                            <TableCell>{faq.question}</TableCell>
                            <TableCell>{faq.category.name}</TableCell>
                            <TableCell>
                              <Badge>{faq.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{faq.views}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateFaqFeedback(faq.id, 'view')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateFaqFeedback(faq.id, 'helpful')}
                                  >
                                    👍
                                  </Button>
                                  <span>{faq.isHelpful}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateFaqFeedback(faq.id, 'not_helpful')}
                                  >
                                    👎
                                  </Button>
                                  <span>{faq.notHelpful}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingFaq(faq)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteFaq(faq.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Guías */}
              <TabsContent value="guides">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Guías ({filteredGuides.length})</CardTitle>
                    <Dialog open={showGuideForm} onOpenChange={setShowGuideForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Guía
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Crear Nueva Guía</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <GuideForm
                            guide={null}
                            categories={categories}
                            onSubmit={createGuide}
                            onCancel={() => setShowGuideForm(false)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Vistas</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGuides.map((guide) => (
                          <TableRow key={guide.id}>
                            <TableCell>{guide.title}</TableCell>
                            <TableCell>{guide.category.name}</TableCell>
                            <TableCell>
                              <Badge>{guide.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{guide.level}</Badge>
                            </TableCell>
                            <TableCell>{guide.views}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingGuide(guide)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteGuide(guide.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Videos */}
              <TabsContent value="videos">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Videos ({filteredVideos.length})</CardTitle>
                    <Dialog open={showVideoForm} onOpenChange={setShowVideoForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Video
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Video</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <VideoForm
                            video={null}
                            categories={categories}
                            onSubmit={createVideo}
                            onCancel={() => setShowVideoForm(false)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Vistas</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVideos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>{video.title}</TableCell>
                            <TableCell>{video.category.name}</TableCell>
                            <TableCell>
                              <Badge>{video.status}</Badge>
                            </TableCell>
                            <TableCell>{video.duration}</TableCell>
                            <TableCell>{video.views}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingVideo(video)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteVideo(video.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Recursos */}
              <TabsContent value="resources">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recursos ({filteredResources.length})</CardTitle>
                    <Dialog open={showResourceForm} onOpenChange={setShowResourceForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Recurso
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Recurso</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <ResourceForm
                            resource={null}
                            categories={categories}
                            onSubmit={createResource}
                            onCancel={() => setShowResourceForm(false)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Descargas</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.title}</TableCell>
                            <TableCell>{resource.category.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{resource.fileType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{resource.status}</Badge>
                            </TableCell>
                            <TableCell>{resource.downloads}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingResource(resource)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteResource(resource.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Dialogs de edición */}
          {editingCategory && (
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Categoría</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  category={editingCategory}
                  categories={categories}
                  onSubmit={updateCategory}
                  onCancel={() => setEditingCategory(null)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Diálogo de edición de video */}
          <Dialog open={editingVideo !== null} onOpenChange={(open) => !open && setEditingVideo(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <VideoForm
                  video={editingVideo}
                  categories={categories}
                  onSubmit={updateVideo}
                  onCancel={() => setEditingVideo(null)}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de edición de recurso */}
          <Dialog open={editingResource !== null} onOpenChange={(open) => !open && setEditingResource(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Recurso</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <ResourceForm
                  resource={editingResource}
                  categories={categories}
                  onSubmit={updateResource}
                  onCancel={() => setEditingResource(null)}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de edición de FAQ */}
          <Dialog open={editingFaq !== null} onOpenChange={(open) => !open && setEditingFaq(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar FAQ</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <FaqForm
                  faq={editingFaq}
                  categories={categories}
                  onSubmit={updateFaq}
                  onCancel={() => setEditingFaq(null)}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de edición de Guía */}
          <Dialog open={editingGuide !== null} onOpenChange={(open) => !open && setEditingGuide(null)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Guía</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <GuideForm
                  guide={editingGuide}
                  categories={categories}
                  onSubmit={updateGuide}
                  onCancel={() => setEditingGuide(null)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

// Componente de formulario para categorías
const CategoryForm = ({ category, categories, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    sortOrder: category?.sortOrder || 0,
    isActive: category?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = category ? { ...formData, id: category.id } : formData;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Icono (clase CSS)</label>
        <Input
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="lucide-help-circle"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Orden</label>
        <Input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <label className="text-sm font-medium">Activa</label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {category ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

// Componente de formulario para FAQs
const FaqForm = ({ faq, categories, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    categoryId: faq?.categoryId || '',
    tags: faq?.tags?.join(', ') || '',
    status: faq?.status || 'published',
    isHighlighted: faq?.isHighlighted || false,
    difficulty: faq?.difficulty || 'basic'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      ...(faq && { id: faq.id })
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Pregunta</label>
          <Input
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Ej: ¿Cómo puedo empezar a operar en la plataforma?"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Respuesta</label>
          <Textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Proporciona una respuesta clara y detallada..."
            required
            className="min-h-[150px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: HelpCategory) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dificultad</label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la dificultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (separados por comas)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ej: trading, principiante, configuración"
          />
          <p className="text-sm text-muted-foreground">Añade palabras clave para mejorar la búsqueda</p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isHighlighted"
            checked={formData.isHighlighted}
            onCheckedChange={(checked: boolean) => setFormData({ ...formData, isHighlighted: checked })}
          />
          <label htmlFor="isHighlighted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Destacar esta FAQ
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {faq ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

const GuideForm = ({ guide, categories, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: guide?.title || '',
    description: guide?.description || '',
    content: guide?.content || '',
    categoryId: guide?.categoryId || '',
    level: guide?.level || 'basic',
    duration: guide?.duration || '',
    tags: guide?.tags?.join(', ') || '',
    topics: guide?.topics?.join(', ') || '',
    status: guide?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      topics: formData.topics.split(',').map((topic: string) => topic.trim()).filter(Boolean),
      ...(guide && { id: guide.id })
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Guía básica de trading"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Breve descripción de la guía..."
            required
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Contenido</label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Contenido detallado de la guía. Puedes usar Markdown para el formato."
            required
            className="min-h-[200px] font-mono"
          />
          <p className="text-sm text-muted-foreground">Usa Markdown para dar formato al contenido</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: HelpCategory) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nivel</label>
            <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Duración estimada</label>
            <Input
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Ej: 15 minutos"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="review">En revisión</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (separados por comas)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ej: análisis técnico, trading, gráficos"
          />
          <p className="text-sm text-muted-foreground">Palabras clave para mejorar la búsqueda</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Temas cubiertos (separados por comas)</label>
          <Input
            value={formData.topics}
            onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
            placeholder="Ej: velas japonesas, indicadores, patrones"
          />
          <p className="text-sm text-muted-foreground">Lista de temas específicos que cubre la guía</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {guide ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

const VideoForm = ({ video, categories, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    videoUrl: video?.videoUrl || '',
    thumbnail: video?.thumbnail || '',
    duration: video?.duration || '',
    categoryId: video?.categoryId || '',
    tags: video?.tags?.join(', ') || '',
    status: video?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      ...(video && { id: video.id })
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Tutorial de configuración de gráficos"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el contenido del video..."
            required
            className="h-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL del Video</label>
            <Input
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="URL de YouTube/Vimeo"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duración</label>
            <Input
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="Ej: 5:30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL de la Miniatura</label>
          <Input
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            placeholder="URL de la imagen de vista previa"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: HelpCategory) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (separados por comas)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ej: tutorial, configuración, básico"
          />
          <p className="text-sm text-muted-foreground">Palabras clave para mejorar la búsqueda</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {video ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

const ResourceForm = ({ resource, categories, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    fileUrl: resource?.fileUrl || '',
    fileName: resource?.fileName || '',
    fileType: resource?.fileType || '',
    categoryId: resource?.categoryId || '',
    tags: resource?.tags?.join(', ') || '',
    status: resource?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      ...(resource && { id: resource.id })
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Plantilla de análisis de operaciones"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el contenido y utilidad del recurso..."
            required
            className="h-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL del Archivo</label>
            <Input
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="URL del archivo para descargar"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Archivo</label>
            <Input
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              placeholder="Ej: plantilla-analisis-v1.xlsx"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Archivo</label>
            <Select value={formData.fileType} onValueChange={(value) => setFormData({ ...formData, fileType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (separados por comas)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ej: plantilla, excel, análisis"
          />
          <p className="text-sm text-muted-foreground">Palabras clave para mejorar la búsqueda</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {resource ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

export default HelpAdminPage; 