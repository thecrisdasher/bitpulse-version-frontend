import { useState, useEffect } from 'react';
import { websocketService } from '@/lib/api/websocketService';

/**
 * Estados posibles de conexión
 */
type ConnectionStatus = 'connected' | 'connecting' | 'unstable' | 'offline';

interface ConnectionStatusBannerProps {
  className?: string;
  showWhenConnected?: boolean;
}

/**
 * Componente para mostrar el estado de conexión a los servicios de datos financieros
 */
export default function ConnectionStatusBanner({ 
  className = '',
  showWhenConnected = false 
}: ConnectionStatusBannerProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [message, setMessage] = useState<string>('Conectando a servicios financieros...');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [activeConnections, setActiveConnections] = useState<number>(0);
  
  // Verificar la conectividad de red y los servicios
  useEffect(() => {
    let isSubscribed = true;
    let checkInterval: NodeJS.Timeout;
    
    // Función para comprobar estado de conexión
    const checkConnectionStatus = async () => {
      if (!isSubscribed) return;
      
      try {
        // Verificar conexión a Internet
        const isOnline = navigator.onLine;
        
        if (!isOnline) {
          setStatus('offline');
          setMessage('Sin conexión a Internet. Usando datos en caché.');
          return;
        }
        
        // Obtener número de conexiones WebSocket activas
        const wsConnections = websocketService.getActiveConnectionCount();
        if (isSubscribed) {
          setActiveConnections(wsConnections);
        }
        
        // Ping a API principal para verificar conectividad
        try {
          const pingResponse = await fetch('/api/health?service=market', { 
            method: 'GET',
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (pingResponse.ok) {
            const data = await pingResponse.json();
            
            // Actualizar estado según la respuesta
            if (isSubscribed) {
              if (data.status === 'healthy') {
                setStatus('connected');
                setMessage('Conectado a servicios financieros en tiempo real.');
              } else if (data.status === 'degraded') {
                setStatus('unstable');
                setMessage('Conectividad limitada. Algunos datos pueden no estar actualizados.');
              } else {
                setStatus('unstable');
                setMessage('Conectividad intermitente con las APIs financieras.');
              }
            }
          } else {
            if (isSubscribed) {
              setStatus('unstable');
              setMessage('Problemas de conexión con los servicios financieros.');
            }
          }
        } catch (error) {
          // Error de red al hacer ping
          console.warn('Error al verificar estado de APIs:', error);
          if (isSubscribed) {
            setStatus('unstable');
            setMessage('Conectividad intermitente. Algunos datos pueden estar retrasados.');
          }
        }
        
        // Actualizar timestamp de última verificación
        if (isSubscribed) {
          setLastChecked(new Date());
        }
      } catch (error) {
        console.error('Error al verificar estado de conexión:', error);
      }
    };
    
    // Verificar inmediatamente al montar
    checkConnectionStatus();
    
    // Configurar intervalo para verificación periódica
    checkInterval = setInterval(checkConnectionStatus, 30000); // Cada 30 segundos
    
    // Escuchar eventos de conexión del navegador
    const handleOnline = () => {
      if (isSubscribed) {
        setStatus('connecting');
        setMessage('Reconectando a servicios financieros...');
        checkConnectionStatus();
      }
    };
    
    const handleOffline = () => {
      if (isSubscribed) {
        setStatus('offline');
        setMessage('Sin conexión a Internet. Usando datos en caché.');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Limpiar al desmontar
    return () => {
      isSubscribed = false;
      clearInterval(checkInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // No mostrar nada si estamos conectados y showWhenConnected es false
  if (status === 'connected' && !showWhenConnected) {
    return null;
  }
  
  // Clases según el estado
  const statusClasses = {
    connected: 'bg-green-600 text-white',
    connecting: 'bg-blue-600 text-white',
    unstable: 'bg-yellow-500 text-black',
    offline: 'bg-red-600 text-white'
  };
  
  // Iconos según el estado
  const statusIcons = {
    connected: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    connecting: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    unstable: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    offline: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    )
  };
  
  return (
    <div className={`px-4 py-2 flex items-center justify-between text-sm ${statusClasses[status]} ${className}`}>
      <div className="flex items-center gap-2">
        {statusIcons[status]}
        <span>{message}</span>
      </div>
      <div className="text-xs opacity-80">
        {activeConnections > 0 && (
          <span className="mr-2">{activeConnections} conexiones activas</span>
        )}
        <span>{lastChecked.toLocaleTimeString()}</span>
      </div>
    </div>
  );
} 