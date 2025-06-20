/**
 * Cliente de Prisma con patrón Singleton para evitar múltiples conexiones.
 * Versión JavaScript para compatibilidad con server.js.
 */
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis || global;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// En desarrollo, usar global para evitar hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para cerrar conexiones apropiadamente
async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnectPrisma }; 