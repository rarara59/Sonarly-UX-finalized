tests/helpers/test-factory.js (update existing):

import { Logger } from '../../src/components/logger.js';
import { RpcPool } from '../../src/components/rpc-pool.js';

export function getTestClock(useFakes = false) {
  // Return deterministic test clock value
  return useFakes ? 1640995200000 : Date.now();
}

export async function createTestableComponent(componentName, useFakes = false) {
  if (componentName === 'logger') {
    const deps = {
      clock: { now: () => getTestClock(useFakes) },
      uuid: () => `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    return new Logger(deps);
  }
  
  if (componentName === 'rpc-pool') {
    // Create mock logger
    const loggerDeps = {
      clock: { now: () => getTestClock(useFakes) },
      uuid: () => `log-uuid-${Math.random().toString(36).substr(2, 9)}`
    };
    const logger = new Logger(loggerDeps);
    
    // Create RPC Pool with test configuration
    const config = {
      endpoints: [
        { url: 'https://api.mainnet-beta.solana.com', weight: 1, rpsCap: 100, timeoutMs: 5000 },
        { url: 'https://solana-api.projectserum.com', weight: 1, rpsCap: 50, timeoutMs: 3000 }
      ],
      maxConcurrency: 10,
      queueCapacity: 100,
      globalTimeoutMs: 30000,
      retryBackoffMs: 1000,
      maxRetries: 3,
      preferFastest: false
    };
    
    const deps = {
      clock: { now: () => getTestClock(useFakes) },
      rng: { random: () => 0.5 }, // Deterministic for tests
      uuid: { uuid: () => `rpc-uuid-${Math.random().toString(36).substr(2, 9)}` },
      logger: logger
    };
    
    return new RpcPool(config, deps);
  }
  
  throw new Error(`Unknown component: ${componentName}`);
}

export async function waitForCondition(conditionFn, options = {}) {
  const { timeoutMs = 1000, intervalMs = 10 } = options;
  const start = Date.now();
  
  while (Date.now() - start < timeoutMs) {
    if (await conditionFn()) return true;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Condition not met within timeout');
}