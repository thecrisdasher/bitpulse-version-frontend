import { NextRequest, NextResponse } from 'next/server';
import { getAllLeverage, getLeverage, setLeverage } from '@/lib/config/leverage';
// Auth removed for demo

export const GET = async (_req: NextRequest, context: { params: { category: string } }) => {
  const { category } = context.params;
  const value = getLeverage(category as any);
  return NextResponse.json({ category, leverage: value });
};

export const PUT = async (req: NextRequest, context: { params: { category: string } }) => {
  const { category } = context.params;
  const body = await req.json();
  if (typeof body.leverage !== 'number' || body.leverage <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  }
  setLeverage(category as any, body.leverage);
  return NextResponse.json({ category, leverage: body.leverage });
}; 