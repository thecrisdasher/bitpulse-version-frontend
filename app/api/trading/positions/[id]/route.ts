import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const { user } = await getAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }
    const { id } = params;
    // Delete or mark position as closed
    await prisma.tradePosition.deleteMany({
      where: { id, userId: user.id }
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[API_DELETE_POSITION_ERROR]', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
} 