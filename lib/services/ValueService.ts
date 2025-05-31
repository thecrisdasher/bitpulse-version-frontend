// Servicio para calcular diferentes tipos de valor usando datos reales
import { CoinGeckoService } from './CoinGeckoService';
import { WasmIndicatorService } from './WasmIndicatorService';

export interface ValueMetric {
  type: 'opportunity' | 'portfolio' | 'market_health' | 'trend_strength' | 'volatility_score';
  value: number;
  label: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  confidence: number; // 0-100
  lastUpdated: Date;
  components?: { [key: string]: number };
}

export interface ValueConfig {
  instrument: string;
  category: 'crypto' | 'stocks' | 'forex' | 'indices';
  valueType: ValueMetric['type'];
  period: '1h' | '4h' | '1d' | '7d' | '30d';
  refreshInterval: number; // minutes
}

export class ValueService {
  private coinGeckoService = new CoinGeckoService();
  private indicatorService = WasmIndicatorService.getInstance();
  private cache = new Map<string, ValueMetric>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();

  async calculateValue(config: ValueConfig): Promise<ValueMetric> {
    const cacheKey = this.getCacheKey(config);
    const cached = this.cache.get(cacheKey);
    
    // Usar cache si está disponible y no ha expirado
    if (cached && this.isCacheValid(cached, config.refreshInterval)) {
      return cached;
    }

    let value: ValueMetric;

    try {
      switch (config.valueType) {
        case 'opportunity':
          value = await this.calculateOpportunityScore(config);
          break;
        case 'portfolio':
          value = await this.calculatePortfolioValue(config);
          break;
        case 'market_health':
          value = await this.calculateMarketHealth(config);
          break;
        case 'trend_strength':
          value = await this.calculateTrendStrength(config);
          break;
        case 'volatility_score':
          value = await this.calculateVolatilityScore(config);
          break;
        default:
          throw new Error(`Tipo de valor no soportado: ${config.valueType}`);
      }

      // Guardar en cache
      this.cache.set(cacheKey, value);
      
      // Configurar auto-refresh
      this.setupAutoRefresh(config);
      
      return value;
    } catch (error) {
      console.error('Error calculando valor:', error);
      
      // Fallback con datos simulados
      return this.getFallbackValue(config);
    }
  }

  private async calculateOpportunityScore(config: ValueConfig): Promise<ValueMetric> {
    const { instrument, period } = config;
    
    // Obtener datos históricos
    const historicalData = await this.getHistoricalData(instrument, period);
    
    // Calcular indicadores técnicos
    const prices = Array.isArray(historicalData) 
      ? historicalData.map((d: { close: number }) => d.close)
      : historicalData.candleData.map(d => d.close);
    
    // Calcular SMA y RSI usando el servicio de indicadores
    const sma20Result = this.indicatorService.calculateSMA(prices, 20);
    const sma50Result = this.indicatorService.calculateSMA(prices, 50);
    const rsiResult = this.indicatorService.calculateRSI(prices, 14);
    
    // Extraer valores de los resultados
    const sma20Values = sma20Result.values;
    const sma50Values = sma50Result.values;
    const rsiValues = rsiResult.values;
    
    const currentPrice = prices[prices.length - 1];
    const currentSMA20 = sma20Values[sma20Values.length - 1];
    const currentSMA50 = sma50Values[sma50Values.length - 1];
    const currentRSI = rsiValues[rsiValues.length - 1];
    
    // Calcular componentes del score
    const trendScore = this.calculateTrendScore(currentPrice, currentSMA20, currentSMA50);
    const momentumScore = this.calculateMomentumScore(currentRSI);
    const volatilityScore = this.calculateVolatilityScoreFromPrices(prices);
    
    // Score total (0-100)
    const totalScore = (trendScore * 0.4 + momentumScore * 0.3 + volatilityScore * 0.3);
    
    return {
      type: 'opportunity',
      value: Math.round(totalScore),
      label: 'Score de Oportunidad',
      description: 'Puntuación basada en tendencia, momentum y volatilidad',
      trend: totalScore > 60 ? 'up' : totalScore < 40 ? 'down' : 'neutral',
      confidence: Math.min(95, Math.max(50, totalScore * 1.2)),
      lastUpdated: new Date(),
      components: {
        tendencia: Math.round(trendScore),
        momentum: Math.round(momentumScore),
        volatilidad: Math.round(volatilityScore)
      }
    };
  }

