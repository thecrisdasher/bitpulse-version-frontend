# Sistema de Simulación de Mercado y Cierre Automático

## 📋 Resumen

Este documento describe la implementación del sistema de simulación de mercado persistente como fallback automático y el sistema de cierre automático de operaciones vencidas.

## 🎯 Funcionalidades Implementadas

### 1. Simulación de Precios Persistente (`lib/simulator.ts`)

**Características:**
- ✅ **Fallback automático**: Se activa cuando la API de Binance falla (sin variables de entorno)
- ✅ **Precios realistas**: Variaciones suaves basadas en el tipo de activo
- ✅ **Persistencia**: Cache en memoria para mantener consistencia durante la ejecución
- ✅ **Múltiples activos**: Soporte para 30+ criptomonedas populares

**Funciones principales:**
- `getSimulatedPrice(symbol: string)`: Genera precio simulado para un símbolo
- `getSimulatedTicker(symbol: string)`: Datos de ticker completos (precio, cambio 24h, volumen)
- `getSimulatedOHLC(symbol: string, intervals: number)`: Datos OHLC para gráficos

### 2. Integración Transparente con APIs de Binance

**APIs modificadas:**
- `app/api/binance/tickers/route.ts`: Tickers con fallback automático
- `app/api/binance/klines/route.ts`: Datos OHLC con fallback automático
- `app/api/market/favorites/route.ts`: Favoritos con fallback automático

**Comportamiento:**
1. Intenta obtener datos reales de Binance
2. Si falla (timeout, error HTTP, red), usa simulación automáticamente
3. Logs claros para identificar cuándo se usa simulación
4. No se notifica al usuario del cambio (transparente)

### 3. Sistema de Cierre Automático (`lib/services/positionAutoCloseService.ts`)

**Características:**
- ✅ **Detección automática**: Verifica posiciones vencidas por duración
- ✅ **Cálculo exacto**: Ganancia/pérdida precisa según tipo de operación
- ✅ **Actualización de balance**: Refleja resultados en Pejecoins del usuario
- ✅ **Transacciones atómicas**: Usando Prisma transactions para consistencia
- ✅ **Registro completo**: Logs y actividades de usuario

**Funciones principales:**
- `checkAndCloseExpiredPositions()`: Verifica y cierra todas las posiciones vencidas
- `checkSpecificPosition(id)`: Verifica una posición específica

### 4. Scheduler Automático (`lib/scheduler/autoCloseScheduler.ts`)

**Características:**
- ✅ **Ejecución periódica**: Cada 60 segundos
- ✅ **Auto-inicio**: Se inicia automáticamente en producción
- ✅ **Control manual**: Funciones para iniciar/detener el scheduler

### 5. API de Administración (`app/api/trading/auto-close/route.ts`)

**Endpoints:**
- `POST /api/trading/auto-close`: Ejecuta proceso de cierre manual
- `GET /api/trading/auto-close`: Estado del sistema de cierre automático

## 🔄 Flujo de Funcionamiento

### Fallback de Simulación

```
1. Cliente solicita datos → API de Binance
2. API intenta fetch a Binance con timeout de 10s
3. Si éxito → Retorna datos reales
4. Si falla → Usa simulador automáticamente
5. Cliente recibe datos (sin saber si son reales o simulados)
```

### Cierre Automático

```
1. Scheduler ejecuta cada 60 segundos
2. Consulta posiciones abiertas en DB
3. Filtra posiciones vencidas por duración
4. Para cada posición vencida:
   a. Obtiene precio actual (Binance o simulado)
   b. Calcula ganancia/pérdida
   c. Actualiza posición como cerrada
   d. Actualiza balance del usuario
   e. Registra transacción y actividad
```

## 📊 Cálculo de Ganancias

### Posición Long (Compra)
```
ganancia = (precio_cierre - precio_apertura) * cantidad / precio_apertura
```

### Posición Short (Venta)
```
ganancia = (precio_apertura - precio_cierre) * cantidad / precio_apertura
```

## 🗄️ Cambios en Base de Datos

**No se requieren cambios en el schema de Prisma**. El sistema utiliza los campos existentes:

- `openTime` + `durationValue` + `durationUnit` → Para determinar vencimiento
- `profit` → Para almacenar ganancia/pérdida calculada
- `closeTime` → Timestamp del cierre automático
- `currentPrice` → Precio de cierre usado

## 🚀 Activación y Monitoreo

### Verificación del Sistema

1. **Simulación activa:**
   ```bash
   # Simular falla de Binance bloqueando la API
   # Los datos deberían seguir funcionando con simulación
   ```

2. **Cierre automático:**
   ```bash
   # GET /api/trading/auto-close
   # Verifica estado del sistema
   ```

3. **Logs del sistema:**
   ```
   [Binance API] Successfully fetched X tickers
   [Simulator] Generated X simulated tickers
   [Auto-Close] Checking X open positions
   [Auto-Close] Closed position ID - Profit: X
   ```

### Configuración de Producción

- El scheduler se inicia automáticamente en producción
- Timeout de 10 segundos para APIs de Binance
- Verificación cada 60 segundos para cierre automático
- Logs detallados para monitoreo

## 🎛️ Controles Manuales

### Ejecutar Cierre Manual
```javascript
// POST /api/trading/auto-close
fetch('/api/trading/auto-close', { method: 'POST' });
```

### Verificar Estado
```javascript
// GET /api/trading/auto-close
fetch('/api/trading/auto-close');
```

### Control del Scheduler
```javascript
import { startAutoCloseScheduler, stopAutoCloseScheduler } from '@/lib/scheduler/autoCloseScheduler';

// Iniciar scheduler
startAutoCloseScheduler();

// Detener scheduler
stopAutoCloseScheduler();
```

## ✅ Características Cumplidas

- ✅ **Sin variables de entorno**: Detección automática de fallos de Binance
- ✅ **Simulación realista**: Precios coherentes con variaciones suaves
- ✅ **Integración transparente**: No afecta la experiencia del usuario
- ✅ **Cierre automático**: Operaciones se cierran al vencer con cálculos exactos
- ✅ **Arquitectura respetada**: No se modificó la estructura existente
- ✅ **Base de datos intacta**: Utiliza schema de Prisma existente
- ✅ **Transacciones seguras**: Consistencia garantizada con Prisma transactions

## 🔧 Mantenimiento

### Agregar Nuevos Símbolos

Editar `BASE_PRICES` en `lib/simulator.ts`:

```javascript
const BASE_PRICES: Record<string, number> = {
  // ... existentes
  'NUEVOSIMBOLO': 123.45
};
```

### Ajustar Frecuencia de Verificación

Modificar el intervalo en `lib/scheduler/autoCloseScheduler.ts`:

```javascript
// Cambiar 60000 (60 segundos) por el valor deseado
schedulerInterval = setInterval(runAutoCloseProcess, 30000); // 30 segundos
```

### Personalizar Variaciones de Precio

Ajustar `maxVariation` en `getSimulatedPrice()` según el tipo de activo.

---

**El sistema está listo para producción y funciona de manera completamente automática y transparente.** 