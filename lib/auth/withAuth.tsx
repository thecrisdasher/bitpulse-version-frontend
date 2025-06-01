'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/lib/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface WithAuthOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  redirectTo?: string;
  fallback?: React.ComponentType;
  showFallback?: boolean;
}

// Componente de carga por defecto
const DefaultLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div 
      className="text-center space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Verificando autenticación</h2>
        <p className="text-muted-foreground">Por favor espera...</p>
      </div>
    </motion.div>
  </div>
);

// Componente de error de permisos
const PermissionDenied = ({ requiredRoles, requiredPermissions }: { 
  requiredRoles?: UserRole[], 
  requiredPermissions?: Permission[] 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <motion.div
              className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            >
              <Lock className="w-8 h-8 text-destructive" />
            </motion.div>
            
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-4">
                No tienes los permisos necesarios para acceder a esta página.
              </p>
              
              {requiredRoles && requiredRoles.length > 0 && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Shield className="w-4 h-4" />
                    <span>Roles requeridos:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {requiredRoles.map((role) => (
                      <span 
                        key={role} 
                        className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {requiredPermissions && requiredPermissions.length > 0 && (
                <div className="bg-muted p-3 rounded-lg text-sm mt-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Permisos requeridos:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {requiredPermissions.map((permission) => (
                      <span 
                        key={permission} 
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <motion.button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Volver
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

/**
 * Higher-Order Component que protege páginas con autenticación y autorización
 * 
 * @param WrappedComponent - Componente a proteger
 * @param options - Opciones de configuración
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/auth',
    fallback: LoadingFallback = DefaultLoadingFallback,
    showFallback = true
  } = options;

  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading, checkPermission, hasRole } = useAuth();
    const router = useRouter();
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
      if (!isLoading && !hasCheckedAuth) {
        setHasCheckedAuth(true);
        
        // Si no está autenticado, redirigir al login
        if (!isAuthenticated) {
          const currentPath = window.location.pathname + window.location.search;
          const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
          router.replace(redirectUrl);
          return;
        }

        // Si está autenticado pero no tiene los roles necesarios
        if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
          // No redirigir, mostrar componente de acceso denegado
          return;
        }

        // Si está autenticado pero no tiene los permisos necesarios
        if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => checkPermission(permission))) {
          // No redirigir, mostrar componente de acceso denegado
          return;
        }
      }
    }, [isAuthenticated, isLoading, hasCheckedAuth, router, hasRole, checkPermission]);

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading || !hasCheckedAuth) {
      return showFallback ? <LoadingFallback /> : null;
    }

    // Si no está autenticado, no mostrar nada (ya se está redirigiendo)
    if (!isAuthenticated) {
      return showFallback ? <LoadingFallback /> : null;
    }

    // Verificar roles requeridos
    if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
      return (
        <PermissionDenied 
          requiredRoles={requiredRoles}
          requiredPermissions={requiredPermissions}
        />
      );
    }

    // Verificar permisos requeridos
    if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => checkPermission(permission))) {
      return (
        <PermissionDenied 
          requiredRoles={requiredRoles}
          requiredPermissions={requiredPermissions}
        />
      );
    }

    // Todo está bien, mostrar el componente protegido
    return <WrappedComponent {...props} />;
  };
}

// Hook para uso más sencillo en componentes funcionales
export function useRequireAuth(options: WithAuthOptions = {}) {
  const { user, isAuthenticated, isLoading, checkPermission, hasRole } = useAuth();
  const router = useRouter();

  const {
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/auth'
  } = options;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  const hasRequiredRoles = requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));
  const hasRequiredPermissions = requiredPermissions.length === 0 || requiredPermissions.some(permission => checkPermission(permission));

  return {
    isAuthenticated,
    isLoading,
    hasRequiredRoles,
    hasRequiredPermissions,
    canAccess: isAuthenticated && hasRequiredRoles && hasRequiredPermissions,
    user
  };
}

// Tipos de conveniencia para exportar
export type { WithAuthOptions }; 