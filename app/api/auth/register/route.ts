import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { SecurityUtils } from '@/lib/utils/security';
import type { RegisterData } from '@/lib/types/auth';
import { prisma } from '@/lib/db';

/**
 * API Route para registro de usuarios
 * POST /api/auth/register
 */

async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Verify reCAPTCHA token
    const { recaptchaToken } = body;
    if (!recaptchaToken) {
      return NextResponse.json({
        success: false,
        message: 'reCAPTCHA es requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    // Validate with Google reCAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const params = new URLSearchParams({ secret: secretKey || '', response: recaptchaToken });
    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const recaptchaJson = await recaptchaRes.json();
    if (!recaptchaJson.success || (recaptchaJson.score ?? 0) < 0.5) {
      return NextResponse.json({
        success: false,
        message: 'reCAPTCHA inválido',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
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
      recaptchaToken,
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

    // Configurar aprobación manual por admin
    const now = new Date();
    const approvalExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días
    
    await prisma.user.update({
      where: { email: registerData.email },
      data: { 
        emailConfirmed: true, // Se confirma automáticamente
        adminApprovalRequired: true,
        adminApprovalRequestedAt: now,
        adminApprovalExpiresAt: approvalExpiresAt,
        adminApproved: false
      }
    });

    // Responder con instrucción de esperar aprobación del admin
    return NextResponse.json(
      { 
        success: true, 
        message: 'Registro exitoso. Tu cuenta ha sido enviada para revisión por el administrador. Recibirás una respuesta en un máximo de 3 días hábiles.',
        requiresAdminApproval: true
      },
      { status: 201 }
    );

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

// Export the handler directly for Next.js API route
export const POST = handleRegister; 