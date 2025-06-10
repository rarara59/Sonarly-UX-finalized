// src/services/signal-registry.service.ts

import { SignalModule, SignalModuleConfig } from '../interfaces/signal-module.interface';

export class SignalRegistry {
  private modules: Map<string, SignalModule> = new Map();
  private abTestConfigs: Map<string, SignalModuleConfig[]> = new Map();
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  register(module: SignalModule): void {
    const name = module.getName();
    
    if (this.modules.has(name)) {
      this.logger.warn(`Signal module ${name} already registered, overriding`);
    }
    
    this.modules.set(name, module);
    this.logger.info(`📝 Registered signal module: ${name} v${module.getVersion()}`);
  }

  unregister(name: string): void {
    if (this.modules.delete(name)) {
      this.logger.info(`🗑️ Unregistered signal module: ${name}`);
    }
  }

  getModule(name: string): SignalModule | undefined {
    return this.modules.get(name);
  }

  getModulesForTrack(track: 'FAST' | 'SLOW'): SignalModule[] {
    const modules: SignalModule[] = [];
    
    for (const module of this.modules.values()) {
      const requiredTrack = module.getRequiredTrack();
      if ((requiredTrack === 'BOTH' || requiredTrack === track) && module.isEnabled()) {
        modules.push(module);
      }
    }
    
    // Sort by priority (higher priority first)
    return modules.sort((a, b) => b.getConfig().priority - a.getConfig().priority);
  }

  getAllModules(): SignalModule[] {
    return Array.from(this.modules.values());
  }

  // A/B Testing support
  setupABTest(baseName: string, variants: SignalModuleConfig[]): void {
    this.abTestConfigs.set(baseName, variants);
    this.logger.info(`🧪 Setup A/B test for ${baseName} with ${variants.length} variants`);
  }

  getABTestVariant(baseName: string, tokenAddress: string): SignalModuleConfig | null {
    const variants = this.abTestConfigs.get(baseName);
    if (!variants || variants.length === 0) return null;
    
    // Deterministic A/B testing based on token address hash
    const hash = this.simpleHash(tokenAddress);
    const variantIndex = hash % variants.length;
    
    return variants[variantIndex];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getRegistryStats(): {
    totalModules: number;
    enabledModules: number;
    fastTrackModules: number;
    slowTrackModules: number;
    abTests: number;
  } {
    const modules = this.getAllModules();
    
    return {
      totalModules: modules.length,
      enabledModules: modules.filter(m => m.isEnabled()).length,
      fastTrackModules: modules.filter(m => {
        const track = m.getRequiredTrack();
        return track === 'FAST' || track === 'BOTH';
      }).length,
      slowTrackModules: modules.filter(m => {
        const track = m.getRequiredTrack();
        return track === 'SLOW' || track === 'BOTH';
      }).length,
      abTests: this.abTestConfigs.size
    };
  }
}