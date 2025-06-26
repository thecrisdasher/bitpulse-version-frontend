import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { jwtVerify } from 'jose';

const locales = ['es', 'en'];
const defaultLocale = 'es';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/change-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/change-password',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/public'
];

// Rutas privadas que requieren autenticación específica
const PRIVATE_ROUTES = [
  '/',
  '/posiciones-abiertas',
  '/portfolio',
  '/markets',
  '/settings',
  '/statistics',

  '/help',
  '/chat',
  '/crm'
];

// Rutas que requieren roles específicos
const ROLE_BASED_ROUTES = {
  '/admin': ['admin'],
  '/api/admin': ['admin'],
  '/maestro': ['maestro', 'admin'],
  '/api/maestro': ['maestro', 'admin'],
  '/analytics': ['admin', 'maestro'],
  '/users': ['admin'],
  '/logs': ['admin'],
  '/crm': ['admin', 'maestro']
};

// Obtener el idioma preferido basado en las cabeceras de aceptación
function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();
  
  const url = new URL(request.url);
  const urlLocale = url.searchParams.get('locale');
  
  if (urlLocale && locales.includes(urlLocale)) {
    return urlLocale;
  }
  
  try {
    return match(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

// Verificar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

// Verificar si una ruta requiere autenticación
function requiresAuth(pathname: string): boolean {
  return PRIVATE_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Verificar acceso basado en rol
function checkRoleAccess(pathname: string, userRole: string): boolean {
  for (const [routePattern, allowedRoles] of Object.entries(ROLE_BASED_ROUTES)) {
    if (pathname.startsWith(routePattern)) {
      return allowedRoles.includes(userRole);
    }
  }
  return true; // Si no hay restricción específica, permitir acceso
}

// Obtener IP del request de forma segura
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectingIP = request.headers.get('x-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (connectingIP) {
    return connectingIP;
  }
  
  return 'unknown';
}

// Verificar y decodificar JWT
async function verifyJWTToken(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    );
    
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Crear respuesta de redirección a login
function createLoginRedirect(request: NextRequest, reason: string = 'unauthorized') {
  const url = new URL('/auth', request.url);
  url.searchParams.set('redirect', request.nextUrl.pathname);
  url.searchParams.set('reason', reason);
  
  const response = NextResponse.redirect(url);
  
  // Limpiar cookies de autenticación inválidas
  response.cookies.delete('bitpulse_session');
  response.cookies.delete('auth_tokens');
  response.cookies.delete('user_preferences');
  
  return response;
}

// Registrar actividad del usuario para logs
async function logUserActivity(request: NextRequest, userId?: string, action: string = 'page_visit') {
  try {
    const logData = {
      userId: userId || 'anonymous',
      action,
      pathname: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request),
      timestamp: new Date().toISOString(),
      referer: request.headers.get('referer') || null
    };

    // En producción, esto se enviaría a un sistema de logs
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ACTIVITY LOG]', logData);
    }

    // TODO: Implementar envío a sistema de logs cuando esté configurado
    
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Verificar la cookie para el idioma preferido del usuario
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  // Obtener el idioma del usuario
  const locale = cookieLocale && locales.includes(cookieLocale) 
    ? cookieLocale 
    : getLocale(request);

  // Crear respuesta base
  const response = NextResponse.next();

  // Configurar la cookie del idioma
  if (!cookieLocale || cookieLocale !== locale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 // 1 año
    });
  }

  // Si es ruta pública, permitir acceso sin autenticación
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Verificar autenticación para rutas privadas
  if (requiresAuth(pathname)) {
    // Intentar obtener token desde diferentes fuentes
    let authToken = request.cookies.get('bitpulse_session')?.value;
    
    if (!authToken) {
      // Intentar desde header Authorization
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
      }
    }

    if (!authToken) {
      await logUserActivity(request, undefined, 'unauthorized_access_attempt');
      return createLoginRedirect(request, 'no_token');
    }

    // Verificar validez del token
    const payload = await verifyJWTToken(authToken);
    
    if (!payload) {
      await logUserActivity(request, undefined, 'invalid_token_access_attempt');
      return createLoginRedirect(request, 'invalid_token');
    }

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      await logUserActivity(request, payload.sub as string, 'expired_token_access_attempt');
      return createLoginRedirect(request, 'token_expired');
    }

    // Verificar acceso basado en rol
    const userRole = payload.role as string;
    if (!checkRoleAccess(pathname, userRole)) {
      await logUserActivity(request, payload.sub as string, 'insufficient_permissions');
      
      // Encontrar qué roles se requieren para esta ruta
      let requiredRoles: string[] = [];
      for (const [routePattern, allowedRoles] of Object.entries(ROLE_BASED_ROUTES)) {
        if (pathname.startsWith(routePattern)) {
          requiredRoles = allowedRoles;
          break;
        }
      }
      
      const forbiddenUrl = new URL('/auth', request.url);
      forbiddenUrl.searchParams.set('error', 'insufficient_permissions');
      if (requiredRoles.length > 0) {
        forbiddenUrl.searchParams.set('required_role', JSON.stringify(requiredRoles));
      }
      
      return NextResponse.redirect(forbiddenUrl);
    }

    // Usuario autenticado - verificar si debe cambiar contraseña
    if (payload.mustChangePassword && pathname !== '/auth/change-password') {
      // Redirigir a la página de cambio de contraseña obligatorio
      const changePasswordUrl = new URL('/auth/change-password', request.url);
      changePasswordUrl.searchParams.set('required', 'true');
      return NextResponse.redirect(changePasswordUrl);
    }
    
    await logUserActivity(request, payload.sub as string, 'authenticated_access');
    
    // Agregar información del usuario a headers para uso en la aplicación
    response.headers.set('x-user-id', payload.sub as string);
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-user-email', payload.email as string);
    
    // Configurar cookie de sesión segura si no existe
    if (!request.cookies.get('bitpulse_session')) {
      response.cookies.set('bitpulse_session', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 horas
        path: '/'
      });
    }

    return response;
  }

  // Para rutas que no requieren verificación específica
  return response;
}

export const config = {
  // Incluir todas las rutas excepto archivos estáticos y API de Next.js
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - file extensions
     */
    '/((?!api/public|_next/static|_next/image|favicon.ico|public|.*\\.[^/]*$).*)',
  ],
}; 