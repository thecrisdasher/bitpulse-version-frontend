import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ValueService, ValueMetric, ValueConfig } from '@/lib/services/ValueService';

interface UseValueServiceState {
  value: ValueMetric | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastRefresh: Date | null;
}

interface UseValueServiceOptions {
  autoRefresh?: boolean;
  onError?: (error: string) => void;
  onUpdate?: (value: ValueMetric) => void;
}

export function useValueService(
  config: ValueConfig,
  options: UseValueServiceOptions = {}
) {
  // Memoize config to prevent unnecessary recalculations
  const memoizedConfig = useMemo(() => config, [
    config.instrument,
    config.category,
    config.valueType,
    config.period,
    config.refreshInterval
  ]);

  const [state, setState] = useState<UseValueServiceState>({
    value: null,
    loading: false,
    error: null,
    isConnected: false,
    lastRefresh: null
  });

  const serviceRef = useRef<ValueService | null>(null);
  const { autoRefresh = true, onError, onUpdate } = options;

  // Inicializar servicio
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new ValueService();
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.cleanup();
        serviceRef.current = null;
      }
    };
  }, []);

  // Función para calcular valor
  const calculateValue = useCallback(async () => {
    if (!serviceRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await serviceRef.current.calculateValue(memoizedConfig);
      
      setState(prev => ({
        ...prev,
        value: result,
        loading: false,
        isConnected: true,
        lastRefresh: new Date(),
        error: null
      }));

      onUpdate?.(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isConnected: false
      }));

      onError?.(errorMessage);
    }
  }, [memoizedConfig, onError, onUpdate]);

  // Efecto para calcular valor inicial
  useEffect(() => {
    if (memoizedConfig.instrument && memoizedConfig.valueType) {
      calculateValue();
    }
  }, [calculateValue, memoizedConfig]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      calculateValue();
    }, memoizedConfig.refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, memoizedConfig.refreshInterval, calculateValue]);

  // Función para refresh manual
  const refresh = useCallback(() => {
    calculateValue();
  }, [calculateValue]);

  // Función para limpiar datos
  const reset = useCallback(() => {
    setState({
      value: null,
      loading: false,
      error: null,
      isConnected: false,
      lastRefresh: null
    });
  }, []);

  return {
    ...state,
    refresh,
    reset,
    isLoading: state.loading,
    hasError: !!state.error,
    // Helpers para componentes
    getTrendIcon: () => {
      if (!state.value) return '📊';
      switch (state.value.trend) {
        case 'up': return '📈';
        case 'down': return '📉';
        default: return '📊';
      }
    },
    getTrendColor: () => {
      if (!state.value) return 'text-muted-foreground';
      switch (state.value.trend) {
        case 'up': return 'text-green-500';
        case 'down': return 'text-red-500';
        default: return 'text-blue-500';
      }
    },
    getConfidenceColor: () => {
      if (!state.value) return 'bg-gray-200';
      const confidence = state.value.confidence;
      if (confidence >= 80) return 'bg-green-500';
      if (confidence >= 60) return 'bg-yellow-500';
      if (confidence >= 40) return 'bg-orange-500';
      return 'bg-red-500';
    }
  };
}

// Hook especializado para múltiples valores
export function useMultipleValues(configs: ValueConfig[], options: UseValueServiceOptions = {}) {
  const [values, setValues] = useState<{ [key: string]: ValueMetric }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const serviceRef = useRef<ValueService | null>(null);

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new ValueService();
    }

    return () => {
      serviceRef.current?.cleanup();
    };
  }, []);

  const calculateAll = useCallback(async () => {
    if (!serviceRef.current) return;

    // Inicializar estados de loading
    const loadingStates = configs.reduce((acc, config, index) => {
      acc[index] = true;
      return acc;
    }, {} as { [key: string]: boolean });
    
    setLoading(loadingStates);

    // Calcular todos los valores en paralelo
    const promises = configs.map(async (config, index) => {
      try {
        const result = await serviceRef.current!.calculateValue(config);
        
        setValues(prev => ({ ...prev, [index]: result }));
        setErrors(prev => ({ ...prev, [index]: null }));
        setLoading(prev => ({ ...prev, [index]: false }));
        
        return { index, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        
        setErrors(prev => ({ ...prev, [index]: errorMessage }));
        setLoading(prev => ({ ...prev, [index]: false }));
        
        return { index, error: errorMessage };
      }
    });

    await Promise.allSettled(promises);
  }, [configs]);

  useEffect(() => {
    calculateAll();
  }, [calculateAll]);

  return {
    values,
    loading,
    errors,
    refresh: calculateAll,
    isAnyLoading: Object.values(loading).some(Boolean),
    hasAnyError: Object.values(errors).some(Boolean)
  };
}

// Hook para configuraciones predefinidas
export function usePresetValues() {
  const presets = {
    bitcoinOpportunity: {
      instrument: 'bitcoin',
      category: 'crypto' as const,
      valueType: 'opportunity' as const,
      period: '1d' as const,
      refreshInterval: 5
    },
    portfolioValue: {
      instrument: 'portfolio',
      category: 'crypto' as const,
      valueType: 'portfolio' as const,
      period: '1d' as const,
      refreshInterval: 2
    },
    marketHealth: {
      instrument: 'bitcoin',
      category: 'crypto' as const,
      valueType: 'market_health' as const,
      period: '7d' as const,
      refreshInterval: 10
    }
  };

  return {
    presets,
    createConfig: (preset: keyof typeof presets, overrides?: Partial<ValueConfig>) => ({
      ...presets[preset],
      ...overrides
    })
  };
} 