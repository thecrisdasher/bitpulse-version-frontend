const { prisma, disconnectPrisma } = require('../lib/db.js');

async function resetConnections() {
  console.log('🔄 Iniciando limpieza de conexiones de base de datos...');
  
  try {
    // Intentar una consulta simple para verificar conectividad
    console.log('📊 Verificando conexión a la base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos verificada');
    
    // Obtener información de conexiones activas (solo para PostgreSQL)
    if (process.env.DATABASE_URL?.includes('postgres')) {
      try {
        const connections = await prisma.$queryRaw`
          SELECT count(*) as active_connections 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `;
        console.log(`📈 Conexiones activas encontradas: ${connections[0]?.active_connections || 'desconocido'}`);
      } catch (err) {
        console.log('⚠️  No se pudo obtener información de conexiones (esto es normal)');
      }
    }
    
    // Cerrar todas las conexiones Prisma
    console.log('🔒 Cerrando conexiones Prisma...');
    await disconnectPrisma();
    console.log('✅ Conexiones Prisma cerradas correctamente');
    
    console.log('\n🎉 Limpieza completada! Puedes reiniciar el servidor ahora.');
    console.log('💡 Ejecuta: npm run dev (o el comando que uses para iniciar)');
    console.log('\n📝 Cambios implementados para prevenir el error:');
    console.log('   ✅ Singleton de Prisma implementado');
    console.log('   ✅ Todas las APIs actualizadas');
    console.log('   ✅ Configuración de transacciones optimizada');
    console.log('   ✅ Logs reducidos en desarrollo');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que la base de datos esté ejecutándose');
    console.log('   2. Revisar la variable DATABASE_URL');
    console.log('   3. Reiniciar la base de datos si es necesario');
    console.log('   4. Ejecutar: npm run dev para reiniciar con las correcciones');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  resetConnections()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetConnections }; 