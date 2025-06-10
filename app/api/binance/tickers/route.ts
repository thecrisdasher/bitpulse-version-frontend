import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 });
    }
    const baseSymbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const filteredBaseSymbols = baseSymbols.filter(sym => sym !== 'USDT');
    if (filteredBaseSymbols.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }
    const fullSymbols = filteredBaseSymbols.map(sym => `${sym}USDT`);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(fullSymbols))}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }
    const data = await res.json();
    const mapping: Record<string, { price: number; change24h: number; volume: number }> = {};
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const base = String(item.symbol).replace(/USDT$/i, '');
        mapping[base] = {
          price: parseFloat(item.lastPrice),
          change24h: parseFloat(item.priceChangePercent),
          volume: parseFloat(item.volume),
        };
      });
    }
    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('Error in /api/binance/tickers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 