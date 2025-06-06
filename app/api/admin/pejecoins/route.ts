import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/lib/services/jwtService';
import { PejeCoinService } from '@/lib/services/pejeCoinService';
import { logger } from '@/lib/logging/logger';

/**
 * API para la gestión de pejecoins por administradores
 * POST /api/admin/pejecoins - Asignar pejecoins a un usuario
 * GET /api/admin/pejecoins/user/:id - Obtener transacciones de un usuario
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación del administrador
    const authHeader = request.headers.get('authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      }, { status: 401 });
    }

    // Verificar que el usuario es administrador
    const decodedToken = await JWTService.verifyToken(token);
    if (decodedToken.role !== 'admin') {
      logger.logSecurity('unauthorized_access', 'high', {
        userId: decodedToken.userId,
        endpoint: '/api/admin/pejecoins',
        userRole: decodedToken.role,
        requiredRole: 'admin'
      });
      
      return NextResponse.json({
        success: false,
        message: 'Acceso no autorizado. Se requieren permisos de administrador.'
      }, { status: 403 });
    }

    // Obtener datos de la petición
    const { userId, amount, concept } = await request.json();

    // Validar datos de entrada
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Datos de entrada inválidos. Se requiere userId y un amount positivo.'
      }, { status: 400 });
    }

    // Realizar la asignación de pejecoins
    const transaction = await PejeCoinService.assignCoins(
      decodedToken.userId,
      userId,
      amount,
      concept || 'Asignación de pejecoins por administrador'
    );

    logger.info('user_activity', `Admin ${decodedToken.userId} assigned ${amount} pejecoins to user ${userId}`, {
      transactionId: transaction.id,
      adminId: decodedToken.userId,
      userId,
      amount
    });

    return NextResponse.json({
      success: true,
      message: 'Pejecoins asignados exitosamente',
      data: transaction
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('api', 'Error assigning pejecoins', error as Error);
    
    return NextResponse.json({
      success: false,
      message: `Error al asignar pejecoins: ${errorMessage}`
    }, { status: 500 });
  }
}

// GET para obtener historial de transacciones de un usuario específico
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación del administrador
    const authHeader = request.headers.get('authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      }, { status: 401 });
    }

    // Verificar que el usuario es administrador
    const decodedToken = await JWTService.verifyToken(token);
    if (decodedToken.role !== 'admin') {
      logger.logSecurity('unauthorized_access', 'high', {
        userId: decodedToken.userId,
        endpoint: '/api/admin/pejecoins',
        userRole: decodedToken.role,
        requiredRole: 'admin'
      });
      
      return NextResponse.json({
        success: false,
        message: 'Acceso no autorizado. Se requieren permisos de administrador.'
      }, { status: 403 });
    }

    // Obtener el userId de los parámetros de consulta
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el parámetro userId'
      }, { status: 400 });
    }

    // Obtener el historial de transacciones
    const transactions = await PejeCoinService.getUserTransactions(userId);
    const balance = await PejeCoinService.getUserBalance(userId);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        balance
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('api', 'Error retrieving transactions', error as Error);
    
    return NextResponse.json({
      success: false,
      message: `Error al obtener transacciones: ${errorMessage}`
    }, { status: 500 });
  }
} 