#!/usr/bin/env node

/**
 * Script para probar las APIs locales de Binance
 * Requiere que el servidor local esté ejecutándose en puerto 3000
 */

const LOCAL_API_BASE = 'http://localhost:3000';

async function testLocalAPI(endpoint, description) {
  try {
    console.log(`🔍 Testing ${description}...`);
    const url = `${LOCAL_API_BASE}${endpoint}`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   Response type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
    console.log(`   Data size: ${Array.isArray(data) ? data.length + ' items' : Object.keys(data).length + ' properties'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`   Sample item:`, data[0]);
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        console.log(`   Sample property (${keys[0]}):`, data[keys[0]]);
      }
    }
    
    console.log('   ✅ SUCCESS\n');
    return data;
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing Local Binance APIs');
  console.log('=' .repeat(50));
  console.log(`Base URL: ${LOCAL_API_BASE}`);
  console.log('Make sure your Next.js dev server is running!\n');
  
  const tests = [
    {
      endpoint: '/api/binance/tickers?symbols=BTC,ETH,BNB',
      description: 'Tickers API (3 symbols)'
    },
    {
      endpoint: '/api/binance/tickers?symbols=BTC,ETH,BNB,XRP,ADA,SOL,DOT,MATIC,LINK,DOGE',
      description: 'Tickers API (10 symbols)'
    },
    {
      endpoint: '/api/binance/klines?symbol=BTCUSDT&interval=1m&limit=5',
      description: 'Klines API (BTC 1m)'
    },
    {
      endpoint: '/api/binance/klines?symbol=ETHUSDT&interval=1h&limit=10',
      description: 'Klines API (ETH 1h)'
    },
    {
      endpoint: '/api/market/favorites',
      description: 'Market Favorites API'
    },
    {
      endpoint: '/api/trading/auto-close',
      description: 'Auto-close Status API'
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const result = await testLocalAPI(test.endpoint, test.description);
    results[test.description] = result !== null;
  }
  
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  for (const [description, success] of Object.entries(results)) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${description}`);
    if (success) successCount++;
  }
  
  console.log(`\n🎯 Results: ${successCount}/${tests.length} tests passed`);
  
  if (successCount === tests.length) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log('⚠️  Some APIs failed. Make sure the dev server is running.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 