'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logging/logger';
import type { 
  AuthState, 
  AuthContextType, 
  LoginCredentials, 
  RegisterData, 
  User,
  AuthTokens,
  Permission,
  UserRole
} from '@/lib/types/auth';
import { AUTH_CONFIG, ROLE_PERMISSIONS } from '@/lib/config/auth';
import { useRouter } from 'next/navigation';

/**
 * Context para manejo de autenticación en React con logging integrado
 */

// Estado inicial
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: []
};

// Tipos de acciones del reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_TOKENS'; payload: AuthTokens };

// Reducer para manejo del estado
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'LOGIN_SUCCESS':
      // Log del login exitoso
      logger.logAuth('info', 'login', true, {
        email: action.payload.user.email,
        role: action.payload.user.role
      });

      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: ROLE_PERMISSIONS[action.payload.user.role] || []
      };

    case 'LOGOUT':
      // Log del logout
      if (state.user) {
        logger.logAuth('info', 'logout', true, {
          email: state.user.email
        });
      }

      return {
        ...initialState,
        isLoading: false
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'UPDATE_USER':
      logger.logUserActivity('profile_updated', action.payload.id, {
        updatedFields: Object.keys(action.payload)
      });

      return {
        ...state,
        user: action.payload,
        permissions: ROLE_PERMISSIONS[action.payload.role] || []
      };

    case 'SET_TOKENS':
      return {
        ...state,
        tokens: action.payload
      };

    default:
      return state;
  }
}

