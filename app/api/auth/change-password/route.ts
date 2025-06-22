import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { SecurityUtils } from '@/lib/utils/security';
import { prisma } from '@/lib/db';

/**
 * API Route para cambio de contraseña
 * POST /api/auth/change-password
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const session = await createSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, isFirstTimeChange } = await request.json();

    // Validar datos de entrada
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Contraseña actual y nueva son requeridas' },
        { status: 400 }
      );
    }

    // Obtener usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        mustChangePassword: true, // Campo para verificar si debe cambiar contraseña
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await SecurityUtils.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Contraseña actual incorrecta' },
        { status: 400 }
      );
    }

    // Validar fortaleza de la nueva contraseña
    const passwordStrength = SecurityUtils.validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'La nueva contraseña no cumple con los requisitos de seguridad',
          errors: passwordStrength.errors
        },
        { status: 400 }
      );
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await SecurityUtils.verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, message: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await SecurityUtils.hashPassword(newPassword);

    // Actualizar contraseña en la base de datos
    const updateData: any = {
      password: hashedNewPassword,
      updatedAt: new Date(),
    };

    // Si es el primer cambio, marcar que ya no necesita cambiar contraseña
    if (isFirstTimeChange) {
      updateData.mustChangePassword = false; // Ya no necesita cambiar contraseña
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Registrar actividad del usuario
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: isFirstTimeChange ? 'first_time_password_change' : 'password_change',
        details: {
          timestamp: new Date().toISOString(),
          isFirstTimeChange,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 'unknown'
        }
      }
    });

    // Para primer cambio, limpiar la sesión para forzar nuevo login
    if (isFirstTimeChange) {
      const response = NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        requiresReauth: true, // Indica que debe hacer login nuevamente
        timestamp: new Date().toISOString()
      });

      // Limpiar cookies de sesión para forzar logout
      response.cookies.delete('bitpulse_session');
      response.cookies.delete('refresh_token');
      response.cookies.delete('user_info');

      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 