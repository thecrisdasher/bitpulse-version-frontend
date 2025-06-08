import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { SecurityUtils } from '@/lib/utils/security';
import type { RegisterData } from '@/lib/types/auth';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/services/emailService';

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

    // Generar token de confirmación de email
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Guardar token de confirmación de email (cast a any para evitar errores de TS)
    await (prisma.user as any).update({
      where: { email: registerData.email },
      data: { emailConfirmationToken: token, emailConfirmationExpiresAt: expiresAt }
    });

    // Enviar email de confirmación (Ethereal fallback si no hay SMTP)
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm?token=${token}`;
    try {
      await sendConfirmationEmail(registerData.email, confirmUrl);
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
    }

    // Responder con instrucción de revisar email
    return NextResponse.json(
      { success: true, message: 'Registro exitoso. Revisa tu correo para confirmarlo. Revisa la consola para un enlace de vista previa si estás en desarrollo.' },
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