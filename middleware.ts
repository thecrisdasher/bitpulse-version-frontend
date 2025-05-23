import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['es', 'en'];
const defaultLocale = 'es';

// Obtener el idioma preferido basado en las cabeceras de aceptación
function getLocale(request: NextRequest): string {
  // Negociator espera un objeto con una propiedad 'headers' que es una función
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();
  
  // Verificar si hay un parámetro de idioma en la URL
  const url = new URL(request.url);
  const urlLocale = url.searchParams.get('locale');
  
  if (urlLocale && locales.includes(urlLocale)) {
    return urlLocale;
  }
  
  // Si no hay un parámetro en la URL, intentar hacer match con las cabeceras
  try {
    return match(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  // Verificar la cookie para el idioma preferido del usuario
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  // Obtener el idioma del usuario
  const locale = cookieLocale && locales.includes(cookieLocale) 
    ? cookieLocale 
    : getLocale(request);
  
  // Si la ruta ya incluye un locale, no redireccionar
  const pathname = request.nextUrl.pathname;
  
  // Clonamos la respuesta para modificarla
  const response = NextResponse.next();

  // Configurar la cookie del idioma
  if (!cookieLocale || cookieLocale !== locale) {
    response.cookies.set('NEXT_LOCALE', locale);
  }

  return response;
}

export const config = {
  // Excluir rutas específicas como API y archivos estáticos
  matcher: [
    /*
     * Hacer match con todas las rutas excepto:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /public (archivos públicos)
     * 4. archivos con extensión (archivos estáticos)
     */
    '/((?!api|_next|public|.*\\..*).*)',
  ],
}; 