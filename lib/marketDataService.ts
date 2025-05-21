import axios from 'axios';
import { MarketInstrument } from './mockData';

// API Keys - in production these should be environment variables
const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with actual key
const COINCAP_API_URL = 'https://api.coincap.io/v2';
const TWELVEDATA_API_KEY = 'demo'; // Replace with actual key

// WebSocket connections for real-time data
let cryptoWebSocket: WebSocket | null = null;
let forexWebSocket: WebSocket | null = null;
let stocksWebSocket: WebSocket | null = null;

// Extend MarketInstrument type for our cache
interface MarketDataCacheItem extends Partial<MarketInstrument> {
  lastUpdated?: Date;
}

// Market data cache
const marketDataCache: Record<string, MarketDataCacheItem> = {};
const subscribers: Record<string, ((data: any) => void)[]> = {};

// Initialize WebSocket connections
export function initializeRealTimeConnections() {
  // Initialize crypto WebSocket (using CoinCap)
  try {
    cryptoWebSocket = new WebSocket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum,solana,cardano');
    
    cryptoWebSocket.onopen = () => {
      console.log('CoinCap WebSocket connected');
    };
    
    cryptoWebSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle incoming cryptocurrency price updates
      Object.keys(data).forEach(asset => {
        const price = parseFloat(data[asset]);
        updateMarketData(asset, { price });
      });
    };
    
    cryptoWebSocket.onerror = (error) => {
      console.error('CoinCap WebSocket error:', error);
    };
  } catch (error) {
    console.error('Failed to initialize crypto WebSocket:', error);
  }
  
  // For Forex and Stocks - using TwelveData (example)
  // In a real implementation, you would use their WebSocket API
  setupPollingForNonCryptoAssets();
}

// Polling fallback for assets without WebSocket support
function setupPollingForNonCryptoAssets() {
  // Poll forex data every 5 seconds
  setInterval(async () => {
    try {
      const forexSymbols = ['EUR/USD', 'GBP/USD', 'USD/JPY'];
      const response = await axios.get(
        `https://api.twelvedata.com/price?symbol=${forexSymbols.join(',')}&apikey=${TWELVEDATA_API_KEY}`
      );
      
      if (response.data) {
        Object.keys(response.data).forEach(symbol => {
          const instrumentId = symbol.toLowerCase().replace('/', '');
          updateMarketData(instrumentId, { 
            price: parseFloat(response.data[symbol].price) 
          });
        });
      }
    } catch (error) {
      console.error('Error polling forex data:', error);
    }
  }, 5000);
  
  // Poll stock indices data every 5 seconds
  setInterval(async () => {
    try {
      const stockSymbols = ['SPX', 'NDX', 'DJI'];
      const response = await axios.get(
        `https://api.twelvedata.com/price?symbol=${stockSymbols.join(',')}&apikey=${TWELVEDATA_API_KEY}`
      );
      
      if (response.data) {
        const mapping: Record<string, string> = {
          'SPX': 'us500',
          'NDX': 'ustech',
          'DJI': 'us30'
        };
        
        Object.keys(response.data).forEach(symbol => {
          const instrumentId = mapping[symbol] || symbol.toLowerCase();
          updateMarketData(instrumentId, { 
            price: parseFloat(response.data[symbol].price) 
          });
        });
      }
    } catch (error) {
      console.error('Error polling stock indices data:', error);
    }
  }, 5000);
  
  // Commodities like gold, silver, oil
  setInterval(async () => {
    try {
      const commoditySymbols = ['GOLD', 'SILVER', 'OIL'];
      const response = await axios.get(
        `https://api.twelvedata.com/price?symbol=${commoditySymbols.join(',')}&apikey=${TWELVEDATA_API_KEY}`
      );
      
      if (response.data) {
        Object.keys(response.data).forEach(symbol => {
          const instrumentId = symbol.toLowerCase();
          updateMarketData(instrumentId, { 
            price: parseFloat(response.data[symbol].price) 
          });
        });
      }
    } catch (error) {
      console.error('Error polling commodities data:', error);
    }
  }, 5000);
}

