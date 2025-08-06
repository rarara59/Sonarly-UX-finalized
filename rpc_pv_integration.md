# FIX: Pool Validator RPC Integration

## Issue
Pool Validator needs RPC Connection Pool integration for production deployment with failover and performance monitoring.

## Files to Change
- `src/detection/integration/pool-validator-integration.js` (new file)
- `test-pool-validator-integration.js` (new test file)

## Required Changes
1. Create integration wrapper class connecting Pool Validator to RPC Pool
2. Add combined health checks and statistics
3. Create integration test for immediate verification
4. Add proper resource cleanup methods

## Commands
```bash
# Create integration directory
mkdir -p src/detection/integration

# Create Pool Validator integration wrapper
cat > src/detection/integration/pool-validator-integration.js << 'EOF'
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
EOF

# Create integration test
cat > test-pool-validator-integration.js << 'EOF'
import { PoolValidatorIntegration } from './src/detection/integration/pool-validator-integration.js';

async function test() {
  const integration = new PoolValidatorIntegration();
  
  const result1 = await integration.validatePool('invalid', 'raydium');
  console.log('Invalid address test:', result1.reason === 'invalid_pool_address' ? 'PASS' : 'FAIL');
  
  const result2 = await integration.validatePool('11111111111111111111111111111111111111111111', null);
  console.log('Null dexType test:', result2.reason === 'invalid_dex_type' ? 'PASS' : 'FAIL');
  
  console.log('Health check:', integration.isHealthy() ? 'PASS' : 'FAIL');
  
  integration.destroy();
}

test().catch(console.error);
EOF
```

## Test Fix
```bash
# Test integration creation
node test-pool-validator-integration.js

# Test RPC pool functionality
node -e "import('./src/detection/integration/pool-validator-integration.js').then(({PoolValidatorIntegration}) => { const i = new PoolValidatorIntegration(); console.log('Created:', !!i.rpcPool); i.destroy(); })"

# Test health status
node -e "import('./src/detection/integration/pool-validator-integration.js').then(({PoolValidatorIntegration}) => { const i = new PoolValidatorIntegration(); console.log('Healthy:', i.isHealthy()); i.destroy(); })"
```

## Validation Checklist
- ✓ Pool Validator receives working RPC Connection Pool instance
- ✓ Integration wrapper provides clean API for other components
- ✓ Combined health checks return boolean status
- ✓ Resource cleanup prevents memory leaks
- ✓ Integration test validates core functionality