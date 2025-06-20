import { NextRequest, NextResponse } from 'next/server';
import { } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSessionFromRequest } from '@/lib/auth/session';
interface ClientInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string | null;
  createdAt: Date;
}

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

// GET - Obtener clientes asignados al maestro actual
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo maestros y admins pueden acceder
    if (user.role !== 'admin' && user.role !== 'maestro') {
      return NextResponse.json({ error: 'No tienes permisos para ver clientes' }, { status: 403 });
    }

    let clients: ClientInfo[] = [];

    if (user.role === 'admin') {
      // Los admins pueden ver todos los clientes
      clients = await prisma.user.findMany({
        where: {
          role: 'cliente',
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
          createdAt: true
        },
        orderBy: { firstName: 'asc' }
      });
    } else if (user.role === 'maestro') {
      // Los maestros solo ven sus clientes asignados
      const assignments = await prisma.mentorAssignment.findMany({
        where: { mentorId: user.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
              createdAt: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });

      clients = assignments.map(assignment => assignment.user);
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching assigned clients:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 