import { BitstampOHLC } from './bitstampService';

export interface MarketAdvice {
  type: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  reasoning: string[];
  riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  entryStrategy: string;
  exitStrategy: string;
}

export interface VolatilityAnalysis {
  current: number;
  average30d: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  percentile: number;
  interpretation: string;
  tradingImplications: string[];
}

export interface TrendAnalysis {
  primary: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  secondary: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number;
  duration: number;
  momentum: number;
  supports: number[];
  resistances: number[];
  keyLevels: {
    strongSupport: number;
    strongResistance: number;
    breakoutLevel: number;
  };
}

export interface MarketAnalysis {
  bestEntryPoint: {
    price: number;
    confidence: number;
    timeframe: string;
    stopLoss: number;
    takeProfit: number;
    reason: string[];
  };
  marketCondition: {
    trend: 'ALCISTA' | 'BAJISTA' | 'LATERAL';
    strength: number;
    volatility: number;
    risk: number;
  };
  bestCrypto: {
    symbol: string;
    score: number;
    reason: string[];
  }[];
  marketAdvice: MarketAdvice;
  volatilityAnalysis: VolatilityAnalysis;
  trendAnalysis: TrendAnalysis;
  keyInsights: string[];
  riskWarnings: string[];
  opportunityAlerts: string[];
}

class MarketAnalysisService {
  /**
   * Calcula el mejor punto de entrada basado en múltiples indicadores
   */
  private calculateBestEntry(data: BitstampOHLC[]): MarketAnalysis['bestEntryPoint'] {
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const lastPrice = prices[prices.length - 1];
    
    // Calcular medias móviles
    const ema9 = this.calculateEMA(prices, 9);
    const ema21 = this.calculateEMA(prices, 21);
    const ema50 = this.calculateEMA(prices, 50);
    
    // Calcular RSI
    const rsi = this.calculateRSI(prices);
    
    // Calcular Bandas de Bollinger
    const { upper, lower } = this.calculateBollingerBands(prices);
    
    // Calcular ATR para el stop loss
    const atr = this.calculateATR(data);
    
    // Análisis de volumen
    const volumeProfile = this.analyzeVolumeProfile(volumes);
    
    // Determinar la fuerza de la señal
    let confidence = 0;
    const reasons: string[] = [];
    
    // Análisis de tendencia con EMAs
    if (ema9 > ema21 && ema21 > ema50) {
      confidence += 30;
      reasons.push('Tendencia alcista confirmada por EMAs');
    } else if (ema9 < ema21 && ema21 < ema50) {
      confidence += 30;
      reasons.push('Tendencia bajista confirmada por EMAs');
    }
    
    // Análisis de sobrecompra/sobreventa
    if (rsi < 30) {
      confidence += 20;
      reasons.push('RSI indica condición de sobreventa');
    } else if (rsi > 70) {
      confidence += 20;
      reasons.push('RSI indica condición de sobrecompra');
    }
    
    // Análisis de Bollinger
    if (lastPrice <= lower) {
      confidence += 25;
      reasons.push('Precio en banda inferior de Bollinger');
    } else if (lastPrice >= upper) {
      confidence += 25;
      reasons.push('Precio en banda superior de Bollinger');
    }
    
    // Análisis de volumen
    if (volumeProfile > 1.5) {
      confidence += 25;
      reasons.push('Alto volumen confirma el movimiento');
    }
    
    // Calcular stop loss y take profit
    const stopLoss = lastPrice - (atr * 2);
    const takeProfit = lastPrice + (atr * 3); // Ratio riesgo/beneficio 1:1.5
    
    // Determinar timeframe recomendado basado en volatilidad
    const volatility = this.calculateVolatility(prices);
    const timeframe = volatility > 0.02 ? '15m' : volatility > 0.01 ? '1h' : '4h';

    return {
      price: lastPrice,
      confidence: Math.min(confidence, 100),
      timeframe,
      stopLoss,
      takeProfit,
      reason: reasons
    };
  }

