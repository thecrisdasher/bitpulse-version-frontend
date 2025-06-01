import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { logger, LogEntry } from '@/lib/logging/logger';

/**
 * API endpoint para recibir logs del cliente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { logs } = body;

    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { success: false, message: 'Invalid logs format' },
        { status: 400 }
      );
    }

    // Procesar cada log
    for (const logEntry of logs as LogEntry[]) {
      // Agregar información del usuario desde la sesión
      logEntry.userId = session.sub;
      logEntry.sessionId = session.jti;

      // Registrar el log en el servidor
      logger.log(
        logEntry.level,
        logEntry.category,
        `[CLIENT] ${logEntry.message}`,
        {
          ...logEntry.metadata,
          originalEnvironment: logEntry.environment,
          clientTimestamp: logEntry.timestamp,
          userAgent: logEntry.userAgent,
          clientUrl: logEntry.url
        }
      );

      // Para logs críticos o de seguridad, tomar acciones adicionales
      if (logEntry.level === 'critical' || logEntry.category === 'security') {
        // TODO: Enviar notificaciones a administradores
        // TODO: Activar alertas de seguridad
        console.warn('🚨 CRITICAL/SECURITY LOG RECEIVED:', logEntry);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${logs.length} log entries`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing logs:', error);
    
    // Log del error en el servidor
    logger.error('api', 'Failed to process client logs', error as Error, {
      requestUrl: request.url,
      method: request.method
    });

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para obtener logs (solo para administradores)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const level = url.searchParams.get('level') as any;
    const category = url.searchParams.get('category') as any;
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const format = url.searchParams.get('format') || 'json';

    const filters: any = {};
    if (level) filters.level = level;
    if (category) filters.category = category;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const logs = logger.getLogs(filters);

    if (format === 'csv') {
      const csvData = logger.exportLogs('csv');
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="bitpulse-logs.csv"'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats: logger.getLogStats(),
        filters
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving logs:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 