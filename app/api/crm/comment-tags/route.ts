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

// GET - Obtener todas las etiquetas disponibles
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden ver las etiquetas
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para ver las etiquetas' }, { status: 403 });
    }

    const tags = await prisma.commentTag.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching comment tags:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva etiqueta (solo admins)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden crear etiquetas
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden crear etiquetas' }, { status: 403 });
    }

    const { name, color, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre de la etiqueta es requerido' }, { status: 400 });
    }

    const tag = await prisma.commentTag.create({
      data: {
        name,
        color: color || '#3B82F6',
        description
      }
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una etiqueta con ese nombre' }, { status: 400 });
    }
    console.error('Error creating comment tag:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar etiqueta (solo admins)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden eliminar etiquetas
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar etiquetas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json({ error: 'ID de etiqueta requerido' }, { status: 400 });
    }

    // Verificar que la etiqueta existe
    const tag = await prisma.commentTag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Etiqueta no encontrada' }, { status: 404 });
    }

    // Eliminar etiqueta
    await prisma.commentTag.delete({
      where: { id: tagId }
    });

    return NextResponse.json({ message: 'Etiqueta eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting comment tag:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 