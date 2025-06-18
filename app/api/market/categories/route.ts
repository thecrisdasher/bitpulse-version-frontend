import { NextRequest, NextResponse } from 'next/server';
import {
  MarketCategory,
  getInstrumentsByCategory,
  allMarketInstruments
} from '@/lib/mockData';

// Categorías con información adicional (iconos, etiquetas, etc.)
const categoryDetails = {
  "favoritos": {
    id: "favoritos",
    label: "Favoritos",
    icon: "star"
  },
  "derivados": {
    id: "derivados",
    label: "Derivados",
    icon: "dollar-sign"
  },
  "baskets": {
    id: "baskets",
    label: "Baskets",
    icon: "shopping-basket"
  },
  "sinteticos": {
    id: "sinteticos",
    label: "Índices Sintéticos",
    icon: "activity",
    subcategories: [
      { id: "volatility", label: "Volatility" },
      { id: "boom", label: "Boom" },
      { id: "crash", label: "Crash" }
    ]
  },
  "forex": {
    id: "forex",
    label: "Forex",
    icon: "dollar-sign"
  },
  "indices": {
    id: "indices",
    label: "Índices Bursátiles",
    icon: "bar-chart-2"
  },
  "criptomonedas": {
    id: "criptomonedas",
    label: "Criptomonedas",
    icon: "bitcoin"
  },
  "materias-primas": {
    id: "materias-primas",
    label: "Materias Primas",
    icon: "gem"
  },
  "acciones": {
    id: "acciones",
    label: "Acciones",
    icon: "trending-up"
  }
};

/**
 * GET /api/market/categories
 * Obtiene todas las categorías con sus detalles
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const withInstruments = searchParams.get('with_instruments') === 'true';
    
    let response: any = { categories: categoryDetails };
    
    // Si se solicitan los instrumentos, agregar a la respuesta
    if (withInstruments) {
      const instrumentsByCategory: Record<string, any[]> = {};
      
      (Object.keys(categoryDetails) as MarketCategory[]).forEach(category => {
        instrumentsByCategory[category] = getInstrumentsByCategory(category);
      });
      
      response.instruments = instrumentsByCategory;
    }
    
    return NextResponse.json({
      ...response,
      allInstruments: withInstruments ? allMarketInstruments : undefined,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error('Error en API market/categories:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener categorías de mercado' },
      { status: 500 }
    );
  }
} 