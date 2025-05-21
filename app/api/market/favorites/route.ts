import { NextRequest, NextResponse } from 'next/server';
import { getFavoriteInstruments, toggleInstrumentFavorite } from '@/lib/mockData';
import { getBatchMarketData } from '@/lib/api/marketDataService';

/**
 * GET /api/market/favorites
 * Obtiene todos los instrumentos marcados como favoritos
 */
export async function GET() {
  try {
    // Obtener favoritos desde el mock
    const mockFavorites = getFavoriteInstruments();
    
    // Preparar solicitudes en batch para datos en tiempo real
    const dataRequests = mockFavorites.map(instrument => ({
      symbol: instrument.symbol,
      category: instrument.category
    }));
    
    try {
      // Intentar obtener datos en tiempo real para todos los instrumentos
      const realTimeData = await getBatchMarketData(dataRequests);
      
      // Mejorar datos simulados con información en tiempo real
      const enhancedFavorites = mockFavorites.map(instrument => {
        const rtData = realTimeData[instrument.symbol];
        if (rtData) {
          return {
            ...instrument,
            price: rtData.currentPrice,
            change24h: rtData.changePercent24h,
            lastUpdated: new Date(rtData.lastUpdated),
            hasRealTime: rtData.isRealTime
          };
        }
        return instrument;
      });
      
      return NextResponse.json({
        favorites: enhancedFavorites,
        count: enhancedFavorites.length,
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      // Si falla la obtención de datos en tiempo real, devolver datos simulados
      console.error('Error al obtener datos en tiempo real:', error);
      return NextResponse.json({
        favorites: mockFavorites,
        count: mockFavorites.length,
        timestamp: Date.now(),
        success: true,
        message: 'Datos obtenidos de caché local, error en tiempo real'
      });
    }
  } catch (error: any) {
    console.error('Error en API favorites:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market/favorites
 * Alterna el estado de favorito de un instrumento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.instrumentId) {
      return NextResponse.json(
        { error: 'Se requiere instrumentId' },
        { status: 400 }
      );
    }
    
    // Actualizar estado de favorito
    toggleInstrumentFavorite(body.instrumentId);
    
    return NextResponse.json({
      success: true,
      message: 'Estado de favorito actualizado',
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Error en API favorites POST:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar favorito' },
      { status: 500 }
    );
  }
} 