// For synthetic data (like volatility indices), we can create realistic but simulated values
// These values should still fluctuate in real-time, just not based on external data
function setupSyntheticIndicesSimulation() {
  // Base values for different volatility indices
  const baseValues: Record<string, number> = {
    'volatility-10': 9120,
    'volatility-25': 12500,
    'volatility-50': 14200,
    'volatility-75': 16800,
    'volatility-100': 19500,
    'boom-500': 5000,
    'boom-1000': 10000,
    'crash-300': 3000,
    'crash-500': 5000
  };
  
  // Update each synthetic index on its own rhythm
  Object.keys(baseValues).forEach(id => {
    const baseValue = baseValues[id];
    let currentValue = baseValue;
    
    // Create a realistic tick pattern
    setInterval(() => {
      // Generate small random changes
      const isBoom = id.includes('boom');
      const isCrash = id.includes('crash');
      
      // Add slight bias depending on the index type
      let bias = 0;
      if (isBoom) bias = 0.0002; // Slight upward bias for boom indices
      if (isCrash) bias = -0.0002; // Slight downward bias for crash indices
      
      // Random tick with bias
      const randomTick = (Math.random() * 0.001 - 0.0005) + bias;
      currentValue = currentValue * (1 + randomTick);
      
      // Mean reversion - move back toward the base value over time
      currentValue = currentValue + (baseValue - currentValue) * 0.001;
      
      updateMarketData(id, { 
        price: currentValue,
        hasRealTime: true
      });
      
      // Also update the 1s real-time versions
      if (id.includes('volatility')) {
        updateMarketData(`${id}-1s`, { 
          price: currentValue * (1 + (Math.random() * 0.0004 - 0.0002)),
          hasRealTime: true
        });
      }
    }, id.includes('-1s') ? 1000 : 2000); // 1s update for real-time variants
  });
}

// Update market data and notify subscribers
function updateMarketData(instrumentId: string, data: Partial<MarketInstrument>) {
  // Get the current data or initialize with empty object
  const currentData = marketDataCache[instrumentId] || {};
  
  // Update with new data
  marketDataCache[instrumentId] = {
    ...currentData,
    ...data,
    lastUpdated: new Date()
  };
  
  // Notify subscribers
  if (subscribers[instrumentId]) {
    subscribers[instrumentId].forEach(callback => {
      callback(marketDataCache[instrumentId]);
    });
  }
  
  // Notify global subscribers
  if (subscribers['all']) {
    subscribers['all'].forEach(callback => {
      callback({
        ...marketDataCache[instrumentId],
        instrumentId // Include the ID for global subscribers
      });
    });
  }
}

// Subscribe to market data updates
export function subscribeToMarketData(
  instrumentId: string | 'all', 
  callback: (data: any) => void
): () => void {
  if (!subscribers[instrumentId]) {
    subscribers[instrumentId] = [];
  }
  
  subscribers[instrumentId].push(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers[instrumentId] = subscribers[instrumentId].filter(cb => cb !== callback);
  };
}

// Initialize the service - call this on app startup
export function initializeMarketDataService() {
  initializeRealTimeConnections();
  setupSyntheticIndicesSimulation();
}

// Get current market data
export function getMarketData(instrumentId: string): MarketDataCacheItem | null {
  return marketDataCache[instrumentId] || null;
}

// Get all market data
export function getAllMarketData(): Record<string, MarketDataCacheItem> {
  return { ...marketDataCache };
}

// Clean up resources when needed
export function cleanupMarketDataService() {
  if (cryptoWebSocket) {
    cryptoWebSocket.close();
    cryptoWebSocket = null;
  }
  
  if (forexWebSocket) {
    forexWebSocket.close();
    forexWebSocket = null;
  }
  
  if (stocksWebSocket) {
    stocksWebSocket.close();
    stocksWebSocket = null;
  }
  
  // Clear all intervals (in a real app, you'd want to track these specifically)
  // This is a crude way to clear all intervals
  const highestIntervalId = window.setInterval(() => {}, 0);
  for (let i = 0; i < highestIntervalId; i++) {
    window.clearInterval(i);
  }
} 