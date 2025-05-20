import { NextRequest, NextResponse } from 'next/server';
import { getMarketData } from '@/lib/api/marketDataService';

export interface RouteParams {
  params: {
    category: string;
    symbol: string;
  }
}

/**
 * GET /api/market/[category]/[symbol]
 * Obtiene datos para un instrumento específico usando segmentos de ruta
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { category, symbol } = params;
    
    if (!symbol || !category) {
      return NextResponse.json(
        { error: 'Se requieren categoría y símbolo válidos' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const baseValueParam = searchParams.get('baseValue');
    const baseValue = baseValueParam ? parseInt(baseValueParam, 10) : undefined;

    const data = await getMarketData(symbol, category, baseValue);
    
    return NextResponse.json({ 
      data,
      timestamp: Date.now(),
      success: true 
    });
  } catch (error: any) {
    console.error(`Error en API market/${params.category}/${params.symbol}:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos de mercado' },
      { status: 500 }
    );
  }
} 