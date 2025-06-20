# Módulo de Gestión de Operaciones para Administradores y Maestros

## 🎯 Descripción General

Este módulo permite a **administradores** y **maestros** modificar ciertos valores de las operaciones abiertas de los clientes, manteniendo un historial completo de cambios para fines de auditoría y control.

## ✨ Características Principales

### 🔐 Control de Acceso por Roles
- **Administradores**: Acceso completo a todas las posiciones de todos los usuarios
- **Maestros**: Acceso únicamente a posiciones de estudiantes asignados a través de `MentorAssignment`

### 📊 Funcionalidades Implementadas
1. **Visualización de Posiciones**: Lista completa con filtros por estado y búsqueda
2. **Modificación de Valores**: Edición de precio actual, stop loss y take profit
3. **Historial de Auditoría**: Registro completo de todos los cambios realizados
4. **Validaciones de Negocio**: Verificaciones automáticas para mantener la integridad

### 🛠️ Valores Modificables
- **Precio Actual** (`currentPrice`): Actualiza el precio de mercado de la posición
- **Stop Loss** (`stopLoss`): Define el precio de pérdida máxima
- **Take Profit** (`takeProfit`): Define el precio objetivo de ganancia

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos

```
app/
├── admin/
│   └── operaciones/
│       └── page.tsx                 # Página principal del módulo
├── api/
│   └── admin/
│       └── positions/
│           ├── route.ts             # GET: Listar posiciones
│           ├── [id]/
│           │   └── modify/
│           │       └── route.ts     # POST: Modificar posición
│           └── modifications/
│               └── route.ts         # GET: Historial de modificaciones

components/
└── admin/
    └── PositionManagement.tsx       # Componente reutilizable

prisma/
└── schema.prisma                    # Modelo PositionModification agregado

scripts/
└── migrate-position-modifications.js # Script de migración
```

### 🗄️ Modelo de Base de Datos

```prisma
model PositionModification {
  id              String        @id @default(uuid())
  position        TradePosition @relation(fields: [positionId], references: [id])
  positionId      String
  modifiedBy      String        // ID del usuario que hizo la modificación
  modifiedByName  String        // Nombre completo para registro histórico
  field           String        // Campo modificado: 'currentPrice', 'stopLoss', 'takeProfit'
  oldValue        Json          // Valor anterior
  newValue        Json          // Valor nuevo
  reason          String        // Razón de la modificación
  timestamp       DateTime      @default(now())
  
  @@map("position_modifications")
}
```

## 🔧 Reutilización de Lógica Existente

### 🎨 Componentes UI
- Reutiliza componentes del sistema de UI existente (`@/components/ui/`)
- Aprovecha los estilos y patrones de diseño establecidos
- Mantiene consistencia visual con el resto de la aplicación

### 📊 Formateo y Validaciones
- **Formateo de moneda**: Utiliza `Intl.NumberFormat` con configuración para Colombia
- **Validaciones de trading**: Implementa reglas de negocio existentes:
  - Stop Loss para posiciones largas debe ser menor al precio de apertura
  - Stop Loss para posiciones cortas debe ser mayor al precio de apertura
  - Take Profit para posiciones largas debe ser mayor al precio de apertura
  - Take Profit para posiciones cortas debe ser menor al precio de apertura

### 🔄 Context y State Management
- Integra con `AuthContext` para manejo de roles y permisos
- Utiliza `useToast` para notificaciones consistentes
- Sigue patrones de estado establecidos en el proyecto

## 📡 APIs Implementadas

