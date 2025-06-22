import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y autorización de admin
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado. Solo para administradores.' },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // Obtener solicitudes de retiro con paginación
    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          }
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.withdrawal.count({ where })
    ])

    // Formatear datos para el frontend
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      user: {
        id: withdrawal.user.id,
        name: `${withdrawal.user.firstName} ${withdrawal.user.lastName}`,
        email: withdrawal.user.email,
        username: withdrawal.user.username
      },
      type: withdrawal.type,
      amount: withdrawal.amount,
      status: withdrawal.status,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt,
      processedBy: withdrawal.processedBy,
      adminNotes: withdrawal.adminNotes,
      
      // Datos específicos del tipo
      ...(withdrawal.type === 'bank_account' ? {
        bankDetails: {
          bankName: withdrawal.bankName,
          accountType: withdrawal.accountType,
          accountNumber: withdrawal.accountNumber,
          city: withdrawal.city
        }
      } : {
        cryptoDetails: {
          cryptoType: withdrawal.cryptoType,
          networkType: withdrawal.networkType,
          walletAddress: withdrawal.walletAddress
        }
      })
    }))

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching withdrawals for admin:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 