export const BITSTAMP_CONFIG = {
  API: {
    BASE_URL: 'https://www.bitstamp.net/api/v2',
    WS_URL: 'wss://ws.bitstamp.net',
    ENDPOINTS: {
      TICKER: '/ticker',
      TICKER_HOUR: '/ticker_hour',
      OHLC: '/ohlc',
      TRADING_PAIRS: '/trading-pairs-info',
      ORDER_BOOK: '/order_book',
      TRANSACTIONS: '/transactions',
      BALANCE: '/balance',
      USER_TRANSACTIONS: '/user_transactions'
    },
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    RATE_LIMIT: {
      MAX_REQUESTS_PER_SECOND: 8,
      MAX_REQUESTS_PER_MINUTE: 480
    }
  },
  WEBSOCKET: {
    CHANNELS: {
      LIVE_TRADES: 'live_trades',
      LIVE_ORDERS: 'live_orders',
      ORDER_BOOK: 'order_book',
      DETAIL_ORDER_BOOK: 'detail_order_book',
      DIFF_ORDER_BOOK: 'diff_order_book'
    },
    HEARTBEAT_INTERVAL: 15000,
    RECONNECT_INTERVAL: 2000,
    MAX_RECONNECT_ATTEMPTS: 5
  },
  AUTH: {
    API_KEY: process.env.NEXT_PUBLIC_BITSTAMP_API_KEY,
    API_SECRET: process.env.NEXT_PUBLIC_BITSTAMP_API_SECRET,
    CLIENT_ID: process.env.NEXT_PUBLIC_BITSTAMP_CLIENT_ID
  },
  DEFAULTS: {
    OHLC_STEP: 3600,
    OHLC_LIMIT: 100,
    TRADE_TIME: 'hour'
  }
}; 