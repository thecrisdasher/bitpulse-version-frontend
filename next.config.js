/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    'chart.js', 
    'chartjs-adapter-date-fns',
    'chartjs-plugin-zoom',
    'chartjs-plugin-annotation',
    'react-chartjs-2'
  ],
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true,
    memoryBasedWorkersCount: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Excluir módulos problemáticos
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    
    // Optimización de paquetes para charts
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            chartJsVendor: {
              test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|chartjs-adapter-date-fns|chartjs-plugin-zoom|chartjs-plugin-annotation)[\\/]/,
              name: 'chart-vendor',
              priority: 20,
            }
          },
        },
      };
    }
    
    return config;
  },
  async rewrites() {
    return [
      // Proxy para Bitstamp API
      {
        source: '/proxy/bitstamp/:path*',
        destination: 'https://www.bitstamp.net/api/v2/:path*',
        has: [
          {
            type: 'header',
            key: 'Accept',
            value: '(.*)'
          }
        ]
      },
      // Fallback proxy para Bitstamp (para endpoints alternativos)
      {
        source: '/proxy/bitstamp/trading-pair-info/v2/:path*',
        destination: 'https://www.bitstamp.net/api/v2/trading/ohlc/:path*'
      },
      // Proxy para CoinGecko API
      {
        source: '/proxy/coingecko/:path*',
        destination: 'https://api.coingecko.com/api/v3/:path*',
      },
      // Proxy para Binance API
      {
        source: '/proxy/binance/:path*',
        destination: 'https://api.binance.com/api/v3/:path*',
      },
      // Proxy para TwelveData API
      {
        source: '/proxy/twelvedata/:path*',
        destination: 'https://api.twelvedata.com/:path*',
      },
      // Proxy para CoinCap API
      {
        source: '/proxy/coincap/:path*',
        destination: 'https://api.coincap.io/v2/:path*',
      },
      // Proxy para Polygon.io API
      {
        source: '/proxy/polygon/:path*',
        destination: 'https://api.polygon.io/v2/:path*',
      },
      // Proxy para Alpha Vantage API
      {
        source: '/proxy/alphavantage/:path*',
        destination: 'https://www.alphavantage.co/query/:path*',
      },
      // Proxy para Yahoo Finance API
      {
        source: '/proxy/yahoo/:path*',
        destination: 'https://query1.finance.yahoo.com/v8/finance/:path*',
      },
      // Proxy para Deriv API
      {
        source: '/proxy/deriv/:path*',
        destination: 'https://deriv-api.deriv.com/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Aplicar headers CORS a todas las rutas
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control, X-Auth, X-Auth-Signature, X-Auth-Nonce, X-Auth-Timestamp, X-Auth-Version, User-Agent' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        // Headers específicos para proxies
        source: '/proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control, X-Auth, X-Auth-Signature, X-Auth-Nonce, X-Auth-Timestamp, X-Auth-Version, User-Agent' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
}

module.exports = nextConfig;