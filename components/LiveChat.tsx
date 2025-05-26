"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Mic,
  MicOff,
  Users,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  User,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Tipos
interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'mentor' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'video';
  size: number;
}

interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  specialty: string;
  rating: number;
  responseTime: string;
}

interface LiveChatProps {
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

// Datos de ejemplo
const MENTORS: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Carlos Rodriguez',
    avatar: '/avatars/carlos.jpg',
    status: 'online',
    specialty: 'Trading Técnico',
    rating: 4.9,
    responseTime: '< 2 min'
  },
  {
    id: 'mentor-2',
    name: 'Ana García',
    avatar: '/avatars/ana.jpg',
    status: 'online',
    specialty: 'Análisis Fundamental',
    rating: 4.8,
    responseTime: '< 5 min'
  },
  {
    id: 'mentor-3',
    name: 'Miguel Torres',
    avatar: '/avatars/miguel.jpg',
    status: 'away',
    specialty: 'Gestión de Riesgo',
    rating: 4.7,
    responseTime: '< 10 min'
  }
];

const LiveChat: React.FC<LiveChatProps> = ({ 
  className,
  minimized = false,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser] = useState({
    id: 'user-1',
    name: 'Usuario',
    avatar: '/avatars/user.jpg'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll a nuevos mensajes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Simular conexión inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
      setSelectedMentor(MENTORS[0]);
      
      // Mensaje de bienvenida
      const welcomeMessage: Message = {
        id: 'welcome-1',
        text: '¡Hola! Soy Carlos, tu mentor de trading técnico. ¿En qué puedo ayudarte hoy?',
        senderId: 'mentor-1',
        senderName: 'Carlos Rodriguez',
        senderType: 'mentor',
        timestamp: new Date(),
        status: 'delivered'
      };
      
      setMessages([welcomeMessage]);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Simular respuesta del mentor
  const simulateMentorResponse = useCallback((userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        'Excelente pregunta. Déjame explicarte esto paso a paso...',
        'Entiendo tu preocupación. Aquí tienes algunas estrategias que puedes considerar:',
        'Eso es muy común en el trading. Te recomiendo que...',
        'Perfecto momento para revisar este concepto. ¿Has considerado...?',
        'Muy buena observación. En mi experiencia...'
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const mentorMessage: Message = {
        id: `mentor-${Date.now()}`,
        text: response,
        senderId: 'mentor-1',
        senderName: 'Carlos Rodriguez',
        senderType: 'mentor',
        timestamp: new Date(),
        status: 'delivered'
      };
      
             setMessages(prev => prev.map(msg => 
         msg.status === 'sending' ? { ...msg, status: 'delivered' as const } : msg
       ).concat(mentorMessage));
      setIsTyping(false);
    }, 2000 + Math.random() * 2000);
  }, []);

  // Enviar mensaje
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedMentor) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage.trim(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Simular respuesta
    simulateMentorResponse(userMessage.text);
  }, [newMessage, selectedMentor, currentUser, simulateMentorResponse]);

  // Manejar tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formatear tiempo
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Estado del mentor
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Icono de estado del mensaje
  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'sent': return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  if (minimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={onToggleMinimize}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        {selectedMentor && isConnected && (
          <div className="absolute -top-1 -right-1">
            <div className={cn("w-3 h-3 rounded-full", getStatusColor(selectedMentor.status))} />
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col h-[600px] w-full max-w-md mx-auto", className)}>
        {/* Header */}
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedMentor?.avatar} />
                  <AvatarFallback>
                    {selectedMentor?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {selectedMentor && (
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                    getStatusColor(selectedMentor.status)
                  )} />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  {selectedMentor?.name || 'Conectando...'}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedMentor && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {selectedMentor.specialty}
                      </Badge>
                      <span>⭐ {selectedMentor.rating}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Llamada de voz</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Videollamada</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Users className="h-4 w-4 mr-2" />
                    Cambiar mentor
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reportar problema
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onToggleMinimize}>
                    Minimizar chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Estado de conexión */}
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Conectado' : 'Conectando...'}
              {selectedMentor && isConnected && (
                <span className="ml-2">• Responde en {selectedMentor.responseTime}</span>
              )}
            </span>
          </div>
        </CardHeader>

        <Separator />

        {/* Mensajes */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.senderType === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.senderType !== 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={selectedMentor?.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[70%] space-y-1",
                    message.senderType === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      message.senderType === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {message.text}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs text-muted-foreground",
                      message.senderType === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.senderType === 'user' && getMessageStatusIcon(message.status)}
                    </div>
                  </div>
                  {message.senderType === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Indicador de typing */}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={selectedMentor?.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <Separator />

        {/* Input de mensaje */}
        <div className="p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={!isConnected || !selectedMentor}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={!isConnected}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={!isConnected}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || !selectedMentor}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default LiveChat; 