  /**
   * Analiza las condiciones actuales del mercado
   */
  private analyzeMarketCondition(data: BitstampOHLC[]): MarketAnalysis['marketCondition'] {
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    // Calcular tendencia usando EMAs
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const ema200 = this.calculateEMA(prices, 200);
    
    // Determinar tendencia
    let trend: MarketAnalysis['marketCondition']['trend'];
    if (ema20 > ema50 && ema50 > ema200) {
      trend = 'ALCISTA';
    } else if (ema20 < ema50 && ema50 < ema200) {
      trend = 'BAJISTA';
    } else {
      trend = 'LATERAL';
    }
    
    // Calcular fuerza de la tendencia
    const trendStrength = this.calculateTrendStrength(prices, ema20, ema50, ema200);
    
    // Calcular volatilidad
    const volatility = this.calculateVolatility(prices) * 100;
    
    // Calcular riesgo de mercado
    const risk = this.calculateMarketRisk(data);

    return {
      trend,
      strength: trendStrength,
      volatility,
      risk
    };
  }

  /**
   * Identifica las mejores criptomonedas para trading
   */
  private analyzeBestCryptos(
    dataMap: Record<string, BitstampOHLC[]>
  ): MarketAnalysis['bestCrypto'] {
    const analysis: MarketAnalysis['bestCrypto'] = [];

    for (const [symbol, data] of Object.entries(dataMap)) {
      const prices = data.map(d => d.close);
      const volumes = data.map(d => d.volume);
      
      // Calcular métricas clave
      const volatility = this.calculateVolatility(prices);
      const volumeProfile = this.analyzeVolumeProfile(volumes);
      const trendStrength = this.calculateTrendStrength(
        prices,
        this.calculateEMA(prices, 20),
        this.calculateEMA(prices, 50),
        this.calculateEMA(prices, 200)
      );
      
      // Calcular momentum
      const rsi = this.calculateRSI(prices);
      const { histogram } = this.calculateMACD(prices);
      
      // Calcular score
      let score = 0;
      const reasons: string[] = [];
      
      // Evaluar volatilidad (preferimos volatilidad moderada)
      if (volatility > 0.01 && volatility < 0.03) {
        score += 25;
        reasons.push('Volatilidad óptima para trading');
      }
      
      // Evaluar volumen
      if (volumeProfile > 1.2) {
        score += 20;
        reasons.push('Alto volumen de trading');
      }
      
      // Evaluar fuerza de tendencia
      if (trendStrength > 70) {
        score += 25;
        reasons.push('Tendencia fuerte');
      }
      
      // Evaluar momentum
      if ((rsi > 50 && histogram > 0) || (rsi < 50 && histogram < 0)) {
        score += 30;
        reasons.push('Momentum favorable');
      }

      analysis.push({
        symbol,
        score,
        reason: reasons
      });
    }

    // Ordenar por score descendente
    return analysis.sort((a, b) => b.score - a.score);
  }

