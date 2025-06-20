import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
import { SecurityUtils } from '@/lib/utils/security';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } });
    if (!currentUser || currentUser.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
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

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (role) data.role = role;
    if (typeof pejecoins !== 'undefined') data.pejecoins = pejecoins;
    if (typeof isActive !== 'undefined') data.isActive = isActive;
    if (password) data.password = await SecurityUtils.hashPassword(password);

    const updated = await prisma.user.update({
      where: { id: params.id },
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