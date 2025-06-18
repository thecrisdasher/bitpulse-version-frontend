import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createPosition, validatePosition } from '@/lib/trading/positionService';
import { ZodError } from 'zod';
import { TradePositionSchema } from '@/lib/types/trading';
import { prisma } from '@/lib/db';
import { checkAndCloseExpiredPositions } from '@/lib/services/positionAutoCloseService';

// Mapeo de instrumentos a símbolos de Binance
const CRYPTO_MAPPING: Record<string, string> = {
  'Bitcoin (BTC/USD)': 'BTCUSDT',
  'Bitcoin': 'BTCUSDT',
  'BTC': 'BTCUSDT',
  'Ethereum (ETH/USD)': 'ETHUSDT',
  'Ethereum': 'ETHUSDT', 
  'ETH': 'ETHUSDT',
  'Solana (SOL/USD)': 'SOLUSDT',
  'Solana': 'SOLUSDT',
  'SOL': 'SOLUSDT',
  'Cardano (ADA/USD)': 'ADAUSDT',
  'Cardano': 'ADAUSDT',
  'ADA': 'ADAUSDT',
  'Polkadot (DOT/USD)': 'DOTUSDT',
  'Polkadot': 'DOTUSDT',
  'DOT': 'DOTUSDT',
  'Chainlink (LINK/USD)': 'LINKUSDT',
  'Chainlink': 'LINKUSDT',
  'LINK': 'LINKUSDT',
  'Ripple (XRP/USD)': 'XRPUSDT',
  'Ripple': 'XRPUSDT',
  'XRP': 'XRPUSDT',
  'Litecoin (LTC/USD)': 'LTCUSDT',
  'Litecoin': 'LTCUSDT',
  'LTC': 'LTCUSDT',
  'Bitcoin Cash (BCH/USD)': 'BCHUSDT',
  'Bitcoin Cash': 'BCHUSDT',
  'BCH': 'BCHUSDT',
  'Avalanche (AVAX/USD)': 'AVAXUSDT',
  'Avalanche': 'AVAXUSDT',
  'AVAX': 'AVAXUSDT',
  'Polygon (MATIC/USD)': 'MATICUSDT',
  'Polygon': 'MATICUSDT',
  'MATIC': 'MATICUSDT',
  'Dogecoin (DOGE/USD)': 'DOGEUSDT',
  'Dogecoin': 'DOGEUSDT',
  'DOGE': 'DOGEUSDT'
};

/**
 * Obtiene precio en tiempo real prioritizando datos de Binance para criptomonedas
 */
