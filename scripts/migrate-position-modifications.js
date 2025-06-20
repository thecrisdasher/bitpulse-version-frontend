#!/usr/bin/env node

/**
 * Script para migrar la base de datos agregando el modelo PositionModification
 * 
 * Uso:
 * node scripts/migrate-position-modifications.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando migración para modificaciones de posiciones...\n');

try {
  // Generar la migración de Prisma
  console.log('1. Generando migración de Prisma...');
  execSync('npx prisma migrate dev --name add-position-modifications', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });

  // Generar el cliente de Prisma actualizado
  console.log('\n2. Generando cliente de Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });

  console.log('\n✅ Migración completada exitosamente!');
  console.log('\n📝 Resumen de cambios:');
  console.log('   - Agregado modelo PositionModification');
  console.log('   - Agregada relación con TradePosition');
  console.log('   - Tabla position_modifications creada en la base de datos');
  console.log('\n🎯 El sistema ahora soporta:');
  console.log('   - Historial de modificaciones de posiciones');
  console.log('   - Auditoría completa de cambios por admin/maestro');
  console.log('   - Rastreo de quién, qué, cuándo y por qué se modificó');

} catch (error) {
  console.error('\n❌ Error durante la migración:', error.message);
  console.log('\n🔧 Pasos para resolver:');
  console.log('   1. Verifica que la base de datos esté corriendo');
  console.log('   2. Confirma que DATABASE_URL está configurado correctamente');
  console.log('   3. Ejecuta: npx prisma migrate dev --name add-position-modifications');
  console.log('   4. Luego: npx prisma generate');
  process.exit(1);
} 