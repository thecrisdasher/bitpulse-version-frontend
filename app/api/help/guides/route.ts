import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET - Obtener guías
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const level = searchParams.get('level');
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

    if (level) {
      whereClause.level = level;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { topics: { has: search } }
      ];
    }

    const guides = await prisma.guide.findMany({
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
      data: guides 
    });

  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener las guías' 
    }, { status: 500 });
  }
}

// POST - Crear nueva guía (solo admin)
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
      content, 
      categoryId, 
      level, 
      duration, 
      thumbnail, 
      tags, 
      topics, 
      sortOrder 
    } = body;

    if (!title || !description || !content || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Campos requeridos: title, description, content, categoryId' 
      }, { status: 400 });
    }

    const guide = await prisma.guide.create({
      data: {
        title,
        description,
        content,
        categoryId,
        level: level || 'beginner',
        duration,
        thumbnail,
        tags: tags || [],
        topics: topics || [],
        sortOrder: sortOrder || 0,
        createdBy: session.sub
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: guide,
      message: 'Guía creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creating guide:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear la guía' 
    }, { status: 500 });
  }
}

// PUT - Actualizar guía existente (solo admin)
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
      content, 
      categoryId, 
      level, 
      duration, 
      thumbnail, 
      tags, 
      topics, 
      sortOrder, 
      status 
    } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de guía requerido' 
      }, { status: 400 });
    }

    const guide = await prisma.guide.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(categoryId && { categoryId }),
        ...(level && { level }),
        ...(duration !== undefined && { duration }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(tags && { tags }),
        ...(topics && { topics }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(status && { status })
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: guide,
      message: 'Guía actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error updating guide:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar la guía' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar guía (solo admin)
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
        message: 'ID de guía requerido' 
      }, { status: 400 });
    }

    await prisma.guide.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Guía eliminada exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting guide:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al eliminar la guía' 
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

    const guide = await prisma.guide.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      data: guide 
    });

  } catch (error) {
    console.error('Error updating guide stats:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar estadísticas' 
    }, { status: 500 });
  }
} 