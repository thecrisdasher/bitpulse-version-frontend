import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma, User } from '@/lib/db'; // Usar el mock de DB

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface AuthPayload {
  sub: string; // User ID
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verifica el token JWT de la solicitud y devuelve el usuario autenticado.
 * Busca el token en las cookies o en el header 'Authorization'.
 * @param request - El objeto NextRequest o Request.
 * @returns Un objeto con el usuario autenticado o null si no está autenticado.
 */
export async function getAuth(request: Request | NextRequest): Promise<{ user: User | null }> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('bitpulse_session')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return { user: null };
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: AuthPayload };

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn('Token has expired');
      return { user: null };
    }

    // Obtener el usuario de la base de datos para asegurar que exista
    // y tener los datos más actualizados.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.warn(`User with ID ${payload.sub} not found`);
      return { user: null };
    }

    return { user };

  } catch (error) {
    console.error('Authentication error in getAuth:', error);
    return { user: null };
  }
} 