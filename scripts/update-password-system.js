#!/usr/bin/env node

/**
 * Script para actualizar el sistema de contraseñas
 * Este script aplica los cambios necesarios para el nuevo sistema de cambio de contraseñas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando actualización del sistema de contraseñas...\n');

// 1. Generar el cliente de Prisma
console.log('📦 Generando cliente de Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente de Prisma generado exitosamente\n');
} catch (error) {
  console.error('❌ Error generando cliente de Prisma:', error.message);
  process.exit(1);
}

// 2. Aplicar cambios a la base de datos
console.log('🗄️ Aplicando cambios a la base de datos...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Cambios aplicados a la base de datos exitosamente\n');
} catch (error) {
  console.error('❌ Error aplicando cambios a la base de datos:', error.message);
  process.exit(1);
}

// 3. Actualizar código para descomentar las líneas relacionadas con mustChangePassword
console.log('📝 Actualizando código...');

const filesToUpdate = [
  'app/api/admin/users/route.ts',
  'app/api/auth/change-password/route.ts'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Descomentar líneas relacionadas con mustChangePassword
    content = content.replace(
      /\/\/ (mustChangePassword: true,)/g,
      '$1'
    );
    content = content.replace(
      /\/\/ (mustChangePassword: true,) \/\/ Descomentar después de ejecutar: npx prisma generate && npx prisma db push/g,
      '$1'
    );
    content = content.replace(
      /\/\/ (updateData\.mustChangePassword = false;) \/\/ Descomentar después de la migración/g,
      '$1'
    );
    content = content.replace(
      /\/\/ (mustChangePassword: true,) \/\/ Descomentar después de la migración/g,
      '$1'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`  ✅ Actualizado: ${filePath}`);
  } else {
    console.log(`  ⚠️  Archivo no encontrado: ${filePath}`);
  }
});

console.log('\n🎉 ¡Actualización del sistema de contraseñas completada exitosamente!');
console.log('\nCambios aplicados:');
console.log('- ✅ Campo mustChangePassword agregado al modelo User');
console.log('- ✅ API de cambio de contraseña implementado');
console.log('- ✅ Página de cambio de contraseña implementada');
console.log('- ✅ Usuarios creados por admin configurados correctamente');
console.log('\n📋 Funcionalidades disponibles:');
console.log('- Los usuarios creados por admin pueden hacer login inmediatamente');
console.log('- En el primer login son redirigidos a /auth/change-password');
console.log('- Deben cambiar su contraseña temporal por una nueva');
console.log('- Una vez cambiada, pueden usar la plataforma normalmente');
console.log('\n🔧 Para probar:');
console.log('1. Crea un usuario maestro desde el panel de admin');
console.log('2. Usa las credenciales temporales para hacer login');
console.log('3. Serás redirigido automáticamente a cambiar la contraseña');
console.log('4. ¡Listo! Ya puedes usar la cuenta normalmente'); 