import { useState, useEffect } from 'react';
import { ema, rsi, macd, atr, Candle } from '@/lib/indicators';

export interface Prediction {
  market: string;
  direction: 'up' | 'down';
  confidence: number; // 0-100
  timeframe: string;
  potentialGain: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface SmartAlert {
  id: string;
  type: 'breakout' | 'support' | 'volatility';
  market: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  action?: string;
}

interface AIMarketInsights {
  predictions: Prediction[];
  alerts: SmartAlert[];
  monitored: number;
  patterns: number;
  activeAlerts: number;
  precisionToday: number; // dummy static for now
}

const fetchKlines = async (symbol: string, interval: string = '1m', limit: number = 100) => {
  const url = `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Klines fetch failed');
  return (await res.json()) as any[];
};

export default function useAIMarketInsights(symbols: string[]): AIMarketInsights {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);

  useEffect(() => {
    if (symbols.length === 0) return;

    const runAnalysis = async () => {
      const newPreds: Prediction[] = [];
      const newAlerts: SmartAlert[] = [];
      for (const sym of symbols) {
        try {
          const klines = await fetchKlines(sym);
          const closes = klines.map(k => parseFloat(k[4]));
          const highs = klines.map(k => parseFloat(k[2]));
          const lows = klines.map(k => parseFloat(k[3]));
          const volumes = klines.map(k => parseFloat(k[5]));
          const candles: Candle[] = klines.map(k => ({ close: parseFloat(k[4]), high: parseFloat(k[2]), low: parseFloat(k[3]) }));

          // indicators
          const ema9 = ema(closes, 9);
          const ema21 = ema(closes, 21);
          const rsi14Arr = rsi(closes, 14);
          const { macd: macdLine, signal } = macd(closes);
          const atr14 = atr(candles, 14);

          const volAvg5 = volumes.slice(-5).reduce((a,b)=>a+b,0)/5;
          const volNow = volumes[volumes.length-1];
          const emaBull = ema9[ema9.length-1] > ema21[ema21.length-1];

          let confidence = 0;
          let reason = '';
          let direction: 'up'|'down' = 'up';

          // breakout bullish
          if (volNow > volAvg5*1.3 && emaBull) {
            direction='up';
            reason='Breakout alcista con volumen';
          } else if (rsi14Arr[rsi14Arr.length-1] < 30) {
            direction='up';
            reason='RSI en sobreventa';
          }

          // Confidence calc
          const volScore = Math.min((volNow/volAvg5-1)*100,100);
          const macdHist = macdLine[macdLine.length-1]-signal[signal.length-1];
          const macdScore = macdHist>0?80:20;
          const patternScore = reason ? 100 : 0;
          confidence = 0.4*volScore + 0.3*macdScore + 0.3*patternScore;
          confidence = Math.min(Math.max(confidence,0),100);

          newPreds.push({
            market: sym.replace('USDT','/USD'),
            direction,
            confidence: Math.round(confidence),
            timeframe:'1m',
            potentialGain:'+5%',
            riskLevel: confidence>85?'low':confidence>60?'medium':'high',
            reasoning: reason
          });

          // Alerts
          const highest = Math.max(...highs);
          const lowest = Math.min(...lows);
          const priceNow = closes[closes.length-1];
          const atrNow = atr14[atr14.length-1];
          const atrAvg = atr14.slice(-14).reduce((a,b)=>a+b,0)/14;
          const volMA14 = volumes.slice(-14).reduce((a,b)=>a+b,0)/14;

          // breakout alert
          if(priceNow>highest*0.995 && volNow>volMA14*1.2){
            newAlerts.push({id:`${sym}-br`,type:'breakout',market:sym,message:'Posible breakout alcista',urgency:'high',timestamp:new Date(),action:'Considerar LONG'});
          }
          // support alert
          if(priceNow<lowest*1.005 && rsi14Arr[rsi14Arr.length-1]<30){
            newAlerts.push({id:`${sym}-sup`,type:'support',market:sym,message:'Precio cerca de soporte y RSI bajo',urgency:'medium',timestamp:new Date()});
          }
          // volatility alert
          if(atrNow>atrAvg*2){
            newAlerts.push({id:`${sym}-vol`,type:'volatility',market:sym,message:'Volatilidad muy alta',urgency:'high',timestamp:new Date()});
          }
        }catch(e){console.error('AI analysis error',e);}
      }
      setPredictions(newPreds);
      setAlerts(newAlerts);
    };

    runAnalysis();
    const id = setInterval(runAnalysis,60000);
    return ()=>clearInterval(id);
  },[symbols.join(',')]);

  return {
    predictions,
    alerts,
    monitored: symbols.length,
    patterns: predictions.length,
    activeAlerts: alerts.length,
    precisionToday: 87
  };
} 