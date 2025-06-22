# Sistema de Aprobación Manual por Administrador

## Descripción General

Se ha implementado un nuevo sistema de registro que reemplaza la verificación automática por email con una aprobación manual por parte del administrador. Los usuarios pueden acceder completamente a la plataforma durante un **periodo de gracia de 3 días** mientras esperan la aprobación del administrador.

## Características Principales

### 1. Flujo de Registro Modificado
- **Antes**: Usuario se registra → Recibe email → Confirma email → Puede acceder
- **Ahora**: Usuario se registra → **Acceso inmediato con periodo de gracia** → Admin aprueba/rechaza → Estado permanente

### 2. Periodo de Gracia (NUEVO)
- **Duración**: 3 días desde el registro
- **Acceso**: Completo a todas las funcionalidades
- **Indicador visual**: Banner informativo sobre el estado de revisión
- **Expiración**: Si no se aprueba en 3 días, la cuenta se deshabilita automáticamente

### 3. Estados de Usuario
- **Periodo de Gracia**: Usuario nuevo con acceso completo temporal (3 días)
- **Aprobado**: Admin aprobó la cuenta, acceso permanente
- **Rechazado**: Admin rechazó la cuenta, acceso denegado inmediatamente
- **Expirado**: Pasaron 3 días sin aprobación, cuenta deshabilitada automáticamente

## Funcionalidades Implementadas

### Para Usuarios Normales

#### Registro y Acceso
- El usuario completa el formulario de registro normalmente
- **Recibe acceso inmediato** a todas las funcionalidades de la plataforma
- Ve un banner informativo sobre el periodo de revisión
- Mensaje: *"Tu cuenta está siendo revisada por el administrador. Tienes 3 días de acceso completo mientras se procesa tu solicitud."*

#### Banner de Periodo de Gracia
- **Ubicación**: Parte superior de la aplicación
- **Información mostrada**:
  - Tiempo restante en días y horas
  - Estado actual de la solicitud
  - Indicadores visuales (verde → amarillo → rojo según urgencia)
- **Comportamiento**: Se actualiza automáticamente cada hora

#### Experiencia Durante el Periodo
- ✅ **Acceso completo** a trading, portfolios, chat, etc.
- ✅ **Todas las funcionalidades** disponibles normalmente
- ℹ️ **Recordatorio visual** del estado temporal
- ⚠️ **Alertas de tiempo restante** cuando queda menos de 24h

#### Estados Post-Decisión
- **Si se aprueba**: Banner desaparece, acceso permanente
- **Si se rechaza**: Acceso denegado inmediatamente
- **Si expira**: Acceso denegado automáticamente

### Para Administradores

#### Panel de Aprobaciones
**Ruta**: `/admin/users/approvals`

**Funcionalidades**:
- Ver lista de usuarios en periodo de gracia
- Filtrar por estado: Pendientes, Aprobados, Rechazados, Expirados
- Ver tiempo restante hasta expiración
- Indicadores visuales para solicitudes urgentes (< 24h)
- **Acceso rápido** desde el dashboard principal del admin

#### Acciones de Aprobación
- **Aprobar**: Convierte el acceso temporal en permanente
- **Rechazar**: Deshabilita la cuenta inmediatamente
- **Agregar notas**: Opcional, para documentar la decisión
- **Efectividad inmediata**: Los cambios se aplican al instante

## Ventajas del Nuevo Sistema

### Para los Usuarios
- ✅ **Acceso inmediato** - No esperan para usar la plataforma
- ✅ **Experiencia completa** - Pueden evaluar todas las funcionalidades
- ✅ **Transparencia** - Saben exactamente cuánto tiempo tienen
- ✅ **Sin interrupciones** - Si se aprueban, no notan cambios

### Para la Plataforma
- 🛡️ **Control de calidad** - Los administradores pueden revisar antes del acceso permanente
- 📈 **Mejor conversión** - Los usuarios experimentan la plataforma antes de la decisión
- 🔍 **Evaluación informada** - Los admins pueden ver la actividad del usuario
- ⚡ **Flexibilidad** - Permite reversión rápida si es necesario

## Componentes Técnicos

### API Endpoints
```
GET  /api/user/grace-period-status      # Estado del periodo de gracia del usuario
GET  /api/admin/users?approval=pending  # Lista usuarios pendientes
PATCH /api/admin/users/:id              # Aprobar/rechazar usuario
```

### Componentes de UI
- `GracePeriodBanner`: Banner informativo para usuarios
- `UserApprovalsPage`: Panel de administración
- Actualizaciones en login/registro

### Automatización
- **Script**: `scripts/expire-pending-users.js`
- **Recomendación**: Ejecutar diariamente para limpiar cuentas expiradas
- **Cron job sugerido**: `0 2 * * * node scripts/expire-pending-users.js`

## Flujo de Trabajo Completo

### 1. Nuevo Usuario
1. Se registra en la plataforma
2. **Obtiene acceso inmediato** con periodo de gracia
3. Ve banner con tiempo restante (3 días)
4. Puede usar **todas las funcionalidades** normalmente

### 2. Durante el Periodo de Gracia
- Usuario usa la plataforma completamente
- Banner muestra tiempo restante
- Admin recibe notificación de nuevo usuario
- Admin puede aprobar/rechazar en cualquier momento

### 3. Decisión del Admin
- **Aprobación**: Usuario mantiene acceso, banner desaparece
- **Rechazo**: Usuario pierde acceso inmediatamente
- **Sin acción**: Después de 3 días, acceso se revoca automáticamente

### 4. Seguimiento Post-Decisión
- Usuarios aprobados: Acceso permanente sin restricciones
- Usuarios rechazados/expirados: No pueden volver a acceder

## Configuración Recomendada

### Monitoreo Diario
1. Revisar usuarios en periodo de gracia
2. Priorizar solicitudes con < 24h restantes
3. Documentar razones de aprobación/rechazo

### Métricas a Seguir
- **Tiempo promedio de decisión**
- **Tasa de aprobación vs rechazo**
- **Usuarios que expiran sin decisión**
- **Actividad durante el periodo de gracia**
- **Retención post-aprobación**

## Beneficios Estratégicos

### Experiencia del Usuario Mejorada
- **Sin barreras iniciales** - Acceso inmediato
- **Evaluación práctica** - Pueden probar antes de la decisión final
- **Transparencia completa** - Conocen el proceso y tiempos

### Control Administrativo
- **Revisión informada** - Pueden ver la actividad del usuario
- **Flexibilidad temporal** - 3 días para tomar decisiones
- **Reversibilidad** - Pueden cambiar decisiones si es necesario

### Optimización de Conversión
- **Engagement inmediato** - Los usuarios se involucran desde el primer día
- **Reducción de fricción** - No hay esperas para acceso básico
- **Evaluación bidireccional** - Tanto usuario como admin evalúan el ajuste

El sistema está diseñado para **maximizar la experiencia del usuario** mientras mantiene el **control administrativo necesario** para la calidad de la plataforma. 