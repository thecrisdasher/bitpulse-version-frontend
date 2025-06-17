'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Clock, 
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

interface SchedulerStatus {
  autoCloseRunning: boolean;
  priceUpdateRunning: boolean;
  lastAutoClose: string | null;
  lastPriceUpdate: string | null;
  stats: {
    autoCloseExecutions: number;
    priceUpdateExecutions: number;
    positionsClosed: number;
    pricesUpdated: number;
  };
  nextAutoClose: string | null;
  nextPriceUpdate: string | null;
}

export default function SchedulerMonitor() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar estado inicial y configurar actualización automática
  useEffect(() => {
    fetchStatus();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/trading/scheduler');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  const executeAction = async (action: string, params: any = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/trading/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setLastUpdate(new Date());
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Error ejecutando acción');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getStatusBadge = (isRunning: boolean) => (
    <Badge variant={isRunning ? 'default' : 'secondary'} className="ml-2">
      {isRunning ? (
        <>
          <Activity className="w-3 h-3 mr-1" />
          Activo
        </>
      ) : (
        <>
          <Pause className="w-3 h-3 mr-1" />
          Detenido
        </>
      )}
    </Badge>
  );

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Cargando estado de schedulers...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Schedulers</h2>
          <p className="text-muted-foreground">
            Control y monitoreo de procesos automáticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeAction('reset-stats')}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Stats
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auto Close Scheduler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Cierre Automático
              {getStatusBadge(status.autoCloseRunning)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Última ejecución</p>
                <p className="font-medium">{formatDate(status.lastAutoClose)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próxima ejecución</p>
                <p className="font-medium">{formatDate(status.nextAutoClose)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ejecuciones totales</p>
                <p className="font-medium">{status.stats.autoCloseExecutions}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Posiciones cerradas</p>
                <p className="font-medium">{status.stats.positionsClosed}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              {status.autoCloseRunning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeAction('stop-auto-close')}
                  disabled={loading}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Detener
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => executeAction('start-auto-close', { autoCloseMinutes: 1 })}
                  disabled={loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => executeAction('run-auto-close-once')}
                disabled={loading}
              >
                <Activity className="w-4 h-4 mr-2" />
                Ejecutar ahora
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Update Scheduler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Actualización de Precios
              {getStatusBadge(status.priceUpdateRunning)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Última ejecución</p>
                <p className="font-medium">{formatDate(status.lastPriceUpdate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próxima ejecución</p>
                <p className="font-medium">{formatDate(status.nextPriceUpdate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ejecuciones totales</p>
                <p className="font-medium">{status.stats.priceUpdateExecutions}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Actualizaciones exitosas</p>
                <p className="font-medium">{status.stats.pricesUpdated}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              {status.priceUpdateRunning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => executeAction('stop-price-update')}
                  disabled={loading}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Detener
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => executeAction('start-price-update', { priceUpdateMinutes: 30 })}
                  disabled={loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => executeAction('run-price-update-once')}
                disabled={loading}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Actualizar ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Controles Globales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => executeAction('start-all', { autoCloseMinutes: 1, priceUpdateMinutes: 30 })}
              disabled={loading}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar todos
            </Button>
            <Button
              variant="outline"
              onClick={() => executeAction('stop-all')}
              disabled={loading}
            >
              <Pause className="w-4 h-4 mr-2" />
              Detener todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      {lastUpdate && (
        <div className="text-center text-sm text-muted-foreground">
          Última actualización: {lastUpdate.toLocaleString('es-ES')}
        </div>
      )}
    </div>
  );
} 