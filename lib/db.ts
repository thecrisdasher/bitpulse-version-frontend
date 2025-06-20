/**
 * Cliente de Prisma con patrón Singleton para evitar múltiples conexiones.
 * Implementa las mejores prácticas recomendadas por Prisma para Next.js.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configuración de conexiones para evitar el error "too many clients"
  transactionOptions: {
    timeout: 5000,
    maxWait: 2000,
  },
})

// En desarrollo, usar globalThis para evitar hot-reload issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Función para cerrar conexiones apropiadamente
export async function disconnectPrisma() {
  await prisma.$disconnect()
} 