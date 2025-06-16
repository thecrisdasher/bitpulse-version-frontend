import { NextRequest, NextResponse } from 'next/server'
import { createSessionFromRequest } from '@/lib/auth/session'
import { NotificationService } from '@/lib/services/notificationService'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await createSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'unauth' }, { status: 401 })
  await NotificationService.markRead(params.id)
  return NextResponse.json({ ok: true })
} 