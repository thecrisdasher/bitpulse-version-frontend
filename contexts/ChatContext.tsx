"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Tipos
interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'cliente' | 'admin' | 'maestro';
  profilePicture?: string;
}

interface Message {
  id: string;
  roomId: string;
  body: string;
  senderId: string;
  sender: User;
  createdAt: string;
  status: 'sending' | 'delivered' | 'read';
  attachments?: any;
}

interface ChatRoom {
  id: string;
  type: 'private' | 'general';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  otherParticipant?: User; // Para salas privadas
}

interface ChatContextType {
  // Estado de conexión
  isConnected: boolean;
  socket: Socket | null;
  
  // Salas y mensajes
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: { [roomId: string]: Message[] };
  
  // Usuarios en línea
  onlineUsers: Set<string>;
  typingUsers: { [roomId: string]: User[] };
  
  // Funciones
  joinRoom: (roomId: string) => void;
  sendMessage: (roomId: string, body: string, attachments?: any) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
  markAsRead: (roomId: string, messageIds: string[]) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  
  // Mentores
  assignMentor: (userId: string, mentorId: string) => void;
  availableMentors: User[];
  userMentor: User | null;
  
  // Funciones de carga
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  loadMentors: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Obtener usuario del contexto de autenticación (ya autenticado vía cookies)
  const { user } = useAuth();
  
  // Estado de conexión
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Estado del chat
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});
  
  // Estado de usuarios
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: User[] }>({});
  
  // Estado de mentores
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [userMentor, setUserMentor] = useState<User | null>(null);

  // Inicializar conexión WebSocket
  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3004', {
      transports: ['websocket'],
      auth: { userId: user.id },
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor de chat');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor de chat');
      setIsConnected(false);
    });

    // Eventos de chat
    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message]
      }));
      
      // Actualizar último mensaje en las salas
      setRooms(prev => prev.map(room => 
        room.id === message.roomId 
          ? { ...room, lastMessage: message, updatedAt: message.createdAt }
          : room
      ));
    });

    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('user_typing', ({ userId, user, roomId }: { userId: string; user: User; roomId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []).filter(u => u.id !== userId), user]
      }));
    });

    newSocket.on('user_stop_typing', ({ userId, roomId }: { userId: string; roomId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(u => u.id !== userId)
      }));
    });

    newSocket.on('messages_read', ({ messageIds, roomId }: { messageIds: string[]; roomId: string }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).map(msg => 
          messageIds.includes(msg.id) ? { ...msg, status: 'read' as const } : msg
        )
      }));
    });

    // Eventos de mentores
    newSocket.on('mentor_assigned', ({ assignment, room }: any) => {
      setUserMentor(assignment.mentor);
      setRooms(prev => [...prev, room]);
    });

    newSocket.on('error', ({ message }: { message: string }) => {
      console.error('Error del socket:', message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isConnected && user) {
      loadRooms();
      loadMentors();
    }
  }, [isConnected, user]);

  // Funciones de API
  const loadRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/rooms', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [roomId]: data.messages
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const loadMentors = useCallback(async () => {
    try {
      // Solo cargar mentores disponibles si el usuario es admin
      if (user?.role === 'admin') {
        const mentorsResponse = await fetch('/api/chat/mentors?action=available', {
          credentials: 'include'
        });
        
        if (mentorsResponse.ok) {
          const mentorsData = await mentorsResponse.json();
          setAvailableMentors(mentorsData.mentors);
        }
      }

      // Cargar mentor asignado al usuario (todos pueden hacer esto)
      const myMentorResponse = await fetch('/api/chat/mentors?action=my-mentor', {
        credentials: 'include'
      });
      
      if (myMentorResponse.ok) {
        const myMentorData = await myMentorResponse.json();
        if (myMentorData.assignment) {
          setUserMentor(myMentorData.assignment.mentor);
        }
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  }, [user]);

  // Funciones de chat
  const joinRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('join_room', { roomId });
      loadMessages(roomId);
    }
  }, [socket, loadMessages]);

  const sendMessage = useCallback((roomId: string, body: string, attachments?: any) => {
    if (socket) {
      socket.emit('send_message', { roomId, body, attachments });
    }
  }, [socket]);

  const markAsRead = useCallback((roomId: string, messageIds: string[]) => {
    if (socket) {
      socket.emit('mark_as_read', { roomId, messageIds });
    }
  }, [socket]);

  const startTyping = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('typing_start', { roomId });
    }
  }, [socket]);

  const stopTyping = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('typing_stop', { roomId });
    }
  }, [socket]);

  const assignMentor = useCallback((userId: string, mentorId: string) => {
    if (socket) {
      socket.emit('assign_mentor', { userId, mentorId });
    }
  }, [socket]);

  const contextValue: ChatContextType = {
    isConnected,
    socket,
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    typingUsers,
    joinRoom,
    sendMessage,
    setCurrentRoom,
    markAsRead,
    startTyping,
    stopTyping,
    assignMentor,
    availableMentors,
    userMentor,
    loadRooms,
    loadMessages,
    loadMentors
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe ser usado dentro de un ChatProvider');
  }
  return context;
}; 