  /**
   * Genera consejos específicos de mercado
   */
  private generateMarketAdvice(data: BitstampOHLC[]): MarketAdvice {
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const lastPrice = prices[prices.length - 1];
    
    // Calcular indicadores
    const rsi = this.calculateRSI(prices);
    const { upper, lower, middle } = this.calculateBollingerBands(prices);
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const volatility = this.calculateVolatility(prices);
    const volumeProfile = this.analyzeVolumeProfile(volumes);
    const macd = this.calculateMACD(prices);
    
    // Determinar acción recomendada
    let type: MarketAdvice['type'] = 'HOLD';
    let urgency: MarketAdvice['urgency'] = 'LOW';
    let confidence = 50;
    const reasoning: string[] = [];
    let riskLevel: MarketAdvice['riskLevel'] = 'MODERATE';
    let timeHorizon: MarketAdvice['timeHorizon'] = 'MEDIUM';
    
    // Análisis de señales de compra
    if (rsi < 30 && lastPrice <= lower && ema20 > ema50 && volumeProfile > 1.3) {
      type = 'BUY';
      urgency = 'HIGH';
      confidence = 85;
      reasoning.push('RSI en zona de sobreventa con soporte de Bollinger');
      reasoning.push('Tendencia alcista confirmada por EMAs');
      reasoning.push('Volumen superior al promedio confirma la señal');
      riskLevel = 'MODERATE';
      timeHorizon = 'SHORT';
    }
    // Análisis de señales de venta
    else if (rsi > 70 && lastPrice >= upper && ema20 < ema50 && volumeProfile > 1.3) {
      type = 'SELL';
      urgency = 'HIGH';
      confidence = 80;
      reasoning.push('RSI en zona de sobrecompra con resistencia de Bollinger');
      reasoning.push('Tendencia bajista confirmada por EMAs');
      reasoning.push('Alto volumen confirma presión vendedora');
      riskLevel = 'CONSERVATIVE';
      timeHorizon = 'SHORT';
    }
    // Señales de espera
    else if (volatility > 0.05 || (rsi > 45 && rsi < 55)) {
      type = 'WAIT';
      urgency = 'MEDIUM';
      confidence = 60;
      reasoning.push('Mercado en zona neutral, esperar confirmación');
      if (volatility > 0.05) {
        reasoning.push('Alta volatilidad requiere precaución');
        urgency = 'HIGH';
      }
      riskLevel = 'CONSERVATIVE';
      timeHorizon = 'SHORT';
    }
    // Mantener posición
    else {
      type = 'HOLD';
      urgency = 'LOW';
      confidence = 70;
      reasoning.push('Condiciones estables, mantener estrategia actual');
      riskLevel = 'MODERATE';
      timeHorizon = 'MEDIUM';
    }
    
    // Estrategias específicas
    const entryStrategy = this.generateEntryStrategy(type, rsi, lastPrice, ema20, ema50);
    const exitStrategy = this.generateExitStrategy(type, lastPrice, upper, lower, volatility);
    
    return {
      type,
      urgency,
      confidence,
      reasoning,
      riskLevel,
      timeHorizon,
      entryStrategy,
      exitStrategy
    };
  }

  /**
   * Análisis detallado de volatilidad
   */
  private analyzeVolatility(data: BitstampOHLC[]): VolatilityAnalysis {
    const prices = data.map(d => d.close);
    const currentVolatility = this.calculateVolatility(prices.slice(-20));
    const average30d = this.calculateVolatility(prices);
    
    // Calcular tendencia de volatilidad
    const recent = this.calculateVolatility(prices.slice(-10));
    const previous = this.calculateVolatility(prices.slice(-30, -10));
    
    let trend: VolatilityAnalysis['trend'];
    if (recent > previous * 1.1) {
      trend = 'INCREASING';
    } else if (recent < previous * 0.9) {
      trend = 'DECREASING';
    } else {
      trend = 'STABLE';
    }
    
    // Calcular percentil
    const volatilities = [];
    for (let i = 20; i < prices.length; i++) {
      volatilities.push(this.calculateVolatility(prices.slice(i - 20, i)));
    }
    volatilities.sort((a, b) => a - b);
    const percentile = (volatilities.indexOf(currentVolatility) / volatilities.length) * 100;
    
    // Interpretación
    let interpretation = '';
    const tradingImplications: string[] = [];
    
    if (currentVolatility < 0.015) {
      interpretation = 'Volatilidad baja - Mercado estable';
      tradingImplications.push('Ideal para estrategias de largo plazo');
      tradingImplications.push('Menor riesgo, menores oportunidades de ganancia rápida');
    } else if (currentVolatility < 0.03) {
      interpretation = 'Volatilidad moderada - Condiciones normales';
      tradingImplications.push('Equilibrio entre riesgo y oportunidad');
      tradingImplications.push('Apropiado para la mayoría de estrategias');
    } else {
      interpretation = 'Volatilidad alta - Mercado inestable';
      tradingImplications.push('Alto potencial de ganancias y pérdidas');
      tradingImplications.push('Requiere gestión de riesgo estricta');
      tradingImplications.push('Ideal para trading intradía');
    }
    
    return {
      current: currentVolatility,
      average30d,
      trend,
      percentile,
      interpretation,
      tradingImplications
    };
  }

