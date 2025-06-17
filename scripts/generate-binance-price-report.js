#!/usr/bin/env node

/**
 * Script para generar reporte de precios de Binance vs Simulador
 * Consulta APIs locales y genera comparación para actualizar datos base
 */

const fs = require('fs');
const path = require('path');

// Configuración
const LOCAL_API_BASE = 'http://localhost:3000';
const OUTPUT_FILE = 'binance-price-report.json';
const REPORT_FILE = 'REPORTE_PRECIOS_BINANCE.md';

// Símbolos a consultar (mismos del simulador)
const SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'MATIC', 'LINK', 'DOGE',
  'AVAX', 'UNI', 'LTC', 'BCH', 'ATOM', 'ALGO', 'VET', 'FIL', 'TRX', 'ETC',
  'MANA', 'SAND', 'SUSHI', 'AAVE', 'COMP', 'MKR', 'SNX', 'YFI'
];

// Precios base actuales del simulador
const CURRENT_SIMULATOR_PRICES = {
  'BTC': 65000,
  'ETH': 3500,
  'BNB': 420,
  'XRP': 0.60,
  'ADA': 0.45,
  'SOL': 180,
  'DOT': 8.5,
  'MATIC': 0.85,
  'LINK': 15.5,
  'DOGE': 0.08,
  'AVAX': 35,
  'UNI': 8.2,
  'LTC': 95,
  'BCH': 250,
  'ATOM': 12.5,
  'ALGO': 0.25,
  'VET': 0.032,
  'FIL': 6.8,
  'TRX': 0.095,
  'ETC': 28,
  'MANA': 0.45,
  'SAND': 0.55,
  'SUSHI': 1.85,
  'AAVE': 125,
  'COMP': 68,
  'MKR': 1850,
  'SNX': 3.2,
  'YFI': 8500
};

/**
 * Consulta la API local de tickers
 */
async function fetchLocalTickers() {
  try {
    console.log('🔍 Consultando API local de tickers...');
    
    const url = `${LOCAL_API_BASE}/api/binance/tickers?symbols=${SYMBOLS.join(',')}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Datos obtenidos para ${Object.keys(data).length} símbolos`);
    return data;
    
  } catch (error) {
    console.error('❌ Error consultando API local:', error.message);
    return null;
  }
}

/**
 * Consulta la API directa de Binance como respaldo
 */
async function fetchDirectBinance() {
  try {
    console.log('🔍 Consultando API directa de Binance...');
    
    const fullSymbols = SYMBOLS.map(s => `${s}USDT`);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(fullSymbols))}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convertir a formato similar al local
    const mapping = {};
    data.forEach(item => {
      const base = String(item.symbol).replace(/USDT$/i, '');
      mapping[base] = {
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume: parseFloat(item.volume)
      };
    });
    
    console.log(`✅ Datos obtenidos directamente para ${Object.keys(mapping).length} símbolos`);
    return mapping;
    
  } catch (error) {
    console.error('❌ Error consultando Binance directamente:', error.message);
    return null;
  }
}

/**
 * Genera análisis comparativo
 */
function generateAnalysis(realPrices) {
  const analysis = {
    timestamp: new Date().toISOString(),
    totalSymbols: Object.keys(realPrices).length,
    comparisons: [],
    suggestions: {},
    statistics: {
      avgDifference: 0,
      maxDifference: 0,
      minDifference: 0,
      outdatedCount: 0
    }
  };
  
  const differences = [];
  
  Object.entries(realPrices).forEach(([symbol, data]) => {
    const realPrice = data.price;
    const simulatorPrice = CURRENT_SIMULATOR_PRICES[symbol];
    
    if (simulatorPrice) {
      const difference = ((realPrice - simulatorPrice) / simulatorPrice) * 100;
      const isOutdated = Math.abs(difference) > 20; // Si difiere más del 20%
      
      differences.push(difference);
      
      analysis.comparisons.push({
        symbol,
        realPrice,
        simulatorPrice,
        difference: Math.round(difference * 100) / 100,
        percentageDiff: `${difference > 0 ? '+' : ''}${Math.round(difference * 100) / 100}%`,
        isOutdated,
        change24h: data.change24h,
        volume: data.volume
      });
      
      // Sugerir nuevo precio base
      analysis.suggestions[symbol] = realPrice;
      
      if (isOutdated) {
        analysis.statistics.outdatedCount++;
      }
    }
  });
  
  // Calcular estadísticas
  if (differences.length > 0) {
    analysis.statistics.avgDifference = Math.round((differences.reduce((a, b) => a + b, 0) / differences.length) * 100) / 100;
    analysis.statistics.maxDifference = Math.round(Math.max(...differences) * 100) / 100;
    analysis.statistics.minDifference = Math.round(Math.min(...differences) * 100) / 100;
  }
  
  return analysis;
}

/**
 * Genera código actualizado del simulador
 */
