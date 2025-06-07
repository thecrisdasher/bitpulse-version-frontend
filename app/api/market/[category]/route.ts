import { NextRequest, NextResponse } from 'next/server';
import { getInstrumentsByCategory } from '@/lib/mockData';

export interface RouteParams {
  params: {
    category: string;
  };
}

/**
 * GET /api/market/[category]
 * Returns all market instruments for a specific category
 */
export async function GET(request: NextRequest) {
  // Extract dynamic category segment from the URL
  const segments = request.nextUrl.pathname.split('/');
  const category = segments[segments.length - 1] || '';
  try {
    if (!category) {
      return NextResponse.json(
        { error: 'Se requiere categoría válida' },
        { status: 400 }
      );
    }
    const instruments = getInstrumentsByCategory(category as any);
    return NextResponse.json({
      data: instruments,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error(`Error en API market/${category}:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener instrumentos de mercado' },
      { status: 500 }
    );
  }
} 