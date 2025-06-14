import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSymbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1m';
    const limitParam = searchParams.get('limit');
    const endTimeParam = searchParams.get('endTime');
    const startTimeParam = searchParams.get('startTime');
    
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    
    if (!rawSymbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }
    
    // Sanitize symbol: remove slashes, uppercase, append USDT if missing
    const base = rawSymbol.replace(/\//g, '').toUpperCase();
    const symbol = base.endsWith('USDT') ? base : `${base}USDT`;
    
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    // Add time parameters if provided
    if (startTimeParam) {
      const startTime = parseInt(startTimeParam, 10);
      if (!isNaN(startTime)) {
        url += `&startTime=${startTime}`;
      }
    }
    
    if (endTimeParam) {
      const endTime = parseInt(endTimeParam, 10);
      if (!isNaN(endTime)) {
        url += `&endTime=${endTime}`;
      }
    }
    
    console.log('[Binance API] Fetching:', url);
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/binance/klines:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 