function generateUpdatedSimulatorCode(suggestions) {
  const codeLines = [
    '// Precios base actualizados - ' + new Date().toLocaleString(),
    'const BASE_PRICES: Record<string, number> = {'
  ];
  
  Object.entries(suggestions).forEach(([symbol, price]) => {
    const formattedPrice = price < 1 ? price.toFixed(8) : price.toFixed(2);
    codeLines.push(`  '${symbol}': ${formattedPrice},`);
  });
  
  codeLines.push('};');
  
  return codeLines.join('\n');
}

/**
 * Genera reporte en Markdown
 */
function generateMarkdownReport(analysis, realPrices) {
  const report = [
    '# 📊 Reporte de Precios Binance vs Simulador',
    '',
    `**Fecha:** ${new Date().toLocaleString()}`,
    `**Símbolos analizados:** ${analysis.totalSymbols}`,
    `**Precios desactualizados:** ${analysis.statistics.outdatedCount}`,
    '',
    '## 📈 Estadísticas Generales',
    '',
    `- **Diferencia promedio:** ${analysis.statistics.avgDifference}%`,
    `- **Diferencia máxima:** ${analysis.statistics.maxDifference}%`,
    `- **Diferencia mínima:** ${analysis.statistics.minDifference}%`,
    '',
    '## 🔍 Comparación Detallada',
    '',
    '| Símbolo | Precio Real | Precio Simulador | Diferencia | Cambio 24h | Estado |',
    '|---------|-------------|------------------|------------|------------|--------|'
  ];
  
  analysis.comparisons
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .forEach(comp => {
      const status = comp.isOutdated ? '🔴 Desactualizado' : '✅ OK';
      const realPrice = comp.realPrice < 1 ? comp.realPrice.toFixed(6) : comp.realPrice.toFixed(2);
      const simPrice = comp.simulatorPrice < 1 ? comp.simulatorPrice.toFixed(6) : comp.simulatorPrice.toFixed(2);
      
      report.push(`| ${comp.symbol} | $${realPrice} | $${simPrice} | ${comp.percentageDiff} | ${comp.change24h.toFixed(2)}% | ${status} |`);
    });
  
  report.push('');
  report.push('## 🔧 Código Actualizado para Simulador');
  report.push('');
  report.push('```javascript');
  report.push(generateUpdatedSimulatorCode(analysis.suggestions));
  report.push('```');
  
  report.push('');
  report.push('## 💡 Recomendaciones');
  report.push('');
  
  const outdated = analysis.comparisons.filter(c => c.isOutdated);
  if (outdated.length > 0) {
    report.push(`**⚠️ ${outdated.length} precios necesitan actualización urgente:**`);
    outdated.forEach(comp => {
      report.push(`- **${comp.symbol}**: ${comp.percentageDiff} de diferencia`);
    });
  } else {
    report.push('✅ Todos los precios están relativamente actualizados (diferencia < 20%)');
  }
  
  report.push('');
  report.push('---');
  report.push('*Reporte generado automáticamente*');
  
  return report.join('\n');
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando generación de reporte de precios...\n');
  
  // Intentar obtener datos de API local primero
  let realPrices = await fetchLocalTickers();
  
  // Si falla local, intentar API directa
  if (!realPrices || Object.keys(realPrices).length === 0) {
    console.log('⚠️ API local no disponible, intentando API directa...\n');
    realPrices = await fetchDirectBinance();
  }
  
  if (!realPrices || Object.keys(realPrices).length === 0) {
    console.error('❌ No se pudieron obtener datos de precios');
    process.exit(1);
  }
  
  // Generar análisis
  console.log('📊 Generando análisis comparativo...');
  const analysis = generateAnalysis(realPrices);
  
  // Guardar datos raw
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    realPrices,
    analysis,
    generatedAt: new Date().toISOString()
  }, null, 2));
  
  // Generar reporte en Markdown
  const markdownReport = generateMarkdownReport(analysis, realPrices);
  fs.writeFileSync(REPORT_FILE, markdownReport);
  
  // Mostrar resumen en consola
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL REPORTE');
  console.log('='.repeat(60));
  console.log(`✅ Símbolos analizados: ${analysis.totalSymbols}`);
  console.log(`🔴 Precios desactualizados: ${analysis.statistics.outdatedCount}`);
  console.log(`📈 Diferencia promedio: ${analysis.statistics.avgDifference}%`);
  console.log(`📄 Archivos generados:`);
  console.log(`   - ${OUTPUT_FILE} (datos raw)`);
  console.log(`   - ${REPORT_FILE} (reporte detallado)`);
  console.log('='.repeat(60));
  
  if (analysis.statistics.outdatedCount > 0) {
    console.log('\n⚠️ ACCIÓN REQUERIDA:');
    console.log('Algunos precios necesitan actualización. Ver reporte detallado.');
  } else {
    console.log('\n✅ Todos los precios están actualizados!');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 