'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
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

/**
 * Context para manejo de autenticación en React
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
          return;
        }
      }

      // Token inválido, limpiar storage
      localStorage.removeItem('auth_tokens');
      dispatch({ type: 'LOGOUT' });

    } catch (error) {
      console.error('Error loading stored auth:', error);
      localStorage.removeItem('auth_tokens');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de login
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error en el login');
      }

      const { user, tokens } = result.data;

      // Guardar tokens en localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, tokens } 
      });

      toast.success('¡Bienvenido de vuelta!');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Función de registro
  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

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
          throw new Error(errorMessages.join(', '));
        }
        throw new Error(result.message || 'Error en el registro');
      }

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
    } finally {
      // Limpiar storage local
      localStorage.removeItem('auth_tokens');
      dispatch({ type: 'LOGOUT' });
      toast.success('Sesión cerrada exitosamente');
    }
  };

  // Función para refrescar token
  const refreshToken = async () => {
    try {
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
          return true;
        }
      }

      // Si falla el refresh, hacer logout
      await logout();
      return false;

    } catch (error) {
      console.error('Error refreshing token:', error);
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
      toast.error(message);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Verificar permiso
  const checkPermission = (permission: Permission): boolean => {
    return state.permissions.includes(permission);
  };

  // Verificar rol
  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role;
  };

  // Configurar interceptor para refresh automático del token
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si recibimos 401 y tenemos tokens, intentar refresh
      if (response.status === 401 && state.tokens?.accessToken) {
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess && args[1]?.headers) {
          // Reintentar la petición original con el nuevo token
          const newTokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
          if (newTokens.accessToken) {
            const headers = args[1].headers as Record<string, string>;
            headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            return originalFetch(...args);
          }
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [state.tokens]);

  const value: AuthContextType = {
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 