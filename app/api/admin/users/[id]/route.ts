import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
import { SecurityUtils } from '@/lib/utils/security';

// PATCH /api/admin/users/[id] - Aprobar/Rechazar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario actual es admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { action, notes } = await request.json();
    const { id: userId } = await params;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Verificar que el usuario existe y requiere aprobación
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        adminApprovalRequired: true,
        adminApproved: true,
        adminApprovalExpiresAt: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!targetUser.adminApprovalRequired || targetUser.adminApproved) {
      return NextResponse.json({ error: 'Este usuario no requiere aprobación' }, { status: 400 });
    }

    // Verificar que no haya expirado
    if (targetUser.adminApprovalExpiresAt && targetUser.adminApprovalExpiresAt < new Date()) {
      return NextResponse.json({ error: 'La solicitud de aprobación ha expirado' }, { status: 400 });
    }

    if (action === 'approve') {
      // Aprobar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          adminApproved: true,
          adminApprovedBy: currentUser.id,
          adminApprovalNotes: notes || null,
          emailConfirmed: true,
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          adminApproved: true,
          adminApprovedBy: true,
          adminApprovalNotes: true
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `Usuario ${targetUser.firstName} ${targetUser.lastName} aprobado exitosamente`,
        user: updatedUser
      });

    } else if (action === 'reject') {
      // Rechazar usuario - desactivar y marcar como no confirmado
      await prisma.user.update({
        where: { id: userId },
        data: {
          adminApproved: false,
          adminApprovedBy: currentUser.id,
          adminApprovalNotes: notes || 'Rechazado por el administrador',
          emailConfirmed: false,
          isActive: false
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `Usuario ${targetUser.firstName} ${targetUser.lastName} rechazado`
      });
    }

  } catch (error) {
    console.error('Error en aprobación de usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET /api/admin/users/[id] - Obtener detalles de usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailConfirmed: true,
        adminApprovalRequired: true,
        adminApproved: true,
        adminApprovalRequestedAt: true,
        adminApprovalExpiresAt: true,
        adminApprovedBy: true,
        adminApprovalNotes: true,
        createdAt: true,
        lastLogin: true,
        isActive: true,
        pejecoins: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } });
    if (!currentUser || currentUser.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const body = await request.json();
    const { firstName, lastName, email, role, pejecoins, isActive, password } = body;
    const { id } = await params;

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (role) data.role = role;
    if (typeof pejecoins !== 'undefined') data.pejecoins = pejecoins;
    if (typeof isActive !== 'undefined') data.isActive = isActive;
    if (password) data.password = await SecurityUtils.hashPassword(password);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pejecoins: true,
        isActive: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Eliminar usuario definitivamente
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ 
      where: { id: session.sub }, 
      select: { role: true, id: true } 
    });
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Verificar que no se está intentando eliminar a sí mismo
    if (currentUser.id === userId) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        email: true,
        isActive: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Solo permitir eliminar usuarios que ya están inactivos (soft deleted)
    if (targetUser.isActive) {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar definitivamente usuarios que ya han sido eliminados (inactivos)' 
      }, { status: 400 });
    }

    // Eliminar usuario definitivamente de la base de datos
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: `Usuario ${targetUser.firstName} ${targetUser.lastName} eliminado definitivamente de la base de datos`
    });

  } catch (error) {
    console.error('Error eliminando usuario definitivamente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 