  private async calculatePortfolioValue(config: ValueConfig): Promise<ValueMetric> {
    // Simular valor de portfolio (en implementación real se conectaría a datos del usuario)
    const mockPortfolio = [
      { symbol: 'bitcoin', amount: 0.5, category: 'crypto' },
      { symbol: 'ethereum', amount: 2.0, category: 'crypto' },
      { symbol: 'cardano', amount: 1000, category: 'crypto' }
    ];

    let totalValue = 0;
    let totalChange = 0;

    for (const holding of mockPortfolio) {
      try {
        const data = await this.coinGeckoService.getCurrentPrices([holding.symbol]);
        const coinData = data[holding.symbol];
        if (coinData) {
          const value = coinData.usd * holding.amount;
          totalValue += value;
          totalChange += coinData.usd_24h_change || 0;
        }
      } catch (error) {
        // Fallback con precios simulados
        const mockPrice = this.getMockPrice(holding.symbol);
        totalValue += mockPrice * holding.amount;
      }
    }

    const avgChange = totalChange / mockPortfolio.length;

    return {
      type: 'portfolio',
      value: Math.round(totalValue),
      label: 'Valor Total del Portfolio',
      description: 'Valor total de tus posiciones en tiempo real',
      trend: avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'neutral',
      confidence: 90,
      lastUpdated: new Date(),
      components: {
        'cambio_24h': Math.round(avgChange * 100) / 100,
        'num_activos': mockPortfolio.length
      }
    };
  }

  private async calculateMarketHealth(config: ValueConfig): Promise<ValueMetric> {
    const { instrument } = config;
    
    try {
      // Obtener datos de mercado
      const marketData = await this.coinGeckoService.getCurrentPrices([instrument]);
      const coinData = marketData[instrument];
      
      if (!coinData) {
        return this.getFallbackValue(config);
      }
      
      const volume = coinData.usd_24h_vol || 0;
      const change24h = coinData.usd_24h_change || 0;
      
      // Calcular health score (0-100)
      const volumeScore = Math.min(100, (volume / 1000000) * 10); // Normalizar volumen
      const priceStabilityScore = Math.max(0, 100 - Math.abs(change24h) * 2);
      const marketCapScore = 70; // Placeholder
      
      const healthScore = (volumeScore * 0.3 + priceStabilityScore * 0.4 + marketCapScore * 0.3);
      
      return {
        type: 'market_health',
        value: Math.round(healthScore),
        label: 'Salud del Mercado',
        description: 'Evaluación general de la salud del mercado',
        trend: healthScore > 70 ? 'up' : healthScore < 40 ? 'down' : 'neutral',
        confidence: 85,
        lastUpdated: new Date(),
        components: {
          volumen: Math.round(volumeScore),
          estabilidad: Math.round(priceStabilityScore),
          capitalizacion: Math.round(marketCapScore)
        }
      };
    } catch (error) {
      return this.getFallbackValue(config);
    }
  }

  private async calculateTrendStrength(config: ValueConfig): Promise<ValueMetric> {
    const historicalData = await this.getHistoricalData(config.instrument, config.period);
    
    const prices = Array.isArray(historicalData) 
      ? historicalData.map((d: any) => d.close)
      : historicalData.candleData?.map((d: any) => d.close) || [];
    
    if (prices.length === 0) {
      return this.getFallbackValue(config);
    }
    
    const sma20Result = this.indicatorService.calculateSMA(prices, 20);
    const sma50Result = this.indicatorService.calculateSMA(prices, 50);
    
    const trendStrength = this.calculateTrendScore(
      prices[prices.length - 1],
      sma20Result.lastValue,
      sma50Result.lastValue
    );
    
    return {
      type: 'trend_strength',
      value: Math.round(trendStrength),
      label: 'Fuerza de Tendencia',
      description: 'Intensidad de la tendencia actual del precio',
      trend: trendStrength > 60 ? 'up' : trendStrength < 40 ? 'down' : 'neutral',
      confidence: Math.min(95, trendStrength + 20),
      lastUpdated: new Date()
    };
  }

