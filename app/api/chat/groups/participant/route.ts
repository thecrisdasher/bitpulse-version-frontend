import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
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

    const { groupId, userId } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ success: false, message: 'Parámetros inválidos' }, { status: 400 });
    }

    // Verificar que la sala exista y sea tipo general
    const room = await prisma.chatRoom.findUnique({ where: { id: groupId } });
    if (!room || room.type !== 'general') {
      return NextResponse.json({ success: false, message: 'Grupo no encontrado' }, { status: 404 });
    }

    // Verificar si el usuario ya es participante
    const existing = await prisma.chatParticipant.findFirst({ where: { roomId: groupId, userId } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'El usuario ya es participante' }, { status: 400 });
    }

    await prisma.chatParticipant.create({ data: { roomId: groupId, userId } });

    // Retornar la info básica del usuario recién agregado
    const user = await prisma.user.findUnique({ where: { id: userId } });

    return NextResponse.json({ success: true, participant: user });
  } catch (err: any) {
    console.error('Error agregando participante', err);
    return NextResponse.json({ success: false, message: err.message || 'Error interno' }, { status: 500 });
  }
} 