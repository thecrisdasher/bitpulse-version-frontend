import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, ArrowPathIcon, WifiIcon } from '@heroicons/react/24/solid';

interface ConnectionStatusBannerProps {
  isVisible?: boolean;
  hasRealtimeData?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Componente que muestra el estado de conexión con las APIs
 * Solo visible cuando hay problemas
 */
const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  isVisible = false,
  hasRealtimeData = false,
  error = null,
  onRetry,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  
  // Resetear el estado de descartado cuando cambia el error
  useEffect(() => {
    if (error) {
      setIsDismissed(false);
    }
  }, [error]);
  
  // Controlar la visibilidad con una animación suave
  useEffect(() => {
    if (isVisible && !isDismissed) {
      setShowBanner(true);
    } else {
      // Si se descarta o no hay error, ocultar después de una animación
      const timer = setTimeout(() => setShowBanner(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isDismissed]);
  
  // Si no hay error o se ha descartado y no necesitamos mostrar nada
  if (!showBanner) return null;
  
  // Determinar el mensaje según el estado
  let message = '';
  let icon = null;
  let bgColor = '';
  
  if (error) {
    message = typeof error === 'string' ? error : error.message || 'Error de conexión con las APIs';
    icon = <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />;
    bgColor = 'bg-amber-50 border-amber-200';
  } else if (!hasRealtimeData) {
    message = 'Usando datos con actualización periódica';
    icon = <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
    bgColor = 'bg-blue-50 border-blue-200';
  } else {
    return null; // Si todo está bien, no mostrar nada
  }
  
  return (
    <div 
      className={`${className} transition-all duration-300 transform ${
        showBanner ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } fixed top-0 inset-x-0 z-50 flex items-center justify-between p-3 ${bgColor} border-b shadow-sm`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs bg-white px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
          >
            <ArrowPathIcon className="h-3 w-3 mr-1" />
            Reintentar
          </button>
        )}
        
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Descartar"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatusBanner; 