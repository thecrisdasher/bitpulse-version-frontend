import { NextRequest, NextResponse } from 'next/server';
import { getFavoriteInstruments, toggleInstrumentFavorite } from '@/lib/mockData';

/**
 * GET /api/market/favorites
 * Obtiene todos los instrumentos marcados como favoritos
 */
export async function GET() {
  try {
    const mockFavorites = getFavoriteInstruments();
    
    // Fetch real-time ticker data from Binance directly
    try {
      // Build list of symbols (exclude USDT itself)
      const baseSymbols = mockFavorites.map(inst => inst.symbol).filter(sym => sym !== 'USDT');
      if (baseSymbols.length > 0) {
        const fullSymbols = baseSymbols.map(sym => `${sym}USDT`);
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(fullSymbols))}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Binance API error ${resp.status}`);
        const data = await resp.json(); // Array of tickers
        const mapping: Record<string, { price: number; change24h: number }> = {};
        data.forEach((item: any) => {
          const base = String(item.symbol).replace(/USDT$/i, '');
          mapping[base] = {
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
          };
        });
        const enhancedFavorites = mockFavorites.map(inst => ({
          ...inst,
          price: mapping[inst.symbol]?.price ?? inst.price,
          change24h: mapping[inst.symbol]?.change24h ?? inst.change24h,
          hasRealTime: mapping[inst.symbol] != null,
          lastUpdated: mapping[inst.symbol] ? new Date() : inst.lastUpdated
        }));
        return NextResponse.json({
          favorites: enhancedFavorites,
          count: enhancedFavorites.length,
          timestamp: Date.now(),
          success: true
        });
      }
      // If no symbols to fetch, return mock favorites
      return NextResponse.json({
        favorites: mockFavorites,
        count: mockFavorites.length,
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('Error al obtener tickers de Binance:', error);
      // Fallback a datos simulados
      return NextResponse.json({
        favorites: mockFavorites,
        count: mockFavorites.length,
        timestamp: Date.now(),
        success: true,
        message: 'Error en datos reales; usando datos de mock'
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