  /**
   * Análisis profundo de tendencia
   */
  private analyzeTrend(data: BitstampOHLC[]): TrendAnalysis {
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Tendencias primaria y secundaria
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const ema200 = this.calculateEMA(prices, 200);
    
    let primary: TrendAnalysis['primary'];
    let secondary: TrendAnalysis['secondary'];
    
    // Tendencia primaria (largo plazo)
    if (ema50 > ema200 * 1.02) {
      primary = 'BULLISH';
    } else if (ema50 < ema200 * 0.98) {
      primary = 'BEARISH';
    } else {
      primary = 'SIDEWAYS';
    }
    
    // Tendencia secundaria (corto plazo)
    if (ema20 > ema50 * 1.01) {
      secondary = 'BULLISH';
    } else if (ema20 < ema50 * 0.99) {
      secondary = 'BEARISH';
    } else {
      secondary = 'SIDEWAYS';
    }
    
    // Calcular fuerza de tendencia
    const strength = this.calculateTrendStrength(prices, ema20, ema50, ema200);
    
    // Calcular duración de tendencia
    const duration = this.calculateTrendDuration(prices, ema20, ema50);
    
    // Calcular momentum
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const momentum = (rsi + Math.abs(macd.histogram) * 100) / 2;
    
    // Encontrar soportes y resistencias
    const supports = this.findSupportLevels(data);
    const resistances = this.findResistanceLevels(data);
    
    // Niveles clave
    const strongSupport = Math.min(...supports.slice(0, 3));
    const strongResistance = Math.max(...resistances.slice(0, 3));
    const breakoutLevel = primary === 'BULLISH' ? strongResistance : strongSupport;
    
    return {
      primary,
      secondary,
      strength,
      duration,
      momentum,
      supports,
      resistances,
      keyLevels: {
        strongSupport,
        strongResistance,
        breakoutLevel
      }
    };
  }

  /**
   * Genera insights clave del mercado
   */
  private generateKeyInsights(data: BitstampOHLC[], advice: MarketAdvice, volatilityAnalysis: VolatilityAnalysis, trendAnalysis: TrendAnalysis): string[] {
    const insights: string[] = [];
    const lastPrice = data[data.length - 1].close;
    
    // Insight sobre correlación precio-volumen
    const volumeProfile = this.analyzeVolumeProfile(data.map(d => d.volume));
    if (volumeProfile > 1.5 && trendAnalysis.primary === 'BULLISH') {
      insights.push('🚀 Fuerte correlación precio-volumen sugiere continuación alcista');
    }
    
    // Insight sobre divergencias
    const rsi = this.calculateRSI(data.map(d => d.close));
    if (trendAnalysis.primary === 'BULLISH' && rsi < 40) {
      insights.push('⚠️ Divergencia bajista en RSI - Posible corrección próxima');
    }
    
    // Insight sobre volatilidad
    if (volatilityAnalysis.trend === 'DECREASING' && volatilityAnalysis.current < 0.02) {
      insights.push('📉 Compresión de volatilidad - Posible movimiento explosivo próximo');
    }
    
    // Insight sobre niveles clave
    const distanceToResistance = ((trendAnalysis.keyLevels.strongResistance - lastPrice) / lastPrice) * 100;
    if (Math.abs(distanceToResistance) < 3) {
      insights.push(`🎯 Precio cerca de resistencia clave en $${trendAnalysis.keyLevels.strongResistance.toFixed(2)}`);
    }
    
    // Insight sobre momentum
    if (trendAnalysis.momentum > 80 && advice.type === 'BUY') {
      insights.push('⚡ Momentum extremadamente fuerte - Entrada con potencial de ganancias rápidas');
    }
    
    return insights;
  }

  /**
   * Genera alertas de riesgo
   */
  private generateRiskWarnings(data: BitstampOHLC[], volatilityAnalysis: VolatilityAnalysis, trendAnalysis: TrendAnalysis): string[] {
    const warnings: string[] = [];
    
    // Advertencia por alta volatilidad
    if (volatilityAnalysis.current > 0.05) {
      warnings.push('🔴 ALTA VOLATILIDAD: Use stops ajustados y reduzca el tamaño de posición');
    }
    
    // Advertencia por soporte débil
    if (trendAnalysis.supports.length < 2) {
      warnings.push('⚠️ SOPORTE DÉBIL: Riesgo elevado de caída brusca');
    }
    
    // Advertencia por momentum extremo
    if (trendAnalysis.momentum > 90) {
      warnings.push('🚨 MOMENTUM EXTREMO: Posible agotamiento de tendencia - Tome ganancias');
    }
    
    // Advertencia por volumen bajo
    const volumeProfile = this.analyzeVolumeProfile(data.map(d => d.volume));
    if (volumeProfile < 0.5) {
      warnings.push('📊 VOLUMEN BAJO: Movimientos pueden ser falsos - Espere confirmación');
    }
    
    return warnings;
  }

