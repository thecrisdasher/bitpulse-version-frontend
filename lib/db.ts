/**
 * Cliente real de Prisma para acceso a la base de datos.
 * Reemplaza al mock en memoria definido anteriormente.
     */
import { PrismaClient } from '@prisma/client';

// Cliente real de Prisma para acceso a la base de datos
export const prisma = new PrismaClient(); 