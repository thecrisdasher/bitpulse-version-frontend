"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Video, 
  Phone, 
  Star,
  Clock,
  Users,
  Award,
  TrendingUp
} from "lucide-react";
import LiveChat from "@/components/LiveChat";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

// Datos de mentores
const MENTORS = [
  {
    id: 'mentor-1',
    name: 'Carlos Rodriguez',
    avatar: '/avatars/carlos.jpg',
    status: 'online' as const,
    specialty: 'Trading Técnico',
    description: 'Especialista en análisis técnico con más de 10 años de experiencia en mercados financieros.',
    rating: 4.9,
    responseTime: '< 2 min',
    sessionsCompleted: 1247,
    languages: ['Español', 'Inglés'],
    expertise: ['Análisis Técnico', 'Patrones de Velas', 'Indicadores', 'Fibonacci']
  },
  {
    id: 'mentor-2',
    name: 'Ana García',
    avatar: '/avatars/ana.jpg',
    status: 'online' as const,
    specialty: 'Análisis Fundamental',
    description: 'Experta en análisis fundamental y evaluación de empresas con certificación CFA.',
    rating: 4.8,
    responseTime: '< 5 min',
    sessionsCompleted: 892,
    languages: ['Español', 'Portugués'],
    expertise: ['Análisis Fundamental', 'Valoración', 'Estados Financieros', 'Macroeconomía']
  },
  {
    id: 'mentor-3',
    name: 'Miguel Torres',
    avatar: '/avatars/miguel.jpg',
    status: 'away' as const,
    specialty: 'Gestión de Riesgo',
    description: 'Especialista en gestión de riesgo y psicología del trading con más de 8 años de experiencia.',
    rating: 4.7,
    responseTime: '< 10 min',
    sessionsCompleted: 567,
    languages: ['Español'],
    expertise: ['Gestión de Riesgo', 'Psicología Trading', 'Money Management', 'Disciplina']
  },
  {
    id: 'mentor-4',
    name: 'Laura Mendoza',
    avatar: '/avatars/laura.jpg',
    status: 'busy' as const,
    specialty: 'Criptomonedas',
    description: 'Experta en mercados de criptomonedas y blockchain con amplia experiencia en DeFi.',
    rating: 4.6,
    responseTime: '< 15 min',
    sessionsCompleted: 423,
    languages: ['Español', 'Inglés'],
    expertise: ['Criptomonedas', 'Blockchain', 'DeFi', 'NFTs']
  }
];

const ChatPage = () => {
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [chatMinimized, setChatMinimized] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      case 'busy': return 'Ocupado';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Chat en Vivo con Mentores</h1>
              <p className="text-muted-foreground">
                Conecta con nuestros expertos en trading y obtén asesoría personalizada en tiempo real.
              </p>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Mentores */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentores Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MENTORS.map((mentor) => (
                <Card 
                  key={mentor.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedMentor === mentor.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMentor(mentor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={mentor.avatar} />
                          <AvatarFallback>
                            {mentor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                          getStatusColor(mentor.status)
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{mentor.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={mentor.status === 'online' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {getStatusText(mentor.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{mentor.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{mentor.responseTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span>{mentor.sessionsCompleted} sesiones</span>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="mb-2">
                          {mentor.specialty}
                        </Badge>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {mentor.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {mentor.expertise.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Idiomas: {mentor.languages.join(', ')}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={mentor.status !== 'online'}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Llamar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={mentor.status !== 'online'}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Video
                            </Button>
                            <Button 
                              size="sm"
                              disabled={mentor.status === 'busy'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMentor(mentor.id);
                                setChatMinimized(false);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel de Chat */}
        <div className="lg:col-span-1">
          {selectedMentor ? (
            <div className="sticky top-6">
              <LiveChat 
                minimized={chatMinimized}
                onToggleMinimize={() => setChatMinimized(!chatMinimized)}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecciona un Mentor</h3>
                <p className="text-muted-foreground mb-4">
                  Elige un mentor de la lista para comenzar a chatear y recibir asesoría personalizada.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>En línea - Respuesta inmediata</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Ausente - Responde pronto</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Ocupado - No disponible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Chat en Tiempo Real</h3>
            <p className="text-sm text-muted-foreground">
              Comunícate instantáneamente con nuestros expertos y obtén respuestas inmediatas.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Mentores Certificados</h3>
            <p className="text-sm text-muted-foreground">
              Todos nuestros mentores están certificados y tienen años de experiencia comprobada.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Mejora tus Resultados</h3>
            <p className="text-sm text-muted-foreground">
              Aprende estrategias probadas y mejora tu rendimiento en los mercados financieros.
            </p>
          </CardContent>
        </Card>
      </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage; 