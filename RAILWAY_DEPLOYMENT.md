# 🚀 Guía de Deployment en Railway

Esta guía te ayudará a desplegar tu aplicación BitPulse en Railway paso a paso.

## 📋 Pre-requisitos

1. **Cuenta en Railway**: Regístrate en [railway.app](https://railway.app)
2. **GitHub Repository**: Tu código debe estar en un repositorio de GitHub
3. **APIs Keys**: Tener todas las API keys de los servicios externos

## 🛠️ Paso 1: Preparación del Proyecto

### 1.1 Variables de Entorno Necesarias

Crea estas variables en Railway:

```bash
# Base de datos (Railway lo configurará automáticamente)
DATABASE_URL=postgresql://...

# Autenticación
JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
CSRF_SECRET=tu-secreto-csrf

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
SMTP_FROM=no-reply@bitpulse.com

# ReCAPTCHA (Opcional)
RECAPTCHA_SECRET_KEY=tu-recaptcha-secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu-recaptcha-site-key

# APIs de Trading
NEXT_PUBLIC_BITSTAMP_API_KEY=tu-bitstamp-key
NEXT_PUBLIC_BITSTAMP_API_SECRET=tu-bitstamp-secret
NEXT_PUBLIC_BITSTAMP_CLIENT_ID=tu-bitstamp-client-id
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=tu-alpha-vantage-key
NEXT_PUBLIC_TWELVE_DATA_API_KEY=tu-twelve-data-key
NEXT_PUBLIC_POLYGON_API_KEY=tu-polygon-key

# URLs (Se configurarán automáticamente)
NEXT_PUBLIC_BASE_URL=https://tu-app.railway.app
NEXT_PUBLIC_SOCKET_URL=https://tu-app.railway.app

# Entorno
NODE_ENV=production
```

## 🚀 Paso 2: Deployment en Railway

### 2.1 Conectar Repositorio

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway y selecciona tu repositorio

### 2.2 Configurar Base de Datos

1. En tu proyecto Railway, haz clic en "Add Service"
2. Selecciona "PostgreSQL"
3. Railway creará automáticamente la variable `DATABASE_URL`

### 2.3 Configurar Variables de Entorno

1. Ve a la pestaña "Variables"
2. Agrega todas las variables listadas arriba
3. Railway detectará automáticamente las variables `NEXT_PUBLIC_*`

### 2.4 Configurar Domain

1. Ve a la pestaña "Settings"
2. En "Domains", genera un dominio o agrega uno personalizado
3. Actualiza `NEXT_PUBLIC_BASE_URL` y `NEXT_PUBLIC_SOCKET_URL` con la nueva URL

## 🗄️ Paso 3: Configurar Base de Datos

### 3.1 Ejecutar Migraciones de Prisma

Railway ejecutará automáticamente `prisma generate` durante el build, pero necesitarás ejecutar las migraciones:

1. Instala Railway CLI: `npm install -g @railway/cli`
2. Autentícate: `railway login`
3. Conecta al proyecto: `railway link`
4. Ejecuta migraciones: `railway run npx prisma db push`

### 3.2 (Opcional) Seed de Datos

Si tienes datos iniciales:
```bash
railway run npx prisma db seed
```

## 🔧 Paso 4: Configuraciones Adicionales

### 4.1 Health Checks

Railway está configurado para usar `/api/health` como endpoint de salud.

### 4.2 Logs

Para ver logs en tiempo real:
```bash
railway logs
```

### 4.3 Dominios Personalizados

Si quieres un dominio personalizado:
1. Ve a Settings > Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

## 📊 Paso 5: Verificación del Deployment

### 5.1 Endpoints a Verificar

- ✅ `https://tu-app.railway.app/` - Página principal
- ✅ `https://tu-app.railway.app/api/health` - Health check
- ✅ `https://tu-app.railway.app/auth` - Autenticación
- ✅ WebSockets funcionando (chat en tiempo real)

### 5.2 Funcionalidades a Probar

- [ ] Registro de usuarios
- [ ] Login y autenticación
- [ ] Chat en tiempo real
- [ ] Datos de mercado en tiempo real
- [ ] Trading simulado
- [ ] APIs externas funcionando

## 🛠️ Troubleshooting

### Error común: Build falló

**Solución**: Verifica que todas las variables de entorno estén configuradas

### Error: Database connection

**Solución**: 
1. Verifica que PostgreSQL esté ejecutándose
2. Checa que `DATABASE_URL` esté configurada correctamente
3. Ejecuta `railway run npx prisma db push`

### Error: WebSockets no funcionan

**Solución**: 
1. Verifica que `NEXT_PUBLIC_SOCKET_URL` apunte a tu dominio Railway
2. Asegúrate de que el servidor custom (`server.js`) esté ejecutándose

### APIs externas fallan

**Solución**:
1. Verifica todas las API keys
2. Checa los límites de rate de las APIs
3. Revisa los CORS en `next.config.js`

## 📈 Monitoreo

### Métricas importantes:

1. **Railway Metrics**: CPU, RAM, Network
2. **Logs**: Errores de aplicación
3. **Database**: Conexiones y queries
4. **WebSockets**: Conexiones activas

## 🔄 Updates y CI/CD

Railway automáticamente redesplegará cuando hagas push a tu rama principal. Para control más granular:

1. Configura webhooks
2. Usa Railway CLI para deployments manuales
3. Configura diferentes entornos (staging/production)

## 📱 Consideraciones de Producción

### Security:
- [ ] Cambiar todos los secretos por valores seguros
- [ ] Configurar HTTPS only
- [ ] Revisar CORS settings
- [ ] Configurar rate limiting

### Performance:
- [ ] Configurar CDN para assets estáticos
- [ ] Optimizar queries de base de datos
- [ ] Monitorear memory usage
- [ ] Configurar caching apropiado

### Backup:
- [ ] Configurar backups automáticos de PostgreSQL
- [ ] Documentar proceso de rollback
- [ ] Mantener variables de entorno seguras

---

## 🆘 Soporte

Si encuentras problemas:

1. **Railway Docs**: [docs.railway.app](https://docs.railway.app)
2. **Railway Discord**: Comunidad muy activa
3. **Logs**: `railway logs` para debugging
4. **Status**: [status.railway.app](https://status.railway.app)

¡Tu aplicación BitPulse estará lista para trading en vivo! 🎯📈 