  /**
   * Genera alertas de oportunidad
   */
  private generateOpportunityAlerts(data: BitstampOHLC[], advice: MarketAdvice, trendAnalysis: TrendAnalysis): string[] {
    const alerts: string[] = [];
    const lastPrice = data[data.length - 1].close;
    
    // Oportunidad de ruptura
    const distanceToBreakout = ((trendAnalysis.keyLevels.breakoutLevel - lastPrice) / lastPrice) * 100;
    if (Math.abs(distanceToBreakout) < 2) {
      alerts.push(`🚀 RUPTURA INMINENTE: Precio cerca del nivel de breakout $${trendAnalysis.keyLevels.breakoutLevel.toFixed(2)}`);
    }
    
    // Oportunidad de rebote
    const distanceToSupport = ((lastPrice - trendAnalysis.keyLevels.strongSupport) / lastPrice) * 100;
    if (distanceToSupport < 3 && advice.confidence > 70) {
      alerts.push('💎 OPORTUNIDAD DE REBOTE: Precio cerca de soporte fuerte con alta confianza');
    }
    
    // Oportunidad de tendencia
    if (trendAnalysis.primary === trendAnalysis.secondary && trendAnalysis.strength > 75) {
      alerts.push('📈 TENDENCIA ALINEADA: Todas las timeframes en la misma dirección');
    }
    
    return alerts;
  }

  /**
   * Analiza el mercado y retorna recomendaciones completas
   */
  public analyzeMarket(
    currentPairData: BitstampOHLC[],
    allPairsData: Record<string, BitstampOHLC[]>
  ): MarketAnalysis {
    const bestEntryPoint = this.calculateBestEntry(currentPairData);
    const marketCondition = this.analyzeMarketCondition(currentPairData);
    const bestCrypto = this.analyzeBestCryptos(allPairsData);
    
    // Nuevos análisis
    const marketAdvice = this.generateMarketAdvice(currentPairData);
    const volatilityAnalysis = this.analyzeVolatility(currentPairData);
    const trendAnalysis = this.analyzeTrend(currentPairData);
    
    // Generar insights y alertas
    const keyInsights = this.generateKeyInsights(currentPairData, marketAdvice, volatilityAnalysis, trendAnalysis);
    const riskWarnings = this.generateRiskWarnings(currentPairData, volatilityAnalysis, trendAnalysis);
    const opportunityAlerts = this.generateOpportunityAlerts(currentPairData, marketAdvice, trendAnalysis);

    return {
      bestEntryPoint,
      marketCondition,
      bestCrypto,
      marketAdvice,
      volatilityAnalysis,
      trendAnalysis,
      keyInsights,
      riskWarnings,
      opportunityAlerts
    };
  }

