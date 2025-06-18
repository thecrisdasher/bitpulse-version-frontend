# Sistema de Prioridad de Datos Reales - BitPulse

## 🎯 Objetivo

Garantizar que **todas las operaciones de trading usen exclusivamente datos reales** y que las criptomonedas **siempre prioricen datos de Binance** sobre cualquier simulación.

## 🔥 Principios Fundamentales

### 1. **Separación Clara de Datos**
- **Criptomonedas**: EXCLUSIVAMENTE datos de Binance
- **Otros mercados**: Simulación claramente identificada
- **Trading**: SIEMPRE precios reales al momento de la operación

### 2. **Flags de Identificación**
Todos los datos incluyen:
- `isRealData: boolean` - Indica si son datos reales o simulados
- `dataSource: 'binance' | 'simulated'` - Fuente exacta de los datos
- `timestamp` - Momento exacto de obtención del dato

### 3. **Validación en Tiempo de Trading**
- API específica para obtener precios de trading: `/api/trading/real-time-price`
- Modo `requireReal=true` que falla si no hay datos reales
- Backend obtiene precios frescos al momento de crear posiciones

## 🏗️ Arquitectura del Sistema

### Componentes Principales

#### 1. **Hook `useTradingData`** (`hooks/useTradingData.ts`)
```typescript
// PRIORIDAD 1: Datos reales de Binance para criptos
if (binanceSymbol && binanceTickers[binanceSymbol]) {
  return {
    price: binanceData.price,
    isRealData: true, // ✅ DATOS REALES
    dataSource: 'binance'
  };
}

// PRIORIDAD 2: Datos simulados para otros instrumentos
return {
  price: simulatedData.price,
  isRealData: false, // ⚠️ DATOS SIMULADOS
  dataSource: 'simulated'
};
```

#### 2. **API de Trading** (`app/api/trading/real-time-price/route.ts`)
- **Endpoint**: `GET /api/trading/real-time-price`
- **Parámetros**: 
  - `instrument`: Nombre del instrumento
  - `requireReal=true`: Solo acepta datos reales
- **Respuesta**: Incluye `isRealData` y `source`

#### 3. **API de Posiciones** (`app/api/trading/positions/route.ts`)
```typescript
// OBTENER PRECIO REAL EN TIEMPO REAL para la operación
const realTimePrice = await getRealTimePrice(body.instrumentName);
if (!realTimePrice.success) {
  return NextResponse.json({
    success: false,
    message: `No se pudo obtener precio en tiempo real`
  });
}

// USAR PRECIO REAL en la posición
positionData = {
  ...body,
  openPrice: realTimePrice.data!.price // ✅ PRECIO REAL
};
```

#### 4. **MarketsNavigation** (`components/MarketsNavigation.tsx`)
```typescript
// ✅ PRIORIDAD ABSOLUTA: Solo datos de Binance para criptomonedas
if (inst.category === 'criptomonedas') {
  const ticker = binanceTickers[base];
  
  // Si no hay datos de Binance, mostrar advertencia
  if (!ticker) {
    return {
      ...inst,
      warning: '⚠️ Esperando datos reales de Binance...'
    };
  }
  
  return {
    ...inst,
    price: ticker.price, // ✅ SIEMPRE datos reales
    isRealData: true,
    dataSource: 'binance'
  };
}
```

## 🔄 Flujo de Datos

### Para Criptomonedas:
1. **Binance API** → `useBinanceTickers` (cada 3s)
2. **Frontend** → Muestra precios reales únicamente
3. **Trading** → API obtiene precio fresco de Binance
4. **Posición** → Se crea con precio real verificado

### Para Otros Mercados:
1. **Simulador** → `lib/simulator.ts` (movimiento realista)
2. **Frontend** → Muestra claramente "SIMULADO"
3. **Trading** → Usa precio simulado pero marcado como tal
4. **Posición** → Se crea con advertencia de datos simulados

## 🛡️ Validaciones y Seguridad

### 1. **Validación de Instrumentos Crypto**
```typescript
const CRYPTO_MAPPING = {
  'Bitcoin (BTC/USD)': 'BTCUSDT',
  'Ethereum (ETH/USD)': 'ETHUSDT',
  // ... otros mappings
};

// Solo estos instrumentos usan datos de Binance
```

