import { BitstampOHLC } from './bitstampService';

export interface FibonacciLevels {
  retracementLevels: {
    level0: number;   // 0%
    level236: number; // 23.6%
    level382: number; // 38.2%
    level500: number; // 50%
    level618: number; // 61.8%
    level786: number; // 78.6%
    level1000: number; // 100%
  };
  extensionLevels: {
    level0: number;    // 0%
    level618: number;  // 61.8%
    level1000: number; // 100%
    level1618: number; // 161.8%
    level2618: number; // 261.8%
    level4236: number; // 423.6%
  };
}

export interface PivotPoints {
  r3: number; // Resistencia 3
  r2: number; // Resistencia 2
  r1: number; // Resistencia 1
  pp: number; // Punto Pivote
  s1: number; // Soporte 1
  s2: number; // Soporte 2
  s3: number; // Soporte 3
}

export interface RSIValues {
  rsi: number;
  isOverbought: boolean;
  isOversold: boolean;
}

export class TradingAnalysisService {
  /**
   * Calcula los niveles de Fibonacci para retracción y extensión
   */
  calculateFibonacciLevels(high: number, low: number): FibonacciLevels {
    const diff = high - low;

    return {
      retracementLevels: {
        level0: high,
        level236: high - (diff * 0.236),
        level382: high - (diff * 0.382),
        level500: high - (diff * 0.5),
        level618: high - (diff * 0.618),
        level786: high - (diff * 0.786),
        level1000: low
      },
      extensionLevels: {
        level0: low,
        level618: low + (diff * 0.618),
        level1000: high,
        level1618: low + (diff * 1.618),
        level2618: low + (diff * 2.618),
        level4236: low + (diff * 4.236)
      }
    };
  }

  /**
   * Calcula los puntos pivote usando el método estándar
   */
  calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
    const pp = (high + low + close) / 3;
    const r1 = (2 * pp) - low;
    const s1 = (2 * pp) - high;
    const r2 = pp + (high - low);
    const s2 = pp - (high - low);
    const r3 = high + 2 * (pp - low);
    const s3 = low - 2 * (high - pp);

    return { r3, r2, r1, pp, s1, s2, s3 };
  }

  /**
   * Calcula el RSI (Relative Strength Index)
   */
  calculateRSI(prices: number[], period: number = 14): RSIValues {
    if (prices.length < period + 1) {
      throw new Error('Se necesitan más datos para calcular el RSI');
    }

    let gains = 0;
    let losses = 0;

    // Calcular ganancias y pérdidas iniciales
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    // Calcular promedios iniciales
    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calcular para el resto de los precios
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
    const rsi = 100 - (100 / (1 + rs));

    return {
      rsi,
      isOverbought: rsi > 70,
      isOversold: rsi < 30
    };
  }

  /**
   * Calcula las Bandas de Bollinger
   */
  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    if (prices.length < period) {
      throw new Error('Se necesitan más datos para calcular las Bandas de Bollinger');
    }

    // Calcular SMA
    const sma = prices.slice(-period).reduce((a, b) => a + b) / period;

    // Calcular desviación estándar
    const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  /**
   * Calcula el MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    if (prices.length < slowPeriod + signalPeriod) {
      throw new Error('Se necesitan más datos para calcular el MACD');
    }

    // Calcular EMAs
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // Calcular línea MACD
    const macdLine = fastEMA - slowEMA;

    // Calcular línea de señal
    const signalLine = this.calculateEMA([macdLine], signalPeriod);

    // Calcular histograma
    const histogram = macdLine - signalLine;

    return {
      macdLine,
      signalLine,
      histogram
    };
  }

  /**
   * Calcula el EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Identifica patrones de velas japonesas
   */
  identifyCandlePattern(candles: BitstampOHLC[]): string[] {
    if (candles.length < 3) {
      throw new Error('Se necesitan al menos 3 velas para identificar patrones');
    }

    const patterns: string[] = [];
    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    const beforePrevious = candles[candles.length - 3];

    // Doji
    if (Math.abs(current.open - current.close) <= (current.high - current.low) * 0.1) {
      patterns.push('Doji');
    }

    // Martillo
    if (current.close > current.open &&
        (current.high - current.low) >= 3 * (current.close - current.open) &&
        (current.close - current.low) >= 2 * (current.high - current.close)) {
      patterns.push('Martillo Alcista');
    }

    // Estrella de la Mañana
    if (beforePrevious.close < beforePrevious.open && // Vela bajista
        Math.abs(previous.open - previous.close) <= (previous.high - previous.low) * 0.1 && // Doji
        current.close > current.open) { // Vela alcista
      patterns.push('Estrella de la Mañana');
    }

    return patterns;
  }

  /**
   * Calcula zonas de soporte y resistencia
   */
  calculateSupportResistance(candles: BitstampOHLC[], periods: number = 20): {
    supports: number[];
    resistances: number[];
  } {
    const prices = candles.map(candle => ({
      high: candle.high,
      low: candle.low,
      volume: candle.volume
    }));

    const supports: number[] = [];
    const resistances: number[] = [];

    // Identificar zonas con alto volumen
    const significantLevels = new Map<number, number>();

    prices.forEach(price => {
      const roundedLow = Math.round(price.low / 10) * 10;
      const roundedHigh = Math.round(price.high / 10) * 10;

      significantLevels.set(roundedLow, (significantLevels.get(roundedLow) || 0) + price.volume);
      significantLevels.set(roundedHigh, (significantLevels.get(roundedHigh) || 0) + price.volume);
    });

    // Ordenar niveles por volumen
    const sortedLevels = Array.from(significantLevels.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Clasificar como soporte o resistencia
    const currentPrice = candles[candles.length - 1].close;

    sortedLevels.forEach(level => {
      if (level < currentPrice) {
        supports.push(level);
      } else {
        resistances.push(level);
      }
    });

    return {
      supports: supports.sort((a, b) => b - a),
      resistances: resistances.sort((a, b) => a - b)
    };
  }
}

// Instancia singleton del servicio
export const tradingAnalysisService = new TradingAnalysisService(); 