// Test script to verify Binance API functionality
// Run with: node scripts/test-binance-api.js

const testBinanceAPI = async () => {
  console.log('🔍 Testing Binance API...\n');

  // Test 1: Direct Binance API
  try {
    console.log('📡 Testing direct Binance API...');
    const directURL = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5';
    const directResponse = await fetch(directURL);
    
    if (!directResponse.ok) {
      throw new Error(`HTTP ${directResponse.status}: ${directResponse.statusText}`);
    }
    
    const directData = await directResponse.json();
    console.log('✅ Direct API Success:', directData.length, 'candles received');
    console.log('   Sample data:', directData[0]);
  } catch (error) {
    console.log('❌ Direct API Error:', error.message);
  }

  // Test 2: Local proxy API
  try {
    console.log('\n📡 Testing local proxy API...');
    const proxyURL = 'http://localhost:3000/api/binance/klines?symbol=BTCUSDT&interval=1m&limit=5';
    const proxyResponse = await fetch(proxyURL);
    
    if (!proxyResponse.ok) {
      throw new Error(`HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`);
    }
    
    const proxyData = await proxyResponse.json();
    
    if (proxyData.error) {
      throw new Error(`API Error: ${proxyData.error}`);
    }
    
    if (!Array.isArray(proxyData)) {
      throw new Error(`Invalid format: expected array, got ${typeof proxyData}`);
    }
    
    console.log('✅ Proxy API Success:', proxyData.length, 'candles received');
    console.log('   Sample data:', proxyData[0]);
  } catch (error) {
    console.log('❌ Proxy API Error:', error.message);
  }

  // Test 3: Data format validation
  try {
    console.log('\n🔍 Testing data format validation...');
    
    const testData = [
      [1699027200000, "35000.00", "35100.00", "34900.00", "35050.00", "100.123", 1699027259999, "3505000.00", 150, "50.123", "1752500.00", "0"]
    ];
    
    const linePoints = testData.map((candle) => ({
      time: Math.floor(candle[0] / 1000),
      value: parseFloat(candle[4]) // close price
    }));

    const candlePoints = testData.map((candle) => ({
      time: Math.floor(candle[0] / 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
    
    console.log('✅ Data format validation passed');
    console.log('   Line data:', linePoints[0]);
    console.log('   Candle data:', candlePoints[0]);
    
  } catch (error) {
    console.log('❌ Data format validation failed:', error.message);
  }

  console.log('\n🏁 Test completed!');
};

// Run if called directly
if (typeof window === 'undefined') {
  testBinanceAPI().catch(console.error);
}

module.exports = { testBinanceAPI }; 