import { NextRequest, NextResponse } from 'next/server';
import { allMarketInstruments } from '@/lib/mockData';
import { getMarketData } from '@/lib/api/marketDataService';

/**
 * GET /api/market/instruments/[id]
 * Obtiene los detalles completos de un instrumento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instrumentId = params.id;
    
    // Buscar el instrumento en la base de datos
    const instrument = allMarketInstruments.find(i => i.id === instrumentId);
    
    if (!instrument) {
      return NextResponse.json(
        { error: `Instrumento con ID '${instrumentId}' no encontrado` },
        { status: 404 }
      );
    }
    
    // Intentar obtener datos de mercado en tiempo real
    let marketData = null;
    try {
      const category = Array.isArray(instrument.category) 
        ? instrument.category[0] 
        : instrument.category;
      
      marketData = await getMarketData(instrument.symbol, category);
    } catch (error) {
      console.warn(`No se pudieron obtener datos en tiempo real para ${instrumentId}:`, error);
      // Continuamos con los datos del instrumento base
    }
    
    // Si hay datos de mercado, los combinamos con los datos del instrumento
    const mergedData = marketData 
      ? {
          ...instrument,
          currentPrice: marketData.currentPrice,
          change24h: marketData.change24h,
          changePercent24h: marketData.changePercent24h,
          high24h: marketData.high24h,
          low24h: marketData.low24h,
          priceHistory: marketData.priceHistory,
          lastUpdated: marketData.lastUpdated
        }
      : instrument;
    
    return NextResponse.json({
      instrument: mergedData,
      hasRealTimeData: !!marketData,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error(`Error en API market/instruments/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener detalles del instrumento' },
      { status: 500 }
    );
  }
} 