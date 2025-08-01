// Create: src/tests/performance-benchmark.js
const SignalOrchestrator = require('../scripts-js/signal-orchestrator');
const { MockLPAnalysisSignal, MockSmartWalletSignal } = require('./mocks/mock-signals');

async function runPerformanceBenchmark() {
  const orchestrator = new SignalOrchestrator();
  await orchestrator.initialize();
  
  // Register mock signals
  orchestrator.registerSignalModule('lpAnalysis', new MockLPAnalysisSignal());
  orchestrator.registerSignalModule('smartWallet', new MockSmartWalletSignal());
  
  const iterations = 100;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    await orchestrator.orchestrateSignals({
      tokenAddress: `test-token-${i}`,
      tokenSymbol: 'TEST',
      tokenAge: Math.random() * 300,
      marketCap: Math.random() * 10000000
    }, {
      solPrice: 100 + Math.random() * 50,
      volume24h: Math.random() * 10000000
    });
    
    times.push(Date.now() - start);
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`📊 Performance Benchmark Results:`);
  console.log(`Average: ${avgTime.toFixed(2)}ms`);
  console.log(`Min: ${minTime}ms`);
  console.log(`Max: ${maxTime}ms`);
  console.log(`Target: <100ms (${avgTime < 100 ? '✅ PASS' : '❌ FAIL'})`);
  
  // Test optimization features
  const metrics = orchestrator.getMetrics();
  console.log(`Cache Hit Rate: ${(metrics.cache?.hitRate * 100).toFixed(1)}%`);
  console.log(`Circuit Breaker Status: ${JSON.stringify(metrics.circuitBreakers)}`);
}

runPerformanceBenchmark().catch(console.error);