import { BitstampOHLC } from './bitstampService';

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
   * Analiza el mercado y retorna recomendaciones completas
   */
  public analyzeMarket(
    currentPairData: BitstampOHLC[],
    allPairsData: Record<string, BitstampOHLC[]>
  ): MarketAnalysis {
    return {
      bestEntryPoint: this.calculateBestEntry(currentPairData),
      marketCondition: this.analyzeMarketCondition(currentPairData),
      bestCrypto: this.analyzeBestCryptos(allPairsData)
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
}

// Instancia singleton del servicio
export const marketAnalysisService = new MarketAnalysisService(); 