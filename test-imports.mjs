console.log('Testing imports one by one...');

const imports = [
  { name: 'CircuitBreaker', path: './src/services/circuit-breaker.service.js' },
  { name: 'WorkerPoolManager', path: './src/services/worker-pool-manager.service.js' },
  { name: 'BatchProcessor', path: './src/services/batch-processor.service.js' },
  { name: 'SolanaPoolParserService', path: './src/services/solana-pool-parser.service.js' },
  { name: 'LiquidityPoolCreationDetectorService', path: './src/services/liquidity-pool-creation-detector.service.js' },
  { name: 'WebSocketManagerService', path: './src/services/websocket-manager.service.js' },
  { name: 'RPCConnectionManager', path: './src/core/rpc-connection-manager/index.js' },
  { name: 'TieredTokenFilterService', path: './src/services/tiered-token-filter.service.js' },
  { name: 'RenaissanceFeatureStore', path: './src/services/feature-store.service.js' }
];

for (const imp of imports) {
  console.log(`\nTesting import: ${imp.name}...`);
  try {
    const start = Date.now();
    await import(imp.path);
    const duration = Date.now() - start;
    console.log(`✓ ${imp.name} imported successfully in ${duration}ms`);
  } catch (error) {
    console.error(`✗ ${imp.name} import failed:`, error.message);
  }
}

console.log('\nAll imports tested.');