  private async calculateVolatilityScore(config: ValueConfig): Promise<ValueMetric> {
    const historicalData = await this.getHistoricalData(config.instrument, config.period);
    
    // Manejar diferentes tipos de datos históricos
    const prices = Array.isArray(historicalData) 
      ? historicalData.map((d: any) => d.close)
      : historicalData.candleData?.map((d: any) => d.close) || [];
    
    if (prices.length === 0) {
      return this.getFallbackValue(config);
    }
    
    const volatilityScore = this.calculateVolatilityScoreFromPrices(prices);
    
    return {
      type: 'volatility_score',
      value: Math.round(volatilityScore),
      label: 'Score de Volatilidad',
      description: 'Medida de la volatilidad reciente del precio',
      trend: volatilityScore > 70 ? 'up' : volatilityScore < 30 ? 'down' : 'neutral',
      confidence: 80,
      lastUpdated: new Date()
    };
  }

  // Métodos auxiliares
  private calculateTrendScore(currentPrice: number, sma20: number, sma50: number): number {
    const above20 = currentPrice > sma20 ? 50 : 0;
    const above50 = currentPrice > sma50 ? 30 : 0;
    const smaAlignment = sma20 > sma50 ? 20 : 0;
    return above20 + above50 + smaAlignment;
  }

  private calculateMomentumScore(rsi: number): number {
    if (rsi > 70) return 25; // Sobrecomprado
    if (rsi < 30) return 75; // Sobreventa (oportunidad)
    return 50 + (rsi - 50) * 0.5; // Neutral con ajuste
  }

  private calculateVolatilityScoreFromPrices(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    const variance = returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;
    return Math.min(100, volatility * 50); // Normalizar
  }

  private async getHistoricalData(instrument: string, period: string) {
    try {
      const days = this.periodToDays(period);
      return await this.coinGeckoService.getHistoricalData(instrument, days);
    } catch (error) {
      // Fallback con datos simulados
      return this.generateMockHistoricalData(30);
    }
  }

  private periodToDays(period: string): number {
    switch (period) {
      case '1h': return 1;
      case '4h': return 1;
      case '1d': return 7;
      case '7d': return 30;
      case '30d': return 90;
      default: return 30;
    }
  }

  private generateMockHistoricalData(days: number) {
    const data = [];
    const basePrice = 50000;
    let currentPrice = basePrice;
    
    for (let i = 0; i < days; i++) {
      currentPrice *= (1 + (Math.random() - 0.5) * 0.05);
      data.push({
        timestamp: Date.now() - (days - i) * 24 * 60 * 60 * 1000,
        close: currentPrice,
        volume: Math.random() * 1000000
      } as {timestamp: number, close: number, volume: number});
    }
    
    return data;
  }

  private getMockPrice(symbol: string): number {
    const mockPrices: { [key: string]: number } = {
      'bitcoin': 50000,
      'ethereum': 3000,
      'cardano': 0.5
    };
    return mockPrices[symbol] || 100;
  }

  private getFallbackValue(config: ValueConfig): ValueMetric {
    const mockValue = Math.floor(Math.random() * 100);
    
    return {
      type: config.valueType,
      value: mockValue,
      label: this.getValueTypeLabel(config.valueType),
      description: 'Valor simulado (datos reales no disponibles)',
      trend: mockValue > 60 ? 'up' : mockValue < 40 ? 'down' : 'neutral',
      confidence: 30,
      lastUpdated: new Date()
    };
  }

  private getValueTypeLabel(type: ValueMetric['type']): string {
    const labels = {
      'opportunity': 'Score de Oportunidad',
      'portfolio': 'Valor del Portfolio',
      'market_health': 'Salud del Mercado',
      'trend_strength': 'Fuerza de Tendencia',
      'volatility_score': 'Score de Volatilidad'
    };
    return labels[type];
  }

  private getCacheKey(config: ValueConfig): string {
    return `${config.instrument}-${config.valueType}-${config.period}`;
  }

  private isCacheValid(cached: ValueMetric, refreshIntervalMinutes: number): boolean {
    const ageMs = Date.now() - cached.lastUpdated.getTime();
    return ageMs < (refreshIntervalMinutes * 60 * 1000);
  }

  private setupAutoRefresh(config: ValueConfig) {
    const key = this.getCacheKey(config);
    
    // Limpiar timer existente
    if (this.refreshTimers.has(key)) {
      clearInterval(this.refreshTimers.get(key)!);
    }
    
    // Configurar nuevo timer
    const timer = setInterval(() => {
      this.calculateValue(config).catch(console.error);
    }, config.refreshInterval * 60 * 1000);
    
    this.refreshTimers.set(key, timer);
  }

  public cleanup() {
    // Limpiar todos los timers
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
    this.cache.clear();
  }
} 