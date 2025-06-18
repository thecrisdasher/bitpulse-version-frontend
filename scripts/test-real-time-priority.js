/**
 * Script para probar que el sistema prioriza datos reales para operaciones de trading
 * Verifica que:
 * 1. Criptomonedas usen EXCLUSIVAMENTE datos de Binance
 * 2. API de trading obtenga precios reales al momento de crear posiciones
 * 3. No se mezclen datos simulados con reales para trading
 */

const API_BASE = 'http://localhost:3000';

// Lista de instrumentos para probar
const TEST_INSTRUMENTS = {
  // Criptomonedas (deben usar Binance)
  crypto: [
    'Bitcoin (BTC/USD)',
    'Ethereum (ETH/USD)', 
    'Solana (SOL/USD)',
    'Cardano (ADA/USD)',
    'Polkadot (DOT/USD)'
  ],
  // Otros mercados (pueden usar simulación)
  others: [
    'EUR/USD',
    'US 500',
    'Gold',
    'AAPL'
  ]
};

/**
 * Prueba 1: Verificar que API de precio en tiempo real funciona correctamente
 */
async function testRealTimePriceAPI() {
  console.log('\n🔥 === PRUEBA 1: API de Precio en Tiempo Real ===');
  
  for (const crypto of TEST_INSTRUMENTS.crypto) {
    try {
      const response = await fetch(`${API_BASE}/api/trading/real-time-price?instrument=${encodeURIComponent(crypto)}`);
      const data = await response.json();
      
      if (data.success) {
        const indicator = data.data.isRealData ? '✅ REAL' : '⚠️ SIMULADO';
        console.log(`${indicator} ${crypto}: $${data.data.price} (${data.data.source})`);
        
        if (data.data.source !== 'binance') {
          console.log(`❌ ERROR: ${crypto} no está usando datos de Binance`);
        }
      } else {
        console.log(`❌ FALLO: ${crypto} - ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${crypto} - ${error.message}`);
    }
  }
}

/**
 * Prueba 2: Verificar modo requireReal para trading
 */
async function testRequireRealMode() {
  console.log('\n🔒 === PRUEBA 2: Modo Require Real ===');
  
  for (const crypto of TEST_INSTRUMENTS.crypto) {
    try {
      const response = await fetch(`${API_BASE}/api/trading/real-time-price?instrument=${encodeURIComponent(crypto)}&requireReal=true`);
      const data = await response.json();
      
      if (data.success && data.data.isRealData) {
        console.log(`✅ ${crypto}: Precio real verificado - $${data.data.price}`);
      } else {
        console.log(`❌ ${crypto}: No se pudo obtener precio real`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${crypto} - ${error.message}`);
    }
  }
}

/**
 * Prueba 3: Comparar precios directos de Binance vs nuestra API
 */
async function testBinanceComparison() {
  console.log('\n📊 === PRUEBA 3: Comparación con Binance Directo ===');
  
  const binanceMapping = {
    'Bitcoin (BTC/USD)': 'BTCUSDT',
    'Ethereum (ETH/USD)': 'ETHUSDT',
    'Solana (SOL/USD)': 'SOLUSDT'
  };
  
  for (const [instrument, symbol] of Object.entries(binanceMapping)) {
    try {
      // Precio directo de Binance
      const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const binanceData = await binanceResponse.json();
      const binancePrice = parseFloat(binanceData.price);
      
      // Precio de nuestra API
      const ourResponse = await fetch(`${API_BASE}/api/trading/real-time-price?instrument=${encodeURIComponent(instrument)}`);
      const ourData = await ourResponse.json();
      const ourPrice = ourData.data?.price;
      
      if (ourPrice && binancePrice) {
        const difference = Math.abs(ourPrice - binancePrice);
        const percentDiff = (difference / binancePrice) * 100;
        
        console.log(`📊 ${instrument}:`);
        console.log(`   Binance: $${binancePrice}`);
        console.log(`   Nuestra API: $${ourPrice}`);
        console.log(`   Diferencia: ${difference.toFixed(8)} (${percentDiff.toFixed(4)}%)`);
        
        if (percentDiff > 0.1) {
          console.log(`⚠️ ADVERTENCIA: Diferencia mayor al 0.1%`);
        } else {
          console.log(`✅ Precios consistentes`);
        }
      } else {
        console.log(`❌ No se pudieron obtener precios para ${instrument}`);
      }
    } catch (error) {
      console.log(`❌ ERROR comparando ${instrument}: ${error.message}`);
    }
  }
}

/**
 * Prueba 4: Verificar datos para instrumentos no-crypto
 */
async function testNonCryptoInstruments() {
  console.log('\n🌍 === PRUEBA 4: Instrumentos No-Crypto ===');
  
  for (const instrument of TEST_INSTRUMENTS.others) {
    try {
      const response = await fetch(`${API_BASE}/api/trading/real-time-price?instrument=${encodeURIComponent(instrument)}`);
      const data = await response.json();
      
      if (data.success) {
        const indicator = data.data.isRealData ? '✅ REAL' : '⚡ SIMULADO';
        console.log(`${indicator} ${instrument}: $${data.data.price} (${data.data.source})`);
        
        if (data.data.warning) {
          console.log(`   ⚠️ ${data.data.warning}`);
        }
      } else {
        console.log(`❌ FALLO: ${instrument} - ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${instrument} - ${error.message}`);
    }
  }
}

/**
 * Prueba 5: Simular creación de posición (sin crear realmente)
 */
async function testTradingPositionPricing() {
  console.log('\n💼 === PRUEBA 5: Verificación de Precios para Trading ===');
  
  const testInstrument = 'Bitcoin (BTC/USD)';
  
  try {
    // Obtener precio para trading
    const priceResponse = await fetch(`${API_BASE}/api/trading/real-time-price?instrument=${encodeURIComponent(testInstrument)}&requireReal=true`);
    const priceData = await priceResponse.json();
    
    if (priceData.success && priceData.data.isRealData) {
      console.log(`✅ Precio real para trading: $${priceData.data.price}`);
      console.log(`✅ Fuente: ${priceData.data.source}`);
      console.log(`✅ Timestamp: ${priceData.data.timestamp}`);
      console.log(`✅ Este precio sería usado para abrir una posición`);
    } else {
      console.log(`❌ No se puede obtener precio real para trading de ${testInstrument}`);
      if (priceData.error) {
        console.log(`   Error: ${priceData.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR en prueba de trading: ${error.message}`);
  }
}

/**
 * Función principal
 */
async function runAllTests() {
  console.log('🚀 === INICIANDO PRUEBAS DE PRIORIDAD DE DATOS REALES ===');
  console.log('   Verificando que criptomonedas usen EXCLUSIVAMENTE datos de Binance');
  console.log('   Verificando que trading use precios reales al momento de operar');
  
  try {
    await testRealTimePriceAPI();
    await testRequireRealMode();
    await testBinanceComparison();
    await testNonCryptoInstruments();
    await testTradingPositionPricing();
    
    console.log('\n✅ === PRUEBAS COMPLETADAS ===');
    console.log('📋 Resumen:');
    console.log('• Criptomonedas deben mostrar ✅ REAL (binance)');
    console.log('• Otros instrumentos pueden mostrar ⚡ SIMULADO');
    console.log('• Trading debe usar requireReal=true para obtener precios');
    console.log('• Diferencias con Binance directo deben ser mínimas');
    
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testRealTimePriceAPI,
  testBinanceComparison,
  testTradingPositionPricing
};