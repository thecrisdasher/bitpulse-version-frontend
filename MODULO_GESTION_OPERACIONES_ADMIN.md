# 📊 Módulo de Gestión de Operaciones para Administradores y Maestros

## 📋 Descripción

Módulo completo para que administradores y maestros puedan modificar ciertos valores de las operaciones abiertas de clientes, reutilizando toda la lógica existente del sistema de trading y manteniendo un historial completo de auditoría.

## ✨ Funcionalidades Principales

### 🔧 Campos Modificables (AMPLIADO)

El módulo permite modificar los siguientes valores de las posiciones de trading:

#### Precios y Trading:
- **Precio Actual** (`currentPrice`) - Con recálculo automático de P&L
- **Stop Loss** (`stopLoss`) - Con validaciones según dirección de posición  
- **Take Profit** (`takeProfit`) - Con validaciones según dirección de posición

#### Gestión de Posición:
- **Cantidad/Monto** (`amount`) - Monto total de la posición
- **Apalancamiento** (`leverage`) - Factor de apalancamiento aplicado
- **Stake** (`stake`) - Valor del stake/apuesta

#### Configuración Temporal:
- **Duración (Valor)** (`durationValue`) - Valor numérico de duración
- **Duración (Unidad)** (`durationUnit`) - Unidad de tiempo (minutos, horas, días, semanas, meses)

#### Personalización UI:
- **Color de Mercado** (`marketColor`) - Color hexadecimal para la interfaz de usuario

### 🛡️ Validaciones de Seguridad

#### Validaciones Financieras:
- Precios, cantidades, apalancamiento y stake deben ser números positivos
- Stop Loss y Take Profit se validan según la dirección de la posición:
  - **Long**: Stop Loss < Precio Actual, Take Profit > Precio Actual
  - **Short**: Stop Loss > Precio Actual, Take Profit < Precio Actual

#### Validaciones de Datos:
- Duración debe ser un número entero positivo
- Unidad de duración debe ser texto válido
- Color de mercado debe ser texto (formato hexadecimal recomendado)

#### Validaciones de Roles:
- **Administradores**: Acceso total a todas las posiciones
- **Maestros**: Solo posiciones de estudiantes asignados vía `MentorAssignment`

### 🎨 Mejoras en la Interfaz de Usuario

#### Formulario de Edición Mejorado:
- **Selector desplegable** para unidades de duración
- **Vista previa de color** para el campo de color de mercado
- **Resumen de cambios** que muestra antes/después de cada modificación
- **Campo de razón ampliado** con textarea para explicaciones detalladas

#### Indicadores Visuales:
- Iconos para distinguir instrumentos con soporte de tiempo real
- Estados de conexión en tiempo real con indicadores visuales
- Validación en tiempo real de los campos del formulario

### 📊 Historial de Auditoría Completo

Cada modificación se registra con:
- Campo modificado con nombres traducidos al español
- Valores anteriores y nuevos
- Usuario que realizó el cambio
- Razón detallada de la modificación
- Timestamp exacto del cambio

### ⚡ Tiempo Real

- **Conexiones WebSocket** a Binance para criptomonedas
- **Actualización automática** de precios cada 2 segundos
- **Indicadores de estado** de conexión en vivo
- **Estadísticas de conexión** con porcentaje de soporte

## 🔧 Implementación Técnica

### Archivos Modificados/Creados:

#### Componentes Frontend:
- `components/admin/PositionManagement.tsx` - Componente principal con nuevos campos
- `hooks/useAdminRealTimePositions.ts` - Hook actualizado con nuevos campos
- `app/admin/operaciones/page.tsx` - Página integrada

#### APIs Backend:
- `app/api/admin/positions/route.ts` - Obtener posiciones con nuevos campos
- `app/api/admin/positions/[id]/modify/route.ts` - Modificar posiciones con validaciones ampliadas
- `app/api/admin/positions/modifications/route.ts` - Historial de modificaciones

#### Base de Datos:
- Schema actualizado con campos adicionales en interfaces TypeScript
- Validaciones de tipos mejoradas en las APIs

### Seguridad y Permisos:

- ✅ Verificación de tokens de sesión
- ✅ Validación de roles específicos (admin/maestro)  
- ✅ Restricciones basadas en asignaciones mentor-estudiante
- ✅ Validaciones de negocio para mantener integridad de trading
- ✅ Transacciones de base de datos para consistencia
- ✅ Registro de auditoría completo

## 🚀 Uso del Módulo

### Para Administradores:
1. Acceder a `/admin/operaciones`
2. Ver todas las posiciones del sistema en tiempo real
3. Modificar cualquier campo permitido de cualquier posición
4. Revisar historial completo de modificaciones

### Para Maestros:
1. Acceder a `/admin/operaciones` 
2. Ver solo posiciones de estudiantes asignados en tiempo real
3. Modificar campos permitidos de posiciones de sus estudiantes
4. Revisar historial de modificaciones de sus estudiantes

### Proceso de Modificación:
1. **Seleccionar posición** a modificar
2. **Editar campos** deseados en el formulario mejorado
3. **Revisar resumen** de cambios antes/después
4. **Proporcionar razón** detallada obligatoria
5. **Confirmar cambios** - se aplican en transacción atómica
6. **Verificar en historial** - cambios registrados para auditoría

## 📈 Beneficios

- **Control Total**: Administradores pueden gestionar todas las operaciones
- **Delegación Controlada**: Maestros pueden gestionar sus estudiantes
- **Auditoría Completa**: Trazabilidad total de todos los cambios
- **Tiempo Real**: Datos actualizados automáticamente
- **Seguridad**: Validaciones múltiples y transacciones atómicas
- **Flexibilidad**: Múltiples campos modificables sin conflictos
- **Usabilidad**: Interfaz intuitiva con resumen de cambios y validaciones

Este módulo proporciona una solución completa y segura para la gestión administrativa de operaciones de trading, manteniendo la integridad del sistema mientras ofrece flexibilidad operativa.

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

## Próximas Mejoras

1. **Más Fuentes de Datos**: Integrar APIs adicionales
2. **Notificaciones Push**: Alertas en tiempo real
3. **Gráficos en Vivo**: Charts actualizados automáticamente
4. **Análisis Predictivo**: ML para sugerir modificaciones
5. **Modo Offline**: Caché inteligente para desconexiones

---

**✅ Módulo completamente funcional con tiempo real integrado**

El sistema ahora proporciona una experiencia completa de gestión de operaciones con datos actualizados en tiempo real, reutilizando toda la lógica existente del sistema de trading de BitPulse. 