# Usar imagen oficial de Node.js
FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Construir aplicación
RUN pnpm run build

# Exponer puerto
EXPOSE 3004

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3004

# Comando de inicio
CMD ["node", "server.js"] 