"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageSquare, 
  Video, 
  Download,
  Phone,
  Play,
  FileText,
  Eye,
  ThumbsUp,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface HelpCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
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
  views: number;
  isHelpful: number;
  notHelpful: number;
  tags: string[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  level: string;
  duration?: string;
  views: number;
  likes: number;
  tags: string[];
  topics: string[];
  category: HelpCategory;
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
}

const HelpPage = () => {
  // Estados principales
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  
  // Estados de datos
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const { user } = useAuth();

  // Cargar datos iniciales
  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      setLoading(true);
      
      const [categoriesRes, faqsRes, guidesRes, videosRes, resourcesRes] = await Promise.all([
        fetch('/api/help/categories'),
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
      console.error('Error loading help data:', error);
      toast.error('Error al cargar la información de ayuda');
    } finally {
      setLoading(false);
    }
  };

  // Incrementar vistas
  const incrementViews = async (type: string, id: string) => {
    try {
      await fetch(`/api/help/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'view' })
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  // Incrementar likes
  const incrementLikes = async (type: string, id: string) => {
    try {
      await fetch(`/api/help/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'like' })
      });
      
      // Actualizar estado local
      if (type === 'guides') {
        setGuides(prev => prev.map(g => g.id === id ? {...g, likes: g.likes + 1} : g));
      } else if (type === 'videos') {
        setVideos(prev => prev.map(v => v.id === id ? {...v, likes: v.likes + 1} : v));
      }
      
      toast.success('¡Gracias por tu feedback!');
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  };

  // Filtrar datos por búsqueda
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGuides = guides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Función para descargar recursos
  const downloadResource = async (resource: Resource) => {
    try {
      await fetch(`/api/help/resources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id, action: 'download' })
      });
      
      // Abrir archivo en nueva pestaña
      window.open(resource.fileUrl, '_blank');
      
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  // Función para verificar si el usuario ya votó en una FAQ
  const hasUserVoted = (faqId: string) => {
    const votes = JSON.parse(localStorage.getItem('faqVotes') || '{}');
    return votes[faqId];
  };

  // Función para registrar el voto del usuario
  const registerVote = (faqId: string, action: 'helpful' | 'not_helpful') => {
    const votes = JSON.parse(localStorage.getItem('faqVotes') || '{}');
    votes[faqId] = action;
    localStorage.setItem('faqVotes', JSON.stringify(votes));
  };

  const updateFaqFeedback = async (id: string, action: 'view' | 'helpful' | 'not_helpful') => {
    try {
      // Si es una acción de feedback (helpful/not_helpful), verificar si ya votó
      if (action !== 'view') {
        if (hasUserVoted(id)) {
          toast.error('Ya has votado en esta FAQ');
          return;
        }
        registerVote(id, action as 'helpful' | 'not_helpful');
      }

      const response = await fetch(`/api/help/faq?id=${id}&action=${action}`, {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.success) {
        setFaqs(faqs.map(faq => 
          faq.id === id ? result.data : faq
        ));
        if (action !== 'view') {
          toast.success('¡Gracias por tu feedback!');
        }
      }
    } catch (error) {
      console.error('Error updating FAQ feedback:', error);
      toast.error('Error al actualizar la retroalimentación');
    }
  };

  // Efecto para incrementar la vista cuando se expande una FAQ
  useEffect(() => {
    if (activeSection === 'faq') {
      faqs.forEach(faq => {
        updateFaqFeedback(faq.id, 'view');
      });
    }
  }, [activeSection]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
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
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas y aprende nuevas estrategias
        </p>
      </motion.div>

      {/* Búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en la ayuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Navegación de secciones */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'overview', label: 'Vista General', icon: HelpCircle },
          { id: 'faq', label: 'FAQ', icon: HelpCircle, count: filteredFaqs.length },
          { id: 'guides', label: 'Guías', icon: Book, count: filteredGuides.length },
          { id: 'videos', label: 'Videos', icon: Video, count: filteredVideos.length },
          { id: 'resources', label: 'Recursos', icon: Download, count: filteredResources.length }
        ].map(section => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            onClick={() => setActiveSection(section.id)}
            className="flex items-center gap-2"
          >
            <section.icon className="h-4 w-4" />
            {section.label}
            {section.count !== undefined && (
              <Badge variant="secondary" className="ml-1">
                {section.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Vista General */}
      {activeSection === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* FAQ */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('faq')}
          >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Preguntas Frecuentes
                <Badge variant="secondary">{faqs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Encuentra respuestas rápidas a las dudas más comunes
            </p>
            <Button className="w-full">
                Ver FAQ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

          {/* Guías */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('guides')}
          >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Guías de Trading
                <Badge variant="secondary">{guides.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aprende desde lo básico hasta estrategias avanzadas
            </p>
            <Button className="w-full">
                Explorar Guías <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

          {/* Chat en Vivo */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat en Vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Habla con nuestros mentores especializados
            </p>
            <Button className="w-full" asChild>
              <a href="/chat">
                  Iniciar Chat <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

          {/* Videos */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('videos')}
          >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutoriales
                <Badge variant="secondary">{videos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aprende visualmente con nuestros videos explicativos
            </p>
            <Button className="w-full">
                Ver Videos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

          {/* Soporte Técnico */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Soporte Técnico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Contacta nuestro equipo para ayuda personalizada
            </p>
              <Button className="w-full" asChild>
                <a href="/help/support">
                  Contactar <ArrowRight className="ml-2 h-4 w-4" />
                </a>
            </Button>
          </CardContent>
        </Card>

          {/* Recursos */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveSection('resources')}
          >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Recursos
                <Badge variant="secondary">{resources.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Descarga manuales, plantillas y herramientas
            </p>
            <Button className="w-full">
                Descargar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sección FAQ */}
      {activeSection === 'faq' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground">
              Encuentra respuestas rápidas a las dudas más comunes
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron FAQs</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay preguntas frecuentes disponibles'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="bg-card rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{faq.question}</h3>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{faq.views}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">¿Te fue útil esta respuesta?</p>
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateFaqFeedback(faq.id, 'helpful')}
                            className="flex items-center gap-2"
                            disabled={hasUserVoted(faq.id)}
                          >
                            👍 <span className="text-sm">{faq.isHelpful}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateFaqFeedback(faq.id, 'not_helpful')}
                            className="flex items-center gap-2"
                            disabled={hasUserVoted(faq.id)}
                          >
                            👎 <span className="text-sm">{faq.notHelpful}</span>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {faq.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Sección Guías */}
      {activeSection === 'guides' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Guías de Trading</h2>
            <p className="text-muted-foreground">
              Aprende desde lo básico hasta estrategias avanzadas
            </p>
          </div>

          {filteredGuides.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron guías</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay guías disponibles'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map(guide => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{guide.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Badge variant={
                              guide.level === 'beginner' ? 'default' :
                              guide.level === 'intermediate' ? 'secondary' : 'destructive'
                            }>
                              {guide.level === 'beginner' ? 'Principiante' :
                               guide.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </Badge>
                            {guide.duration && (
                              <>
                                <Clock className="h-4 w-4" />
                                {guide.duration}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {guide.description}
                      </p>
                      
                      {guide.topics.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Temas cubiertos:</p>
                          <div className="flex flex-wrap gap-1">
                            {guide.topics.slice(0, 3).map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                            {guide.topics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{guide.topics.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {guide.views}
                        </div>
                        <button
                          onClick={() => incrementLikes('guides', guide.id)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {guide.likes}
                        </button>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          incrementViews('guides', guide.id);
                          window.open(`/help/guide/${guide.id}`, '_blank');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Leer Guía
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Sección Videos */}
      {activeSection === 'videos' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Video Tutoriales</h2>
            <p className="text-muted-foreground">
              Aprende visualmente con nuestros videos explicativos
            </p>
          </div>

          {filteredVideos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron videos</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay videos disponibles'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map(video => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      <div className="relative">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 rounded-t-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                        {video.duration && (
                          <Badge className="absolute bottom-2 right-2 bg-black/80">
                            {video.duration}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {video.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {video.views.toLocaleString()}
                        </div>
                        <button
                          onClick={() => incrementLikes('videos', video.id)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {video.likes}
                        </button>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          incrementViews('videos', video.id);
                          window.open(video.videoUrl, '_blank');
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ver Video
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Sección Recursos */}
      {activeSection === 'resources' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Recursos Descargables</h2>
            <p className="text-muted-foreground">
              Descarga manuales, plantillas y herramientas útiles
            </p>
          </div>

          {filteredResources.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron recursos</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay recursos disponibles'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{resource.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {resource.fileType.toUpperCase()}
                            </Badge>
                            <span>{resource.downloads} descargas</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {resource.description}
                      </p>
                      
                      {resource.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full"
                        onClick={() => downloadResource(resource)}
                      >
                        <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </CardContent>
        </Card>
                </motion.div>
              ))}
      </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default HelpPage; 