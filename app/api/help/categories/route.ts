import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET - Obtener categorías de ayuda
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause: any = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const categories = await prisma.helpCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            faqs: true,
            guides: true,
            videos: true,
            resources: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      data: categories 
    });

  } catch (error) {
    console.error('Error fetching help categories:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener las categorías' 
    }, { status: 500 });
  }
}

// POST - Crear nueva categoría (solo admin)
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
    const { name, description, icon, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        message: 'El nombre de la categoría es requerido' 
      }, { status: 400 });
    }

    const category = await prisma.helpCategory.create({
      data: {
        name,
        description,
        icon,
        sortOrder: sortOrder || 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: category,
      message: 'Categoría creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creating help category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear la categoría' 
    }, { status: 500 });
  }
}

// PUT - Actualizar categoría existente (solo admin)
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
    const { id, name, description, icon, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de categoría requerido' 
      }, { status: 400 });
    }

    const category = await prisma.helpCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: category,
      message: 'Categoría actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error updating help category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar la categoría' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar categoría (solo admin)
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
        message: 'ID de categoría requerido' 
      }, { status: 400 });
    }

    // Verificar si la categoría tiene contenido asociado
    const contentCount = await prisma.helpCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            faqs: true,
            guides: true,
            videos: true,
            resources: true
          }
        }
      }
    });

    if (contentCount && (
      contentCount._count.faqs > 0 ||
      contentCount._count.guides > 0 ||
      contentCount._count.videos > 0 ||
      contentCount._count.resources > 0
    )) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se puede eliminar una categoría que tiene contenido asociado' 
      }, { status: 400 });
    }

    await prisma.helpCategory.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Categoría eliminada exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting help category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al eliminar la categoría' 
    }, { status: 500 });
  }
} 