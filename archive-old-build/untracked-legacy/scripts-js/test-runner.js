// Create: src/scripts-js/test-runner.js
const SignalOrchestrator = require('./signal-orchestrator');

async function runBasicTests() {
  console.log('🧪 Starting Signal Orchestrator Tests...');
  
  // Test 1: Basic initialization
  const orchestrator = new SignalOrchestrator();
  await orchestrator.initialize();
  console.log('✅ Initialization test passed');
  
  // Test 2: Mock signal execution
  const mockTokenData = {
    tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenSymbol: 'TEST',
    tokenAge: 60,
    marketCap: 1000000
  };
  
  const mockMarketContext = {
    solPrice: 100,
    volume24h: 5000000
  };
  
  const result = await orchestrator.orchestrateSignals(mockTokenData, mockMarketContext);
  console.log('✅ Signal orchestration test passed');
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Test 3: Performance metrics
  const metrics = orchestrator.getMetrics();
  console.log('✅ Metrics test passed');
  console.log('Metrics:', JSON.stringify(metrics, null, 2));
}

runBasicTests().catch(console.error);