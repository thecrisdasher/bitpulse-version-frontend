'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, X, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GracePeriodInfo {
  isInGracePeriod: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  approvalExpiresAt: string;
  isApproved: boolean;
}

export function GracePeriodBanner() {
  const { user } = useAuth();
  const [gracePeriodInfo, setGracePeriodInfo] = useState<GracePeriodInfo | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGracePeriodInfo = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/user/grace-period-status`, {
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          setGracePeriodInfo(data);
        }
      } catch (error) {
        console.error('Error fetching grace period info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGracePeriodInfo();
    
    // Actualizar cada hora
    const interval = setInterval(fetchGracePeriodInfo, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (isLoading || !gracePeriodInfo || !isVisible) {
    return null;
  }

  // No mostrar si el usuario ya está aprobado
  if (gracePeriodInfo.isApproved) {
    return null;
  }

  // No mostrar si no está en periodo de gracia
  if (!gracePeriodInfo.isInGracePeriod) {
    return null;
  }

  const getAlertVariant = () => {
    if (gracePeriodInfo.daysRemaining <= 0) return 'destructive';
    if (gracePeriodInfo.daysRemaining <= 1) return 'destructive';
    return 'default';
  };

  const getIcon = () => {
    if (gracePeriodInfo.daysRemaining <= 0) return <AlertTriangle className="h-4 w-4" />;
    if (gracePeriodInfo.daysRemaining <= 1) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (gracePeriodInfo.daysRemaining <= 0 && gracePeriodInfo.hoursRemaining <= 0) {
      return "⚠️ Tu periodo de gracia ha expirado. Tu cuenta será deshabilitada pronto.";
    }
    
    if (gracePeriodInfo.daysRemaining <= 0) {
      return `⏰ Tu cuenta está siendo revisada. Tiempo restante: ${gracePeriodInfo.hoursRemaining} horas.`;
    }
    
    if (gracePeriodInfo.daysRemaining <= 1) {
      return `⏰ Tu cuenta está siendo revisada. Tiempo restante: ${gracePeriodInfo.daysRemaining} día${gracePeriodInfo.daysRemaining !== 1 ? 's' : ''} y ${gracePeriodInfo.hoursRemaining} horas.`;
    }
    
    return `ℹ️ Tu cuenta está siendo revisada por el administrador. Tienes ${gracePeriodInfo.daysRemaining} días de acceso completo mientras se procesa tu solicitud.`;
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4 border-l-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {getIcon()}
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {getMessage()}
              <div className="mt-2 text-xs opacity-75">
                Tu cuenta será revisada en un máximo de 3 días desde tu registro. 
                Puedes usar todas las funciones de la plataforma durante este periodo.
              </div>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="ml-2 h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
} 