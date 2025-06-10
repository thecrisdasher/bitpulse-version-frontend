import { useState, useEffect } from 'react';

export interface BinanceTicker {
  price: number;
  change24h: number;
  volume: number;
}

/**
 * Hook to fetch Binance 24hr ticker data for given base symbols (e.g. ['BTC', 'ETH']).
 * It polls the REST endpoint every refreshInterval ms.
 */
export default function useBinanceTickers(
  baseSymbols: string[],
  refreshInterval: number = 5000
): Record<string, BinanceTicker> {
  const [tickers, setTickers] = useState<Record<string, BinanceTicker>>({});

  useEffect(() => {
    if (!baseSymbols || baseSymbols.length === 0) return;
    let isMounted = true;

    const fetchTickers = async () => {
      try {
        // Fetch via internal proxy to avoid CORS issues
        const url = `/api/binance/tickers?symbols=${baseSymbols.join(',')}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!isMounted) return;
        const mapping: Record<string, BinanceTicker> = {};
        // The proxy returns a mapping of base symbol to ticker
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([base, val]) => {
            const ticker = val as any;
            if (ticker && typeof ticker.price === 'number') {
              mapping[base] = {
                price: ticker.price,
                change24h: ticker.change24h,
                volume: ticker.volume,
              };
            }
          });
        }
        setTickers(mapping);
      } catch (error) {
        console.error('useBinanceTickers: error fetching tickers', error);
      }
    };

    // Initial fetch
    fetchTickers();
    // Polling
    const id = setInterval(fetchTickers, refreshInterval);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [baseSymbols.join(','), refreshInterval]);

  return tickers;
} 