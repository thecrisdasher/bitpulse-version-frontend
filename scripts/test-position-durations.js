#!/usr/bin/env node

/**
 * Script para probar el sistema de duraciones de posiciones
 * Verifica que posiciones con diferentes duraciones se manejen correctamente
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

/**
 * Crea una posición de prueba
 */
async function createTestPosition(duration, unit, instrumentId = 'BTCUSDT') {
  try {
    const response = await fetch('http://localhost:3000/api/trading/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aquí necesitarías agregar autenticación si es requerida
      },
      body: JSON.stringify({
        instrument: instrumentId,
        direction: 'long',
        amount: 100,
        leverage: 1,
        durationValue: duration,
        durationUnit: unit,
        openPrice: 50000, // Precio simulado
        stake: 100
      })
    });

    const data = await response.json();
    
    if (data.success) {
      log(`✅ Posición creada: ID ${data.data.id}, Duración: ${duration} ${unit}(s)`);
      return data.data;
    } else {
      log(`❌ Error creando posición: ${data.message}`);
      return null;
    }
  } catch (error) {
    log(`❌ Error de red: ${error.message}`);
    return null;
  }
}

/**
 * Obtiene información de una posición
 */
async function getPositionInfo(positionId) {
  try {
    const response = await fetch('http://localhost:3000/api/trading/positions');
    const data = await response.json();
    
    if (data.success) {
      const position = data.data.find(p => p.id === positionId);
      return position;
    }
    return null;
  } catch (error) {
    log(`❌ Error obteniendo posición: ${error.message}`);
    return null;
  }
}

/**
 * Verifica el estado del scheduler
 */
async function checkSchedulerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/trading/scheduler');
    const data = await response.json();
    
    if (data.success) {
      log(`📊 Scheduler Estado:`);
      log(`   Auto-close: ${data.data.autoCloseRunning ? '✅ Activo' : '❌ Inactivo'}`);
      log(`   Próximo cierre: ${data.data.nextAutoClose || 'No programado'}`);
      log(`   Posiciones cerradas: ${data.data.stats.positionsClosed}`);
      return data.data;
    }
  } catch (error) {
    log(`❌ Error obteniendo estado del scheduler: ${error.message}`);
  }
  return null;
}

/**
 * Ejecuta las pruebas
 */
async function runTests() {
  log('🚀 Iniciando pruebas de duración de posiciones');
  
  // 1. Verificar estado del scheduler
  log('\n1️⃣ Verificando estado del scheduler...');
  await checkSchedulerStatus();
  
  // 2. Crear posiciones de prueba con diferentes duraciones
  log('\n2️⃣ Creando posiciones de prueba...');
  
  const testCases = [
    { duration: 2, unit: 'minute', description: '2 minutos (prueba rápida)' },
    { duration: 1, unit: 'hour', description: '1 hora' },
    { duration: 1, unit: 'day', description: '1 día' },
    { duration: 30, unit: 'day', description: '30 días (caso problemático)' }
  ];
  
  const createdPositions = [];
  
  for (const testCase of testCases) {
    log(`\n   Creando posición con duración: ${testCase.description}`);
    const position = await createTestPosition(testCase.duration, testCase.unit);
    if (position) {
      createdPositions.push({
        ...position,
        expectedDuration: testCase.duration,
        expectedUnit: testCase.unit,
        description: testCase.description
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre creaciones
  }
  
  // 3. Verificar que las posiciones se crearon con las duraciones correctas
  log('\n3️⃣ Verificando posiciones creadas...');
  
  for (const position of createdPositions) {
    const currentInfo = await getPositionInfo(position.id);
    if (currentInfo) {
      const createdAt = new Date(currentInfo.openTime);
      const now = new Date();
      const elapsedMs = now.getTime() - createdAt.getTime();
      
      log(`\n   📍 Posición ${position.id}:`);
      log(`      Duración esperada: ${position.expectedDuration} ${position.expectedUnit}(s)`);
      log(`      Duración en DB: ${currentInfo.durationValue} ${currentInfo.durationUnit}(s)`);
      log(`      Estado: ${currentInfo.status}`);
      log(`      Creada hace: ${Math.round(elapsedMs / 1000)} segundos`);
      
      // Verificar que la duración se guardó correctamente
      if (currentInfo.durationValue === position.expectedDuration && 
          currentInfo.durationUnit === position.expectedUnit) {
        log(`      ✅ Duración correcta`);
      } else {
        log(`      ❌ Duración incorrecta!`);
      }
    } else {
      log(`   ❌ No se pudo obtener información de la posición ${position.id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 4. Monitorear la posición de 2 minutos para ver si se cierra automáticamente
  log('\n4️⃣ Monitoreando posición de 2 minutos...');
  
  const shortPosition = createdPositions.find(p => p.expectedDuration === 2 && p.expectedUnit === 'minute');
  if (shortPosition) {
    log(`   Monitoreando posición ${shortPosition.id} por 3 minutos...`);
    
    for (let i = 0; i < 18; i++) { // 18 * 10 segundos = 3 minutos
      await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
      
      const currentInfo = await getPositionInfo(shortPosition.id);
      const elapsed = Math.round((Date.now() - new Date(shortPosition.openTime).getTime()) / 1000);
      
      if (currentInfo) {
        log(`   ⏱️  ${elapsed}s - Estado: ${currentInfo.status}`);
        
        if (currentInfo.status === 'closed') {
          log(`   ✅ Posición cerrada automáticamente después de ${elapsed} segundos`);
          break;
        }
      } else {
        log(`   ❌ Posición no encontrada (posiblemente eliminada)`);
        break;
      }
    }
  }
  
  // 5. Resumen final
  log('\n5️⃣ Resumen de resultados:');
  
  for (const position of createdPositions) {
    const currentInfo = await getPositionInfo(position.id);
    const status = currentInfo ? currentInfo.status : 'No encontrada';
    const durationMatch = currentInfo ? 
      (currentInfo.durationValue === position.expectedDuration && 
       currentInfo.durationUnit === position.expectedUnit) : false;
    
    log(`   ${position.description}: ${status} ${durationMatch ? '✅' : '❌'}`);
  }
  
  log('\n🎯 Pruebas completadas');
  log('\n📋 Interpretación:');
  log('   ✅ = Funciona correctamente');
  log('   ❌ = Problema detectado');
  log('\n💡 Si hay problemas con duraciones largas (30 días), verifica:');
  log('   - Que el contexto TradePositionsContext.tsx use durationValue/durationUnit de la DB');
  log('   - Que el servicio positionAutoCloseService.ts calcule correctamente el vencimiento');
  log('   - Que no haya límites de tiempo en el sistema');
}

/**
 * Función principal
 */
async function main() {
  console.log('🧪 Pruebas de Duración de Posiciones');
  console.log('====================================\n');
  
  const proceed = await question('¿Proceder con las pruebas? Esto creará posiciones de prueba. (y/n): ');
  
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('Pruebas canceladas.');
    rl.close();
    return;
  }
  
  try {
    await runTests();
  } catch (error) {
    log(`❌ Error durante las pruebas: ${error.message}`);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  createTestPosition,
  getPositionInfo,
  checkSchedulerStatus,
  runTests
}; 