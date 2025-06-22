import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

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

    // Permitir filtrar por rol y estado de aprobación
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const approvalFilter = searchParams.get('approval'); // 'pending', 'approved', 'rejected'

    const allowedRoles: UserRole[] = ['cliente', 'admin', 'maestro'];
    
    let whereClause: any = {};
    
    // Filtro por rol
    if (roleFilter && allowedRoles.includes(roleFilter as UserRole)) {
      whereClause.role = roleFilter as UserRole;
    }
    
    // Filtro por estado de aprobación
    if (approvalFilter) {
      switch (approvalFilter) {
        case 'pending':
          whereClause.adminApprovalRequired = true;
          whereClause.adminApproved = false;
          whereClause.adminApprovalExpiresAt = { gte: new Date() }; // No expirados
          break;
        case 'approved':
          whereClause.adminApproved = true;
          break;
        case 'rejected':
          whereClause.adminApprovalRequired = true;
          whereClause.adminApproved = false;
          whereClause.isActive = false;
          break;
        case 'expired':
          whereClause.adminApprovalRequired = true;
          whereClause.adminApproved = false;
          whereClause.adminApprovalExpiresAt = { lt: new Date() }; // Expirados
          break;
      }
    }

    const users = await prisma.user.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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
        emailConfirmed: true,
        adminApprovalRequired: true,
        adminApproved: true,
        adminApprovalRequestedAt: true,
        adminApprovalExpiresAt: true,
        adminApprovedBy: true,
        adminApprovalNotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u: any) => ({
      ...u,
      status: u.isActive ? 'active' : 'inactive',
      approvalStatus: getApprovalStatus(u),
      daysUntilExpiry: u.adminApprovalExpiresAt ? 
        Math.ceil((new Date(u.adminApprovalExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        null
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función auxiliar para determinar el estado de aprobación
function getApprovalStatus(user: any): string {
  if (!user.adminApprovalRequired) {
    return 'not_required'; // Usuarios creados antes del sistema o por admin
  }
  
  if (user.adminApproved) {
    return 'approved';
  }
  
  if (!user.isActive && !user.adminApproved) {
    return 'rejected';
  }
  
  if (user.adminApprovalExpiresAt && new Date(user.adminApprovalExpiresAt) < new Date()) {
    return 'expired';
  }
  
  return 'pending';
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
        // Configuración específica para usuarios creados por admin
        emailConfirmed: true, // Ya están confirmados
        adminApprovalRequired: false, // No requieren aprobación adicional
        adminApproved: true, // Ya están aprobados por el admin que los creó
        adminApprovedBy: session.sub, // Quién los aprobó
        adminApprovalNotes: 'Usuario creado directamente por administrador',
        // Marcar que debe cambiar contraseña en primer login
        mustChangePassword: true, // Usuario debe cambiar contraseña en primer login
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        pejecoins: true,
        isActive: true,
        emailConfirmed: true,
        adminApproved: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 