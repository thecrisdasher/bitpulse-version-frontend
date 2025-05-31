interface RateLimiterConfig {
  maxRequests: number;
  timeWindow: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxRequests: number;
  private timeWindow: number;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.timeWindow = config.timeWindow;
    this.tokens = this.maxRequests;
    this.lastRefill = Date.now();
  }

  private refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillAmount = Math.floor((timePassed / this.timeWindow) * this.maxRequests);
    
    if (refillAmount > 0) {
      this.tokens = Math.min(this.maxRequests, this.tokens + refillAmount);
      this.lastRefill = now;
    }
  }

  async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    // Calcular tiempo hasta el próximo token disponible
    const waitTime = Math.ceil(
      (this.timeWindow / this.maxRequests) - 
      (Date.now() - this.lastRefill)
    );

    await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
    return this.waitForToken();
  }
} 