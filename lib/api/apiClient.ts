import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  API_URLS, 
  PROXY_URLS, 
  HTTP_CONFIG,
  API_PROVIDERS,
  INSTRUMENT_API_MAPPING
} from './apiConfig';

/**
 * Tipos e interfaces para el cliente API
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  provider?: string;
  category?: string;
  instrument?: string;
  useProxy?: boolean;
  skipRetry?: boolean;
  useFetch?: boolean; // Nueva opción para usar fetch en lugar de axios
}

interface RetryableError extends Error {
  isRetryable?: boolean;
  statusCode?: number;
  originalError?: any;
}

// Determinar si estamos en desarrollo local
const isLocalDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Función para espera exponencial para reintentos
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verifica si un error es reintentable (problemas de red, timeouts, 429s, 5xx)
 */
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Timeout, errores de red, o sin respuesta
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Si hay una respuesta, verificar el código
  if (error.response) {
    const status = error.response.status;
    // Rate limiting (429) o errores de servidor (5xx)
    return status === 429 || (status >= 500 && status < 600);
  }
  
  // Errores de solicitud sin respuesta (posiblemente problemas de red)
  if (error.request && !error.response) {
    return true;
  }
  
  return false;
};

/**
 * Verificar si un error de fetch es reintentable
 */
const isFetchRetryableError = (status: number, error?: any): boolean => {
  if (!status) return !!error; // Si no hay status, considerar reintentable solo si hay error
  
  // Rate limiting (429) o errores de servidor (5xx)
  return status === 429 || (status >= 500 && status < 600);
};

/**
 * Obtener URL base para un proveedor, considerando proxies en desarrollo
 */
export const getBaseUrl = (provider: string, useProxy: boolean = isLocalDevelopment): string => {
  const providerKey = provider.toUpperCase() as keyof typeof API_URLS;
  
  if (useProxy && isLocalDevelopment) {
    return PROXY_URLS[providerKey] || API_URLS[providerKey];
  }
  
  return API_URLS[providerKey] || '';
};

/**
 * Formatea la URL completa para una solicitud
 */
export const formatApiUrl = (url: string, provider: string, useProxy: boolean = isLocalDevelopment): string => {
  // Si ya es una URL completa, devolverla
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Obtener URL base para el proveedor
  const baseUrl = getBaseUrl(provider, useProxy);
  
  // Limpiar barras diagonales duplicadas
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  return `${baseUrl}/${cleanUrl}`;
};

/**
 * Determina el siguiente proveedor de API para reintentar
 * cuando el proveedor actual falla
 */
export const getNextProvider = (currentProvider: string, category: string, instrument?: string): string | null => {
  // Si hay un mapeo específico para este instrumento, usarlo
  if (instrument && INSTRUMENT_API_MAPPING[instrument]) {
    const providers = INSTRUMENT_API_MAPPING[instrument];
    const currentIndex = providers.indexOf(currentProvider);
    
    // Si hay un siguiente proveedor en la lista, usarlo
    if (currentIndex >= 0 && currentIndex < providers.length - 1) {
      return providers[currentIndex + 1];
    }
    
    return null; // No hay más proveedores para este instrumento
  }
  
  // De lo contrario, usar la lista general de proveedores por categoría
  const categoryKey = category.toUpperCase() as keyof typeof API_PROVIDERS;
  if (API_PROVIDERS[categoryKey]) {
    const providers = API_PROVIDERS[categoryKey];
    const currentIndex = providers.indexOf(currentProvider);
    
    // Si hay un siguiente proveedor en la lista, usarlo
    if (currentIndex >= 0 && currentIndex < providers.length - 1) {
      return providers[currentIndex + 1];
    }
  }
  
  return null; // No hay más proveedores para esta categoría
};

/**
 * Realizar una petición usando fetch nativo (alternativa a axios)
 */
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit & { timeout?: number }
): Promise<Response> => {
  const { timeout = HTTP_CONFIG.DEFAULT_TIMEOUT, ...fetchOptions } = options;
  
  // Crear señal con timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Realizar la petición con fetch
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Convertir respuesta de fetch a formato compatible con axios
 */
const createAxiosResponseFromFetch = async<T = any>(
  response: Response,
  config: ApiRequestConfig
): Promise<AxiosResponse<T>> => {
  const data = await response.json() as T;
  
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    config: config as any,
    request: null
  };
};

/**
 * Cliente HTTP mejorado con reintentos y fallbacks
 */
