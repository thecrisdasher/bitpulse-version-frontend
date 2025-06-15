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
    // Verificar servicios específicos
    if (service === 'market') {
      try {
        // Un proxy simple para probar la conectividad con APIs externas
        // En producción, esto podría hacer más comprobaciones:
        // - Verificar si hay conexiones WebSocket activas
        // - Verificar si las APIs principales responden (con timeout bajo)
        // - Comprobar cómo de recientes son los datos en caché
        
        // Ping a CoinGecko como prueba de conectividad
        const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/ping', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(1500) // 1.5 segundos timeout
        });
        
        if (!coinGeckoResponse.ok) {
          status = 'degraded';
          message = 'Limited market data connectivity';
          details.coinGecko = { status: 'down', statusCode: coinGeckoResponse.status };
        } else {
          details.coinGecko = { status: 'up', responseTime: coinGeckoResponse.headers.get('X-Request-Time') };
        }
        
        // Ping a Yahoo Finance API como prueba secundaria
        try {
          const yahooResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(1500) // 1.5 segundos timeout
          });
          
          if (!yahooResponse.ok) {
            details.yahoo = { status: 'down', statusCode: yahooResponse.status };
            // Solo degradar si ya no estaba degradada
            if (status === 'healthy') {
              status = 'degraded';
              message = 'Limited market data connectivity';
            }
          } else {
            details.yahoo = { status: 'up' };
          }
        } catch (yahooError) {
          details.yahoo = { status: 'error', message: yahooError instanceof Error ? yahooError.message : 'Unknown error' };
          // Si CoinGecko también falló, marcar como crítico
          if (status === 'degraded') {
            status = 'critical';
            message = 'Major issues with market data providers';
          } else {
            status = 'degraded';
            message = 'Limited market data connectivity';
          }
        }
        
      } catch (error) {
        status = 'critical';
        message = 'Unable to connect to market data providers';
        details.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else if (service === 'api') {
      // Verificar estado de APIs internas (podría expandirse según sea necesario)
      status = 'healthy';
      message = 'API services are operational';
    } else {
      // Estado general de la aplicación
      status = 'healthy';
      message = 'All systems operational';
    }
    
    // Agregar timestamp
    details.timestamp = new Date().toISOString();
    
    return NextResponse.json({
      status,
      message,
      details
    });
  } catch (error) {
    console.error('Error checking health:', error);
    
    return NextResponse.json({
      status: 'critical',
      message: 'Error checking service health',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 