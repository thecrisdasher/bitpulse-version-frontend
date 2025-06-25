import { NextRequest, NextResponse } from 'next/server'
import { createSessionFromRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await createSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener las últimas 20 notificaciones (tanto leídas como no leídas)
    const notifications = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        isRead: true,
        createdAt: true,
      }
    })

    // Contar notificaciones no leídas
    const unreadCount = await prisma.notification.count({
      where: { 
        userId: session.sub,
        isRead: false 
      }
    })

    return NextResponse.json({ 
      success: true,
      notifications: notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString()
      })),
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching recent notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// PATCH para marcar todas como leídas
export async function PATCH(req: NextRequest) {
  try {
    const session = await createSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { 
        userId: session.sub,
        isRead: false 
      },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
} 