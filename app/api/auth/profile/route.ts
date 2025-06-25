import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import { sanitizeHeaders, validateJSON } from '@/lib/middleware/authMiddleware';
import { SecurityUtils } from '@/lib/utils/security';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

/**
 * API Routes para perfil de usuario
 * GET /api/auth/profile - Obtener perfil usando cookie de sesión
 * PUT /api/auth/profile - Actualizar perfil usando cookie de sesión
 */

async function handleGetProfile(request: NextRequest): Promise<NextResponse> {
  // Obtener sesión desde cookie o header
  const session = await createSessionFromRequest(request as any);
  if (!session) {
    return NextResponse.json({ success: false, message: 'No autorizado', timestamp: new Date().toISOString() }, { status: 401 });
    }
  // Leer usuario de DB
  const dbUser = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!dbUser) {
    return NextResponse.json({ success: false, message: 'Usuario no encontrado', timestamp: new Date().toISOString() }, { status: 404 });
  }
  // Mapear a tipo Auth.User
  const user = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    phone: dbUser.phone,
    bio: dbUser.bio,
    role: dbUser.role,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    lastLogin: dbUser.lastLogin?.toISOString(),
    isActive: dbUser.isActive,
    profilePicture: dbUser.profilePicture || undefined,
    preferences: dbUser.preferences || undefined,
    pejecoins: dbUser.pejecoins,
    twoFactorEnabled: dbUser.twoFactorEnabled || false,
    twoFactorSecret: !!dbUser.twoFactorSecret // Solo retorna si existe, no el valor
  };
  return NextResponse.json({ success: true, data: user, timestamp: new Date().toISOString() });
}

async function handleUpdateProfile(request: NextRequest): Promise<NextResponse> {
  // Obtener sesión
  const session = await createSessionFromRequest(request as any);
  if (!session) {
    return NextResponse.json({ success: false, message: 'No autorizado', timestamp: new Date().toISOString() }, { status: 401 });
    }
    const body = await request.json();

    // Sanitizar inputs permitidos
    const allowedFields = ['firstName', 'lastName', 'username', 'phone', 'bio'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = SecurityUtils.sanitizeInput(body[field]);
      }
    }

    // Validar que al menos un campo se esté actualizando
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Al menos un campo debe ser proporcionado para actualizar',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validar username si se está actualizando
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 20) {
        return NextResponse.json(
          {
            success: false,
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
        return NextResponse.json(
          {
            success: false,
            message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
    }

  // Obtener datos actuales del usuario para comparar cambios
  const currentUser = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!currentUser) {
    return NextResponse.json({ success: false, message: 'Usuario no encontrado', timestamp: new Date().toISOString() }, { status: 404 });
    }

  // Actualizar usuario en DB
  const updated = await prisma.user.update({ where: { id: session.sub }, data: updateData });

  // Registrar cambios en el historial
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const changePromises = [];
  
  // Registrar cada campo que cambió
  for (const [field, newValue] of Object.entries(updateData)) {
    const oldValue = (currentUser as any)[field];
    if (oldValue !== newValue) {
      changePromises.push(
        prisma.profileChangeHistory.create({
          data: {
            userId: session.sub,
            field,
            oldValue: oldValue?.toString() || null,
            newValue: newValue?.toString() || null,
            ipAddress,
            userAgent,
          }
        })
      );
    }
  }

  // Ejecutar todas las inserciones del historial
  if (changePromises.length > 0) {
    await Promise.all(changePromises);
  }
  // Mapear usuario actualizado para la respuesta
  const user = {
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    phone: updated.phone,
    bio: updated.bio,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    lastLogin: updated.lastLogin?.toISOString(),
    isActive: updated.isActive,
    profilePicture: updated.profilePicture || undefined,
    preferences: updated.preferences || undefined,
    pejecoins: updated.pejecoins,
    twoFactorEnabled: updated.twoFactorEnabled || false,
    twoFactorSecret: !!updated.twoFactorSecret // Solo retorna si existe, no el valor
  };
  // Registrar actividad de usuario
  logger.logUserActivity('profile_updated', session.sub, { updatedFields: Object.keys(updateData) });
  return NextResponse.json({ success: true, data: user, timestamp: new Date().toISOString() });
}

// Aplicar middlewares
export const GET = sanitizeHeaders(handleGetProfile);
export const PUT = sanitizeHeaders(validateJSON(handleUpdateProfile)); 