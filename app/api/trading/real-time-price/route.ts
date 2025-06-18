import { NextRequest, NextResponse } from 'next/server';

/**
 * API para obtener precios en tiempo real específicamente para operaciones de trading
 * Garantiza que siempre se usen datos reales cuando estén disponibles
 */

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

async function getBinancePrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      next: { revalidate: 1 } // Cache por 1 segundo para trading
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching Binance price for ${symbol}:`, error);
    return null;
  }
}

async function getSimulatedPrice(instrumentName: string): Promise<number | null> {
  try {
    // Llamar al endpoint interno de simulación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/market/route`, {
      next: { revalidate: 1 }
    });
    
    if (!response.ok) {
      throw new Error(`Simulator API error: ${response.status}`);
    }
    
    const data = await response.json();
    const instrument = data.find((item: any) => 
      item.name === instrumentName || 
      item.name.includes(instrumentName) ||
      instrumentName.includes(item.name)
    );
    
    return instrument?.price || null;
  } catch (error) {
    console.error(`Error fetching simulated price for ${instrumentName}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instrumentName = searchParams.get('instrument');
    const requireReal = searchParams.get('requireReal') === 'true';
    
    if (!instrumentName) {
      return NextResponse.json(
        { success: false, error: 'Parameter "instrument" is required' },
        { status: 400 }
      );
    }

    // PRIORIDAD 1: Intentar obtener precio real de Binance para criptomonedas
    const binanceSymbol = CRYPTO_MAPPING[instrumentName];
    if (binanceSymbol) {
      const realPrice = await getBinancePrice(binanceSymbol);
      if (realPrice !== null) {
        return NextResponse.json({
          success: true,
          data: {
            instrumentName,
            price: realPrice,
            source: 'binance',
            isRealData: true,
            timestamp: new Date().toISOString(),
            symbol: binanceSymbol
          }
        });
      }
    }

    // Si se requieren datos reales y no están disponibles, fallar
    if (requireReal) {
      return NextResponse.json({
        success: false,
        error: `Real-time data not available for ${instrumentName}`,
        isRealData: false
      }, { status: 404 });
    }

    // PRIORIDAD 2: Datos simulados como fallback
    const simulatedPrice = await getSimulatedPrice(instrumentName);
    if (simulatedPrice !== null) {
      return NextResponse.json({
        success: true,
        data: {
          instrumentName,
          price: simulatedPrice,
          source: 'simulated',
          isRealData: false,
          timestamp: new Date().toISOString(),
          warning: 'Using simulated data - not suitable for real trading'
        }
      });
    }

    // No se encontraron datos
    return NextResponse.json({
      success: false,
      error: `No price data available for ${instrumentName}`,
      isRealData: false
    }, { status: 404 });

  } catch (error) {
    console.error('[REAL_TIME_PRICE_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      isRealData: false
    }, { status: 500 });
  }
} 