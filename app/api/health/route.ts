import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health
 * Endpoint para verificar el estado de los diferentes servicios
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const service = searchParams.get('service');
  
  // Estado por defecto
  let status = 'healthy';
  let message = 'All systems operational';
  let details: Record<string, any> = {};
  
  try {
    // Verificar conexión básica
    const basicStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(basicStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Service unavailable',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
} 