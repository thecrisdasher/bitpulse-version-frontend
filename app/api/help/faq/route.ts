import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

// GET - Obtener FAQs (con filtros opcionales)
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
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const faqs = await prisma.fAQ.findMany({
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
      data: faqs 
    });

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al obtener las FAQs' 
    }, { status: 500 });
  }
}

// POST - Crear nueva FAQ (solo admin)
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
    const { question, answer, categoryId, tags, sortOrder } = body;

    if (!question || !answer || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Campos requeridos: question, answer, categoryId' 
      }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
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
      data: faq,
      message: 'FAQ creada exitosamente' 
    });

  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al crear la FAQ' 
    }, { status: 500 });
  }
}

// PUT - Actualizar FAQ existente (solo admin)
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
    const { id, question, answer, categoryId, tags, sortOrder, status } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID de FAQ requerido' 
      }, { status: 400 });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
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
      data: faq,
      message: 'FAQ actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al actualizar la FAQ' 
    }, { status: 500 });
  }
}

// DELETE - Eliminar FAQ (solo admin)
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
        message: 'ID de FAQ requerido' 
      }, { status: 400 });
    }

    await prisma.fAQ.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'FAQ eliminada exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al eliminar la FAQ' 
    }, { status: 500 });
  }
}

// PATCH - Actualizar vistas o feedback de FAQ
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    let updateData = {};

    switch (action) {
      case 'view':
        updateData = { views: { increment: 1 } };
        break;
      case 'helpful':
        updateData = { isHelpful: { increment: 1 } };
        break;
      case 'not_helpful':
        updateData = { notHelpful: { increment: 1 } };
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const updatedFaq = await prisma.fAQ.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    return NextResponse.json({ success: true, data: updatedFaq });
  } catch (error) {
    console.error('Error updating FAQ feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 