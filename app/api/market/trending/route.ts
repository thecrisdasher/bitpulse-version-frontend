import { NextResponse } from 'next/server';
import { getSimulatedTicker } from '@/lib/simulator';

/**
 * GET /api/market/trending
 * Obtiene datos de trending con fallback automático
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'rank';

    console.log(`[Trending API] Fetching trending data (limit: ${limit}, sortBy: ${sortBy})`);

    let trendingData: any[] = [];
    let usingFallback = false;

    // Símbolos principales para trending
    const TRENDING_SYMBOLS = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
      'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'DOGEUSDT',
      'AVAXUSDT', 'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
      'ALGOUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT'
    ];

    try {
      // Intentar obtener datos de Binance API
      console.log('[Trending API] Trying Binance API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const symbolsQuery = encodeURIComponent(JSON.stringify(TRENDING_SYMBOLS.slice(0, limit)));
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsQuery}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const binanceData = await response.json();

      if (Array.isArray(binanceData)) {
        trendingData = binanceData.map((item: any, index: number) => {
          const symbol = String(item.symbol).replace('USDT', '');
          const price = parseFloat(item.lastPrice);
          const change24h = parseFloat(item.priceChangePercent);
          const volume24h = parseFloat(item.volume) * price;

          return {
            id: index + 1,
            name: getSymbolName(symbol),
            symbol: symbol,
            price: price,
            change24h: change24h,
            change7d: change24h * (0.8 + Math.random() * 0.4),
            marketCap: calculateMarketCap(symbol, price),
            volume24h: volume24h,
            circulatingSupply: getCirculatingSupply(symbol),
            totalSupply: getTotalSupply(symbol),
            priceHistory: generatePriceHistory(price),
            rank: index + 1,
            lastUpdated: new Date().toISOString()
          };
        });

        console.log(`[Trending API] Successfully fetched ${trendingData.length} items from Binance`);
      } else {
        throw new Error('Invalid API response format');
      }

    } catch (error: any) {
      // Fallback automático al simulador
      console.warn(`[Trending API] Binance failed (${error.message}), using simulator...`);
      usingFallback = true;

      trendingData = TRENDING_SYMBOLS.slice(0, limit).map((symbolUsdt, index) => {
        const symbol = symbolUsdt.replace('USDT', '');
        const tickerData = getSimulatedTicker(symbolUsdt);

        return {
          id: index + 1,
          name: getSymbolName(symbol),
          symbol: symbol,
          price: tickerData.price,
          change24h: tickerData.change24h,
          change7d: tickerData.change24h * (0.8 + Math.random() * 0.4),
          marketCap: calculateMarketCap(symbol, tickerData.price),
          volume24h: tickerData.volume,
          circulatingSupply: getCirculatingSupply(symbol),
          totalSupply: getTotalSupply(symbol),
          priceHistory: generatePriceHistory(tickerData.price),
          rank: index + 1,
          lastUpdated: new Date().toISOString()
        };
      });

      console.log(`[Trending API] Generated ${trendingData.length} items from simulator`);
    }

    // Aplicar ordenamiento si se especifica
    if (sortBy && sortBy !== 'rank') {
      trendingData.sort((a, b) => {
        if (sortBy === 'change24h') return b.change24h - a.change24h;
        if (sortBy === 'volume24h') return b.volume24h - a.volume24h;
        if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
        if (sortBy === 'price') return b.price - a.price;
        return a.rank - b.rank;
      });
    }

    return NextResponse.json({
      success: true,
      data: trendingData,
      meta: {
        total: trendingData.length,
        limit,
        sortBy,
        usingFallback,
        lastUpdated: new Date().toISOString(),
        source: usingFallback ? 'simulator' : 'binance'
      }
    });

  } catch (error: any) {
    console.error('[Trending API] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo datos de trending',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Funciones auxiliares
 */
function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'BNB',
    'XRP': 'XRP',
    'ADA': 'Cardano',
    'SOL': 'Solana',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'DOGE': 'Dogecoin',
    'AVAX': 'Avalanche',
    'UNI': 'Uniswap',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'ATOM': 'Cosmos',
    'ALGO': 'Algorand',
    'VET': 'VeChain',
    'FIL': 'Filecoin',
    'TRX': 'TRON',
    'ETC': 'Ethereum Classic'
  };
  return names[symbol] || symbol;
}

function calculateMarketCap(symbol: string, price: number): number {
  const circulatingSupply = getCirculatingSupply(symbol);
  return price * circulatingSupply;
}

function getCirculatingSupply(symbol: string): number {
  const supplies: Record<string, number> = {
    'BTC': 19700000,
    'ETH': 120000000,
    'BNB': 154000000,
    'XRP': 52000000000,
    'ADA': 35000000000,
    'SOL': 400000000,
    'DOT': 1250000000,
    'MATIC': 9300000000,
    'LINK': 500000000,
    'DOGE': 145000000000,
    'AVAX': 340000000,
    'UNI': 760000000,
    'LTC': 73000000,
    'BCH': 19700000,
    'ATOM': 350000000,
    'ALGO': 7000000000,
    'VET': 86000000000,
    'FIL': 400000000,
    'TRX': 92000000000,
    'ETC': 140000000
  };
  return supplies[symbol] || 1000000;
}

function getTotalSupply(symbol: string): number {
  const supplies: Record<string, number> = {
    'BTC': 21000000,
    'ETH': 120000000,
    'BNB': 200000000,
    'XRP': 100000000000,
    'ADA': 45000000000,
    'SOL': 500000000,
    'DOT': 1250000000,
    'MATIC': 10000000000,
    'LINK': 1000000000,
    'DOGE': 145000000000,
    'AVAX': 720000000,
    'UNI': 1000000000,
    'LTC': 84000000,
    'BCH': 21000000,
    'ATOM': 350000000,
    'ALGO': 10000000000,
    'VET': 86000000000,
    'FIL': 2000000000,
    'TRX': 92000000000,
    'ETC': 210000000
  };
  return supplies[symbol] || getCirculatingSupply(symbol);
}

function generatePriceHistory(currentPrice: number): number[] {
  const history = [];
  let price = currentPrice;
  
  for (let i = 6; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 0.1;
    price = price * (1 + variation);
    history.unshift(price);
  }
  
  history[history.length - 1] = currentPrice;
  return history;
} 