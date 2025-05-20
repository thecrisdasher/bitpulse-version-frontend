import { NextRequest, NextResponse } from 'next/server';
import { getFavoriteInstruments, toggleInstrumentFavorite } from '@/lib/mockData';

/**
 * GET /api/market/favorites
 * Obtiene todos los instrumentos marcados como favoritos
 */
export async function GET() {
  try {
    const favorites = getFavoriteInstruments();
    
    return NextResponse.json({
      favorites,
      count: favorites.length,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error('Error en API market/favorites:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market/favorites
 * Marca/desmarca un instrumento como favorito
 * Body: { instrumentId: string }
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
    
    toggleInstrumentFavorite(body.instrumentId);
    const updatedFavorites = getFavoriteInstruments();
    
    return NextResponse.json({
      message: 'Favorito actualizado correctamente',
      favorites: updatedFavorites,
      count: updatedFavorites.length,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error('Error en API market/favorites:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar favorito' },
      { status: 500 }
    );
  }
} 