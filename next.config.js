/** @type {import('next').NextConfig} */
const path = require('path');
const { i18n } = require('./next-i18next.config');

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
    memoryBasedWorkersCount: true
  },
  images: {
    unoptimized: true,
  },
  i18n,
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
}

module.exports = nextConfig 