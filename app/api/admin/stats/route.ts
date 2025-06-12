import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createSessionFromRequest } from '@/lib/auth/session'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } })
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Totales
    const totalUsersPromise = prisma.user.count()
    const totalGroupsPromise = prisma.chatRoom.count({ where: { type: 'general' } })

    // Chats activos: salas con mensajes en últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeChatsPromise = prisma.message.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      distinct: ['roomId'],
      select: { roomId: true },
    }).then((r) => r.length)

    // Reportes (si existe la tabla Report). Si no, devolver 0
    const reportCountPromise = prisma.$queryRawUnsafe<number>(`SELECT 0`).catch(() => 0)

    const [totalUsers, totalGroups, activeChats, totalReports, latestUsers, latestGroups] = await Promise.all([
      totalUsersPromise,
      totalGroupsPromise,
      activeChatsPromise,
      reportCountPromise,
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, email: true, createdAt: true } }),
      prisma.chatRoom.findMany({ where: { type: 'general' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, createdAt: true } }),
    ])

    const recentActivity = [
      ...latestUsers.map((u) => ({ id: u.id, type: 'user_signup' as const, title: `Nuevo registro: ${u.email}`, timestamp: u.createdAt.toISOString() })),
      ...latestGroups.map((g) => ({ id: g.id, type: 'group_created' as const, title: `Grupo "${g.name ?? 'Sin nombre'}" creado`, timestamp: g.createdAt.toISOString() })),
    ].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 10)

    return NextResponse.json({ totalUsers, totalGroups, activeChats, totalReports, recentActivity })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 