# Módulo de Comentarios de Clientes

## Descripción General

El módulo de comentarios de clientes permite a los maestros (mentores) y administradores hacer seguimiento del progreso y estado de sus clientes asignados mediante un sistema de comentarios con etiquetas categorizadas.

## Características Principales

### 🏷️ Sistema de Etiquetas
- **Etiquetas predefinidas** para categorizar comentarios
- **Colores personalizables** para identificación visual rápida
- **Gestión de etiquetas** (solo administradores pueden crear/eliminar)

### 💬 Gestión de Comentarios
- **Comentarios contextuales** sobre el progreso del cliente
- **Múltiples etiquetas** por comentario
- **Comentarios privados** (solo visibles para administradores)
- **Edición y eliminación** de comentarios propios

### 🔐 Control de Acceso
- **Maestros**: Pueden ver y comentar solo sobre sus clientes asignados
- **Administradores**: Acceso completo a todos los comentarios y gestión de etiquetas

## Estructura de la Base de Datos

### Tabla: `comment_tags`
```sql
- id: UUID (Primary Key)
- name: String (Unique)
- color: String (Color hexadecimal)
- description: String (Opcional)
- createdAt: DateTime
```

### Tabla: `client_comments`
```sql
- id: UUID (Primary Key)
- clientId: UUID (Foreign Key -> users.id)
- authorId: UUID (Foreign Key -> users.id)
- content: Text
- isPrivate: Boolean
- createdAt: DateTime
- updatedAt: DateTime
- tags: Many-to-Many con comment_tags
```

## APIs Disponibles

### Etiquetas de Comentarios
- `GET /api/crm/comment-tags` - Obtener todas las etiquetas
- `POST /api/crm/comment-tags` - Crear nueva etiqueta (solo admin)
- `DELETE /api/crm/comment-tags?id={id}` - Eliminar etiqueta (solo admin)

### Comentarios de Clientes
- `GET /api/crm/client-comments` - Obtener comentarios
- `GET /api/crm/client-comments?clientId={id}` - Comentarios de un cliente específico
- `POST /api/crm/client-comments` - Crear nuevo comentario
- `GET /api/crm/client-comments/{id}` - Obtener comentario específico
- `PUT /api/crm/client-comments/{id}` - Actualizar comentario
- `DELETE /api/crm/client-comments/{id}` - Eliminar comentario

## Componentes de Interfaz

### `ClientCommentsManager`
Componente principal para gestionar comentarios con:
- Lista de comentarios con filtros
- Formulario para crear/editar comentarios
- Selector de etiquetas múltiples
- Búsqueda y filtrado avanzado

### `CommentTagsManager`
Componente para gestión de etiquetas (solo admin):
- Crear nuevas etiquetas
- Visualizar etiquetas existentes
- Eliminar etiquetas
- Selector de colores

## Páginas Disponibles

### `/crm/comentarios`
Página principal del módulo accesible para maestros y administradores desde:
- Sidebar principal
- Dashboard CRM

## Etiquetas Predeterminadas

El sistema incluye las siguientes etiquetas por defecto:

| Etiqueta | Color | Descripción |
|----------|--------|-------------|
| 🔴 Poco Interesado | #EF4444 | Cliente muestra poco interés |
| 🟢 Muy Motivado | #10B981 | Cliente muy comprometido |
| 🟡 Necesita Refuerzo | #F59E0B | Requiere refuerzo adicional |
| 🔵 Progreso Excelente | #3B82F6 | Excelente progreso |
| 🟣 Dificultades Técnicas | #8B5CF6 | Problemas técnicos |
| 🔵 Gestión de Riesgo | #06B6D4 | Temas de gestión de riesgo |
| 🟢 Estrategia Básica | #84CC16 | Aprendizaje básico |
| 🩷 Análisis Técnico | #EC4899 | Análisis técnico |
| 🟠 Control Emocional | #F97316 | Control emocional |
| 🟢 Listo para Avanzar | #10B981 | Preparado para avanzar |
| ⚫ Sesión Cancelada | #6B7280 | Sesión no realizada |
| 🟡 Dudas Frecuentes | #F59E0B | Dudas recurrentes |

## Instalación y Configuración

### 1. Migrar la Base de Datos
```bash
npx prisma generate
npx prisma migrate dev
```

### 2. Insertar Etiquetas Predeterminadas
```bash
node scripts/seed-comment-tags.js
```

### 3. Verificar Permisos
Asegurar que los usuarios tengan los roles correctos:
- `maestro`: Para comentar sobre clientes asignados
- `admin`: Para gestión completa del módulo

## Casos de Uso

### Para Maestros
1. **Seguimiento de progreso**: Documentar el avance de cada cliente
2. **Identificación de necesidades**: Etiquetar áreas que requieren atención
3. **Historial de sesiones**: Mantener registro de interacciones

### Para Administradores
1. **Supervisión general**: Monitorear el trabajo de todos los maestros
2. **Gestión de etiquetas**: Crear nuevas categorías según necesidades
3. **Comentarios privados**: Notas internas de gestión

## Seguridad y Privacidad

- **Autenticación requerida**: Solo usuarios autenticados pueden acceder
- **Autorización por rol**: Acceso diferenciado según rol de usuario
- **Comentarios privados**: Solo visibles para administradores
- **Filtrado por asignación**: Maestros solo ven sus clientes asignados

## Integración con Otros Módulos

- **Sistema de Mentores**: Se integra con las asignaciones de mentor-cliente
- **CRM Dashboard**: Accesible desde el panel principal de CRM
- **Sistema de Usuarios**: Utiliza la gestión de usuarios existente

## Consideraciones Técnicas

- **Escalabilidad**: Diseñado para manejar múltiples comentarios por cliente
- **Performance**: Consultas optimizadas con índices en foreign keys
- **UI/UX**: Interfaz moderna con componentes reutilizables
- **Responsividad**: Compatible con dispositivos móviles y desktop

## Mantenimiento

### Limpieza de Datos
- Los comentarios huérfanos se eliminan automáticamente (cascade)
- Las etiquetas no utilizadas se pueden identificar para limpieza manual

### Respaldos
- Incluir las tablas `client_comments` y `comment_tags` en respaldos regulares
- Considerar exportación de comentarios para análisis histórico

## Próximas Mejoras

- [ ] Notificaciones en tiempo real para nuevos comentarios
- [ ] Exportación de reportes de comentarios
- [ ] Dashboard con estadísticas de comentarios
- [ ] Comentarios con archivos adjuntos
- [ ] Comentarios con menciones a otros usuarios 