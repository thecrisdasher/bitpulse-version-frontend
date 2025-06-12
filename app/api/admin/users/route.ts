import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import { createSessionFromRequest } from '@/lib/auth/session';

const prisma = new PrismaClient();

// GET /api/admin/users - Listar usuarios (solo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuario actual y verificar rol
    const currentUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Permitir filtrar por rol: /api/admin/users?role=cliente
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const allowedRoles: UserRole[] = ['cliente', 'admin', 'maestro'];
    const users = await prisma.user.findMany({
      where: roleFilter && allowedRoles.includes(roleFilter as UserRole) ? { role: roleFilter as UserRole } : undefined,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 