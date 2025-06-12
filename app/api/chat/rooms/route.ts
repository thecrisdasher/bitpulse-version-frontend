import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSessionFromRequest } from '@/lib/auth/session';

const prisma = new PrismaClient();

// Middleware para verificar autenticación
async function verifyAuth(request: NextRequest) {
  try {
    // Crear sesión desde cookie o header (función ya maneja ambas)
    const session = await createSessionFromRequest(request);

    if (!session) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        profilePicture: true,
      },
    });

    return user?.isActive ? user : null;
  } catch (error) {
    return null;
  }
}

// GET - Obtener salas del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Revisar si el administrador solicita todas las salas
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    if (scope === 'all') {
      // Sólo los administradores pueden solicitar todas las salas
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }

      const roomsData = await prisma.chatRoom.findMany({
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
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            }
          }
        }
      });

      // Ordenar por fecha de actualización (si existe) o de creación
      (roomsData as any).sort((a: any, b: any) => {
        const dateA = a.updatedAt ?? a.createdAt;
        const dateB = b.updatedAt ?? b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });

      // Formatear datos para el frontend
      const rooms = (roomsData as any).map((room: any) => {
        const lastMessage = room.messages[0] || null;

        // Para salas privadas, tomar el primer participante como referencia (el administrador no forma parte)
        const otherParticipant = room.type === 'private'
          ? room.participants[0]?.user || null
          : null;

        return {
          id: room.id,
          type: room.type,
          name: room.type === 'private'
            ? `${otherParticipant?.firstName} ${otherParticipant?.lastName}`
            : room.name,
          participants: room.participants.map((p: any) => p.user),
          lastMessage,
          unreadCount: 0,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          otherParticipant,
        };
      });

      return NextResponse.json({ rooms });
    }

    // Obtener salas del usuario con información adicional
    const userRooms = await prisma.chatParticipant.findMany({
      where: { userId: user.id },
      include: {
        room: {
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
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    role: true
                  }
                }
              }
            }
          }
        }
      },
    });

    // Ordenar por fecha de actualización (si existe) o de creación
    (userRooms as any).sort((a: any, b: any) => {
      const dateA = a.room.updatedAt ?? a.room.createdAt;
      const dateB = b.room.updatedAt ?? b.room.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    // Formatear datos para el frontend
    const rooms = (userRooms as any).map((participant: any) => {
      const room = participant.room;
      const lastMessage = room.messages[0] || null;
      
      // Para salas privadas, encontrar el otro participante
      const otherParticipant = room.type === 'private' 
        ? room.participants.find((p: any) => p.userId !== user.id)?.user
        : null;

      return {
        id: room.id,
        type: room.type,
        name: room.type === 'private' 
          ? `${otherParticipant?.firstName} ${otherParticipant?.lastName}` 
          : room.name,
        participants: room.participants.map((p: any) => p.user),
        lastMessage,
        unreadCount: 0, // TODO: Implementar conteo de mensajes no leídos
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        otherParticipant // Solo para salas privadas
      };
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva sala (solo para admins y casos específicos)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { type, name, participantIds } = await request.json();

    // Validaciones
    if (type === 'general' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admins pueden crear salas generales' }, { status: 403 });
    }

    if (type === 'private' && (!participantIds || participantIds.length !== 2)) {
      return NextResponse.json({ error: 'Las salas privadas requieren exactamente 2 participantes' }, { status: 400 });
    }

    // Verificar si ya existe una sala privada entre estos usuarios
    if (type === 'private') {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              userId: { in: participantIds }
            }
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

      if (existingRoom) {
        return NextResponse.json({ room: existingRoom });
      }
    }

    // Crear nueva sala
    const room = await prisma.chatRoom.create({
      data: {
        type,
        name: type === 'general' ? name : null,
        createdBy: user.id,
        participants: {
          create: participantIds.map((userId: string) => ({ userId }))
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

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 