import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
// Middleware para verificar autenticación
async function verifyAuth(request: NextRequest) {
  try {
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

// GET - Obtener mensajes de una sala específica
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId es requerido' }, { status: 400 });
    }

    // Verificar que el usuario tenga acceso a la sala o sea admin
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: user.id
      }
    });

    if (!participant && user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes acceso a esta sala' }, { status: 403 });
    }

    // Obtener mensajes paginados
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Contar total de mensajes
    const totalMessages = await prisma.message.count({
      where: { roomId }
    });

    const totalPages = Math.ceil(totalMessages / limit);

    return NextResponse.json({
      messages: messages.reverse(), // Ordenar ascendente para mostrar
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Enviar mensaje (también se puede hacer vía WebSocket)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { roomId, body, attachments } = await request.json();

    if (!roomId || !body?.trim()) {
      return NextResponse.json({ error: 'roomId y body son requeridos' }, { status: 400 });
    }

    // Verificar acceso a la sala
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'No tienes acceso a esta sala' }, { status: 403 });
    }

    // Crear mensaje
    const message = await prisma.message.create({
      data: {
        roomId,
        senderId: user.id,
        body: body.trim(),
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
            role: true,
            profilePicture: true
          }
        }
      }
    });

    // Actualizar timestamp de la sala
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 