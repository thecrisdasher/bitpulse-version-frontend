import { NextRequest, NextResponse } from 'next/server';
import { getInstrumentsByCategory, MarketCategory } from '@/lib/mockData';

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
    
    // Validar que la categoría sea válida
    const validCategories: MarketCategory[] = [
      "favoritos", "derivados", "baskets", "sinteticos", 
      "forex", "indices", "criptomonedas", "materias-primas"
    ];
    
    if (!validCategories.includes(category as MarketCategory)) {
      return NextResponse.json(
        { error: `Categoría '${category}' no válida` },
        { status: 400 }
      );
    }
    
    const instruments = getInstrumentsByCategory(category as MarketCategory);
    
    return NextResponse.json({
      category,
      instruments,
      count: instruments.length,
      timestamp: Date.now(),
      success: true
    });
  } catch (error: any) {
    console.error(`Error en API market/categories/${params.category}:`, error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener instrumentos de la categoría' },
      { status: 500 }
    );
  }
} 