import { calculateSMA, calculateRSI } from '@/wasm/wasm';

export class WasmIndicatorService {
  private static instance: WasmIndicatorService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): WasmIndicatorService {
    if (!WasmIndicatorService.instance) {
      WasmIndicatorService.instance = new WasmIndicatorService();
    }
    return WasmIndicatorService.instance;
  }

  public calculateSMA(data: number[], period: number) {
    if (!this.isInitialized) {
      throw new Error('WASM not initialized');
    }
    return {
      values: calculateSMA(data, period),
      lastValue: calculateSMA(data, period)[data.length - period]
    };
  }

  public calculateRSI(data: number[], period: number) {
    if (!this.isInitialized) {
      throw new Error('WASM not initialized');
    }
    return {
      values: calculateRSI(data, period),
      lastValue: calculateRSI(data, period)[data.length - period]
    };
  }

  public setInitialized(initialized: boolean) {
    this.isInitialized = initialized;
  }

  public isWasmInitialized(): boolean {
    return this.isInitialized;
  }
} 