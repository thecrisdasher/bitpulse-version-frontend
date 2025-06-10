import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) {
      throw new Error(`Sentiment API error: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/market/sentiment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 