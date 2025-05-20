import { NextRequest, NextResponse } from 'next/server';
import { allMarketInstruments, MarketInstrument } from '@/lib/mockData';

/**
 * GET /api/market/search?q=texto
 * Busca instrumentos que coincidan con el texto en nombre o símbolo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Se requiere un término de búsqueda de al menos 2 caracteres' },
        { status: 400 }
      );
    }
    
    // Búsqueda insensible a mayúsculas/minúsculas
    const normalizedQuery = query.toLowerCase();
    
    const results = allMarketInstruments.filter(instrument => 
      instrument.name.toLowerCase().includes(normalizedQuery) || 
      instrument.symbol.toLowerCase().includes(normalizedQuery)
    );
    
    // Ordenar resultados: primero los que comienzan con la búsqueda, luego por nombre
    const sortedResults = [...results].sort((a, b) => {
      const aStartsWithName = a.name.toLowerCase().startsWith(normalizedQuery);
      const bStartsWithName = b.name.toLowerCase().startsWith(normalizedQuery);
      const aStartsWithSymbol = a.symbol.toLowerCase().startsWith(normalizedQuery);
      const bStartsWithSymbol = b.symbol.toLowerCase().startsWith(normalizedQuery);
      
      if (aStartsWithSymbol && !bStartsWithSymbol) return -1;
      if (!aStartsWithSymbol && bStartsWithSymbol) return 1;
      if (aStartsWithName && !bStartsWithName) return -1;
      if (!aStartsWithName && bStartsWithName) return 1;
      
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({
      query: query,
      results: sortedResults,
      count: sortedResults.length,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error('Error en API market/search:', error);
    return NextResponse.json(
      { error: error.message || 'Error al buscar instrumentos' },
      { status: 500 }
    );
  }
} 