### 2. **Validación en API de Trading**
```typescript
// Si no hay precio real disponible, fallar la operación
if (!realTimePrice.success) {
  return NextResponse.json({
    success: false,
    message: `No se pudo obtener precio en tiempo real`,
    isRealData: false
  }, { status: 400 });
}
```

### 3. **Fallback Controlado**
- **Criptomonedas**: Sin Binance = Sin trading
- **Otros**: Simulación claramente marcada
- **UI**: Indicadores visuales de tipo de dato

## 📊 Sistema de Monitoreo

### Indicadores Visuales en UI:
- ✅ **Verde**: Datos reales de Binance
- ⚡ **Amarillo**: Datos simulados
- ⚠️ **Rojo**: Sin datos disponibles
- 🔄 **Azul**: Cargando datos reales

### Logs del Sistema:
```typescript
console.log(`✅ REAL: ${instrument} - $${price} (binance)`);
console.log(`⚡ SIMULADO: ${instrument} - $${price} (simulator)`);
console.log(`❌ ERROR: No real data for ${instrument}`);
```

## 🧪 Pruebas de Validación

### Comando de Prueba:
```bash
npm run test:priority
```

### Pruebas Incluidas:
1. **API de Precio Real**: Verifica `/api/trading/real-time-price`
2. **Modo Require Real**: Testa `requireReal=true`
3. **Comparación Binance**: Compara con API directa de Binance
4. **Instrumentos No-Crypto**: Verifica simulación marcada
5. **Pricing para Trading**: Simula creación de posición

### Resultados Esperados:
```
✅ Bitcoin (BTC/USD): $43,250.00 (binance)
✅ Ethereum (ETH/USD): $2,640.00 (binance)
⚡ EUR/USD: $1.0850 (simulated)
⚡ Gold: $2,040.50 (simulated)
```

## 🚀 Comandos de Desarrollo

```bash
# Probar integración con Binance
npm run test:binance

# Probar movimiento de mercados simulados
npm run test:markets

# Probar prioridad de datos reales
npm run test:priority

# Ejecutar todas las pruebas
npm run test:markets:all
```

## 📈 Beneficios del Sistema

### 1. **Transparencia Total**
- Usuario sabe exactamente qué datos está viendo
- No hay confusión entre real y simulado
- Trading usa precios verificados

### 2. **Seguridad en Trading**
- Imposible usar datos obsoletos para trading
- Validación en múltiples niveles
- Fallback controlado y visible

### 3. **Escalabilidad**
- Fácil agregar nuevas fuentes de datos reales
- Sistema modular y extensible
- Separación clara de responsabilidades

### 4. **Mantenimiento**
- Pruebas automatizadas para verificar funcionamiento
- Logs claros para debugging
- Documentación completa

## ⚠️ Consideraciones Importantes

### 1. **Latencia de Datos**
- Binance: ~1-3 segundos de actualización
- Simulados: Tiempo real continuo
- Trading: Precio fresco al momento exacto

### 2. **Disponibilidad**
- Sin Binance = No trading de criptos
- Fallback a simulación para otros mercados
- Monitoreo de conectividad requerido

### 3. **Costos**
- Binance API: Gratuita con límites
- Simulación: Sin costo
- Recomendado: Plan Pro de Binance para producción

## 🔧 Configuración de Producción

### Variables de Entorno:
```env
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
BINANCE_API_KEY=tu_api_key (opcional)
BINANCE_SECRET=tu_secret (opcional)
```

### Optimizaciones:
- Cache de precios por 1-3 segundos
- Rate limiting para APIs externas
- Monitoring de uptime de Binance
- Alertas por fallos de conectividad

## 📚 Archivos Relacionados

### APIs:
- `app/api/trading/real-time-price/route.ts`
- `app/api/trading/positions/route.ts`
- `app/api/binance/tickers/route.ts`

### Hooks:
- `hooks/useTradingData.ts`
- `hooks/useBinanceTickers.ts`
- `hooks/useRealTimeMarketData.ts`

### Componentes:
- `components/MarketsNavigation.tsx`
- `contexts/TradePositionsContext.tsx`

### Scripts:
- `scripts/test-real-time-priority.js`
- `scripts/test-binance-integration.js`

### Documentación:
- `SISTEMA_MERCADOS_TIEMPO_REAL.md`
- `README.md`

---

**🎯 RESULTADO**: Sistema que garantiza uso de datos reales para trading, con separación clara entre datos de Binance (reales) y simulación (claramente marcada), eliminando cualquier riesgo de usar precios incorrectos en operaciones financieras. 