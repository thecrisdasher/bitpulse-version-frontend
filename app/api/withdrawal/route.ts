import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface WithdrawalRequest {
  type: 'bank_account' | 'crypto'
  amount: number | string
  
  // Bank account fields
  bankName?: string
  accountType?: string
  accountNumber?: string
  city?: string
  
  // Crypto fields
  cryptoType?: string
  networkType?: string
  walletAddress?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    const body: WithdrawalRequest = await request.json()
    const { type, amount: rawAmount, ...withdrawalData } = body

    // Validaciones básicas
    if (!type || !rawAmount) {
      return NextResponse.json(
        { success: false, message: 'Tipo y monto son requeridos' },
        { status: 400 }
      )
    }

    // Convertir amount a número - manejar formato con separadores de miles
    let amount: number
    if (typeof rawAmount === 'string') {
      // Remover espacios y caracteres no numéricos excepto puntos y comas
      let cleanAmount = rawAmount.trim().replace(/[^\d.,]/g, '')
      
      // Si solo hay dígitos, es un número entero
      if (/^\d+$/.test(cleanAmount)) {
        amount = parseFloat(cleanAmount)
      } else {
        // Remover comas (separadores de miles)
        cleanAmount = cleanAmount.replace(/,/g, '')
        
        // Contar puntos
        const dotCount = (cleanAmount.match(/\./g) || []).length
        
        if (dotCount === 0) {
          // Solo dígitos
          amount = parseFloat(cleanAmount)
        } else if (dotCount === 1) {
          // Un punto - verificar si es separador de miles o decimal
          const parts = cleanAmount.split('.')
          if (parts[1].length === 3 && parts.length === 2 && /^\d{1,3}$/.test(parts[0])) {
            // Ejemplo: 50.000 (cincuenta mil)
            amount = parseFloat(parts[0] + parts[1])
          } else {
            // Ejemplo: 50.50 (cincuenta con cincuenta)
            amount = parseFloat(cleanAmount)
          }
        } else {
          // Múltiples puntos - los primeros son separadores de miles
          const lastDotIndex = cleanAmount.lastIndexOf('.')
          const beforeLastDot = cleanAmount.substring(0, lastDotIndex).replace(/\./g, '')
          const afterLastDot = cleanAmount.substring(lastDotIndex)
          amount = parseFloat(beforeLastDot + afterLastDot)
        }
      }
    } else {
      amount = rawAmount
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'El monto debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Obtener el usuario actual con su balance (usando pejecoins)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { pejecoins: true, firstName: true, lastName: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // DEBUG: Verificar qué saldo está leyendo el API
    console.log('💰 [DEBUG] Saldo del usuario:', {
      userId: user.id,
      pejecoins: currentUser.pejecoins,
      pejecoinsType: typeof currentUser.pejecoins,
      userName: `${currentUser.firstName} ${currentUser.lastName}`
    })

    // Verificar si el usuario tiene retiros pendientes
    const pendingWithdrawals = await prisma.withdrawal.findFirst({
      where: { 
        userId: user.id,
        status: { in: ['pending', 'approved'] }
      }
    })

    if (pendingWithdrawals) {
      return NextResponse.json(
        { success: false, message: 'Ya tienes una solicitud de retiro pendiente. Debes esperar a que sea procesada antes de crear una nueva.' },
        { status: 400 }
      )
    }

    // Verificar saldo suficiente (solo validar que tendrá saldo cuando se apruebe)
    if (amount > currentUser.pejecoins) {
      return NextResponse.json(
        { success: false, message: `Saldo insuficiente. Tu saldo actual es $${currentUser.pejecoins.toLocaleString('es-CO', { minimumFractionDigits: 2 })} y estás solicitando $${amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}` },
        { status: 400 }
      )
    }

    // Validar campos específicos según el tipo
    if (type === 'bank_account') {
      if (!withdrawalData.bankName || !withdrawalData.accountType || 
          !withdrawalData.accountNumber || !withdrawalData.city) {
        return NextResponse.json(
          { success: false, message: 'Todos los campos de cuenta bancaria son requeridos' },
          { status: 400 }
        )
      }
    } else if (type === 'crypto') {
      if (!withdrawalData.cryptoType || !withdrawalData.networkType || 
          !withdrawalData.walletAddress) {
        return NextResponse.json(
          { success: false, message: 'Todos los campos de criptomoneda son requeridos' },
          { status: 400 }
        )
      }
    }

    // Crear la solicitud de retiro usando transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el retiro (SIN descontar saldo aún)
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          type,
          amount,
          status: 'pending',
          
          // Campos bancarios
          bankName: type === 'bank_account' ? withdrawalData.bankName : null,
          accountType: type === 'bank_account' ? withdrawalData.accountType : null,
          accountNumber: type === 'bank_account' ? withdrawalData.accountNumber : null,
          city: type === 'bank_account' ? withdrawalData.city : null,
          
          // Campos crypto
          cryptoType: type === 'crypto' ? withdrawalData.cryptoType : null,
          networkType: type === 'crypto' ? withdrawalData.networkType : null,
          walletAddress: type === 'crypto' ? withdrawalData.walletAddress : null,
        }
      })

      // NO descontamos el saldo aquí - se descontará cuando se apruebe

      // Crear notificación para administradores
      const admins = await tx.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      })

      // Crear una notificación para cada admin
      await tx.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: 'Nueva solicitud de retiro',
          body: `${currentUser.firstName} ${currentUser.lastName} ha solicitado un retiro de $${amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          link: `/admin/withdrawals`
        }))
      })

      // Registrar la actividad del usuario
      await tx.userActivity.create({
        data: {
          userId: user.id,
          action: 'withdrawal_requested',
          details: {
            withdrawalId: withdrawal.id,
            type,
            amount,
            timestamp: new Date().toISOString()
          }
        }
      })

      return withdrawal
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      data: {
        id: result.id,
        amount: result.amount,
        status: result.status,
        requestedAt: result.requestedAt
      }
    })

  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { user } = await getAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener las solicitudes de retiro del usuario
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        adminNotes: true,
        
        // Solo mostrar datos relevantes según el tipo
        bankName: true,
        accountType: true,
        accountNumber: true,
        city: true,
        cryptoType: true,
        networkType: true,
        walletAddress: true
      }
    })

    return NextResponse.json({
      success: true,
      data: withdrawals
    })

  } catch (error) {
    console.error('Error fetching user withdrawals:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 