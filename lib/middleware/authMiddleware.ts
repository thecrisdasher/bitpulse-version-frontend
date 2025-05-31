import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '../services/jwtService';
import { AUTH_CONFIG } from '../config/auth';
import type { Permission, UserRole } from '../types/auth';

/**
 * Middleware de autenticación para Next.js
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

/**
 * Middleware que verifica si el usuario está autenticado
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token de acceso requerido',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const userInfo = await JWTService.getUserFromToken(token);

    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token inválido o expirado',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Agregar información del usuario al request
    (request as AuthenticatedRequest).user = userInfo;

    return await handler(request as AuthenticatedRequest);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error de autenticación',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }
}

/**
 * Middleware que verifica permisos específicos
 */
export function requirePermission(permission: Permission) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    return requireAuth(request, async (req: AuthenticatedRequest) => {
      if (!req.user?.permissions.includes(permission as string)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Permisos insuficientes',
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Middleware que verifica roles específicos
 */
export function requireRole(role: UserRole) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    return requireAuth(request, async (req: AuthenticatedRequest) => {
      if (req.user?.role !== role) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rol insuficiente',
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Middleware que verifica múltiples roles
 */
export function requireAnyRole(roles: UserRole[]) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    return requireAuth(request, async (req: AuthenticatedRequest) => {
      if (!req.user?.role || !roles.includes(req.user.role)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Rol insuficiente',
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return await handler(req);
    });
  };
}

/**
 * Middleware de rate limiting básico (en producción usar Redis)
 */
export class RateLimiter {
  private static requests: Map<string, { count: number; timestamp: number }> = new Map();

  static middleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    return async (
      request: NextRequest,
      handler: (req: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const ip = this.getClientIP(request);
      const key = `rate_limit:${ip}`;
      const now = Date.now();

      const existing = this.requests.get(key);

      if (!existing || now - existing.timestamp > windowMs) {
        // Nueva ventana de tiempo
        this.requests.set(key, { count: 1, timestamp: now });
      } else {
        // Incrementar contador
        existing.count++;
        
        if (existing.count > maxRequests) {
          return NextResponse.json(
            {
              success: false,
              message: 'Demasiadas solicitudes. Intente más tarde.',
              timestamp: new Date().toISOString()
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil(windowMs / 1000).toString()
              }
            }
          );
        }
      }

      return await handler(request);
    };
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }

    return 'unknown';
  }
}

/**
 * Middleware de CORS para APIs
 */
export function corsMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return new Promise(async (resolve) => {
    // Manejar preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '3600');
      
      resolve(response);
      return;
    }

    // Ejecutar handler y agregar headers CORS
    const response = await handler(request);
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    resolve(response);
  });
}

/**
 * Middleware que combina múltiples middlewares
 */
export function combineMiddlewares(
  ...middlewares: Array<(req: NextRequest, handler: any) => Promise<NextResponse>>
) {
  return async (
    request: NextRequest,
    finalHandler: (req: any) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    let currentHandler = finalHandler;

    // Aplicar middlewares en orden inverso
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const nextHandler = currentHandler;
      
      currentHandler = async (req: NextRequest) => {
        return await middleware(req, nextHandler);
      };
    }

    return await currentHandler(request);
  };
}

/**
 * Middleware de validación de JSON
 */
export async function validateJSON(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
    try {
      await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'JSON inválido en el cuerpo de la solicitud',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
  }

  return await handler(request);
}

/**
 * Middleware de sanitización de headers
 */
export function sanitizeHeaders(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Agregar headers de seguridad
  return handler(request).then(response => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Solo agregar HSTS en HTTPS
    if (request.url.startsWith('https://')) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  });
} 