import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createSessionFromRequest } from '@/lib/auth/session'
import { prisma } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    const session = await createSessionFromRequest(request)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } })
    if (!me || me.role !== 'admin') {
      return new NextResponse('Acceso denegado', { status: 403 })
    }

    // Obtener usuarios con counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: {
            chatParticipants: true,
            messagesSent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const records = users.map((u) => ({
      id: u.id,
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      status: u.isActive ? 'activo' : 'inactivo',
      groupsCount: u._count.chatParticipants,
      messagesCount: u._count.messagesSent,
    }))

    const headers = ['ID', 'Nombre Completo', 'Email', 'Rol', 'Fecha de Registro', 'Estado', 'Grupos Participa', 'Mensajes Enviados']
    const csvRows = [headers.join(',')]
    for (const r of records) {
      const row = [
        r.id,
        `"${r.fullName.replace(/"/g, '""')}"`,
        r.email,
        r.role,
        r.createdAt,
        r.status,
        r.groupsCount.toString(),
        r.messagesCount.toString(),
      ]
      csvRows.push(row.join(','))
    }
    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bitpulse_usuarios.csv"',
      },
    })
  } catch (error) {
    console.error('Error generating users report CSV:', error)
    return new NextResponse('Error interno', { status: 500 })
  }
} 