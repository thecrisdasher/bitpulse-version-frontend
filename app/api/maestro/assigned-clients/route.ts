import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Tipos para el response
interface AssignedClient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  profilePicture?: string
  createdAt: string
  lastLogin?: string
  isOnline: boolean
  assignedAt: string
  unreadMessages: number
  hasActiveChat: boolean
  totalPositions: number
  totalPejecoins: number
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y autorización
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario sea maestro
    if (user.role !== 'maestro') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para maestros.' },
        { status: 403 }
      )
    }

    // Obtener las asignaciones del maestro
    const assignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            lastLogin: true,
            pejecoins: true,
            isActive: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    if (assignments.length === 0) {
      return NextResponse.json({
        success: true,
        clients: [],
        message: 'No hay clientes asignados'
      })
    }

    // Obtener IDs de clientes asignados
    const clientIds = assignments.map(a => a.userId)

    // Contar posiciones por cliente
    const positionCounts = await prisma.tradePosition.groupBy({
      by: ['userId'],
      where: {
        userId: { in: clientIds }
      },
      _count: {
        id: true
      }
    })

    // Obtener salas de chat donde participa el maestro
    const maestroRooms = await prisma.chatParticipant.findMany({
      where: { userId: user.id },
      select: { roomId: true }
    })

    const maestroRoomIds = maestroRooms.map(r => r.roomId)

    // Obtener mensajes sin leer en las salas del maestro
    const unreadMessages = await prisma.message.findMany({
      where: {
        roomId: { in: maestroRoomIds },
        senderId: { in: clientIds, not: user.id },
        status: { not: 'read' }
      },
      select: {
        id: true,
        senderId: true
      }
    })

    // Contar mensajes sin leer por cliente
    const unreadMessageCounts: Record<string, number> = {}
    unreadMessages.forEach(msg => {
      unreadMessageCounts[msg.senderId] = (unreadMessageCounts[msg.senderId] || 0) + 1
    })

    // Verificar qué clientes tienen chats activos con el maestro
    const activeChats = await prisma.chatParticipant.findMany({
      where: {
        roomId: { in: maestroRoomIds },
        userId: { in: clientIds }
      },
      select: { userId: true }
    })

    const clientsWithActiveChats = new Set(activeChats.map(chat => chat.userId))

    // Simular estado online (en un sistema real esto vendría de una conexión websocket o cache)
    // Por ahora, consideramos online si el lastLogin es en las últimas 15 minutos
    const now = new Date()
    const onlineThreshold = 15 * 60 * 1000 // 15 minutos en milisegundos

    // Construir respuesta
    const clients: AssignedClient[] = assignments.map(assignment => {
      const client = assignment.user
      const positionCount = positionCounts.find(p => p.userId === client.id)?._count.id || 0
      const unreadCount = unreadMessageCounts[client.id] || 0
      const hasActiveChat = clientsWithActiveChats.has(client.id)
      
      // Determinar si está online
      const isOnline = client.lastLogin ? 
        (now.getTime() - new Date(client.lastLogin).getTime()) < onlineThreshold : false

      return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: undefined, // Campo no disponible en el modelo actual
        profilePicture: client.profilePicture || undefined,
        createdAt: client.createdAt.toISOString(),
        lastLogin: client.lastLogin?.toISOString(),
        isOnline,
        assignedAt: assignment.assignedAt.toISOString(),
        unreadMessages: unreadCount,
        hasActiveChat,
        totalPositions: positionCount,
        totalPejecoins: client.pejecoins
      }
    })

    return NextResponse.json({
      success: true,
      clients,
      total: clients.length
    })

  } catch (error) {
    console.error('Error fetching assigned clients:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 