/**
 * Cliente de Prisma para server.js (CommonJS)
 * Este archivo es específicamente para ser usado por server.js
 */
const { PrismaClient } = require('@prisma/client');

// Cliente de Prisma singleton
const prisma = new PrismaClient();

// Función para desconectar Prisma (para scripts)
const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    console.log('Prisma desconectado correctamente');
  } catch (error) {
    console.error('Error al desconectar Prisma:', error);
    throw error;
  }
};

module.exports = { prisma, disconnectPrisma }; 