async function getRealTimePrice(instrumentName: string): Promise<{
  success: boolean;
  data?: { price: number; source: string; isRealData: boolean };
  error?: string;
}> {
  try {
    // PRIORIDAD 1: Intentar obtener precio real de Binance para criptomonedas
    const binanceSymbol = CRYPTO_MAPPING[instrumentName];
    if (binanceSymbol) {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, {
          next: { revalidate: 1 }
        });
        
        if (response.ok) {
          const data = await response.json();
          const price = parseFloat(data.price);
          
          if (!isNaN(price) && price > 0) {
            return {
              success: true,
              data: {
                price,
                source: 'binance',
                isRealData: true
              }
            };
          }
        }
      } catch (binanceError) {
        console.error(`Error fetching Binance price for ${instrumentName}:`, binanceError);
      }
    }

    // PRIORIDAD 2: Datos simulados como fallback
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/market/route`);
      
      if (response.ok) {
        const data = await response.json();
        const instrument = data.find((item: any) => 
          item.name === instrumentName || 
          item.name.includes(instrumentName) ||
          instrumentName.includes(item.name)
        );
        
        if (instrument && instrument.price) {
          return {
            success: true,
            data: {
              price: instrument.price,
              source: 'simulated',
              isRealData: false
            }
          };
        }
      }
    } catch (simulatedError) {
      console.error(`Error fetching simulated price for ${instrumentName}:`, simulatedError);
    }

    return {
      success: false,
      error: `No price data available for ${instrumentName}`
    };

  } catch (error) {
    console.error(`Error in getRealTimePrice for ${instrumentName}:`, error);
    return {
      success: false,
      error: 'Internal error fetching price'
    };
  }
}

/**
 * Endpoint para crear una nueva posición de trading.
 * Realiza validación de datos, autenticación y lógica de negocio.
 */
export async function POST(request: Request) {
  try {
    // 1. Autenticación y autorización
    const { user } = await getAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener y parsear el cuerpo de la solicitud
    const body = await request.json();

    // 2.5. OBTENER PRECIO REAL EN TIEMPO REAL para la operación
    const realTimePrice = await getRealTimePrice(body.instrumentName);
    if (!realTimePrice.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: `No se pudo obtener precio en tiempo real para ${body.instrumentName}: ${realTimePrice.error}`,
          isRealData: false
        },
        { status: 400 }
      );
    }

    // 3. Validar los datos de entrada con Zod
    let positionData = TradePositionSchema.parse({
      ...body,
      userId: user.id, // Añadir el ID del usuario a los datos
      status: 'open', // Establecer estado inicial
      openTimestamp: new Date().toISOString(), // Establecer timestamp de apertura
      openPrice: realTimePrice.data!.price, // ✅ USAR PRECIO REAL (garantizado por la validación anterior)
    });

    // Calcular valor de la posición y margen requerido en el backend
    // Esta lógica podría ser más compleja dependiendo de las reglas de negocio
    const contractSize = getContractSize(positionData.instrumentName);
    const positionValue = positionData.openPrice * contractSize * (positionData.lotSize || 1);
    const marginRequired = positionValue / (positionData.leverage || 100); // Usar apalancamiento o un default

    positionData = {
      ...positionData,
      positionValue,
      marginRequired,
    };

    // 4. Lógica de negocio (ej. verificar saldo, calcular margen)
    const validationResult = await validatePosition(user, positionData);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 }
      );
    }

    // 5. Crear y "guardar" la posición (actualmente en memoria)
    // TODO: Reemplazar con guardado en base de datos (Prisma)
    const newPosition = await createPosition(positionData);

    return NextResponse.json(
      { success: true, data: newPosition, message: 'Posición creada exitosamente' },
      { status: 201 }
    );

  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    // Manejo de otros errores
    console.error('[API_CREATE_POSITION_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Determina el tamaño del contrato basado en el nombre del instrumento.
 * @param instrumentName - El nombre del instrumento (ej. 'BTCUSD', 'EURUSD').
 * @returns El tamaño del contrato para el cálculo del valor de la posición.
 */
function getContractSize(instrumentName: string): number {
  if (instrumentName.includes('BTC') || instrumentName.includes('ETH')) {
    return 1; // Crypto
  }
  if (instrumentName.includes('XAU')) {
    return 100; // Gold
  }
  return 100000; // Forex standard
}

/**
 * List all open positions for the authenticated user.
 * También verifica y cierra automáticamente las posiciones vencidas.
 */
export async function GET(request: Request) {
  try {
    // Authenticate
    const { user } = await getAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }
    
    // CIERRE AUTOMÁTICO: Verificar y cerrar posiciones vencidas antes de devolver la lista
    try {
      const closedPositions = await checkAndCloseExpiredPositions();
      if (closedPositions.length > 0) {
        console.log(`[API] Auto-closed ${closedPositions.length} expired positions`);
      }
    } catch (autoCloseError) {
      console.error('[API] Error in auto-close process:', autoCloseError);
      // No fallar la consulta si hay error en el auto-close
    }
    
    // Determine status filter
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    let positions;
    if (statusFilter === 'closed') {
      // Fetch closed positions
      positions = await prisma.tradePosition.findMany({
        where: { userId: user.id, status: 'closed' },
        orderBy: { closeTime: 'desc' }
      });
      // Map to history schema
      const data = positions.map(p => ({
        id: p.id,
        instrument: p.instrument,
        openTime: p.openTime.toISOString(),
        closeTimestamp: p.closeTime?.toISOString(),
        openPrice: p.openPrice,
        closePrice: p.currentPrice,
        pnl: p.profit
      }));
      return NextResponse.json({ success: true, data }, { status: 200 });
    }
    // Fetch open positions by default
    positions = await prisma.tradePosition.findMany({
      where: { userId: user.id, status: 'open' },
      orderBy: { openTime: 'desc' }
    });
    return NextResponse.json({ success: true, data: positions }, { status: 200 });
  } catch (error) {
    console.error('[API_LIST_POSITIONS_ERROR]', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
} 