  /**
   * Métodos auxiliares para cálculos técnicos
   */
  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      
      if (difference >= 0) {
        avgGain = (avgGain * (period - 1) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - difference) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    
    const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * std),
      middle: sma,
      lower: sma - (stdDev * std)
    };
  }

  private calculateATR(data: BitstampOHLC[], period: number = 14): number {
    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private analyzeVolumeProfile(volumes: number[]): number {
    const recentVolumes = volumes.slice(-20);
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1];

    return currentVolume / avgVolume;
  }

  private calculateTrendStrength(
    prices: number[],
    ema20: number,
    ema50: number,
    ema200: number
  ): number {
    const lastPrice = prices[prices.length - 1];
    let strength = 0;
    
    // Evaluar alineación de EMAs
    if (ema20 > ema50 && ema50 > ema200) {
      strength += 40; // Tendencia alcista fuerte
    } else if (ema20 < ema50 && ema50 < ema200) {
      strength += 40; // Tendencia bajista fuerte
    }
    
    // Evaluar distancia entre EMAs
    const ema20Diff = Math.abs((ema20 - lastPrice) / lastPrice);
    const ema50Diff = Math.abs((ema50 - lastPrice) / lastPrice);
    
    if (ema20Diff < 0.02) strength += 30; // Precio cerca de EMA20
    if (ema50Diff < 0.05) strength += 30; // Precio cerca de EMA50
    
    return Math.min(strength, 100);
  }

  private calculateMACD(prices: number[]): {
    line: number;
    signal: number;
    histogram: number;
  } {
    const fastEMA = this.calculateEMA(prices, 12);
    const slowEMA = this.calculateEMA(prices, 26);
    const macdLine = fastEMA - slowEMA;
    const signalLine = this.calculateEMA([macdLine], 9);
    
    return {
      line: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private calculateMarketRisk(data: BitstampOHLC[]): number {
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    // Calcular componentes de riesgo
    const volatility = this.calculateVolatility(prices);
    const volumeProfile = this.analyzeVolumeProfile(volumes);
    const rsi = this.calculateRSI(prices);
    
    let risk = 0;
    
    // Evaluar volatilidad (mayor volatilidad = mayor riesgo)
    risk += volatility * 40;
    
    // Evaluar volumen (menor volumen = mayor riesgo)
    risk += (1 / volumeProfile) * 30;
    
    // Evaluar RSI (extremos indican mayor riesgo)
    if (rsi > 70 || rsi < 30) {
      risk += 30;
    }
    
    return Math.min(risk, 100);
  }

  // Nuevos métodos auxiliares
  private generateEntryStrategy(type: MarketAdvice['type'], rsi: number, price: number, ema20: number, ema50: number): string {
    switch (type) {
      case 'BUY':
        if (rsi < 30) {
          return 'Entrada escalonada: 40% ahora, 30% si baja 2%, 30% si baja 4%';
        } else {
          return 'Entrada en ruptura: Comprar al superar resistencia con volumen';
        }
      case 'SELL':
        return 'Venta gradual: 50% ahora, 50% en el siguiente rebote';
      case 'WAIT':
        return 'Esperar confirmación: Observar ruptura de niveles clave con volumen';
      default:
        return 'Mantener posición actual y monitorear señales de cambio';
    }
  }

  private generateExitStrategy(type: MarketAdvice['type'], price: number, upper: number, lower: number, volatility: number): string {
    const stopLossDistance = volatility > 0.03 ? '3%' : '2%';
    const takeProfitDistance = volatility > 0.03 ? '6%' : '4%';
    
    switch (type) {
      case 'BUY':
        return `Stop Loss: ${stopLossDistance} debajo del precio actual. Take Profit: ${takeProfitDistance} arriba o en resistencia`;
      case 'SELL':
        return `Stop Loss: ${stopLossDistance} arriba del precio actual. Take Profit: ${takeProfitDistance} abajo o en soporte`;
      default:
        return `Stop Loss dinámico: ${stopLossDistance} del precio promedio de entrada`;
    }
  }

  private calculateTrendDuration(prices: number[], ema20: number, ema50: number): number {
    // Simplificado: calcular cuántas velas la tendencia ha sido consistente
    let duration = 0;
    const isUptrend = ema20 > ema50;
    
    for (let i = prices.length - 1; i > 0; i--) {
      const currentEma20 = this.calculateEMA(prices.slice(0, i), 20);
      const currentEma50 = this.calculateEMA(prices.slice(0, i), 50);
      const currentIsUptrend = currentEma20 > currentEma50;
      
      if (currentIsUptrend === isUptrend) {
        duration++;
      } else {
        break;
      }
    }
    
    return duration;
  }

  private findSupportLevels(data: BitstampOHLC[]): number[] {
    const lows = data.map(d => d.low);
    const supports: number[] = [];
    
    // Encontrar mínimos locales
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        supports.push(lows[i]);
      }
    }
    
    // Ordenar por relevancia (precio más alto = soporte más fuerte en tendencia alcista)
    return supports.sort((a, b) => b - a).slice(0, 5);
  }

  private findResistanceLevels(data: BitstampOHLC[]): number[] {
    const highs = data.map(d => d.high);
    const resistances: number[] = [];
    
    // Encontrar máximos locales
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        resistances.push(highs[i]);
      }
    }
    
    // Ordenar por relevancia (precio más bajo = resistencia más fuerte en tendencia bajista)
    return resistances.sort((a, b) => a - b).slice(0, 5);
  }
}

// Instancia singleton del servicio
export const marketAnalysisService = new MarketAnalysisService(); 