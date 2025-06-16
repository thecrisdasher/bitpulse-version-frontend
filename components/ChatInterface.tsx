"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Users, 
  Search,
  Plus,
  Settings,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import LiveChat from "./LiveChat";
import GroupModal from "./modals/GroupModal";
import { Switch } from "@/components/ui/switch";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const { user } = useAuth();
  const { 
    rooms, 
    currentRoom, 
    setCurrentRoom, 
    isConnected, 
    onlineUsers,
    availableMentors,
    userMentor,
    loadRooms,
    joinRoom
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [showMentorAssignment, setShowMentorAssignment] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);

  useEffect(() => {
    loadRooms(showAllChats && user?.role === 'admin');
  }, [loadRooms, showAllChats, user]);

  // Filtrar salas según término de búsqueda
  const filteredRooms = rooms.filter(room => {
    const roomName = room.type === 'general' 
      ? room.name || 'Chat General'
      : room.otherParticipant 
        ? `${room.otherParticipant.firstName} ${room.otherParticipant.lastName}`
        : 'Chat Privado';
    
    return roomName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Función para formatear el tiempo del último mensaje
  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }
  };

  // Función para manejar la selección de sala
  const handleRoomSelect = (room: any) => {
    setCurrentRoom(room);
    joinRoom(room.id);
  };

  // Verificar si el usuario está en línea
  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Panel izquierdo - Lista de salas */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header de la lista */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nuevo chat
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setShowGroupModal(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Crear grupo
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Estado de conexión y toggle admin */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado' : 'Conectando...'}
              </span>
            </div>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-1 text-xs">
                <Switch checked={showAllChats} onCheckedChange={setShowAllChats} id="allchats" />
                <label htmlFor="allchats">Todos los chats</label>
              </div>
            )}
          </div>
        </div>

        {/* Lista de salas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredRooms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay chats disponibles</p>
                <p className="text-sm">Inicia una conversación</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = currentRoom?.id === room.id;
                const otherParticipant = room.type === 'private' ? room.otherParticipant : null;
                const roomName = room.type === 'general' 
                  ? 'Chat General'
                  : otherParticipant 
                    ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                    : 'Chat Privado';

                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      isActive && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={room.type === 'general' ? undefined : otherParticipant?.profilePicture} 
                          />
                          <AvatarFallback>
                            {room.type === 'general' ? (
                              <Users className="h-6 w-6" />
                            ) : (
                              otherParticipant?.firstName?.charAt(0) || 'U'
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {otherParticipant && (
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                            isUserOnline(otherParticipant.id) ? "bg-green-500" : "bg-gray-500"
                          )} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">{roomName}</h3>
                          {room.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatLastMessageTime(room.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage 
                              ? `${room.lastMessage.sender.firstName}: ${room.lastMessage.body}`
                              : 'Sin mensajes'
                            }
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {room.type === 'private' && otherParticipant?.role === 'maestro' && (
                              <Badge variant="secondary" className="text-xs">
                                Manager
                              </Badge>
                            )}
                            {room.unreadCount > 0 && (
                              <Badge className="h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center">
                                {room.unreadCount > 99 ? '99+' : room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Panel de mentor asignado */}
        {userMentor && (
          <div className="p-4 border-t border-border">
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userMentor.profilePicture} />
                  <AvatarFallback>
                    {userMentor.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">Tu Manager</p>
                  <p className="text-xs text-muted-foreground">
                    {userMentor.firstName} {userMentor.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel derecho - Chat activo */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <LiveChat 
            roomId={currentRoom.id}
            className="h-full border-none shadow-none"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Selecciona un chat</h3>
              <p className="text-muted-foreground">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación/edición de grupo */}
      {user?.role === 'admin' && (
        <GroupModal 
          open={showGroupModal}
          onOpenChange={setShowGroupModal}
        />
      )}
    </div>
  );
};

export default ChatInterface; 