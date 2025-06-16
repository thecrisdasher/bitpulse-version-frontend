import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await createSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const userId = session.sub;
  // find admin user
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) return NextResponse.json({ error: 'No admin' }, { status: 500 });
  // find existing private room with admin
  let room = await prisma.chatRoom.findFirst({
    where: {
      type: 'private',
      participants: {
        every: {
          OR: [
            { userId: userId },
            { userId: admin.id }
          ]
        }
      }
    },
    include: { participants: { include: { user: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } }
  });
  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        type: 'private',
        participants: {
          create: [
            { userId },
            { userId: admin.id }
          ]
        }
      },
      include: { participants: { include: { user: true } }, messages: true }
    });
  }
  return NextResponse.json({ roomId: room.id });
} 