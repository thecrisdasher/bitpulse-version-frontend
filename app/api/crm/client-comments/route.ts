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

// GET - Obtener comentarios de clientes
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden ver comentarios
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para ver comentarios' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const authorId = searchParams.get('authorId');

    let whereClause: any = {};

    // Si es maestro, solo puede ver sus propios comentarios y los de sus clientes asignados
    if (user.role === 'maestro') {
      if (clientId) {
        // Verificar que el maestro tiene asignado este cliente
        const assignment = await prisma.mentorAssignment.findFirst({
          where: {
            mentorId: user.id,
            userId: clientId
          }
        });

        if (!assignment) {
          return NextResponse.json({ error: 'No tienes acceso a este cliente' }, { status: 403 });
        }

        whereClause.clientId = clientId;
      } else {
        // Obtener clientes asignados al maestro
        const assignments = await prisma.mentorAssignment.findMany({
          where: { mentorId: user.id },
          select: { userId: true }
        });

        const assignedClientIds = assignments.map(a => a.userId);
        whereClause.clientId = { in: assignedClientIds };
      }
    } else if (user.role === 'admin') {
      // Admins pueden ver todos los comentarios
      if (clientId) {
        whereClause.clientId = clientId;
      }
      if (authorId) {
        whereClause.authorId = authorId;
      }
    }

    const comments = await prisma.clientComment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePicture: true
          }
        },
        tags: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching client comments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo comentario
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden crear comentarios
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para crear comentarios' }, { status: 403 });
    }

    const { clientId, content, tagIds = [], isPrivate = false } = await request.json();

    if (!clientId || !content) {
      return NextResponse.json({ error: 'ClientId y contenido son requeridos' }, { status: 400 });
    }

    // Verificar que el cliente existe
    const client = await prisma.user.findUnique({
      where: { id: clientId, role: 'cliente' }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si es maestro, verificar que tiene asignado este cliente
    if (user.role === 'maestro') {
      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: user.id,
          userId: clientId
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'No tienes acceso a este cliente' }, { status: 403 });
      }
    }

    // Crear el comentario
    const comment = await prisma.clientComment.create({
      data: {
        clientId,
        authorId: user.id,
        content,
        isPrivate,
        tags: {
          connect: tagIds.map((id: string) => ({ id }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profilePicture: true
          }
        },
        tags: true
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating client comment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 