export const apiClient = {
  /**
   * Realizar solicitud HTTP con reintentos y fallbacks a múltiples APIs
   */
  async request<T = any>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    const {
      url,
      provider = 'COIN_GECKO',
      category = 'CRYPTO',
      instrument,
      useProxy = isLocalDevelopment,
      skipRetry = false,
      timeout = HTTP_CONFIG.DEFAULT_TIMEOUT,
      useFetch = false, // Usar fetch como alternativa
      ...restConfig
    } = config;
    
    if (!url) {
      throw new Error('URL es requerida para realizar una solicitud');
    }
    
    let currentProvider = provider;
    let currentUrl = formatApiUrl(url, currentProvider, useProxy);
    let retries = skipRetry ? 0 : HTTP_CONFIG.RETRY_ATTEMPTS;
    let backoff = HTTP_CONFIG.INITIAL_BACKOFF;
    
    // Intentar con múltiples proveedores si es necesario
    while (true) {
      try {
        // Configurar encabezados comunes
        const commonHeaders = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        };
        
        // Si se solicitó usar fetch nativo en lugar de axios
        if (useFetch) {
          // Convertir config de axios a options de fetch
          const fetchOptions: RequestInit = {
            method: restConfig.method || 'GET',
            headers: {
              ...commonHeaders,
              ...(restConfig.headers as Record<string, string> || {})
            },
            signal: AbortSignal.timeout(timeout), // Use AbortSignal instead of timeout
            body: restConfig.data ? 
              (typeof restConfig.data === 'string' ? restConfig.data : JSON.stringify(restConfig.data)) 
              : undefined
          };
          
          // Realizar la solicitud con fetch
          const response = await fetchWithTimeout(currentUrl, fetchOptions);
          
          // Si hay error en la respuesta
          if (!response.ok) {
            // Verificar si debemos reintentar
            const shouldRetry = isFetchRetryableError(response.status) && retries > 0;
            
            if (shouldRetry) {
              // Reducir el número de reintentos y esperar
              retries--;
              
              console.warn(`Error al conectar con ${currentProvider} (${currentUrl}). Reintentando en ${backoff}ms...`);
              await sleep(backoff);
              
              // Aumentar el backoff para el próximo reintento
              backoff = Math.min(backoff * 2, HTTP_CONFIG.MAX_BACKOFF);
              continue;
            }
            
            // Probar con el siguiente proveedor si el error no es reintentable
            const nextProvider = getNextProvider(currentProvider, category, instrument);
            
            if (nextProvider) {
              console.warn(`Cambiando de proveedor ${currentProvider} a ${nextProvider} para ${instrument || category}`);
              
              currentProvider = nextProvider;
              currentUrl = formatApiUrl(url, currentProvider, useProxy);
              retries = HTTP_CONFIG.RETRY_ATTEMPTS;
              backoff = HTTP_CONFIG.INITIAL_BACKOFF;
              
              if (nextProvider === 'MOCK') {
                console.log('Cambiando a datos simulados para', instrument || category);
                
                // Importar el servicio de datos simulados
                const { getMockMarketData } = await import('../services/mockDataService');
                const mockData = getMockMarketData(instrument || category || 'BTC');
                
                // Crear una respuesta simulada en formato fetch
                const mockResponse = new Response(JSON.stringify(mockData), {
                  status: 200,
                  statusText: 'OK',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                return await createAxiosResponseFromFetch(mockResponse, config);
              }
              
              continue;
            }
            
            // Si no hay más proveedores, lanzar error
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          // Convertir respuesta de fetch a formato de axios
          return await createAxiosResponseFromFetch(response, config);
        } else {
          // Usar axios normalmente
          // Configurar encabezados y opciones
          const requestConfig: AxiosRequestConfig = {
            ...restConfig,
            url: currentUrl,
            timeout,
            headers: {
              ...restConfig.headers,
              ...commonHeaders
            },
            // Aumentar el tiempo máximo de respuesta
            maxContentLength: 50 * 1024 * 1024, // 50MB
            maxBodyLength: 50 * 1024 * 1024, // 50MB
            transitional: {
              // Ser más tolerante con respuestas malformadas
              silentJSONParsing: true,
              forcedJSONParsing: true,
              clarifyTimeoutError: true
            }
          };
          
          // Realizar la solicitud
          const response = await axios(requestConfig);
          return response;
        }
      } catch (error: unknown) {
        // Manejar errores específicos de timeout
        const err = error as any;
        if (
          err.code === 'ETIMEDOUT' || 
          err.code === 'ECONNABORTED' || 
          (err.message && typeof err.message === 'string' && err.message.includes('timeout'))
        ) {
          console.warn(`Timeout (${timeout}ms) al conectar con ${currentProvider}. ${retries} reintentos restantes.`);
          
          // Si todavía hay reintentos disponibles
          if (retries > 0) {
            retries--;
            await sleep(backoff);
            backoff = Math.min(backoff * 2, HTTP_CONFIG.MAX_BACKOFF);
            continue;
          }
        }
        
        const axiosError = error as AxiosError;
        
        // Verificar si el error es reintentable y todavía tenemos reintentos
        const shouldRetry = isRetryableError(axiosError) && retries > 0;
        
        if (shouldRetry) {
          // Reducir el número de reintentos y esperar
          retries--;
          
          console.warn(`Error al conectar con ${currentProvider} (${currentUrl}). Reintentando en ${backoff}ms...`);
          await sleep(backoff);
          
          // Aumentar el backoff para el próximo reintento
          backoff = Math.min(backoff * 2, HTTP_CONFIG.MAX_BACKOFF);
          continue;
        }
        
        // Si no podemos reintentar con el mismo proveedor, intentar el siguiente
        const nextProvider = getNextProvider(currentProvider, category, instrument);
        
        if (nextProvider) {
          console.warn(`Cambiando de proveedor ${currentProvider} a ${nextProvider} para ${instrument || category}`);
          
          // Actualizar proveedor y URL para el siguiente intento
          currentProvider = nextProvider;
          currentUrl = formatApiUrl(url, currentProvider, useProxy);
          
          // Reiniciar los reintentos para el nuevo proveedor
          retries = HTTP_CONFIG.RETRY_ATTEMPTS;
          backoff = HTTP_CONFIG.INITIAL_BACKOFF;
          
          // Si el siguiente proveedor es MOCK, usar datos simulados
          if (nextProvider === 'MOCK') {
            console.log('Cambiando a datos simulados para', instrument || category);
            
            // Importar el servicio de datos simulados
            const { getMockMarketData } = await import('../services/mockDataService');
            const mockData = getMockMarketData(instrument || category || 'BTC');
            
            // Crear una respuesta simulada en formato axios
            const mockResponse: AxiosResponse = {
              data: mockData,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: config as any,
              request: {}
            };
            
            return mockResponse;
          }
          
          continue;
        }
        
        // No hay más proveedores para intentar, propagar el error
        console.error('Todos los proveedores de API fallaron. No se pudieron obtener datos.');
        
        // Crear un error más informativo
        const friendlyError: RetryableError = new Error(
          axiosError.response
            ? `Error ${axiosError.response.status}: ${axiosError.response.statusText}`
            : axiosError.message || 'Error de red'
        );
        
        friendlyError.isRetryable = false;
        friendlyError.statusCode = axiosError.response?.status;
        friendlyError.originalError = axiosError;
        
        throw friendlyError;
      }
    }
  },
  
  /**
   * Métodos de conveniencia
   */
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ 
      ...config, 
      url, 
      method: 'GET',
      // Para get, preferir fetch sobre axios por defecto para ciertos tipos de APIs
      useFetch: config?.provider === 'YAHOO_FINANCE' || config?.provider === 'COIN_GECKO' || config?.useFetch
    });
  },
  
  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  },
  
  /**
   * Realizar múltiples solicitudes en paralelo con límite
   */
  async batchRequests<T = any>(
    configs: ApiRequestConfig[],
    batchSize: number = HTTP_CONFIG.BATCH_SIZE
  ): Promise<Array<AxiosResponse<T> | null>> {
    const results: Array<AxiosResponse<T> | null> = new Array(configs.length).fill(null);
    
    // Procesar las solicitudes en lotes para evitar sobrecargar las APIs
    for (let i = 0; i < configs.length; i += batchSize) {
      const batch = configs.slice(i, i + batchSize);
      
      // Realizar solicitudes en paralelo, pero capturar los errores
      const batchPromises = batch.map((config, index) => 
        this.request<T>(config)
          .then(response => {
            results[i + index] = response;
            return response;
          })
          .catch(error => {
            console.error(`Error en solicitud batch ${i + index}:`, error.message);
            return null;
          })
      );
      
      await Promise.all(batchPromises);
      
      // Pequeña pausa entre lotes para evitar rate limiting
      if (i + batchSize < configs.length) {
        await sleep(300);
      }
    }
    
    return results;
  }
}; 