import { NextRequest, NextResponse } from 'next/server';
import { getInstrumentsByCategory, MarketCategory } from '@/lib/mockData';
import { getMarketData, getBatchMarketData } from '@/lib/api/marketDataService';

/**
 * GET /api/market/categories/[category]
 * Obtiene todos los instrumentos de una categoría específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = params.category as MarketCategory;
    
    if (!category) {
      return NextResponse.json(
        { error: 'Se requiere una categoría' },
        { status: 400 }
      );
    }
    
    // Get instruments from mock data first
    const mockInstruments = getInstrumentsByCategory(category);
    
    // Prepare batch requests for real-time data
    const dataRequests = mockInstruments.map(instrument => ({
      symbol: instrument.symbol,
      category: instrument.category
    }));
    
    try {
      // Try to get real-time data for all instruments
      const realTimeData = await getBatchMarketData(dataRequests);
      
      // Enhance mock data with real-time data
      const enhancedInstruments = mockInstruments.map(instrument => {
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
      timestamp: Date.now(),
      success: true
    });
    } catch (error) {
      // If real-time data fails, return mock data
      console.error('Error fetching real-time data:', error);
      return NextResponse.json({
        instruments: mockInstruments,
        count: mockInstruments.length,
        timestamp: Date.now(),
        success: true,
        message: 'Datos obtenidos de caché local, error en tiempo real'
      });
    }
  } catch (error: any) {
    console.error('Error en API category:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener instrumentos' },
      { status: 500 }
    );
  }
} 