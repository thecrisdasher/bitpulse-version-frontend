import crypto from 'crypto';
import { BITSTAMP_CONFIG } from '../config/bitstampConfig';

interface BitstampRequestOptions {
  method?: 'GET' | 'POST';
  endpoint: string;
  params?: Record<string, string>;
  requiresAuth?: boolean;
}

interface BitstampErrorResponse {
  status: string;
  reason: string;
  code: number;
}

export class BitstampAPIService {
  private apiKey: string;
  private apiSecret: string;
  private clientId: string;
  private baseUrl: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly MAX_REQUESTS_PER_SECOND = 8;
  private readonly MAX_REQUESTS_PER_MINUTE = 480;

  constructor() {
    this.apiKey = BITSTAMP_CONFIG.AUTH.API_KEY || '';
    this.apiSecret = BITSTAMP_CONFIG.AUTH.API_SECRET || '';
    this.clientId = BITSTAMP_CONFIG.AUTH.CLIENT_ID || '';
    // Usar el proxy en desarrollo
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3004/proxy/bitstamp'
      : BITSTAMP_CONFIG.API.BASE_URL;
  }

  private generateNonce(): string {
    return Date.now().toString();
  }

  private generateSignature(nonce: string, clientId: string, apiKey: string): string {
    const message = nonce + clientId + apiKey;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex')
      .toUpperCase();
    return signature;
  }

  private buildQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    // Reset counters if more than a minute has passed
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }

    // Check if we're about to exceed rate limits
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = oneMinuteAgo - this.lastRequestTime;
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.requestCount = 0;
    }

    // Add delay if we're making requests too quickly
    if (now - this.lastRequestTime < 1000/this.MAX_REQUESTS_PER_SECOND) {
      await new Promise(resolve => 
        setTimeout(resolve, 1000/this.MAX_REQUESTS_PER_SECOND)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async makeRequest<T>({ method = 'GET', endpoint, params = {}, requiresAuth = false }: BitstampRequestOptions): Promise<T> {
    await this.checkRateLimit();
    try {
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };

      if (requiresAuth) {
        if (!this.apiKey || !this.apiSecret || !this.clientId) {
          throw new Error('API credentials not configured');
        }

        const nonce = this.generateNonce();
        const signature = this.generateSignature(nonce, this.clientId, this.apiKey);

        headers['X-Auth'] = `BITSTAMP ${this.apiKey}`;
        headers['X-Auth-Signature'] = signature;
        headers['X-Auth-Nonce'] = nonce;
        headers['X-Auth-Timestamp'] = nonce;
        headers['X-Auth-Version'] = 'v2';
      }

      const queryString = this.buildQueryString(params);
      // Remove any double slashes in the URL except after http(s):
      const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`.replace(/([^:]\/)\/+/g, "$1");

      console.log('Making request to:', url, {
        method,
        headers,
        params
      });

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'omit',
        mode: 'cors',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Error in Bitstamp API request:', error);
      throw error;
    }
  }

  async getOHLCData(symbol: string, step: number = 3600, limit: number = 100): Promise<any> {
    try {
      // Try the new endpoint first
      try {
        const formattedSymbol = symbol.toLowerCase().replace('/', '');
        return await this.makeRequest({
          endpoint: `/trading-pair-info/v2/ohlc/${formattedSymbol}`,
          params: {
            step: step.toString(),
            limit: limit.toString()
          }
        });
      } catch (error: any) {
        // If 404, try the old endpoint
        if (error.message?.includes('404')) {
          console.log('New endpoint failed, trying legacy endpoint...');
      return await this.makeRequest({
        endpoint: `/ohlc/${symbol.toLowerCase()}/`,
        params: {
          step: step.toString(),
          limit: limit.toString()
        }
      });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      throw error;
    }
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      return await this.makeRequest({
        endpoint: `/ticker/${symbol.toLowerCase()}/`
      });
    } catch (error) {
      console.error('Error fetching ticker:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string): Promise<any> {
    try {
      return await this.makeRequest({
        endpoint: `/order_book/${symbol.toLowerCase()}/`
      });
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  }

  async getTrades(symbol: string, time: string = 'hour'): Promise<any> {
    try {
      return await this.makeRequest({
        endpoint: `/transactions/${symbol.toLowerCase()}/`,
        params: { time }
      });
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  // Métodos autenticados
  async getBalance(): Promise<any> {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/balance/',
      requiresAuth: true
    });
  }

  async getUserTransactions(offset: number = 0, limit: number = 100): Promise<any> {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/user_transactions/',
      params: {
        offset: offset.toString(),
        limit: limit.toString()
      },
      requiresAuth: true
    });
  }
}

export const bitstampAPI = new BitstampAPIService(); 