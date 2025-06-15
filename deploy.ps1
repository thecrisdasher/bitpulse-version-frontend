#!/usr/bin/env pwsh

Write-Host "🚀 Preparando despliegue en Fly.io..." -ForegroundColor Cyan

# Verificar que fly CLI esté instalado
try {
    fly version | Out-Null
    Write-Host "✅ Fly CLI está instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Fly CLI no está instalado. Instalándolo..." -ForegroundColor Red
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
    $env:PATH += ";$env:USERPROFILE\.fly\bin"
}

# Verificar login en Fly.io
try {
    fly auth whoami | Out-Null
    Write-Host "✅ Ya tienes sesión iniciada en Fly.io" -ForegroundColor Green
} catch {
    Write-Host "🔐 Necesitas hacer login en Fly.io..." -ForegroundColor Yellow
    fly auth login
}

# Configurar la aplicación
Write-Host "📦 Configurando aplicación en Fly.io..." -ForegroundColor Cyan

# Verificar si la app ya existe
try {
    fly apps show bitpulse-frontend | Out-Null
    Write-Host "✅ La aplicación ya existe" -ForegroundColor Green
} catch {
    Write-Host "🆕 Creando nueva aplicación..." -ForegroundColor Yellow
    fly apps create bitpulse-frontend
}

# Configurar volumen para datos persistentes
Write-Host "💾 Configurando almacenamiento persistente..." -ForegroundColor Cyan
try {
    fly volumes show bitpulse_data | Out-Null
    Write-Host "✅ El volumen ya existe" -ForegroundColor Green
} catch {
    fly volumes create bitpulse_data --size 1
}

# Configurar variables de entorno críticas
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Cyan

# Base de datos (si no está configurada)
$secrets = fly secrets list
if ($secrets -notmatch "DATABASE_URL") {
    Write-Host "🗄️  Configurando base de datos PostgreSQL..." -ForegroundColor Yellow
    fly postgres create --name bitpulse-db --region mia
    # Adjuntar la base de datos
    fly postgres attach --app bitpulse-frontend bitpulse-db
}

# Configurar JWT secret si no existe
if ($secrets -notmatch "JWT_SECRET") {
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
    fly secrets set "JWT_SECRET=$jwtSecret"
}

# Configurar NEXTAUTH_SECRET si no existe
if ($secrets -notmatch "NEXTAUTH_SECRET") {
    $nextAuthSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
    fly secrets set "NEXTAUTH_SECRET=$nextAuthSecret"
}

# URL de la aplicación
$appUrl = "https://bitpulse-frontend.fly.dev"
fly secrets set "NEXTAUTH_URL=$appUrl"
fly secrets set "NEXT_PUBLIC_APP_URL=$appUrl"
fly secrets set "FRONTEND_URL=$appUrl"

Write-Host "🚀 Desplegando aplicación..." -ForegroundColor Cyan
fly deploy --remote-only

Write-Host "✅ ¡Despliegue completado!" -ForegroundColor Green
Write-Host "🌐 Tu aplicación está disponible en: $appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   - Ver logs: fly logs"
Write-Host "   - Ver estado: fly status"
Write-Host "   - Abrir app: fly open"
Write-Host "   - SSH a la máquina: fly ssh console" 