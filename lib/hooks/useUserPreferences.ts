'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logging/logger';

export interface UserPreferences {
  // Configuración de trading
  defaultLeverage: number;
  defaultCapitalFraction: number;
  riskWarningEnabled: boolean;
  autoClosePositions: boolean;
  
  // Configuración de UI
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  chartType: 'candlestick' | 'line' | 'area';
  showAdvancedMetrics: boolean;
  
  // Configuración de notificaciones
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradingAlerts: boolean;
  priceAlerts: boolean;
  
  // Configuración de dashboard
  dashboardLayout: 'compact' | 'expanded';
  favoriteInstruments: string[];
  hiddenWidgets: string[];
  
  // Configuración de privacidad
  shareAnalytics: boolean;
  allowCookies: boolean;
  
  // Configuración avanzada
  apiTimeout: number;
  refreshInterval: number;
  maxPositions: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  // Trading defaults
  defaultLeverage: 1,
  defaultCapitalFraction: 0.1,
  riskWarningEnabled: true,
  autoClosePositions: false,
  
  // UI defaults
  theme: 'system',
  language: 'es',
  chartType: 'candlestick',
  showAdvancedMetrics: false,
  
  // Notifications defaults
  emailNotifications: true,
  pushNotifications: false,
  tradingAlerts: true,
  priceAlerts: false,
  
  // Dashboard defaults
  dashboardLayout: 'expanded',
  favoriteInstruments: ['BTC/USD', 'ETH/USD'],
  hiddenWidgets: [],
  
  // Privacy defaults
  shareAnalytics: false,
  allowCookies: true,
  
  // Advanced defaults
  apiTimeout: 5000,
  refreshInterval: 1000,
  maxPositions: 10,
};

const PREFERENCES_COOKIE_NAME = 'bitpulse_preferences';
const PREFERENCES_EXPIRY_DAYS = 365;

export function useUserPreferences() {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar preferencias desde cookies al inicializar
  useEffect(() => {
    loadPreferences();
  }, [isAuthenticated, user]);

  // Cargar preferencias desde cookies
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Intentar cargar desde cookies del navegador
      const cookiePreferences = getCookiePreferences();
      
      if (cookiePreferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...cookiePreferences });
        logger.debug('user_activity', 'Preferences loaded from cookies', {
          userId: user?.id,
          preferencesCount: Object.keys(cookiePreferences).length
        });
      } else {
        // Si no hay preferencias guardadas, usar defaults
        setPreferences(DEFAULT_PREFERENCES);
        logger.info('user_activity', 'Using default preferences', {
          userId: user?.id
        });
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
      logger.error('system', 'Failed to load user preferences', error as Error, {
        userId: user?.id
      });
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Obtener preferencias desde cookies del navegador
  const getCookiePreferences = (): Partial<UserPreferences> | null => {
    try {
      if (typeof document === 'undefined') return null;
      
      const cookies = document.cookie.split(';');
      const preferencesCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${PREFERENCES_COOKIE_NAME}=`)
      );
      
      if (!preferencesCookie) return null;
      
      const cookieValue = preferencesCookie.split('=')[1];
      const decodedValue = decodeURIComponent(cookieValue);
      
      return JSON.parse(decodedValue);
    } catch (error) {
      console.error('Error parsing preferences cookie:', error);
      return null;
    }
  };

  // Guardar preferencias en cookies
  const savePreferencesToCookie = useCallback((prefs: UserPreferences) => {
    try {
      if (typeof document === 'undefined') return;
      
      const cookieValue = encodeURIComponent(JSON.stringify(prefs));
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + PREFERENCES_EXPIRY_DAYS);
      
      document.cookie = `${PREFERENCES_COOKIE_NAME}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      
      logger.info('user_activity', 'Preferences saved to cookies', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving preferences to cookie:', error);
      logger.error('system', 'Failed to save preferences to cookies', error as Error, {
        userId: user?.id
      });
    }
  }, [user]);

  // Actualizar una preferencia específica
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      
      // Guardar inmediatamente en cookies
      savePreferencesToCookie(newPreferences);
      
      // Log del cambio
      logger.logUserActivity('preference_updated', user?.id, {
        preference: key,
        oldValue: prev[key],
        newValue: value
      });
      
      setHasChanges(true);
      return newPreferences;
    });
  }, [user, savePreferencesToCookie]);

  // Actualizar múltiples preferencias
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      
      // Guardar inmediatamente en cookies
      savePreferencesToCookie(newPreferences);
      
      // Log de los cambios
      logger.logUserActivity('preferences_bulk_updated', user?.id, {
        updatedKeys: Object.keys(updates),
        changes: updates
      });
      
      setHasChanges(true);
      return newPreferences;
    });
  }, [user, savePreferencesToCookie]);

  // Resetear a valores por defecto
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferencesToCookie(DEFAULT_PREFERENCES);
    
    logger.logUserActivity('preferences_reset', user?.id, {
      timestamp: new Date().toISOString()
    });
    
    setHasChanges(true);
  }, [user, savePreferencesToCookie]);

  // Exportar preferencias
  const exportPreferences = useCallback(() => {
    const exportData = {
      preferences,
      exportedAt: new Date().toISOString(),
      userId: user?.id,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitpulse-preferences-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    logger.logUserActivity('preferences_exported', user?.id);
  }, [preferences, user]);

  // Importar preferencias
  const importPreferences = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          if (importData.preferences) {
            const validatedPreferences = { ...DEFAULT_PREFERENCES, ...importData.preferences };
            updatePreferences(validatedPreferences);
            
            logger.logUserActivity('preferences_imported', user?.id, {
              importedFrom: importData.userId,
              importedAt: importData.exportedAt
            });
            
            resolve();
          } else {
            reject(new Error('Invalid preferences file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [updatePreferences, user]);

  // Obtener preferencia específica con tipo seguro
  const getPreference = useCallback(<K extends keyof UserPreferences>(
    key: K
  ): UserPreferences[K] => {
    return preferences[key];
  }, [preferences]);

  // Verificar si una preferencia ha cambiado desde el valor por defecto
  const hasPreferenceChanged = useCallback(<K extends keyof UserPreferences>(
    key: K
  ): boolean => {
    return preferences[key] !== DEFAULT_PREFERENCES[key];
  }, [preferences]);

  return {
    preferences,
    isLoading,
    hasChanges,
    
    // Métodos de actualización
    updatePreference,
    updatePreferences,
    resetPreferences,
    
    // Métodos de importación/exportación
    exportPreferences,
    importPreferences,
    
    // Métodos de consulta
    getPreference,
    hasPreferenceChanged,
    
    // Recargar preferencias
    reload: loadPreferences,
    
    // Constantes útiles
    DEFAULT_PREFERENCES
  };
} 