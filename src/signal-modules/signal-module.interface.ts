// src/interfaces/signal-module.interface.ts
import { DetectionSignals } from '../legacy/detection-signals.interface';

export interface SignalModuleConfig {
  enabled: boolean;
  weight: number;
  version: string;
  abTestGroup?: 'A' | 'B' | 'C';
  priority: number;
}

export interface SignalContext {
  tokenAddress: string;
  track: 'FAST' | 'SLOW';
  tokenAgeMinutes: number;
  currentPrice: number;
  volume?: number; // ← Add this line
  rpcManager: any;
  logger: any;
}

export interface SignalResult {
  confidence: number;
  data: any;
  processingTime: number;
  source: string;
  version: string;
}

export abstract class SignalModule {
  protected config: SignalModuleConfig;
  protected name: string;

  constructor(name: string, config: SignalModuleConfig) {
    this.name = name;
    this.config = config;
  }

  abstract execute(context: SignalContext): Promise<SignalResult>; // ← FIXED: Removed async keyword
  abstract getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH';
  abstract getSignalType(): keyof DetectionSignals;

  getConfig(): SignalModuleConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getWeight(): number {
    return this.config.weight;
  }

  getName(): string {
    return this.name;
  }

  getVersion(): string {
    return this.config.version;
  }
}