#!/usr/bin/env node

/**
 * Script para probar la integración de Binance con BitPulse
 * Verifica que las criptomonedas obtengan datos reales de Binance
 */

const https = require('https');

// Símbolos de criptomonedas a probar
const CRYPTO_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
  'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'LTCUSDT', 'LINKUSDT',
  'MATICUSDT', 'BCHUSDT', 'AVAXUSDT', 'ATOMUSDT', 'ALGOUSDT'
];

/**
 * Realizar petición HTTP usando el módulo nativo de Node.js
 */
function fetchBinanceData(symbols) {
  return new Promise((resolve, reject) => {
    const symbolsQuery = encodeURIComponent(JSON.stringify(symbols));
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsQuery}`;
    
    console.log('🚀 Probando conexión con Binance API...');
    console.log('URL:', url);
    
    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    }).on('timeout', () => {
      reject(new Error('Request timeout after 10 seconds'));
    });
  });
}

/**
 * Formatear precio con separadores de miles
 */
function formatPrice(price) {
  const num = parseFloat(price);
  if (num >= 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (num >= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(8);
  }
}

/**
 * Función principal
 */
async function testBinanceIntegration() {
  console.log('🔍 Iniciando prueba de integración con Binance...\n');
  
  try {
    // Probar API de Binance
    const binanceData = await fetchBinanceData(CRYPTO_SYMBOLS);
    
    if (!Array.isArray(binanceData)) {
      throw new Error('Respuesta de Binance no es un array válido');
    }
    
    console.log('✅ Conexión exitosa con Binance API');
    console.log(`📊 Datos obtenidos para ${binanceData.length} símbolos\n`);
    
    // Mostrar resumen de precios
    console.log('📈 PRECIOS ACTUALES DE CRIPTOMONEDAS:');
    console.log(''.padEnd(60, '='));
    console.log('Símbolo'.padEnd(12) + 'Precio'.padEnd(15) + 'Cambio 24h'.padEnd(12) + 'Volumen');
    console.log(''.padEnd(60, '-'));
    
    binanceData.forEach((ticker) => {
      const symbol = ticker.symbol.replace('USDT', '');
      const price = formatPrice(ticker.lastPrice);
      const change24h = parseFloat(ticker.priceChangePercent).toFixed(2);
      const volume = parseFloat(ticker.volume).toLocaleString('en-US', { maximumFractionDigits: 0 });
      const changeColor = change24h >= 0 ? '🟢' : '🔴';
      
      console.log(
        symbol.padEnd(12) + 
        price.padEnd(15) + 
        `${changeColor} ${change24h}%`.padEnd(12) + 
        volume
      );
    });
    
    console.log(''.padEnd(60, '='));
    
    // Verificar instrumentos específicos importantes
    console.log('\n🎯 VERIFICACIÓN DE INSTRUMENTOS CLAVE:');
    console.log(''.padEnd(50, '-'));
    
    const keySymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
    keySymbols.forEach(symbol => {
      const ticker = binanceData.find(t => t.symbol === symbol);
      if (ticker) {
        const baseSymbol = symbol.replace('USDT', '');
        const price = formatPrice(ticker.lastPrice);
        const change24h = parseFloat(ticker.priceChangePercent).toFixed(2);
        const status = ticker ? '✅' : '❌';
        console.log(`${status} ${baseSymbol}: $${price} (${change24h}%)`);
      } else {
        console.log(`❌ ${symbol}: No encontrado`);
      }
    });
    
    // Simular el comportamiento del frontend
    console.log('\n🔄 SIMULANDO COMPORTAMIENTO DEL FRONTEND:');
    console.log(''.padEnd(50, '-'));
    
    // Crear mapeo como lo hace useBinanceTickers
    const mapping = {};
    binanceData.forEach((item) => {
      const base = item.symbol.replace(/USDT$/i, '');
      mapping[base] = {
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume: parseFloat(item.volume),
      };
    });
    
    console.log('✅ Mapeo de tickers creado exitosamente');
    console.log(`📝 ${Object.keys(mapping).length} símbolos mapeados`);
    
    // Mostrar algunos ejemplos
    const examples = ['BTC', 'ETH', 'BNB'];
    examples.forEach(symbol => {
      if (mapping[symbol]) {
        console.log(`🔸 ${symbol}: $${formatPrice(mapping[symbol].price)} (${mapping[symbol].change24h.toFixed(2)}%)`);
      }
    });
    
    console.log('\n✨ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('🎉 La integración con Binance está funcionando correctamente');
    console.log('📱 Los datos se actualizarán en tiempo real en el frontend');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error(''.padEnd(50, '='));
    console.error(`🚨 ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.error('\n💡 POSIBLES SOLUCIONES:');
      console.error('- Verificar conexión a internet');
      console.error('- Reintentar en unos minutos');
      console.error('- Verificar que Binance API esté disponible');
    } else if (error.message.includes('HTTP')) {
      console.error('\n💡 POSIBLES SOLUCIONES:');
      console.error('- Verificar límites de rate de Binance API');
      console.error('- Esperar antes de reintentar');
      console.error('- Revisar formato de la petición');
    }
    
    console.error('\n🔄 En caso de fallo, el sistema usará datos simulados');
    process.exit(1);
  }
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  testBinanceIntegration()
    .then(() => {
      console.log('\n🏁 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { testBinanceIntegration, CRYPTO_SYMBOLS }; 