import { RpcConnectionPool } from '../transport/rpc-connection-pool.js';
import { PoolValidator } from '../validation/pool-validator.js';

export class PoolValidatorIntegration {
  constructor(performanceMonitor = null) {
    this.rpcPool = new RpcConnectionPool(null, performanceMonitor);
    this.poolValidator = new PoolValidator(this.rpcPool, performanceMonitor);
  }
  
  async validatePool(poolAddress, dexType, context = {}) {
    return await this.poolValidator.validatePool(poolAddress, dexType, context);
  }
  
  isHealthy() {
    return this.rpcPool.isHealthy() && this.poolValidator.isHealthy();
  }
  
  getStats() {
    return {
      rpcPool: this.rpcPool.getStats(),
      poolValidator: this.poolValidator.getStats()
    };
  }
  
  destroy() {
    if (this.rpcPool) this.rpcPool.destroy();
  }
}