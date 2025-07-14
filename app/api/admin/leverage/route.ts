import { NextRequest, NextResponse } from 'next/server';
import { getAllLeverage } from '@/lib/config/leverage';
// Auth check removed for simplicity

export const GET = async () => {
  const data = getAllLeverage();
  return NextResponse.json({ leverageSettings: data });
}; 