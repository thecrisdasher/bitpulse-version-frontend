"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Users,
  Clock,
  CheckCheck,
  AlertCircle,
  User,
  MessageSquare,
  Pencil,
  Trash
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
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import GroupModal from "./modals/GroupModal";
import { toast } from "sonner";
import ParticipantsModal from "./modals/ParticipantsModal";

interface LiveChatProps {
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  roomId?: string;
}

const LiveChat: React.FC<LiveChatProps> = ({ 
  className,
  minimized = false,
  onToggleMinimize,
  roomId
}) => {
  const { user } = useAuth();
  const { 
    isConnected, 
    currentRoom, 
    messages, 
    onlineUsers, 
    typingUsers,
    sendMessage,
    joinRoom,
    startTyping,
    stopTyping,
    setCurrentRoom,
    rooms,
    loadRooms
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<any>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (roomId && isConnected) {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
        joinRoom(roomId);
      }
    }
  }, [roomId, isConnected, rooms, setCurrentRoom, joinRoom]);

  const currentMessages = currentRoom ? (messages[currentRoom.id] || []) : [];
  const currentTypingUsers = currentRoom ? (typingUsers[currentRoom.id] || []) : [];

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !currentRoom || !user) return;

    sendMessage(currentRoom.id, newMessage.trim());
    setNewMessage('');
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    stopTyping(currentRoom.id);
  }, [newMessage, currentRoom, user, sendMessage, typingTimeout, stopTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!currentRoom) return;

    if (value.trim() && !typingTimeout) {
      startTyping(currentRoom.id);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      stopTyping(currentRoom.id);
      setTypingTimeout(null);
    }, 1000);

    setTypingTimeout(timeout);
  }, [currentRoom, typingTimeout, startTyping, stopTyping]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const getUserStatus = (userId: string) => {
    return isUserOnline(userId) ? 'online' : 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-muted-foreground" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  const getOtherParticipant = () => {
    if (!currentRoom || currentRoom.type !== 'private' || !user) return null;
    return currentRoom.participants.find(p => p.id !== user.id);
  };

  const otherParticipant = getOtherParticipant();

  const isReadOnly = Boolean(currentRoom && user?.role === 'admin' && !currentRoom.participants.some(p => p.id === user.id));

  const handleEditGroup = () => {
    if (!currentRoom) return;
    setGroupToEdit({
      id: currentRoom.id,
      name: currentRoom.name || "",
      participants: currentRoom.participants
    });
    setShowEditGroupModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!currentRoom) return;
    const confirmDelete = window.confirm("¿Estás seguro de eliminar este grupo?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/chat/groups?id=${currentRoom.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Grupo eliminado");
        setCurrentRoom(null);
        loadRooms(true);
      } else {
        toast.error(json.message || "Error eliminando grupo");
      }
    } catch (err: any) {
      toast.error(err.message || "Error eliminando grupo");
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
        {currentRoom && isConnected && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col h-[600px] w-full max-w-md mx-auto", className)}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {currentRoom?.type === 'general' ? (
                  <div className="flex -space-x-3">
                    {currentRoom.participants.slice(0, 3).map((p, idx) => (
                      <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={p.profilePicture} />
                        <AvatarFallback>{p.firstName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {currentRoom.participants.length > 3 && (
                      <Avatar className="h-8 w-8 border-2 border-background bg-muted">
                        <AvatarFallback>+{currentRoom.participants.length - 3}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ) : (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherParticipant?.profilePicture} />
                      <AvatarFallback>
                        {otherParticipant?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {otherParticipant && (
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                        getStatusColor(getUserStatus(otherParticipant.id))
                      )} />
                    )}
                  </>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  {currentRoom?.type === 'general'
                    ? 'Chat General'
                    : currentRoom?.type === 'private'
                      ? (otherParticipant 
                          ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                          : 'Chat Privado')
                      : currentRoom?.name ?? 'Grupo'}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {otherParticipant && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {otherParticipant.role === 'maestro' ? 'Manager' : 'Usuario'}
                      </Badge>
                      <span>{isUserOnline(otherParticipant.id) ? 'En línea' : 'Desconectado'}</span>
                    </>
                  )}
                  {currentRoom?.type === 'general' && (
                    <>
                      <span>{currentRoom.participants.length} participantes</span>
                      <span className="italic">Grupo: {currentRoom?.name || 'Chat General'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentRoom?.type === 'private' && (
                <>
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
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowParticipantsModal(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Ver participantes
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reportar problema
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onToggleMinimize && (
                  <DropdownMenuItem onClick={onToggleMinimize}>
                    Minimizar chat
                  </DropdownMenuItem>
                  )}
                  {user?.role === 'admin' && currentRoom?.type === 'general' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEditGroup}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar grupo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteGroup} className="text-red-600 focus:text-red-600">
                        <Trash className="h-4 w-4 mr-2" />
                        Eliminar grupo
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Conectado' : 'Conectando...'}
            </span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 p-0">
          <div className="p-4 h-[400px] overflow-y-auto flex flex-col space-y-4">
            {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                  message.senderId === user?.id ? "justify-end" : "justify-start"
                  )}
                >
                {message.senderId !== user?.id && (
                    <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={message.sender.profilePicture} />
                      <AvatarFallback>
                      {message.sender.firstName?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[70%] space-y-1",
                  message.senderId === user?.id ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                    message.senderId === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                    {message.body}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs text-muted-foreground",
                    message.senderId === user?.id ? "justify-end" : "justify-start"
                    )}>
                    <span>{formatTime(message.createdAt)}</span>
                    {message.senderId === user?.id && getMessageStatusIcon(message.status)}
                  </div>
                </div>
                {message.senderId === user?.id && (
                    <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>
                      {user.firstName?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
            {currentTypingUsers.length > 0 && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={currentTypingUsers[0].profilePicture} />
                    <AvatarFallback>
                    {currentTypingUsers[0].firstName?.charAt(0) || <User className="h-4 w-4" />}
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
        </CardContent>

        <Separator />

        <div className="p-4">
          {currentRoom ? (
          isReadOnly ? (
            <div className="text-center text-muted-foreground text-sm">Vista solo lectura.</div>
          ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                  disabled={!isConnected || isReadOnly}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={!isConnected || isReadOnly}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={!isConnected || isReadOnly}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected || isReadOnly}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          )) : (
            <div className="text-center text-muted-foreground">
              Selecciona una sala de chat para comenzar
            </div>
          )}
        </div>
      </Card>
      {user?.role === 'admin' && (
        <GroupModal
          open={showEditGroupModal}
          onOpenChange={(open) => {
            setShowEditGroupModal(open);
            if (!open) {
              setGroupToEdit(null);
              loadRooms(true);
            }
          }}
          group={groupToEdit || undefined}
        />
      )}
      {currentRoom && (
        <ParticipantsModal
          open={showParticipantsModal}
          onOpenChange={setShowParticipantsModal}
          groupId={currentRoom.id}
          participants={currentRoom.participants}
        />
      )}
    </TooltipProvider>
  );
};

export default LiveChat; 