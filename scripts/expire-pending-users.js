#!/usr/bin/env node

/**
 * Script para expirar usuarios pendientes de aprobación
 * Este script busca usuarios que requieren aprobación admin, no han sido aprobados
 * y su fecha de expiración ha pasado, luego los desactiva automáticamente.
 * 
 * Uso: node scripts/expire-pending-users.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function expirePendingUsers() {
  try {
    console.log('🔍 Buscando usuarios pendientes expirados...');
    
    const now = new Date();
    
    // Buscar usuarios que requieren aprobación, no están aprobados y han expirado
    const expiredUsers = await prisma.user.findMany({
      where: {
        adminApprovalRequired: true,
        adminApproved: false,
        adminApprovalExpiresAt: {
          lt: now
        },
        isActive: true // Solo usuarios que aún están activos
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        adminApprovalExpiresAt: true,
        adminApprovalRequestedAt: true
      }
    });

    if (expiredUsers.length === 0) {
      console.log('✅ No hay usuarios pendientes expirados.');
      return;
    }

    console.log(`⚠️  Encontrados ${expiredUsers.length} usuarios expirados:`);
    
    for (const user of expiredUsers) {
      const daysSinceExpiry = Math.floor((now.getTime() - user.adminApprovalExpiresAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Expirado hace ${daysSinceExpiry} días`);
    }

    // Desactivar usuarios expirados
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: expiredUsers.map(user => user.id)
        }
      },
      data: {
        isActive: false,
        emailConfirmed: false,
        adminApprovalNotes: `Solicitud expirada automáticamente el ${now.toISOString()}`
      }
    });

    console.log(`✅ ${result.count} usuarios han sido desactivados por expiración.`);

    // Opcional: Registrar actividad para auditoria
    const activities = expiredUsers.map(user => ({
      userId: user.id,
      action: 'account_expired',
      details: {
        reason: 'Admin approval expired',
        expiredAt: now.toISOString(),
        originalRequestDate: user.adminApprovalRequestedAt,
        originalExpiryDate: user.adminApprovalExpiresAt
      },
      timestamp: now
    }));

    await prisma.userActivity.createMany({
      data: activities
    });

    console.log(`📝 Actividades de expiración registradas en el log.`);

  } catch (error) {
    console.error('❌ Error al procesar usuarios expirados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  expirePendingUsers()
    .then(() => {
      console.log('✨ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { expirePendingUsers }; 