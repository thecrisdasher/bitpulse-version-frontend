// Simple technical indicator utilities (no external deps)
export interface Candle {
  close: number;
  high: number;
  low: number;
}

export const ema = (values: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaArr: number[] = [];
  values.forEach((v, i) => {
    if (i === 0) {
      emaArr.push(v);
    } else {
      emaArr.push(v * k + emaArr[i - 1] * (1 - k));
    }
  });
  return emaArr;
};

export const rsi = (values: number[], period: number = 14): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  const avgGain: number[] = [];
  const avgLoss: number[] = [];
  for (let i = 0; i < gains.length; i++) {
    if (i < period) {
      avgGain.push(NaN);
      avgLoss.push(NaN);
      continue;
    }
    if (i === period) {
      const sumG = gains.slice(0, period).reduce((a, b) => a + b, 0);
      const sumL = losses.slice(0, period).reduce((a, b) => a + b, 0);
      avgGain.push(sumG / period);
      avgLoss.push(sumL / period);
    } else {
      avgGain.push((avgGain[i - 1] * (period - 1) + gains[i]) / period);
      avgLoss.push((avgLoss[i - 1] * (period - 1) + losses[i]) / period);
    }
  }
  const rsArr = avgGain.map((g, i) => g / (avgLoss[i] || 1));
  return rsArr.map(rs => 100 - 100 / (1 + rs));
};

export const macd = (values: number[], fast = 12, slow = 26, signal = 9): { macd: number[]; signal: number[] } => {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine, signal);
  return { macd: macdLine, signal: signalLine };
};

export const atr = (candles: Candle[], period: number = 14): number[] => {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
    } else {
      const highLow = candles[i].high - candles[i].low;
      const highClose = Math.abs(candles[i].high - candles[i - 1].close);
      const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
      trs.push(Math.max(highLow, highClose, lowClose));
    }
  }
  const atrArr: number[] = [];
  trs.forEach((tr, i) => {
    if (i < period) {
      atrArr.push(NaN);
    } else if (i === period) {
      const sum = trs.slice(0, period + 1).reduce((a, b) => a + b, 0);
      atrArr.push(sum / period);
    } else {
      atrArr.push((atrArr[i - 1] * (period - 1) + tr) / period);
    }
  });
  return atrArr;
}; 