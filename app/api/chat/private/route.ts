import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET /api/chat/private?participant=<userId>
// Permite que un administrador cree (o recupere) una sala privada
// con cualquier usuario de la plataforma.
export async function GET(req: NextRequest) {
  try {
    // 1. Autenticación ------------------------------------------------------
    const session = await createSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    // 2. Validar parámetro --------------------------------------------------
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participant');
    if (!participantId) {
      return NextResponse.json({ error: 'participant es requerido' }, { status: 400 });
    }
    if (participantId === admin.id) {
      return NextResponse.json({ error: 'No puedes chatear contigo mismo' }, { status: 400 });
    }

    // 3. Verificar usuario destino -----------------------------------------
    const participant = await prisma.user.findUnique({ where: { id: participantId } });
    if (!participant) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 4. Buscar o crear sala privada ---------------------------------------
    let room = await prisma.chatRoom.findFirst({
      where: {
        type: 'private',
        participants: {
          every: {
            userId: { in: [admin.id, participantId] }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          type: 'private',
          participants: {
            create: [
              { userId: admin.id },
              { userId: participantId }
            ]
          }
        },
        include: {
          participants: { include: { user: true } },
          messages: true
        }
      });
    }

    return NextResponse.json({ roomId: room.id });
  } catch (err) {
    console.error('Error creating private chat:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
} 