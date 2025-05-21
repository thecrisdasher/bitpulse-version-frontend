import { NextRequest, NextResponse } from 'next/server';
import { MarketInstrument } from '@/lib/mockData';
import { getBatchMarketData } from '@/lib/api/marketDataService';

// Función auxiliar para buscar instrumentos
const searchInstruments = (query: string): MarketInstrument[] => {
  try {
    // En un entorno real, esto sería una llamada a la base de datos
    // Por ahora, importamos los instrumentos desde el mockData
    const { cryptocurrencies } = require('@/lib/mockData');
    
    // Convertir a MarketInstrument[] para la búsqueda
    const instrumentsToSearch: MarketInstrument[] = cryptocurrencies.map((crypto: any) => ({
      id: crypto.id.toString(),
      name: crypto.name,
      symbol: crypto.symbol,
      category: 'criptomonedas',
      price: crypto.price,
      change24h: crypto.change24h,
      change7d: crypto.change7d,
      isFavorite: false,
      hasRealTime: true
    }));
    
    // Añadir otros instrumentos de diferentes categorías
    // En producción, esto sería una consulta más compleja
    
    // Realizar la búsqueda
    const normalizedQuery = query.toLowerCase();
    return instrumentsToSearch.filter(
      instrument => 
        instrument.name.toLowerCase().includes(normalizedQuery) || 
        instrument.symbol.toLowerCase().includes(normalizedQuery)
    );
  } catch (error) {
    console.error('Error al buscar instrumentos:', error);
    return [];
  }
};

/**
 * GET /api/market/search?query=bitcoin
 * Busca instrumentos que coincidan con la consulta
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'La consulta de búsqueda debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }
    
    // Buscar instrumentos que coincidan con la consulta
    const matchedInstruments = searchInstruments(query);
    
    if (matchedInstruments.length === 0) {
      return NextResponse.json({
        instruments: [],
        count: 0,
        timestamp: Date.now(),
        success: true
      });
    }
    
    // Preparar solicitudes en batch para datos en tiempo real
    const dataRequests = matchedInstruments.map(instrument => ({
      symbol: instrument.symbol,
      category: instrument.category
    }));
    
    try {
      // Intentar obtener datos en tiempo real para todos los instrumentos
      const realTimeData = await getBatchMarketData(dataRequests);
      
      // Mejorar datos simulados con información en tiempo real
      const enhancedInstruments = matchedInstruments.map(instrument => {
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
        instruments: enhancedInstruments,
        count: enhancedInstruments.length,
        query,
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      // Si falla la obtención de datos en tiempo real, devolver datos simulados
      console.error('Error al obtener datos en tiempo real:', error);
      return NextResponse.json({
        instruments: matchedInstruments,
        count: matchedInstruments.length,
        query,
        timestamp: Date.now(),
        success: true,
        message: 'Datos obtenidos de caché local, error en tiempo real'
      });
    }
  } catch (error: any) {
    console.error('Error en API search:', error);
    return NextResponse.json(
      { error: error.message || 'Error al buscar instrumentos' },
      { status: 500 }
    );
  }
} 