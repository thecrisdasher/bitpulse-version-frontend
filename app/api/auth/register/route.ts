import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { combineMiddlewares, RateLimiter, sanitizeHeaders, validateJSON } from '@/lib/middleware/authMiddleware';
import { SecurityUtils } from '@/lib/utils/security';
import type { RegisterData } from '@/lib/types/auth';

/**
 * API Route para registro de usuarios
 * POST /api/auth/register
 */

async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    const requiredFields = ['email', 'username', 'firstName', 'lastName', 'password', 'confirmPassword'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `El campo ${field} es requerido`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }
    }

    // Sanitizar inputs
    const registerData: RegisterData = {
      email: SecurityUtils.sanitizeInput(body.email).toLowerCase(),
      username: SecurityUtils.sanitizeInput(body.username),
      firstName: SecurityUtils.sanitizeInput(body.firstName),
      lastName: SecurityUtils.sanitizeInput(body.lastName),
      password: body.password, // No sanitizar contraseña
      confirmPassword: body.confirmPassword, // No sanitizar contraseña
      acceptTerms: Boolean(body.acceptTerms)
    };

    // Validar formato de email
    if (!SecurityUtils.validateEmail(registerData.email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de email inválido',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validar longitud del username
    if (registerData.username.length < 3 || registerData.username.length > 20) {
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre de usuario debe tener entre 3 y 20 caracteres',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validar caracteres del username
    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Intentar registro
    const result = await AuthService.register(registerData);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
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
export const POST = combineMiddlewares(
  sanitizeHeaders,
  validateJSON,
  RateLimiter.middleware(5, 15 * 60 * 1000) // 5 registros por 15 minutos
)(handleRegister); 