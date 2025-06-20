import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
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

// GET - Obtener comentario específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden ver comentarios
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para ver comentarios' }, { status: 403 });
    }

    const commentId = params.id;

    const comment = await prisma.clientComment.findUnique({
      where: { id: commentId },
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

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Si es maestro, verificar que tiene acceso al cliente
    if (user.role === 'maestro') {
      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: user.id,
          userId: comment.clientId
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'No tienes acceso a este comentario' }, { status: 403 });
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar comentario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden actualizar comentarios
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para actualizar comentarios' }, { status: 403 });
    }

    const commentId = params.id;
    const { content, tagIds, isPrivate } = await request.json();

    // Verificar que el comentario existe
    const existingComment = await prisma.clientComment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Solo el autor del comentario o un admin pueden modificarlo
    if (user.role === 'maestro' && existingComment.authorId !== user.id) {
      return NextResponse.json({ error: 'Solo puedes modificar tus propios comentarios' }, { status: 403 });
    }

    // Si es maestro, verificar que tiene acceso al cliente
    if (user.role === 'maestro') {
      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: user.id,
          userId: existingComment.clientId
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'No tienes acceso a este comentario' }, { status: 403 });
      }
    }

    // Actualizar el comentario
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const comment = await prisma.clientComment.update({
      where: { id: commentId },
      data: {
        ...updateData,
        ...(tagIds && {
          tags: {
            set: tagIds.map((id: string) => ({ id }))
          }
        })
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

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar comentario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden eliminar comentarios
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar comentarios' }, { status: 403 });
    }

    const commentId = params.id;

    // Verificar que el comentario existe
    const existingComment = await prisma.clientComment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Solo el autor del comentario o un admin pueden eliminarlo
    if (user.role === 'maestro' && existingComment.authorId !== user.id) {
      return NextResponse.json({ error: 'Solo puedes eliminar tus propios comentarios' }, { status: 403 });
    }

    // Si es maestro, verificar que tiene acceso al cliente
    if (user.role === 'maestro') {
      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: user.id,
          userId: existingComment.clientId
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'No tienes acceso a este comentario' }, { status: 403 });
      }
    }

    // Eliminar el comentario
    await prisma.clientComment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 