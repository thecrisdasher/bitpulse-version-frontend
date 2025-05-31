import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { requireAuth, sanitizeHeaders, validateJSON, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { SecurityUtils } from '@/lib/utils/security';

/**
 * API Routes para perfil de usuario
 * GET /api/auth/profile - Obtener perfil
 * PUT /api/auth/profile - Actualizar perfil
 */

async function handleGetProfile(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token de acceso requerido',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const result = await AuthService.getUserProfile(token);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 404 
    });

  } catch (error) {
    console.error('Get profile error:', error);
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

async function handleUpdateProfile(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token de acceso requerido',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const body = await request.json();

    // Sanitizar inputs permitidos
    const allowedFields = ['firstName', 'lastName', 'username'];
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

    const result = await AuthService.updateUserProfile(token, updateData);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error) {
    console.error('Update profile error:', error);
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

// Aplicar middlewares
export const GET = sanitizeHeaders(handleGetProfile);
export const PUT = sanitizeHeaders(validateJSON(handleUpdateProfile)); 