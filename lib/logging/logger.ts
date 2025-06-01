/**
 * Sistema de Logs Completo para BitPulse
 * Maneja logs tanto del cliente como del servidor con diferentes niveles
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogCategory = 
  | 'auth' 
  | 'trading' 
  | 'user_activity' 
  | 'system' 
  | 'security' 
  | 'performance' 
  | 'api' 
  | 'ui';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  environment: 'client' | 'server';
}

export interface TradingLogEntry extends LogEntry {
  category: 'trading';
  metadata: {
    action: 'position_open' | 'position_close' | 'trade_executed' | 'risk_warning' | 'margin_call';
    instrumentName: string;
    direction?: 'up' | 'down';
    amount?: number;
    leverage?: number;
    marginLevel?: number;
    pnl?: number;
  };
}

export interface AuthLogEntry extends LogEntry {
  category: 'auth';
  metadata: {
    action: 'login' | 'logout' | 'register' | 'password_change' | 'session_expired' | 'unauthorized_access';
    email?: string;
    role?: string;
    success: boolean;
    failureReason?: string;
  };
}

export interface SecurityLogEntry extends LogEntry {
  category: 'security';
  metadata: {
    action: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'csrf_attempt' | 'injection_attempt';
    threat_level: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
  };
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLocalLogs = 1000; // Máximo de logs en memoria
  private isClient = typeof window !== 'undefined';

  private constructor() {
    // Configurar limpieza periódica de logs antiguos
    if (this.isClient) {
      setInterval(() => this.cleanupOldLogs(), 5 * 60 * 1000); // Cada 5 minutos
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log genérico
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      stackTrace: error?.stack,
      environment: this.isClient ? 'client' : 'server'
    };

    // Agregar información del cliente si está disponible
    if (this.isClient) {
      logEntry.userAgent = navigator.userAgent;
      logEntry.url = window.location.href;
    }

    this.addLogEntry(logEntry);
  }

  /**
   * Log de actividad de trading
   */
  public logTrading(
    level: LogLevel,
    action: TradingLogEntry['metadata']['action'],
    instrumentName: string,
    additionalData?: Partial<TradingLogEntry['metadata']>
  ): void {
    const tradingLog: TradingLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      category: 'trading',
      message: `Trading action: ${action} on ${instrumentName}`,
      metadata: {
        action,
        instrumentName,
        ...additionalData
      },
      environment: this.isClient ? 'client' : 'server'
    };

    this.addLogEntry(tradingLog);
  }

  /**
   * Log de autenticación
   */
  public logAuth(
    level: LogLevel,
    action: AuthLogEntry['metadata']['action'],
    success: boolean,
    additionalData?: Partial<AuthLogEntry['metadata']>
  ): void {
    const authLog: AuthLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      category: 'auth',
      message: `Auth action: ${action} - ${success ? 'SUCCESS' : 'FAILED'}`,
      metadata: {
        action,
        success,
        ...additionalData
      },
      environment: this.isClient ? 'client' : 'server'
    };

    this.addLogEntry(authLog);
  }

  /**
   * Log de seguridad
   */
  public logSecurity(
    action: SecurityLogEntry['metadata']['action'],
    threatLevel: SecurityLogEntry['metadata']['threat_level'],
    details: Record<string, any>
  ): void {
    const securityLog: SecurityLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: threatLevel === 'critical' || threatLevel === 'high' ? 'error' : 'warn',
      category: 'security',
      message: `Security event: ${action} (${threatLevel} threat level)`,
      metadata: {
        action,
        threat_level: threatLevel,
        details
      },
      environment: this.isClient ? 'client' : 'server'
    };

    this.addLogEntry(securityLog);
  }

  /**
   * Log de actividad del usuario
   */
  public logUserActivity(
    action: string,
    userId?: string,
    details?: Record<string, any>
  ): void {
    this.log('info', 'user_activity', `User activity: ${action}`, {
      action,
      userId,
      ...details
    });
  }

  /**
   * Log de rendimiento
   */
  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const level: LogLevel = duration > 5000 ? 'warn' : 'info'; // Warn si toma más de 5 segundos
    
    this.log(level, 'performance', `Operation "${operation}" took ${duration}ms`, {
      operation,
      duration,
      ...metadata
    });
  }

  /**
   * Métodos de conveniencia
   */
  public debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log('debug', category, message, metadata);
  }

  public info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log('info', category, message, metadata);
  }

  public warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.log('warn', category, message, metadata);
  }

  public error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', category, message, metadata, error);
  }

  public critical(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('critical', category, message, metadata, error);
  }

  /**
   * Agregar entrada de log
   */
  private addLogEntry(logEntry: LogEntry): void {
    // Agregar al almacén local
    this.logs.push(logEntry);

    // Limitar el número de logs en memoria
    if (this.logs.length > this.maxLocalLogs) {
      this.logs = this.logs.slice(-this.maxLocalLogs);
    }

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    // Enviar a servidor si está en cliente (en lotes para eficiencia)
    if (this.isClient) {
      this.scheduleServerSync(logEntry);
    }

    // Guardar en localStorage si es crítico
    if (logEntry.level === 'critical' || logEntry.level === 'error') {
      this.saveToLocalStorage(logEntry);
    }
  }

  /**
   * Log en consola con formato
   */
  private logToConsole(logEntry: LogEntry): void {
    const emoji = this.getLevelEmoji(logEntry.level);
    const categoryEmoji = this.getCategoryEmoji(logEntry.category);
    
    const message = `${emoji} ${categoryEmoji} [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(message, logEntry.metadata);
        break;
      case 'info':
        console.info(message, logEntry.metadata);
        break;
      case 'warn':
        console.warn(message, logEntry.metadata);
        break;
      case 'error':
      case 'critical':
        console.error(message, logEntry.metadata, logEntry.stackTrace);
        break;
    }
  }

  /**
   * Obtener emoji para nivel de log
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    };
    return emojis[level];
  }

  /**
   * Obtener emoji para categoría
   */
  private getCategoryEmoji(category: LogCategory): string {
    const emojis = {
      auth: '🔐',
      trading: '📈',
      user_activity: '👤',
      system: '⚙️',
      security: '🛡️',
      performance: '⚡',
      api: '🌐',
      ui: '🎨'
    };
    return emojis[category];
  }

  /**
   * Programar sincronización con servidor
   */
  private scheduleServerSync(logEntry: LogEntry): void {
    // Usar debouncing para enviar logs en lotes
    if (!this.isClient) return;

    // Para logs críticos, enviar inmediatamente
    if (logEntry.level === 'critical' || logEntry.category === 'security') {
      this.syncToServer([logEntry]);
      return;
    }

    // Para otros logs, agrupar y enviar cada 30 segundos
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      const pendingLogs = this.logs.filter(log => !log.metadata?.synced);
      if (pendingLogs.length > 0) {
        this.syncToServer(pendingLogs);
      }
    }, 30000);
  }

  private syncTimer?: NodeJS.Timeout;

  /**
   * Sincronizar logs con el servidor
   */
  private async syncToServer(logs: LogEntry[]): Promise<void> {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (response.ok) {
        // Marcar logs como sincronizados
        logs.forEach(log => {
          if (log.metadata) {
            log.metadata.synced = true;
          } else {
            log.metadata = { synced: true };
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync logs to server:', error);
    }
  }

  /**
   * Guardar en localStorage para logs críticos
   */
  private saveToLocalStorage(logEntry: LogEntry): void {
    if (!this.isClient) return;

    try {
      const key = 'bitpulse_critical_logs';
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      existingLogs.push(logEntry);
      
      // Mantener solo los últimos 100 logs críticos
      const limitedLogs = existingLogs.slice(-100);
      localStorage.setItem(key, JSON.stringify(limitedLogs));
    } catch (error) {
      console.error('Failed to save critical log to localStorage:', error);
    }
  }

  /**
   * Limpiar logs antiguos
   */
  private cleanupOldLogs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => new Date(log.timestamp) > oneDayAgo);
  }

  /**
   * Obtener logs filtrados
   */
  public getLogs(filters?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filters.endDate!);
      }
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Exportar logs para análisis
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'environment'];
      const csvData = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userId || '',
          log.environment
        ].join(','))
      ];
      return csvData.join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Obtener estadísticas de logs
   */
  public getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogCategory, number>;
    last24Hours: number;
  } {
    const logs = this.getLogs();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = {
      total: logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<LogCategory, number>,
      last24Hours: logs.filter(log => new Date(log.timestamp) > last24Hours).length
    };

    // Inicializar contadores
    (['debug', 'info', 'warn', 'error', 'critical'] as LogLevel[]).forEach(level => {
      stats.byLevel[level] = 0;
    });
    
    (['auth', 'trading', 'user_activity', 'system', 'security', 'performance', 'api', 'ui'] as LogCategory[]).forEach(category => {
      stats.byCategory[category] = 0;
    });

    // Contar logs
    logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category]++;
    });

    return stats;
  }
}

// Instancia singleton del logger
export const logger = Logger.getInstance();

// Exportar métodos de conveniencia
export const {
  debug,
  info,
  warn,
  error,
  critical,
  logTrading,
  logAuth,
  logSecurity,
  logUserActivity,
  logPerformance,
  getLogs,
  exportLogs,
  getLogStats
} = logger; 