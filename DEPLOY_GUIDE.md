# 🚀 Guía de Despliegue en Fly.io

## Prerequisitos

1. **Instalar Fly CLI**
   ```bash
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Crear cuenta en Fly.io**
   ```bash
   fly auth signup
   # o si ya tienes cuenta:
   fly auth login
   ```

## Despliegue Automático

Ejecuta el script de despliegue automático:

```bash
# En Windows PowerShell
./deploy.sh

# En bash/zsh
bash deploy.sh
```

## Despliegue Manual

### 1. Configurar la aplicación

```bash
# Crear la aplicación
fly apps create bitpulse-frontend

# Configurar la región (Miami para menor latencia en LATAM)
fly regions set mia
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
fly postgres create --name bitpulse-db --region mia

# Adjuntar la base de datos a tu app
fly postgres attach --app bitpulse-frontend bitpulse-db
```

### 3. Configurar Variables de Entorno

```bash
# JWT y autenticación
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"
fly secrets set NEXTAUTH_SECRET="$(openssl rand -hex 32)"

# URLs de la aplicación
fly secrets set NEXTAUTH_URL="https://bitpulse-frontend.fly.dev"
fly secrets set NEXT_PUBLIC_APP_URL="https://bitpulse-frontend.fly.dev"
fly secrets set FRONTEND_URL="https://bitpulse-frontend.fly.dev"

# Configuración de Node.js
fly secrets set NODE_ENV="production"
```

### 4. Variables Opcionales (configurar según necesidades)

```bash
# APIs externas
fly secrets set TWELVEDATA_API_KEY="tu_clave_aqui"
fly secrets set POLYGON_API_KEY="tu_clave_aqui"
fly secrets set ALPHA_VANTAGE_API_KEY="tu_clave_aqui"

# Email (Nodemailer)
fly secrets set EMAIL_HOST="smtp.gmail.com"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="tu_email@gmail.com"
fly secrets set EMAIL_PASS="tu_app_password"

# Google reCAPTCHA
fly secrets set RECAPTCHA_SECRET_KEY="tu_clave_secreta"
fly secrets set NEXT_PUBLIC_RECAPTCHA_SITE_KEY="tu_clave_publica"
```

### 5. Configurar Almacenamiento Persistente

```bash
# Crear volumen para datos persistentes
fly volumes create bitpulse_data --size 1
```

### 6. Desplegar

```bash
# Desplegar la aplicación
fly deploy
```

## Post-Despliegue

### 1. Ejecutar Migraciones de Base de Datos

```bash
# SSH a la máquina
fly ssh console

# Dentro de la máquina
cd /app
npx prisma migrate deploy
npx prisma db seed # si tienes seeds
```

### 2. Verificar el Despliegue

```bash
# Ver estado de la aplicación
fly status

# Ver logs en tiempo real
fly logs

# Abrir la aplicación en el navegador
fly open
```

## Comandos Útiles

### Monitoreo

```bash
# Ver métricas en tiempo real
fly logs --app bitpulse-frontend

# Ver estado de las máquinas
fly machine list

# Ver información de la base de datos
fly postgres connect --app bitpulse-db
```

### Mantenimiento

```bash
# Reiniciar la aplicación
fly machine restart

# Escalar la aplicación
fly scale count 2

# Actualizar configuración
fly deploy --no-cache
```

### Debugging

```bash
# SSH a la máquina para debugging
fly ssh console

# Ver variables de entorno
fly secrets list

# Ver configuración actual
fly config show
```

## Configuración de Dominio Personalizado

Si quieres usar tu propio dominio:

```bash
# Agregar certificado SSL
fly certs create tudominio.com

# Verificar certificado
fly certs show tudominio.com
```

Luego configurar los registros DNS:
- `A` record: `tudominio.com` → IP de Fly.io
- `AAAA` record: `tudominio.com` → IPv6 de Fly.io

## Troubleshooting

### Error de Build
```bash
# Limpiar cache y rebuilds
fly deploy --no-cache
```

### Error de Base de Datos
```bash
# Verificar conexión a la DB
fly ssh console
cd /app && npx prisma studio
```

### Error de Variables de Entorno
```bash
# Verificar variables
fly secrets list

# Agregar variable faltante
fly secrets set NOMBRE_VARIABLE="valor"
```

## Costos Estimados

- **Aplicación básica**: ~$5-10/mes
- **Base de datos**: ~$5-15/mes
- **Almacenamiento**: ~$0.15/GB/mes

## Límites del Plan Gratuito

- 3 máquinas compartidas
- 3GB almacenamiento
- 160GB transferencia
- Perfecto para desarrollo y testing

## URLs Importantes

- **Dashboard**: https://fly.io/dashboard
- **Documentación**: https://fly.io/docs
- **Aplicación**: https://bitpulse-frontend.fly.dev

## Soporte

Si tienes problemas:
1. Revisar logs: `fly logs`
2. Consultar documentación de Fly.io
3. Revisar el foro de la comunidad: https://community.fly.io 