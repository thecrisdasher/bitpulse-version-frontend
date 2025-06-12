import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSessionFromRequest } from '@/lib/auth/session';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!groupId || !userId) {
      return NextResponse.json({ success: false, message: 'Parámetros inválidos' }, { status: 400 });
    }

    // Verificar que la sala exista y sea tipo general
    const room = await prisma.chatRoom.findUnique({ where: { id: groupId } });
    if (!room || room.type !== 'general') {
      return NextResponse.json({ success: false, message: 'Grupo no encontrado' }, { status: 404 });
    }

    // Evitar que se elimine al creador, opcional
    // await prisma.chatRoom.findUnique ... etc

    // Eliminar participante
    await prisma.chatParticipant.deleteMany({ where: { roomId: groupId, userId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error eliminando participante', err);
    return NextResponse.json({ success: false, message: err.message || 'Error interno' }, { status: 500 });
  }
} 