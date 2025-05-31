export const marketConfigs = {
  // Configuración para criptomonedas
  crypto: {
    bitcoin: {
      symbol: 'btcusd',
      name: 'Bitcoin',
      decimals: 2,
      minAmount: 0.0001,
      maxAmount: 10,
      providers: ['bitstamp', 'binance', 'coinbase']
    },
    ethereum: {
      symbol: 'ethusd',
      name: 'Ethereum',
      decimals: 2,
      minAmount: 0.001,
      maxAmount: 100,
      providers: ['bitstamp', 'binance', 'coinbase']
    },
    // Añadir más criptomonedas según sea necesario
  },

  // Configuración para índices de volatilidad
  volatility: {
    'volatility-10': {
      symbol: 'V10',
      name: 'Volatility 10 Index',
      decimals: 2,
      minAmount: 1,
      maxAmount: 1000,
      updateInterval: 1000
    },
    'volatility-25': {
      symbol: 'V25',
      name: 'Volatility 25 Index',
      decimals: 2,
      minAmount: 1,
      maxAmount: 1000,
      updateInterval: 1000
    },
    // Añadir más índices según sea necesario
  },

  // Configuración para índices boom/crash
  indices: {
    'boom-300': {
      symbol: 'B300',
      name: 'Boom 300 Index',
      decimals: 2,
      minAmount: 1,
      maxAmount: 1000,
      updateInterval: 1000
    },
    'crash-300': {
      symbol: 'C300',
      name: 'Crash 300 Index',
      decimals: 2,
      minAmount: 1,
      maxAmount: 1000,
      updateInterval: 1000
    },
    // Añadir más índices según sea necesario
  },

  // Configuración global
  global: {
    defaultUpdateInterval: 1000,
    defaultDecimals: 2,
    defaultMinAmount: 1,
    defaultMaxAmount: 1000,
    supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
    supportedChartTypes: ['candlestick', 'line', 'area', 'bar'],
    defaultProvider: 'bitstamp'
  }
}; 