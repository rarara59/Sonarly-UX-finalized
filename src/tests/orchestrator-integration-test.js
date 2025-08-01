// src/tests/orchestrator-integration-test.js
const DataPipeline = require('../scripts-js/data-pipeline');
const SignalOrchestrator = require('../scripts-js/signal-orchestrator');

async function testOrchestratorIntegration() {
  console.log('🎯 Testing Data Pipeline → Signal Orchestrator Integration...');
  
  const pipeline = new DataPipeline();
  const orchestrator = new SignalOrchestrator();
  
  await pipeline.initialize();
  await orchestrator.initialize();
  
  // Test with realistic token data
  const tokenData = {
    tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenSymbol: 'MEME',
    currentPrice: 0.00012,
    volume24h: 450000,
    marketCap: 1200000,
    liquidityUSD: 85000
  };
  
  const marketContext = {
    solPrice: 100,
    volume24h: 1500000,
    volatilityIndex: 25
  };
  
  // Process through pipeline
  const processedData = await pipeline.processTokenData(tokenData.tokenAddress);
  
  // Process through orchestrator
  const result = await orchestrator.orchestrateSignals(processedData, marketContext);
  
  console.log('✅ Integration Results:');
  console.log(`   Renaissance Score: ${result.renaissanceScore}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Recommendation: ${result.recommendation.action}`);
  console.log(`   Valid Signals: ${result.validSignals}/${result.totalSignals}`);
  
  return result;
}

testOrchestratorIntegration().catch(console.error);