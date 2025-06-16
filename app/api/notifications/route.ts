import { NextRequest, NextResponse } from 'next/server'
import { createSessionFromRequest } from '@/lib/auth/session'
import { NotificationService } from '@/lib/services/notificationService'

export async function GET(req: NextRequest) {
  const session = await createSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'unauth' }, { status: 401 })
  const notes = await NotificationService.getUnread(session.sub)
  return NextResponse.json({ notifications: notes })
} 