import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { PejeCoinService } from '@/lib/services/pejeCoinService';

export async function GET(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request);
    if (!session) return NextResponse.json({ success:false, message:'No autorizado' },{status:401});

    const balance = await PejeCoinService.getUserBalance(session.sub);
    const transactions = await PejeCoinService.getUserTransactions(session.sub);

    return NextResponse.json({ success:true, data:{ balance, transactions } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success:false, message:'Error interno' },{status:500});
  }
} 