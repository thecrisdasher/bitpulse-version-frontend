import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET - Obtener recursos
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
        { fileName: { contains: search, mode: 'insensitive' } },
        { fileType: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const resources = await (prisma as any).resource.findMany({
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
      data: resources 
    });

  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener los recursos' 
    }, { status: 500 });
  }
}

// POST - Crear nuevo recurso (solo admin)
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
      fileUrl, 
      fileName, 
      fileSize, 
      fileType, 
      categoryId, 
      tags, 
      sortOrder 
    } = body;

    if (!title || !description || !fileUrl || !fileName || !fileType || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Campos requeridos: title, description, fileUrl, fileName, fileType, categoryId' 
      }, { status: 400 });
    }

    const resource = await (prisma as any).resource.create({
      data: {
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        categoryId,
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
      data: resource,
      message: 'Recurso creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear el recurso' 
    }, { status: 500 });
  }
}

// PUT - Actualizar recurso existente (solo admin)
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
      fileUrl, 
      fileName, 
      fileSize, 
      fileType, 
      categoryId, 
      tags, 
      sortOrder, 
      status 
    } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de recurso requerido' 
      }, { status: 400 });
    }

    const resource = await (prisma as any).resource.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileSize !== undefined && { fileSize }),
        ...(fileType && { fileType }),
        ...(categoryId && { categoryId }),
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
      data: resource,
      message: 'Recurso actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar el recurso' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar recurso (solo admin)
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
        message: 'ID de recurso requerido' 
      }, { status: 400 });
    }

    await (prisma as any).resource.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Recurso eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al eliminar el recurso' 
    }, { status: 500 });
  }
}

// PATCH - Incrementar descargas
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'download'

    if (!id || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID y acción requeridos' 
      }, { status: 400 });
    }

    if (action === 'download') {
      const resource = await (prisma as any).resource.update({
        where: { id },
        data: {
          downloads: { increment: 1 }
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: resource 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Acción no válida' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating resource stats:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar estadísticas' 
    }, { status: 500 });
  }
} 