// Crear contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook para usar el contexto
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Cargar token desde localStorage al iniciar
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Cargar autenticación almacenada
  const loadStoredAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const storedTokens = localStorage.getItem('auth_tokens');
      if (!storedTokens) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const tokens: AuthTokens = JSON.parse(storedTokens);
      
      // Verificar si el token es válido obteniendo el perfil
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { 
              user: result.data, 
              tokens 
            } 
          });

          // Log de sesión restaurada
          logger.logUserActivity('session_restored', result.data.id, {
            email: result.data.email
          });
          return;
        }
      }

      // Token inválido, limpiar storage
      localStorage.removeItem('auth_tokens');
      dispatch({ type: 'SET_LOADING', payload: false });

      logger.logAuth('warn', 'session_expired', false, {
        failureReason: 'Invalid stored token'
      });

    } catch (error) {
      console.error('Error loading stored auth:', error);
      localStorage.removeItem('auth_tokens');
      dispatch({ type: 'SET_LOADING', payload: false });

      logger.error('auth', 'Failed to load stored authentication', error as Error);
    }
  };

  // Función de login
  const login = async (credentials: LoginCredentials) => {
    const startTime = performance.now();
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      logger.logAuth('info', 'login', true, {
        email: credentials.email
      });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!result.success) {
        logger.logAuth('warn', 'login', false, {
          email: credentials.email,
          failureReason: result.message
        });
        throw new Error(result.message || 'Error en el login');
      }

      const { user, tokens } = result.data;

      // Guardar tokens en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, tokens } 
      });

      // Log de rendimiento del login
      const duration = performance.now() - startTime;
      logger.logPerformance('user_login', duration, {
        userId: user.id,
        email: user.email
      });

      toast.success('¡Bienvenido de vuelta!');

      // Redirección automática basada en el rol
      setTimeout(() => {
        switch (user.role) {
          case 'admin':
            router.push('/statistics');
            break;
          case 'maestro':
            router.push('/learning');
            break;
          case 'cliente':
          default:
            router.push('/');
            break;
        }
      }, 1000); // Delay de 1 segundo para mostrar el toast

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ type: 'SET_ERROR', payload: message });
      
      logger.logAuth('error', 'login', false, {
        email: credentials.email,
        failureReason: message
      });
      
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de registro
  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      logger.logAuth('info', 'register', true, {
        email: data.email
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors) {
          // Manejar errores de validación
          const errorMessages = Object.values(result.errors).flat();
          const message = errorMessages.join(', ');
          
          logger.logAuth('warn', 'register', false, {
            email: data.email,
            failureReason: message
          });
          
          throw new Error(message);
        }
        
        logger.logAuth('warn', 'register', false, {
          email: data.email,
          failureReason: result.message
        });
        
        throw new Error(result.message || 'Error en el registro');
      }

      logger.logAuth('info', 'register', true, {
        email: data.email
      });

      toast.success('¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      if (state.tokens?.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      logger.error('auth', 'Logout API call failed', error as Error, {
        userId: state.user?.id
      });
    } finally {
      // Limpiar storage local
      localStorage.removeItem('auth_tokens');
      
      // Limpiar todas las cookies manualmente también
      document.cookie = 'bitpulse_session=; Max-Age=0; path=/';
      document.cookie = 'refresh_token=; Max-Age=0; path=/';
      document.cookie = 'user_info=; Max-Age=0; path=/';
      
      dispatch({ type: 'LOGOUT' });
      toast.success('Sesión cerrada exitosamente');
      
      // Redirigir a la página de login
      router.push('/auth');
    }
  };

  // Función para refrescar token
  const refreshToken = async () => {
    try {
      logger.debug('auth', 'Attempting token refresh');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Para enviar cookies
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newTokens: AuthTokens = result.data;
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          dispatch({ type: 'SET_TOKENS', payload: newTokens });
          
          logger.logUserActivity('token_refresh_success', state.user?.id);
          
          return true;
        }
      }

      // Si falla el refresh, hacer logout
      logger.logUserActivity('token_refresh_failed', state.user?.id, {
        reason: 'Refresh token invalid or expired'
      });
      
      await logout();
      return false;

    } catch (error) {
      console.error('Error refreshing token:', error);
      logger.error('auth', 'Token refresh failed', error as Error, {
        userId: state.user?.id
      });
      await logout();
      return false;
    }
  };

  // Función para actualizar usuario
  const updateUser = async (data: Partial<User>) => {
    try {
      if (!state.tokens?.accessToken) {
        throw new Error('No autenticado');
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${state.tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar perfil');
      }

      dispatch({ type: 'UPDATE_USER', payload: result.data });
      toast.success('Perfil actualizado exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ type: 'SET_ERROR', payload: message });
      
      logger.error('auth', 'Profile update failed', error as Error, {
        userId: state.user?.id,
        updateData: data
      });
      
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Verificar permiso
  const checkPermission = (permission: Permission): boolean => {
    const hasPermission = state.permissions.includes(permission);
    
    if (!hasPermission) {
      logger.logUserActivity('permission_denied', state.user?.id, {
        requestedPermission: permission,
        userPermissions: state.permissions
      });
    }
    
    return hasPermission;
  };

  // Verificar rol
  const hasRole = (role: UserRole): boolean => {
    const hasUserRole = state.user?.role === role;
    
    if (!hasUserRole) {
      logger.debug('auth', 'Role check failed', {
        userId: state.user?.id,
        userRole: state.user?.role,
        requiredRole: role
      });
    }
    
    return hasUserRole;
  };

  // Configurar interceptor para refresh automático del token
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si recibimos 401 y tenemos un usuario autenticado, intentar refresh
      if (response.status === 401 && state.isAuthenticated) {
        logger.warn('auth', 'Received 401, attempting token refresh');
        const refreshed = await refreshToken();
        
        if (refreshed && state.tokens) {
          // Reintentar la petición original con el nuevo token
          const [url, options] = args;
          const newOptions = {
            ...options,
            headers: {
              ...((options as RequestInit)?.headers || {}),
              'Authorization': `Bearer ${state.tokens.accessToken}`
            }
          };
          
          return originalFetch(url, newOptions);
        }
      }
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [state.isAuthenticated, state.tokens]);

  // Log de actividad del usuario cada 5 minutos si está autenticado
  useEffect(() => {
    if (!state.isAuthenticated || !state.user) return;

    const interval = setInterval(() => {
      logger.logUserActivity('session_active', state.user!.id, {
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.user]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    checkPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
} 