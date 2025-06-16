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
        isActive: true,
        pejecoins: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map(u => ({
      ...u,
      status: u.isActive ? 'active' : 'inactive',
    }))

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/admin/users - Crear un nuevo usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      role = 'cliente',
      password = 'ChangeMe123!',
      pejecoins = 0,
      isActive = true,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await (await import('@/lib/utils/security')).SecurityUtils.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username: email.split('@')[0],
        role,
        password: hashedPassword,
        pejecoins,
        isActive,
      },
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

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 