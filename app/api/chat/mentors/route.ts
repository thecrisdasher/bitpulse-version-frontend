import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSessionFromRequest } from '@/lib/auth/session';

const prisma = new PrismaClient();

// Middleware para verificar autenticación
async function verifyAuth(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return null;

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

// GET - Obtener mentores disponibles y asignaciones
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'available') {
      // Solo admins pueden ver la lista completa de mentores
      if (user.role !== 'admin') {
        return NextResponse.json({ mentors: [] });
      }

      const mentors = await prisma.user.findMany({
        where: {
          role: 'maestro',
          isActive: true
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
          createdAt: true,
          lastLogin: true
        }
      });

      return NextResponse.json({ mentors });
    }

    if (action === 'my-mentor') {
      // Cualquier usuario puede ver su mentor asignado
      const userAssignment = await prisma.mentorAssignment.findFirst({
        where: { userId: user.id },
        include: {
          mentor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
              lastLogin: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return NextResponse.json({ assignment: userAssignment });
    }

    if (action === 'assignments') {
      // Solo admins pueden ver todas las asignaciones
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const assignments = await prisma.mentorAssignment.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          },
          mentor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      return NextResponse.json({ assignments });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Asignar mentor a usuario (solo admins)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { userId, mentorId } = await request.json();

    if (!userId || !mentorId) {
      return NextResponse.json({ error: 'userId y mentorId son requeridos' }, { status: 400 });
    }

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

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error assigning mentor:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Remover asignación de mentor (solo admins)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admins pueden remover asignaciones' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId es requerido' }, { status: 400 });
    }

    // Verificar que la asignación existe
    const assignment = await prisma.mentorAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    // Eliminar asignación
    await prisma.mentorAssignment.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({ message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función auxiliar para crear sala privada
async function createPrivateRoom(userId: string, mentorId: string) {
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
      return existingRoom;
    }

    // Crear nueva sala privada
    const room = await prisma.chatRoom.create({
      data: {
        type: 'private',
        name: null,
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