### 1. Listar Posiciones
```typescript
GET /api/admin/positions
```
**Parámetros de consulta:**
- `status`: `'all' | 'open' | 'closed' | 'liquidated'`
- `userId`: Filtrar por usuario específico

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Juan Pérez",
      "userEmail": "juan@example.com",
      "instrument": "BTCUSD",
      "direction": "long",
      "openPrice": 45000,
      "currentPrice": 46000,
      "amount": 1000,
      "profit": 22.22,
      "status": "open"
    }
  ],
  "total": 1
}
```

### 2. Modificar Posición
```typescript
POST /api/admin/positions/{id}/modify
```
**Cuerpo de la solicitud:**
```json
{
  "modifications": [
    {
      "field": "currentPrice",
      "oldValue": 46000,
      "newValue": 47000
    }
  ],
  "reason": "Ajuste por volatilidad del mercado"
}
```

### 3. Historial de Modificaciones
```typescript
GET /api/admin/positions/modifications
```
**Parámetros de consulta:**
- `positionId`: Filtrar por posición específica
- `limit`: Número de registros (default: 100)
- `offset`: Paginación (default: 0)

## 🔒 Seguridad y Validaciones

### 🛡️ Autenticación y Autorización
- Verificación de token de sesión en todas las APIs
- Validación de roles (`admin` o `maestro`)
- Restricción de acceso para maestros solo a estudiantes asignados

### ✅ Validaciones de Negocio
- Verificación de que la posición existe y está abierta
- Validación de que los valores antiguos coinciden con los actuales
- Aplicación de reglas de trading para stop loss y take profit
- Recálculo automático de profit/loss al modificar precio actual

### 📝 Auditoría Completa
- Registro de todas las modificaciones en la base de datos
- Almacenamiento de razón obligatoria para cada cambio
- Tracking de quién realizó la modificación y cuándo
- Preservación de valores anteriores para comparación

## 🚀 Instalación y Configuración

### 1. Migración de Base de Datos
```bash
# Ejecutar el script de migración
node scripts/migrate-position-modifications.js

# O manualmente:
npx prisma migrate dev --name add-position-modifications
npx prisma generate
```

### 2. Acceso al Módulo
- **URL**: `/admin/operaciones`
- **Requisitos**: Usuario con rol `admin` o `maestro`
- **Navegación**: Disponible desde el panel principal de administración

## 📊 Funciones del Interface

### 🔍 Filtros y Búsqueda
- **Búsqueda textual**: Por nombre de usuario, email o instrumento
- **Filtro por estado**: Todas, abiertas, cerradas, liquidadas
- **Vista en tiempo real**: Actualización automática tras modificaciones

### 📈 Estadísticas en Dashboard
- Total de posiciones visibles
- Posiciones abiertas
- Posiciones cerradas
- Modificaciones realizadas hoy

### 🎛️ Controles de Edición
- **Modal de edición**: Interface intuitiva para modificar valores
- **Validación en tiempo real**: Feedback inmediato sobre errores
- **Confirmación de cambios**: Advertencias sobre el impacto de las modificaciones

### 📚 Historial de Cambios
- **Vista detallada**: Tabla completa de todas las modificaciones
- **Filtrado por posición**: Historial específico de cada operación
- **Información completa**: Fecha, campo, valores, responsable y razón

## 🔄 Integración con Sistema Existente

### 📊 Compatible con Trading System
- Mantiene consistencia con el modelo `TradePosition` existente
- Preserva la lógica de cálculo de profit/loss
- Respeta las validaciones de trading establecidas

### 🎨 Consistencia de UI/UX
- Utiliza el mismo sistema de componentes
- Mantiene patrones de navegación existentes
- Sigue las convenciones de diseño del proyecto

### 🔐 Integración con Autenticación
- Aprovecha el sistema de roles establecido
- Utiliza el middleware de autenticación existente
- Mantiene la seguridad de sesiones implementada

## 🎯 Casos de Uso Principales

### 👨‍💼 Para Administradores
1. **Corrección de precios**: Ajustar precios incorrectos por fallos técnicos
2. **Gestión de riesgo**: Modificar stop loss/take profit por condiciones extraordinarias
3. **Auditoría general**: Revisar todas las operaciones y sus modificaciones

### 👨‍🏫 Para Maestros
1. **Enseñanza práctica**: Ajustar posiciones de estudiantes para demostrar conceptos
2. **Gestión de riesgo educativa**: Implementar stop loss en posiciones riesgosas de estudiantes
3. **Corrección supervisada**: Ayudar a estudiantes con posiciones problemáticas

## 📝 Notas de Implementación

### ⚠️ Consideraciones Importantes
- Todas las modificaciones requieren una razón obligatoria
- Los cambios se registran inmediatamente en la base de datos
- El sistema recalcula automáticamente las métricas de profit/loss
- Las modificaciones son irreversibles (solo se pueden hacer nuevas modificaciones)

### 🔮 Extensiones Futuras
- Notificaciones automáticas a usuarios cuando sus posiciones son modificadas
- Dashboard de análisis de modificaciones más avanzado
- Límites configurables para modificaciones por rol
- Aprobación en dos pasos para modificaciones grandes

## 🤝 Contribución

Este módulo reutiliza y extiende la lógica existente del sistema de trading, manteniendo la consistencia arquitectural y proporcionando una experiencia de usuario coherente con el resto de la aplicación.

## ✨ Nuevas Características - Tiempo Real

### 🚀 Actualizaciones en Tiempo Real
- **WebSocket Integration**: Conexión directa a Binance WebSocket para precios en tiempo real
- **Batching Inteligente**: Procesamiento optimizado de actualizaciones cada 2 segundos
- **Reconexión Automática**: Manejo robusto de desconexiones con reintentos automáticos
- **Indicadores Visuales**: Iconos que muestran qué instrumentos tienen soporte tiempo real

### 📊 Dashboard Mejorado
- **Estadísticas en Vivo**: Métricas actualizadas automáticamente
- **Estado de Conexión**: Indicador visual del estado de WebSocket
- **Porcentaje de Cobertura**: Muestra qué % de posiciones tienen tiempo real
- **Forzar Actualización**: Botón para sincronizar manualmente

## Arquitectura Técnica

### Hook Reutilizable: `useAdminRealTimePositions`

Reutiliza completamente la lógica existente del sistema de trading:

```typescript
// Reutiliza mapeo de instrumentos del sistema existente
const instrumentToSymbol = {
  'BTCUSD': 'BTCUSDT',
  'ETHUSD': 'ETHUSDT',
  // ... mismo mapeo que useRealTimePositions
}

