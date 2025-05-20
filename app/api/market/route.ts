import { NextRequest, NextResponse } from 'next/server';
import { getMarketData, getBatchMarketData } from '@/lib/api/marketDataService';

// API handlers para datos de mercado

/**
 * GET /api/market?symbol=btcusd&category=cripto
 * Obtiene datos para un instrumento específico
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const category = searchParams.get('category');
    const baseValueParam = searchParams.get('baseValue');
    const baseValue = baseValueParam ? parseInt(baseValueParam, 10) : undefined;

    if (!symbol || !category) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros symbol y category' },
        { status: 400 }
      );
    }

    const data = await getMarketData(symbol, category, baseValue);
    
    return NextResponse.json({ 
      data,
      timestamp: Date.now(),
      success: true 
    });
  } catch (error: any) {
    console.error('Error en API market:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos de mercado' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market/batch
 * Obtiene datos para múltiples instrumentos en paralelo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.instruments || !Array.isArray(body.instruments) || body.instruments.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de instrumentos válido' },
        { status: 400 }
      );
    }

    const data = await getBatchMarketData(body.instruments);
    
    return NextResponse.json({ 
      data,
      timestamp: Date.now(),
      success: true 
    });
  } catch (error: any) {
    console.error('Error en API market/batch:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos batch de mercado' },
      { status: 500 }
    );
  }
} 