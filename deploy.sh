#!/bin/bash

echo "🚀 Preparando despliegue en Fly.io..."

# Verificar que fly CLI esté instalado
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI no está instalado. Instalándolo..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Verificar login en Fly.io
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Necesitas hacer login en Fly.io..."
    fly auth login
fi

# Configurar la aplicación
echo "📦 Configurando aplicación en Fly.io..."

# Verificar si la app ya existe
if ! fly apps show bitpulse-frontend &> /dev/null; then
    echo "🆕 Creando nueva aplicación..."
    fly apps create bitpulse-frontend
else
    echo "✅ La aplicación ya existe"
fi

# Configurar volumen para datos persistentes
echo "💾 Configurando almacenamiento persistente..."
if ! fly volumes show bitpulse_data &> /dev/null; then
    fly volumes create bitpulse_data --size 1
else
    echo "✅ El volumen ya existe"
fi

# Configurar variables de entorno críticas
echo "🔧 Configurando variables de entorno..."

# Base de datos (si no está configurada)
if ! fly secrets list | grep -q DATABASE_URL; then
    echo "🗄️  Configurando base de datos PostgreSQL..."
    fly postgres create --name bitpulse-db --region mia
    # Adjuntar la base de datos
    fly postgres attach --app bitpulse-frontend bitpulse-db
fi

# Configurar JWT secret si no existe
if ! fly secrets list | grep -q JWT_SECRET; then
    JWT_SECRET=$(openssl rand -hex 32)
    fly secrets set JWT_SECRET="$JWT_SECRET"
fi

# Configurar NEXTAUTH_SECRET si no existe
if ! fly secrets list | grep -q NEXTAUTH_SECRET; then
    NEXTAUTH_SECRET=$(openssl rand -hex 32)
    fly secrets set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
fi

# URL de la aplicación
APP_URL="https://bitpulse-frontend.fly.dev"
fly secrets set NEXTAUTH_URL="$APP_URL"
fly secrets set NEXT_PUBLIC_APP_URL="$APP_URL"
fly secrets set FRONTEND_URL="$APP_URL"

echo "🚀 Desplegando aplicación..."
fly deploy --remote-only

echo "✅ ¡Despliegue completado!"
echo "🌐 Tu aplicación está disponible en: $APP_URL"
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs: fly logs"
echo "   - Ver estado: fly status"
echo "   - Abrir app: fly open"
echo "   - SSH a la máquina: fly ssh console" 