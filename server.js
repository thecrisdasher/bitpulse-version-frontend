const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3004;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

// Middleware de autenticación para Socket.IO
const authenticateSocket = async (socket, next) => {
  try {
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error('No user ID provided'));
    }

    // Obtener usuario de la base de datos directamente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        profilePicture: true
      }
    });

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware de autenticación
  io.use(authenticateSocket);

  // Almacenar usuarios conectados
  const connectedUsers = new Map();

  io.on('connection', async (socket) => {
    console.log(`Usuario conectado: ${socket.user.username} (${socket.userId})`);

    // Agregar usuario a la lista de conectados
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Unir al usuario a sus salas de chat
    await joinUserRooms(socket);

    // Notificar a otros usuarios que este usuario está en línea
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user
    });

    // === EVENTOS DE CHAT ===

    // Unirse a una sala específica
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        
        // Verificar que el usuario tenga acceso a la sala
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            roomId: roomId,
            userId: socket.userId
          },
          include: {
            room: true
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'No tienes acceso a esta sala' });
          return;
        }

        socket.join(roomId);
        socket.emit('joined_room', { roomId, room: participant.room });
        
        // Notificar a otros en la sala
        socket.to(roomId).emit('user_joined_room', {
          userId: socket.userId,
          user: socket.user,
          roomId
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Error al unirse a la sala' });
      }
    });

    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { roomId, body, attachments } = data;

        // Verificar acceso a la sala
        const participant = await prisma.chatParticipant.findFirst({
          where: {
            roomId: roomId,
            userId: socket.userId
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'No tienes acceso a esta sala' });
          return;
        }

        // Crear mensaje en la base de datos
        const message = await prisma.message.create({
          data: {
            roomId,
            senderId: socket.userId,
            body,
            attachments: attachments || null,
            status: 'delivered'
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                role: true
              }
            }
          }
        });

        // Enviar mensaje a todos en la sala
        io.to(roomId).emit('new_message', message);

        // Actualizar último mensaje de la sala
        await prisma.chatRoom.update({
          where: { id: roomId },
          data: { updatedAt: new Date() }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // Usuario escribiendo
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        user: socket.user,
        roomId
      });
    });

    // Usuario dejó de escribir
    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId,
        roomId
      });
    });

    // Marcar mensajes como leídos
    socket.on('mark_as_read', async (data) => {
      try {
        const { roomId, messageIds } = data;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            roomId: roomId,
            senderId: { not: socket.userId }
          },
          data: { status: 'read' }
        });

        socket.to(roomId).emit('messages_read', {
          messageIds,
          readBy: socket.userId,
          roomId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // === EVENTOS ESPECÍFICOS PARA MENTORES ===

    // Solo admins pueden crear asignaciones de mentores
    socket.on('assign_mentor', async (data) => {
      try {
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'No tienes permisos para asignar mentores' });
          return;
        }

        const { userId, mentorId } = data;

        // Verificar que el mentor existe y tiene el rol correcto
        const mentor = await prisma.user.findUnique({
          where: { id: mentorId, role: 'maestro' }
        });

        if (!mentor) {
          socket.emit('error', { message: 'Mentor no encontrado' });
          return;
        }

        // Crear asignación
        const assignment = await prisma.mentorAssignment.create({
          data: {
            userId,
            mentorId
          },
          include: {
            user: true,
            mentor: true
          }
        });

        // Crear sala de chat privada
        const room = await createPrivateRoom(userId, mentorId);

        // Notificar a ambos usuarios
        const userSocket = Array.from(connectedUsers.entries())
          .find(([id]) => id === userId)?.[1];
        const mentorSocket = Array.from(connectedUsers.entries())
          .find(([id]) => id === mentorId)?.[1];

        if (userSocket) {
          io.to(userSocket.socketId).emit('mentor_assigned', { assignment, room });
        }
        if (mentorSocket) {
          io.to(mentorSocket.socketId).emit('mentee_assigned', { assignment, room });
        }

        socket.emit('assignment_created', { assignment, room });

      } catch (error) {
        console.error('Error assigning mentor:', error);
        socket.emit('error', { message: 'Error al asignar mentor' });
      }
    });

    // === DESCONEXIÓN ===

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.user.username}`);
      
      // Remover de usuarios conectados
      connectedUsers.delete(socket.userId);

      // Notificar a otros usuarios que este usuario está offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });
  });

  // Función para unir usuario a sus salas
  async function joinUserRooms(socket) {
    try {
      const userRooms = await prisma.chatParticipant.findMany({
        where: { userId: socket.userId },
        include: { room: true }
      });

      for (const participant of userRooms) {
        socket.join(participant.roomId);
      }

      // Unir a la sala general si no está ya
      await ensureGeneralRoomMembership(socket.userId);
      
    } catch (error) {
      console.error('Error joining user rooms:', error);
    }
  }

  // Función para asegurar membresía en sala general
  async function ensureGeneralRoomMembership(userId) {
    try {
      // Buscar sala general
      let generalRoom = await prisma.chatRoom.findFirst({
        where: { type: 'general' }
      });

      // Crear sala general si no existe
      if (!generalRoom) {
        generalRoom = await prisma.chatRoom.create({
          data: {
            type: 'general',
            name: 'Chat General'
          }
        });
      }

      // Verificar si el usuario ya es participante
      const existingParticipant = await prisma.chatParticipant.findFirst({
        where: {
          roomId: generalRoom.id,
          userId
        }
      });

      // Agregar como participante si no lo es
      if (!existingParticipant) {
        await prisma.chatParticipant.create({
          data: {
            roomId: generalRoom.id,
            userId
          }
        });
      }
    } catch (error) {
      console.error('Error ensuring general room membership:', error);
    }
  }

  // Función para crear sala privada entre usuario y mentor
  async function createPrivateRoom(userId, mentorId) {
    try {
      // Verificar si ya existe una sala entre estos usuarios
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              userId: { in: [userId, mentorId] }
            }
          }
        }
      });

      if (existingRoom) {
        return existingRoom;
      }

      // Crear nueva sala privada
      const room = await prisma.chatRoom.create({
        data: {
          type: 'private',
          name: null, // Las salas privadas no necesitan nombre
          participants: {
            create: [
              { userId },
              { userId: mentorId }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      });

      return room;
    } catch (error) {
      console.error('Error creating private room:', error);
      throw error;
    }
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 