// Cálculo de P&L idéntico al sistema original
const calculateProfitLoss = (position, newPrice) => {
  let priceDifference = newPrice - position.openPrice;
  if (position.direction === 'short') {
    priceDifference = -priceDifference;
  }
  return (priceDifference / position.openPrice) * position.amount;
}
```

### Implementación de WebSocket

- **Conexiones Eficientes**: Una conexión por símbolo único
- **Buffer de Actualizaciones**: Evita sobrecarga con batching
- **Gestión de Estado**: Tracking preciso de conexiones activas
- **Cleanup Automático**: Liberación de recursos al desmontar

## Instrumentos Soportados

### ✅ Tiempo Real (Binance WebSocket)
- Bitcoin (BTC/USD) → BTCUSDT
- Ethereum (ETH/USD) → ETHUSDT  
- Litecoin (LTC/USD) → LTCUSDT
- Ripple (XRP/USD) → XRPUSDT
- Bitcoin Cash (BCH/USD) → BCHUSDT
- Cardano (ADA/USD) → ADAUSDT
- Polkadot (DOT/USD) → DOTUSDT
- Solana (SOL/USD) → SOLUSDT
- Dogecoin (DOGE/USD) → DOGEUSDT
- Shiba Inu (SHIB/USD) → SHIBUSDT
- Chainlink (LINK/USD) → LINKUSDT
- Polygon (MATIC/USD) → MATICUSDT

### ⏰ Actualizaciones Manuales
- Forex (EUR/USD, GBP/USD, etc.)
- Índices (S&P 500, NASDAQ, etc.)
- Commodities (Oro, Petróleo, etc.)

## Indicadores Visuales

### Estados de Conexión
- 🟢 **Wifi Verde**: Tiempo real activo con X conexiones
- 🟠 **Wifi Offline**: Sin conexión tiempo real
- ⚡ **Rayo Verde**: Instrumento con actualización automática
- 🕐 **Reloj Gris**: Instrumento sin tiempo real

### Dashboard de Estadísticas
1. **Total Posiciones**: Contador total
2. **Posiciones Abiertas**: Solo status 'open'
3. **Posiciones Cerradas**: Solo status 'closed'  
4. **Modificaciones Hoy**: Cambios del día actual
5. **🆕 Tiempo Real**: Porcentaje de cobertura en vivo

## Archivos Implementados

### 🆕 Hook de Tiempo Real
```
hooks/useAdminRealTimePositions.ts
```
- Reutiliza lógica de `useRealTimePositions.ts`
- Adaptado para múltiples usuarios
- Optimizado para administradores

### 📄 Páginas Principales
```
app/admin/operaciones/page.tsx
```
- Página completa con tiempo real integrado
- Filtros, búsqueda y estadísticas
- Modales de edición e historial

### 🧩 Componentes Reutilizables
```
components/admin/PositionManagement.tsx
```
- Componente con tiempo real integrado
- Props configurables
- Indicadores visuales

### 🛠 APIs Backend
```
app/api/admin/positions/route.ts
app/api/admin/positions/[id]/modify/route.ts  
app/api/admin/positions/modifications/route.ts
```

### 📊 Base de Datos
```
prisma/schema.prisma
```
Nuevo modelo:
```prisma
model PositionModification {
  id              String        @id @default(uuid())
  position        TradePosition @relation(fields: [positionId], references: [id])
  positionId      String
  modifiedBy      String
  modifiedByName  String
  field           String
  oldValue        Json
  newValue        Json
  reason          String
  timestamp       DateTime      @default(now())
}
```

## Características de Seguridad

### Control de Acceso
- **Roles validados**: Solo admin/maestro
- **Asignaciones respetadas**: Maestros ven solo sus estudiantes
- **Auditoría completa**: Todas las modificaciones registradas

### Validaciones de Datos
- **Verificación de cambios**: Solo modificar valores diferentes
- **Reglas de trading**: Stop loss/take profit válidos
- **Razón obligatoria**: Justificación para cada cambio

## Migración y Despliegue

### 1. Ejecutar Migración
```bash
npm run db:migrate
```

### 2. Script de Migración
```bash
node scripts/migrate-position-modifications.js
```

### 3. Verificar Conexión Tiempo Real
- Abrir `/admin/operaciones`
- Verificar indicador "Tiempo Real" en verde
- Comprobar iconos ⚡ en instrumentos soportados

## Beneficios del Tiempo Real

### Para Administradores
- **Decisiones Informadas**: Datos actuales para modificaciones
- **Monitoreo Efectivo**: Ver P&L real en tiempo real
- **Gestión Proactiva**: Detectar problemas antes

### Para el Sistema
- **Reutilización de Código**: Aprovecha lógica existente
- **Consistencia**: Mismos cálculos que el trading normal
- **Rendimiento**: Optimizaciones de batching y conexiones

### Para Usuarios Finales
- **Transparencia**: Cambios basados en datos reales
- **Confianza**: Sistema actualizado y preciso
- **Mejor UX**: Respuestas más rápidas y precisas

## Configuración Avanzada

### Personalizar Intervalos
```typescript
useAdminRealTimePositions(positions, {
  updateInterval: 1000, // 1 segundo (más agresivo)
  enableWebSocket: true
})
```

### Debugging en Desarrollo
```typescript
// En modo desarrollo, exposer información de debug
_debug: {
  wsConnections: 3,
  activeSymbols: 3, 
  priceBuffer: 0
}
```

## Monitoreo y Mantenimiento

### Logs a Revisar
```
[Admin RealTime] Conectando a wss://stream.binance.com:9443/ws/btcusdt@ticker
[Admin RealTime] Conectado a BTCUSDT (BTCUSD)
[Admin RealTime] Desconectado de BTCUSDT
```

### Métricas Importantes
- Número de conexiones WebSocket activas
- Porcentaje de instrumentos soportados
- Latencia de actualizaciones de precios
- Tasa de reconexiones

## 🎛️ Campos Modificables

### 💰 **Valores Económicos**
- **Precio Actual**: Actualizar precio de mercado en tiempo real
- **Stop Loss**: Configurar precio de pérdida máxima
- **Take Profit**: Establecer precio de ganancia objetivo
- **Monto**: Modificar tamaño de la posición
- **Stake/Apuesta**: Ajustar cantidad apostada

### ⚙️ **Configuración de Trading**
- **Apalancamiento**: Cambiar nivel (1-1000x)
- **Estado**: Abrir/Cerrar/Liquidar posición
- **Duración**: Modificar tiempo de vida
  - Valor: Número entero positivo
  - Unidad: Minutos/Horas/Días

### 🔒 **Validaciones Aplicadas**
- **Stop Loss**: Respeta dirección de la posición
- **Take Profit**: Validación según long/short
- **Apalancamiento**: Entre 1x y 1000x
- **Monto**: Mínimo 1 unidad monetaria
- **Estado**: Solo permite transiciones válidas
- **Duración**: Valores enteros y unidades válidas

### 🔄 **Recálculos Automáticos**
- **Profit/Loss**: Se actualiza al cambiar precio o monto
- **Fecha de Cierre**: Se establece al cerrar/liquidar
- **Validaciones**: Aplicadas según dirección de trading

## Próximas Mejoras

1. **Más Fuentes de Datos**: Integrar APIs adicionales
2. **Notificaciones Push**: Alertas en tiempo real
3. **Gráficos en Vivo**: Charts actualizados automáticamente
4. **Análisis Predictivo**: ML para sugerir modificaciones
5. **Modo Offline**: Caché inteligente para desconexiones

---

**✅ Módulo completamente funcional con tiempo real integrado**

El sistema ahora proporciona una experiencia completa de gestión de operaciones con datos actualizados en tiempo real, reutilizando toda la lógica existente del sistema de trading de BitPulse. 