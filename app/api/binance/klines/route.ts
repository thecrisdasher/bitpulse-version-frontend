import { NextResponse } from 'next/server';
import { getSimulatedOHLC } from '@/lib/simulator';

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
    
    try {
      console.log('[Binance API] Fetching:', url);
      
      // Configurar timeout para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(url, { 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Binance API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Binance');
      }
      
      console.log(`[Binance API] Successfully fetched ${data.length} klines for ${symbol}`);
      return NextResponse.json(data);
      
    } catch (binanceError: any) {
      // Fallback automático a simulación cuando falla Binance
      console.warn(`[Binance API] Failed, using simulator: ${binanceError.message}`);
      
      const simulatedData = getSimulatedOHLC(base, limit);
      
      console.log(`[Simulator] Generated ${simulatedData.length} simulated klines for ${symbol}`);
      return NextResponse.json(simulatedData);
    }
    
  } catch (error: any) {
    console.error('Error in /api/binance/klines:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 