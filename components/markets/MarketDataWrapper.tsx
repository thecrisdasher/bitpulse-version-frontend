import React, { useState, useCallback } from 'react';
import { useBatchRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import ConnectionStatusBanner from '@/components/common/ConnectionStatusBanner';

interface MarketDataWrapperProps {
  instruments: Array<{symbol: string; category: string}>;
  refreshInterval?: number;
  children: (props: {
    data: Record<string, any>;
    isLoading: boolean;
    isRealtimeData: boolean;
  }) => React.ReactNode;
}

/**
 * Componente wrapper que gestiona los datos de mercado y maneja elegantemente
 * los errores de conectividad
 */
const MarketDataWrapper: React.FC<MarketDataWrapperProps> = ({
  instruments,
  refreshInterval = 10000,
  children
}) => {
  // Estado para controlar reintentos manuales
  const [retryCount, setRetryCount] = useState(0);
  
  // Obtener datos de mercado en tiempo real
  const { 
    data, 
    isLoading, 
    error, 
    hasRealtimeData 
  } = useBatchRealTimeMarketData(instruments, {
    refreshInterval,
    initialFetch: true
  });
  
  // Callback para reintentar conexión manualmente
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);
  
  return (
    <>
      {/* Banner de estado de conexión */}
      <ConnectionStatusBanner
        isVisible={!!error || !hasRealtimeData}
        hasRealtimeData={hasRealtimeData}
        error={error}
        onRetry={handleRetry}
      />
      
      {/* Renderizar componentes hijos con los datos */}
      {children({
        data,
        isLoading: isLoading && Object.keys(data).length === 0,
        isRealtimeData: hasRealtimeData
      })}
    </>
  );
};

export default MarketDataWrapper; 