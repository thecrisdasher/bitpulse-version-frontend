import { useState, useEffect } from 'react';

export interface MarketSentiment {
  score: number; // 0-100
  text: 'miedo' | 'neutral' | 'codicia';
}

export default function useMarketSentiment(refreshMs: number = 60 * 60 * 1000): MarketSentiment {
  const [sentiment, setSentiment] = useState<MarketSentiment>({ score: 50, text: 'neutral' });

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/api/market/sentiment');
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          const value = parseInt(json.data[0].value, 10);
          let text: MarketSentiment['text'] = 'neutral';
          if (value < 30) text = 'miedo';
          else if (value > 70) text = 'codicia';
          setSentiment({ score: value, text });
        }
      } catch (e) {
        console.error('Sentiment fetch error', e);
      }
    };
    fetchSentiment();
    const id = setInterval(fetchSentiment, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  return sentiment;
} 