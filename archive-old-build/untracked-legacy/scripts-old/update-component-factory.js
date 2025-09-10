#!/usr/bin/env node

/**
 * Update ComponentFactory to use actual component classes
 */

import fs from 'fs/promises';

async function main() {
  console.log('UPDATING COMPONENT FACTORY');
  console.log('==========================\n');
  
  try {
    const factoryPath = 'src/detection/transport/component-factory.js';
    let content = await fs.readFile(factoryPath, 'utf8');
    
    // Update createTokenBucket to use real implementation
    const tokenBucketImpl = `  async createTokenBucket() {
    const { default: TokenBucket } = await import('./token-bucket.js');
    return new TokenBucket(this.config.tokenBucket);
  }`;
    
    // Update createCircuitBreaker to use real implementation
    const circuitBreakerImpl = `  async createCircuitBreaker() {
    const { default: CircuitBreaker } = await import('./circuit-breaker.js');
    return new CircuitBreaker(this.config.circuitBreaker);
  }`;
    
    // Update createRequestCache to use real implementation
    const requestCacheImpl = `  async createRequestCache() {
    const { default: RequestCache } = await import('./request-cache.js');
    return new RequestCache(this.config.requestCache);
  }`;
    
    // Update createEndpointSelector to use real implementation
    const endpointSelectorImpl = `  async createEndpointSelector() {
    const { default: EndpointSelector } = await import('./endpoint-selector.js');
    return new EndpointSelector(this.config.endpointSelector);
  }`;
    
    // Update createConnectionPoolCore to use real implementation
    const connectionPoolImpl = `  async createConnectionPoolCore() {
    const { default: ConnectionPoolCore } = await import('./connection-pool-core.js');
    return new ConnectionPoolCore(this.config.connectionPool);
  }`;
    
    // Update createBatchManager to use real implementation
    const batchManagerImpl = `  async createBatchManager(connectionPool) {
    const { default: BatchManager } = await import('./batch-manager.js');
    return new BatchManager(this.config.batchManager, connectionPool);
  }`;
    
    // Update createHedgedManager to use real implementation
    const hedgedManagerImpl = `  async createHedgedManager(endpointSelector, connectionPool) {
    const { default: HedgedManager } = await import('./hedged-manager.js');
    return new HedgedManager(this.config.hedgedManager, { endpointSelector, connectionPool });
  }`;
    
    // Replace placeholder implementations
    content = content.replace(
      /async createTokenBucket\(\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      tokenBucketImpl
    );
    
    content = content.replace(
      /async createCircuitBreaker\(\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      circuitBreakerImpl
    );
    
    content = content.replace(
      /async createRequestCache\(\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      requestCacheImpl
    );
    
    content = content.replace(
      /async createEndpointSelector\(\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      endpointSelectorImpl
    );
    
    content = content.replace(
      /async createConnectionPoolCore\(\) \{[\s\S]*?}\s*catch[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      connectionPoolImpl
    );
    
    content = content.replace(
      /async createBatchManager\(connectionPool\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      batchManagerImpl
    );
    
    content = content.replace(
      /async createHedgedManager\(endpointSelector, connectionPool\) \{[\s\S]*?return \{[\s\S]*?\};\s*\}/,
      hedgedManagerImpl
    );
    
    // Write updated content
    await fs.writeFile(factoryPath, content);
    
    console.log('✅ ComponentFactory updated to use actual component classes');
    console.log('\nChanges made:');
    console.log('  ✓ TokenBucket - now imports from ./token-bucket.js');
    console.log('  ✓ CircuitBreaker - now imports from ./circuit-breaker.js');
    console.log('  ✓ RequestCache - now imports from ./request-cache.js');
    console.log('  ✓ EndpointSelector - now imports from ./endpoint-selector.js');
    console.log('  ✓ ConnectionPoolCore - now imports from ./connection-pool-core.js');
    console.log('  ✓ BatchManager - now imports from ./batch-manager.js');
    console.log('  ✓ HedgedManager - now imports from ./hedged-manager.js');
    
  } catch (error) {
    console.error('Failed to update ComponentFactory:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Update script failed:', error.message);
  process.exit(1);
});