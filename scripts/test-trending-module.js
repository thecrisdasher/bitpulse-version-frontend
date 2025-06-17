#!/usr/bin/env node

/**
 * Script para probar el módulo de trending con fallback automático
 * Verifica que los datos se obtengan correctamente desde Binance o simulador
 */

const { performance } = require('perf_hooks');

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Prueba el hook useTrendingData (simulación)
 */
async function testTrendingHook() {
  log('🧪 Testing useTrendingData hook...');
  
  try {
    // Simular el comportamiento del hook
    const TRENDING_SYMBOLS = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
      'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'DOGEUSDT'
    ];

    // Probar Binance API directamente
    log('📡 Testing Binance API directly...');
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const symbolsQuery = encodeURIComponent(JSON.stringify(TRENDING_SYMBOLS));
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsQuery}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      
      if (response.ok) {
        const data = await response.json();
        log(`✅ Binance API working - Response time: ${Math.round(endTime - startTime)}ms`);
        log(`📊 Received ${data.length} symbols from Binance`);
        
        // Mostrar algunos datos de ejemplo
        if (data.length > 0) {
          const btc = data.find(item => item.symbol === 'BTCUSDT');
          if (btc) {
            log(`💰 BTC Price: $${parseFloat(btc.lastPrice).toLocaleString()}`);
            log(`📈 BTC 24h Change: ${parseFloat(btc.priceChangePercent).toFixed(2)}%`);
          }
        }
        
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      log(`❌ Binance API failed: ${error.message}`);
      log('🔄 Would fallback to simulator...');
      return false;
    }
    
  } catch (error) {
    log(`❌ Hook test failed: ${error.message}`);
    return false;
  }
}

/**
 * Prueba la API de trending local
 */
async function testTrendingAPI() {
  log('🧪 Testing local trending API...');
  
  const testCases = [
    { url: 'http://localhost:3000/api/market/trending', description: 'Default trending' },
    { url: 'http://localhost:3000/api/market/trending?limit=10', description: 'Limited to 10' },
    { url: 'http://localhost:3000/api/market/trending?sortBy=change24h', description: 'Sorted by 24h change' },
    { url: 'http://localhost:3000/api/market/trending?limit=5&sortBy=volume24h', description: 'Top 5 by volume' }
  ];
  
  for (const testCase of testCases) {
    try {
      log(`📡 Testing: ${testCase.description}`);
      const startTime = performance.now();
      
      const response = await fetch(testCase.url);
      const endTime = performance.now();
      const data = await response.json();
      
      if (data.success) {
        log(`✅ API Success - Response time: ${Math.round(endTime - startTime)}ms`);
        log(`📊 Data source: ${data.meta.source} (fallback: ${data.meta.usingFallback})`);
        log(`🔢 Items returned: ${data.data.length}`);
        
        // Mostrar primer elemento como ejemplo
        if (data.data.length > 0) {
          const first = data.data[0];
          log(`💰 ${first.name} (${first.symbol}): $${first.price.toLocaleString()} (${first.change24h > 0 ? '+' : ''}${first.change24h.toFixed(2)}%)`);
        }
        
      } else {
        log(`❌ API Error: ${data.message}`);
      }
      
    } catch (error) {
      log(`❌ Request failed: ${error.message}`);
    }
    
    log(''); // Línea en blanco para separar tests
  }
}

/**
 * Simula el comportamiento en diferentes escenarios
 */
async function testFallbackScenarios() {
  log('🧪 Testing fallback scenarios...');
  
  // Escenario 1: API de Binance disponible
  log('📋 Scenario 1: Binance API available');
  try {
    const response = await fetch('https://api.binance.com/api/v3/ping');
    if (response.ok) {
      log('✅ Binance API is reachable');
    } else {
      log('⚠️  Binance API returned non-200 status');
    }
  } catch (error) {
    log('❌ Binance API is not reachable');
  }
  
  // Escenario 2: Timeout simulation
  log('📋 Scenario 2: Timeout simulation');
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1); // 1ms timeout (muy corto)
    
    await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: controller.signal
    });
    log('⚠️  Timeout didn\'t trigger (unexpected)');
  } catch (error) {
    if (error.name === 'AbortError') {
      log('✅ Timeout scenario working - would trigger fallback');
    } else {
      log(`❌ Unexpected error: ${error.message}`);
    }
  }
  
  // Escenario 3: Rate limiting simulation
  log('📋 Scenario 3: Rate limiting awareness');
  log('💡 In production, rate limits would trigger fallback automatically');
}

/**
 * Verifica la calidad de los datos
 */
async function testDataQuality() {
  log('🧪 Testing data quality...');
  
  try {
    const response = await fetch('http://localhost:3000/api/market/trending?limit=5');
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      log('✅ Data structure validation:');
      
      const item = data.data[0];
      const requiredFields = ['id', 'name', 'symbol', 'price', 'change24h', 'marketCap', 'volume24h'];
      
      let allFieldsPresent = true;
      for (const field of requiredFields) {
        if (item[field] === undefined || item[field] === null) {
          log(`❌ Missing field: ${field}`);
          allFieldsPresent = false;
        } else {
          log(`✅ Field '${field}': ${typeof item[field]} = ${item[field]}`);
        }
      }
      
      if (allFieldsPresent) {
        log('✅ All required fields present');
      }
      
      // Validar tipos de datos
      if (typeof item.price === 'number' && item.price > 0) {
        log('✅ Price is valid number');
      } else {
        log('❌ Price validation failed');
      }
      
      if (typeof item.change24h === 'number') {
        log('✅ Change24h is valid number');
      } else {
        log('❌ Change24h validation failed');
      }
      
    } else {
      log('❌ No data returned for quality check');
    }
    
  } catch (error) {
    log(`❌ Data quality test failed: ${error.message}`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Trending Module Test Suite');
  console.log('==============================\n');
  
  // Test 1: Hook behavior simulation
  log('1️⃣ Testing hook behavior...');
  await testTrendingHook();
  console.log('');
  
  // Test 2: Local API endpoints
  log('2️⃣ Testing local API endpoints...');
  await testTrendingAPI();
  console.log('');
  
  // Test 3: Fallback scenarios
  log('3️⃣ Testing fallback scenarios...');
  await testFallbackScenarios();
  console.log('');
  
  // Test 4: Data quality
  log('4️⃣ Testing data quality...');
  await testDataQuality();
  console.log('');
  
  // Resumen
  log('🎯 Test Summary:');
  log('✅ = Working correctly');
  log('⚠️  = Working with warnings');
  log('❌ = Needs attention');
  log('');
  log('💡 Next steps:');
  log('- If Binance API is working: You\'ll get real-time data');
  log('- If Binance API fails: System automatically uses simulator');
  log('- Check browser console for detailed logs');
  log('- Monitor performance in production');
  
  console.log('\n🏁 Testing completed!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testTrendingHook,
  testTrendingAPI,
  testFallbackScenarios,
  testDataQuality
}; 