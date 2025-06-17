#!/usr/bin/env node

/**
 * Scheduler automático para generar reportes de precios
 * Ejecuta el reporte cada X minutos y mantiene archivos históricos
 */

const fs = require('fs');
const path = require('path');
const { main: generateReport } = require('./generate-binance-price-report.js');

// Configuración
const REPORT_INTERVAL_MINUTES = 30; // Cada 30 minutos
const MAX_HISTORICAL_REPORTS = 48; // Mantener 48 reportes (24 horas)
const REPORTS_DIR = 'price-reports';
const SCHEDULER_LOG = 'scheduler.log';

let isRunning = false;
let intervalId = null;
let reportCount = 0;

/**
 * Escribe log con timestamp
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Escribir al archivo de log
  try {
    fs.appendFileSync(SCHEDULER_LOG, logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error.message);
  }
}

/**
 * Crea el directorio de reportes si no existe
 */
function ensureReportsDirectory() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR);
    log(`Created reports directory: ${REPORTS_DIR}`);
  }
}

/**
 * Limpia reportes antiguos
 */
function cleanOldReports() {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(file => file.startsWith('binance-price-report-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(REPORTS_DIR, file),
        time: fs.statSync(path.join(REPORTS_DIR, file)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Más recientes primero
    
    // Eliminar reportes excedentes
    if (files.length > MAX_HISTORICAL_REPORTS) {
      const filesToDelete = files.slice(MAX_HISTORICAL_REPORTS);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        log(`Deleted old report: ${file.name}`);
      });
    }
    
  } catch (error) {
    log(`Error cleaning old reports: ${error.message}`);
  }
}

/**
 * Mueve y renombra los archivos de reporte generados
 */
function archiveCurrentReport() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Mover archivo JSON
    if (fs.existsSync('binance-price-report.json')) {
      const newJsonPath = path.join(REPORTS_DIR, `binance-price-report-${timestamp}.json`);
      fs.renameSync('binance-price-report.json', newJsonPath);
      log(`Archived JSON report: ${newJsonPath}`);
    }
    
    // Mover archivo Markdown
    if (fs.existsSync('REPORTE_PRECIOS_BINANCE.md')) {
      const newMdPath = path.join(REPORTS_DIR, `REPORTE_PRECIOS_BINANCE-${timestamp}.md`);
      fs.renameSync('REPORTE_PRECIOS_BINANCE.md', newMdPath);
      log(`Archived MD report: ${newMdPath}`);
    }
    
  } catch (error) {
    log(`Error archiving reports: ${error.message}`);
  }
}

/**
 * Ejecuta el generador de reportes
 */
async function runReportGeneration() {
  try {
    log('Starting price report generation...');
    
    // Ejecutar el generador de reportes
    await generateReport();
    
    reportCount++;
    log(`Price report generation completed successfully (run #${reportCount})`);
    
    // Archivar los reportes generados
    archiveCurrentReport();
    
    // Limpiar reportes antiguos
    cleanOldReports();
    
  } catch (error) {
    log(`Error generating price report: ${error.message}`);
  }
}

/**
 * Inicia el scheduler
 */
function startScheduler() {
  if (isRunning) {
    log('Scheduler is already running');
    return;
  }
  
  log(`Starting automatic price report scheduler (every ${REPORT_INTERVAL_MINUTES} minutes)`);
  
  // Crear directorio si no existe
  ensureReportsDirectory();
  
  // Ejecutar inmediatamente
  runReportGeneration();
  
  // Configurar ejecución periódica
  intervalId = setInterval(runReportGeneration, REPORT_INTERVAL_MINUTES * 60 * 1000);
  isRunning = true;
  
  log('Scheduler started successfully');
}

/**
 * Detiene el scheduler
 */
function stopScheduler() {
  if (!isRunning) {
    log('Scheduler is not running');
    return;
  }
  
  log('Stopping scheduler...');
  
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  isRunning = false;
  log('Scheduler stopped');
}

/**
 * Obtiene estadísticas del scheduler
 */
function getStats() {
  const stats = {
    isRunning,
    reportCount,
    intervalMinutes: REPORT_INTERVAL_MINUTES,
    maxHistoricalReports: MAX_HISTORICAL_REPORTS,
    reportsDirectory: REPORTS_DIR,
    nextRun: null
  };
  
  if (isRunning && intervalId) {
    // Aproximar próxima ejecución
    const nextRunTime = new Date(Date.now() + (REPORT_INTERVAL_MINUTES * 60 * 1000));
    stats.nextRun = nextRunTime.toISOString();
  }
  
  return stats;
}

/**
 * Maneja señales del sistema para cierre limpio
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    log(`Received ${signal}, shutting down gracefully...`);
    stopScheduler();
    process.exit(0);
  };
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'start':
      startScheduler();
      setupGracefulShutdown();
      // Mantener el proceso vivo
      process.stdin.resume();
      break;
      
    case 'stop':
      stopScheduler();
      break;
      
    case 'status':
      const stats = getStats();
      console.log('📊 Scheduler Status:');
      console.log(JSON.stringify(stats, null, 2));
      break;
      
    case 'run-once':
      await runReportGeneration();
      break;
      
    case 'clean':
      ensureReportsDirectory();
      cleanOldReports();
      log('Cleaned old reports');
      break;
      
    default:
      console.log('🤖 Auto Price Report Scheduler');
      console.log('');
      console.log('Usage:');
      console.log('  node auto-price-report-scheduler.js start    # Start scheduler');
      console.log('  node auto-price-report-scheduler.js stop     # Stop scheduler');
      console.log('  node auto-price-report-scheduler.js status   # Show status');
      console.log('  node auto-price-report-scheduler.js run-once # Generate report once');
      console.log('  node auto-price-report-scheduler.js clean    # Clean old reports');
      console.log('');
      console.log(`Current configuration:`);
      console.log(`  - Interval: ${REPORT_INTERVAL_MINUTES} minutes`);
      console.log(`  - Max historical reports: ${MAX_HISTORICAL_REPORTS}`);
      console.log(`  - Reports directory: ${REPORTS_DIR}`);
      break;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  startScheduler,
  stopScheduler,
  getStats,
  runReportGeneration
}; 