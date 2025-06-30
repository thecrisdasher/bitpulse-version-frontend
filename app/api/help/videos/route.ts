import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET - Obtener videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'published';

    const whereClause: any = {};

    // Solo agregar status al where si no es 'all'
    if (status !== 'all') {
      whereClause.status = status;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const videos = await (prisma as any).video.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      data: videos 
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener los videos' 
    }, { status: 500 });
  }
}

// POST - Crear nuevo video (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No autorizado' 
      }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.sub }, 
      select: { role: true } 
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Acceso denegado' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      videoUrl, 
      thumbnail, 
      categoryId, 
      duration, 
      tags, 
      sortOrder 
    } = body;

    if (!title || !description || !videoUrl || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Campos requeridos: title, description, videoUrl, categoryId' 
      }, { status: 400 });
    }

    const video = await (prisma as any).video.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnail,
        categoryId,
        duration,
        tags: tags || [],
        sortOrder: sortOrder || 0,
        createdBy: session.sub
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: video,
      message: 'Video creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear el video' 
    }, { status: 500 });
  }
}

// PUT - Actualizar video existente (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No autorizado' 
      }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.sub }, 
      select: { role: true } 
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Acceso denegado' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id, 
      title, 
      description, 
      videoUrl, 
      thumbnail, 
      categoryId, 
      duration, 
      tags, 
      sortOrder, 
      status 
    } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de video requerido' 
      }, { status: 400 });
    }

    const video = await (prisma as any).video.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(videoUrl && { videoUrl }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(categoryId && { categoryId }),
        ...(duration !== undefined && { duration }),
        ...(tags && { tags }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(status && { status })
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: video,
      message: 'Video actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar el video' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar video (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'No autorizado' 
      }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.sub }, 
      select: { role: true } 
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Acceso denegado' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de video requerido' 
      }, { status: 400 });
    }

    await (prisma as any).video.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Video eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al eliminar el video' 
    }, { status: 500 });
  }
}

// PATCH - Incrementar vistas o likes
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'view' | 'like'

    if (!id || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID y acción requeridos' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (action === 'view') {
      updateData.views = { increment: 1 };
    } else if (action === 'like') {
      updateData.likes = { increment: 1 };
    }

    const video = await (prisma as any).video.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      data: video 
    });

  } catch (error) {
    console.error('Error updating video stats:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar estadísticas' 
    }, { status: 500 });
  }
} 