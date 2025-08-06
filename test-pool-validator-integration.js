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