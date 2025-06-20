import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
export async function POST(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Acceso denegado' }, { status: 403 });
    }

    const { name, participantIds } = await request.json();
    if (!name || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 });
    }

    // Crear sala de tipo group
    const room = await prisma.chatRoom.create({
      data: {
        type: 'general',
        name,
        participants: {
          createMany: {
            data: participantIds.map((id: string) => ({ userId: id })),
          },
        },
      },
      include: { participants: { include: { user: true } } },
    });

    return NextResponse.json({ success: true, room });
  } catch (err: any) {
    console.error('Error creando grupo', err);
    return NextResponse.json({ success: false, message: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, message: 'Acceso denegado' }, { status: 403 });

    const { groupId, name, participantIds } = await request.json();
    if (!groupId) return NextResponse.json({ success: false, message: 'groupId requerido' }, { status: 400 });

    // Actualizar nombre si viene
    await prisma.chatRoom.update({ where: { id: groupId }, data: { name } });

    if (Array.isArray(participantIds)) {
      // Reemplazar participantes
      await prisma.chatParticipant.deleteMany({ where: { roomId: groupId } });
      await prisma.chatParticipant.createMany({ data: participantIds.map((id: string) => ({ roomId: groupId, userId: id })) });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error actualizando grupo', err);
    return NextResponse.json({ success: false, message: err.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, message: 'Acceso denegado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    if (!groupId) return NextResponse.json({ success: false, message: 'id requerido' }, { status: 400 });

    // Eliminar dependencias primero para respetar claves foráneas
    await prisma.message.deleteMany({ where: { roomId: groupId } });
    await prisma.chatParticipant.deleteMany({ where: { roomId: groupId } });

    await prisma.chatRoom.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error eliminando grupo', err);
    return NextResponse.json({ success: false, message: err.message || 'Error interno' }, { status: 500 });
  }
} 