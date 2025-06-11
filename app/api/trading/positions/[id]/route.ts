import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/trading/positions/[id]
 * Deletes a trade position if it belongs to the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  // Next.js 14: params may be async, so await before using
  const { id } = await params;
  if (typeof id !== 'string') {
    return NextResponse.json(
      { success: false, message: 'Invalid or missing position ID' },
      { status: 400 }
    );
  }

  // Authenticate user via custom getAuth
  const { user } = await getAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Attempt to mark the position as closed instead of deleting
    const result = await prisma.tradePosition.updateMany({
      where: { id, userId: user.id },
      data: { status: 'closed', closeTime: new Date() }
    });

    if (result.count === 0) {
      // No records updated -> either not found or not owned by this user
      return NextResponse.json(
        { success: false, message: 'Position not found or forbidden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE_POSITION_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 